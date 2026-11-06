import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/lib/router';
import AppLayout from '@/components/layout/AppLayout';
import PublicLayout from '@/components/layout/PublicLayout';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import DashboardPage from '@/pages/DashboardPage';
import UploadPrescriptionPage from '@/pages/UploadPrescriptionPage';
import VerificationPage from '@/pages/VerificationPage';
import SafeGuardPage from '@/pages/SafeGuardPage';
import SafeSavePage from '@/pages/SafeSavePage';
import MLDemoPage from '@/pages/MLDemoPage';
import NotFoundPage from '@/pages/NotFoundPage';

const publicRoutes: Record<string, ReactNode> = {
  '/': <PublicLayout><LandingPage /></PublicLayout>,
  '/login': <PublicLayout><LoginPage /></PublicLayout>,
  '/signup': <PublicLayout><SignupPage /></PublicLayout>,
};

const protectedRoutes: Record<string, ReactNode> = {
  '/dashboard': <DashboardPage />,
  '/upload': <UploadPrescriptionPage />,
  '/verify': <VerificationPage />,
  '/safe-guard': <SafeGuardPage />,
  '/safe-save': <SafeSavePage />,
  '/ml-demo': <MLDemoPage />,
};

function Redirect({ to }: { to: string }) {
  const { navigate } = useRouter();
  useEffect(() => {
    navigate(to, { replace: true });
  }, [navigate, to]);
  return null;
}

export default function AppRoutes() {
  const { path } = useRouter();
  const { user } = useAuth();

  const publicPage = publicRoutes[path];
  if (publicPage) return publicPage;

  const protectedPage = protectedRoutes[path];
  if (protectedPage) {
    if (!user) return <Redirect to="/login" />;
    return <AppLayout>{protectedPage}</AppLayout>;
  }

  return (
    <PublicLayout>
      <NotFoundPage />
    </PublicLayout>
  );
}
