import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { FullPageSpinner } from '../../components/ui/Spinner';
import { productApi, categoryApi } from '../../api/productApi';
import { getErrorMessage } from '../../api/axios';

const blank = {
  name: '',
  brand: '',
  price: '',
  discountPrice: '',
  stock: '',
  category: '',
  shortDescription: '',
  description: '',
  isFeatured: false,
  isActive: true,
};

export default function AddEditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(blank);
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [sizeInput, setSizeInput] = useState('');
  const [colors, setColors] = useState([]);
  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#c9a84c');
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    categoryApi.list().then((res) => setCategories(res.data.categories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    productApi
      .byId(id)
      .then((res) => hydrate(res.data.product))
      .catch((err) => {
        toast.error(getErrorMessage(err));
        navigate('/admin/products');
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const hydrate = (p) => {
    setForm({
      name: p.name || '',
      brand: p.brand || '',
      price: p.price ?? '',
      discountPrice: p.discountPrice ?? '',
      stock: p.stock ?? '',
      category: p.category?._id || p.category || '',
      shortDescription: p.shortDescription || '',
      description: p.description || '',
      isFeatured: p.isFeatured || false,
      isActive: p.isActive ?? true,
    });
    setSizes(p.sizes || []);
    setColors(p.colors || []);
    setExistingImages(p.images || []);
  };

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const onFiles = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 6 - existingImages.length - newFiles.length);
    setNewFiles((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeNewFile = (i) => {
    setNewFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const removeExistingImage = async (imageId) => {
    try {
      await productApi.removeImage(id, imageId);
      setExistingImages((prev) => prev.filter((img) => img._id !== imageId));
      toast.success('Image removed');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const addSize = () => {
    const v = sizeInput.trim().toUpperCase();
    if (v && !sizes.includes(v)) setSizes((s) => [...s, v]);
    setSizeInput('');
  };
  const addColor = () => {
    if (colorName.trim() && !colors.some((c) => c.name === colorName.trim())) {
      setColors((c) => [...c, { name: colorName.trim(), hex: colorHex }]);
      setColorName('');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) {
      toast.error('Name, price and category are required');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('sizes', JSON.stringify(sizes));
      fd.append('colors', JSON.stringify(colors));
      newFiles.forEach((file) => fd.append('images', file));

      if (isEdit) await productApi.update(id, fd);
      else await productApi.create(fd);

      toast.success(isEdit ? 'Product updated' : 'Product created');
      navigate('/admin/products');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <FullPageSpinner />;

  const totalImages = existingImages.length + previews.length;

  return (
    <div>
      <Link to="/admin/products" className="mb-6 inline-flex items-center gap-2 text-sm text-textSecondary hover:text-accent">
        <ArrowLeft size={15} /> Back to products
      </Link>
      <h1 className="mb-6 font-serif text-3xl text-textPrimary">{isEdit ? 'Edit Product' : 'Add Product'}</h1>

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Main fields */}
        <div className="space-y-6">
          <div className="rounded-card border border-border bg-card p-6">
            <h2 className="mb-4 font-serif text-lg text-textPrimary">Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Name" value={form.name} onChange={(e) => set('name', e.target.value)} containerClassName="sm:col-span-2" />
              <Input label="Brand" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-textSecondary">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  className="input"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input label="Price ($)" type="number" value={form.price} onChange={(e) => set('price', e.target.value)} />
              <Input label="Discount Price ($)" type="number" value={form.discountPrice} onChange={(e) => set('discountPrice', e.target.value)} />
              <Input label="Stock" type="number" value={form.stock} onChange={(e) => set('stock', e.target.value)} />
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-textSecondary">Short Description</label>
              <textarea
                value={form.shortDescription}
                onChange={(e) => set('shortDescription', e.target.value)}
                className="input min-h-16 resize-none"
              />
            </div>
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-textSecondary">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                className="input min-h-32 resize-none"
              />
            </div>
          </div>

          {/* Sizes & colors */}
          <div className="rounded-card border border-border bg-card p-6">
            <h2 className="mb-4 font-serif text-lg text-textPrimary">Variants</h2>

            <label className="mb-1.5 block text-sm font-medium text-textSecondary">Sizes</label>
            <div className="flex flex-wrap items-center gap-2">
              {sizes.map((s) => (
                <span key={s} className="flex items-center gap-1 rounded border border-border px-2.5 py-1 text-sm text-textPrimary">
                  {s}
                  <button type="button" onClick={() => setSizes((arr) => arr.filter((x) => x !== s))} className="text-textMuted hover:text-error">
                    <X size={13} />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1">
                <input
                  value={sizeInput}
                  onChange={(e) => setSizeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                  placeholder="Add size"
                  className="w-24 rounded border border-border bg-surface px-2 py-1 text-sm text-textPrimary focus:border-accent focus:outline-none"
                />
                <button type="button" onClick={addSize} className="rounded border border-border p-1.5 text-accent hover:border-accent">
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <label className="mb-1.5 mt-5 block text-sm font-medium text-textSecondary">Colors</label>
            <div className="flex flex-wrap items-center gap-2">
              {colors.map((c) => (
                <span key={c.name} className="flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-sm text-textPrimary">
                  <span className="h-3.5 w-3.5 rounded-full border border-border" style={{ background: c.hex }} />
                  {c.name}
                  <button type="button" onClick={() => setColors((arr) => arr.filter((x) => x.name !== c.name))} className="text-textMuted hover:text-error">
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="h-9 w-12 rounded border border-border bg-surface" />
              <input
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                placeholder="Color name"
                className="w-32 rounded border border-border bg-surface px-2 py-1.5 text-sm text-textPrimary focus:border-accent focus:outline-none"
              />
              <button type="button" onClick={addColor} className="rounded border border-border p-1.5 text-accent hover:border-accent">
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar: images + flags */}
        <div className="space-y-6">
          <div className="rounded-card border border-border bg-card p-6">
            <h2 className="mb-4 font-serif text-lg text-textPrimary">Images ({totalImages}/6)</h2>

            <div className="grid grid-cols-3 gap-3">
              {existingImages.map((img) => (
                <div key={img._id || img.url} className="group relative aspect-square overflow-hidden rounded border border-border">
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                  {isEdit && (
                    <button
                      type="button"
                      onClick={() => removeExistingImage(img._id)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-textPrimary hover:text-error"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))}
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded border border-border">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewFile(i)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-textPrimary hover:text-error"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
              {totalImages < 6 && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed border-border text-textMuted transition-colors hover:border-accent hover:text-accent">
                  <Upload size={20} />
                  <span className="text-[10px]">Upload</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
                </label>
              )}
            </div>
            <p className="mt-3 text-xs text-textMuted">
              {/* Cloudinary optional: in dev without keys, placeholder images are used. */}
              Up to 6 images. PNG/JPG.
            </p>
          </div>

          <div className="rounded-card border border-border bg-card p-6">
            <h2 className="mb-4 font-serif text-lg text-textPrimary">Visibility</h2>
            <label className="flex items-center justify-between py-2 text-sm text-textPrimary">
              Featured
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="h-4 w-4 accent-accent" />
            </label>
            <label className="flex items-center justify-between py-2 text-sm text-textPrimary">
              Active
              <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="h-4 w-4 accent-accent" />
            </label>
          </div>

          <Button type="submit" fullWidth loading={saving}>
            {isEdit ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}
