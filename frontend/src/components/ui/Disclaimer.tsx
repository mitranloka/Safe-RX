import { Info } from 'lucide-react';

export default function Disclaimer({ className = '' }: { className?: string }) {
  return (
    <div
      role="note"
      className={`flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900 ${className}`}
    >
      <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
      <p>
        <span className="font-semibold">Important: </span>
        SAFE-Rx is an information aid, not medical advice. Always consult a qualified healthcare
        professional or pharmacist before starting, stopping, or changing any medicine.
      </p>
    </div>
  );
}
