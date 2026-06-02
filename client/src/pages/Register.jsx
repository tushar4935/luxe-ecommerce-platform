import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthShell from '../components/layout/AuthShell';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import SocialAuth from '../components/layout/SocialAuth';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../api/axios';
import { registerSchema } from '../utils/validators';

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnUrl = params.get('returnUrl') || '/';
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = async ({ name, email, password }) => {
    setSubmitting(true);
    try {
      const user = await registerUser({ name, email, password });
      toast.success(`Welcome to LUXE, ${user.name.split(' ')[0]}`);
      navigate(decodeURIComponent(returnUrl), { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <div className="mb-6 flex border-b border-border">
        <Link to={`/login${returnUrl !== '/' ? `?returnUrl=${returnUrl}` : ''}`} className="pb-3 text-sm font-medium text-textSecondary hover:text-textPrimary">
          Login
        </Link>
        <span className="relative ml-6 pb-3 text-sm font-medium text-accent">
          Register
          <span className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" />
        </span>
      </div>

      <h1 className="mb-1 font-serif text-2xl text-textPrimary">Create your account</h1>
      <p className="mb-6 text-sm text-textSecondary">Join LUXE for a curated shopping experience.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Full Name"
          icon={User}
          placeholder="Jane Doe"
          error={errors.name?.message}
          {...register('name')}
        />
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
          placeholder="At least 6 characters"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm Password"
          type="password"
          icon={Lock}
          placeholder="Re-enter your password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" fullWidth loading={submitting}>
          Create Account
        </Button>
      </form>

      <SocialAuth />

      <p className="mt-6 text-center text-sm text-textSecondary">
        Already have an account?{' '}
        <Link to="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
