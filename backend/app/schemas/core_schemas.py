from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Any, Dict
from datetime import datetime

class CameraBase(BaseModel):
    id: str
    name: str
    bop: str
    location: str
    status: str
    fps: int = 30
    latency: int = 20
    storage: int = 100
    health: int = 100
    lastHeartbeat: str
    signalQuality: int = 100
    scenario: str = "normal"
    recording: bool = True
    detectionCount: int = 0
    coords: Dict[str, float]
    mapCoord: Dict[str, float]

class CameraCreate(CameraBase):
    pass

class Camera(CameraBase):
    model_config = ConfigDict(from_attributes=True)

class EventItemBase(BaseModel):
    id: str
    cameraId: str
    eventType: str
    severity: str
    trackingId: Optional[str] = None
    description: str
    timestamp: str
    status: str
    riskScore: int = 0
    reasons: List[str] = []

class EventItemCreate(EventItemBase):
    pass

class EventItem(EventItemBase):
    model_config = ConfigDict(from_attributes=True)

class AlertBase(BaseModel):
    id: str
    eventId: Optional[str] = None
    severity: str
    riskScore: int = 0
    reason: str
    reasons: List[str] = []
    status: str
    createdAt: str
    acknowledgedAt: Optional[str] = None
    resolvedAt: Optional[str] = None
    cameraId: str
    trackingId: Optional[str] = None
    title: str
    what: str
    where: str
    when: str # Maps to when_time in DB model
    object: str
    why: str
    zone: Optional[str] = None
    confidence: int = 100

class AlertCreate(AlertBase):
    pass

class Alert(AlertBase):
    model_config = ConfigDict(from_attributes=True)

class VehicleRecordBase(BaseModel):
    id: str
    cameraId: str
    vehicleType: str
    plateNumber: str
    confidence: int
    timestamp: str
    status: str
    direction: str

class VehicleRecordCreate(VehicleRecordBase):
    pass

class VehicleRecord(VehicleRecordBase):
    model_config = ConfigDict(from_attributes=True)

class FaceRecordBase(BaseModel):
    id: str
    cameraId: str
    identity: str
    confidence: int
    timestamp: str
    database: str
    status: str

class FaceRecordCreate(FaceRecordBase):
    pass

class FaceRecord(FaceRecordBase):
    model_config = ConfigDict(from_attributes=True)

class ZoneBase(BaseModel):
    id: str
    cameraIds: List[str]
    name: str
    zoneType: str
    severity: str
    coordinates: List[Dict[str, float]]
    rule: str

class ZoneCreate(ZoneBase):
    pass

class Zone(ZoneBase):
    model_config = ConfigDict(from_attributes=True)

class DetectionBase(BaseModel):
    id: str
    cameraId: str
    objectType: str
    trackingId: str
    confidence: int
    timestamp: str
    bbox: Dict[str, float]
    label: str
    direction: Optional[str] = None

class DetectionCreate(DetectionBase):
    pass

class Detection(DetectionBase):
    model_config = ConfigDict(from_attributes=True)

class AuditLogBase(BaseModel):
    id: str
    user: str
    action: str
    timestamp: str
    details: str
    result: str
    ip: str

class AuditLogCreate(AuditLogBase):
    pass

class AuditLog(AuditLogBase):
    model_config = ConfigDict(from_attributes=True)

class TrackRecordBase(BaseModel):
    trackingId: str
    objectType: str
    cameraId: str
    direction: str
    duration: str
    status: str
    firstSeen: str
    lastSeen: str
    history: List[Dict[str, str]]

class TrackRecordCreate(TrackRecordBase):
    pass

class TrackRecord(TrackRecordBase):
    model_config = ConfigDict(from_attributes=True)
