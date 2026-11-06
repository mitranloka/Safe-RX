"""Local prototype dataset for SAFE-Save.

Each entry maps a normalised medicine name to its active salt, a generic
alternative name, and prototype prices (brand and generic).

IMPORTANT – PROTOTYPE ONLY
All prices and alternatives shown here are illustrative demo data created
for a second-year CSE project.  They are NOT current, official, or
verified.  Users must consult a qualified healthcare professional or an
authorised source before making any purchase or medication decision.
"""

from typing import TypedDict


class SafeSaveEntry(TypedDict):
    active_salt: str
    generic_name: str
    brand_price: float   # prototype INR price per pack
    generic_price: float # prototype INR price per pack
    pack_size: str


# Keys are normalised medicine names (see services.safe_save.normalize_name).
SAFE_SAVE_DATA: dict[str, SafeSaveEntry] = {
    "dolo 650": {
        "active_salt": "Paracetamol",
        "generic_name": "Paracetamol 650 mg Tablet",
        "brand_price": 30.0,
        "generic_price": 12.0,
        "pack_size": "Strip of 15 tablets",
    },
    "calpol 650": {
        "active_salt": "Paracetamol",
        "generic_name": "Paracetamol 650 mg Tablet",
        "brand_price": 36.0,
        "generic_price": 12.0,
        "pack_size": "Strip of 15 tablets",
    },
    "cetirizine": {
        "active_salt": "Cetirizine",
        "generic_name": "Cetirizine 10 mg Tablet",
        "brand_price": 95.0,
        "generic_price": 22.0,
        "pack_size": "Strip of 10 tablets",
    },
    "crocin 650": {
        "active_salt": "Paracetamol",
        "generic_name": "Paracetamol 650 mg Tablet",
        "brand_price": 32.0,
        "generic_price": 12.0,
        "pack_size": "Strip of 15 tablets",
    },
    "allegra": {
        "active_salt": "Fexofenadine",
        "generic_name": "Fexofenadine 120 mg Tablet",
        "brand_price": 110.0,
        "generic_price": 38.0,
        "pack_size": "Strip of 10 tablets",
    },
    "azithral 500": {
        "active_salt": "Azithromycin",
        "generic_name": "Azithromycin 500 mg Tablet",
        "brand_price": 95.0,
        "generic_price": 42.0,
        "pack_size": "Strip of 3 tablets",
    },
}
