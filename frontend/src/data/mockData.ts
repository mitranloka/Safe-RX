import type { GenericAlternative, Medicine, PrescriptionRecord } from '@/types/medication';

export const sampleExtractedMedicines: Medicine[] = [
  {
    id: 'med-dolo-650',
    brandName: 'Dolo 650',
    activeIngredient: 'Paracetamol',
    strength: '650 mg',
    dosage: '1 tablet',
    frequency: 'Every 6 hours if fever persists',
    duration: '3 days',
  },
  {
    id: 'med-calpol-650',
    brandName: 'Calpol 650',
    activeIngredient: 'Paracetamol',
    strength: '650 mg',
    dosage: '1 tablet',
    frequency: 'Every 6 hours as needed',
    duration: '3 days',
  },
  {
    id: 'med-cetirizine',
    brandName: 'Cetirizine',
    activeIngredient: 'Cetirizine',
    strength: '10 mg',
    dosage: '1 tablet',
    frequency: 'Once daily at night',
    duration: '5 days',
  },
];

export const ingredientAdvisories: Record<string, string> = {
  cetirizine:
    'Cetirizine can cause drowsiness. Avoid driving or operating machinery until you know how it affects you.',
};

export const genericAlternatives: GenericAlternative[] = [
  {
    id: 'alt-dolo',
    brandName: 'Dolo 650',
    brandPrice: 30,
    genericName: 'Paracetamol 650 mg Tablet',
    genericPrice: 12,
    activeIngredient: 'Paracetamol',
    strength: '650 mg',
    packSize: 'Strip of 15 tablets',
  },
  {
    id: 'alt-calpol',
    brandName: 'Calpol 650',
    brandPrice: 36,
    genericName: 'Paracetamol 650 mg Tablet',
    genericPrice: 12,
    activeIngredient: 'Paracetamol',
    strength: '650 mg',
    packSize: 'Strip of 15 tablets',
  },
  {
    id: 'alt-cetirizine',
    brandName: 'Zyrtec 10',
    brandPrice: 95,
    genericName: 'Cetirizine 10 mg Tablet',
    genericPrice: 22,
    activeIngredient: 'Cetirizine',
    strength: '10 mg',
    packSize: 'Strip of 10 tablets',
  },
];

export const recentPrescriptions: PrescriptionRecord[] = [
  {
    id: 'rx-1042',
    title: 'Fever and seasonal allergy',
    issuedOn: '2026-10-28',
    doctor: 'Dr. Ananya Rao',
    medicineCount: 3,
    status: 'needs-review',
  },
  {
    id: 'rx-1031',
    title: 'Blood pressure follow-up',
    issuedOn: '2026-09-14',
    doctor: 'Dr. Vikram Shah',
    medicineCount: 2,
    status: 'verified',
  },
  {
    id: 'rx-1017',
    title: 'Routine vitamin supplements',
    issuedOn: '2026-07-02',
    doctor: 'Dr. Meera Iyer',
    medicineCount: 1,
    status: 'verified',
  },
];

export const dashboardSummary = {
  activeMedications: 3,
  safetyChecks: 12,
  potentialWarnings: 1,
};
