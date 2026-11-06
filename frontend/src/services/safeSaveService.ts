/**
 * SAFE-Save API client.
 *
 * Sends verified medicine names to the backend and returns generic
 * alternative data with prototype prices.
 *
 * PROTOTYPE ONLY – all prices and alternatives returned by this service
 * are illustrative demo data and are not current, official, or verified.
 */

const API_BASE_URL = 'http://127.0.0.1:8000';

// --------------------------------------------------------------------------
// Public types
// --------------------------------------------------------------------------

export interface SafeSaveResult {
  name: string;
  normalizedName: string;
  found: boolean;
  activeSalt: string | null;
  genericName: string | null;
  brandPrice: number | null;
  genericPrice: number | null;
  packSize: string | null;
  savings: number | null;
  savingsPercent: number | null;
  status: 'found' | 'not_found';
}

export interface SafeSaveResponse {
  results: SafeSaveResult[];
  disclaimer: string;
}

// --------------------------------------------------------------------------
// API call
// --------------------------------------------------------------------------

export async function checkSafeSave(medicineNames: string[]): Promise<SafeSaveResponse> {
  if (medicineNames.length === 0) {
    return { results: [], disclaimer: '' };
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/safe-save/check`, {
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
  if (!isSafeSaveResponse(data)) {
    throw new Error('The backend returned an unexpected response.');
  }

  return toSafeSaveResponse(data);
}

// --------------------------------------------------------------------------
// Runtime type guard and mapper (snake_case → camelCase)
// --------------------------------------------------------------------------

interface RawSafeSaveResult {
  name: string;
  normalized_name: string;
  found: boolean;
  active_salt: string | null;
  generic_name: string | null;
  brand_price: number | null;
  generic_price: number | null;
  pack_size: string | null;
  savings: number | null;
  savings_percent: number | null;
  status: string;
}

interface RawSafeSaveResponse {
  results: RawSafeSaveResult[];
  disclaimer: string;
}

function isSafeSaveResponse(value: unknown): value is RawSafeSaveResponse {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return Array.isArray(record.results) && typeof record.disclaimer === 'string';
}

function toSafeSaveResponse(raw: RawSafeSaveResponse): SafeSaveResponse {
  return {
    disclaimer: raw.disclaimer,
    results: raw.results.map((r) => ({
      name: r.name,
      normalizedName: r.normalized_name,
      found: r.found,
      activeSalt: r.active_salt,
      genericName: r.generic_name,
      brandPrice: r.brand_price,
      genericPrice: r.generic_price,
      packSize: r.pack_size,
      savings: r.savings,
      savingsPercent: r.savings_percent,
      status: r.status === 'found' ? 'found' : 'not_found',
    })),
  };
}
