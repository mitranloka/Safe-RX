import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { UploadCloud } from 'lucide-react';
import {
  ACCEPTED_PRESCRIPTION_LABEL,
  ACCEPTED_PRESCRIPTION_TYPES,
} from '@/lib/prescriptionFile';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export default function DropZone({ onFileSelect, disabled = false }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onFileSelect(file);
    event.target.value = '';
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center rounded-3xl border-2 border-dashed px-6 py-14 text-center transition-all duration-200 ${
        isDragging
          ? 'scale-[1.01] border-brand-500 bg-brand-50'
          : 'border-slate-300 bg-white hover:border-brand-400 hover:bg-brand-50/40'
      }`}
    >
      <span
        className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${
          isDragging ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600'
        }`}
      >
        <UploadCloud className="h-8 w-8" aria-hidden="true" />
      </span>
      <h2 className="mt-5 text-lg font-bold text-slate-900">
        {isDragging ? 'Drop to upload' : 'Drag and drop your prescription here'}
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        {ACCEPTED_PRESCRIPTION_LABEL}, up to 10 MB
      </p>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-brand-800 shadow-sm transition-all hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Browse files
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_PRESCRIPTION_TYPES.join(',')}
        onChange={handleChange}
        className="sr-only"
        aria-label="Choose a prescription file"
        disabled={disabled}
      />
    </div>
  );
}
