import {
  FlaskConical,
  LayoutDashboard,
  PiggyBank,
  ScanSearch,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import { Link } from '@/lib/router';

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Upload Prescription', to: '/upload', icon: Upload },
  { label: 'SAFE-Guard', to: '/safe-guard', icon: ScanSearch },
  { label: 'SAFE-Save', to: '/safe-save', icon: PiggyBank },
  { label: 'ML Prototype Demo', to: '/ml-demo', icon: FlaskConical },
];

interface NavLinksProps {
  currentPath: string;
  onNavigate?: () => void;
}

export default function NavLinks({ currentPath, onNavigate }: NavLinksProps) {
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1">
      {navItems.map(({ label, to, icon: Icon }) => {
        const isActive = currentPath === to || currentPath.startsWith(`${to}/`);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
              isActive
                ? 'bg-brand-50 text-brand-800'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Icon
              className={`h-5 w-5 transition-colors ${isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'}`}
              aria-hidden="true"
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
