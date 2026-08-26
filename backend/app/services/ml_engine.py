import cv2
import easyocr
import numpy as np
import os
from ultralytics import YOLO
import threading
import asyncio
import random
from datetime import datetime
from shapely.geometry import Polygon, Point
from .firebase_service import upload_frame_to_storage, save_alert_to_firestore
from ..ws_manager import manager

# Default Virtual Fence Polygon (Scaled to typical 640x480 frame for now, can be dynamic)
VIRTUAL_FENCE_COORDS = [(100, 200), (500, 200), (550, 400), (50, 400)]
fence_polygon = Polygon(VIRTUAL_FENCE_COORDS)
pts = np.array(VIRTUAL_FENCE_COORDS, np.int32)
pts = pts.reshape((-1, 1, 2))

# Initialize YOLO model for vehicles/plates (yolov8n.pt)
try:
    yolo_model = YOLO(os.getenv("MODEL_PATH", "yolov8n.pt"))
except Exception as e:
    print(f"Error loading YOLO model: {e}")
    yolo_model = None

# Initialize EasyOCR
try:
    reader = easyocr.Reader(['en'], gpu=False)  # gpu=True in prod
except Exception as e:
    print(f"Error loading EasyOCR: {e}")
    reader = None

# Initialize MOG2
fgbg = cv2.createBackgroundSubtractorMOG2(history=500, varThreshold=50, detectShadows=True)

def send_ws_vehicle(label, conf, text, cam_id="BOP-04"):
    try:
        msg = {
            "type": "vehicle",
            "vehicle": {
                "id": f"V-{int(datetime.now().timestamp()*1000)}",
                "plateNumber": text if text else f"UNKNOWN-{random.randint(100,999)}",
                "vehicleType": label.upper(),
                "timestamp": datetime.now().isoformat(),
                "cameraId": cam_id,
                "confidence": int(conf * 100),
                "direction": random.choice(["NorthBound", "SouthBound", "EastBound", "WestBound"]),
                "status": "WATCHLIST" if (text and "DL" in text.upper()) else ("AUTHORIZED" if text else "UNKNOWN")
            }
        }
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(manager.broadcast(msg))
        loop.close()
    except Exception as e:
        print(f"WS error: {e}")


def process_frame(frame):
    alerts = []
    processed_frame = frame.copy()
    
    # 1. Apply MOG2
    fgmask = fgbg.apply(frame)
    
    # Highlight movement using contours on MOG2 mask
    contours, _ = cv2.findContours(fgmask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for c in contours:
        if cv2.contourArea(c) > 500:
            x, y, w, h = cv2.boundingRect(c)
            # Draw subtle blue rectangle for motion
            cv2.rectangle(processed_frame, (x, y), (x+w, y+h), (255, 0, 0), 1)

    # 2. YOLOv8 Object & Plate Detection
    if yolo_model:
        results = yolo_model(frame, stream=True, verbose=False)
        for result in results:
            boxes = result.boxes
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                conf = box.conf[0].cpu().numpy()
                cls = int(box.cls[0].cpu().numpy())
                label = yolo_model.names[cls]
                
                # Check for person crossing the virtual fence
                if conf > 0.4 and label == 'person':
                    center_x = (x1 + x2) / 2
                    center_y = (y1 + y2) / 2
                    person_point = Point(center_x, center_y)
                    
                    if fence_polygon.contains(person_point):
                        # Intrusion Detected!
                        cv2.rectangle(processed_frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 0, 255), 2)
                        cv2.putText(processed_frame, "INTRUSION!", (int(x1), int(y1) - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                        alerts.append(f"Intrusion Alert: Person detected in restricted zone!")
                        
                        # Trigger asynchronous upload
                        def upload_task(frame_copy):
                            try:
                                _, buffer = cv2.imencode('.jpg', frame_copy)
                                frame_bytes = buffer.tobytes()
                                mock_url = upload_frame_to_storage(frame_bytes, "CAM-01")
                                save_alert_to_firestore("CAM-01", "INTRUSION", {"confidence": float(conf)}, mock_url)
                            except Exception as e:
                                print(f"Upload failed: {e}")
                        
                        threading.Thread(target=upload_task, args=(frame.copy(),), daemon=True).start()
                    else:
                        # Person outside fence
                        cv2.rectangle(processed_frame, (int(x1), int(y1)), (int(x2), int(y2)), (255, 165, 0), 2)
                        cv2.putText(processed_frame, "Person", (int(x1), int(y1) - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 165, 0), 2)

                # Check for vehicle or license plate
                elif conf > 0.4 and label in ['car', 'motorcycle', 'bus', 'truck']:
                    cv2.rectangle(processed_frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
                    
                    # 3. Text Recognition using EasyOCR on the bottom half of the vehicle (mock plate area)
                    if reader:
                        h_box = y2 - y1
                        w_box = x2 - x1
                        if h_box > 40 and w_box > 40:
                            # Heuristic: license plate is usually in the bottom third
                            plate_y1 = int(y1 + (h_box * 0.6))
                            plate_y2 = int(y2)
                            plate_crop = frame[plate_y1:plate_y2, int(x1):int(x2)]
                            
                            if plate_crop.size > 0:
                                ocr_results = reader.readtext(plate_crop)
                                plate_text = []
                                for (bbox, text, ocr_conf) in ocr_results:
                                    if ocr_conf > 0.5:
                                        plate_text.append(text)
                                if plate_text:
                                    detected_text = " ".join(plate_text)
                                    alerts.append(f"Plate/Text: {detected_text} (Veh: {label})")
                                    cv2.putText(processed_frame, f"PLATE: {detected_text}", (int(x1), int(y1) - 10), 
                                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                                    threading.Thread(target=send_ws_vehicle, args=(label, conf, detected_text), daemon=True).start()
                                else:
                                    cv2.putText(processed_frame, f"{label} {conf:.2f}", (int(x1), int(y1) - 10), 
                                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                                    threading.Thread(target=send_ws_vehicle, args=(label, conf, ""), daemon=True).start()
                    else:
                        threading.Thread(target=send_ws_vehicle, args=(label, conf, ""), daemon=True).start()
                                                
                # If there's an explicit plate class in the custom yolo model   
                elif conf > 0.4 and label in ['license_plate', 'plate']:
                    cv2.rectangle(processed_frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 255), 2)
                    if reader:
                        plate_crop = frame[int(y1):int(y2), int(x1):int(x2)]
                        if plate_crop.size > 0:
                            ocr_results = reader.readtext(plate_crop)
                            plate_text = " ".join([text for (bbox, text, ocr_conf) in ocr_results if ocr_conf > 0.5])
                            if plate_text:
                                alerts.append(f"Plate read: {plate_text}")
                                cv2.putText(processed_frame, plate_text, (int(x1), int(y1) - 10), 
                                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                                threading.Thread(target=send_ws_vehicle, args=("VEHICLE", conf, plate_text), daemon=True).start()
                                            
    # Draw Virtual Fence
    is_intrusion = any("Intrusion" in a for a in alerts)
    fence_color = (0, 0, 255) if is_intrusion else (0, 255, 0)
    
    # Draw semi-transparent polygon
    overlay = processed_frame.copy()
    cv2.fillPoly(overlay, [pts], fence_color)
    cv2.addWeighted(overlay, 0.2, processed_frame, 0.8, 0, processed_frame)
    cv2.polylines(processed_frame, [pts], True, fence_color, 2)
    
    return processed_frame, alerts
