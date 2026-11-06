import type { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';
import Logo from '@/components/Logo';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}

export default function AuthLayout({ title, subtitle, footer, children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-brand-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-brand-600/60 blur-3xl" />
        <div className="relative">
          <Logo variant="light" />
        </div>
        <div className="relative max-w-md animate-fade-up">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
            <ShieldCheck className="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 className="mt-8 text-3xl font-bold leading-tight tracking-tight">
            Know what is in your medicine before you take it.
          </h2>
          <p className="mt-4 leading-relaxed text-brand-100">
            SAFE-Rx keeps your prescriptions, safety checks, and savings in one calm, easy-to-read place.
          </p>
        </div>
        <p className="relative text-sm text-brand-200">
          Always confirm medical decisions with a qualified healthcare professional.
        </p>
      </aside>

      <section className="flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md animate-fade-up">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-center text-sm text-slate-600">{footer}</p>
        </div>
      </section>
    </div>
  );
}
