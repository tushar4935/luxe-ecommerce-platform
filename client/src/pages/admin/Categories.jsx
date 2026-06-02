import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { categoryApi } from '../../api/productApi';
import { getErrorMessage } from '../../api/axios';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = () => {
    setLoading(true);
    categoryApi
      .list()
      .then((res) => setCategories(res.data.categories || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', description: '' });
    setFile(null);
    setModalOpen(true);
  };
  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description || '' });
    setFile(null);
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      if (file) fd.append('image', file);
      if (editing) await categoryApi.update(editing._id, fd);
      else await categoryApi.create(fd);
      toast.success(editing ? 'Category updated' : 'Category created');
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
      await categoryApi.remove(deleteId);
      toast.success('Category deleted');
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleteId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-textPrimary">Categories</h1>
          <p className="mt-1 text-sm text-textSecondary">{categories.length} categories</p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus size={15} /> Add Category
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div key={c._id} className="overflow-hidden rounded-card border border-border bg-card">
              <div className="aspect-[16/9] overflow-hidden">
                <img src={c.image?.url || `https://picsum.photos/seed/${c.slug}/400/225`} alt={c.name} className="h-full w-full object-cover" />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-textPrimary">{c.name}</p>
                  <Badge tone="gold">{c.productCount} items</Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-textSecondary">{c.description}</p>
                <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
                  <button onClick={() => openEdit(c)} className="ml-auto text-textSecondary hover:text-accent" aria-label="Edit">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => setDeleteId(c._id)} className="text-textSecondary hover:text-error" aria-label="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'Add Category'} size="sm">
        <form onSubmit={submit} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-textSecondary">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="input min-h-20 resize-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-textSecondary">Image</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm text-textSecondary" />
          </div>
          <Button type="submit" fullWidth loading={saving}>
            {editing ? 'Update' : 'Create'}
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={remove}
        title="Delete category?"
        message="Categories with active products cannot be deleted. This action is permanent."
        confirmLabel="Delete"
      />
    </div>
  );
}
