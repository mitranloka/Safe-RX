import { useState, useRef, type ChangeEvent, type DragEvent } from 'react';
import {
  FlaskConical,
  UploadCloud,
  FileText,
  AlertTriangle,
  Info,
  CheckCircle2,
  RefreshCw,
  X,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import {
  predictHandwrittenWord,
  type MLPredictionResponse,
} from '@/services/mlService';
import { formatFileSize } from '@/lib/format';

const SUPPORTED_CLASSES = [
  'Algin',
  'Dexter',
  'Napa',
  'Nexe',
  'Omeprazole',
  'Voltalin',
];

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function MLDemoPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MLPredictionResponse | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please upload a valid JPEG, PNG, or WEBP image.');
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setError(null);
    setResult(null);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileChange(file);
    e.target.value = '';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalysing(true);
    setError(null);
    setResult(null);

    try {
      const data = await predictHandwrittenWord(selectedFile);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inference request failed. Please check the backend.');
    } finally {
      setIsAnalysing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-up">
      <PageHeader
        title="ML Prototype Demo"
        description="Standalone demonstration of the trained ResNet-18 handwritten medicine-word classifier."
      />

      {/* Prototype Limitation Banner */}
      <div
        role="alert"
        className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm"
      >
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="space-y-2 text-sm text-amber-900">
            <p className="font-bold text-amber-950">
              Controlled 6-Class Prototype — NOT a General Prescription OCR System
            </p>
            <p className="leading-relaxed">
              This machine-learning model was trained exclusively on <strong>cropped single-word images</strong> from
              the academic <code>RxHandBD</code> dataset. It can only classify the 6 medicine classes shown below. It
              does <strong>not</strong> scan entire prescription sheets, read arbitrary handwriting, or extract dosage instructions.
            </p>
            <p className="text-xs text-amber-800">
              <span className="font-semibold">Safety Isolation:</span> This demo is completely detached from the core
              Prescription Upload workflow. Predictions here do not reach SAFE-Guard or SAFE-Save.
            </p>
          </div>
        </div>
      </div>

      {/* Supported Classes Reference */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <FlaskConical className="h-4 w-4 text-brand-600" aria-hidden="true" />
          Supported Medicine Classes ({SUPPORTED_CLASSES.length})
        </div>
        <p className="mt-1 text-xs text-slate-500">
          The closed-set classification model will assign any input image to one of these six candidate labels:
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUPPORTED_CLASSES.map((clsName) => (
            <span
              key={clsName}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
            >
              {clsName}
            </span>
          ))}
        </div>
      </div>

      {/* Upload and Inference Workspace */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Column: Image Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">1. Select Cropped Word Image</h2>
            {selectedFile && (
              <Button variant="ghost" size="sm" onClick={handleRemove} disabled={isAnalysing}>
                <X className="mr-1 h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>

          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
                isDragging
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-slate-300 bg-white hover:border-brand-400 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleInputChange}
              />
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <UploadCloud className="h-6 w-6" />
              </span>
              <p className="mt-4 text-sm font-semibold text-slate-900">
                Click or drag & drop a cropped word image
              </p>
              <p className="mt-1 text-xs text-slate-500">
                JPG, PNG, or WEBP (single handwritten word)
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-center bg-slate-100 p-6">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Cropped word preview"
                    className="max-h-56 max-w-full rounded-lg border border-slate-200 bg-white object-contain p-2 shadow-sm"
                  />
                )}
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{selectedFile.name}</p>
                    <p className="text-[11px] text-slate-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAnalyze}
                  disabled={isAnalysing}
                >
                  {isAnalysing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyze Word
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              {error}
            </div>
          )}
        </div>

        {/* Right Column: Prediction Output */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">2. Model Prediction Output</h2>

          {!result && !isAnalysing && (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-400">
              <Sparkles className="h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-600">No prediction yet</p>
              <p className="mt-1 text-xs text-slate-400">
                Upload a cropped image and click &quot;Analyze Word&quot; to test the ResNet-18 classifier.
              </p>
            </div>
          )}

          {isAnalysing && (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-brand-600" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Running ResNet-18 Inference...</p>
              <p className="mt-1 text-xs text-slate-500">
                Applying ImageNet transforms and evaluating softmax output.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4 animate-fade-up">
              {/* Primary Prediction Card */}
              <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50/50 to-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-600" />
                    Top Prediction
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Confidence: <span className="text-brand-700 font-bold">{result.confidence}%</span>
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="text-3xl font-extrabold tracking-tight text-slate-900">
                    {result.predicted_medicine}
                  </h3>
                </div>

                {/* Top-3 Candidates Table */}
                <div className="mt-6 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Top 3 Probability Distribution
                  </p>
                  <div className="space-y-2">
                    {result.top_predictions.map((pred, idx) => (
                      <div key={pred.medicine} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium text-slate-700">
                          <span>
                            {idx + 1}. {pred.medicine}
                          </span>
                          <span className="font-semibold text-slate-900">{pred.confidence}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              idx === 0 ? 'bg-brand-500' : 'bg-slate-300'
                            }`}
                            style={{ width: `${Math.min(pred.confidence, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Safety and Limitation Note from Backend */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-600">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="font-semibold text-slate-800">Backend Prototype Notice:</p>
                    <p className="mt-0.5 text-slate-600">{result.prototype_limitation}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
