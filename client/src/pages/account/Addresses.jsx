import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, MapPin, Pencil, Trash2, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { userApi } from '../../api/userApi';
import { getErrorMessage } from '../../api/axios';
import { addressSchema } from '../../utils/validators';

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(addressSchema) });

  const load = () => {
    setLoading(true);
    userApi
      .getAddresses()
      .then((res) => setAddresses(res.data.addresses || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openNew = () => {
    setEditing(null);
    reset({ label: 'Home', fullName: '', phone: '', street: '', city: '', state: '', country: '', zip: '' });
    setModalOpen(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    Object.entries(a).forEach(([k, v]) => setValue(k, v));
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      if (editing) await userApi.updateAddress(editing._id, values);
      else await userApi.addAddress(values);
      toast.success(editing ? 'Address updated' : 'Address added');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await userApi.deleteAddress(deleteId);
      toast.success('Address removed');
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const makeDefault = async (a) => {
    try {
      await userApi.updateAddress(a._id, { ...a, isDefault: true });
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-serif text-2xl text-textPrimary">Addresses</h2>
        <Button size="sm" onClick={openNew}>
          <Plus size={15} /> Add Address
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-card border border-dashed border-border py-16 text-center">
          <MapPin size={36} className="mx-auto text-textMuted" strokeWidth={1.25} />
          <p className="mt-3 text-textSecondary">No saved addresses yet.</p>
          <Button className="mt-5" size="sm" onClick={openNew}>
            Add your first address
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <div key={a._id} className="relative rounded-card border border-border bg-card p-5">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-semibold text-textPrimary">{a.label || 'Address'}</span>
                {a.isDefault && (
                  <span className="flex items-center gap-1 rounded-sm bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                    <Star size={10} className="fill-accent" /> Default
                  </span>
                )}
              </div>
              <p className="text-sm text-textPrimary">{a.fullName}</p>
              <p className="text-sm text-textSecondary">{a.street}</p>
              <p className="text-sm text-textSecondary">
                {a.city}, {a.state} {a.zip}
              </p>
              <p className="text-sm text-textSecondary">{a.country}</p>
              <p className="mt-1 text-sm text-textSecondary">{a.phone}</p>

              <div className="mt-4 flex items-center gap-3 border-t border-border pt-3">
                {!a.isDefault && (
                  <button onClick={() => makeDefault(a)} className="text-xs text-textSecondary hover:text-accent">
                    Set as default
                  </button>
                )}
                <button onClick={() => openEdit(a)} className="ml-auto text-textSecondary hover:text-accent" aria-label="Edit">
                  <Pencil size={15} />
                </button>
                <button onClick={() => setDeleteId(a._id)} className="text-textSecondary hover:text-error" aria-label="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Address' : 'Add Address'}>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <Input label="Label" placeholder="Home / Work" {...register('label')} />
          <Input label="Full Name" error={errors.fullName?.message} {...register('fullName')} />
          <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
          <Input label="ZIP / Postal Code" error={errors.zip?.message} {...register('zip')} />
          <Input label="Street" error={errors.street?.message} containerClassName="sm:col-span-2" {...register('street')} />
          <Input label="City" error={errors.city?.message} {...register('city')} />
          <Input label="State / Province" {...register('state')} />
          <Input label="Country" error={errors.country?.message} containerClassName="sm:col-span-2" {...register('country')} />
          <div className="sm:col-span-2">
            <Button type="submit" fullWidth loading={saving}>
              {editing ? 'Update Address' : 'Save Address'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={remove}
        title="Delete address?"
        message="This address will be permanently removed."
        confirmLabel="Delete"
      />
    </div>
  );
}
