import { ArrowRight, FilePlus2, TriangleAlert, Pill, ShieldCheck, CalendarDays, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Link } from '@/lib/router';
import { useAsyncData } from '@/lib/useAsyncData';
import { formatDate } from '@/lib/format';
import { dashboardSummary } from '@/data/mockData';
import { getRecentPrescriptions } from '@/services/prescriptionService';
import PageHeader from '@/components/ui/PageHeader';
import { buttonClasses } from '@/components/ui/Button';
import StatCard from '@/components/dashboard/StatCard';
import type { PrescriptionStatus } from '@/types/medication';

const statusStyles: Record<PrescriptionStatus, { label: string; classes: string }> = {
  verified: { label: 'Verified', classes: 'bg-emerald-100 text-emerald-800 ring-emerald-200' },
  'needs-review': { label: 'Needs review', classes: 'bg-amber-100 text-amber-900 ring-amber-200' },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name.split(' ')[0] ?? 'there';
  const prescriptions = useAsyncData(getRecentPrescriptions, []);

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Here is a summary of your medicines and safety checks."
        actions={
          <Link to="/upload" className={buttonClasses('primary', 'md', 'group')}>
            <FilePlus2 className="h-4 w-4" aria-hidden="true" />
            Upload new prescription
          </Link>
        }
      />

      {dashboardSummary.potentialWarnings > 0 && (
        <Link
          to="/safe-guard"
          className="mb-6 flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 transition-colors hover:bg-amber-100/70 animate-fade-up sm:p-5"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <TriangleAlert className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-amber-900">
              {dashboardSummary.potentialWarnings} potential warning needs your attention
            </p>
            <p className="mt-0.5 text-sm text-amber-800">Two medicines in your latest prescription share an ingredient.</p>
          </div>
          <ArrowRight className="hidden h-5 w-5 shrink-0 text-amber-800 sm:block" aria-hidden="true" />
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
        <StatCard
          label="Active Medications"
          value={dashboardSummary.activeMedications}
          hint="Currently on your list"
          icon={Pill}
          tone="brand"
        />
        <StatCard
          label="Safety Checks"
          value={dashboardSummary.safetyChecks}
          hint="Completed this month"
          icon={ShieldCheck}
          tone="accent"
        />
        <StatCard
          label="Potential Warnings"
          value={dashboardSummary.potentialWarnings}
          hint="Awaiting your review"
          icon={TriangleAlert}
          tone="warning"
        />
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent prescriptions</h2>
        </div>

        {prescriptions.isLoading && (
          <div className="space-y-3" aria-busy="true" aria-label="Loading prescriptions">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-200/70" />
            ))}
          </div>
        )}

        {prescriptions.error && (
          <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800">
            We could not load your prescriptions. {prescriptions.error}
          </p>
        )}

        {prescriptions.data && (
          <ul className="space-y-3">
            {prescriptions.data.map((rx) => {
              const status = statusStyles[rx.status];
              return (
                <li
                  key={rx.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-brand-200 hover:shadow-md sm:flex-row sm:items-center sm:gap-5"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <Pill className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{rx.title}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-slate-500">
                        <span>{rx.doctor}</span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                          {formatDate(rx.issuedOn)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <span className="text-sm text-slate-500">
                      {rx.medicineCount} {rx.medicineCount === 1 ? 'medicine' : 'medicines'}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${status.classes}`}
                    >
                      {status.label}
                    </span>
                    <ChevronRight className="hidden h-5 w-5 text-slate-300 lg:block" aria-hidden="true" />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
