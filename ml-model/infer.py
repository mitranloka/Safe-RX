"""
SAFE-Rx Machine Learning Pipeline - Standalone Inference Utility
================================================================
Task: 6-Class Handwritten Medicine Word Recognition
Model: ResNet-18 (Trained checkpoint: ml-model/outputs/best_model.pth)

Classes recognized:
  1. Algin      (Active salt: Tiemonium methylsulphate)
  2. Dexter     (Active salt: Dexibuprofen)
  3. Napa       (Active salt: Paracetamol)
  4. Nexe       (Active salt: Esomeprazole)
  5. Omeprazole (Active salt: Omeprazole)
  6. Voltalin   (Active salt: Diclofenac)

Usage:
  python ml-model/infer.py <path_to_image> [--model <path_to_checkpoint>]
"""

import sys
import os
import argparse
from pathlib import Path
from PIL import Image

import torch
import torch.nn as nn
from torchvision import transforms, models

# Ensure safe console output encoding on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Default paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_MODEL_PATH = PROJECT_ROOT / "ml-model" / "outputs" / "best_model.pth"

# Preprocessing: identical to validation and test pipeline
IMAGE_SIZE = (224, 224)
eval_transform = transforms.Compose([
    transforms.Resize(IMAGE_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


def load_model(checkpoint_path: Path, device: torch.device):
    """Safely loads model weights and restores class mappings."""
    if not checkpoint_path.exists():
        raise FileNotFoundError(
            f"Model checkpoint not found at: {checkpoint_path}\n"
            f"Please run the training script first: python ml-model/train_baseline.py"
        )

    # weights_only=False allows restoring class_to_idx and hyperparameter dicts
    checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=False)

    class_to_idx = checkpoint.get("class_to_idx")
    classes = checkpoint.get("classes")

    if not classes or not class_to_idx:
        raise ValueError("Checkpoint is missing class mapping metadata ('classes' or 'class_to_idx').")

    num_classes = len(classes)
    idx_to_class = {idx: cls_name for cls_name, idx in class_to_idx.items()}

    # Initialize architecture without downloading external weights
    model = models.resnet18(weights=None)
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, num_classes)

    model.load_state_dict(checkpoint["model_state_dict"])
    model = model.to(device)
    model.eval()

    return model, idx_to_class, checkpoint.get("best_val_acc")


def predict(image_path: Path, model: nn.Module, idx_to_class: dict, device: torch.device, top_k: int = 3):
    """Runs inference on a single image and returns ranked predictions."""
    if not image_path.exists():
        raise FileNotFoundError(f"Image file does not exist: {image_path}")

    try:
        with Image.open(image_path) as raw_img:
            img = raw_img.convert("RGB")
    except Exception as e:
        raise ValueError(f"Failed to open or decode image file '{image_path}': {e}")

    # Apply preprocessing
    input_tensor = eval_transform(img).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(input_tensor)
        probabilities = torch.softmax(outputs, dim=1)[0]

    # Get top-k predictions
    top_probs, top_indices = torch.topk(probabilities, k=min(top_k, len(idx_to_class)))

    results = []
    for prob, idx in zip(top_probs.cpu().numpy(), top_indices.cpu().numpy()):
        cls_name = idx_to_class[int(idx)]
        confidence_pct = float(prob) * 100.0
        results.append((cls_name, confidence_pct))

    return results


def main():
    parser = argparse.ArgumentParser(
        description="SAFE-Rx Standalone Inference Utility: 6-Class Handwritten Medicine Word Recognition"
    )
    parser.add_argument(
        "image_path",
        type=str,
        help="Path to the handwritten medicine word image (JPEG/PNG)"
    )
    parser.add_argument(
        "--model",
        type=str,
        default=str(DEFAULT_MODEL_PATH),
        help=f"Path to model checkpoint (default: {DEFAULT_MODEL_PATH})"
    )
    parser.add_argument(
        "--top-k",
        type=int,
        default=3,
        help="Number of top predictions to display (default: 3)"
    )

    args = parser.parse_args()
    image_path = Path(args.image_path)
    model_path = Path(args.model)

    # 1. Device selection
    if torch.cuda.is_available():
        device = torch.device("cuda:0")
        device_label = f"GPU ({torch.cuda.get_device_name(0)})"
    else:
        device = torch.device("cpu")
        device_label = "CPU"

    # 2. Validate image path existence
    if not image_path.is_file():
        print(f"\n[ERROR] Image not found or invalid file path: '{image_path}'", file=sys.stderr)
        print("Please provide a valid path to an image file.", file=sys.stderr)
        sys.exit(1)

    # 3. Load model
    try:
        model, idx_to_class, best_val_acc = load_model(model_path, device)
    except Exception as e:
        print(f"\n[ERROR] Failed to load model: {e}", file=sys.stderr)
        sys.exit(1)

    # 4. Run inference
    try:
        predictions = predict(image_path, model, idx_to_class, device, top_k=args.top_k)
    except Exception as e:
        print(f"\n[ERROR] Inference failed: {e}", file=sys.stderr)
        sys.exit(1)

    # 5. Display formatted results
    top_class, top_conf = predictions[0]

    print("\n" + "=" * 60)
    print("SAFE-Rx MEDICINE WORD RECOGNITION (PROTOTYPE)")
    print("=" * 60)
    print(f"Target Image:      {image_path.name}")
    print(f"Image Location:    {image_path}")
    print(f"Inference Device:  {device_label}")
    print(f"Supported Classes: {', '.join(sorted(idx_to_class.values()))}")
    print("-" * 60)
    print(f"PREDICTED MEDICINE: {top_class.upper()}")
    print(f"CONFIDENCE:         {top_conf:.2f}%")
    print("-" * 60)
    print(f"Top {len(predictions)} Predictions:")
    for rank, (cls_name, conf) in enumerate(predictions, 1):
        bar_len = int(conf / 5) # 20 chars max
        bar_str = "#" * bar_len
        print(f"  {rank}. {cls_name:<12} {conf:6.2f}%  [{bar_str:<20}]")
    print("=" * 60)
    print("[Note: Controlled 6-class prototype; not a general prescription OCR.]\n")


if __name__ == "__main__":
    main()
