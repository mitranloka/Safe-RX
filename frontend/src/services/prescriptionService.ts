import { genericAlternatives, recentPrescriptions, sampleExtractedMedicines } from '@/data/mockData';
import type { GenericAlternative, Medicine, PrescriptionRecord } from '@/types/medication';

// Mock prescription service. Replace the bodies with calls to the FastAPI backend
// and the trained model once they are available; callers should not need to change.

const SIMULATED_DELAY_MS = 2200;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function analyzePrescription(file: File): Promise<Medicine[]> {
  await delay(SIMULATED_DELAY_MS);
  if (!file) {
    throw new Error('No prescription file was provided.');
  }
  return sampleExtractedMedicines.map((medicine) => ({ ...medicine }));
}

export async function getRecentPrescriptions(): Promise<PrescriptionRecord[]> {
  await delay(300);
  return recentPrescriptions;
}

export async function getGenericAlternatives(): Promise<GenericAlternative[]> {
  await delay(300);
  return genericAlternatives;
}
