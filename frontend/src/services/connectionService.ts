export interface ConnectionTest {
  status: string;
  message: string;
}

const API_BASE_URL = 'http://127.0.0.1:8000';

export async function testBackendConnection(): Promise<ConnectionTest> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/test`);
  } catch {
    throw new Error('The backend is not reachable. Start it on port 8000 and try again.');
  }

  if (!response.ok) {
    throw new Error(`The backend responded with status ${response.status}.`);
  }

  const data: unknown = await response.json();
  if (!isConnectionTest(data)) {
    throw new Error('The backend returned an unexpected response.');
  }

  return data;
}

function isConnectionTest(value: unknown): value is ConnectionTest {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.status === 'string' && typeof record.message === 'string';
}
