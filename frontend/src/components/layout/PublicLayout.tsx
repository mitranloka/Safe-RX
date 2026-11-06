import type { ReactNode } from 'react';
import { Link } from '@/lib/router';
import Logo from '@/components/Logo';
import { buttonClasses } from '@/components/ui/Button';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              Log in
            </Link>
            <Link to="/signup" className={buttonClasses('primary', 'sm')}>
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo />
          <p className="max-w-md leading-relaxed sm:text-right">
            SAFE-Rx supports patients with prescription information. It does not replace advice from a
            qualified healthcare professional.
          </p>
        </div>
      </footer>
    </div>
  );
}
