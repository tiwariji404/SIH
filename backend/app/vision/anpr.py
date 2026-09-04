import cv2
import numpy as np
import re
from dataclasses import dataclass
from typing import Optional, List

try:
    import easyocr
    _reader = easyocr.Reader(['en'], gpu=False) # CPU mode for compatibility
    HAS_EASYOCR = True
except ImportError:
    HAS_EASYOCR = False
    print("WARNING: easyocr not installed. ANPR will be disabled.")

@dataclass
class OCRResult:
    raw_text: str
    normalized: str
    confidence: float
    bbox: tuple

class ANPRService:
    def __init__(self):
        self.reader = _reader if HAS_EASYOCR else None

    def normalize_plate(self, text: str) -> str:
        # Remove non-alphanumeric chars and convert to upper
        normalized = re.sub(r'[^A-Z0-9]', '', text.upper())
        return normalized

    def validate_plate(self, text: str) -> bool:
        # Simple validation: length between 4 and 10 and contains at least 1 letter and 1 number
        if len(text) < 4 or len(text) > 10:
            return False
        has_alpha = any(c.isalpha() for c in text)
        has_num = any(c.isdigit() for c in text)
        return has_alpha and has_num

    def process_plate_crop(self, image: np.ndarray) -> Optional[OCRResult]:
        if not self.reader:
            return None

        # Image Enhancement (grayscale + thresholding) for better OCR
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Applying bilateral filter to remove noise while keeping edges sharp
        gray = cv2.bilateralFilter(gray, 11, 17, 17)
        
        # Read text
        results = self.reader.readtext(gray)
        
        best_result = None
        best_conf = 0.0
        
        for (bbox, text, prob) in results:
            normalized = self.normalize_plate(text)
            if self.validate_plate(normalized) and prob > best_conf:
                best_conf = prob
                best_result = OCRResult(
                    raw_text=text,
                    normalized=normalized,
                    confidence=prob,
                    bbox=bbox
                )
                
        return best_result

anpr_service = ANPRService()
