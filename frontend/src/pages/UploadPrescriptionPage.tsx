import { useState } from 'react';
import { ArrowRight, FileCheck2, FileSearch, Loader2, TriangleAlert, X } from 'lucide-react';
import { usePrescription } from '@/context/PrescriptionContext';
import { useRouter } from '@/lib/router';
import { analyzePrescription } from '@/services/prescriptionService';
import { validatePrescriptionFile } from '@/lib/prescriptionFile';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import DropZone from '@/components/upload/DropZone';
import FilePreview from '@/components/upload/FilePreview';

export default function UploadPrescriptionPage() {
  const { navigate } = useRouter();
  const { file, setFile, setMedicines } = usePrescription();
  const [error, setError] = useState<string | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);

  const handleFileSelect = (selected: File) => {
    const validationError = validatePrescriptionFile(selected);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setFile(selected);
  };

  const handleAnalyse = async () => {
    if (!file) return;
    setError(null);
    setIsAnalysing(true);
    try {
      const medicines = await analyzePrescription(file);
      setMedicines(medicines);
      navigate('/verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not read this prescription. Please try again.');
      setIsAnalysing(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setError(null);
  };

  return (
    <>
      <PageHeader
        title="Upload prescription"
        description="Add a clear photo or PDF of your prescription. We will read the medicines so you can verify them next."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <section className="min-w-0 space-y-6">
          {file ? (
            <div className="space-y-4 animate-fade-up">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Preview</h2>
                <Button variant="ghost" size="sm" onClick={handleRemove} disabled={isAnalysing}>
                  <X className="h-4 w-4" aria-hidden="true" />
                  Remove file
                </Button>
              </div>
              <FilePreview file={file} />
            </div>
          ) : (
            <DropZone onFileSelect={handleFileSelect} disabled={isAnalysing} />
          )}

          {error && (
            <p role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            {file && (
              <Button
                size="lg"
                onClick={handleAnalyse}
                disabled={isAnalysing}
                aria-busy={isAnalysing}
                className="w-full sm:w-auto"
              >
                {isAnalysing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    Analysing prescription...
                  </>
                ) : (
                  <>
                    <FileSearch className="h-5 w-5" aria-hidden="true" />
                    Analyse Prescription
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </>
                )}
              </Button>
            )}
          </div>
        </section>

        <aside className="space-y-4 lg:pt-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <FileCheck2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-base font-bold text-slate-900">Tips for a clear upload</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
              <li>Place the whole prescription in frame, with good light and no glare.</li>
              <li>Make sure medicine names and strengths are easy to read.</li>
              <li>Upload every page if your prescription spans more than one.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm leading-relaxed text-slate-600">
            <p className="font-semibold text-slate-800">Accepted formats</p>
            <p className="mt-1">JPG, PNG, WEBP or PDF, up to 10 MB per file.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
