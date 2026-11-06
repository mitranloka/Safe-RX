import { ArrowRight, CircleCheck, Pill, ScanSearch, ShieldAlert, Info } from 'lucide-react';
import { usePrescription } from '@/context/PrescriptionContext';
import { useRouter, Link } from '@/lib/router';
import { useAsyncData } from '@/lib/useAsyncData';
import { checkSafeGuard, toSafetyFindings } from '@/services/safeGuardService';
import { buttonClasses } from '@/components/ui/Button';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import SeverityBadge, { severityStyles } from '@/components/ui/SeverityBadge';
import Disclaimer from '@/components/ui/Disclaimer';
import type { Medicine, SafetyFinding, Severity } from '@/types/medication';
import Button from '@/components/ui/Button';

const summaryConfig: { severity: Severity; label: string; icon: typeof ShieldAlert }[] = [
  { severity: 'high', label: 'Duplicate ingredients', icon: ShieldAlert },
  { severity: 'low', label: 'Notes to review', icon: Info },
  { severity: 'safe', label: 'Clear checks', icon: CircleCheck },
];

function strengthFor(brandName: string, medicines: Medicine[]) {
  return medicines.find((medicine) => medicine.brandName === brandName)?.strength;
}

export default function SafeGuardPage() {
  const { navigate } = useRouter();
  const { medicines } = usePrescription();
  const brandNames = medicines.map((medicine) => medicine.brandName);
  const check = useAsyncData(() => checkSafeGuard(brandNames), [brandNames.join('\u0000')]);

  if (medicines.length === 0) {
    return (
      <>
        <PageHeader title="SAFE-Guard" />
        <EmptyState
          icon={ScanSearch}
          title="Nothing to check yet"
          description="Verify your medicines first. SAFE-Guard then compares their active ingredients to catch duplicates."
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

  if (check.isLoading) {
    return (
      <>
        <PageHeader
          title="SAFE-Guard"
          description="Checking verified medicine names against the local prototype salt list."
        />
        <div className="space-y-3" aria-busy="true" aria-label="Checking medicines">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-200/70" />
          ))}
        </div>
      </>
    );
  }

  if (check.error || !check.data) {
    return (
      <>
        <PageHeader title="SAFE-Guard" />
        <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800">
          We could not check these medicines. {check.error ?? 'Please try again.'}
        </p>
      </>
    );
  }

  const findings = toSafetyFindings(check.data);
  const countFor = (severity: Severity) => findings.filter((finding) => finding.severity === severity).length;

  return (
    <>
      <PageHeader
        title="SAFE-Guard"
        description={`Checked ${medicines.length} verified ${
          medicines.length === 1 ? 'medicine' : 'medicines'
        } against the local prototype salt list. Duplicate active salts are highlighted below. This is not medical advice.`}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {summaryConfig.map(({ severity, label, icon: Icon }) => {
          const styles = severityStyles(severity);
          return (
            <div
              key={severity}
              className={`flex items-center gap-4 rounded-2xl border border-slate-200 border-l-4 bg-white p-5 shadow-sm ${styles.accent}`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-2xl font-bold text-slate-900">{countFor(severity)}</p>
                <p className="text-sm text-slate-600">{label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        {findings.map((finding, index) => (
          <FindingCard key={finding.id} finding={finding} medicines={medicines} index={index} />
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <Disclaimer />
        <Link to="/safe-save" className={buttonClasses('secondary', 'lg', 'shrink-0')}>
          See cheaper generic options
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>
    </>
  );
}

interface FindingCardProps {
  finding: SafetyFinding;
  medicines: Medicine[];
  index: number;
}

function FindingCard({ finding, medicines, index }: FindingCardProps) {
  const styles = severityStyles(finding.severity);
  const Icon = finding.severity === 'safe' ? CircleCheck : finding.severity === 'low' ? Info : ShieldAlert;

  return (
    <article
      className={`rounded-2xl border border-slate-200 border-l-4 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md animate-fade-up sm:p-6 ${styles.accent}`}
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-900">{finding.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{finding.description}</p>
          </div>
        </div>
        <SeverityBadge severity={finding.severity} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        {finding.medicines.map((brand) => {
          const strength = strengthFor(brand, medicines);
          return (
            <span
              key={brand}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"
            >
              <Pill className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              {brand}
              {strength && <span className="text-slate-500">· {strength}</span>}
            </span>
          );
        })}
      </div>
    </article>
  );
}
