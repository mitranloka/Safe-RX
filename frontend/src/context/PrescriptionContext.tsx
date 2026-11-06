import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Medicine } from '@/types/medication';

interface PrescriptionContextValue {
  file: File | null;
  medicines: Medicine[];
  setFile: (file: File | null) => void;
  setMedicines: (medicines: Medicine[]) => void;
  reset: () => void;
}

const PrescriptionContext = createContext<PrescriptionContextValue | null>(null);

export function PrescriptionProvider({ children }: { children: ReactNode }) {
  const [file, setFileState] = useState<File | null>(null);
  const [medicines, setMedicinesState] = useState<Medicine[]>([]);

  const setFile = useCallback((nextFile: File | null) => setFileState(nextFile), []);
  const setMedicines = useCallback((next: Medicine[]) => setMedicinesState(next), []);

  const reset = useCallback(() => {
    setFileState(null);
    setMedicinesState([]);
  }, []);

  const value = useMemo(
    () => ({ file, medicines, setFile, setMedicines, reset }),
    [file, medicines, setFile, setMedicines, reset],
  );

  return <PrescriptionContext.Provider value={value}>{children}</PrescriptionContext.Provider>;
}

export function usePrescription() {
  const context = useContext(PrescriptionContext);
  if (!context) {
    throw new Error('usePrescription must be used within a PrescriptionProvider');
  }
  return context;
}
