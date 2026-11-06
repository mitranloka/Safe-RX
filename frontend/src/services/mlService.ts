export interface TopPrediction {
  medicine: string;
  confidence: number;
}

export interface MLPredictionResponse {
  predicted_medicine: string;
  confidence: number;
  top_predictions: TopPrediction[];
  supported_classes: string[];
  prototype_limitation: string;
}

const API_BASE_URL = 'http://127.0.0.1:8000';

export async function predictHandwrittenWord(file: File): Promise<MLPredictionResponse> {
  const formData = new FormData();
  formData.append('file', file);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/ml/predict-word`, {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw new Error('The backend ML service is not reachable. Ensure FastAPI is running on port 8000.');
  }

  if (!response.ok) {
    let errorDetail = `Backend returned status ${response.status}.`;
    try {
      const errJson = await response.json();
      if (errJson && typeof errJson.detail === 'string') {
        errorDetail = errJson.detail;
      }
    } catch {
      // Fallback to generic status error if JSON parsing fails
    }
    throw new Error(errorDetail);
  }

  const data: unknown = await response.json();
  if (!isMLPredictionResponse(data)) {
    throw new Error('The backend returned an unexpected response structure.');
  }

  return data;
}

function isMLPredictionResponse(value: unknown): value is MLPredictionResponse {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.predicted_medicine === 'string' &&
    typeof record.confidence === 'number' &&
    Array.isArray(record.top_predictions) &&
    Array.isArray(record.supported_classes) &&
    typeof record.prototype_limitation === 'string'
  );
}
