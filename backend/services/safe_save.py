"""Look up generic alternatives and prototype prices for verified medicines.

Prototype only.  All prices and alternatives are illustrative demo data and
are NOT current, official, or verified information.
"""

import re

from data.safe_save_data import SAFE_SAVE_DATA

DISCLAIMER = (
    "Prototype demonstration only. Medicine alternatives and prices must be "
    "verified with a qualified healthcare professional or an authorized source "
    "before making any purchase or medication decision."
)


def normalize_name(name: str) -> str:
    """Lowercase, collapse whitespace, and strip punctuation for reliable lookups."""
    cleaned = name.strip().lower().replace("-", " ").replace("_", " ")
    return re.sub(r"\s+", " ", cleaned)


def check_savings(names: list[str]) -> dict:
    """Return generic alternatives and prototype price comparisons for each name."""
    results = []

    for raw_name in names:
        display_name = raw_name.strip()
        normalised = normalize_name(display_name)
        entry = SAFE_SAVE_DATA.get(normalised)

        if entry is None:
            results.append(
                {
                    "name": display_name,
                    "normalized_name": normalised,
                    "found": False,
                    "active_salt": None,
                    "generic_name": None,
                    "brand_price": None,
                    "generic_price": None,
                    "pack_size": None,
                    "savings": None,
                    "savings_percent": None,
                    "status": "not_found",
                }
            )
            continue

        savings = round(entry["brand_price"] - entry["generic_price"], 2)
        savings_percent = round(
            (savings / entry["brand_price"]) * 100
        ) if entry["brand_price"] > 0 else 0

        results.append(
            {
                "name": display_name,
                "normalized_name": normalised,
                "found": True,
                "active_salt": entry["active_salt"],
                "generic_name": entry["generic_name"],
                "brand_price": entry["brand_price"],
                "generic_price": entry["generic_price"],
                "pack_size": entry["pack_size"],
                "savings": savings,
                "savings_percent": savings_percent,
                "status": "found",
            }
        )

    return {
        "results": results,
        "disclaimer": DISCLAIMER,
    }
