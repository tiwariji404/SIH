import base64
import cv2
import numpy as np
import json
import asyncio
import time
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Form, File, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from sqlalchemy import Column, String, Integer, Float, Boolean, JSON
from app.db.session import SessionLocal, Base, engine
from app.models.core_models import Camera, Alert, VehicleRecord, EventItem, AuditLog, TrackRecord, FaceRecord, WatchlistRecord, Zone

# --- Additional Models for IBVAP ---
class FenceZone(Base):
    __tablename__ = "fences"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, default="Virtual Fence")
    cameras = Column(String)  # JSON string
    points = Column(String)  # JSON string
    isActive = Column(Boolean, default=True)

class BlacklistedPlate(Base):
    __tablename__ = "blacklisted_plates"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    plate_number = Column(String, unique=True, index=True)
    description = Column(String)
    info = Column(String)

class BlacklistedFace(Base):
    __tablename__ = "blacklisted_faces"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String)
    face_encoding = Column(String) # JSON string of vector

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO('yolov8n.pt') 

TARGET_CLASSES = {
    0: "Human",
    15: "Animal (Cat)",
    16: "Animal (Dog)",
    17: "Animal (Horse)",
    18: "Animal (Sheep)",
    19: "Animal (Cow)",
    20: "Animal (Elephant)",
    21: "Animal (Bear)",
    22: "Animal (Zebra)",
    23: "Animal (Giraffe)",
    4: "Drone / UAV (Airplane)",
    33: "Drone / UAV (Kite)",
    2: "Vehicle (Car)",
    3: "Vehicle (Motorcycle)",
    5: "Vehicle (Bus)",
    7: "Vehicle (Truck)"
}

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()
camera_scenarios = {}
frame_counters = {}

# --- REST APIs ---
def get_current_user():
    return {"id": "usr-1", "role": "admin"}

@app.get("/api/v1/cameras")
def get_cameras():
    db = SessionLocal()
    cameras = db.query(Camera).all()
    db.close()
    return [{
        "id": c.id, "name": c.name, "location": c.location, "status": c.status, 
        "fps": c.fps, "scenario": c.scenario, "recording": c.recording, 
        "latency": c.latency, "storage": c.storage, "health": c.health,
        "lastHeartbeat": c.lastHeartbeat, "signalQuality": c.signalQuality, 
        "detectionCount": c.detectionCount, "coords": c.coords, "mapCoord": c.mapCoord
    } for c in cameras]

@app.get("/api/v1/alerts")
def get_alerts():
    db = SessionLocal()
    alerts = db.query(Alert).order_by(Alert.created_at_dt.desc()).limit(100).all()
    db.close()
    return [{"id": a.id, "title": a.title, "severity": a.severity, "reason": a.reason, "cameraId": a.cameraId, "timestamp": a.createdAt, "status": a.status, "zone": a.zone} for a in alerts]

@app.get("/api/v1/alerts/events")
def get_events():
    db = SessionLocal()
    events = db.query(EventItem).order_by(EventItem.event_timestamp.desc()).limit(100).all()
    db.close()
    return [{"id": e.id, "eventType": e.eventType, "severity": e.severity, "description": e.description, "cameraId": e.cameraId, "timestamp": e.timestamp, "status": e.status} for e in events]

@app.get("/api/v1/zones")
def get_zones():
    db = SessionLocal()
    zones = db.query(Zone).all()
    db.close()
    return [{"id": z.id, "name": z.name, "zoneType": z.zoneType, "severity": z.severity, "cameraId": z.cameraId} for z in zones]

@app.get("/api/v1/analytics/vehicles")
def get_vehicles():
    db = SessionLocal()
    vehicles = db.query(VehicleRecord).order_by(VehicleRecord.timestamp.desc()).limit(100).all()
    db.close()
    return [{"id": v.id, "plateNumber": v.plateNumber, "vehicleType": v.vehicleType, "cameraId": v.cameraId, "confidence": v.confidence, "timestamp": v.timestamp, "status": v.status, "direction": v.direction} for v in vehicles]

@app.get("/api/v1/analytics/auditLogs")
def get_audit_logs():
    db = SessionLocal()
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()
    db.close()
    return [{"id": l.id, "user": l.user, "action": l.action, "timestamp": l.timestamp, "details": l.details, "result": l.result, "ip": l.ip} for l in logs]

@app.get("/api/v1/analytics/tracks")
def get_tracks():
    db = SessionLocal()
    tracks = db.query(TrackRecord).limit(100).all()
    db.close()
    return [{"trackingId": t.trackingId, "objectType": t.objectType, "cameraId": t.cameraId, "status": t.status, "firstSeen": t.firstSeen, "lastSeen": t.lastSeen} for t in tracks]

@app.get("/api/v1/analytics/faces")
def get_faces():
    db = SessionLocal()
    faces = db.query(FaceRecord).order_by(FaceRecord.timestamp.desc()).limit(100).all()
    db.close()
    return [{"id": f.id, "identity": f.identity, "cameraId": f.cameraId, "confidence": f.confidence, "timestamp": f.timestamp, "status": f.status} for f in faces]

@app.get("/api/v1/analytics/watchlist")
def get_watchlist():
    db = SessionLocal()
    plates = db.query(BlacklistedPlate).all()
    db.close()
    return [{"plate_number": p.plate_number, "description": p.description, "info": p.info} for p in plates]

@app.get("/api/v1/fences")
def get_fences():
    db = SessionLocal()
    fences = db.query(FenceZone).all()
    db.close()
    result = []
    for f in fences:
        try:
            cameras = json.loads(f.cameras) if f.cameras else []
            points = json.loads(f.points) if f.points else []
        except:
            cameras = []
            points = []
        result.append({"id": f.id, "name": f.name, "cameras": cameras, "points": points, "isActive": f.isActive})
    return result

from pydantic import BaseModel
from typing import List, Any
class FenceCreateRequest(BaseModel):
    id: str
    name: str
    cameras: List[str]
    points: List[Any]
    active: bool = True

@app.post("/api/v1/fences")
def create_fence(fence: FenceCreateRequest):
    db = SessionLocal()
    f = FenceZone(
        id=fence.id, 
        name=fence.name, 
        cameras=json.dumps(fence.cameras), 
        points=json.dumps(fence.points), 
        isActive=fence.active
    )
    db.add(f)
    db.commit()
    db.close()
    return {"status": "success"}

@app.delete("/api/v1/fences/{fence_id}")
def delete_fence(fence_id: str):
    db = SessionLocal()
    f = db.query(FenceZone).filter(FenceZone.id == fence_id).first()
    if f:
        db.delete(f)
        db.commit()
    db.close()
    return {"status": "success"}

@app.post("/api/v1/analytics/anpr/upload")
@app.post("/api/v1/analytics/watchlist/upload")
async def add_blacklisted_plate(
    plate_number: str = Form(...), 
    description: str = Form(""),
    info: str = Form(""),
    file: UploadFile = File(None)
):
    db = SessionLocal()
    plate = BlacklistedPlate(plate_number=plate_number, description=description, info=info)
    db.add(plate)
    db.commit()
    db.close()

    image_b64 = None
    if file:
        contents = await file.read()
        image_b64 = base64.b64encode(contents).decode('utf-8')

    alert_payload = {
        "type": "watchlist_match",
        "id": f"ALM-{int(time.time())}",
        "title": "Watchlist Vehicle Uploaded & Flagged",
        "reason": f"Plate {plate_number} was flagged during manual upload",
        "severity": "CRITICAL",
        "cameraId": "MANUAL-UPLOAD",
        "location": "HQ",
        "image": f"data:image/jpeg;base64,{image_b64}" if image_b64 else None
    }
    asyncio.create_task(manager.broadcast({"type": "NEW_ALERT", "data": alert_payload}))
    
    return {
        "success": True, 
        "captures": [{
            "id": f"V-{int(time.time())}", 
            "plateNumber": plate_number, 
            "status": "WATCHLIST", 
            "confidence": 99, 
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())
        }]
    }

# --- Tracking logic state ---
tracked_faces = {}  # {track_id: last_logged_time}
FACE_LOG_COOLDOWN = 300  # 5 minutes

@app.websocket("/ws/detections")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    back_sub = cv2.createBackgroundSubtractorMOG2(history=50, varThreshold=50, detectShadows=False)
    last_alert_time = 0

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            if payload.get("type") == "set_scenario":
                cam_id = payload.get("camera_id")
                scenario = payload.get("scenario")
                if cam_id and scenario:
                    camera_scenarios[cam_id] = scenario
                continue

            if payload.get("type") == "frame":
                cam_id = payload.get("camera_id", "Unknown Camera")
                base64_str = payload.get("image", "")
                force_watchlist = payload.get("force_watchlist", False)
                force_reid = payload.get("force_reid", False)
                
                if "," in base64_str:
                    base64_str = base64_str.split(",")[1]
                    
                try:
                    img_data = base64.b64decode(base64_str)
                    np_arr = np.frombuffer(img_data, np.uint8)
                    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                except Exception as e:
                    print("Error decoding image:", e)
                    continue
                
                if frame is None:
                    continue
                
                cam_scenario = camera_scenarios.get(cam_id, "normal")
                current_time = time.time()
                
                # YOLO Detection
                results = model(frame, verbose=False)
                alert_trigger = None
                face_trigger = None
                
                for r in results:
                    boxes = r.boxes
                    for box in boxes:
                        cls = int(box.cls[0])
                        conf = float(box.conf[0])
                        
                        if conf > 0.4:
                            is_human = (cls == 0)
                            
                            # Log faces silently without global alarm, unless it's a specific scenario
                            if is_human and cam_scenario in ["faces", "normal", "intrusion"]:
                                # Simple simulated tracking ID logic
                                # For demo, let's assume we uniquely track a person in the frame.
                                # Since we don't have ByteTrack, we just use a static ID or random one if we want to simulate new people.
                                # To allow Re-ID simulation, we use a single track_id per camera for the demo
                                track_id = f"Person-Cam-{cam_id}"
                                
                                # Duplicate logging filter (Re-ID Check to avoid re-computing)
                                if track_id not in tracked_faces or (current_time - tracked_faces[track_id] > FACE_LOG_COOLDOWN):
                                    tracked_faces[track_id] = current_time
                                    
                                    # Simulate Database Check
                                    status = "UNKNOWN"
                                    identity = "Unknown Human"
                                    db_source = "Live Capture"
                                    
                                    if force_watchlist:
                                        status = "FLAGGED"
                                        identity = "Watchlist Target A"
                                        db_source = "Watchlist DB"
                                        
                                        # Trigger Watchlist Alarm
                                        alert_trigger = {
                                            "type": "Watchlist",
                                            "severity": "CRITICAL",
                                            "reason": f"AI detected Watchlist Target with {int(conf*100)}% confidence."
                                        }
                                        
                                    elif force_reid:
                                        status = "AUTHORIZED"
                                        identity = "Employee John Doe"
                                        db_source = "Employee DB"
                                        
                                    face_trigger = {
                                        "id": f"FC-{int(current_time)}",
                                        "cameraId": cam_id,
                                        "identity": identity,
                                        "confidence": int(conf * 100),
                                        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
                                        "database": db_source,
                                        "status": status,
                                        "direction": "Inbound",
                                        "image": f"data:image/jpeg;base64,{base64_str}"
                                    }
                                    
                                    # Save to Database
                                    try:
                                        db = SessionLocal()
                                        new_face_record = FaceRecord(
                                            id=face_trigger["id"],
                                            cameraId=face_trigger["cameraId"],
                                            identity=face_trigger["identity"],
                                            confidence=face_trigger["confidence"],
                                            timestamp=face_trigger["timestamp"],
                                            database=face_trigger["database"],
                                            status=face_trigger["status"]
                                        )
                                        db.add(new_face_record)
                                        db.commit()
                                        db.close()
                                    except Exception as e:
                                        print(f"Error saving to DB: {e}")
                            
                            # Intrusion Alert logic (Generates Global Warning ONLY for fences)
                            if cam_scenario == "intrusion" and is_human and not alert_trigger:
                                alert_trigger = {
                                    "type": "Human",
                                    "severity": "CRITICAL",
                                    "reason": f"AI detected Human with {int(conf*100)}% confidence inside Fenced Area"
                                }
                                break

                # Send silent face log
                if face_trigger:
                    await manager.broadcast({"type": "NEW_FACE", "data": face_trigger})
                    print("Logged face without alarm.")
                
                # Send critical alert (only if intrusion or watchlist)
                if alert_trigger and (current_time - last_alert_time > 5.0):
                    last_alert_time = current_time
                    alert_payload = {
                        "type": "intrusion" if alert_trigger["type"] == "Human" else "watchlist",
                        "id": f"ALM-{int(current_time)}",
                        "title": f"{alert_trigger['type']} Detection",
                        "reason": alert_trigger["reason"],
                        "severity": alert_trigger["severity"],
                        "cameraId": cam_id,
                        "location": "Live Hardware Feed",
                        "image": f"data:image/jpeg;base64,{base64_str}"
                    }
                    print("Sending Alert:", alert_payload["title"])
                    await manager.broadcast({"type": "NEW_ALERT", "data": alert_payload})
                    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("Client disconnected")
    except Exception as e:
        manager.disconnect(websocket)
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
