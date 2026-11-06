import { useState, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import { useRouter } from '@/lib/router';
import { useAuth } from '@/context/AuthContext';
import { usePrescription } from '@/context/PrescriptionContext';
import Logo from '@/components/Logo';
import Button from '@/components/ui/Button';
import NavLinks from '@/components/layout/NavLinks';
import UserMenu from '@/components/layout/UserMenu';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { path, navigate } = useRouter();
  const { user, signOut } = useAuth();
  const { reset } = usePrescription();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = () => {
    signOut();
    reset();
    setMenuOpen(false);
    navigate('/', { replace: true });
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-20 items-center px-6">
          <Logo to="/dashboard" />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <NavLinks currentPath={path} />
        </div>
        <div className="border-t border-slate-200 p-4">
          <UserMenu name={user?.name ?? 'Patient'} email={user?.email ?? ''} onSignOut={handleSignOut} />
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden">
        <Logo to="/dashboard" />
        <Button
          variant="ghost"
          size="sm"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="px-2"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 top-16 z-20 animate-fade-up bg-white lg:hidden" style={{ animationDuration: '0.2s' }}>
          <div className="flex h-full flex-col p-4">
            <NavLinks currentPath={path} onNavigate={closeMenu} />
            <div className="mt-auto border-t border-slate-200 pt-4">
              <UserMenu name={user?.name ?? 'Patient'} email={user?.email ?? ''} onSignOut={handleSignOut} />
            </div>
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
