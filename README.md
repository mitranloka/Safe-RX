# SAFE-Rx

**An academic prototype for medication safety assistance.**

> ⚠️ **Academic Disclaimer:** SAFE-Rx is a 2nd-year Computer Science Engineering project built for educational purposes. It is **not** a certified medical device, clinical decision-support tool, or production-ready application. No output from SAFE-Rx should be used as a substitute for advice from a qualified healthcare professional or licensed pharmacist.

---

## Overview

SAFE-Rx is a web application prototype that explores how software can assist patients in reviewing prescription information before acting on it. It combines a React frontend, a FastAPI backend, and a custom-trained machine learning model to demonstrate three safety-focused ideas:

1. **Flagging duplicate active ingredients** across a list of prescribed medicines.
2. **Surfacing generic (lower-cost) alternatives** to branded medicines.
3. **Classifying handwritten medicine-word images** using a trained deep learning model.

All three features are **prototypes** operating on small, curated datasets and require human review before any information is considered actionable.

---

## Features

### 1. Prescription Upload and Verification

Users upload a prescription image (JPG, PNG, WEBP, or PDF). The application displays the file and presents a list of extracted medicines for review.

> **Current implementation note:** Medicine extraction is currently **simulated** using a fixed set of mock medicines (`Dolo 650`, `Calpol 650`, `Cetirizine`). Full OCR integration is deferred. The user must manually verify and correct all medicine entries before proceeding. No medicine information reaches any safety check without explicit human confirmation.

### 2. SAFE-Guard

After the user confirms the medicine list on the Verification page, SAFE-Guard checks the verified medicine names against a local prototype salt database. If two or more medicines share the same active ingredient (salt), a warning is displayed.

- Duplicate-salt detection only — not a full drug interaction checker.
- Uses a small hand-curated brand-to-salt mapping.
- Results include a mandatory educational disclaimer.

### 3. SAFE-Save

SAFE-Save compares verified brand-name medicines to known generic equivalents and shows the potential cost savings. The data is from a small prototype pricing dataset.

- Displays brand price, generic name, generic price, and savings amount.
- Not connected to live pharmacy pricing.

### 4. ML Prototype Demo

A completely **isolated** demonstration page (`/ml-demo`) that lets users test the trained handwritten medicine-word classifier. It is **not** connected to the prescription upload workflow.

- Accepts a single **cropped** handwritten word image.
- Classifies it into one of **6 supported medicine classes** only.
- Displays the top prediction, confidence score, and top-3 probability distribution.
- Includes a prominent prototype limitation notice on every prediction.

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| **Frontend** | React | 18.3 |
| | TypeScript | 5.5 |
| | Vite | 7.3 |
| | Tailwind CSS | 3.4 |
| | Lucide React (icons) | 0.446 |
| **Backend** | Python | 3.13 |
| | FastAPI | 0.162 |
| | Uvicorn (ASGI server) | 0.54 |
| | Pydantic | 2.14 |
| | python-multipart | 0.0.33 |
| **ML** | PyTorch | 2.14.1+cu126 |
| | torchvision | 0.29.2 |
| | Pillow | 13.0 |
| | NumPy | 2.5 |
| | OpenCV | 5.0 (experiments only) |

---

## Project Structure

```
Safe-rx/
│
├── frontend/                        React + TypeScript application
│   └── src/
│       ├── pages/
│       │   ├── DashboardPage.tsx
│       │   ├── UploadPrescriptionPage.tsx
│       │   ├── VerificationPage.tsx
│       │   ├── SafeGuardPage.tsx
│       │   ├── SafeSavePage.tsx
│       │   └── MLDemoPage.tsx       Isolated ML demo (no connection to core workflow)
│       ├── services/
│       │   ├── prescriptionService.ts   Mock OCR (simulated)
│       │   ├── safeGuardService.ts
│       │   ├── safeSaveService.ts
│       │   ├── mlService.ts             Client for POST /api/ml/predict-word
│       │   ├── authService.ts           Mock auth (localStorage)
│       │   └── connectionService.ts
│       ├── context/
│       │   ├── AuthContext.tsx
│       │   └── PrescriptionContext.tsx  Shared state for Upload → Verify → SAFE-Guard
│       ├── components/
│       │   ├── layout/                  AppLayout, NavLinks, PublicLayout, UserMenu
│       │   ├── ui/                      Button, PageHeader, Disclaimer, SeverityBadge, ...
│       │   ├── upload/                  DropZone, FilePreview
│       │   └── verification/            MedicineForm
│       └── routes.tsx
│
├── backend/                         FastAPI backend
│   ├── main.py                      6 endpoints
│   ├── data/
│   │   ├── medicine_salts.py        Brand → active salt mapping (prototype)
│   │   └── safe_save_data.py        Brand → generic pricing data (prototype)
│   └── services/
│       ├── safe_guard.py            Duplicate-salt detection logic
│       ├── safe_save.py             Generic savings calculation logic
│       └── ml_bridge.py            In-memory singleton ResNet-18 inference bridge
│
├── ml-model/                        ML training and inference
│   ├── train_baseline.py            ResNet-18 fine-tuning (25 epochs, lr=1e-4)
│   ├── infer.py                     CLI single-image inference utility
│   ├── prepare_subset.py            Derives the 6-class stratified dataset subset
│   ├── outputs/
│   │   └── best_model.pth           Trained checkpoint (128 MB, val acc 98.91%)
│   └── experiments/
│       ├── word_segmentation_poc.py OpenCV word-region detection experiment
│       └── evaluate_rejection.py   OOD confidence-threshold rejection experiment
│
└── data/
    ├── RxHandBD-ML/                 Original dataset — untouched
    ├── RxHandBD-Raw/                Original dataset — untouched
    └── processed/
        └── rxhandbd_medicine_subset/
            ├── train/   432 images  (70%)
            ├── val/      92 images  (15%)
            └── test/     92 images  (15%)
```

---

## Running the Project Locally

### Prerequisites

- **Node.js** (v18 or later) with npm
- **Python 3.13**
- Two Python virtual environments, already set up at:
  - `backend/venv/` — FastAPI and web dependencies
  - `ml-model/venv/` — PyTorch, torchvision, Pillow, NumPy, OpenCV

> The backend uses `ml-model/venv` for ML dependencies rather than duplicating PyTorch into `backend/venv`.

---

### 1. Start the Backend

```powershell
cd Safe-rx\backend
.\venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

The API will be available at `http://127.0.0.1:8000`.

You can verify it is running by opening `http://127.0.0.1:8000/health` in your browser — it should return `{"status": "healthy"}`.

**Interactive API docs** (auto-generated by FastAPI) are at:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

---

### 2. Start the Frontend

In a **separate terminal**:

```powershell
cd Safe-rx\frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173`.

---

### 3. Using the Application

1. Open `http://localhost:5173` and create an account (name, email, password — stored in `localStorage` only, no backend session).
2. Navigate to **Upload Prescription** to upload a prescription image. The application will display the uploaded file alongside a fixed set of mock medicines.
3. Review and edit the medicines on the **Verify** page, then click **Confirm and run SAFE-Guard**.
4. **SAFE-Guard** checks for duplicate active salts and displays warnings.
5. Click **See cheaper generic options** to open **SAFE-Save**.
6. To test the ML model, navigate to **ML Prototype Demo** in the sidebar.

---

## ML Model

### Dataset: RxHandBD

The model was trained on the **RxHandBD** academic benchmark dataset for Bangladeshi handwritten prescription recognition.

| Property | Value |
|---|---|
| Source | RxHandBD academic dataset |
| Images used | 616 (derived subset of 6 medicine classes) |
| Train split | 432 images (70%) |
| Validation split | 92 images (15%) |
| Test split | 92 images (15%) |
| Random seed | 42 (fully reproducible) |

**Supported classes and sample counts:**

| Class | Total Images |
|---|---|
| Algin | 78 |
| Dexter | 100 |
| Napa | 150 |
| Nexe | 103 |
| Omeprazole | 104 |
| Voltalin | 81 |

> **Important:** RxHandBD images are **cropped single-word images**, not full prescription scans. Each image contains one handwritten medicine name isolated from a prescription form.

### Model Architecture

| Property | Value |
|---|---|
| Architecture | ResNet-18 |
| Pre-training | ImageNet weights (transfer learning) |
| Fine-tuning | Final fully-connected layer replaced for 6-class output |
| Input | RGB image, resized to 224 × 224 |
| Normalisation | ImageNet mean/std (`[0.485, 0.456, 0.406]` / `[0.229, 0.224, 0.225]`) |
| Training augmentation | Mild random affine (rotation ±10°, translation 10%, scale 90–110%) |
| Optimiser | AdamW (lr=1e-4, weight_decay=1e-2) |
| Epochs | 25 |
| Batch size | 16 |

### Training Results

| Metric | Value |
|---|---|
| Best validation accuracy | **98.91%** |
| Test-set accuracy | **94.57%** |
| Checkpoint size | 128 MB |
| Inference device | CUDA (GPU) with CPU fallback |

### CLI Inference

To run inference on a single image from the command line:

```powershell
cd Safe-rx\ml-model
.\venv\Scripts\activate
python infer.py path\to\cropped_word_image.jpg
```

---

## Experimental Findings

Two additional experiments were conducted beyond the main training pipeline:

### Experiment 1: Word Region Detection (OpenCV)

**Script:** `ml-model/experiments/word_segmentation_poc.py`

Investigated whether classical image processing (Otsu thresholding + contour detection) could segment individual word regions from multi-word RxHandBD prescription phrase images, then feed each crop to the trained classifier.

**Finding:** Segmentation was feasible for well-spaced handwriting but produced inconsistent crops for dense or cursive text. Additionally, non-medicine words (e.g., "Tab.", "mups", "extra") were assigned to medicine classes with high confidence — revealing the fundamental closed-set problem described below.

---

### Experiment 2: OOD Confidence-Threshold Rejection

**Script:** `ml-model/experiments/evaluate_rejection.py`

Investigated whether softmax confidence thresholding and feature-centroid cosine similarity could distinguish the 6 supported classes from out-of-distribution (OOD) words using 92 OOD test images from RxHandBD.

**Finding:** Neither thresholding alone nor combined centroid similarity provided a reliable rejection mechanism. OOD words were frequently assigned high softmax confidence scores, making autonomous rejection unsafe without further research.

---

## Known Limitations

| Limitation | Description |
|---|---|
| **Mock OCR** | `analyzePrescription()` returns a hardcoded set of medicines. No real OCR or prescription reading is implemented. |
| **Closed-set classifier** | The model always assigns an input to one of its 6 known classes. It cannot detect or reject handwritten words outside its training vocabulary. |
| **Not a prescription scanner** | The model was trained on isolated cropped word images. It does not scan or parse full prescription pages. |
| **Mock authentication** | Sign-in and sign-up store the user in `localStorage` only. There is no server-side session, JWT, or password hashing. Any valid-looking email and 6+ character password succeeds. |
| **Small prototype databases** | SAFE-Guard and SAFE-Save use small hand-curated datasets, not comprehensive clinical databases. |
| **Human verification mandatory** | No medicine information is passed to SAFE-Guard or SAFE-Save without the user explicitly confirming the medicine list on the Verification page. This is enforced by design and must not be removed. |

---

## API Reference

All endpoints are served at `http://127.0.0.1:8000`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/test` | Frontend–backend connection test |
| `POST` | `/api/safe-guard/check` | Duplicate-salt check for a list of medicine names |
| `POST` | `/api/safe-save/check` | Generic savings check for a list of medicine names |
| `POST` | `/api/ml/predict-word` | Classify a cropped handwritten medicine-word image |

### `POST /api/ml/predict-word`

**Request:** `multipart/form-data` with field `file` (JPEG, PNG, or WEBP image).

**Response:**
```json
{
  "predicted_medicine": "Napa",
  "confidence": 84.87,
  "top_predictions": [
    { "medicine": "Napa",    "confidence": 84.87 },
    { "medicine": "Dexter",  "confidence": 13.02 },
    { "medicine": "Algin",   "confidence": 1.32  }
  ],
  "supported_classes": ["Algin", "Dexter", "Napa", "Nexe", "Omeprazole", "Voltalin"],
  "prototype_limitation": "Prototype demonstration only. ..."
}
```

---

## Academic Context

| Item | Detail |
|---|---|
| Course | 2nd Year B.Tech Computer Science Engineering |
| Project type | Academic prototype |
| ML dataset | RxHandBD (academic benchmark) |
| Model | ResNet-18, transfer learning from ImageNet |
| Test accuracy | 94.57% on 92 held-out test images (6 classes) |

---

*SAFE-Rx is not a medical device. Always consult a qualified healthcare professional or licensed pharmacist before making any medication decision.*
