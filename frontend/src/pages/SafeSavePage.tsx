import { ArrowRight, BadgePercent, Scale, ScanSearch, Tag } from 'lucide-react';
import { usePrescription } from '@/context/PrescriptionContext';
import { useRouter } from '@/lib/router';
import { useAsyncData } from '@/lib/useAsyncData';
import { formatCurrency } from '@/lib/format';
import { checkSafeSave } from '@/services/safeSaveService';
import type { SafeSaveResult } from '@/services/safeSaveService';
import PageHeader from '@/components/ui/PageHeader';
import Disclaimer from '@/components/ui/Disclaimer';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function savingsPercent(item: SafeSaveResult): number {
  if (!item.brandPrice || item.brandPrice === 0) return 0;
  return item.savingsPercent ?? 0;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function SafeSavePage() {
  const { medicines } = usePrescription();
  const { navigate } = useRouter();

  const brandNames = medicines.map((m) => m.brandName);

  const check = useAsyncData(
    () => checkSafeSave(brandNames),
    // Re-run whenever the medicine list changes.
    [brandNames.join('\0')],
  );

  // ── Empty state ────────────────────────────────────────────────────────
  if (medicines.length === 0) {
    return (
      <>
        <PageHeader title="SAFE-Save" />
        <EmptyState
          icon={ScanSearch}
          title="No verified medicines yet"
          description="Verify your medicines first. SAFE-Save then looks up generic alternatives and shows prototype price comparisons."
          action={
            <Button onClick={() => navigate('/upload')}>
              Upload prescription
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          }
        />
      </>
    );
  }

  // ── Loading state ──────────────────────────────────────────────────────
  if (check.isLoading) {
    return (
      <>
        <PageHeader
          title="SAFE-Save"
          description="Looking up generic alternatives for your verified medicines…"
        />
        <div className="space-y-4" aria-busy="true" aria-label="Loading alternatives">
          <div className="h-32 animate-pulse rounded-3xl bg-slate-200/70" />
          <div className="h-56 animate-pulse rounded-2xl bg-slate-200/70" />
        </div>
      </>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (check.error || !check.data) {
    return (
      <>
        <PageHeader title="SAFE-Save" />
        <p
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800"
        >
          We could not load generic alternatives. {check.error ?? 'Please try again.'}
        </p>
      </>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────
  const { results } = check.data;
  const foundItems = results.filter((r) => r.found);
  const notFoundItems = results.filter((r) => !r.found);

  return (
    <>
      <PageHeader
        title="SAFE-Save"
        description="A generic medicine contains the same active ingredient at the same strength as its brand, often at a lower price. Compare them below."
      />

      {foundItems.length > 0 && <SummaryCards items={foundItems} />}

      {/* Results grid */}
      {foundItems.length > 0 && (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {foundItems.map((item, index) => (
            <AlternativeCard key={item.normalizedName} item={item} index={index} />
          ))}
        </div>
      )}

      {/* Not-found medicines */}
      {notFoundItems.length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">
            Not found in prototype dataset ({notFoundItems.length})
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {notFoundItems.map((item) => (
              <li
                key={item.normalizedName}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600"
              >
                {item.name}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            These medicines are not in the current prototype dataset and could not be compared.
          </p>
        </div>
      )}

      {/* Disclaimers */}
      <div className="mt-10 space-y-3">
        {/* SAFE-Save specific prototype disclaimer */}
        <div
          role="note"
          className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900"
        >
          <span className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true">⚠</span>
          <p>
            <span className="font-semibold">Prototype demonstration only. </span>
            Medicine alternatives and prices must be verified with a qualified healthcare
            professional or an authorized source before making any purchase or medication decision.
          </p>
        </div>

        {/* Existing app-wide disclaimer */}
        <Disclaimer />

        <p className="text-center text-xs text-slate-500">
          Prices are sample estimates for illustration and may differ at your pharmacy.
        </p>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Summary cards (preserves the existing three-card layout)
// ---------------------------------------------------------------------------

function SummaryCards({ items }: { items: SafeSaveResult[] }) {
  const totalSavings = items.reduce((sum, item) => sum + (item.savings ?? 0), 0);
  const bestPercent = Math.max(...items.map(savingsPercent));

  return (
    <div className="grid gap-4 sm:grid-cols-3 animate-fade-up">
      <div className="rounded-3xl bg-brand-700 p-6 text-white shadow-lg sm:col-span-1">
        <BadgePercent className="h-6 w-6 text-brand-200" aria-hidden="true" />
        <p className="mt-4 text-sm font-semibold text-brand-100">Potential savings</p>
        <p className="mt-1 text-3xl font-bold tracking-tight">{formatCurrency(totalSavings)}</p>
        <p className="mt-2 text-sm text-brand-100">per pack across these medicines</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Scale className="h-6 w-6 text-accent-600" aria-hidden="true" />
        <p className="mt-4 text-sm font-semibold text-slate-600">Best saving</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{bestPercent}%</p>
        <p className="mt-2 text-sm text-slate-500">lower than the brand price</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Tag className="h-6 w-6 text-emerald-600" aria-hidden="true" />
        <p className="mt-4 text-sm font-semibold text-slate-600">Comparisons</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{items.length}</p>
        <p className="mt-2 text-sm text-slate-500">brand and generic pairs</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual alternative card (preserves the existing card design)
// ---------------------------------------------------------------------------

function AlternativeCard({ item, index }: { item: SafeSaveResult; index: number }) {
  const percent = savingsPercent(item);
  const genericWidth =
    item.brandPrice && item.genericPrice
      ? Math.round((item.genericPrice / item.brandPrice) * 100)
      : 0;

  return (
    <article
      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg animate-fade-up"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {item.activeSalt}
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">{item.name}</h2>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-inset ring-emerald-200">
          Save {percent}%
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-500">Brand</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{item.name}</p>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {item.brandPrice !== null ? formatCurrency(item.brandPrice) : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
          <p className="text-xs font-semibold text-brand-700">Generic</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{item.genericName}</p>
          <p className="mt-3 text-2xl font-bold text-brand-800">
            {item.genericPrice !== null ? formatCurrency(item.genericPrice) : '—'}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex justify-between text-xs font-medium text-slate-500">
          <span>Price comparison</span>
          <span>{item.packSize}</span>
        </div>
        <div className="mt-2 space-y-2" aria-hidden="true">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-full rounded-full bg-slate-400" />
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-700"
              style={{ width: `${genericWidth}%` }}
            />
          </div>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          You could save{' '}
          {item.savings !== null ? formatCurrency(item.savings) : '—'} per pack
        </p>
      </div>
    </article>
  );
}
