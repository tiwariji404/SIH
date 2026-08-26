from __future__ import annotations

from datetime import datetime
from pathlib import Path

import cv2
import numpy as np

from app.config import settings


class SnapshotStore:
    def __init__(self) -> None:
        self.base_dir = Path(settings.snapshot_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save(self, frame: np.ndarray, camera_id: str, label: str) -> str | None:
        timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S-%f")
        filename = f"{camera_id}-{label}-{timestamp}.jpg"
        output_path = self.base_dir / filename
        success = cv2.imwrite(str(output_path), frame)
        if not success:
            return None
        return f"/data/events/{filename}"
