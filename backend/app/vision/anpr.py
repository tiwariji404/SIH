from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import cv2
import numpy as np


BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_MODEL_PATH = BACKEND_DIR / "yolov8n.pt"
VEHICLE_LABELS = {"car", "motorcycle", "bus", "truck"}


@dataclass(slots=True)
class OCRResult:
    raw_text: str
    normalized: str
    confidence: float
    bbox: tuple[Any, ...] | None = None


@dataclass(slots=True)
class PlateCandidate:
    image: np.ndarray
    bbox_xyxy: tuple[int, int, int, int]
    score: float


@dataclass(slots=True)
class VehicleDetection:
    vehicle_type: str
    confidence: float
    bbox_xyxy: tuple[int, int, int, int]


@dataclass(slots=True)
class ANPRCapture:
    raw_text: str
    plate_number: str
    plate_confidence: float
    vehicle_type: str
    vehicle_confidence: float
    vehicle_bbox_xyxy: tuple[int, int, int, int]
    plate_bbox_xyxy: tuple[int, int, int, int] | None


class ANPRService:
    def __init__(self, model_path: str | None = None) -> None:
        self.model_path = model_path or str(DEFAULT_MODEL_PATH if DEFAULT_MODEL_PATH.exists() else "yolov8n.pt")
        self._ocr_reader: Any | None = None
        self._ocr_backend: str | None = None
        self._ocr_error: str | None = None
        self._yolo_model: Any | None = None
        self._yolo_class_ids: list[int] | None = None
        self._yolo_error: str | None = None

    @property
    def ocr_backend(self) -> str | None:
        self._ensure_ocr()
        return self._ocr_backend

    @property
    def ocr_error(self) -> str | None:
        self._ensure_ocr()
        return self._ocr_error

    def _ensure_ocr(self) -> None:
        if self._ocr_backend is not None or self._ocr_error is not None:
            return

        try:
            import easyocr

            self._ocr_reader = easyocr.Reader(["en"], gpu=False)
            self._ocr_backend = "easyocr"
            return
        except Exception as exc:
            easyocr_error = str(exc)

        try:
            import pytesseract

            self._ocr_reader = pytesseract
            self._ocr_backend = "tesseract"
            return
        except Exception as exc:
            self._ocr_error = f"No OCR backend available. easyocr: {easyocr_error}; pytesseract: {exc}"

    def _ensure_yolo(self) -> None:
        if self._yolo_model is not None or self._yolo_error is not None:
            return

        try:
            from ultralytics import YOLO

            self._yolo_model = YOLO(self.model_path)
            names = getattr(self._yolo_model, "names", {})
            self._yolo_class_ids = [class_id for class_id, label in names.items() if label in VEHICLE_LABELS]
        except Exception as exc:
            self._yolo_error = str(exc)

    @staticmethod
    def normalize_plate(text: str) -> str:
        return re.sub(r"[^A-Z0-9]", "", text.upper())

    @staticmethod
    def format_plate(text: str) -> str:
        normalized = ANPRService.normalize_plate(text)
        indian_match = re.match(r"^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{3,4})$", normalized)
        if indian_match:
            return " ".join(indian_match.groups())
        return normalized

    @staticmethod
    def validate_plate(text: str) -> bool:
        normalized = ANPRService.normalize_plate(text)
        if len(normalized) < 4 or len(normalized) > 12:
            return False
        if not any(char.isalpha() for char in normalized):
            return False
        if not any(char.isdigit() for char in normalized):
            return False
        return True

    @staticmethod
    def _clamp_bbox(
        bbox_xyxy: tuple[float, float, float, float],
        width: int,
        height: int,
        padding: int = 0,
    ) -> tuple[int, int, int, int]:
        x1, y1, x2, y2 = bbox_xyxy
        return (
            max(0, int(x1) - padding),
            max(0, int(y1) - padding),
            min(width, int(x2) + padding),
            min(height, int(y2) + padding),
        )

    @staticmethod
    def _preprocess_for_ocr(image: np.ndarray) -> np.ndarray:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if image.ndim == 3 else image.copy()
        gray = cv2.bilateralFilter(gray, 9, 75, 75)
        height, width = gray.shape[:2]
        if width < 320:
            scale = 320 / max(width, 1)
            gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
        return gray

    def _read_text(self, image: np.ndarray) -> list[OCRResult]:
        self._ensure_ocr()
        if self._ocr_backend is None or self._ocr_reader is None:
            return []

        enhanced = self._preprocess_for_ocr(image)
        results: list[OCRResult] = []

        if self._ocr_backend == "easyocr":
            try:
                for bbox, text, prob in self._ocr_reader.readtext(enhanced):
                    normalized = self.normalize_plate(text)
                    if self.validate_plate(normalized):
                        results.append(OCRResult(text, normalized, float(prob), tuple(bbox)))
            except Exception:
                return []
            return results

        try:
            data = self._ocr_reader.image_to_data(
                enhanced,
                config="--psm 7 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
                output_type=self._ocr_reader.Output.DICT,
            )
        except Exception:
            return []

        for index, text in enumerate(data.get("text", [])):
            normalized = self.normalize_plate(text)
            if not self.validate_plate(normalized):
                continue
            try:
                confidence = max(0.0, float(data["conf"][index])) / 100.0
                bbox = (
                    int(data["left"][index]),
                    int(data["top"][index]),
                    int(data["left"][index]) + int(data["width"][index]),
                    int(data["top"][index]) + int(data["height"][index]),
                )
            except Exception:
                confidence = 0.0
                bbox = None
            results.append(OCRResult(text, normalized, confidence, bbox))
        return results

    def _candidate_from_rect(
        self,
        image: np.ndarray,
        x: int,
        y: int,
        width: int,
        height: int,
        score: float,
    ) -> PlateCandidate | None:
        frame_height, frame_width = image.shape[:2]
        x1, y1, x2, y2 = self._clamp_bbox((x, y, x + width, y + height), frame_width, frame_height, padding=4)
        if x2 <= x1 or y2 <= y1:
            return None
        crop = image[y1:y2, x1:x2]
        if crop.size == 0:
            return None
        return PlateCandidate(crop, (x1, y1, x2, y2), score)

    def find_plate_candidates(self, vehicle_crop: np.ndarray) -> list[PlateCandidate]:
        height, width = vehicle_crop.shape[:2]
        if height < 20 or width < 20:
            return []

        candidates: list[PlateCandidate] = [
            PlateCandidate(vehicle_crop, (0, 0, width, height), 0.05),
            PlateCandidate(vehicle_crop[int(height * 0.45) : height, 0:width], (0, int(height * 0.45), width, height), 0.25),
        ]

        gray = cv2.cvtColor(vehicle_crop, cv2.COLOR_BGR2GRAY)
        gray = cv2.bilateralFilter(gray, 11, 17, 17)
        edges = cv2.Canny(gray, 60, 180)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (17, 5))
        edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)

        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        min_area = max(120.0, width * height * 0.002)
        for contour in contours:
            x, y, rect_w, rect_h = cv2.boundingRect(contour)
            if rect_h <= 0:
                continue
            aspect_ratio = rect_w / rect_h
            area = rect_w * rect_h
            if 1.8 <= aspect_ratio <= 7.0 and area >= min_area and rect_w >= 35 and rect_h >= 10:
                lower_bonus = y / max(height, 1) * 0.25
                shape_score = max(0.0, 1.0 - abs(aspect_ratio - 4.2) / 4.2)
                candidate = self._candidate_from_rect(vehicle_crop, x, y, rect_w, rect_h, 0.45 + shape_score + lower_bonus)
                if candidate:
                    candidates.append(candidate)

        hsv = cv2.cvtColor(vehicle_crop, cv2.COLOR_BGR2HSV)
        yellow_mask = cv2.inRange(hsv, (15, 50, 80), (40, 255, 255))
        white_mask = cv2.inRange(hsv, (0, 0, 135), (180, 80, 255))
        color_mask = cv2.morphologyEx(cv2.bitwise_or(yellow_mask, white_mask), cv2.MORPH_CLOSE, kernel)
        color_contours, _ = cv2.findContours(color_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for contour in color_contours:
            x, y, rect_w, rect_h = cv2.boundingRect(contour)
            if rect_h <= 0:
                continue
            aspect_ratio = rect_w / rect_h
            area = rect_w * rect_h
            if 1.8 <= aspect_ratio <= 7.5 and area >= min_area and rect_w >= 35 and rect_h >= 10:
                candidate = self._candidate_from_rect(vehicle_crop, x, y, rect_w, rect_h, 0.75 + y / max(height, 1) * 0.25)
                if candidate:
                    candidates.append(candidate)

        unique: dict[tuple[int, int, int, int], PlateCandidate] = {}
        for candidate in sorted(candidates, key=lambda item: item.score, reverse=True):
            unique.setdefault(candidate.bbox_xyxy, candidate)
        return list(unique.values())[:12]

    def process_plate_crop(self, image: np.ndarray) -> OCRResult | None:
        best_result: OCRResult | None = None
        best_score = 0.0

        for result in self._read_text(image):
            length_bonus = min(len(result.normalized), 10) / 10.0 * 0.05
            score = result.confidence + length_bonus
            if score > best_score:
                best_score = score
                best_result = result

        return best_result

    def detect_vehicles(self, frame: np.ndarray, confidence_threshold: float = 0.35) -> list[VehicleDetection]:
        frame_height, frame_width = frame.shape[:2]
        self._ensure_yolo()
        if self._yolo_model is None or not self._yolo_class_ids:
            return [VehicleDetection("vehicle", 0.0, (0, 0, frame_width, frame_height))]

        try:
            results = self._yolo_model(
                frame,
                classes=self._yolo_class_ids,
                conf=confidence_threshold,
                verbose=False,
            )
        except Exception:
            return [VehicleDetection("vehicle", 0.0, (0, 0, frame_width, frame_height))]

        detections: list[VehicleDetection] = []
        if not results or results[0].boxes is None:
            return detections

        boxes = results[0].boxes
        xyxy = boxes.xyxy.cpu().numpy()
        confidences = boxes.conf.cpu().numpy() if boxes.conf is not None else np.zeros(len(xyxy))
        class_ids = boxes.cls.cpu().numpy().astype(int) if boxes.cls is not None else np.zeros(len(xyxy), dtype=int)

        for index, box in enumerate(xyxy):
            x1, y1, x2, y2 = self._clamp_bbox(tuple(box), frame_width, frame_height, padding=8)
            if x2 <= x1 or y2 <= y1:
                continue
            label = str(self._yolo_model.names[int(class_ids[index])])
            detections.append(
                VehicleDetection(
                    vehicle_type=label,
                    confidence=float(confidences[index]),
                    bbox_xyxy=(x1, y1, x2, y2),
                )
            )

        return sorted(detections, key=lambda item: item.confidence, reverse=True)

    def analyze_frame(self, frame: np.ndarray) -> list[ANPRCapture]:
        frame_height, frame_width = frame.shape[:2]
        vehicles = self.detect_vehicles(frame)
        if not vehicles:
            vehicles = [VehicleDetection("vehicle", 0.0, (0, 0, frame_width, frame_height))]

        captures: list[ANPRCapture] = []
        seen_plates: set[str] = set()

        for vehicle in vehicles:
            x1, y1, x2, y2 = vehicle.bbox_xyxy
            vehicle_crop = frame[y1:y2, x1:x2]
            if vehicle_crop.size == 0:
                continue

            best_result: OCRResult | None = None
            best_candidate: PlateCandidate | None = None
            best_score = 0.0
            for candidate in self.find_plate_candidates(vehicle_crop):
                result = self.process_plate_crop(candidate.image)
                if result is None:
                    continue
                score = result.confidence + candidate.score * 0.08
                if score > best_score:
                    best_score = score
                    best_result = result
                    best_candidate = candidate

            if best_result is None or best_candidate is None:
                continue

            plate_number = self.normalize_plate(best_result.normalized)
            if plate_number in seen_plates:
                continue
            seen_plates.add(plate_number)

            px1, py1, px2, py2 = best_candidate.bbox_xyxy
            captures.append(
                ANPRCapture(
                    raw_text=best_result.raw_text,
                    plate_number=plate_number,
                    plate_confidence=max(0.0, min(1.0, best_result.confidence)),
                    vehicle_type=vehicle.vehicle_type,
                    vehicle_confidence=max(0.0, min(1.0, vehicle.confidence)),
                    vehicle_bbox_xyxy=vehicle.bbox_xyxy,
                    plate_bbox_xyxy=(x1 + px1, y1 + py1, x1 + px2, y1 + py2),
                )
            )

        return captures


anpr_service = ANPRService()
