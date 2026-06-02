import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { userApi } from '../../api/userApi';
import { getErrorMessage } from '../../api/axios';
import { profileSchema } from '../../utils/validators';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(user?.avatar?.url || '');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', phone: user?.phone || '' },
  });

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      let res;
      if (avatarFile) {
        const fd = new FormData();
        fd.append('name', values.name);
        fd.append('phone', values.phone || '');
        fd.append('avatar', avatarFile);
        res = await userApi.updateMe(fd);
      } else {
        res = await userApi.updateMe(values);
      }
      setUser(res.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-card border border-border bg-card p-6 md:p-8">
      <h2 className="mb-6 font-serif text-2xl text-textPrimary">Profile Details</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative">
            {preview ? (
              <img src={preview} alt="avatar" className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/15 text-2xl font-semibold text-accent">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-accent text-background transition-colors hover:bg-accent-light">
              <Camera size={15} />
              <input type="file" accept="image/*" className="hidden" onChange={onFile} />
            </label>
          </div>
          <div>
            <p className="text-sm font-medium text-textPrimary">Profile photo</p>
            <p className="text-xs text-textSecondary">JPG or PNG, up to 5MB</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full Name" error={errors.name?.message} {...register('name')} />
          <Input label="Phone" placeholder="+1 555 0000" error={errors.phone?.message} {...register('phone')} />
          <Input label="Email" value={user?.email} disabled containerClassName="sm:col-span-2" />
        </div>

        <Button type="submit" loading={submitting}>
          Save Changes
        </Button>
      </form>
    </div>
  );
}
