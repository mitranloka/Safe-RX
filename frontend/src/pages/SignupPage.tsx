import { useState, type ChangeEvent, type FormEvent } from 'react';
import { UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, Link } from '@/lib/router';
import Button from '@/components/ui/Button';
import TextField from '@/components/ui/TextField';
import AuthLayout from '@/components/auth/AuthLayout';

interface SignupValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const emptyValues: SignupValues = { name: '', email: '', password: '', confirmPassword: '' };

export default function SignupPage() {
  const { navigate } = useRouter();
  const { signUp } = useAuth();
  const [values, setValues] = useState<SignupValues>(emptyValues);
  const [fieldErrors, setFieldErrors] = useState<Partial<SignupValues>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof SignupValues) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = (): Partial<SignupValues> => {
    const errors: Partial<SignupValues> = {};
    if (!values.name.trim()) errors.name = 'Please enter your full name.';
    if (!values.email.includes('@')) errors.email = 'Enter a valid email address.';
    if (values.password.length < 6) errors.password = 'Use at least 6 characters.';
    if (values.confirmPassword !== values.password) errors.confirmPassword = 'Passwords do not match.';
    return errors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      await signUp(values.name, values.email.trim(), values.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create your account. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start verifying your prescriptions in under a minute."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <TextField
          id="signup-name"
          label="Full name"
          autoComplete="name"
          placeholder="Priya Sharma"
          value={values.name}
          onChange={updateField('name')}
          error={fieldErrors.name}
          required
        />
        <TextField
          id="signup-email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={updateField('email')}
          error={fieldErrors.email}
          required
        />
        <TextField
          id="signup-password"
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 6 characters"
          value={values.password}
          onChange={updateField('password')}
          error={fieldErrors.password}
          required
        />
        <TextField
          id="signup-confirm"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          value={values.confirmPassword}
          onChange={updateField('confirmPassword')}
          error={fieldErrors.confirmPassword}
          required
        />

        {formError && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
            {formError}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting} aria-busy={isSubmitting}>
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
}
