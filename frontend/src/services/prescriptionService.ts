import { recentPrescriptions, sampleExtractedMedicines, genericAlternatives } from '@/data/mockData';
import type { GenericAlternative, Medicine, PrescriptionRecord } from '@/types/medication';

const API_BASE_URL = 'http://127.0.0.1:8000';

export interface PrescriptionExtractionResult {
  medicines: Medicine[];
  rawText: string;
  isSampleData: boolean;
  message: string;
}

export async function analyzePrescription(file: File): Promise<PrescriptionExtractionResult> {
  if (!file) {
    throw new Error('No prescription file was provided.');
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/prescription/extract`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      const detail = errData?.detail || `OCR service responded with status ${response.status}`;
      throw new Error(detail);
    }

    const data = await response.json();
    const rawMedicines = Array.isArray(data.medicines) ? data.medicines : [];
    const medicines: Medicine[] = rawMedicines.map((m: any, idx: number) => ({
      id: m.id || `med-ocr-${idx + 1}`,
      brandName: m.brandName || '',
      activeIngredient: m.activeIngredient || '',
      strength: m.strength || '',
      dosage: m.dosage || '1 tablet',
      frequency: m.frequency || 'As directed',
      duration: m.duration || '3 days',
    }));

    return {
      medicines,
      rawText: data.raw_text || '',
      isSampleData: false,
      message: data.message || 'Prescription processed successfully with local OCR.',
    };
  } catch (err: any) {
    // If the error was an explicit user/validation error from the backend, bubble it up
    if (
      err?.message &&
      (err.message.includes('Unsupported') ||
        err.message.includes('empty') ||
        err.message.includes('Corrupt') ||
        err.message.includes('corrupt'))
    ) {
      throw err;
    }

    // Otherwise, backend is unreachable or experienced a transient issue:
    // Fall back to sample demonstration data so the user can still test the flow offline
    console.warn('Backend OCR unreachable or failed, falling back to sample demo data:', err);
    return {
      medicines: sampleExtractedMedicines.map((m) => ({ ...m })),
      rawText: 'Paracetamol 650 mg - 1 tablet twice daily\nCetirizine 10 mg - 1 tablet at night\n(Offline sample data fallback)',
      isSampleData: true,
      message: 'Backend OCR was unreachable. Loaded sample prescription data for demonstration.',
    };
  }
}

export async function getRecentPrescriptions(): Promise<PrescriptionRecord[]> {
  return recentPrescriptions;
}

export async function getGenericAlternatives(): Promise<GenericAlternative[]> {
  return genericAlternatives;
}
