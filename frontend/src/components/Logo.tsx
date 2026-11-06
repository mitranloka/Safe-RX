import { ShieldCheck } from 'lucide-react';
import { Link } from '@/lib/router';

interface LogoProps {
  variant?: 'light' | 'dark';
  to?: string;
}

export default function Logo({ variant = 'dark', to = '/' }: LogoProps) {
  const textColor = variant === 'light' ? 'text-white' : 'text-slate-900';
  return (
    <Link to={to} className="group inline-flex items-center gap-2.5" aria-label="SAFE-Rx home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
        <ShieldCheck className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className={`text-lg font-bold tracking-tight ${textColor}`}>
        SAFE<span className="text-brand-600">-Rx</span>
      </span>
    </Link>
  );
}
