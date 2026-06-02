import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthShell from '../components/layout/AuthShell';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { authApi } from '../api/authApi';
import { getErrorMessage } from '../api/axios';
import { forgotSchema } from '../utils/validators';

export default function ForgotPassword() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(forgotSchema) });

  const onSubmit = async ({ email }) => {
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      {sent ? (
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="mt-5 font-serif text-2xl text-textPrimary">Check your email</h1>
          <p className="mt-3 text-sm text-textSecondary">
            If an account exists for that email, we’ve sent a link to reset your password.
          </p>
          <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm text-accent hover:underline">
            <ArrowLeft size={14} /> Back to login
          </Link>
        </div>
      ) : (
        <>
          <h1 className="mb-1 font-serif text-2xl text-textPrimary">Forgot password?</h1>
          <p className="mb-6 text-sm text-textSecondary">
            Enter your email and we’ll send you a reset link.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Email"
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Button type="submit" fullWidth loading={submitting}>
              Send Reset Link
            </Button>
          </form>
          <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm text-accent hover:underline">
            <ArrowLeft size={14} /> Back to login
          </Link>
        </>
      )}
    </AuthShell>
  );
}
