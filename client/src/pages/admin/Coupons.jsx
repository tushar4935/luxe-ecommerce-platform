import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../../components/admin/DataTable';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { couponApi } from '../../api/cartApi';
import { getErrorMessage } from '../../api/axios';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

const blank = {
  code: '',
  type: 'percentage',
  value: '',
  minOrderAmount: '',
  maxDiscount: '',
  usageLimit: '',
  expiresAt: '',
  isActive: true,
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = () => {
    setLoading(true);
    couponApi
      .list()
      .then((res) => setCoupons(res.data.coupons || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openNew = () => {
    setEditing(null);
    setForm(blank);
    setModalOpen(true);
  };
  const openEdit = (c) => {
    setEditing(c);
    setForm({
      code: c.code,
      type: c.type,
      value: c.value,
      minOrderAmount: c.minOrderAmount || '',
      maxDiscount: c.maxDiscount || '',
      usageLimit: c.usageLimit || '',
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
      isActive: c.isActive,
    });
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.value) return toast.error('Code and value are required');
    setSaving(true);
    try {
      const payload = {
        ...form,
        code: form.code.toUpperCase(),
        value: Number(form.value),
        minOrderAmount: Number(form.minOrderAmount) || 0,
        maxDiscount: Number(form.maxDiscount) || 0,
        usageLimit: Number(form.usageLimit) || 0,
        expiresAt: form.expiresAt || undefined,
      };
      if (editing) await couponApi.update(editing._id, payload);
      else await couponApi.create(payload);
      toast.success(editing ? 'Coupon updated' : 'Coupon created');
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
      await couponApi.remove(deleteId);
      toast.success('Coupon deleted');
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const columns = [
    { key: 'code', header: 'Code', render: (c) => <span className="font-mono text-sm font-semibold text-accent">{c.code}</span> },
    {
      key: 'value',
      header: 'Discount',
      render: (c) => <span className="text-sm text-textPrimary">{c.type === 'percentage' ? `${c.value}%` : formatCurrency(c.value)}</span>,
    },
    { key: 'min', header: 'Min Order', render: (c) => <span className="text-sm text-textSecondary">{formatCurrency(c.minOrderAmount)}</span> },
    { key: 'used', header: 'Used', render: (c) => <span className="text-sm text-textSecondary">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</span> },
    { key: 'expires', header: 'Expires', render: (c) => <span className="text-sm text-textSecondary">{c.expiresAt ? formatDate(c.expiresAt) : 'Never'}</span> },
    { key: 'status', header: 'Status', render: (c) => (c.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="gray">Inactive</Badge>) },
    {
      key: 'actions',
      header: '',
      render: (c) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEdit(c)} className="text-textSecondary hover:text-accent" aria-label="Edit">
            <Pencil size={16} />
          </button>
          <button onClick={() => setDeleteId(c._id)} className="text-textSecondary hover:text-error" aria-label="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-textPrimary">Coupons</h1>
          <p className="mt-1 text-sm text-textSecondary">{coupons.length} coupons</p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus size={15} /> Add Coupon
        </Button>
      </div>

      <DataTable columns={columns} data={coupons} loading={loading} emptyMessage="No coupons yet" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Coupon' : 'Add Coupon'} size="sm">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Input label="Code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} containerClassName="sm:col-span-2" />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-textSecondary">Type</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="input">
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </div>
          <Input label={form.type === 'percentage' ? 'Value (%)' : 'Value ($)'} type="number" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} />
          <Input label="Min Order ($)" type="number" value={form.minOrderAmount} onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))} />
          <Input label="Max Discount ($)" type="number" value={form.maxDiscount} onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))} />
          <Input label="Usage Limit (0 = ∞)" type="number" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} />
          <Input label="Expires At" type="date" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm text-textPrimary sm:col-span-2">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 accent-accent" />
            Active
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" fullWidth loading={saving}>
              {editing ? 'Update Coupon' : 'Create Coupon'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={remove}
        title="Delete coupon?"
        message="This coupon will be permanently removed."
        confirmLabel="Delete"
      />
    </div>
  );
}
