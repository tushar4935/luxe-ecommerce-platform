import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Calendar } from 'lucide-react';
import Badge, { StatusBadge } from '../../components/ui/Badge';
import { FullPageSpinner } from '../../components/ui/Spinner';
import { adminApi } from '../../api/userApi';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

export default function AdminUserDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .userById(id)
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <FullPageSpinner />;
  if (!data?.user) return <p className="text-textSecondary">User not found.</p>;

  const { user, orders, totalSpent } = data;

  return (
    <div>
      <Link to="/admin/users" className="mb-6 inline-flex items-center gap-2 text-sm text-textSecondary hover:text-accent">
        <ArrowLeft size={15} /> Back to users
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        {/* Profile card */}
        <div className="rounded-card border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            {user.avatar?.url ? (
              <img src={user.avatar.url} alt={user.name} className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-2xl font-semibold text-accent">
                {user.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-serif text-xl text-textPrimary">{user.name}</p>
              <Badge tone={user.role === 'admin' ? 'gold' : 'gray'}>{user.role}</Badge>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm">
            <p className="flex items-center gap-2 text-textSecondary"><Mail size={15} /> {user.email}</p>
            <p className="flex items-center gap-2 text-textSecondary"><Phone size={15} /> {user.phone || '—'}</p>
            <p className="flex items-center gap-2 text-textSecondary"><Calendar size={15} /> Joined {formatDate(user.createdAt)}</p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-textMuted">Total Spent</p>
              <p className="mt-1 font-serif text-2xl font-bold text-accent">{formatCurrency(totalSpent)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-textMuted">Orders</p>
              <p className="mt-1 font-serif text-2xl font-bold text-textPrimary">{orders.length}</p>
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-1 text-xs uppercase tracking-wider text-textMuted">Status</p>
            {user.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="red">Inactive</Badge>}
          </div>
        </div>

        {/* Order history */}
        <div className="rounded-card border border-border bg-card p-6">
          <h2 className="mb-4 font-serif text-lg text-textPrimary">Order History</h2>
          {orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-textSecondary">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Link
                  key={order._id}
                  to={`/admin/orders/${order._id}`}
                  className="flex items-center justify-between rounded border border-border px-4 py-3 transition-colors hover:border-accent/40"
                >
                  <div>
                    <p className="text-sm font-medium text-textPrimary">{order.orderNumber}</p>
                    <p className="text-xs text-textSecondary">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-accent">{formatCurrency(order.totalAmount)}</span>
                    <StatusBadge status={order.orderStatus} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
