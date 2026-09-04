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
            
            if payload.get("type") == "frame":
                cam_id = payload.get("camera_id", "Unknown Camera")
                base64_str = payload.get("image", "")
                
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
                
                # Check for rate limit on alerts (max 1 alert every 5 seconds)
                current_time = time.time()
                if current_time - last_alert_time < 5.0:
                    continue
                
                alert_trigger = None
                
                # 1. YOLO Detection
                results = model(frame, verbose=False)
                for r in results:
                    boxes = r.boxes
                    for box in boxes:
                        cls = int(box.cls[0])
                        conf = float(box.conf[0])
                        if cls in TARGET_CLASSES and conf > 0.4:
                            alert_trigger = {
                                "type": TARGET_CLASSES[cls],
                                "severity": "CRITICAL" if cls == 0 or cls == 4 else "WARNING",
                                "reason": f"AI detected {TARGET_CLASSES[cls]} with {int(conf*100)}% confidence"
                            }
                            break
                    if alert_trigger:
                        break
                
                # 2. Motion Detection (Fallback)
                if not alert_trigger:
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
                    await manager.broadcast(alert_payload)
                    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("Client disconnected")
    except Exception as e:
        manager.disconnect(websocket)
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
