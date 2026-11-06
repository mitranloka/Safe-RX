import { ArrowRight, CircleCheck, FileUp, ScanSearch, PiggyBank, ShieldCheck, Stethoscope, Pill } from 'lucide-react';
import { Link } from '@/lib/router';
import { buttonClasses } from '@/components/ui/Button';
import ConnectionStatus from '@/components/ConnectionStatus';

const steps = [
  {
    icon: FileUp,
    title: 'Upload your prescription',
    description: 'Add a photo or PDF of your prescription. Works with the paper or digital copy you already have.',
  },
  {
    icon: Stethoscope,
    title: 'Verify what we read',
    description: 'Review each extracted medicine side by side with the original and correct anything that looks off.',
  },
  {
    icon: ScanSearch,
    title: 'Check for safety issues',
    description: 'SAFE-Guard flags medicines that share an active ingredient, so you can avoid doubling up by accident.',
  },
  {
    icon: PiggyBank,
    title: 'Save on generics',
    description: 'SAFE-Save compares brand and generic versions of the same medicine so you can spend less without compromise.',
  },
];

const highlights = [
  'Duplicate active ingredient detection',
  'Plain-language safety notes',
  'Generic alternatives with price comparison',
];

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-100/60 blur-3xl" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700 shadow-sm">
              <Pill className="h-3.5 w-3.5" aria-hidden="true" />
              Medication safety, simplified
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              <span className="block">Your Prescription.</span>
              <span className="block text-brand-600">Verified for Safety.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              SAFE-Rx reads your prescription, confirms each medicine with you, and warns you when two
              medicines contain the same active ingredient. It also shows where a generic version could
              save you money.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/signup" className={buttonClasses('primary', 'lg', 'group')}>
                Get Started
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <Link to="/login" className={buttonClasses('secondary', 'lg')}>
                I already have an account
              </Link>
            </div>
            <ul className="mt-8 space-y-2.5">
              {highlights.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                  <CircleCheck className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <ConnectionStatus />
            </div>
          </div>

          <div className="relative animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <img
              src="https://images.pexels.com/photos/8657375/pexels-photo-8657375.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
              alt="A senior woman reviewing a medicine bottle at a pharmacy counter"
              className="aspect-[4/3] w-full rounded-3xl object-cover shadow-2xl shadow-brand-900/10"
            />
            <div className="absolute -bottom-6 left-4 right-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:left-auto sm:right-6 sm:w-80">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">Duplicate ingredient found</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Dolo 650 and Calpol 650 both contain Paracetamol.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">How it works</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Four calm steps from prescription to peace of mind
          </h2>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, description }, index) => (
            <article
              key={title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="text-sm font-bold text-slate-300">0{index + 1}</span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="flex flex-col items-start gap-6 rounded-3xl bg-brand-700 p-8 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Check your prescription in minutes</h2>
            <p className="mt-3 leading-relaxed text-brand-100">
              Create a free account and see what your medicines contain before you take them.
            </p>
          </div>
          <Link to="/signup" className={buttonClasses('secondary', 'lg', 'shrink-0 border-transparent text-brand-800')}>
            Get Started
          </Link>
        </div>
      </section>
    </>
  );
}
