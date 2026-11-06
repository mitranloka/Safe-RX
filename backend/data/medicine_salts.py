"""Local prototype list of medicine names and their active salts.

This dictionary stands in for a future PostgreSQL medicines table.
Keys are normalized names (see services.safe_guard.normalize_medicine_name).
"""

MEDICINE_SALTS: dict[str, str] = {
    "dolo 650": "Paracetamol",
    "calpol 650": "Paracetamol",
    "cetirizine": "Cetirizine",
    "crocin 650": "Paracetamol",
    "allegra": "Fexofenadine",
    "azithral 500": "Azithromycin",
}
