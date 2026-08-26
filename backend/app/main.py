from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import json
from fastapi.middleware.cors import CORSMiddleware
from app.api.routers import auth, users, stream
from app.core.config import settings
from app.db.firebase import init_firebase
from app.ws_manager import manager
import logging

try:
    # Initialize Firebase Admin 
    init_firebase()
except Exception as e:
    print(f"Firebase Init Error: {e}")

app = FastAPI(title=settings.PROJECT_NAME)

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

@app.get("/")
def read_root():
    return {"message": "Welcome to AssistanCCTV AI Backend"}

@app.get("/healthz")
def healthcheck() -> dict:
    return {"ok": True}

@app.websocket("/ws/detections")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
