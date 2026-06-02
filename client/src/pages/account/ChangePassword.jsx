import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { userApi } from '../../api/userApi';
import { getErrorMessage } from '../../api/axios';
import { passwordSchema } from '../../utils/validators';

export default function ChangePassword() {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(passwordSchema) });

  const onSubmit = async ({ currentPassword, newPassword }) => {
    setSubmitting(true);
    try {
      await userApi.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      reset();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-card border border-border bg-card p-6 md:p-8">
      <h2 className="mb-6 font-serif text-2xl text-textPrimary">Change Password</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
        <Input
          label="Current Password"
          type="password"
          icon={Lock}
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <Input
          label="New Password"
          type="password"
          icon={Lock}
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <Input
          label="Confirm New Password"
          type="password"
          icon={Lock}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" loading={submitting}>
          Update Password
        </Button>
      </form>
    </div>
  );
}
