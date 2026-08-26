from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.core_models import Camera as DB_Camera
from app.schemas.core_schemas import Camera, CameraCreate

router = APIRouter()

@router.get("/", response_model=List[Camera])
def get_cameras(db: Session = Depends(get_db)):
    cameras = db.query(DB_Camera).all()
    return cameras

@router.post("/", response_model=Camera)
def create_camera(camera: CameraCreate, db: Session = Depends(get_db)):
    db_camera = db.query(DB_Camera).filter(DB_Camera.id == camera.id).first()
    if db_camera:
        raise HTTPException(status_code=400, detail="Camera already exists")
    
    new_camera = DB_Camera(**camera.model_dump())
    db.add(new_camera)
    db.commit()
    db.refresh(new_camera)
    return new_camera

@router.put("/{camera_id}/status", response_model=Camera)
def update_camera_status(camera_id: str, status: str, db: Session = Depends(get_db)):
    db_camera = db.query(DB_Camera).filter(DB_Camera.id == camera_id).first()
    if not db_camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    db_camera.status = status
    db.commit()
    db.refresh(db_camera)
    return db_camera

@router.put("/{camera_id}/scenario", response_model=Camera)
def update_camera_scenario(camera_id: str, scenario: str, db: Session = Depends(get_db)):
    db_camera = db.query(DB_Camera).filter(DB_Camera.id == camera_id).first()
    if not db_camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    db_camera.scenario = scenario
    db.commit()
    db.refresh(db_camera)
    return db_camera
