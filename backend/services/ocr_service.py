"""
SAFE-Rx Backend OCR Service
===========================
Provides free, local-only optical character recognition (OCR) for uploaded
prescriptions using RapidOCR (ONNX runtime) and pypdfium2 for PDF rendering.

Zero external AI APIs or paid cloud services.
"""

import io
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from PIL import Image, UnidentifiedImageError
import numpy as np
from rapidocr_onnxruntime import RapidOCR
import pypdfium2 as pdfium

# ---------------------------------------------------------------------------
# Supported Formats
# ---------------------------------------------------------------------------
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}
SUPPORTED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/webp", "image/jpg",
    "application/pdf", "application/octet-stream"
}

# ---------------------------------------------------------------------------
# Known Medicines Catalog (SAFE-Guard, SAFE-Save, and common prescriptions)
# ---------------------------------------------------------------------------
KNOWN_MEDICINES: Dict[str, Dict[str, str]] = {
    "dolo 650": {"brand": "Dolo 650", "salt": "Paracetamol", "strength": "650 mg"},
    "dolo": {"brand": "Dolo 650", "salt": "Paracetamol", "strength": "650 mg"},
    "calpol 650": {"brand": "Calpol 650", "salt": "Paracetamol", "strength": "650 mg"},
    "calpol": {"brand": "Calpol 650", "salt": "Paracetamol", "strength": "650 mg"},
    "crocin 650": {"brand": "Crocin 650", "salt": "Paracetamol", "strength": "650 mg"},
    "crocin": {"brand": "Crocin 650", "salt": "Paracetamol", "strength": "500 mg"},
    "cetirizine": {"brand": "Cetirizine", "salt": "Cetirizine", "strength": "10 mg"},
    "zyrtec 10": {"brand": "Zyrtec 10", "salt": "Cetirizine", "strength": "10 mg"},
    "zyrtec": {"brand": "Zyrtec 10", "salt": "Cetirizine", "strength": "10 mg"},
    "allegra 120": {"brand": "Allegra 120", "salt": "Fexofenadine", "strength": "120 mg"},
    "allegra": {"brand": "Allegra", "salt": "Fexofenadine", "strength": "120 mg"},
    "pantocid 40": {"brand": "Pantocid 40", "salt": "Pantoprazole", "strength": "40 mg"},
    "pantocid": {"brand": "Pantocid 40", "salt": "Pantoprazole", "strength": "40 mg"},
    "augmentin 625 duo": {"brand": "Augmentin 625 Duo", "salt": "Amoxicillin and Clavulanic Acid", "strength": "625 mg"},
    "augmentin": {"brand": "Augmentin", "salt": "Amoxicillin and Clavulanic Acid", "strength": "625 mg"},
    "azithral 500": {"brand": "Azithral 500", "salt": "Azithromycin", "strength": "500 mg"},
    "azithral": {"brand": "Azithral 500", "salt": "Azithromycin", "strength": "500 mg"},
    "napa": {"brand": "Napa", "salt": "Paracetamol", "strength": "500 mg"},
    "omeprazole": {"brand": "Omeprazole", "salt": "Omeprazole", "strength": "20 mg"},
    "nexe": {"brand": "Nexe", "salt": "Esomeprazole", "strength": "20 mg"},
    "dexter": {"brand": "Dexter", "salt": "Dexibuprofen", "strength": "300 mg"},
    "voltalin": {"brand": "Voltalin", "salt": "Diclofenac", "strength": "50 mg"},
    "algin": {"brand": "Algin", "salt": "Timonium Methylsulphate", "strength": "50 mg"},
    "paracetamol": {"brand": "Paracetamol", "salt": "Paracetamol", "strength": "500 mg"},
    "amoxicillin": {"brand": "Amoxicillin", "salt": "Amoxicillin", "strength": "500 mg"},
    "metformin": {"brand": "Metformin", "salt": "Metformin", "strength": "500 mg"},
    "ibuprofen": {"brand": "Ibuprofen", "salt": "Ibuprofen", "strength": "400 mg"},
    "pantoprazole": {"brand": "Pantoprazole", "salt": "Pantoprazole", "strength": "40 mg"},
}

STRENGTH_REGEX = re.compile(r"\b(\d+(?:\.\d+)?\s*(?:mg|g|mcg|ml))\b", re.IGNORECASE)
FREQUENCY_REGEX = re.compile(
    r"\b(once\s+daily|twice\s+daily|thrice\s+daily|three\s+times\s+daily|every\s+\d+\s+hours|at\s+night|in\s+the\s+morning|od|bd|tds|tid|qid|sos)\b",
    re.IGNORECASE
)
DURATION_REGEX = re.compile(r"\b(\d+\s*(?:days?|weeks?|months?))\b", re.IGNORECASE)

# ---------------------------------------------------------------------------
# Singleton OCR Engine
# ---------------------------------------------------------------------------
_OCR_ENGINE: Optional[RapidOCR] = None


def get_ocr_engine() -> RapidOCR:
    global _OCR_ENGINE
    if _OCR_ENGINE is None:
        _OCR_ENGINE = RapidOCR()
    return _OCR_ENGINE


def extract_prescription_text(file_bytes: bytes, filename: str = "", content_type: str = "") -> dict:
    """
    Runs local OCR on an uploaded prescription image or PDF, extracts text lines,
    and identifies candidate medicines.
    """
    # 1. Format validation
    ext = Path(filename).suffix.lower() if filename else ""
    if ext and ext not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Unsupported file format '{ext}'. Supported formats: JPG, PNG, WEBP, PDF.")

    if not file_bytes or len(file_bytes) == 0:
        raise ValueError("Uploaded prescription file is empty.")

    # 2. Decode file to RGB numpy array
    np_image = None

    if ext == ".pdf" or (content_type and "pdf" in content_type.lower()):
        try:
            pdf = pdfium.PdfDocument(io.BytesIO(file_bytes))
            if len(pdf) == 0:
                raise ValueError("Uploaded PDF contains no pages.")
            page = pdf[0]
            # Render page at 2x resolution for clear OCR
            pil_image = page.render(scale=2.0).to_pil().convert("RGB")
            np_image = np.array(pil_image)
        except Exception as e:
            raise ValueError(f"Could not render PDF document for OCR: {str(e)}")
    else:
        try:
            pil_image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
            np_image = np.array(pil_image)
        except (UnidentifiedImageError, Exception) as e:
            raise ValueError(f"Corrupt or unreadable image file: {str(e)}")

    # 3. Run RapidOCR
    engine = get_ocr_engine()
    ocr_results, elapse = engine(np_image)

    detected_lines = []
    raw_text_parts = []

    if ocr_results:
        for item in ocr_results:
            # item format: [box, text, score]
            text = str(item[1]).strip()
            score = float(item[2])
            if text:
                detected_lines.append({
                    "text": text,
                    "score": round(score * 100, 1),
                    "box": item[0]
                })
                raw_text_parts.append(text)

    full_text = "\n".join(raw_text_parts)

    # 4. Identify medicine candidates from detected lines
    candidate_medicines = identify_medicines_from_lines(detected_lines)

    if candidate_medicines:
        message = f"Extracted {len(candidate_medicines)} candidate medicine(s) using local OCR."
    elif detected_lines:
        message = "Text was extracted from the prescription, but no known medicines were confidently identified. You can review the extracted text and add medicines manually."
    else:
        message = "No readable text was detected by the local OCR engine. You can add medicines manually on the verification page."

    return {
        "success": True,
        "raw_text": full_text,
        "line_count": len(detected_lines),
        "lines": detected_lines,
        "medicines": candidate_medicines,
        "engine": "RapidOCR (Local ONNX)",
        "message": message
    }


def identify_medicines_from_lines(lines: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Parses OCR lines against known medicine brand/generic names and regex patterns.
    Does not invent hallucinated medicine names if none are found.
    """
    found: List[Dict[str, Any]] = []
    seen_brands = set()

    for item in lines:
        text = item["text"]
        score = item["score"]
        # Separate letter-digit boundaries (e.g. Calpol650 -> Calpol 650, 650mg -> 650 mg)
        normalized = re.sub(r"([a-zA-Z]+)(\d+)", r"\1 \2", text)
        normalized = re.sub(r"(\d+)([a-zA-Z]+)", r"\1 \2", normalized)
        clean = re.sub(r"[^a-zA-Z0-9\s]", " ", normalized).strip().lower()

        # Check sorted by longest pattern first
        for key in sorted(KNOWN_MEDICINES.keys(), key=lambda x: -len(x)):
            pattern = r"\b" + re.escape(key) + r"\b"
            if re.search(pattern, clean):
                info = KNOWN_MEDICINES[key]
                brand_key = info["brand"].lower()
                if brand_key in seen_brands:
                    continue
                seen_brands.add(brand_key)

                # Extract dosage strength from line or fallback to catalog default
                str_match = STRENGTH_REGEX.search(text)
                strength = str_match.group(1).strip() if str_match else info["strength"]

                freq_match = FREQUENCY_REGEX.search(text)
                freq = freq_match.group(1).strip().title() if freq_match else "As directed"

                dur_match = DURATION_REGEX.search(text)
                duration = dur_match.group(1).strip() if dur_match else "3 days"

                found.append({
                    "id": f"med-ocr-{len(found) + 1}",
                    "brandName": info["brand"],
                    "activeIngredient": info["salt"],
                    "strength": strength,
                    "dosage": "1 tablet",
                    "frequency": freq,
                    "duration": duration,
                    "confidence": score
                })
                break  # avoid multiple sub-matches for same line

    return found
