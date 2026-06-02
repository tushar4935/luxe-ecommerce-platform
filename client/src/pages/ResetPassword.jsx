import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthShell from '../components/layout/AuthShell';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { authApi } from '../api/authApi';
import { getErrorMessage } from '../api/axios';
import { resetSchema } from '../utils/validators';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(resetSchema) });

  const onSubmit = async ({ password }) => {
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success('Password reset. Please log in.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <h1 className="mb-1 font-serif text-2xl text-textPrimary">Set a new password</h1>
      <p className="mb-6 text-sm text-textSecondary">Choose a strong password for your account.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="New Password"
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
          Reset Password
        </Button>
      </form>
      <Link to="/login" className="mt-6 inline-block text-sm text-accent hover:underline">
        Back to login
      </Link>
    </AuthShell>
  );
}
