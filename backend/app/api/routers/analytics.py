from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.core_models import (
    VehicleRecord as DB_Vehicle, 
    FaceRecord as DB_Face, 
    Detection as DB_Detection,
    TrackRecord as DB_Track,
    AuditLog as DB_AuditLog,
    Incident as DB_Incident,
    Evidence as DB_Evidence
)
from app.schemas.core_schemas import (
    VehicleRecord, VehicleRecordCreate,
    FaceRecord, FaceRecordCreate,
    Detection, DetectionCreate,
    TrackRecord, TrackRecordCreate,
    AuditLog, AuditLogCreate,
    Incident, IncidentCreate,
    Evidence, EvidenceCreate
)
from app.models.user import User
from app.api.deps import get_current_user, get_current_active_supervisor

router = APIRouter()

# Vehicles (ANPR)
@router.get("/vehicles", response_model=List[VehicleRecord])
def get_vehicles(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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
def get_faces(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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
def get_detections(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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
def get_tracks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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

# Incidents
@router.get("/incidents", response_model=List[Incident])
def get_incidents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(DB_Incident).order_by(DB_Incident.created_at.desc()).all()

@router.post("/incidents", response_model=Incident)
def create_incident(incident: IncidentCreate, db: Session = Depends(get_db)):
    db_item = DB_Incident(**incident.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.put("/incidents/{incident_id}/status")
def update_incident_status(incident_id: str, status: str, db: Session = Depends(get_db), supervisor: User = Depends(get_current_active_supervisor)):
    db_incident = db.query(DB_Incident).filter(DB_Incident.id == incident_id).first()
    if not db_incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    db_incident.status = status
    db.commit()
    db.refresh(db_incident)
    return db_incident

from app.services.snapshot_store import evidence_storage
from app.services.ledger import ledger_service

# Evidence
@router.get("/evidence", response_model=List[Evidence])
def get_evidence(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(DB_Evidence).order_by(DB_Evidence.created_at.desc()).all()

@router.get("/evidence/{evidence_id}/verify")
def verify_evidence(evidence_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_item = db.query(DB_Evidence).filter(DB_Evidence.id == evidence_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Evidence not found")
        
    if not db_item.sha256_hash:
        return {"status": "INTEGRITY_FAILURE", "reason": "No hash on record"}
        
    filename = db_item.file_url.split("/")[-1]
    
    # 1. File Hash Check
    file_status = evidence_storage.verify_integrity(filename, db_item.sha256_hash)
    
    # 2. Database vs Ledger Check
    ledger_record = ledger_service.verify_evidence_integrity(db_item.sha256_hash)
    ledger_status = "VERIFIED" if ledger_record else "NOT_FOUND_IN_LEDGER"
    
    if file_status == "VERIFIED" and ledger_status == "VERIFIED":
        final_status = "VERIFIED"
    elif file_status == "VERIFIED":
        final_status = "PARTIAL_VERIFIED_NO_LEDGER"
    else:
        final_status = "COMPROMISED"
        
    if final_status in ["VERIFIED", "PARTIAL_VERIFIED_NO_LEDGER"]:
        db_item.integrity_status = "VERIFIED"
    else:
        db_item.integrity_status = "COMPROMISED"
        
    db.commit()
    return {
        "status": final_status, 
        "file_integrity": file_status, 
        "ledger_integrity": ledger_status,
        "ledger_record": ledger_record
    }

@router.post("/evidence", response_model=Evidence)
def create_evidence(evidence: EvidenceCreate, db: Session = Depends(get_db)):
    db_item = DB_Evidence(**evidence.model_dump())
    
    # Store integrity cryptographically in blockchain ledger
    if db_item.sha256_hash:
        try:
            ledger_service.record_evidence_integrity(db_item.event_id, db_item.sha256_hash)
        except Exception as e:
            # Do not fail API if ledger is unavailable (As per requirements: "must continue functioning if ledger unavailable")
            pass
            
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

# Audit Logs
@router.get("/audit-logs", response_model=List[AuditLog])
def get_audit_logs(db: Session = Depends(get_db), supervisor: User = Depends(get_current_active_supervisor)):
    return db.query(DB_AuditLog).order_by(DB_AuditLog.created_at.desc(), DB_AuditLog.timestamp.desc()).all()

@router.post("/audit-logs", response_model=AuditLog)
def create_audit_log(log: AuditLogCreate, db: Session = Depends(get_db)):
    db_item = DB_AuditLog(**log.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

from sqlalchemy import func, text
from app.models.core_models import Camera as DB_Camera, EventItem as DB_EventItem

# Analytics & Dashboard Stats
@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_cameras = db.query(DB_Camera).count()
    active_cameras = db.query(DB_Camera).filter(DB_Camera.status == "ACTIVE").count()
    
    total_events = db.query(DB_EventItem).count()
    unresolved_events = db.query(DB_EventItem).filter(DB_EventItem.status != "CLOSED").count()
    
    total_incidents = db.query(DB_Incident).count()
    open_incidents = db.query(DB_Incident).filter(DB_Incident.status == "OPEN").count()
    
    return {
        "cameras": {"total": total_cameras, "active": active_cameras},
        "events": {"total": total_events, "unresolved": unresolved_events},
        "incidents": {"total": total_incidents, "open": open_incidents},
    }

# System Health
@router.get("/health")
def get_system_health(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify PostgreSQL DB connection natively
    db_status = "unhealthy"
    try:
        db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception:
        pass

    # Verify MinIO Storage (Using our graceful offline-fallback abstraction, check if MinIO is actually reachable)
    storage_status = "healthy" if evidence_storage.minio_client else "offline_fallback"

    # Verify Redis client (If Redis client was imported but right now we know it's missing in docker-free environment)
    redis_status = "offline"

    # Queue Status
    from app.services.offline_sync import offline_queue
    queue_count = len(offline_queue.list_jobs())

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "storage": storage_status,
        "redis": redis_status,
        "edge_sync_queue": queue_count,
        "version": "1.0.0-IBVAP"
    }
