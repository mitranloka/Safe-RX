"""
SAFE-Rx Medicine Catalog Data
=============================
Curated prototype catalog of medicines used by the local OCR prescription
extraction service (backend/services/ocr_service.py).

ACADEMIC PROTOTYPE NOTICE
-------------------------
This catalog is built strictly for educational demonstration in a 2nd-year
Computer Science Engineering project. It is NOT a comprehensive medical database,
clinical formulary, or certified pharmacy repository. It must NOT be used for
clinical decision-making, diagnosis, or prescription validation without
consulting a qualified healthcare professional or licensed pharmacist.

Contains common outpatient prescriptions (analgesics, PPIs, antihistamines,
antibiotics, chronic care, vitamins, and RxHandBD prototype medicines).

Design Principles
-----------------
1. Structured definitions: Each medicine has a canonical brand name,
   generic active ingredient (salt), default strength, and category.
2. Canonical lookup mapping: Entries are indexed by lowercase, normalized
   search tokens (including common strength suffixes and generic names).
3. Conservative matching: Keys are sorted longest-first so specific keys
   (e.g., 'pan 40') take precedence over base keys (e.g., 'pan').
4. No guessing: If a word is not present in this catalog, no candidate is
   extracted. The patient/user must verify and add medicines manually.
"""

from typing import Dict, List, TypedDict


class MedicineItem(TypedDict):
    brand: str
    salt: str
    strength: str
    category: str


# ---------------------------------------------------------------------------
# Structured Medicine Definitions
# ---------------------------------------------------------------------------
# Format: list of definitions with canonical info and lookup aliases.
# ---------------------------------------------------------------------------
PROTOTYPE_MEDICINES: List[Dict[str, any]] = [
    # -----------------------------------------------------------------------
    # 1. Antipyretics, Analgesics & NSAIDs
    # -----------------------------------------------------------------------
    {
        "brand": "Dolo 650",
        "salt": "Paracetamol",
        "strength": "650 mg",
        "category": "Antipyretic / Analgesic",
        "aliases": ["dolo 650", "dolo"],
    },
    {
        "brand": "Calpol 650",
        "salt": "Paracetamol",
        "strength": "650 mg",
        "category": "Antipyretic / Analgesic",
        "aliases": ["calpol 650", "calpol"],
    },
    {
        "brand": "Crocin 650",
        "salt": "Paracetamol",
        "strength": "650 mg",
        "category": "Antipyretic / Analgesic",
        "aliases": ["crocin 650", "crocin"],
    },
    {
        "brand": "Napa",
        "salt": "Paracetamol",
        "strength": "500 mg",
        "category": "Antipyretic / Analgesic",
        "aliases": ["napa 500", "napa"],
    },
    {
        "brand": "Paracetamol",
        "salt": "Paracetamol",
        "strength": "500 mg",
        "category": "Antipyretic / Analgesic",
        "aliases": ["paracetamol 500", "paracetamol 650", "paracetamol"],
    },
    {
        "brand": "Combiflam",
        "salt": "Ibuprofen and Paracetamol",
        "strength": "400 mg",
        "category": "NSAID / Analgesic Combination",
        "aliases": ["combiflam"],
    },
    {
        "brand": "Ibuprofen",
        "salt": "Ibuprofen",
        "strength": "400 mg",
        "category": "NSAID",
        "aliases": ["ibuprofen 400", "ibuprofen 200", "ibuprofen"],
    },
    {
        "brand": "Meftal Spas",
        "salt": "Mefenamic Acid and Dicyclomine",
        "strength": "250 mg",
        "category": "Antispasmodic / Analgesic",
        "aliases": ["meftal spas", "meftal"],
    },
    {
        "brand": "Voveran 50",
        "salt": "Diclofenac",
        "strength": "50 mg",
        "category": "NSAID",
        "aliases": ["voveran 50", "voveran sr", "voveran"],
    },
    {
        "brand": "Diclofenac",
        "salt": "Diclofenac",
        "strength": "50 mg",
        "category": "NSAID",
        "aliases": ["diclofenac 50", "diclofenac"],
    },
    {
        "brand": "Zerodol P",
        "salt": "Aceclofenac and Paracetamol",
        "strength": "100 mg",
        "category": "NSAID / Analgesic Combination",
        "aliases": ["zerodol p", "zerodol"],
    },
    {
        "brand": "Aceclofenac",
        "salt": "Aceclofenac",
        "strength": "100 mg",
        "category": "NSAID",
        "aliases": ["aceclofenac 100", "aceclofenac"],
    },
    {
        "brand": "Dexter",
        "salt": "Dexibuprofen",
        "strength": "300 mg",
        "category": "NSAID",
        "aliases": ["dexter 300", "dexter"],
    },
    {
        "brand": "Voltalin",
        "salt": "Diclofenac",
        "strength": "50 mg",
        "category": "NSAID",
        "aliases": ["voltalin 50", "voltalin"],
    },
    {
        "brand": "Algin",
        "salt": "Timonium Methylsulphate",
        "strength": "50 mg",
        "category": "Antispasmodic",
        "aliases": ["algin 50", "algin"],
    },

    # -----------------------------------------------------------------------
    # 2. Gastrointestinal, Antacids & Proton Pump Inhibitors (PPIs)
    # -----------------------------------------------------------------------
    {
        "brand": "Pan 40",
        "salt": "Pantoprazole",
        "strength": "40 mg",
        "category": "Proton Pump Inhibitor (PPI)",
        "aliases": ["pan 40", "pan d", "pan"],
    },
    {
        "brand": "Pantocid 40",
        "salt": "Pantoprazole",
        "strength": "40 mg",
        "category": "Proton Pump Inhibitor (PPI)",
        "aliases": ["pantocid 40", "pantocid"],
    },
    {
        "brand": "Pantoprazole",
        "salt": "Pantoprazole",
        "strength": "40 mg",
        "category": "Proton Pump Inhibitor (PPI)",
        "aliases": ["pantoprazole 40", "pantoprazole"],
    },
    {
        "brand": "Omez 20",
        "salt": "Omeprazole",
        "strength": "20 mg",
        "category": "Proton Pump Inhibitor (PPI)",
        "aliases": ["omez 20", "omez d", "omez"],
    },
    {
        "brand": "Omeprazole",
        "salt": "Omeprazole",
        "strength": "20 mg",
        "category": "Proton Pump Inhibitor (PPI)",
        "aliases": ["omeprazole 20", "omeprazole"],
    },
    {
        "brand": "Nexe",
        "salt": "Esomeprazole",
        "strength": "20 mg",
        "category": "Proton Pump Inhibitor (PPI)",
        "aliases": ["nexe 20", "nexe 40", "nexe"],
    },
    {
        "brand": "Esomeprazole",
        "salt": "Esomeprazole",
        "strength": "20 mg",
        "category": "Proton Pump Inhibitor (PPI)",
        "aliases": ["esomeprazole 40", "esomeprazole 20", "esomeprazole"],
    },
    {
        "brand": "Rantac 150",
        "salt": "Ranitidine",
        "strength": "150 mg",
        "category": "H2 Receptor Blocker",
        "aliases": ["rantac 150", "rantac"],
    },
    {
        "brand": "Gelusil",
        "salt": "Aluminium Hydroxide and Magnesium Hydroxide",
        "strength": "200 mg",
        "category": "Antacid",
        "aliases": ["gelusil mps", "gelusil"],
    },
    {
        "brand": "Digene",
        "salt": "Magnesium Hydroxide and Aluminium Hydroxide",
        "strength": "200 mg",
        "category": "Antacid",
        "aliases": ["digene"],
    },

    # -----------------------------------------------------------------------
    # 3. Antihistamines, Respiratory & Allergy
    # -----------------------------------------------------------------------
    {
        "brand": "Cetirizine",
        "salt": "Cetirizine",
        "strength": "10 mg",
        "category": "Antihistamine",
        "aliases": ["cetirizine 10", "cetirizine"],
    },
    {
        "brand": "Zyrtec 10",
        "salt": "Cetirizine",
        "strength": "10 mg",
        "category": "Antihistamine",
        "aliases": ["zyrtec 10", "zyrtec"],
    },
    {
        "brand": "Allegra 120",
        "salt": "Fexofenadine",
        "strength": "120 mg",
        "category": "Antihistamine",
        "aliases": ["allegra 120", "allegra 180"],
    },
    {
        "brand": "Allegra",
        "salt": "Fexofenadine",
        "strength": "120 mg",
        "category": "Antihistamine",
        "aliases": ["allegra"],
    },
    {
        "brand": "Montair LC",
        "salt": "Montelukast and Levocetirizine",
        "strength": "10 mg",
        "category": "Antiallergic / Bronchodilator",
        "aliases": ["montair lc", "montair"],
    },
    {
        "brand": "Levocetirizine",
        "salt": "Levocetirizine",
        "strength": "5 mg",
        "category": "Antihistamine",
        "aliases": ["levocetirizine 5", "levocetirizine", "levocet"],
    },
    {
        "brand": "Avil 25",
        "salt": "Pheniramine Maleate",
        "strength": "25 mg",
        "category": "Antihistamine",
        "aliases": ["avil 25", "avil 50", "avil"],
    },
    {
        "brand": "Ascoril",
        "salt": "Ambroxol, Levosalbutamol and Guaifenesin",
        "strength": "100 ml",
        "category": "Cough Expectorant",
        "aliases": ["ascoril ls", "ascoril d", "ascoril"],
    },
    {
        "brand": "Benadryl",
        "salt": "Diphenhydramine",
        "strength": "100 ml",
        "category": "Cough Syrup",
        "aliases": ["benadryl dr", "benadryl"],
    },

    # -----------------------------------------------------------------------
    # 4. Antibiotics & Antimicrobials
    # -----------------------------------------------------------------------
    {
        "brand": "Augmentin 625 Duo",
        "salt": "Amoxicillin and Clavulanic Acid",
        "strength": "625 mg",
        "category": "Antibiotic (Penicillin / Beta-lactamase)",
        "aliases": ["augmentin 625 duo", "augmentin 625", "augmentin duo", "augmentin"],
    },
    {
        "brand": "Azithral 500",
        "salt": "Azithromycin",
        "strength": "500 mg",
        "category": "Antibiotic (Macrolide)",
        "aliases": ["azithral 500", "azithral"],
    },
    {
        "brand": "Azithromycin",
        "salt": "Azithromycin",
        "strength": "500 mg",
        "category": "Antibiotic (Macrolide)",
        "aliases": ["azithromycin 500", "azithromycin 250", "azithromycin"],
    },
    {
        "brand": "Amoxicillin",
        "salt": "Amoxicillin",
        "strength": "500 mg",
        "category": "Antibiotic (Penicillin)",
        "aliases": ["amoxicillin 500", "amoxicillin 250", "amoxicillin"],
    },
    {
        "brand": "Ciprobid 500",
        "salt": "Ciprofloxacin",
        "strength": "500 mg",
        "category": "Antibiotic (Fluoroquinolone)",
        "aliases": ["ciprobid 500", "ciprobid", "ciprofloxacin 500", "ciprofloxacin"],
    },
    {
        "brand": "Zenflox 200",
        "salt": "Ofloxacin",
        "strength": "200 mg",
        "category": "Antibiotic (Fluoroquinolone)",
        "aliases": ["zenflox 200", "zenflox", "ofloxacin 200", "ofloxacin"],
    },
    {
        "brand": "Doxycycline",
        "salt": "Doxycycline",
        "strength": "100 mg",
        "category": "Antibiotic (Tetracycline)",
        "aliases": ["doxycycline 100", "doxt sl", "doxycycline"],
    },
    {
        "brand": "Metrogyl 400",
        "salt": "Metronidazole",
        "strength": "400 mg",
        "category": "Antimicrobial / Antiprotozoal",
        "aliases": ["metrogyl 400", "metrogyl", "metronidazole 400", "metronidazole"],
    },
    {
        "brand": "Taxim O 200",
        "salt": "Cefixime",
        "strength": "200 mg",
        "category": "Antibiotic (Cephalosporin)",
        "aliases": ["taxim o 200", "taxim o", "taximo 200", "taximo", "cefixime 200", "cefixime"],
    },

    # -----------------------------------------------------------------------
    # 5. Cardiovascular, Metabolic & Chronic Care
    # -----------------------------------------------------------------------
    {
        "brand": "Amlong 5",
        "salt": "Amlodipine",
        "strength": "5 mg",
        "category": "Antihypertensive (Calcium Channel Blocker)",
        "aliases": ["amlong 5", "amlong 10", "amlong", "amlodipine 5", "amlodipine 10", "amlodipine"],
    },
    {
        "brand": "Telma 40",
        "salt": "Telmisartan",
        "strength": "40 mg",
        "category": "Antihypertensive (ARB)",
        "aliases": ["telma 40", "telma 20", "telma h", "telma", "telmisartan 40", "telmisartan"],
    },
    {
        "brand": "Atorva 10",
        "salt": "Atorvastatin",
        "strength": "10 mg",
        "category": "Lipid-Lowering (Statin)",
        "aliases": ["atorva 10", "atorva 20", "atorva", "atorvastatin 10", "atorvastatin 20", "atorvastatin"],
    },
    {
        "brand": "Glycomet 500",
        "salt": "Metformin",
        "strength": "500 mg",
        "category": "Antidiabetic (Biguanide)",
        "aliases": ["glycomet 500", "glycomet 850", "glycomet gp", "glycomet"],
    },
    {
        "brand": "Metformin",
        "salt": "Metformin",
        "strength": "500 mg",
        "category": "Antidiabetic (Biguanide)",
        "aliases": ["metformin 500", "metformin 850", "metformin 1000", "metformin"],
    },
    {
        "brand": "Amaryl 1",
        "salt": "Glimepiride",
        "strength": "1 mg",
        "category": "Antidiabetic (Sulfonylurea)",
        "aliases": ["amaryl 1", "amaryl 2", "amaryl", "glimepiride 1", "glimepiride 2", "glimepiride"],
    },

    # -----------------------------------------------------------------------
    # 6. Vitamins, Minerals & Supplements
    # -----------------------------------------------------------------------
    {
        "brand": "Becosules",
        "salt": "Vitamin B-Complex with Vitamin C",
        "strength": "1 capsule",
        "category": "Vitamin Supplement",
        "aliases": ["becosules z", "becosules"],
    },
    {
        "brand": "Shelcal 500",
        "salt": "Calcium and Vitamin D3",
        "strength": "500 mg",
        "category": "Mineral / Vitamin Supplement",
        "aliases": ["shelcal 500", "shelcal hd", "shelcal"],
    },
    {
        "brand": "Limcee 500",
        "salt": "Ascorbic Acid (Vitamin C)",
        "strength": "500 mg",
        "category": "Vitamin Supplement",
        "aliases": ["limcee 500", "limcee"],
    },
    {
        "brand": "Zincovit",
        "salt": "Multivitamin and Multimineral",
        "strength": "1 tablet",
        "category": "Multivitamin Supplement",
        "aliases": ["zincovit"],
    },
]


def _build_catalog_lookup() -> Dict[str, Dict[str, str]]:
    """
    Builds the flat search lookup dictionary mapping normalized alias keys
    to candidate metadata dicts {brand, salt, strength}.
    """
    catalog: Dict[str, Dict[str, str]] = {}
    for item in PROTOTYPE_MEDICINES:
        info = {
            "brand": item["brand"],
            "salt": item["salt"],
            "strength": item["strength"],
            "category": item.get("category", "General Medication"),
        }
        for alias in item["aliases"]:
            clean_alias = alias.strip().lower()
            if clean_alias:
                catalog[clean_alias] = info
    return catalog


# Pre-built flat lookup mapping for OCR extraction matching
KNOWN_MEDICINES: Dict[str, Dict[str, str]] = _build_catalog_lookup()

# Sorted keys (longest first) to guarantee specific multi-word tokens match first
CATALOG_KEYS_SORTED: List[str] = sorted(KNOWN_MEDICINES.keys(), key=lambda k: -len(k))


def get_catalog_stats() -> Dict[str, int]:
    """Returns metadata summary count for diagnostics and tests."""
    return {
        "definitions_count": len(PROTOTYPE_MEDICINES),
        "lookup_keys_count": len(KNOWN_MEDICINES),
    }
