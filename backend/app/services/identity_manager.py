from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models.core_models import Person, VehicleRecord

class IdentityManager:
    RE_ENTRY_TIMEOUT_SEC = 300 # 5 minutes cooldown

    def __init__(self, db: Session):
        self.db = db

    def resolve_person(self, tracking_id: str, face_embedding: list = None, name: str = None) -> Person:
        person = self.db.query(Person).filter(Person.id == tracking_id).first()
        if not person:
            # 1. New Track Session: Compare embedding against Authorized DB
            matched_status = "UNKNOWN"
            matched_name = name or "UNKNOWN"
            
            if face_embedding:
                # We fetch all known faces (in a real production system with thousands, pgvector would be used)
                known_faces = self.db.query(Person).filter(Person.embedding.isnot(None), Person.authorization_status.in_(["AUTHORIZED", "WATCHLIST"])).all()
                best_distance = 0.40 # Cosine similarity threshold for DeepFace (VGG-Face)
                
                for kf in known_faces:
                    try:
                        import numpy as np
                        from deepface.commons import distance as dst
                        emb1 = np.array(face_embedding)
                        emb2 = np.array(kf.embedding)
                        dist = dst.findCosineDistance(emb1, emb2)
                        if dist < best_distance:
                            best_distance = dist
                            matched_status = kf.authorization_status
                            matched_name = kf.name
                    except Exception as e:
                        pass
                        
            person = Person(
                id=tracking_id,
                name=matched_name,
                embedding=face_embedding,
                authorization_status=matched_status,
                first_seen=datetime.now(timezone.utc),
                last_seen=datetime.now(timezone.utc),
                entry_count=1
            )
            self.db.add(person)
        else:
            # Debounce re-entry logic
            time_diff = datetime.now(timezone.utc) - person.last_seen.replace(tzinfo=timezone.utc)
            if time_diff.total_seconds() > 300: # 5 minutes cooldown
                person.entry_count += 1
            person.last_seen = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(person)
        return person

    def resolve_vehicle(self, tracking_id: str, plate_number: str) -> VehicleRecord:
        # Check tracking ID session first (for fast debouncing without DB scan)
        vehicle = self.db.query(VehicleRecord).filter(VehicleRecord.id == tracking_id).first()
        
        if not vehicle:
            # 1. New Track Session: Search historical databases for the plate
            historical_match = None
            if plate_number and len(plate_number) > 3:
                historical_match = self.db.query(VehicleRecord).filter(
                    VehicleRecord.normalized_plate == plate_number, 
                    VehicleRecord.status.in_(["AUTHORIZED", "WATCHLIST"])
                ).first()

            status = historical_match.status if historical_match else "UNKNOWN"

            vehicle = VehicleRecord(
                id=tracking_id,
                plateNumber=plate_number,
                normalized_plate=plate_number,
                status=status,
                first_seen=datetime.now(timezone.utc),
                last_seen=datetime.now(timezone.utc),
                entry_count=1
            )
            self.db.add(vehicle)
        else:
            # Debounce re-entry logic
            if vehicle.last_seen:
                now_utc = datetime.now(timezone.utc)
                last_seen_utc = vehicle.last_seen.replace(tzinfo=timezone.utc) if vehicle.last_seen.tzinfo is None else vehicle.last_seen
                delta_sec = (now_utc - last_seen_utc).total_seconds()
            else:
                delta_sec = 0

            if delta_sec > self.RE_ENTRY_TIMEOUT_SEC:
                vehicle.entry_count += 1
            vehicle.last_seen = datetime.now(timezone.utc)
            vehicle.plateNumber = plate_number # Use latest consensus
        self.db.commit()
        self.db.refresh(vehicle)
        return vehicle
