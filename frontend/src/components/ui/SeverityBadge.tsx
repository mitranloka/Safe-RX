import { CircleCheck, Info, ShieldAlert, TriangleAlert } from 'lucide-react';
import type { Severity } from '@/types/medication';

const severityConfig: Record<
  Severity,
  { label: string; badge: string; accent: string; icon: typeof ShieldAlert }
> = {
  high: {
    label: 'High risk',
    badge: 'bg-rose-100 text-rose-800 ring-rose-200',
    accent: 'border-l-rose-500',
    icon: ShieldAlert,
  },
  moderate: {
    label: 'Moderate',
    badge: 'bg-amber-100 text-amber-900 ring-amber-200',
    accent: 'border-l-amber-500',
    icon: TriangleAlert,
  },
  low: {
    label: 'Low risk',
    badge: 'bg-accent-100 text-accent-800 ring-accent-200',
    accent: 'border-l-accent-500',
    icon: Info,
  },
  safe: {
    label: 'No issue',
    badge: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    accent: 'border-l-emerald-500',
    icon: CircleCheck,
  },
};

export function severityStyles(severity: Severity) {
  return severityConfig[severity];
}

export default function SeverityBadge({ severity }: { severity: Severity }) {
  const { label, badge, icon: Icon } = severityConfig[severity];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${badge}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
