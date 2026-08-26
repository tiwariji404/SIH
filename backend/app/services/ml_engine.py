import cv2
import easyocr
import numpy as np
import os
from ultralytics import YOLO

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
                
                # Check for vehicle or license plate
                if conf > 0.4 and label in ['car', 'motorcycle', 'bus', 'truck']:
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
                                else:
                                    cv2.putText(processed_frame, f"{label} {conf:.2f}", (int(x1), int(y1) - 10), 
                                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                                                
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
                                            
    return processed_frame, alerts
