from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base
from datetime import datetime

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100))
    bop = Column(String(100))
    location = Column(String(200))
    status = Column(String(20)) # ONLINE, OFFLINE, DEGRADED
    fps = Column(Integer, default=30)
    latency = Column(Integer, default=20)
    storage = Column(Integer, default=100)
    health = Column(Integer, default=100)
    lastHeartbeat = Column(String(50))
    signalQuality = Column(Integer, default=100)
    scenario = Column(String(50), default="normal")
    recording = Column(Boolean, default=True)
    detectionCount = Column(Integer, default=0)
    coords = Column(JSON) # {x, y}
    mapCoord = Column(JSON) # {lat, lng}

class EventItem(Base):
    __tablename__ = "events"

    id = Column(String(100), primary_key=True, index=True)
    cameraId = Column(String(50), ForeignKey("cameras.id"))
    eventType = Column(String(100))
    severity = Column(String(20)) # LOW, MEDIUM, HIGH, CRITICAL
    trackingId = Column(String(100), nullable=True)
    description = Column(String(255))
    timestamp = Column(String(50))
    status = Column(String(20)) # NEW, ACKNOWLEDGED, INVESTIGATING, RESOLVED
    riskScore = Column(Integer, default=0)
    reasons = Column(JSON) # Array of strings

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(100), primary_key=True, index=True)
    eventId = Column(String(100), ForeignKey("events.id"), nullable=True)
    severity = Column(String(20))
    riskScore = Column(Integer, default=0)
    reason = Column(String(255))
    reasons = Column(JSON)
    status = Column(String(20))
    createdAt = Column(String(50))
    acknowledgedAt = Column(String(50), nullable=True)
    resolvedAt = Column(String(50), nullable=True)
    cameraId = Column(String(50), ForeignKey("cameras.id"))
    trackingId = Column(String(100), nullable=True)
    title = Column(String(150))
    what = Column(String(150))
    where = Column(String(150))
    when_time = Column(String(100)) # 'when' is a reserved keyword in some db dialects, frontend uses when
    object = Column(String(100))
    why = Column(String(255))
    zone = Column(String(100), nullable=True)
    confidence = Column(Integer, default=100)

class VehicleRecord(Base):
    __tablename__ = "vehicles"

    id = Column(String(100), primary_key=True, index=True)
    cameraId = Column(String(50), ForeignKey("cameras.id"))
    vehicleType = Column(String(50))
    plateNumber = Column(String(50))
    confidence = Column(Integer)
    timestamp = Column(String(50))
    status = Column(String(30)) # AUTHORIZED, WATCHLIST, UNKNOWN
    direction = Column(String(50))

class FaceRecord(Base):
    __tablename__ = "faces"

    id = Column(String(100), primary_key=True, index=True)
    cameraId = Column(String(50), ForeignKey("cameras.id"))
    identity = Column(String(150))
    confidence = Column(Integer)
    timestamp = Column(String(50))
    database = Column(String(50))
    status = Column(String(30)) # AUTHORIZED, UNKNOWN, FLAGGED

class Zone(Base):
    __tablename__ = "zones"

    id = Column(String(100), primary_key=True, index=True)
    cameraIds = Column(JSON) # list of string IDs
    name = Column(String(150))
    zoneType = Column(String(50))
    severity = Column(String(20))
    coordinates = Column(JSON) # list of {x, y}
    rule = Column(String(255))

class Detection(Base):
    __tablename__ = "detections"

    id = Column(String(100), primary_key=True, index=True)
    cameraId = Column(String(50), ForeignKey("cameras.id"))
    objectType = Column(String(50))
    trackingId = Column(String(100))
    confidence = Column(Integer)
    timestamp = Column(String(50))
    bbox = Column(JSON) # {x, y, w, h}
    label = Column(String(50))
    direction = Column(String(50), nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(100), primary_key=True, index=True)
    user = Column(String(100))
    action = Column(String(255))
    timestamp = Column(String(50))
    details = Column(String(500))
    result = Column(String(20))
    ip = Column(String(50))

class TrackRecord(Base):
    __tablename__ = "tracks"

    trackingId = Column(String(100), primary_key=True, index=True)
    objectType = Column(String(50))
    cameraId = Column(String(50), ForeignKey("cameras.id"))
    direction = Column(String(50))
    duration = Column(String(50))
    status = Column(String(30)) # Active, Lost, Exited
    firstSeen = Column(String(50))
    lastSeen = Column(String(50))
    history = Column(JSON) # array of {cameraId, time}
