from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.core_models import Camera as DB_Camera
from app.models.user import User, UserRole
from app.schemas.core_schemas import Camera, CameraCreate
from app.api.deps import get_current_user, get_current_active_supervisor

router = APIRouter()

@router.get("/", response_model=List[Camera])
def get_cameras(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cameras = db.query(DB_Camera).all()
    return cameras

@router.get("/{camera_id}", response_model=Camera)
def get_camera(camera_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_camera = db.query(DB_Camera).filter(DB_Camera.id == camera_id).first()
    if not db_camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return db_camera

from app.services.audit import log_audit_action

@router.post("/", response_model=Camera)
def create_camera(
    camera: CameraCreate, 
    db: Session = Depends(get_db),
    supervisor: User = Depends(get_current_active_supervisor)
):
    new_camera = DB_Camera(**camera.model_dump())
    db.add(new_camera)
    db.commit()
    db.refresh(new_camera)
    
    log_audit_action(db, str(supervisor.id), supervisor.username, "CREATE_CAMERA", f"Created camera {new_camera.name}", "Camera", str(new_camera.id))
    return new_camera

@router.put("/{camera_id}", response_model=Camera)
def update_camera(
    camera_id: str,
    camera_in: CameraCreate,
    db: Session = Depends(get_db),
    supervisor: User = Depends(get_current_active_supervisor)
):
    db_camera = db.query(DB_Camera).filter(DB_Camera.id == camera_id).first()
    if not db_camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    update_data = camera_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_camera, field, value)
        
    db.commit()
    db.refresh(db_camera)
    
    log_audit_action(db, str(supervisor.id), supervisor.username, "UPDATE_CAMERA", f"Updated camera rules {db_camera.name}", "Camera", str(db_camera.id))
    return db_camera

@router.put("/{camera_id}/status", response_model=Camera)
def update_camera_status(
    camera_id: str, 
    status: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_camera = db.query(DB_Camera).filter(DB_Camera.id == camera_id).first()
    if not db_camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    db_camera.status = status
    db.commit()
    db.refresh(db_camera)
    log_audit_action(db, str(current_user.id), current_user.username, "UPDATE_CAMERA_STATUS", f"Switched status to {status}", "Camera", str(db_camera.id))
    return db_camera

@router.delete("/{camera_id}", response_model=Camera)
def delete_camera(
    camera_id: str,
    db: Session = Depends(get_db),
    supervisor: User = Depends(get_current_active_supervisor)
):
    db_camera = db.query(DB_Camera).filter(DB_Camera.id == camera_id).first()
    if not db_camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    db.delete(db_camera)
    db.commit()
    log_audit_action(db, str(supervisor.id), supervisor.username, "DELETE_CAMERA", f"Deleted camera {camera_id}", "Camera", camera_id)
    return db_camera
