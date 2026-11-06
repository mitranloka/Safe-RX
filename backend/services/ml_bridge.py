"""
SAFE-Rx Backend ML Bridge Service
=================================
Provides an isolated, in-memory bridge to the trained ResNet-18 handwritten
medicine-word recognition model (ml-model/outputs/best_model.pth).

Recognizes exclusively the 6 controlled prototype classes:
  - Algin
  - Dexter
  - Napa
  - Nexe
  - Omeprazole
  - Voltalin

Prototype Only:
  This model is designed for cropped single-word images only, not general
  prescription OCR. Human verification is required before any output reaches
  SAFE-Guard or SAFE-Save.
"""

import io
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Ensure ML environment dependencies are accessible to backend venv
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
ML_SITE_PACKAGES = PROJECT_ROOT / "ml-model" / "venv" / "Lib" / "site-packages"
SYS_SITE_PACKAGES = Path(r"C:\Users\mitra\AppData\Local\Programs\Python\Python313\Lib\site-packages")

if ML_SITE_PACKAGES.exists() and str(ML_SITE_PACKAGES) not in sys.path:
    sys.path.insert(0, str(ML_SITE_PACKAGES))
if SYS_SITE_PACKAGES.exists() and str(SYS_SITE_PACKAGES) not in sys.path:
    sys.path.insert(1, str(SYS_SITE_PACKAGES))

from PIL import Image, UnidentifiedImageError
import torch
import torch.nn as nn
from torchvision import transforms, models

# ---------------------------------------------------------------------------
# Constants & Limitations
# ---------------------------------------------------------------------------
CHECKPOINT_PATH = PROJECT_ROOT / "ml-model" / "outputs" / "best_model.pth"
SUPPORTED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

PROTOTYPE_LIMITATION_MESSAGE = (
    "Prototype demonstration only. This model is trained exclusively on cropped handwritten "
    "images for six controlled medicine names (Algin, Dexter, Napa, Nexe, Omeprazole, Voltalin). "
    "It is NOT a general prescription OCR system. All predictions must be verified by a "
    "qualified human before safety checks or medication decisions."
)

# Standard preprocessing matching infer.py
IMAGE_SIZE = (224, 224)
eval_transform = transforms.Compose([
    transforms.Resize(IMAGE_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# ---------------------------------------------------------------------------
# Cached Model Singleton
# ---------------------------------------------------------------------------
_MODEL: Optional[nn.Module] = None
_IDX_TO_CLASS: Optional[Dict[int, str]] = None
_SUPPORTED_CLASSES: Optional[List[str]] = None
_DEVICE: Optional[torch.device] = None


def get_model() -> Tuple[nn.Module, Dict[int, str], List[str], torch.device]:
    """
    Retrieves or lazily initializes the cached ResNet-18 model.
    Avoids reloading weights on every incoming HTTP request.
    """
    global _MODEL, _IDX_TO_CLASS, _SUPPORTED_CLASSES, _DEVICE

    if _MODEL is not None:
        return _MODEL, _IDX_TO_CLASS, _SUPPORTED_CLASSES, _DEVICE

    if not CHECKPOINT_PATH.exists():
        raise FileNotFoundError(f"Model checkpoint not found at: {CHECKPOINT_PATH}")

    _DEVICE = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

    checkpoint = torch.load(CHECKPOINT_PATH, map_location=_DEVICE, weights_only=False)
    classes = checkpoint.get("classes")
    class_to_idx = checkpoint.get("class_to_idx")

    if not classes or not class_to_idx:
        raise ValueError("Checkpoint is missing class mapping metadata.")

    _SUPPORTED_CLASSES = sorted(list(classes))
    _IDX_TO_CLASS = {idx: cls_name for cls_name, idx in class_to_idx.items()}

    # Initialize architecture
    model = models.resnet18(weights=None)
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, len(classes))
    model.load_state_dict(checkpoint["model_state_dict"])
    model = model.to(_DEVICE)
    model.eval()

    _MODEL = model
    return _MODEL, _IDX_TO_CLASS, _SUPPORTED_CLASSES, _DEVICE


def predict_word_image(image_bytes: bytes, filename: str = "", content_type: str = "", top_k: int = 3) -> dict:
    """
    Validates the uploaded image bytes, applies evaluation preprocessing,
    and returns model predictions with prototype disclaimers.
    """
    # 1. Format validation
    ext = Path(filename).suffix.lower() if filename else ""
    if ext and ext not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Unsupported file extension '{ext}'. Supported formats: JPEG, PNG, WEBP.")

    if content_type and content_type.lower() not in SUPPORTED_MIME_TYPES and content_type != "application/octet-stream":
        raise ValueError(f"Unsupported content type '{content_type}'. Supported formats: JPEG, PNG, WEBP.")

    if not image_bytes or len(image_bytes) == 0:
        raise ValueError("Uploaded image file is empty.")

    # 2. Decode image
    try:
        raw_img = Image.open(io.BytesIO(image_bytes))
        raw_img.verify() # verify header integrity
    except (UnidentifiedImageError, Exception) as e:
        raise ValueError(f"Corrupt or unreadable image file: {e}")

    # Re-open for pixel processing (verify() closes the image)
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # 3. Load model and run inference
    model, idx_to_class, supported_classes, device = get_model()
    tensor = eval_transform(img).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(tensor)
        probabilities = torch.softmax(outputs, dim=1)[0]

    # 4. Extract Top-K predictions
    k = min(top_k, len(supported_classes))
    top_probs, top_indices = torch.topk(probabilities, k=k)

    top_predictions = []
    for p, idx in zip(top_probs.cpu().numpy(), top_indices.cpu().numpy()):
        top_predictions.append({
            "medicine": idx_to_class[int(idx)],
            "confidence": round(float(p) * 100.0, 2)
        })

    predicted_medicine = top_predictions[0]["medicine"]
    confidence = top_predictions[0]["confidence"]

    return {
        "predicted_medicine": predicted_medicine,
        "confidence": confidence,
        "top_predictions": top_predictions,
        "supported_classes": supported_classes,
        "prototype_limitation": PROTOTYPE_LIMITATION_MESSAGE
    }
