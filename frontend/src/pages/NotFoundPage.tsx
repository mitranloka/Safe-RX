import { SearchX } from 'lucide-react';
import { Link } from '@/lib/router';
import { buttonClasses } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center animate-fade-up">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <SearchX className="h-8 w-8" aria-hidden="true" />
      </span>
      <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-brand-600">Error 404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">We could not find that page</h1>
      <p className="mt-3 text-slate-600">The link may be outdated, or the page may have moved.</p>
      <Link to="/" className={buttonClasses('primary', 'md', 'mt-8')}>
        Back to home
      </Link>
    </div>
  );
}
