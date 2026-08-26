from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.core_models import (
    VehicleRecord as DB_Vehicle, 
    FaceRecord as DB_Face, 
    Detection as DB_Detection,
    TrackRecord as DB_Track,
    AuditLog as DB_AuditLog
)
from app.schemas.core_schemas import (
    VehicleRecord, VehicleRecordCreate,
    FaceRecord, FaceRecordCreate,
    Detection, DetectionCreate,
    TrackRecord, TrackRecordCreate,
    AuditLog, AuditLogCreate
)

router = APIRouter()

# Vehicles (ANPR)
@router.get("/vehicles", response_model=List[VehicleRecord])
def get_vehicles(db: Session = Depends(get_db)):
    return db.query(DB_Vehicle).order_by(DB_Vehicle.timestamp.desc()).all()

@router.post("/vehicles", response_model=VehicleRecord)
def create_vehicle(vehicle: VehicleRecordCreate, db: Session = Depends(get_db)):
    db_item = DB_Vehicle(**vehicle.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

# Faces (Facial Recognition)
@router.get("/faces", response_model=List[FaceRecord])
def get_faces(db: Session = Depends(get_db)):
    return db.query(DB_Face).order_by(DB_Face.timestamp.desc()).all()

@router.post("/faces", response_model=FaceRecord)
def create_face(face: FaceRecordCreate, db: Session = Depends(get_db)):
    db_item = DB_Face(**face.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

# Detections
@router.get("/detections", response_model=List[Detection])
def get_detections(db: Session = Depends(get_db)):
    return db.query(DB_Detection).order_by(DB_Detection.timestamp.desc()).all()

@router.post("/detections", response_model=Detection)
def create_detection(detection: DetectionCreate, db: Session = Depends(get_db)):
    db_item = DB_Detection(**detection.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

# Tracks (Cross Camera Tracking)
@router.get("/tracks", response_model=List[TrackRecord])
def get_tracks(db: Session = Depends(get_db)):
    return db.query(DB_Track).order_by(DB_Track.lastSeen.desc()).all()

@router.post("/tracks", response_model=TrackRecord)
def create_track(track: TrackRecordCreate, db: Session = Depends(get_db)):
    db_item = db.query(DB_Track).filter(DB_Track.trackingId == track.trackingId).first()
    if db_item:
        raise HTTPException(status_code=400, detail="Track already exists")
    new_item = DB_Track(**track.model_dump())
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

# Audit Logs
@router.get("/audit-logs", response_model=List[AuditLog])
def get_audit_logs(db: Session = Depends(get_db)):
    return db.query(DB_AuditLog).order_by(DB_AuditLog.timestamp.desc()).all()

@router.post("/audit-logs", response_model=AuditLog)
def create_audit_log(log: AuditLogCreate, db: Session = Depends(get_db)):
    db_item = DB_AuditLog(**log.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item
