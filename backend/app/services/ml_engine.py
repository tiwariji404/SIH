# import easyocr
from ultralytics import YOLO
import cv2
import base64

# Initialize YOLO model (will download yolov8n.pt on first run)
try:
    yolo_model = YOLO("yolov8n.pt") 
    # Initialize EasyOCR
    # reader = easyocr.Reader(['en'], gpu=False) # disabled for fast setup without gpu
except Exception as e:
    print(f"Error loading models: {e}")
    yolo_model = None

def process_frame(frame):
    alerts = []
    processed_frame = frame.copy()
    
    if yolo_model:
        results = yolo_model(processed_frame, stream=True, verbose=False)
        for result in results:
            boxes = result.boxes
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0]
                conf = box.conf[0]
                cls = int(box.cls[0])
                label = yolo_model.names[cls]
                
                if conf > 0.5 and label in ['car', 'motorcycle', 'bus', 'truck']:
                    cv2.rectangle(processed_frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
                    cv2.putText(processed_frame, f"{label} {conf:.2f}", (int(x1), int(y1) - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                    alerts.append(f"Vehicle detected: {label}")
                    
                    # EasyOCR for number plate (mock placement, in reality, use a license plate specific model first)
                    # plate_crop = processed_frame[int(y1):int(y2), int(x1):int(x2)]
                    # text = reader.readtext(plate_crop)
                    pass

    return processed_frame, alerts
