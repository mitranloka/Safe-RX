"""
SAFE-Rx Machine Learning Pipeline - Dataset Preparation Script
==============================================================
Creates a controlled, balanced, and stratified medicine subset from RxHandBD
for handwritten medicine-word classification.

Target Classes (6 classes):
- Napa (150 samples)       -> Active salt: Paracetamol
- Omeprazole (104 samples) -> Active salt: Omeprazole
- Nexe (103 samples)       -> Active salt: Esomeprazole
- Dexter (100 samples)     -> Active salt: Dexibuprofen
- Voltalin (81 samples)    -> Active salt: Diclofenac
- Algin (78 samples)       -> Active salt: Tiemonium methylsulphate

Split:
- Stratified 70% Train / 15% Validation / 15% Test
- Deterministic seed (42) for complete reproducibility

Folder structure:
- data/processed/rxhandbd_medicine_subset/
  ├── train/<class_name>/*.jpg
  ├── val/<class_name>/*.jpg
  ├── test/<class_name>/*.jpg
  ├── metadata.csv
  └── summary.json
"""

import os
import csv
import json
import shutil
import random
from pathlib import Path
from collections import defaultdict

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
RANDOM_SEED = 42
TRAIN_RATIO = 0.70
VAL_RATIO = 0.15
TEST_RATIO = 0.15

# Approved target classes mapped to standardized display names
APPROVED_CLASSES = {
    "napa": "Napa",
    "omeprazole": "Omeprazole",
    "nexe": "Nexe",
    "dexter": "Dexter",
    "voltalin": "Voltalin",
    "algin": "Algin"
}

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
SOURCE_ML_DIR = DATA_DIR / "RxHandBD-ML"
OUTPUT_DIR = DATA_DIR / "processed" / "rxhandbd_medicine_subset"


def load_original_labels(ml_dir: Path):
    """
    Reads the original labels from RxHandBD-ML label files.
    Returns a list of dicts with image_name, raw_label, normalized_label, source_path.
    """
    records = []
    splits = [
        ("Train_Label.csv", "Train_Set"),
        ("Test_Label.csv", "Test_Set")
    ]

    for csv_name, folder_name in splits:
        csv_path = ml_dir / csv_name
        img_folder = ml_dir / folder_name
        
        if not csv_path.exists():
            raise FileNotFoundError(f"Missing required label file: {csv_path}")

        with open(csv_path, mode="r", encoding="utf-8-sig") as f:
            reader = csv.reader(f)
            header = next(reader, None)  # Skip header ['Images', 'Text']
            for row in reader:
                if len(row) >= 2:
                    img_name = row[0].strip()
                    raw_text = row[1].strip()
                    norm_text = raw_text.lower()
                    
                    if norm_text in APPROVED_CLASSES:
                        img_path = img_folder / img_name
                        if not img_path.exists():
                            raise FileNotFoundError(f"Source image not found: {img_path}")
                        
                        records.append({
                            "image_name": img_name,
                            "raw_label": raw_text,
                            "normalized_label": norm_text,
                            "class_name": APPROVED_CLASSES[norm_text],
                            "source_path": img_path
                        })

    return records


def stratified_split(records, seed=RANDOM_SEED):
    """
    Splits records per class into train (70%), val (15%), test (15%).
    Ensures deterministic, reproducible assignment.
    """
    random.seed(seed)
    by_class = defaultdict(list)
    for r in records:
        by_class[r["class_name"]].append(r)

    train_set, val_set, test_set = [], [], []

    for class_name, items in sorted(by_class.items()):
        # Sort first for deterministic shuffle order across any OS
        items.sort(key=lambda x: x["image_name"])
        random.shuffle(items)

        n_total = len(items)
        n_train = int(round(n_total * TRAIN_RATIO))
        n_val = int(round(n_total * VAL_RATIO))
        # Remaining goes to test to guarantee n_train + n_val + n_test == n_total
        n_test = n_total - n_train - n_val

        class_train = items[:n_train]
        class_val = items[n_train:n_train + n_val]
        class_test = items[n_train + n_val:]

        for item in class_train:
            item["split"] = "train"
        for item in class_val:
            item["split"] = "val"
        for item in class_test:
            item["split"] = "test"

        train_set.extend(class_train)
        val_set.extend(class_val)
        test_set.extend(class_test)

    return train_set, val_set, test_set


def build_derived_dataset():
    print("=" * 65)
    print("SAFE-Rx Dataset Preparation: Controlled Medicine Subset")
    print("=" * 65)

    print(f"\n1. Scanning original dataset in: {SOURCE_ML_DIR}")
    records = load_original_labels(SOURCE_ML_DIR)
    print(f"   Found {len(records)} matching records across {len(APPROVED_CLASSES)} target classes.")

    print("\n2. Performing stratified 70% / 15% / 15% split...")
    train_set, val_set, test_set = stratified_split(records, seed=RANDOM_SEED)

    all_split_records = train_set + val_set + test_set

    # Create destination directories
    print(f"\n3. Creating output directory: {OUTPUT_DIR}")
    if OUTPUT_DIR.exists():
        print("   Notice: Output directory already exists, cleaning up previous generated subset...")
        shutil.rmtree(OUTPUT_DIR)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for split in ["train", "val", "test"]:
        for class_name in APPROVED_CLASSES.values():
            (OUTPUT_DIR / split / class_name).mkdir(parents=True, exist_ok=True)

    print("\n4. Copying images (preserving originals)...")
    metadata_rows = []
    class_stats = defaultdict(lambda: {"train": 0, "val": 0, "test": 0, "total": 0})

    for item in all_split_records:
        split = item["split"]
        class_name = item["class_name"]
        dest_path = OUTPUT_DIR / split / class_name / item["image_name"]

        # Copy file without modifying source
        shutil.copy2(item["source_path"], dest_path)

        class_stats[class_name][split] += 1
        class_stats[class_name]["total"] += 1

        metadata_rows.append({
            "image_name": item["image_name"],
            "class_name": class_name,
            "split": split,
            "raw_label": item["raw_label"],
            "relative_path": f"{split}/{class_name}/{item['image_name']}"
        })

    # Save metadata CSV
    metadata_csv_path = OUTPUT_DIR / "metadata.csv"
    with open(metadata_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["image_name", "class_name", "split", "raw_label", "relative_path"])
        writer.writeheader()
        writer.writerows(metadata_rows)

    # Save summary JSON
    summary_data = {
        "dataset_name": "RxHandBD Medicine Classification Subset",
        "random_seed": RANDOM_SEED,
        "target_split_ratios": {"train": TRAIN_RATIO, "val": VAL_RATIO, "test": TEST_RATIO},
        "total_samples": len(all_split_records),
        "classes": list(APPROVED_CLASSES.values()),
        "class_breakdown": dict(class_stats),
        "split_totals": {
            "train": len(train_set),
            "val": len(val_set),
            "test": len(test_set)
        }
    }
    summary_json_path = OUTPUT_DIR / "summary.json"
    with open(summary_json_path, "w", encoding="utf-8") as f:
        json.dump(summary_data, f, indent=2)

    print("\n5. Dataset Preparation Complete!")
    print("-" * 65)
    print(f"{'Class Name':<15} | {'Train':<8} | {'Val':<8} | {'Test':<8} | {'Total':<8}")
    print("-" * 65)
    for class_name in sorted(class_stats.keys()):
        st = class_stats[class_name]
        print(f"{class_name:<15} | {st['train']:<8} | {st['val']:<8} | {st['test']:<8} | {st['total']:<8}")
    print("-" * 65)
    print(f"{'TOTAL':<15} | {len(train_set):<8} | {len(val_set):<8} | {len(test_set):<8} | {len(all_split_records):<8}")
    print("-" * 65)

    return summary_data


if __name__ == "__main__":
    build_derived_dataset()
