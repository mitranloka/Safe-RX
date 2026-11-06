import { useState, type FormEvent } from 'react';
import { Lock, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, Link } from '@/lib/router';
import Button from '@/components/ui/Button';
import TextField from '@/components/ui/TextField';
import AuthLayout from '@/components/auth/AuthLayout';

export default function LoginPage() {
  const { navigate } = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn(email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to log in. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to review your medicines and safety checks."
      footer={
        <>
          New to SAFE-Rx?{' '}
          <Link to="/signup" className="font-semibold text-brand-700 hover:text-brand-800 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <TextField
          id="login-email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <TextField
          id="login-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {error && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting} aria-busy={isSubmitting}>
          <Lock className="h-4 w-4" aria-hidden="true" />
          {isSubmitting ? 'Logging in...' : 'Log in'}
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <Mail className="h-3.5 w-3.5" aria-hidden="true" />
          Demo sign-in: any valid email with a 6+ character password.
        </p>
      </form>
    </AuthLayout>
  );
}
