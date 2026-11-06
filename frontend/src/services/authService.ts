// Mock authentication. Replace with the real backend session once it is integrated.

export interface AuthUser {
  name: string;
  email: string;
}

const STORAGE_KEY = 'saferx.mockUser';

export function getStoredUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function persistUser(user: AuthUser) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
}

function deriveName(email: string) {
  const local = email.split('@')[0] ?? 'Patient';
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (!email.includes('@') || password.length < 6) {
    throw new Error('Enter a valid email and a password with at least 6 characters.');
  }
  return persistUser({ name: deriveName(email), email });
}

export async function signUp(name: string, email: string, password: string): Promise<AuthUser> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (!name.trim()) {
    throw new Error('Please enter your full name.');
  }
  if (!email.includes('@')) {
    throw new Error('Enter a valid email address.');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }
  return persistUser({ name: name.trim(), email });
}

export function signOut() {
  window.localStorage.removeItem(STORAGE_KEY);
}
