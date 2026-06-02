import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthShell from '../components/layout/AuthShell';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import SocialAuth from '../components/layout/SocialAuth';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../api/axios';
import { loginSchema } from '../utils/validators';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnUrl = params.get('returnUrl') || '/';
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const user = await login(values);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      navigate(decodeURIComponent(returnUrl), { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      {/* Tabs */}
      <div className="mb-6 flex border-b border-border">
        <span className="relative pb-3 text-sm font-medium text-accent">
          Login
          <span className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" />
        </span>
        <Link to={`/register${returnUrl !== '/' ? `?returnUrl=${returnUrl}` : ''}`} className="ml-6 pb-3 text-sm font-medium text-textSecondary hover:text-textPrimary">
          Register
        </Link>
      </div>

      <h1 className="mb-1 font-serif text-2xl text-textPrimary">Welcome back</h1>
      <p className="mb-6 text-sm text-textSecondary">Sign in to continue to your account.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          icon={Mail}
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-accent hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" fullWidth loading={submitting}>
          Sign In
        </Button>
      </form>

      <SocialAuth />

      <p className="mt-6 text-center text-sm text-textSecondary">
        Don’t have an account?{' '}
        <Link to="/register" className="text-accent hover:underline">
          Create one
        </Link>
      </p>

      <div className="mt-6 rounded border border-border bg-card p-3 text-center text-xs text-textMuted">
        Demo — admin@luxe.com / Admin@123 · customer1@luxe.com / Customer@123
      </div>
    </AuthShell>
  );
}
