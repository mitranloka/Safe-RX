# SAFE-Rx

**An academic prototype for medication safety assistance.**

> ⚠️ **Academic Disclaimer:** SAFE-Rx is a 2nd-year Computer Science Engineering project built for educational and research purposes. It is **not** a certified medical device, clinical decision-support tool, or production diagnostic system. No output from SAFE-Rx should be used as a substitute for professional clinical judgment, diagnosis, or advice from a qualified healthcare professional or licensed pharmacist.

---

## Overview

SAFE-Rx is a web application prototype that explores how software can assist patients and caregivers in reviewing prescription information before acting on it. It combines a React frontend, a FastAPI backend, an offline optical character recognition (OCR) baseline, and a custom-trained machine learning model to demonstrate safety-focused ideas across three core pillars:

1. **Local Prescription OCR & Candidate Extraction:** Reading prescription files locally without cloud APIs and suggesting candidate medicines for mandatory human verification.
2. **Flagging Duplicate Active Ingredients (SAFE-Guard):** Detecting when multiple prescribed medicines share the same active pharmaceutical ingredient (salt).
3. **Surfacing Generic Alternatives (SAFE-Save):** Comparing verified brand-name medicines against known lower-cost generic equivalents from a prototype pricing catalog.
4. **Isolated Handwritten Medicine-Word Classification (ML Demo):** Classifying cropped handwritten word images into six supported medicine classes using a custom fine-tuned deep learning model.

All features operate on small, curated prototype datasets and require explicit human review before any information is considered actionable.

---

## End-to-End Workflow

SAFE-Rx enforces a strict, human-in-the-loop workflow:

```
Upload Prescription
       │
       ▼
Local RapidOCR Text Extraction (ONNX Runtime)
       │
       ▼
Conservative Medicine Candidate Extraction (Catalog Match & De-duplication)
       │
       ▼
Mandatory Human Verification (Review, Edit, or Manually Add Medicines)
       │
       ▼
SAFE-Guard (Duplicate Active Salt Check)
       │
       ▼
SAFE-Save (Generic Alternative & Cost Savings Check)
```

---

## Features

### 1. Prescription Upload and Local OCR Baseline

Users upload a prescription document as an image (`JPG`, `PNG`, `WEBP`) or document (`PDF`).

- **100% Free & Local OCR:** Text is extracted locally using `RapidOCR` powered by the ONNX Runtime. The engine runs entirely on the local CPU without external cloud APIs, internet dependencies, or paid subscription keys.
- **Local PDF Rendering:** Multi-page or single-page PDF files are rendered locally into high-resolution images via `pypdfium2` before OCR processing.
- **Raw OCR Text Inspection:** The complete raw text extracted by the OCR engine is available directly to the user on the Verification page via an expandable *"Extracted OCR Text"* panel for full transparency.
- **Offline Fallback:** If the backend OCR service is temporarily unreachable, the frontend gracefully falls back to clearly labeled sample demonstration data so evaluation remains possible.

### 2. Conservative Medicine Candidate Extraction

Extracted OCR text lines are analyzed by a conservative rule-based extraction service in `backend/services/ocr_service.py`:

- **Text Normalization:** Handles token concatenation common in OCR output (e.g., `Dolo650` → `Dolo 650`, `Calpol650mg` → `Calpol 650 mg`, `Cetirizine10mg` → `Cetirizine 10 mg`), case differences, extra spacing, and common punctuation.
- **Conservative Catalog Matching:** Matches normalized text lines against a local prototype catalog (`KNOWN_MEDICINES`) using whole-word boundary matching with longest-key-first priority.
- **No Hallucination / No Guessing:** If OCR text does not confidently match a known catalog entry, the system returns an empty candidate list rather than guessing or inventing incorrect medicine names. The user is prompted to add medicines manually.
- **Detail Extraction:** Extracts dosage strength (e.g., `650 mg`), dosage frequency (e.g., `Twice Daily`, `OD`, `BD`, `At Night`), and duration (e.g., `5 days`) when clearly stated in the line, with catalog defaults as fallback.
- **De-duplication:** Automatically eliminates duplicate candidate mentions when the same medicine appears on multiple OCR lines.

### 3. Mandatory Human Verification

Before any medicine enters the safety analysis pipeline, human verification is strictly required:

- **Side-by-Side Review:** The user compares the original uploaded prescription document directly against the extracted medicine candidates.
- **Full Editing Control:** Users can edit brand names, active ingredients, strengths, dosages, frequencies, and durations, or remove misidentified items.
- **Manual Addition:** If the prescription is handwritten or the OCR engine detects no catalog matches, the user can click **"Add medicine"** to enter the prescribed medications manually.
- **Safety Gate:** OCR suggestions are never treated as verified prescriptions automatically. The **"Confirm and run SAFE-Guard"** action remains disabled until verification is confirmed.

### 4. SAFE-Guard (Duplicate Ingredient Detection)

After verification, SAFE-Guard cross-references confirmed medicine names against a local active salt database:

- **Duplicate Salt Flagging:** Identifies when two or more distinct brand names share the same active ingredient (for example, taking both `Dolo 650` and `Calpol 650` results in duplicate Paracetamol intake).
- **Educational Prototype Scope:** Designed specifically for active salt duplication; this is not a comprehensive clinical drug–drug interaction checker.
- **Mandatory Disclaimers:** Every result includes clear educational notices.

### 5. SAFE-Save (Generic Savings Assistant)

SAFE-Save compares verified brand-name medicines against equivalent generic alternatives:

- **Price & Savings Comparison:** Displays branded price, generic substitute name, generic price, pack size, and estimated cost savings.
- **Prototype Catalog:** Uses curated demonstration pricing data from Indian generic medicine equivalents.
- **Healthcare Professional Notice:** Advises users to consult a licensed physician or pharmacist before substituting any medication.

### 6. Isolated ML Prototype Demo

A standalone demonstration page (`/ml-demo`) that showcases deep learning classification of handwritten medicine words:

- **Isolated Workflow:** The ML model is **strictly decoupled** from the main Prescription Upload and OCR pipeline.
- **Cropped Word Classification:** Accepts an isolated, cropped single-word handwritten image and classifies it into one of **6 supported medicine classes** (`Algin`, `Dexter`, `Napa`, `Nexe`, `Omeprazole`, `Voltalin`).
- **Probability Distribution:** Returns top predicted medicine, confidence score percentage, and top-3 prediction distribution.

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend** | React | 18.3 | User interface |
| | TypeScript | 5.5 | Type-safe application logic |
| | Vite | 7.3 | Frontend tooling and production build |
| | Tailwind CSS | 3.4 | Styling and responsive design |
| | Lucide React | 0.446 | Iconography |
| **Backend & OCR** | Python | 3.13 | Backend runtime |
| | FastAPI | 0.162 | Asynchronous REST API |
| | Uvicorn | 0.54 | ASGI server |
| | RapidOCR (ONNX) | 1.2.3 | Local offline optical character recognition |
| | pypdfium2 | 5.15 | Local PDF page rendering for OCR |
| | Pillow | 13.0 | Image decoding and manipulation |
| | Pydantic | 2.14 | Request and response schema validation |
| **ML Prototype** | PyTorch | 2.14.1+cu126 | Deep learning framework |
| | torchvision | 0.29.2 | ResNet-18 model and transformations |
| | NumPy | 2.5 | Numerical array computations |
| | OpenCV | 5.0 | Word segmentation experiments |

---

## Project Structure

```
Safe-rx/
│
├── frontend/                        React + TypeScript application
│   └── src/
│       ├── pages/
│       │   ├── DashboardPage.tsx
│       │   ├── UploadPrescriptionPage.tsx  Prescription upload & local OCR dispatch
│       │   ├── VerificationPage.tsx        Mandatory review, OCR text drawer, manual entry
│       │   ├── SafeGuardPage.tsx           Duplicate salt analysis
│       │   ├── SafeSavePage.tsx            Generic alternative comparisons
│       │   └── MLDemoPage.tsx              Isolated ML prototype demo (/ml-demo)
│       ├── services/
│       │   ├── prescriptionService.ts      Client for POST /api/prescription/extract
│       │   ├── safeGuardService.ts         Client for POST /api/safe-guard/check
│       │   ├── safeSaveService.ts          Client for POST /api/safe-save/check
│       │   ├── mlService.ts                Client for POST /api/ml/predict-word
│       │   └── connectionService.ts        Client for GET /api/test
│       ├── context/
│       │   ├── AuthContext.tsx             Mock authentication state (localStorage)
│       │   └── PrescriptionContext.tsx     Shared state: file, rawText, medicines, isSampleData
│       └── components/                     Modular UI, upload, and verification components
│
├── backend/                         FastAPI backend
│   ├── main.py                      7 endpoints (Health, Test, OCR, Safe-Guard, Safe-Save, ML)
│   ├── services/
│   │   ├── ocr_service.py           RapidOCR ONNX pipeline, normalization & candidate extraction
│   │   ├── safe_guard.py            Active salt duplicate detection logic
│   │   ├── safe_save.py             Generic savings calculation logic
│   │   └── ml_bridge.py             Singleton ResNet-18 inference bridge
│   └── data/
│       ├── medicine_salts.py        Brand → active salt dictionary
│       └── safe_save_data.py        Brand → generic price dictionary
│
├── ml-model/                        ML training and evaluation
│   ├── train_baseline.py            ResNet-18 fine-tuning on 6 RxHandBD classes
│   ├── infer.py                     Single-image inference CLI
│   ├── prepare_subset.py            Dataset stratification & split preparation
│   ├── outputs/
│   │   └── best_model.pth           Checkpoint (val acc 98.91%, test acc 94.57%)
│   └── experiments/
│       ├── word_segmentation_poc.py Classical contour word segmentation experiment
│       └── evaluate_rejection.py    Out-of-distribution confidence threshold experiment
│
└── data/
    ├── RxHandBD-ML/                 Academic dataset source
    ├── RxHandBD-Raw/                Academic dataset raw images
    └── processed/
        └── rxhandbd_medicine_subset/
            ├── train/               432 cropped word images (70%)
            ├── val/                  92 cropped word images (15%)
            └── test/                 92 cropped word images (15%)
```

---

## Running the Project Locally

### Prerequisites

- **Node.js** (v18 or higher) with npm
- **Python 3.13**
- Two virtual environments set up at:
  - `backend/venv/` — FastAPI, RapidOCR, ONNX Runtime, pypdfium2, Pillow
  - `ml-model/venv/` — PyTorch, torchvision, NumPy, OpenCV

---

### 1. Start the Backend

```powershell
cd Safe-rx\backend
.\venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

Verify backend health at `http://127.0.0.1:8000/health` (returns `{"status": "healthy"}`).

Interactive documentation:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

---

### 2. Start the Frontend

In a separate terminal:

```powershell
cd Safe-rx\frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Verification & Testing Summary

All features have been tested and verified locally:

1. **Frontend Production Build:**
   - Compiled with `npm run build` using Vite and TypeScript.
   - 1,606 modules transformed with **0 errors**.

2. **End-to-End Local OCR Pipeline Test:**
   - Tested using a realistic multi-line prescription image containing `Dolo 650`, `Calpol 650`, and `Cetirizine`.
   - RapidOCR successfully extracted text lines locally and identified candidate medicines.
   - Token boundary joining handling verified: `Dolo650` → `Dolo 650`, `Calpol650mg` → `Calpol 650 mg`, `Cetirizine10mg` → `Cetirizine 10 mg`.
   - Detail extraction verified: extracted dosages, frequencies (e.g., `Twice Daily`), and durations (e.g., `3 days`).
   - Duplicate prevention verified: multiple mentions of the same medicine collapsed to a single entry.
   - Non-medicine test verified: prescription containing general patient details without catalog medicines returned `medicines: []` without guessing or hallucinations.
   - OCR test suite executed with **78 / 78 passing checks** covering normalization, detail extraction, de-duplication, and error handling.

3. **Backend API Endpoints Validation:**
   - All 7 API endpoints validated and operational:
     - `GET /health` → Status healthy
     - `GET /` → Root welcoming message
     - `GET /api/test` → Connection confirmation
     - `POST /api/safe-guard/check` → Duplicate salt detection verified
     - `POST /api/safe-save/check` → Generic savings calculation verified
     - `POST /api/prescription/extract` → Local OCR extraction verified
     - `POST /api/ml/predict-word` → ResNet-18 classification verified

---

## ML Model Details (Isolated Demo)

### Dataset: RxHandBD

The handwritten medicine classifier was trained on the **RxHandBD** academic benchmark dataset for handwritten prescription word recognition.

| Property | Value |
|---|---|
| Source | RxHandBD benchmark dataset |
| Scope | Isolated single-word cropped images |
| Total images | 616 (6-class stratified subset) |
| Train split | 432 images (70%) |
| Validation split | 92 images (15%) |
| Test split | 92 images (15%) |
| Supported classes | Algin, Dexter, Napa, Nexe, Omeprazole, Voltalin |

> **Important:** RxHandBD consists of **isolated cropped words**, not full multi-line prescription pages. The ML model is designed solely to classify these isolated words and is not connected to the main document OCR flow.

### Architecture & Benchmark Performance

- **Architecture:** ResNet-18 (ImageNet transfer learning) with final layer modified for 6-class output.
- **Validation Accuracy:** **98.91%**
- **Test-Set Accuracy:** **94.57%** (on 92 held-out images)
- **Checkpoint:** `ml-model/outputs/best_model.pth` (128 MB)

---

## Known Limitations

To maintain academic rigor and transparency, the current prototype has several acknowledged limitations:

| Category | Limitation | Description |
|---|---|---|
| **OCR Accuracy & Handwriting** | Variable recognition on handwriting | RapidOCR is trained primarily on printed and semi-structured text. Cursive, faint, or highly degraded clinical handwriting may produce unrecognized or fragmented text lines. |
| **Catalog Coverage** | Closed prototype catalog | Candidate medicine extraction relies on a small curated dictionary. Prescriptions containing medicines outside this catalog will yield no automatic candidates and require manual user entry. |
| **Safety Gate** | Mandatory human verification | The system intentionally does not pass OCR extractions directly to safety checks without human confirmation. Verification is mandatory by design. |
| **Not Clinical Advice** | Educational prototype only | SAFE-Guard and SAFE-Save operate on simplified demonstration databases. They do not account for contraindications, organ clearance, allergy profiles, or complete drug–drug interactions. |
| **Isolated ML Classifier** | Closed-set 6-class model | The ResNet-18 model always classifies inputs into one of its 6 trained classes and cannot reliably reject out-of-vocabulary words. It is strictly confined to `/ml-demo`. |
| **Authentication** | Client-side mock auth | User credentials are saved in browser `localStorage` for UI state demonstration only; no secure server-side session or database authentication is implemented. |

---

## API Reference

Base URL: `http://127.0.0.1:8000`

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Server health check |
| `GET` | `/api/test` | Frontend–backend connectivity verification |
| `POST` | `/api/prescription/extract` | Local RapidOCR text & medicine candidate extraction |
| `POST` | `/api/safe-guard/check` | Duplicate active salt analysis for a list of medicine names |
| `POST` | `/api/safe-save/check` | Generic savings and alternative lookup |
| `POST` | `/api/ml/predict-word` | Isolated 6-class handwritten medicine-word classification |

### `POST /api/prescription/extract`

**Request:** `multipart/form-data` with field `file` (`.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf`).

**Response Example:**
```json
{
  "success": true,
  "raw_text": "City Clinic Prescription\n1. Dolo 650 mg - twice daily for 3 days\n2. Cetirizine 10 mg - at night for 5 days",
  "line_count": 3,
  "lines": [
    { "text": "City Clinic Prescription", "score": 94.2, "box": [...] },
    { "text": "1. Dolo 650 mg - twice daily for 3 days", "score": 91.5, "box": [...] },
    { "text": "2. Cetirizine 10 mg - at night for 5 days", "score": 93.1, "box": [...] }
  ],
  "medicines": [
    {
      "id": "med-ocr-1",
      "brandName": "Dolo 650",
      "activeIngredient": "Paracetamol",
      "strength": "650 mg",
      "dosage": "1 tablet",
      "frequency": "Twice Daily",
      "duration": "3 days",
      "confidence": 91.5
    },
    {
      "id": "med-ocr-2",
      "brandName": "Cetirizine",
      "activeIngredient": "Cetirizine",
      "strength": "10 mg",
      "dosage": "1 tablet",
      "frequency": "At Night",
      "duration": "5 days",
      "confidence": 93.1
    }
  ],
  "engine": "RapidOCR (Local ONNX)",
  "message": "Extracted 2 candidate medicine(s) using local OCR. Please verify all details before proceeding."
}
```

---

## Academic Context

| Item | Detail |
|---|---|
| Level | 2nd Year B.Tech Computer Science and Engineering |
| Project Type | Academic prototype (Software engineering + Applied Machine Learning) |
| OCR Engine | RapidOCR (Local ONNX Runtime) + pypdfium2 |
| ML Dataset | RxHandBD (Bengali/English handwritten medicine-word benchmark) |
| ML Model | ResNet-18 (Transfer learning from ImageNet) |
| ML Test Accuracy | 94.57% on 92 held-out test images across 6 classes |

---

*SAFE-Rx is an educational prototype and not a certified medical device. Always consult a licensed physician or pharmacist for clinical medication decisions.*
