import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  getStoredUser,
  signIn as signInRequest,
  signOut as signOutRequest,
  signUp as signUpRequest,
  type AuthUser,
} from '@/services/authService';

interface AuthContextValue {
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());

  const signIn = useCallback(async (email: string, password: string) => {
    setUser(await signInRequest(email, password));
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    setUser(await signUpRequest(name, email, password));
  }, []);

  const signOut = useCallback(() => {
    signOutRequest();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, signIn, signUp, signOut }),
    [user, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
