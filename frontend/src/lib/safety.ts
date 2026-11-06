import { ingredientAdvisories } from '@/data/mockData';
import type { Medicine, SafetyFinding, Severity } from '@/types/medication';

const severityOrder: Record<Severity, number> = { high: 0, moderate: 1, low: 2, safe: 3 };

function normalizeIngredient(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function displayIngredient(value: string) {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function runSafetyChecks(medicines: Medicine[]): SafetyFinding[] {
  const groups = new Map<string, Medicine[]>();

  for (const medicine of medicines) {
    const key = normalizeIngredient(medicine.activeIngredient);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), medicine]);
  }

  const findings: SafetyFinding[] = [];

  for (const [key, group] of groups) {
    const ingredient = displayIngredient(group[0].activeIngredient);
    const brands = group.map((medicine) => medicine.brandName);

    if (group.length > 1) {
      findings.push({
        id: `duplicate-${key}`,
        ingredient,
        severity: 'high',
        title: `Duplicate active ingredient: ${ingredient}`,
        description: `${brands.join(' and ')} both contain ${ingredient}. Taking them together can add up to an unsafe daily dose.`,
        medicines: brands,
      });
      continue;
    }

    const advisory = ingredientAdvisories[key];
    if (advisory) {
      findings.push({
        id: `advisory-${key}`,
        ingredient,
        severity: 'low',
        title: `Side effect to note: ${ingredient}`,
        description: advisory,
        medicines: brands,
      });
      continue;
    }

    findings.push({
      id: `clear-${key}`,
      ingredient,
      severity: 'safe',
      title: `No duplicate found: ${ingredient}`,
      description: `${brands[0]} is the only medicine on this prescription with ${ingredient}.`,
      medicines: brands,
    });
  }

  return findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}
