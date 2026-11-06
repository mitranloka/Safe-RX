"""
SAFE-Rx Machine Learning Pipeline - Rejection Mechanism Experiment
==================================================================
Task: Evaluating "Unknown / Not Recognized" Rejection for Closed-Set ResNet-18
Objective:
  Determine whether:
  1. Softmax Confidence Thresholding alone can distinguish target medicines from OOD words.
  2. Feature Centroid Cosine Similarity + Confidence Margin improves rejection quality.
  3. The mechanism is reliable enough for automated integration or must remain experimental.

Data:
  - In-Distribution (Positive): 92 test images from the 6 approved classes (Algin, Dexter, Napa, Nexe, Omeprazole, Voltalin).
  - Out-of-Distribution (Negative): 92 non-target test images from RxHandBD-ML/Test_Set (unseen non-target medicines and dosage terms).

Outputs:
  ml-model/experiments/outputs/
    └── rejection_experiment_results.json
"""

import sys
import json
import csv
import random
from pathlib import Path
import numpy as np
import torch
import torch.nn as nn
from PIL import Image
from torchvision import transforms, models

# Windows UTF-8 console output
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
RANDOM_SEED = 42
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)
torch.manual_seed(RANDOM_SEED)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data"
PROCESSED_TEST_DIR = DATA_DIR / "processed" / "rxhandbd_medicine_subset" / "test"
TRAIN_DIR = DATA_DIR / "processed" / "rxhandbd_medicine_subset" / "train"
RAW_TEST_DIR = DATA_DIR / "RxHandBD-ML" / "Test_Set"
RAW_TEST_CSV = DATA_DIR / "RxHandBD-ML" / "Test_Label.csv"

CHECKPOINT_PATH = PROJECT_ROOT / "ml-model" / "outputs" / "best_model.pth"
OUTPUT_DIR = PROJECT_ROOT / "ml-model" / "experiments" / "outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_PATH = OUTPUT_DIR / "rejection_experiment_results.json"

eval_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])


def load_model_and_classes(device):
    if not CHECKPOINT_PATH.exists():
        raise FileNotFoundError(f"Checkpoint not found at: {CHECKPOINT_PATH}")

    checkpoint = torch.load(CHECKPOINT_PATH, map_location=device, weights_only=False)
    classes = checkpoint["classes"]
    idx_to_class = {v: k for k, v in checkpoint["class_to_idx"].items()}

    model = models.resnet18(weights=None)
    model.fc = nn.Linear(512, len(classes))
    model.load_state_dict(checkpoint["model_state_dict"])
    model = model.to(device)
    model.eval()

    return model, classes, idx_to_class


def extract_features_and_logits(model, image_path, device, hook_container):
    with Image.open(image_path) as im:
        tensor = eval_transform(im.convert("RGB")).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(tensor)
        probs = torch.softmax(outputs, dim=1)[0]
        feat = hook_container["feat"][0].cpu().numpy()

    top_probs, top_indices = torch.topk(probs, 2)
    top1_p = float(top_probs[0])
    top2_p = float(top_probs[1])
    margin = top1_p - top2_p
    top1_idx = int(top_indices[0])

    norm_feat = feat / (np.linalg.norm(feat) + 1e-9)
    return top1_p, top2_p, margin, top1_idx, norm_feat


def compute_class_centroids(model, classes, device, hook_container):
    print("Computing class centroid embeddings from the 432 training samples...")
    class_vectors = {c: [] for c in classes}

    for cls in classes:
        cls_dir = TRAIN_DIR / cls
        for p in sorted(cls_dir.glob("*.jpg")):
            _, _, _, _, norm_feat = extract_features_and_logits(model, p, device, hook_container)
            class_vectors[cls].append(norm_feat)

    centroids = {}
    for cls in classes:
        mean_vec = np.mean(class_vectors[cls], axis=0)
        centroids[cls] = mean_vec / (np.linalg.norm(mean_vec) + 1e-9)

    return centroids


def run_experiment():
    print("=" * 75)
    print("SAFE-Rx EXPERIMENT: UNKNOWN / OOD MEDICINE WORD REJECTION MECHANISM")
    print("=" * 75)

    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    model, classes, idx_to_class = load_model_and_classes(device)
    target_names_lower = {c.lower() for c in classes}

    # Hook for extracting 512-dim embedding before the final linear layer
    hook_container = {}
    def hook_fn(module, input, output):
        hook_container["feat"] = torch.flatten(output, 1)
    model.avgpool.register_forward_hook(hook_fn)

    centroids = compute_class_centroids(model, classes, device, hook_container)

    # -----------------------------------------------------------------------
    # 1. Collect In-Distribution (Positive) Test Samples (92 items)
    # -----------------------------------------------------------------------
    print("\nEvaluating In-Distribution Target Test Samples (92 items)...")
    target_samples = []
    for cls in classes:
        cls_dir = PROCESSED_TEST_DIR / cls
        for p in sorted(cls_dir.glob("*.jpg")):
            top1_p, top2_p, margin, top1_idx, norm_feat = extract_features_and_logits(model, p, device, hook_container)
            pred_cls = idx_to_class[top1_idx]
            sim = float(np.dot(norm_feat, centroids[pred_cls]))

            target_samples.append({
                "filename": p.name,
                "ground_truth": cls,
                "predicted_class": pred_cls,
                "is_correct_prediction": (cls == pred_cls),
                "confidence": top1_p,
                "margin": margin,
                "centroid_similarity": sim,
                "is_target": True
            })

    # -----------------------------------------------------------------------
    # 2. Collect Out-of-Distribution (Negative) Non-Target Samples (92 items)
    # -----------------------------------------------------------------------
    print("Sampling Non-Target Words from RxHandBD-ML/Test_Set (92 items)...")
    raw_non_targets = []
    with open(RAW_TEST_CSV, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        next(reader)
        for r in reader:
            if len(r) >= 2:
                img_name, label = r[0].strip(), r[1].strip()
                if label.lower() not in target_names_lower:
                    raw_non_targets.append((img_name, label))

    # Deterministic sample of 92 non-targets for balanced 1:1 evaluation
    random.shuffle(raw_non_targets)
    sampled_non_targets = raw_non_targets[:92]

    non_target_samples = []
    for img_name, label in sampled_non_targets:
        p = RAW_TEST_DIR / img_name
        if not p.exists():
            continue

        top1_p, top2_p, margin, top1_idx, norm_feat = extract_features_and_logits(model, p, device, hook_container)
        pred_cls = idx_to_class[top1_idx]
        sim = float(np.dot(norm_feat, centroids[pred_cls]))

        non_target_samples.append({
            "filename": img_name,
            "ground_truth_text": label,
            "predicted_class": pred_cls,
            "confidence": top1_p,
            "margin": margin,
            "centroid_similarity": sim,
            "is_target": False
        })

    # -----------------------------------------------------------------------
    # 3. Statistical Analysis of Metrics
    # -----------------------------------------------------------------------
    tgt_confs = [s["confidence"] for s in target_samples]
    tgt_sims = [s["centroid_similarity"] for s in target_samples]
    tgt_margins = [s["margin"] for s in target_samples]

    ood_confs = [s["confidence"] for s in non_target_samples]
    ood_sims = [s["centroid_similarity"] for s in non_target_samples]
    ood_margins = [s["margin"] for s in non_target_samples]

    print("\nMetric Distributions (Mean +/- Std):")
    print(f"  Confidence (Softmax): Target = {np.mean(tgt_confs)*100:.1f}% +/- {np.std(tgt_confs)*100:.1f}% | Non-Target = {np.mean(ood_confs)*100:.1f}% +/- {np.std(ood_confs)*100:.1f}%")
    print(f"  Margin (Top1 - Top2): Target = {np.mean(tgt_margins)*100:.1f}% +/- {np.std(tgt_margins)*100:.1f}% | Non-Target = {np.mean(ood_margins)*100:.1f}% +/- {np.std(ood_margins)*100:.1f}%")
    print(f"  Centroid Cosine Sim:  Target = {np.mean(tgt_sims):.4f} +/- {np.std(tgt_sims):.4f}   | Non-Target = {np.mean(ood_sims):.4f} +/- {np.std(ood_sims):.4f}")

    # -----------------------------------------------------------------------
    # 4. Evaluation of Thresholding Strategies
    # -----------------------------------------------------------------------
    print("\n" + "=" * 75)
    print("STRATEGY 1: SOFTMAX CONFIDENCE THRESHOLDING ALONE")
    print("=" * 75)
    print(f"{'Threshold':<12} | {'True Accept Rate':<18} | {'False Accept Rate':<18} | {'False Reject Rate':<18}")
    print("-" * 75)

    strategy1_results = []
    for thresh in [0.50, 0.70, 0.80, 0.85, 0.90, 0.95, 0.99]:
        # Target accepted if confidence >= thresh
        tgt_accepted = [s for s in target_samples if s["confidence"] >= thresh]
        ood_accepted = [s for s in non_target_samples if s["confidence"] >= thresh]

        tar = len(tgt_accepted) / len(target_samples) * 100.0
        far = len(ood_accepted) / len(non_target_samples) * 100.0
        frr = 100.0 - tar

        strategy1_results.append({
            "threshold": thresh,
            "true_accept_rate_pct": round(tar, 2),
            "false_accept_rate_pct": round(far, 2),
            "false_reject_rate_pct": round(frr, 2),
            "false_positives_count": len(ood_accepted),
            "false_rejections_count": len(target_samples) - len(tgt_accepted)
        })

        print(f"{thresh:<12.2f} | {tar:<17.1f}% | {far:<17.1f}% | {frr:<17.1f}%")

    print("\n" + "=" * 75)
    print("STRATEGY 2: DUAL FILTER (CONFIDENCE + CENTROID COSINE SIMILARITY)")
    print("=" * 75)
    print(f"{'Conf Thresh':<12} | {'Sim Thresh':<12} | {'True Accept %':<15} | {'False Accept %':<15} | {'False Reject %':<15}")
    print("-" * 75)

    strategy2_results = []
    configs = [
        (0.80, 0.85),
        (0.85, 0.88),
        (0.90, 0.88),
        (0.90, 0.90),
        (0.95, 0.90),
        (0.95, 0.92)
    ]

    for c_th, s_th in configs:
        tgt_accepted = [s for s in target_samples if s["confidence"] >= c_th and s["centroid_similarity"] >= s_th]
        ood_accepted = [s for s in non_target_samples if s["confidence"] >= c_th and s["centroid_similarity"] >= s_th]

        tar = len(tgt_accepted) / len(target_samples) * 100.0
        far = len(ood_accepted) / len(non_target_samples) * 100.0
        frr = 100.0 - tar

        strategy2_results.append({
            "confidence_threshold": c_th,
            "similarity_threshold": s_th,
            "true_accept_rate_pct": round(tar, 2),
            "false_accept_rate_pct": round(far, 2),
            "false_reject_rate_pct": round(frr, 2),
            "false_positives_count": len(ood_accepted),
            "false_rejections_count": len(target_samples) - len(tgt_accepted)
        })

        print(f"{c_th:<12.2f} | {s_th:<12.2f} | {tar:<14.1f}% | {far:<14.1f}% | {frr:<14.1f}%")

    # -----------------------------------------------------------------------
    # 5. Extract Concrete Qualitative Examples
    # -----------------------------------------------------------------------
    # Example False Positives (OOD words accepted with high confidence)
    false_positives_examples = []
    for s in sorted(non_target_samples, key=lambda x: x["confidence"], reverse=True)[:5]:
        false_positives_examples.append({
            "image": s["filename"],
            "actual_word": s["ground_truth_text"],
            "falsely_predicted_as": s["predicted_class"],
            "confidence_pct": round(s["confidence"] * 100.0, 2),
            "similarity": round(s["centroid_similarity"], 4)
        })

    # Example False Rejections (Real target medicines rejected at high threshold 0.95)
    false_rejections_examples = []
    for s in target_samples:
        if s["confidence"] < 0.95 and s["is_correct_prediction"]:
            false_rejections_examples.append({
                "image": s["filename"],
                "target_medicine": s["ground_truth"],
                "predicted": s["predicted_class"],
                "confidence_pct": round(s["confidence"] * 100.0, 2),
                "similarity": round(s["centroid_similarity"], 4)
            })

    # -----------------------------------------------------------------------
    # 6. Save Experiment Summary JSON
    # -----------------------------------------------------------------------
    summary = {
        "experiment_name": "Unknown / OOD Medicine Word Rejection",
        "random_seed": RANDOM_SEED,
        "sample_counts": {
            "in_distribution_targets": len(target_samples),
            "out_of_distribution_non_targets": len(non_target_samples)
        },
        "metric_distributions": {
            "target": {
                "mean_confidence": round(float(np.mean(tgt_confs)), 4),
                "mean_similarity": round(float(np.mean(tgt_sims)), 4),
                "mean_margin": round(float(np.mean(tgt_margins)), 4)
            },
            "non_target": {
                "mean_confidence": round(float(np.mean(ood_confs)), 4),
                "mean_similarity": round(float(np.mean(ood_sims)), 4),
                "mean_margin": round(float(np.mean(ood_margins)), 4)
            }
        },
        "confidence_threshold_sweep": strategy1_results,
        "dual_filter_sweep": strategy2_results,
        "sample_false_positives": false_positives_examples,
        "sample_false_rejections": false_rejections_examples[:5]
    }

    with open(RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print("\n" + "=" * 75)
    print(f"Experiment completed. Full results saved at: {RESULTS_PATH}")
    print("=" * 75)


if __name__ == "__main__":
    run_experiment()
