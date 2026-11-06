import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  FileUp,
  Info,
  Pill,
  Plus,
} from 'lucide-react';
import { useRouter } from '@/lib/router';
import { usePrescription } from '@/context/PrescriptionContext';
import type { Medicine } from '@/types/medication';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import FilePreview from '@/components/upload/FilePreview';
import MedicineForm, { MedicineDetails } from '@/components/verification/MedicineForm';

function createBlankMedicine(): Medicine {
  return {
    id: `med-new-${Date.now()}`,
    brandName: '',
    activeIngredient: '',
    strength: '',
    dosage: '1 tablet',
    frequency: 'Once daily',
    duration: '3 days',
  };
}

export default function VerificationPage() {
  const { navigate } = useRouter();
  const { file, medicines, setMedicines, rawText, isSampleData, ocrMessage } = usePrescription();
  const [draft, setDraft] = useState<Medicine[]>(medicines);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState<boolean>(false);

  if (!file) {
    return (
      <>
        <PageHeader title="Verify medicines" />
        <EmptyState
          icon={FileUp}
          title="No prescription to verify yet"
          description="Upload a prescription first. We will extract the medicines here so you can check and correct them."
          action={
            <Button onClick={() => navigate('/upload')}>
              Upload prescription
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          }
        />
      </>
    );
  }

  const updateMedicine = (updated: Medicine) => {
    setDraft((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setEditingId(null);
  };

  const removeMedicine = (id: string) => {
    setDraft((current) => current.filter((item) => item.id !== id));
    setEditingId(null);
  };

  const cancelEdit = (medicine: Medicine) => {
    if (!medicine.brandName.trim() && !medicine.activeIngredient.trim()) {
      removeMedicine(medicine.id);
    }
    setEditingId(null);
  };

  const addMedicine = () => {
    const blank = createBlankMedicine();
    setDraft((current) => [...current, blank]);
    setEditingId(blank.id);
  };

  const confirmAndCheck = () => {
    setMedicines(draft);
    navigate('/safe-guard');
  };

  const isEditing = editingId !== null;

  return (
    <>
      <PageHeader
        title="Verify medicines"
        description="Compare the medicines we read with your original prescription. Edit anything that does not match before running safety checks."
        actions={
          <Button variant="secondary" onClick={addMedicine} disabled={isEditing}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add medicine
          </Button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
        <section aria-label="Original prescription" className="lg:sticky lg:top-24 space-y-4">
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Original prescription
            </h2>
            <FilePreview file={file} />
          </div>

          {rawText && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <button
                type="button"
                onClick={() => setShowRawText((prev) => !prev)}
                className="flex w-full items-center justify-between text-left text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                <span className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-slate-500" />
                  Extracted OCR Text
                </span>
                {showRawText ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {showRawText && (
                <div className="mt-3">
                  <pre className="max-h-52 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-2.5 font-mono text-xs text-slate-700 border border-slate-200">
                    {rawText}
                  </pre>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Extracted locally via RapidOCR (ONNX).
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        <section aria-label="Extracted medicines" className="space-y-4">
          {isSampleData ? (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-semibold">Sample Demo Data Active</p>
                <p className="mt-0.5 text-xs text-amber-800">
                  {ocrMessage || 'Backend OCR service was unreachable. Loaded sample prescription data for offline demonstration.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-semibold">Local OCR Baseline Active</p>
                <p className="mt-0.5 text-xs text-emerald-800">
                  {ocrMessage || 'Prescription text was scanned locally. Verification is mandatory—please ensure all medicines and dosages match.'}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Extracted medicines ({draft.length})
            </h2>
            <span className="text-xs text-slate-400">Human verification mandatory</span>
          </div>

          {draft.length === 0 && (
            <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 p-6 text-center text-sm text-slate-700">
              <p className="font-semibold text-slate-900">No medicines identified automatically</p>
              <p className="mt-1 text-slate-600">
                Text was extracted from the document, but no catalog medicines were recognized with high confidence.
                Please review the document and click <strong>&quot;Add medicine&quot;</strong> above to enter your prescribed medications.
              </p>
            </div>
          )}

          {draft.map((medicine) => {
            const isThisEditing = editingId === medicine.id;
            return (
              <article
                key={medicine.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 animate-fade-up sm:p-6 ${
                  isThisEditing ? 'border-brand-300 ring-4 ring-brand-50' : 'border-slate-200 hover:shadow-md'
                }`}
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Pill className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold text-slate-900">
                      {medicine.brandName.trim() || 'Unnamed medicine'}
                    </h3>
                    {!isThisEditing && medicine.strength && (
                      <p className="text-sm text-slate-500">{medicine.strength}</p>
                    )}
                  </div>
                </div>

                {isThisEditing ? (
                  <MedicineForm
                    medicine={medicine}
                    onSave={updateMedicine}
                    onCancel={() => cancelEdit(medicine)}
                    onRemove={() => removeMedicine(medicine.id)}
                  />
                ) : (
                  <MedicineDetails medicine={medicine} onEdit={() => setEditingId(medicine.id)} />
                )}
              </article>
            );
          })}

          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
            <Button
              size="lg"
              onClick={confirmAndCheck}
              disabled={isEditing || draft.length === 0}
              className="w-full sm:w-auto"
            >
              Confirm and run SAFE-Guard
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
          {isEditing && (
            <p className="text-right text-xs text-slate-500">Save or cancel your edit to continue.</p>
          )}
        </section>
      </div>
    </>
  );
}
