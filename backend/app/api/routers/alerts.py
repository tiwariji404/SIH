from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.db.session import get_db
from app.models.core_models import Alert as DB_Alert, EventItem as DB_Event
from app.schemas.core_schemas import Alert, AlertCreate, EventItem, EventItemCreate

router = APIRouter()

@router.get("/events", response_model=List[EventItem])
def get_events(db: Session = Depends(get_db)):
    events = db.query(DB_Event).order_by(DB_Event.timestamp.desc()).all()
    return events

@router.post("/events", response_model=EventItem)
def create_event(event: EventItemCreate, db: Session = Depends(get_db)):
    db_event = DB_Event(**event.model_dump())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@router.get("/", response_model=List[Alert])
def get_alerts(db: Session = Depends(get_db)):
    alerts = db.query(DB_Alert).order_by(DB_Alert.createdAt.desc()).all()
    return alerts

@router.post("/", response_model=Alert)
def create_alert(alert: AlertCreate, db: Session = Depends(get_db)):
    db_alert = DB_Alert(**alert.model_dump())
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert

@router.put("/{alert_id}/acknowledge", response_model=Alert)
def acknowledge_alert(alert_id: str, db: Session = Depends(get_db)):
    db_alert = db.query(DB_Alert).filter(DB_Alert.id == alert_id).first()
    if not db_alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    db_alert.status = "ACKNOWLEDGED"
    db_alert.acknowledgedAt = datetime.utcnow().isoformat() + "Z"
    
    if db_alert.eventId:
        event = db.query(DB_Event).filter(DB_Event.id == db_alert.eventId).first()
        if event:
            event.status = "ACKNOWLEDGED"
            
    db.commit()
    db.refresh(db_alert)
    return db_alert

@router.put("/{alert_id}/investigate", response_model=Alert)
def investigate_alert(alert_id: str, db: Session = Depends(get_db)):
    db_alert = db.query(DB_Alert).filter(DB_Alert.id == alert_id).first()
    if not db_alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    db_alert.status = "INVESTIGATING"
    
    if db_alert.eventId:
        event = db.query(DB_Event).filter(DB_Event.id == db_alert.eventId).first()
        if event:
            event.status = "INVESTIGATING"
            
    db.commit()
    db.refresh(db_alert)
    return db_alert

@router.put("/{alert_id}/resolve", response_model=Alert)
def resolve_alert(alert_id: str, db: Session = Depends(get_db)):
    db_alert = db.query(DB_Alert).filter(DB_Alert.id == alert_id).first()
    if not db_alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    db_alert.status = "RESOLVED"
    db_alert.resolvedAt = datetime.utcnow().isoformat() + "Z"
    
    if db_alert.eventId:
        event = db.query(DB_Event).filter(DB_Event.id == db_alert.eventId).first()
        if event:
            event.status = "RESOLVED"
            
    db.commit()
    db.refresh(db_alert)
    return db_alert
