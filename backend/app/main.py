import logging
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.routers import auth, users, stream, cameras, alerts, zones, analytics
from app.core.config import settings
from app.ws_manager import manager
from app.db.session import engine, Base, SessionLocal
from app.core.redis_client import redis_client
from app.core.storage import storage_client
from app.services.anpr_pipeline import DATA_DIR, decode_base64_frame, process_anpr_frame

# Define structured logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Start connections
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting IBVAP Backend")
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as exc:
        logger.warning("Database auto-initialization skipped: %s", exc)
    redis_client.connect()
    storage_client.connect()
    yield
    # Shutdown
    logger.info("Shutting down IBVAP Backend")

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(stream.router, prefix=f"{settings.API_V1_STR}/stream", tags=["stream"])
app.include_router(cameras.router, prefix=f"{settings.API_V1_STR}/cameras", tags=["cameras"])
app.include_router(alerts.router, prefix=f"{settings.API_V1_STR}/alerts", tags=["alerts"])
app.include_router(zones.router, prefix=f"{settings.API_V1_STR}/zones", tags=["zones"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["analytics"])
app.mount("/media", StaticFiles(directory=str(DATA_DIR)), name="media")

@app.get("/")
def read_root():
    return {"message": "Welcome to IBVAP AI Backend"}

@app.get("/health")
def healthcheck():
    return {"status": "ok", "service": "ibvap-backend"}

@app.get("/liveness")
def liveness():
    return {"status": "alive"}

@app.get("/readiness")
def readiness():
    # Will check db/redis/minio later, stub for now
    return {"status": "ready"}

@app.websocket("/ws/detections")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "Invalid JSON payload"})
                continue

            if payload.get("type") != "frame":
                continue

            camera_id = payload.get("camera_id") or payload.get("cameraId") or "ANPR-LIVE"
            direction = payload.get("direction") or "Live"
            image_data = payload.get("image") or payload.get("frame") or ""
            if not image_data:
                await websocket.send_json({"type": "error", "message": "Missing frame image"})
                continue

            try:
                frame = decode_base64_frame(image_data)
            except ValueError as exc:
                await websocket.send_json({"type": "error", "message": str(exc)})
                continue

            with SessionLocal() as db:
                try:
                    vehicles, alerts = process_anpr_frame(
                        db,
                        frame,
                        camera_id=camera_id,
                        direction=direction,
                        source="live",
                        dedupe_seconds=10,
                    )
                except Exception as exc:
                    db.rollback()
                    logger.exception("Live ANPR processing failed")
                    await websocket.send_json({"type": "error", "message": f"Live ANPR processing failed: {exc}"})
                    continue

            for vehicle in vehicles:
                await manager.broadcast({"type": "vehicle", "vehicle": vehicle})
            for alert in alerts:
                await manager.broadcast({"type": "NEW_ALERT", "data": alert})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
