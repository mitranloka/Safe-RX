import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
  tone: 'brand' | 'accent' | 'warning';
}

const toneClasses: Record<StatCardProps['tone'], { iconWrap: string; value: string }> = {
  brand: { iconWrap: 'bg-brand-50 text-brand-700', value: 'text-slate-900' },
  accent: { iconWrap: 'bg-accent-50 text-accent-700', value: 'text-slate-900' },
  warning: { iconWrap: 'bg-amber-50 text-amber-700', value: 'text-amber-800' },
};

export default function StatCard({ label, value, hint, icon: Icon, tone }: StatCardProps) {
  const classes = toneClasses[tone];
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md animate-fade-up">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-600">{label}</p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${classes.iconWrap}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className={`mt-4 text-4xl font-bold tracking-tight ${classes.value}`}>{value}</p>
      <p className="mt-2 text-sm text-slate-500">{hint}</p>
    </div>
  );
}
