import { useState } from 'react';
import { ArrowRight, FileUp, Pill, Plus } from 'lucide-react';
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
    dosage: '',
    frequency: '',
    duration: '',
  };
}

export default function VerificationPage() {
  const { navigate } = useRouter();
  const { file, medicines, setMedicines } = usePrescription();
  const [draft, setDraft] = useState<Medicine[]>(medicines);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (medicines.length === 0 || !file) {
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
        <section aria-label="Original prescription" className="lg:sticky lg:top-24">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Original prescription
          </h2>
          <FilePreview file={file} />
        </section>

        <section aria-label="Extracted medicines" className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Extracted medicines ({draft.length})
          </h2>

          {draft.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
              No medicines left. Add a medicine to continue.
            </p>
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
