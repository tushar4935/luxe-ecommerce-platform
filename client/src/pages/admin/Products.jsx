import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../../components/admin/DataTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { productApi, categoryApi } from '../../api/productApi';
import { getErrorMessage } from '../../api/axios';
import { useDebounce } from '../../hooks/useDebounce';
import { formatCurrency } from '../../utils/formatCurrency';
import { effectivePrice } from '../../utils/calculateDiscount';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    categoryApi.list().then((res) => setCategories(res.data.categories || [])).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    productApi
      .list({ search: debouncedSearch || undefined, category: category || undefined, sort, page, limit: 10 })
      .then((res) => {
        setProducts(res.data.products || []);
        setMeta({ page: res.data.page, pages: res.data.pages, total: res.data.total });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedSearch, category, sort, page]);

  useEffect(load, [load]);
  useEffect(() => setPage(1), [debouncedSearch, category, sort]);

  const remove = async () => {
    try {
      await productApi.remove(deleteId);
      toast.success('Product deactivated');
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const columns = [
    {
      key: 'product',
      header: 'Product',
      render: (p) => (
        <div className="flex items-center gap-3">
          <img src={p.images?.[0]?.url} alt={p.name} className="h-10 w-10 rounded border border-border object-cover" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-textPrimary">{p.name}</p>
            <p className="text-xs text-textSecondary">{p.brand}</p>
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (p) => <span className="text-sm text-textSecondary">{p.category?.name || '—'}</span> },
    { key: 'price', header: 'Price', render: (p) => <span className="font-medium text-accent">{formatCurrency(effectivePrice(p))}</span> },
    {
      key: 'stock',
      header: 'Stock',
      render: (p) => (
        <span className={p.stock > 0 ? 'text-textPrimary' : 'text-error'}>{p.stock}</span>
      ),
    },
    { key: 'sold', header: 'Sold', render: (p) => <span className="text-textSecondary">{p.sold}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (p) =>
        p.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="gray">Inactive</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <div className="flex items-center gap-2">
          <Link to={`/admin/products/${p._id}/edit`} className="text-textSecondary hover:text-accent" aria-label="Edit">
            <Pencil size={16} />
          </Link>
          <button onClick={() => setDeleteId(p._id)} className="text-textSecondary hover:text-error" aria-label="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-textPrimary">Products</h1>
          <p className="mt-1 text-sm text-textSecondary">{meta.total} products</p>
        </div>
        <Link to="/admin/products/new">
          <Button size="sm">
            <Plus size={15} /> Add Product
          </Button>
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="input py-2.5 pl-9 text-sm"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded border border-border bg-card px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded border border-border bg-card px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none">
          <option value="newest">Newest</option>
          <option value="price-asc">Price ↑</option>
          <option value="price-desc">Price ↓</option>
          <option value="popular">Most sold</option>
        </select>
      </div>

      <DataTable columns={columns} data={products} loading={loading} emptyMessage="No products found" />

      {meta.pages > 1 && (
        <div className="mt-6">
          <Pagination page={meta.page} pages={meta.pages} onChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={remove}
        title="Deactivate product?"
        message="This soft-deletes the product (sets it inactive). It can be re-activated later by editing."
        confirmLabel="Deactivate"
      />
    </div>
  );
}
