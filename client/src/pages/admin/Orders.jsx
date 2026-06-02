import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../../components/admin/DataTable';
import Pagination from '../../components/ui/Pagination';
import { adminApi } from '../../api/userApi';
import { getErrorMessage } from '../../api/axios';
import { useDebounce } from '../../hooks/useDebounce';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

const STATUSES = ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .orders({ search: debouncedSearch || undefined, status: status || undefined, page, limit: 10 })
      .then((res) => {
        setOrders(res.data.orders || []);
        setMeta({ page: res.data.page, pages: res.data.pages, total: res.data.total });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedSearch, status, page]);

  useEffect(load, [load]);
  useEffect(() => setPage(1), [debouncedSearch, status]);

  const changeStatus = async (orderId, newStatus) => {
    try {
      await adminApi.updateOrderStatus(orderId, newStatus);
      toast.success('Status updated');
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, orderStatus: newStatus } : o)));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const columns = [
    { key: 'orderNumber', header: 'Order', render: (o) => <span className="text-sm font-medium text-textPrimary">{o.orderNumber}</span> },
    { key: 'customer', header: 'Customer', render: (o) => <span className="text-sm text-textSecondary">{o.user?.name || 'Guest'}</span> },
    { key: 'date', header: 'Date', render: (o) => <span className="text-sm text-textSecondary">{formatDate(o.createdAt)}</span> },
    { key: 'total', header: 'Total', render: (o) => <span className="font-medium text-accent">{formatCurrency(o.totalAmount)}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (o) => (
        <select
          value={o.orderStatus}
          onChange={(e) => changeStatus(o._id, e.target.value)}
          className="rounded border border-border bg-surface px-2 py-1 text-xs capitalize text-textPrimary focus:border-accent focus:outline-none"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (o) => (
        <Link to={`/admin/orders/${o._id}`} className="text-textSecondary hover:text-accent" aria-label="View">
          <Eye size={16} />
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-textPrimary">Orders</h1>
        <p className="mt-1 text-sm text-textSecondary">{meta.total} orders</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order number…"
            className="input py-2.5 pl-9 text-sm"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border border-border bg-card px-3 py-2 text-sm capitalize text-textPrimary focus:border-accent focus:outline-none">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
      </div>

      <DataTable columns={columns} data={orders} loading={loading} emptyMessage="No orders found" />

      {meta.pages > 1 && (
        <div className="mt-6">
          <Pagination page={meta.page} pages={meta.pages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
