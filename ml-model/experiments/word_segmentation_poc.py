"""
SAFE-Rx Machine Learning Pipeline - Word Region Detection Proof-of-Concept
==========================================================================
Experiment: Classical OpenCV Word-Region Detection on Multi-Word Prescription Images
Purpose: Investigate whether classical segmentation (thresholding + contour detection)
         can extract individual word regions suitable for the 6-class ResNet-18 classifier.

Outputs:
  ml-model/experiments/outputs/
    ├── annotated_<image_name>.jpg      (Original image with bounding boxes drawn)
    ├── crop_<image>_<box_id>.jpg       (Padded crops of detected word regions)
    └── segmentation_experiment_results.json (Detailed detection and inference report)
"""

import sys
import json
from pathlib import Path
import cv2
import numpy as np
import torch
import torch.nn as nn
from PIL import Image
from torchvision import transforms, models

# Safe UTF-8 output on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# ---------------------------------------------------------------------------
# Paths and Configuration
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data" / "RxHandBD-ML" / "Train_Set"
CHECKPOINT_PATH = PROJECT_ROOT / "ml-model" / "outputs" / "best_model.pth"
OUTPUT_DIR = PROJECT_ROOT / "ml-model" / "experiments" / "outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Representative multi-word test images available in the dataset
TEST_SAMPLES = [
    {"filename": "P2000.jpg", "label": "Napa extra", "target_medicine": "Napa"},
    {"filename": "P1126.jpg", "label": "Dexter 60", "target_medicine": "Dexter"},
    {"filename": "P1314.jpg", "label": "Tab. Algin", "target_medicine": "Algin"},
    {"filename": "P2373.jpg", "label": "Nexe mups", "target_medicine": "Nexe"},
]

# ImageNet Evaluation Transform
eval_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])


def load_classifier(device):
    """Loads the frozen 6-class ResNet-18 model without modifying weights."""
    if not CHECKPOINT_PATH.exists():
        raise FileNotFoundError(f"Checkpoint not found: {CHECKPOINT_PATH}")

    checkpoint = torch.load(CHECKPOINT_PATH, map_location=device, weights_only=False)
    classes = checkpoint["classes"]
    idx_to_class = {v: k for k, v in checkpoint["class_to_idx"].items()}

    model = models.resnet18(weights=None)
    model.fc = nn.Linear(512, len(classes))
    model.load_state_dict(checkpoint["model_state_dict"])
    model = model.to(device)
    model.eval()

    return model, idx_to_class


def segment_word_regions(image_bgr):
    """
    Explainable OpenCV pipeline:
    1. Grayscale conversion
    2. Inverted Otsu thresholding (ink = 255, background = 0)
    3. Morphological horizontal dilation to connect character strokes into words
    4. Contour bounding-box detection
    5. Noise filtering and left-to-right sorting
    """
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    
    # Otsu thresholding
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    # Horizontal rectangular kernel (15x5) to connect letters within a word
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 5))
    dilated = cv2.dilate(thresh, kernel, iterations=2)
    
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    boxes = []
    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        # Filter out minor specks and noise
        if w > 35 and h > 25:
            boxes.append((x, y, w, h))
            
    # Sort bounding boxes left-to-right
    boxes.sort(key=lambda b: b[0])
    return boxes, thresh, dilated


def prepare_crop_for_model(crop_bgr):
    """Pads non-square crop with white background to preserve natural aspect ratio."""
    h, w = crop_bgr.shape[:2]
    max_dim = max(h, w)
    pad_top = (max_dim - h) // 2
    pad_bottom = max_dim - h - pad_top
    pad_left = (max_dim - w) // 2
    pad_right = max_dim - w - pad_left
    
    padded = cv2.copyMakeBorder(
        crop_bgr, pad_top, pad_bottom, pad_left, pad_right,
        cv2.BORDER_CONSTANT, value=[255, 255, 255]
    )
    return padded


def run_experiment():
    print("=" * 70)
    print("SAFE-Rx EXPERIMENTAL PROOF-OF-CONCEPT: WORD-REGION SEGMENTATION")
    print("=" * 70)

    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"Inference Device: {device}")
    print(f"Loading trained model from: {CHECKPOINT_PATH.name}")
    model, idx_to_class = load_classifier(device)

    experiment_results = []

    for sample in TEST_SAMPLES:
        filename = sample["filename"]
        img_path = DATA_DIR / filename
        if not img_path.exists():
            print(f"[WARNING] Sample image not found: {img_path}")
            continue

        print(f"\nProcessing Image: {filename} (Label: '{sample['label']}')")
        img_bgr = cv2.imread(str(img_path))
        annotated_img = img_bgr.copy()

        # Step 1: Detect word bounding boxes
        boxes, thresh, dilated = segment_word_regions(img_bgr)
        print(f"  Detected {len(boxes)} candidate word regions using OpenCV contour analysis.")

        sample_record = {
            "filename": filename,
            "original_label": sample["label"],
            "target_medicine": sample["target_medicine"],
            "detected_regions_count": len(boxes),
            "regions": []
        }

        # Step 2: Crop, pad, and run inference on each region
        for idx, (x, y, w, h) in enumerate(boxes):
            # Add small padding margin if possible
            pad = 8
            y1 = max(0, y - pad)
            y2 = min(img_bgr.shape[0], y + h + pad)
            x1 = max(0, x - pad)
            x2 = min(img_bgr.shape[1], x + w + pad)

            raw_crop = img_bgr[y1:y2, x1:x2]
            padded_crop = prepare_crop_for_model(raw_crop)

            # Save cropped image
            crop_filename = f"crop_{Path(filename).stem}_box{idx}.jpg"
            crop_path = OUTPUT_DIR / crop_filename
            cv2.imwrite(str(crop_path), padded_crop)

            # Preprocess and classify with ResNet-18
            crop_rgb = cv2.cvtColor(padded_crop, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(crop_rgb)
            tensor = eval_transform(pil_img).unsqueeze(0).to(device)

            with torch.no_grad():
                outputs = model(tensor)
                probs = torch.softmax(outputs, dim=1)[0]
                top_p, top_i = torch.topk(probs, 3)

            top_class = idx_to_class[int(top_i[0])]
            top_conf = float(top_p[0]) * 100.0

            predictions = [
                {"class": idx_to_class[int(i)], "confidence_pct": round(float(p) * 100.0, 2)}
                for p, i in zip(top_p, top_i)
            ]

            # Annotate visual bounding box on image
            color = (0, 180, 0) if top_class.lower() == sample["target_medicine"].lower() else (0, 0, 220)
            cv2.rectangle(annotated_img, (x, y), (x + w, y + h), color, 2)
            label_text = f"#{idx}: {top_class} ({top_conf:.1f}%)"
            cv2.putText(annotated_img, label_text, (x, max(20, y - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

            print(f"    Region #{idx} ({w}x{h} at x={x}, y={y}): Top Prediction = {top_class} ({top_conf:.2f}%)")

            sample_record["regions"].append({
                "region_id": idx,
                "bounding_box": {"x": x, "y": y, "width": w, "height": h},
                "crop_saved_as": crop_filename,
                "predicted_class": top_class,
                "confidence_pct": round(top_conf, 2),
                "top_3_predictions": predictions
            })

        # Save annotated image
        annotated_filename = f"annotated_{filename}"
        cv2.imwrite(str(OUTPUT_DIR / annotated_filename), annotated_img)
        sample_record["annotated_image"] = annotated_filename
        experiment_results.append(sample_record)

    # Save detailed JSON report
    report_path = OUTPUT_DIR / "segmentation_experiment_results.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(experiment_results, f, indent=2)

    print("\n" + "=" * 70)
    print(f"Experiment completed successfully!")
    print(f"All visual annotations, crops, and JSON results saved in:")
    print(f"  {OUTPUT_DIR}")
    print("=" * 70)


if __name__ == "__main__":
    run_experiment()
