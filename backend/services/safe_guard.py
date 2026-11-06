"""Match medicine names to active salts and flag duplicate salts.

Prototype only. Results are educational and are not medical advice.
"""

import re

from data.medicine_salts import MEDICINE_SALTS

DISCLAIMER = (
    "SAFE-Guard uses a small local prototype list of medicine names. "
    "It is for learning only and does not provide medical advice or a diagnosis."
)


def normalize_medicine_name(name: str) -> str:
    """Lowercase the name and collapse spacing so lookups stay predictable."""
    cleaned = name.strip().lower().replace("-", " ").replace("_", " ")
    return re.sub(r"\s+", " ", cleaned)


def _join_names(names: list[str]) -> str:
    if len(names) == 1:
        return names[0]
    if len(names) == 2:
        return f"{names[0]} and {names[1]}"
    return ", ".join(names[:-1]) + f", and {names[-1]}"


def check_medicines(names: list[str]) -> dict:
    results = []
    salts: dict[str, list[str]] = {}

    for raw_name in names:
        display_name = raw_name.strip()
        normalized_name = normalize_medicine_name(display_name)
        active_salt = MEDICINE_SALTS.get(normalized_name) if normalized_name else None
        found = active_salt is not None

        results.append(
            {
                "name": display_name,
                "normalized_name": normalized_name,
                "found": found,
                "active_salt": active_salt,
                "status": "found" if found else "not_found",
            }
        )

        if found and active_salt:
            salts.setdefault(active_salt, []).append(display_name)

    warnings = []
    for active_salt, medicine_names in salts.items():
        if len(medicine_names) < 2:
            continue
        listed = _join_names(medicine_names)
        warnings.append(
            {
                "active_salt": active_salt,
                "medicines": medicine_names,
                "message": (
                    f"{listed} share the active salt {active_salt}. "
                    "This is an educational prototype warning, not medical advice or a diagnosis."
                ),
            }
        )

    return {
        "medicines": results,
        "warnings": warnings,
        "disclaimer": DISCLAIMER,
    }
