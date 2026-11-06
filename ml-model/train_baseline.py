"""
SAFE-Rx Machine Learning Pipeline - Baseline Training Experiment
================================================================
Model: ResNet-18 (Transfer Learning with ImageNet Pretrained Weights)
Task: 6-Class Handwritten Medicine Word Classification
Classes: Algin, Dexter, Napa, Nexe, Omeprazole, Voltalin
Dataset: data/processed/rxhandbd_medicine_subset (Train: 432, Val: 92, Test: 92)

Outputs saved to:
  ml-model/outputs/
    ├── best_model.pth           (Saved weights of best validation checkpoint)
    ├── training_history.json    (Epoch-by-epoch loss and accuracy metrics)
    └── test_results.json        (Evaluation metrics, per-class accuracy, and confusion matrix)
"""

import os
import sys
import json
import time
import random
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from torchvision.models import resnet18, ResNet18_Weights

# ---------------------------------------------------------------------------
# 1. Hyperparameters & Configuration
# ---------------------------------------------------------------------------
RANDOM_SEED = 42
BATCH_SIZE = 16
NUM_EPOCHS = 25
LEARNING_RATE = 1e-4
WEIGHT_DECAY = 1e-2
IMAGE_SIZE = (224, 224)

# Paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data" / "processed" / "rxhandbd_medicine_subset"
TRAIN_DIR = DATA_DIR / "train"
VAL_DIR = DATA_DIR / "val"
TEST_DIR = DATA_DIR / "test"

OUTPUT_DIR = PROJECT_ROOT / "ml-model" / "outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
CHECKPOINT_PATH = OUTPUT_DIR / "best_model.pth"
HISTORY_PATH = OUTPUT_DIR / "training_history.json"
TEST_RESULTS_PATH = OUTPUT_DIR / "test_results.json"


def set_seed(seed: int = RANDOM_SEED):
    """Ensure fully reproducible training."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False


def get_data_transforms():
    """
    Data transformations:
    - Train: Mild affine rotation/shift/scaling + color jitter. NO horizontal or vertical flips.
    - Val/Test: Deterministic resize + ImageNet normalization only.
    """
    train_transform = transforms.Compose([
        transforms.Resize(IMAGE_SIZE),
        transforms.RandomAffine(
            degrees=(-8, 8),
            translate=(0.05, 0.05),
            scale=(0.95, 1.05)
        ),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])

    eval_transform = transforms.Compose([
        transforms.Resize(IMAGE_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])

    return train_transform, eval_transform


def train_one_epoch(model, dataloader, criterion, optimizer, device):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for inputs, labels in dataloader:
        inputs = inputs.to(device)
        labels = labels.to(device)

        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * inputs.size(0)
        _, preds = torch.max(outputs, 1)
        correct += (preds == labels).sum().item()
        total += labels.size(0)

    epoch_loss = running_loss / total
    epoch_acc = (correct / total) * 100.0
    return epoch_loss, epoch_acc


def evaluate(model, dataloader, criterion, device):
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0
    all_preds = []
    all_targets = []

    with torch.no_grad():
        for inputs, labels in dataloader:
            inputs = inputs.to(device)
            labels = labels.to(device)

            outputs = model(inputs)
            loss = criterion(outputs, labels)

            running_loss += loss.item() * inputs.size(0)
            _, preds = torch.max(outputs, 1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)

            all_preds.extend(preds.cpu().numpy().tolist())
            all_targets.extend(labels.cpu().numpy().tolist())

    eval_loss = running_loss / total
    eval_acc = (correct / total) * 100.0
    return eval_loss, eval_acc, all_targets, all_preds


def main():
    set_seed(RANDOM_SEED)

    # -----------------------------------------------------------------------
    # Hardware detection
    # -----------------------------------------------------------------------
    if torch.cuda.is_available():
        device = torch.device("cuda:0")
        device_name = torch.cuda.get_device_name(0)
    else:
        device = torch.device("cpu")
        device_name = "CPU"

    # -----------------------------------------------------------------------
    # Datasets and Loaders
    # -----------------------------------------------------------------------
    train_transform, eval_transform = get_data_transforms()

    train_dataset = datasets.ImageFolder(root=str(TRAIN_DIR), transform=train_transform)
    val_dataset = datasets.ImageFolder(root=str(VAL_DIR), transform=eval_transform)
    test_dataset = datasets.ImageFolder(root=str(TEST_DIR), transform=eval_transform)

    class_names = train_dataset.classes
    class_to_idx = train_dataset.class_to_idx
    num_classes = len(class_names)

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    # -----------------------------------------------------------------------
    # Configuration Banner
    # -----------------------------------------------------------------------
    print("=" * 70)
    print("SAFE-Rx BASELINE TRAINING EXPERIMENT")
    print("=" * 70)
    print(f"Device:               {device_name} ({device})")
    print(f"Model Architecture:   ResNet-18 (Pretrained: ImageNet1K_V1)")
    print(f"Number of Classes:    {num_classes}")
    print(f"Class-to-Index Map:   {class_to_idx}")
    print(f"Dataset Counts:       Train={len(train_dataset)}, Val={len(val_dataset)}, Test={len(test_dataset)} (Total={len(train_dataset)+len(val_dataset)+len(test_dataset)})")
    print(f"Batch Size:           {BATCH_SIZE}")
    print(f"Optimizer:            AdamW (lr={LEARNING_RATE}, weight_decay={WEIGHT_DECAY})")
    print(f"Loss Function:        CrossEntropyLoss")
    print(f"Epochs:               {NUM_EPOCHS}")
    print(f"Input Resolution:     {IMAGE_SIZE} (RGB)")
    print(f"Data Augmentation:    Rotation +/-8 deg, Shift +/-5%, Scale 0.95-1.05, ColorJitter (No flips)")
    print("=" * 70)

    # -----------------------------------------------------------------------
    # Initialize Model with Pretrained Weights
    # -----------------------------------------------------------------------
    print("\nLoading pretrained ResNet-18 weights...")
    model = resnet18(weights=ResNet18_Weights.DEFAULT)

    # Replace the final fully connected classification head
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, num_classes)
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)

    # -----------------------------------------------------------------------
    # Training Loop
    # -----------------------------------------------------------------------
    print("\nStarting Training Run (Validation-guided checkpointing)...")
    print("-" * 70)
    print(f"{'Epoch':<8} | {'Train Loss':<12} | {'Train Acc (%)':<15} | {'Val Loss':<12} | {'Val Acc (%)':<13} | {'Status'}")
    print("-" * 70)

    history = {
        "epoch": [],
        "train_loss": [],
        "train_acc": [],
        "val_loss": [],
        "val_acc": []
    }

    best_val_acc = 0.0
    best_val_loss = float("inf")
    best_epoch = -1
    start_time = time.time()

    for epoch in range(1, NUM_EPOCHS + 1):
        train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc, _, _ = evaluate(model, val_loader, criterion, device)

        history["epoch"].append(epoch)
        history["train_loss"].append(round(train_loss, 4))
        history["train_acc"].append(round(train_acc, 2))
        history["val_loss"].append(round(val_loss, 4))
        history["val_acc"].append(round(val_acc, 2))

        # Checkpointing criteria: prioritize highest val_acc, break tie with lowest val_loss
        is_best = False
        if (val_acc > best_val_acc) or (val_acc == best_val_acc and val_loss < best_val_loss):
            best_val_acc = val_acc
            best_val_loss = val_loss
            best_epoch = epoch
            is_best = True

            # Save checkpoint
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "best_val_acc": best_val_acc,
                "best_val_loss": best_val_loss,
                "class_to_idx": class_to_idx,
                "classes": class_names,
                "hyperparameters": {
                    "architecture": "resnet18",
                    "batch_size": BATCH_SIZE,
                    "learning_rate": LEARNING_RATE,
                    "weight_decay": WEIGHT_DECAY,
                    "image_size": IMAGE_SIZE
                }
            }, CHECKPOINT_PATH)

        status_str = "[BEST]" if is_best else ""
        print(f"{epoch:<8} | {train_loss:<12.4f} | {train_acc:<15.2f} | {val_loss:<12.4f} | {val_acc:<13.2f} | {status_str}")

    elapsed_time = time.time() - start_time
    print("-" * 70)
    print(f"Training completed in {elapsed_time:.1f} seconds.")
    print(f"Best Validation Accuracy: {best_val_acc:.2f}% (achieved at Epoch {best_epoch})")
    print(f"Best Checkpoint saved at: {CHECKPOINT_PATH}")

    # Save training history JSON
    with open(HISTORY_PATH, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)
    print(f"Training history saved at: {HISTORY_PATH}")

    # -----------------------------------------------------------------------
    # Final Evaluation on the Untouched Test Set
    # -----------------------------------------------------------------------
    print("\n" + "=" * 70)
    print("FINAL EVALUATION ON UNTOUCHED TEST SET")
    print("=" * 70)
    print(f"Loading best checkpoint from Epoch {best_epoch} for test evaluation...")

    checkpoint = torch.load(CHECKPOINT_PATH, map_location=device, weights_only=False)
    model.load_state_dict(checkpoint["model_state_dict"])

    test_loss, test_acc, y_true, y_pred = evaluate(model, test_loader, criterion, device)
    print(f"\nFinal Test Set Loss:     {test_loss:.4f}")
    print(f"Final Test Set Accuracy: {test_acc:.2f}% ({sum(np.array(y_true) == np.array(y_pred))}/{len(y_true)} correct)")

    # Per-class breakdown and Confusion Matrix
    confusion_mat = np.zeros((num_classes, num_classes), dtype=int)
    for t, p in zip(y_true, y_pred):
        confusion_mat[t][p] += 1

    print("\nPer-Class Performance on Test Set:")
    print("-" * 70)
    print(f"{'Class Name':<15} | {'Samples':<10} | {'Correct':<10} | {'Accuracy (%)':<15}")
    print("-" * 70)

    per_class_results = {}
    for idx, class_name in enumerate(class_names):
        total_cls = int(np.sum(confusion_mat[idx, :]))
        correct_cls = int(confusion_mat[idx, idx])
        acc_cls = (correct_cls / total_cls * 100.0) if total_cls > 0 else 0.0
        per_class_results[class_name] = {
            "total_samples": total_cls,
            "correct": correct_cls,
            "accuracy_pct": round(acc_cls, 2)
        }
        print(f"{class_name:<15} | {total_cls:<10} | {correct_cls:<10} | {acc_cls:<15.2f}")
    print("-" * 70)

    print("\nConfusion Matrix (Rows = Actual Ground Truth, Columns = Predicted):")
    header_str = f"{'':<12} " + " ".join([f"{c[:6]:>7}" for c in class_names])
    print(header_str)
    print("-" * len(header_str))
    for idx, class_name in enumerate(class_names):
        row_str = f"{class_name:<12} " + " ".join([f"{confusion_mat[idx, j]:>7d}" for j in range(num_classes)])
        print(row_str)

    # Save comprehensive test results
    test_summary = {
        "best_epoch": best_epoch,
        "best_val_accuracy_pct": round(best_val_acc, 2),
        "best_val_loss": round(best_val_loss, 4),
        "test_loss": round(test_loss, 4),
        "test_accuracy_pct": round(test_acc, 2),
        "total_test_samples": len(y_true),
        "per_class": per_class_results,
        "confusion_matrix": confusion_mat.tolist(),
        "classes": class_names,
        "class_to_idx": class_to_idx,
        "training_time_seconds": round(elapsed_time, 2)
    }

    with open(TEST_RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(test_summary, f, indent=2)
    print(f"\nFinal test results saved at: {TEST_RESULTS_PATH}")
    print("=" * 70)


if __name__ == "__main__":
    main()
