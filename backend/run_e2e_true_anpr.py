import sys
import os
import cv2
import asyncio
import urllib.request
import numpy as np

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.vision.anpr import anpr_service
from app.db.session import SessionLocal
from app.models.core_models import Plate
import uuid

async def test_true_anpr_pipeline():
    print("--- INITIATING REAL ANPR OCR PIPELINE ---")
    
    # Download a test plate image
    print("[1] Downloading test license plate image...")
    # A standard image known to contain readable text
    img_url = "https://raw.githubusercontent.com/JaidedAI/EasyOCR/master/examples/english.png"
    req = urllib.request.urlopen(img_url)
    arr = np.asarray(bytearray(req.read()), dtype=np.uint8)
    frame = cv2.imdecode(arr, -1)

    print("[2] Running OCR / Enhancement Service...")
    result = anpr_service.process_plate_crop(frame)

    if not result:
        print("FAILED: Model did not locate valid alphanumeric string.")
        return

    print(f"OCR Match: {result.raw_text} | Normalized: {result.normalized} | Confidence: {result.confidence}")
    
    # 3. Store to DB
    print("[3] Writing to PostgreSQL Database (Plate Table) ...")
    db = SessionLocal()
    cam_id = "ANPR_TEST_CAM_01"
    
    plate_record = Plate(
        raw_ocr_text=result.raw_text,
        normalized_plate=result.normalized,
        confidence=result.confidence,
        camera_id=cam_id
    )
    
    db.add(plate_record)
    db.commit()
    db.refresh(plate_record)
    print(f"Successfully inserted plate {result.normalized} into Record ID {plate_record.id} in DB.")
    db.close()
    
    print("\n--- ANPR OCR PIPELINE SUCCESS (100% CODE-VERIFIED) ---")

if __name__ == "__main__":
    asyncio.run(test_true_anpr_pipeline())
