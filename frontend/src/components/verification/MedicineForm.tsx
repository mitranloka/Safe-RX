import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Medicine } from '@/types/medication';
import Button from '@/components/ui/Button';
import TextField from '@/components/ui/TextField';

interface MedicineFormProps {
  medicine: Medicine;
  onSave: (medicine: Medicine) => void;
  onCancel: () => void;
  onRemove: () => void;
}

type FormValues = Omit<Medicine, 'id'>;

const fieldConfig: { key: keyof FormValues; label: string; placeholder: string }[] = [
  { key: 'brandName', label: 'Medicine name', placeholder: 'e.g. Dolo 650' },
  { key: 'activeIngredient', label: 'Active ingredient', placeholder: 'e.g. Paracetamol' },
  { key: 'strength', label: 'Strength', placeholder: 'e.g. 650 mg' },
  { key: 'dosage', label: 'Dosage', placeholder: 'e.g. 1 tablet' },
  { key: 'frequency', label: 'How often', placeholder: 'e.g. Twice daily' },
  { key: 'duration', label: 'For how long', placeholder: 'e.g. 5 days' },
];

export default function MedicineForm({ medicine, onSave, onCancel, onRemove }: MedicineFormProps) {
  const [values, setValues] = useState<FormValues>({
    brandName: medicine.brandName,
    activeIngredient: medicine.activeIngredient,
    strength: medicine.strength,
    dosage: medicine.dosage,
    frequency: medicine.frequency,
    duration: medicine.duration,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});

  const handleSave = () => {
    const nextErrors: Partial<Record<keyof FormValues, string>> = {};
    if (!values.brandName.trim()) nextErrors.brandName = 'Enter the medicine name.';
    if (!values.activeIngredient.trim()) nextErrors.activeIngredient = 'Enter the active ingredient.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSave({
      id: medicine.id,
      brandName: values.brandName.trim(),
      activeIngredient: values.activeIngredient.trim(),
      strength: values.strength.trim(),
      dosage: values.dosage.trim(),
      frequency: values.frequency.trim(),
      duration: values.duration.trim(),
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {fieldConfig.map(({ key, label, placeholder }) => (
          <TextField
            key={key}
            id={`${medicine.id}-${key}`}
            label={label}
            placeholder={placeholder}
            value={values[key]}
            error={errors[key]}
            onChange={(event) => {
              const nextValue = event.target.value;
              setValues((current) => ({ ...current, [key]: nextValue }));
            }}
          />
        ))}
      </div>
      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="danger-ghost" size="sm" onClick={onRemove}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Remove medicine
        </Button>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" onClick={onCancel} className="flex-1 sm:flex-none">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="flex-1 sm:flex-none">
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MedicineDetails({ medicine, onEdit }: { medicine: Medicine; onEdit: () => void }) {
  const rows = [
    { label: 'Active ingredient', value: `${medicine.activeIngredient} ${medicine.strength}`.trim() },
    { label: 'Dosage', value: medicine.dosage || 'Not specified' },
    { label: 'How often', value: medicine.frequency || 'Not specified' },
    { label: 'For how long', value: medicine.duration || 'Not specified' },
  ];

  return (
    <div>
      <dl className="grid gap-4 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl bg-slate-50 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{row.label}</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex justify-end">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Edit details
        </Button>
      </div>
    </div>
  );
}
