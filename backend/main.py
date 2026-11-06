from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from services.safe_guard import check_medicines
from services.safe_save import check_savings
from services.ml_bridge import predict_word_image
from services.ocr_service import extract_prescription_text

app = FastAPI(
    title="SAFE-Rx API",
    description="Backend API for the SAFE-Rx medication safety platform",
    version="1.0.0"
)

# Vite serves the React app from either of these origins during local development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Welcome to the SAFE-Rx API",
        "status": "Backend is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


@app.get("/api/test")
def test_connection():
    return {
        "status": "ok",
        "message": "SAFE-Rx frontend and backend connection is successful."
    }


class SafeGuardRequest(BaseModel):
    medicines: list[str] = Field(default_factory=list)


@app.post("/api/safe-guard/check")
def safe_guard_check(payload: SafeGuardRequest):
    return check_medicines(payload.medicines)


class SafeSaveRequest(BaseModel):
    medicines: list[str] = Field(default_factory=list)


@app.post("/api/safe-save/check")
def safe_save_check(payload: SafeSaveRequest):
    return check_savings(payload.medicines)


# ---------------------------------------------------------------------------
# Prescription OCR Text Extraction Endpoint (Local Offline OCR)
# ---------------------------------------------------------------------------
@app.post("/api/prescription/extract")
def extract_prescription(file: UploadFile = File(...)):
    """
    Extracts text from an uploaded prescription image or PDF using local RapidOCR,
    and identifies candidate medicines. Does not use external AI APIs.
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No prescription file was uploaded.")

    content = file.file.read()
    if not content or len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        result = extract_prescription_text(
            file_bytes=content,
            filename=file.filename,
            content_type=file.content_type or ""
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")


# ---------------------------------------------------------------------------
# ML Prediction Endpoint (Lightweight Prototype Bridge)
# ---------------------------------------------------------------------------
@app.post("/api/ml/predict-word")
def predict_word(file: UploadFile = File(...)):
    """
    Predicts the handwritten medicine name from a single cropped word image.
    Supports only the 6 prototype classes: Algin, Dexter, Napa, Nexe, Omeprazole, Voltalin.
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No image file was uploaded.")

    content = file.file.read()
    if not content or len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        result = predict_word_image(
            image_bytes=content,
            filename=file.filename,
            content_type=file.content_type or ""
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference processing failed: {str(e)}")
