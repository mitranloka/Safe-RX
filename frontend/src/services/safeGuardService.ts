import type { SafetyFinding, Severity } from '@/types/medication';

export interface SafeGuardMedicineResult {
  name: string;
  normalizedName: string;
  found: boolean;
  activeSalt: string | null;
  status: 'found' | 'not_found';
}

export interface SafeGuardWarning {
  activeSalt: string;
  medicines: string[];
  message: string;
}

export interface SafeGuardCheck {
  medicines: SafeGuardMedicineResult[];
  warnings: SafeGuardWarning[];
  disclaimer: string;
}

const API_BASE_URL = 'http://127.0.0.1:8000';

const severityOrder: Record<Severity, number> = { high: 0, moderate: 1, low: 2, safe: 3 };

export async function checkSafeGuard(medicineNames: string[]): Promise<SafeGuardCheck> {
  if (medicineNames.length === 0) {
    return { medicines: [], warnings: [], disclaimer: '' };
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/safe-guard/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medicines: medicineNames }),
    });
  } catch {
    throw new Error('The backend is not reachable. Start it on port 8000 and try again.');
  }

  if (!response.ok) {
    throw new Error(`The backend responded with status ${response.status}.`);
  }

  const data: unknown = await response.json();
  if (!isSafeGuardCheck(data)) {
    throw new Error('The backend returned an unexpected response.');
  }

  return toSafeGuardCheck(data);
}

export function toSafetyFindings(result: SafeGuardCheck): SafetyFinding[] {
  const duplicated = new Set(result.warnings.flatMap((warning) => warning.medicines));
  const findings: SafetyFinding[] = result.warnings.map((warning) => ({
    id: `duplicate-${warning.activeSalt.toLowerCase()}`,
    severity: 'high',
    title: `Duplicate active salt: ${warning.activeSalt}`,
    description: warning.message,
    medicines: warning.medicines,
    ingredient: warning.activeSalt,
  }));

  result.medicines.forEach((medicine, index) => {
    if (!medicine.found || !medicine.activeSalt) {
      findings.push({
        id: `missing-${index}-${medicine.normalizedName || 'blank'}`,
        severity: 'low',
        title: 'Not found in prototype database',
        description: `${medicine.name || 'This medicine'} is not found in the prototype database, so its active salt was not identified.`,
        medicines: [medicine.name || 'Unnamed medicine'],
        ingredient: '',
      });
      return;
    }

    if (duplicated.has(medicine.name)) return;

    findings.push({
      id: `clear-${index}-${medicine.normalizedName}`,
      severity: 'safe',
      title: `No duplicate found: ${medicine.activeSalt}`,
      description: `${medicine.name} is the only medicine in this check with the active salt ${medicine.activeSalt}. This prototype result is for learning only.`,
      medicines: [medicine.name],
      ingredient: medicine.activeSalt,
    });
  });

  return findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

interface RawSafeGuardCheck {
  medicines: {
    name: string;
    normalized_name: string;
    found: boolean;
    active_salt: string | null;
    status: string;
  }[];
  warnings: {
    active_salt: string;
    medicines: string[];
    message: string;
  }[];
  disclaimer: string;
}

function isSafeGuardCheck(value: unknown): value is RawSafeGuardCheck {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return Array.isArray(record.medicines) && Array.isArray(record.warnings) && typeof record.disclaimer === 'string';
}

function toSafeGuardCheck(raw: RawSafeGuardCheck): SafeGuardCheck {
  return {
    disclaimer: raw.disclaimer,
    warnings: raw.warnings.map((warning) => ({
      activeSalt: warning.active_salt,
      medicines: warning.medicines,
      message: warning.message,
    })),
    medicines: raw.medicines.map((medicine) => ({
      name: medicine.name,
      normalizedName: medicine.normalized_name,
      found: medicine.found,
      activeSalt: medicine.active_salt,
      status: medicine.status === 'found' ? 'found' : 'not_found',
    })),
  };
}
