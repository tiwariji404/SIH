from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, time

from app.config import settings


@dataclass(slots=True)
class RiskSignals:
    object_class: str
    zone_name: str | None = None
    restricted_zone: bool = False
    fence_crossed: bool = False
    loitering: bool = False
    night_time: bool = False
    camera_offline: bool = False


@dataclass(slots=True)
class RiskEvaluation:
    score: int
    severity: str
    reasons: list[str]


def score_to_severity(score: int) -> str:
    if score <= 30:
        return "LOW"
    if score <= 60:
        return "MEDIUM"
    if score <= 80:
        return "HIGH"
    return "CRITICAL"


class RiskEngine:
    def __init__(self) -> None:
        self.night_start = self._parse_time(settings.night_start)
        self.night_end = self._parse_time(settings.night_end)

    @staticmethod
    def _parse_time(value: str) -> time:
        hour, minute = value.split(":")
        return time(hour=int(hour), minute=int(minute))

    def is_night_time(self, when: datetime | None = None) -> bool:
        now = (when or datetime.now()).time()
        if self.night_start <= self.night_end:
            return self.night_start <= now <= self.night_end
        return now >= self.night_start or now <= self.night_end

    def evaluate(self, signals: RiskSignals) -> RiskEvaluation:
        score = 10
        reasons: list[str] = ["Person detected" if signals.object_class == "person" else f"{signals.object_class.title()} detected"]

        if signals.restricted_zone:
            score += 32
            reasons.append("Restricted zone")
        if signals.fence_crossed:
            score += 35
            reasons.append("Virtual fence crossed")
        if signals.loitering:
            score += 28
            reasons.append(f"Loitering > {settings.loitering_threshold}s")
        if signals.night_time:
            score += 15
            reasons.append("Night-time movement")
        if signals.camera_offline:
            score = max(score, 72)
            reasons.append("Camera offline")

        score = min(score, 100)
        return RiskEvaluation(score=score, severity=score_to_severity(score), reasons=reasons)
