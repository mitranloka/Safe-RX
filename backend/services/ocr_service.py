"""
SAFE-Rx Backend OCR Service
===========================
Provides free, local-only optical character recognition (OCR) for uploaded
prescriptions using RapidOCR (ONNX runtime) and pypdfium2 for PDF rendering.

Zero external AI APIs or paid cloud services.

Medicine Candidate Extraction Strategy
---------------------------------------
1. Normalise each OCR line to handle joined tokens (Dolo650 → Dolo 650),
   case differences, extra spaces, and common punctuation.
2. Match the normalised text against the KNOWN_MEDICINES catalog by searching
   for the longest catalog key that appears as a whole word within the line.
   Matching is conservative – no fuzzy / edit-distance guessing.
3. Extract strength, frequency, and duration from the same OCR line when
   clearly present; fall back to catalog defaults otherwise.
4. De-duplicate: each canonical brand name is returned at most once even if
   the same medicine appears on multiple OCR lines.
5. If no catalog key matches a line, that line yields no candidate – we never
   invent or guess a medicine name.
"""

import io
import re
from pathlib import Path
from typing import Any, Dict, List, Optional
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
    "application/pdf", "application/octet-stream",
}

# ---------------------------------------------------------------------------
# Known Medicines Catalog
# ---------------------------------------------------------------------------
# Keys are the canonical lookup tokens (lowercase, space-separated).
# Each entry must have: brand, salt, strength.
# Longer / more-specific keys are preferred at match time (sorted by length
# descending), so "dolo 650" beats "dolo" when both could match.
# ---------------------------------------------------------------------------
KNOWN_MEDICINES: Dict[str, Dict[str, str]] = {
    # Paracetamol brands
    "dolo 650":          {"brand": "Dolo 650",         "salt": "Paracetamol",                   "strength": "650 mg"},
    "dolo":              {"brand": "Dolo 650",         "salt": "Paracetamol",                   "strength": "650 mg"},
    "calpol 650":        {"brand": "Calpol 650",       "salt": "Paracetamol",                   "strength": "650 mg"},
    "calpol":            {"brand": "Calpol 650",       "salt": "Paracetamol",                   "strength": "650 mg"},
    "crocin 650":        {"brand": "Crocin 650",       "salt": "Paracetamol",                   "strength": "650 mg"},
    "crocin":            {"brand": "Crocin 650",       "salt": "Paracetamol",                   "strength": "500 mg"},
    "napa":              {"brand": "Napa",             "salt": "Paracetamol",                   "strength": "500 mg"},
    "paracetamol":       {"brand": "Paracetamol",      "salt": "Paracetamol",                   "strength": "500 mg"},
    # Anti-histamines
    "cetirizine":        {"brand": "Cetirizine",       "salt": "Cetirizine",                    "strength": "10 mg"},
    "zyrtec 10":         {"brand": "Zyrtec 10",        "salt": "Cetirizine",                    "strength": "10 mg"},
    "zyrtec":            {"brand": "Zyrtec 10",        "salt": "Cetirizine",                    "strength": "10 mg"},
    "allegra 120":       {"brand": "Allegra 120",      "salt": "Fexofenadine",                  "strength": "120 mg"},
    "allegra":           {"brand": "Allegra",          "salt": "Fexofenadine",                  "strength": "120 mg"},
    # PPIs
    "pantocid 40":       {"brand": "Pantocid 40",      "salt": "Pantoprazole",                  "strength": "40 mg"},
    "pantocid":          {"brand": "Pantocid 40",      "salt": "Pantoprazole",                  "strength": "40 mg"},
    "omeprazole":        {"brand": "Omeprazole",       "salt": "Omeprazole",                    "strength": "20 mg"},
    "pantoprazole":      {"brand": "Pantoprazole",     "salt": "Pantoprazole",                  "strength": "40 mg"},
    "nexe":              {"brand": "Nexe",             "salt": "Esomeprazole",                  "strength": "20 mg"},
    # Antibiotics
    "augmentin 625 duo": {"brand": "Augmentin 625 Duo", "salt": "Amoxicillin and Clavulanic Acid", "strength": "625 mg"},
    "augmentin":         {"brand": "Augmentin",        "salt": "Amoxicillin and Clavulanic Acid", "strength": "625 mg"},
    "azithral 500":      {"brand": "Azithral 500",     "salt": "Azithromycin",                  "strength": "500 mg"},
    "azithral":          {"brand": "Azithral 500",     "salt": "Azithromycin",                  "strength": "500 mg"},
    "amoxicillin":       {"brand": "Amoxicillin",      "salt": "Amoxicillin",                   "strength": "500 mg"},
    # NSAIDs / analgesics
    "ibuprofen":         {"brand": "Ibuprofen",        "salt": "Ibuprofen",                     "strength": "400 mg"},
    "dexter":            {"brand": "Dexter",           "salt": "Dexibuprofen",                  "strength": "300 mg"},
    "voltalin":          {"brand": "Voltalin",         "salt": "Diclofenac",                    "strength": "50 mg"},
    "algin":             {"brand": "Algin",            "salt": "Timonium Methylsulphate",        "strength": "50 mg"},
    # Other
    "metformin":         {"brand": "Metformin",        "salt": "Metformin",                     "strength": "500 mg"},
}

# Pre-compute sorted keys (longest first) so more-specific keys win.
_CATALOG_KEYS_SORTED: List[str] = sorted(KNOWN_MEDICINES.keys(), key=lambda k: -len(k))

# ---------------------------------------------------------------------------
# Detail-extraction regexes
# ---------------------------------------------------------------------------
# Strength: a number (possibly decimal) followed immediately or with a space
# by a unit.  Handles joined tokens like "650mg" via normalisation below.
STRENGTH_REGEX = re.compile(
    r"\b(\d+(?:\.\d+)?\s*(?:mg|g|mcg|ml))\b", re.IGNORECASE
)

# Frequency: common abbreviations and English phrases used in Indian prescriptions.
FREQUENCY_REGEX = re.compile(
    r"\b("
    r"once\s+daily|twice\s+daily|thrice\s+daily|three\s+times\s+(?:a\s+)?daily"
    r"|every\s+\d+\s+hours?"
    r"|at\s+night|in\s+the\s+morning|before\s+meals?|after\s+meals?"
    r"|od|bd|tds|tid|qid|sos"
    r")\b",
    re.IGNORECASE,
)

# Duration: a number + unit (days / weeks / months).
DURATION_REGEX = re.compile(
    r"\b(\d+\s*(?:days?|weeks?|months?))\b", re.IGNORECASE
)

# ---------------------------------------------------------------------------
# Singleton OCR Engine
# ---------------------------------------------------------------------------
_OCR_ENGINE: Optional[RapidOCR] = None


def get_ocr_engine() -> RapidOCR:
    global _OCR_ENGINE
    if _OCR_ENGINE is None:
        _OCR_ENGINE = RapidOCR()
    return _OCR_ENGINE


# ---------------------------------------------------------------------------
# Text normalisation helpers
# ---------------------------------------------------------------------------

def _insert_boundary_spaces(text: str) -> str:
    """
    Insert a space at letter→digit and digit→letter boundaries so that tokens
    like 'Dolo650', 'Calpol650mg', 'Cetirizine10mg' split into recognisable
    words before catalog matching.

    Examples
    --------
    'Dolo650'        → 'Dolo 650'
    'Calpol650mg'    → 'Calpol 650 mg'
    'Cetirizine10mg' → 'Cetirizine 10 mg'
    '650mg'          → '650 mg'
    'DOLO650MG'      → 'DOLO 650 MG'
    """
    text = re.sub(r"([a-zA-Z])(\d)", r"\1 \2", text)
    text = re.sub(r"(\d)([a-zA-Z])", r"\1 \2", text)
    return text


def _normalise_for_matching(raw_text: str) -> str:
    """
    Return a cleaned, lowercase version of *raw_text* suitable for catalog
    matching.  Steps:
      1. Insert spaces at letter/digit boundaries.
      2. Replace any run of non-alphanumeric characters with a single space
         (handles punctuation, hyphens, slashes, dots, brackets …).
      3. Collapse multiple spaces and strip.
      4. Lowercase.
    """
    text = _insert_boundary_spaces(raw_text)
    text = re.sub(r"[^a-zA-Z0-9]+", " ", text)
    text = re.sub(r"\s{2,}", " ", text).strip()
    return text.lower()


def _normalise_for_detail_extraction(raw_text: str) -> str:
    """
    Return a lightly normalised version of *raw_text* used **only** for
    strength / frequency / duration regex extraction.  We insert boundary
    spaces so that '650mg' becomes '650 mg' and the unit regex can fire,
    but we keep the original capitalisation for FREQUENCY_REGEX title-casing.
    """
    text = _insert_boundary_spaces(raw_text)
    # Collapse repeated whitespace
    return re.sub(r"\s{2,}", " ", text).strip()


# ---------------------------------------------------------------------------
# Core public functions
# ---------------------------------------------------------------------------

def extract_prescription_text(
    file_bytes: bytes,
    filename: str = "",
    content_type: str = "",
) -> dict:
    """
    Run local OCR on an uploaded prescription image or PDF, extract text
    lines, and identify candidate medicines.

    Returns a dict with keys:
        success, raw_text, line_count, lines, medicines, engine, message
    """
    # 1. Format validation
    ext = Path(filename).suffix.lower() if filename else ""
    if ext and ext not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file format '{ext}'. Supported formats: JPG, PNG, WEBP, PDF."
        )
    if not file_bytes:
        raise ValueError("Uploaded prescription file is empty.")

    # 2. Decode to RGB numpy array
    if ext == ".pdf" or (content_type and "pdf" in content_type.lower()):
        try:
            pdf = pdfium.PdfDocument(io.BytesIO(file_bytes))
            if len(pdf) == 0:
                raise ValueError("Uploaded PDF contains no pages.")
            page = pdf[0]
            pil_image = page.render(scale=2.0).to_pil().convert("RGB")
            np_image = np.array(pil_image)
        except Exception as exc:
            raise ValueError(f"Could not render PDF document for OCR: {exc}") from exc
    else:
        try:
            pil_image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
            np_image = np.array(pil_image)
        except (UnidentifiedImageError, Exception) as exc:
            raise ValueError(f"Corrupt or unreadable image file: {exc}") from exc

    # 3. Run RapidOCR
    engine = get_ocr_engine()
    ocr_results, _elapse = engine(np_image)

    detected_lines: List[Dict[str, Any]] = []
    raw_text_parts: List[str] = []

    if ocr_results:
        for item in ocr_results:
            text = str(item[1]).strip()
            score = float(item[2])
            if text:
                detected_lines.append({
                    "text": text,
                    "score": round(score * 100, 1),
                    "box": item[0],
                })
                raw_text_parts.append(text)

    full_text = "\n".join(raw_text_parts)

    # 4. Identify candidate medicines
    candidate_medicines = identify_medicines_from_lines(detected_lines)

    if candidate_medicines:
        message = (
            f"Extracted {len(candidate_medicines)} candidate medicine(s) using local OCR. "
            "Please verify all details before proceeding."
        )
    elif detected_lines:
        message = (
            "Text was extracted from the prescription, but no known medicines were "
            "confidently identified. You can review the extracted text and add medicines manually."
        )
    else:
        message = (
            "No readable text was detected by the local OCR engine. "
            "You can add medicines manually on the verification page."
        )

    return {
        "success": True,
        "raw_text": full_text,
        "line_count": len(detected_lines),
        "lines": detected_lines,
        "medicines": candidate_medicines,
        "engine": "RapidOCR (Local ONNX)",
        "message": message,
    }


def identify_medicines_from_lines(lines: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Parse OCR lines against the KNOWN_MEDICINES catalog.

    Rules
    -----
    - Each line is normalised (boundary spaces, lowercase, punctuation stripped)
      before catalog matching.
    - Keys are tried longest-first so the most-specific key wins.
    - Each canonical brand name is emitted at most once (de-duplication).
    - Strength / frequency / duration are extracted from a lightly normalised
      version of the same line; catalog defaults are used when not found.
    - Lines that match no catalog key produce no candidate (no guessing).
    """
    found: List[Dict[str, Any]] = []
    # De-duplicate by canonical brand name (lowercase)
    seen_brands: set = set()

    for item in lines:
        raw_text = item["text"]
        score = item["score"]

        # Normalise for matching
        clean = _normalise_for_matching(raw_text)

        # Normalise for detail extraction (keep original capitalisation for
        # frequency title-casing; units need space separation)
        detail_text = _normalise_for_detail_extraction(raw_text)

        matched_key: Optional[str] = None
        for key in _CATALOG_KEYS_SORTED:
            # Match the catalog key as whole word(s) within the normalised line.
            # re.escape handles multi-word keys like "augmentin 625 duo".
            pattern = r"(?<![a-z])" + re.escape(key) + r"(?![a-z])"
            if re.search(pattern, clean):
                matched_key = key
                break  # longest match wins; stop checking this line

        if matched_key is None:
            continue  # no catalog hit → skip; never guess

        info = KNOWN_MEDICINES[matched_key]
        brand_key = info["brand"].lower()

        if brand_key in seen_brands:
            continue  # duplicate medicine on another line → skip
        seen_brands.add(brand_key)

        # --- Extract strength (from detail_text so "650mg" → "650 mg") ---
        str_match = STRENGTH_REGEX.search(detail_text)
        strength = str_match.group(1).strip() if str_match else info["strength"]
        # Normalise internal space: "650mg" might still need the unit separated
        strength = re.sub(r"(\d)\s*(mg|g|mcg|ml)\b", r"\1 \2", strength, flags=re.IGNORECASE)

        # --- Extract frequency ---
        freq_match = FREQUENCY_REGEX.search(detail_text)
        freq = freq_match.group(1).strip().title() if freq_match else "As directed"

        # --- Extract duration ---
        dur_match = DURATION_REGEX.search(detail_text)
        duration = dur_match.group(1).strip() if dur_match else "3 days"

        found.append({
            "id": f"med-ocr-{len(found) + 1}",
            "brandName": info["brand"],
            "activeIngredient": info["salt"],
            "strength": strength,
            "dosage": "1 tablet",
            "frequency": freq,
            "duration": duration,
            "confidence": score,
        })

    return found
