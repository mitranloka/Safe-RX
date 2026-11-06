import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Medicine } from '@/types/medication';

interface PrescriptionContextValue {
  file: File | null;
  medicines: Medicine[];
  rawText: string;
  isSampleData: boolean;
  ocrMessage: string;
  setFile: (file: File | null) => void;
  setMedicines: (medicines: Medicine[]) => void;
  setExtractionResult: (result: {
    medicines: Medicine[];
    rawText: string;
    isSampleData: boolean;
    message: string;
  }) => void;
  reset: () => void;
}

const PrescriptionContext = createContext<PrescriptionContextValue | null>(null);

export function PrescriptionProvider({ children }: { children: ReactNode }) {
  const [file, setFileState] = useState<File | null>(null);
  const [medicines, setMedicinesState] = useState<Medicine[]>([]);
  const [rawText, setRawTextState] = useState<string>('');
  const [isSampleData, setIsSampleDataState] = useState<boolean>(false);
  const [ocrMessage, setOcrMessageState] = useState<string>('');

  const setFile = useCallback((nextFile: File | null) => setFileState(nextFile), []);
  const setMedicines = useCallback((next: Medicine[]) => setMedicinesState(next), []);

  const setExtractionResult = useCallback(
    (result: { medicines: Medicine[]; rawText: string; isSampleData: boolean; message: string }) => {
      setMedicinesState(result.medicines);
      setRawTextState(result.rawText);
      setIsSampleDataState(result.isSampleData);
      setOcrMessageState(result.message);
    },
    [],
  );

  const reset = useCallback(() => {
    setFileState(null);
    setMedicinesState([]);
    setRawTextState('');
    setIsSampleDataState(false);
    setOcrMessageState('');
  }, []);

  const value = useMemo(
    () => ({
      file,
      medicines,
      rawText,
      isSampleData,
      ocrMessage,
      setFile,
      setMedicines,
      setExtractionResult,
      reset,
    }),
    [file, medicines, rawText, isSampleData, ocrMessage, setFile, setMedicines, setExtractionResult, reset],
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
