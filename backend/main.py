import base64
import cv2
import numpy as np
import json
import asyncio
import time
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLO model (will download yolov8n.pt on first run)
model = YOLO('yolov8n.pt') 

# Define classes for alerting
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
    # Drones are not in COCO, so we map airplane/kite as potential drones
    4: "Drone / UAV (Airplane)",
    33: "Drone / UAV (Kite)",
    # Vehicles for ANPR / General tracking
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

@app.websocket("/ws/detections")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    
    # Initialize background subtractor for generic motion detection
    back_sub = cv2.createBackgroundSubtractorMOG2(history=50, varThreshold=50, detectShadows=False)
    
    last_alert_time = 0

    try:
        while True:
            # Receive frame as Base64 JSON
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
                
                # Strip header if present
                if "," in base64_str:
                    base64_str = base64_str.split(",")[1]
                    
                # Decode image
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
                
                # 1. Pre-processing based on scenario
                if cam_scenario == "night":
                    # Simulate Night Vision Enhancement (Gamma Correction)
                    invGamma = 1.0 / 0.4 # Brighten image
                    table = np.array([((i / 255.0) ** invGamma) * 255 for i in np.arange(0, 256)]).astype("uint8")
                    frame = cv2.LUT(frame, table)
                
                # 2. Filter classes based on scenario
                current_targets = TARGET_CLASSES.copy()
                if cam_scenario == "intrusion":
                    current_targets = {0: "Human"}
                elif cam_scenario in ["vehicle", "anpr"]:
                    current_targets = {2: "Vehicle (Car)", 3: "Vehicle (Motorcycle)", 5: "Vehicle (Bus)", 7: "Vehicle (Truck)"}
                elif cam_scenario == "suspicious":
                    current_targets = {0: "Human", 4: "Drone", 33: "Drone"}

                # Check for rate limit on alerts (max 1 alert every 5 seconds)
                current_time = time.time()
                if current_time - last_alert_time < 5.0:
                    continue
                
                alert_trigger = None
                face_trigger = None
                mode = camera_scenarios.get(cam_id, "normal")
                
                # Check frame skip for NORMAL mode (process every 5th frame)
                run_yolo = True
                
                # 1. YOLO Detection
                if run_yolo:
                    results = model(frame, verbose=False)
                    for r in results:
                        boxes = r.boxes
                        for box in boxes:
                            cls = int(box.cls[0])
                            conf = float(box.conf[0])
                            
                            # Apply Mode Filters
                            if mode == "intrusion" and cls != 0:
                                continue # Only Humans for intrusion
                            if mode in ["anpr", "vehicle"] and cls not in [2, 3, 5, 7]:
                                continue # Only Vehicles for ANPR/Vehicle Tracking
                                
                            if cls in TARGET_CLASSES and conf > 0.4:
                                is_human = (cls == 0)

                            # Standard Alert
                            alert_trigger = {
                                "type": current_targets[cls] if not force_watchlist else "WATCHLIST MATCH: Dawood Ibrahim",
                                "severity": "CRITICAL" if (is_human or cls == 4) else "WARNING",
                                "reason": f"AI detected {current_targets[cls]} with {int(conf*100)}% confidence" if not force_watchlist else "Biometric match found in Interpol Database"
                            }
                            # Face specific for Humans
                            if is_human:
                                face_trigger = {
                                    "id": f"FC-{int(current_time)}",
                                    "cameraId": cam_id,
                                    "identity": "Dawood Ibrahim (WANTED)" if force_watchlist else "Unknown Human",
                                    "confidence": int(conf * 100),
                                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
                                    "database": "Interpol" if force_watchlist else "Live Capture",
                                    "status": "FLAGGED" if force_watchlist else "UNKNOWN",
                                    "direction": "Inbound",
                                    "image": f"data:image/jpeg;base64,{base64_str}"
                                }
                                
                                # Launch Re-ID Simulation Background Task
                                if force_reid:
                                    async def simulate_reid(tracked_img):
                                        await asyncio.sleep(5)
                                        # Camera 2
                                        reid_face = face_trigger.copy()
                                        reid_face["id"] = f"FC-REID-{int(time.time())}"
                                        reid_face["cameraId"] = "CAM-02"
                                        reid_face["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())
                                        reid_face["direction"] = "Internal"
                                        await manager.broadcast({"type": "NEW_FACE", "data": reid_face})
                                        
                                        await asyncio.sleep(8)
                                        # Camera 3
                                        reid_face["id"] = f"FC-REID-{int(time.time())}"
                                        reid_face["cameraId"] = "CAM-03"
                                        reid_face["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())
                                        await manager.broadcast({"type": "NEW_FACE", "data": reid_face})
                                    
                                    asyncio.create_task(simulate_reid(base64_str))

                    if alert_trigger:
                        break
                
                # 2. Motion Detection (Fallback) - Only for NORMAL or SUSPICIOUS modes
                if not alert_trigger and mode in ["normal", "suspicious"]:
                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                    gray = cv2.GaussianBlur(gray, (21, 21), 0)
                    fg_mask = back_sub.apply(gray)
                    
                    # Threshold and count moving pixels
                    _, thresh = cv2.threshold(fg_mask, 25, 255, cv2.THRESH_BINARY)
                    moving_pixels = cv2.countNonZero(thresh)
                    
                    # If more than 5% of pixels are moving, trigger generic motion alert
                    total_pixels = frame.shape[0] * frame.shape[1]
                    if moving_pixels > 0.05 * total_pixels:
                        alert_trigger = {
                            "type": "Thermal Anomaly",
                            "severity": "WARNING",
                            "reason": "High-intensity thermal signature / motion detected"
                        }
                
                # Send alert back if triggered
                if alert_trigger:
                    last_alert_time = current_time
                    alert_payload = {
                        "type": "intrusion",
                        "id": f"ALM-{int(current_time)}",
                        "title": f"{alert_trigger['type']} Intrusion",
                        "reason": alert_trigger["reason"],
                        "severity": alert_trigger["severity"],
                        "cameraId": cam_id,
                        "location": "Live Hardware Feed",
                        "image": f"data:image/jpeg;base64,{base64_str}"
                    }
                    print("Sending Alert:", alert_payload["title"])
                    await manager.broadcast({"type": "NEW_ALERT", "data": alert_payload})
                
                # Send face if human triggered
                if face_trigger:
                    await manager.broadcast({"type": "NEW_FACE", "data": face_trigger})
                    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("Client disconnected")
    except Exception as e:
        manager.disconnect(websocket)
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
