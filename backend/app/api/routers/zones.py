from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.core_models import Zone as DB_Zone
from app.schemas.core_schemas import Zone, ZoneCreate

router = APIRouter()

@router.get("/", response_model=List[Zone])
def get_zones(db: Session = Depends(get_db)):
    zones = db.query(DB_Zone).all()
    return zones

@router.post("/", response_model=Zone)
def create_zone(zone: ZoneCreate, db: Session = Depends(get_db)):
    db_zone = db.query(DB_Zone).filter(DB_Zone.id == zone.id).first()
    if db_zone:
        raise HTTPException(status_code=400, detail="Zone already exists")
    
    new_zone = DB_Zone(**zone.model_dump())
    db.add(new_zone)
    db.commit()
    db.refresh(new_zone)
    return new_zone

@router.delete("/{zone_id}")
def delete_zone(zone_id: str, db: Session = Depends(get_db)):
    db_zone = db.query(DB_Zone).filter(DB_Zone.id == zone_id).first()
    if not db_zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    db.delete(db_zone)
    db.commit()
    return {"message": "Zone deleted successfully"}
