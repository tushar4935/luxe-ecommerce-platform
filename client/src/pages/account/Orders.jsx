import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { StatusBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import { orderApi } from '../../api/orderApi';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    orderApi
      .list({ page, limit: 8 })
      .then((res) => {
        setOrders(res.data.orders || []);
        setMeta({ page: res.data.page, pages: res.data.pages });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No orders yet"
        message="When you place an order, it will appear here so you can track its progress."
        ctaLabel="Start Shopping"
        ctaTo="/shop"
      />
    );
  }

  return (
    <div>
      <h2 className="mb-6 font-serif text-2xl text-textPrimary">My Orders</h2>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order._id} className="rounded-card border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                <div>
                  <p className="text-xs uppercase tracking-wider text-textMuted">Order</p>
                  <p className="text-sm font-medium text-textPrimary">{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-textMuted">Date</p>
                  <p className="text-sm text-textSecondary">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-textMuted">Total</p>
                  <p className="text-sm font-semibold text-accent">{formatCurrency(order.totalAmount)}</p>
                </div>
              </div>
              <StatusBadge status={order.orderStatus} />
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="flex -space-x-3">
                {order.items.slice(0, 4).map((item, i) => (
                  <img
                    key={i}
                    src={item.image}
                    alt={item.name}
                    className="h-12 w-12 rounded-full border-2 border-card object-cover"
                  />
                ))}
                {order.items.length > 4 && (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-card bg-surface text-xs text-textSecondary">
                    +{order.items.length - 4}
                  </span>
                )}
              </div>
              <Link to={`/account/orders/${order._id}`}>
                <Button variant="ghost" size="sm">
                  View Details <ChevronRight size={15} />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {meta.pages > 1 && (
        <div className="mt-8">
          <Pagination page={meta.page} pages={meta.pages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
