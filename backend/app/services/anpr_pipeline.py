from __future__ import annotations

import base64
import hashlib
import os
import re
import uuid
from datetime import datetime
from pathlib import Path

import cv2
import numpy as np
from sqlalchemy.orm import Session

from app.models.core_models import Alert, Camera, EventItem, Evidence, Plate, VehicleRecord, WatchlistRecord
from app.vision.anpr import ANPRCapture, ANPRService, anpr_service


BACKEND_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BACKEND_DIR / "data"
ANPR_DIR = DATA_DIR / "anpr"
ANPR_UPLOAD_DIR = ANPR_DIR / "uploads"
ANPR_DIR.mkdir(parents=True, exist_ok=True)
ANPR_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

PUBLIC_API_URL = os.getenv("API_URL", "http://localhost:8000").rstrip("/")

_recent_live_captures: dict[str, datetime] = {}


def utcnow() -> datetime:
    return datetime.utcnow()


def timestamp_label(timestamp: datetime) -> str:
    return timestamp.strftime("%d %b %Y, %I:%M:%S %p")


def normalize_plate(text: str) -> str:
    return ANPRService.normalize_plate(text)


def format_plate(text: str) -> str:
    return ANPRService.format_plate(text)


def media_url(relative_path: str | None) -> str | None:
    if not relative_path:
        return None
    if relative_path.startswith("http://") or relative_path.startswith("https://"):
        return relative_path
    return f"{PUBLIC_API_URL}{relative_path}"


def decode_image_bytes(contents: bytes) -> np.ndarray:
    frame = cv2.imdecode(np.frombuffer(contents, np.uint8), cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("Invalid image file format")
    return frame


def decode_base64_frame(image_data: str) -> np.ndarray:
    if "," in image_data:
        image_data = image_data.split(",", 1)[1]
    try:
        raw = base64.b64decode(image_data, validate=True)
    except Exception as exc:
        raise ValueError("Invalid base64 image payload") from exc
    return decode_image_bytes(raw)


def save_upload_file(contents: bytes, original_filename: str | None = None) -> Path:
    suffix = Path(original_filename or "").suffix.lower()
    if suffix not in {".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"}:
        suffix = ".mp4"
    path = ANPR_UPLOAD_DIR / f"{uuid.uuid4().hex}{suffix}"
    path.write_bytes(contents)
    return path


def safe_filename_part(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_.-]", "_", value)
    return cleaned[:80] or "ANPR"


def _ensure_camera(db: Session, camera_id: str) -> None:
    if db.query(Camera).filter(Camera.id == camera_id).first():
        return

    db.add(
        Camera(
            id=camera_id,
            name=f"ANPR {camera_id}",
            bop="ANPR",
            location="ANPR input source",
            status="ONLINE",
            fps=0,
            latency=0,
            storage=0,
            health=100,
            lastHeartbeat=utcnow().isoformat() + "Z",
            signalQuality=100,
            scenario="anpr",
            recording=True,
            detectionCount=0,
            coords={"x": 50, "y": 50},
            mapCoord={"lat": 0, "lng": 0},
        )
    )
    db.flush()


def _watchlist_match(db: Session, plate_number: str) -> WatchlistRecord | None:
    normalized_plate = normalize_plate(plate_number)
    for record in db.query(WatchlistRecord).all():
        if normalize_plate(record.plate_number) == normalized_plate:
            return record
    return None


def _vehicle_type_label(vehicle_type: str) -> str:
    labels = {
        "car": "Car",
        "motorcycle": "Motorcycle",
        "bus": "Bus",
        "truck": "Truck",
        "vehicle": "Vehicle",
    }
    return labels.get(vehicle_type.lower(), vehicle_type.title() if vehicle_type else "Vehicle")


def _crop_vehicle(frame: np.ndarray, capture: ANPRCapture) -> np.ndarray:
    height, width = frame.shape[:2]
    x1, y1, x2, y2 = capture.vehicle_bbox_xyxy
    pad_x = max(8, int((x2 - x1) * 0.06))
    pad_y = max(8, int((y2 - y1) * 0.08))
    x1 = max(0, x1 - pad_x)
    y1 = max(0, y1 - pad_y)
    x2 = min(width, x2 + pad_x)
    y2 = min(height, y2 + pad_y)
    crop = frame[y1:y2, x1:x2]
    return crop if crop.size else frame


def _save_vehicle_crop(frame: np.ndarray, capture: ANPRCapture, camera_id: str, timestamp: datetime) -> tuple[str, str, str]:
    day_dir = ANPR_DIR / timestamp.strftime("%Y%m%d")
    day_dir.mkdir(parents=True, exist_ok=True)

    safe_plate = normalize_plate(capture.plate_number) or "UNKNOWN"
    filename = f"{timestamp.strftime('%H%M%S_%f')}_{safe_filename_part(camera_id)}_{safe_plate}.jpg"
    file_path = day_dir / filename

    crop = _crop_vehicle(frame, capture)
    if not cv2.imwrite(str(file_path), crop):
        raise RuntimeError("Failed to store ANPR vehicle image")

    contents = file_path.read_bytes()
    digest = hashlib.sha256(contents).hexdigest()
    relative_url = f"/media/anpr/{timestamp.strftime('%Y%m%d')}/{filename}"
    return str(file_path), relative_url, digest


def vehicle_to_payload(db: Session, vehicle: VehicleRecord) -> dict:
    plate_record = db.query(Plate).filter(Plate.vehicle_id == vehicle.id).order_by(Plate.timestamp.desc()).first()
    image = None
    if plate_record and plate_record.evidence_id:
        evidence = db.query(Evidence).filter(Evidence.id == plate_record.evidence_id).first()
        if evidence:
            image = media_url(evidence.file_url)

    return {
        "id": vehicle.id,
        "cameraId": vehicle.cameraId,
        "vehicleType": vehicle.vehicleType,
        "plateNumber": vehicle.plateNumber,
        "confidence": vehicle.confidence,
        "timestamp": vehicle.timestamp,
        "status": vehicle.status,
        "direction": vehicle.direction or "Unknown",
        "image": image,
    }


def _recent_capture_allowed(camera_id: str, plate_number: str, dedupe_seconds: int) -> bool:
    if dedupe_seconds <= 0:
        return True

    now = utcnow()
    key = f"{camera_id}:{normalize_plate(plate_number)}"
    last_seen = _recent_live_captures.get(key)
    if last_seen and (now - last_seen).total_seconds() < dedupe_seconds:
        return False

    _recent_live_captures[key] = now
    stale_keys = [item for item, seen_at in _recent_live_captures.items() if (now - seen_at).total_seconds() > 300]
    for item in stale_keys:
        _recent_live_captures.pop(item, None)
    return True


def _persist_capture(
    db: Session,
    capture: ANPRCapture,
    frame: np.ndarray,
    camera_id: str,
    direction: str,
    source: str,
    timestamp: datetime,
) -> tuple[dict, dict | None]:
    _ensure_camera(db, camera_id)

    matched_watchlist = _watchlist_match(db, capture.plate_number)
    status = "WATCHLIST" if matched_watchlist else "UNKNOWN"
    display_plate = format_plate(capture.plate_number)
    confidence = int(round(capture.plate_confidence * 100))
    vehicle_id = f"V-{uuid.uuid4().hex[:12].upper()}"
    event_id = f"EVT-{uuid.uuid4().hex[:12].upper()}"
    timestamp_iso = timestamp.isoformat() + "Z"

    file_path, file_url, sha256_hash = _save_vehicle_crop(frame, capture, camera_id, timestamp)

    vehicle = VehicleRecord(
        id=vehicle_id,
        cameraId=camera_id,
        vehicleType=_vehicle_type_label(capture.vehicle_type),
        plateNumber=display_plate,
        confidence=confidence,
        timestamp=timestamp_iso,
        status=status,
        direction=direction,
    )
    db.add(vehicle)

    event = EventItem(
        id=event_id,
        cameraId=camera_id,
        eventType="WATCHLIST_MATCH" if matched_watchlist else "PLATE_DETECTED",
        severity="CRITICAL" if matched_watchlist else "LOW",
        trackingId=vehicle_id,
        description=(
            f"Watchlist vehicle {display_plate} detected"
            if matched_watchlist
            else f"Vehicle plate {display_plate} detected"
        ),
        timestamp=timestamp_iso,
        status="NEW",
        riskScore=95 if matched_watchlist else 20,
        reasons=[
            f"Plate OCR confidence {confidence}%",
            f"Vehicle type: {_vehicle_type_label(capture.vehicle_type)}",
            f"Source: {source}",
        ],
        confidence=float(confidence),
        details={
            "plate_number": display_plate,
            "normalized_plate": normalize_plate(capture.plate_number),
            "vehicle_type": _vehicle_type_label(capture.vehicle_type),
            "vehicle_confidence": round(capture.vehicle_confidence * 100, 1),
            "raw_ocr_text": capture.raw_text,
            "image_url": file_url,
        },
    )
    db.add(event)

    evidence = Evidence(
        id=str(uuid.uuid4()),
        event_id=event_id,
        camera_id=camera_id,
        file_location=file_path,
        file_url=file_url,
        file_type="SNAPSHOT",
        sha256_hash=sha256_hash,
        integrity_status="VERIFIED",
    )
    db.add(evidence)

    plate = Plate(
        id=str(uuid.uuid4()),
        vehicle_id=vehicle_id,
        camera_id=camera_id,
        raw_ocr_text=capture.raw_text,
        normalized_plate=normalize_plate(capture.plate_number),
        confidence=capture.plate_confidence,
        timestamp=timestamp,
        evidence_id=evidence.id,
    )
    db.add(plate)

    alert_payload = None
    if matched_watchlist:
        alert_id = f"ALRT-{uuid.uuid4().hex[:8].upper()}"
        alert = Alert(
            id=alert_id,
            eventId=event_id,
            severity="CRITICAL",
            riskScore=95,
            reason=f"Vehicle plate {display_plate} matches watchlist.",
            reasons=[
                "ANPR watchlist match",
                f"Registered reason: {matched_watchlist.description or 'No description'}",
            ],
            status="NEW",
            createdAt=timestamp_iso,
            acknowledgedAt=None,
            resolvedAt=None,
            cameraId=camera_id,
            trackingId=vehicle_id,
            title="Watchlist Vehicle Detected",
            what=f"{_vehicle_type_label(capture.vehicle_type)} with plate {display_plate}",
            where=camera_id,
            when_time=timestamp_label(timestamp),
            object=display_plate,
            why=f"Plate matches watchlist entry {matched_watchlist.id}",
            zone=None,
            confidence=confidence,
        )
        db.add(alert)
        alert_payload = {
            "id": alert_id,
            "eventId": event_id,
            "severity": "CRITICAL",
            "riskScore": 95,
            "reason": alert.reason,
            "reasons": alert.reasons,
            "status": "NEW",
            "createdAt": timestamp_iso,
            "acknowledgedAt": None,
            "resolvedAt": None,
            "cameraId": camera_id,
            "trackingId": vehicle_id,
            "title": alert.title,
            "what": alert.what,
            "where": alert.where,
            "when": alert.when_time,
            "object": alert.object,
            "why": alert.why,
            "confidence": confidence,
            "image": media_url(file_url),
        }

    db.flush()
    payload = vehicle_to_payload(db, vehicle)
    return payload, alert_payload


def process_anpr_frame(
    db: Session,
    frame: np.ndarray,
    camera_id: str = "ANPR-UPLOAD",
    direction: str = "Unknown",
    source: str = "image",
    dedupe_seconds: int = 0,
    seen_plate_numbers: set[str] | None = None,
) -> tuple[list[dict], list[dict]]:
    timestamp = utcnow()
    payloads: list[dict] = []
    alert_payloads: list[dict] = []

    for capture in anpr_service.analyze_frame(frame):
        normalized_plate = normalize_plate(capture.plate_number)
        if seen_plate_numbers is not None and normalized_plate in seen_plate_numbers:
            continue
        if not _recent_capture_allowed(camera_id, capture.plate_number, dedupe_seconds):
            continue
        payload, alert_payload = _persist_capture(db, capture, frame, camera_id, direction, source, timestamp)
        if seen_plate_numbers is not None:
            seen_plate_numbers.add(normalized_plate)
        payloads.append(payload)
        if alert_payload:
            alert_payloads.append(alert_payload)

    db.commit()
    return payloads, alert_payloads


def process_recorded_video(
    db: Session,
    video_path: Path,
    camera_id: str = "ANPR-RECORDED",
    direction: str = "Unknown",
    sample_every_n_frames: int = 15,
    max_captures: int = 50,
) -> dict:
    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        raise ValueError("Could not open recorded video")

    frame_index = 0
    processed_frames = 0
    seen_plates: set[str] = set()
    payloads: list[dict] = []
    alert_payloads: list[dict] = []

    try:
        while len(payloads) < max_captures:
            ok, frame = capture.read()
            if not ok or frame is None:
                break

            frame_index += 1
            if frame_index % max(sample_every_n_frames, 1) != 0:
                continue

            processed_frames += 1
            frame_payloads, frame_alerts = process_anpr_frame(
                db,
                frame,
                camera_id=camera_id,
                direction=direction,
                source="recorded",
                dedupe_seconds=0,
                seen_plate_numbers=seen_plates,
            )
            for payload in frame_payloads:
                payloads.append(payload)
            alert_payloads.extend(frame_alerts)
    finally:
        capture.release()

    return {
        "ok": True,
        "source_path": str(video_path),
        "frames_read": frame_index,
        "frames_processed": processed_frames,
        "count": len(payloads),
        "captures": payloads,
        "alerts": alert_payloads,
    }
