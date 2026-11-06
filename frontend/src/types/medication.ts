export interface Medicine {
  id: string;
  brandName: string;
  activeIngredient: string;
  strength: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export type Severity = 'high' | 'moderate' | 'low' | 'safe';

export interface SafetyFinding {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  medicines: string[];
  ingredient: string;
}

export interface GenericAlternative {
  id: string;
  brandName: string;
  brandPrice: number;
  genericName: string;
  genericPrice: number;
  activeIngredient: string;
  strength: string;
  packSize: string;
}

export type PrescriptionStatus = 'verified' | 'needs-review';

export interface PrescriptionRecord {
  id: string;
  title: string;
  issuedOn: string;
  doctor: string;
  medicineCount: number;
  status: PrescriptionStatus;
}
