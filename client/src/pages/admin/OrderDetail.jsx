import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { StatusBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { FullPageSpinner } from '../../components/ui/Spinner';
import { orderApi } from '../../api/orderApi';
import { adminApi } from '../../api/userApi';
import { getErrorMessage } from '../../api/axios';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateTime } from '../../utils/formatDate';

const STATUSES = ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    orderApi
      .byId(id)
      .then((res) => {
        setOrder(res.data.order);
        setStatus(res.data.order.orderStatus);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  if (loading) return <FullPageSpinner />;
  if (!order) return <p className="text-textSecondary">Order not found.</p>;

  const updateStatus = async () => {
    setSaving(true);
    try {
      await adminApi.updateOrderStatus(id, status, note);
      toast.success('Order updated');
      setNote('');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Link to="/admin/orders" className="mb-6 inline-flex items-center gap-2 text-sm text-textSecondary hover:text-accent">
        <ArrowLeft size={15} /> Back to orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-textPrimary">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-textSecondary">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.orderStatus} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Items */}
        <div className="rounded-card border border-border bg-card p-6">
          <h2 className="mb-4 font-serif text-lg text-textPrimary">Items</h2>
          <div className="space-y-4">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-border pb-4 last:border-0">
                <img src={item.image} alt={item.name} className="h-16 w-16 rounded border border-border object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-textPrimary">{item.name}</p>
                  <p className="text-xs text-textSecondary">
                    {item.size && `Size ${item.size} · `}
                    {item.color && `${item.color} · `}Qty {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold text-accent">{formatCurrency(item.subtotal)}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><span className="text-textSecondary">Subtotal</span><span className="text-textPrimary">{formatCurrency(order.itemsTotal)}</span></div>
            {order.couponDiscount > 0 && <div className="flex justify-between"><span className="text-textSecondary">Discount ({order.couponCode})</span><span className="text-accent">- {formatCurrency(order.couponDiscount)}</span></div>}
            <div className="flex justify-between"><span className="text-textSecondary">Shipping</span><span className="text-textPrimary">{order.shippingCost === 0 ? 'Free' : formatCurrency(order.shippingCost)}</span></div>
            <div className="flex justify-between"><span className="text-textSecondary">Tax</span><span className="text-textPrimary">{formatCurrency(order.tax)}</span></div>
            <div className="flex justify-between border-t border-border pt-2 text-base"><span className="font-medium text-textPrimary">Total</span><span className="font-bold text-accent">{formatCurrency(order.totalAmount)}</span></div>
          </div>
        </div>

        {/* Status management + address */}
        <div className="space-y-6">
          <div className="rounded-card border border-border bg-card p-6">
            <h2 className="mb-4 font-serif text-lg text-textPrimary">Update Status</h2>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="input capitalize">
              {STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional)"
              className="input mt-3 text-sm"
            />
            <Button fullWidth className="mt-3" onClick={updateStatus} loading={saving}>
              Save Status
            </Button>
          </div>

          <div className="rounded-card border border-border bg-card p-6 text-sm">
            <h2 className="mb-3 font-serif text-lg text-textPrimary">Customer</h2>
            <p className="text-textPrimary">{order.shippingAddress?.fullName}</p>
            <p className="text-textSecondary">{order.shippingAddress?.street}</p>
            <p className="text-textSecondary">{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip}</p>
            <p className="text-textSecondary">{order.shippingAddress?.country}</p>
            <p className="mt-1 text-textSecondary">{order.shippingAddress?.phone}</p>
            <p className="mt-3 text-xs text-textMuted">
              Payment: <span className="capitalize">{order.paymentMethod}</span> · {order.paymentStatus}
            </p>
          </div>

          <div className="rounded-card border border-border bg-card p-6">
            <h2 className="mb-3 font-serif text-lg text-textPrimary">History</h2>
            <ol className="space-y-3">
              {order.statusHistory?.map((h, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-accent" />
                  <div>
                    <p className="capitalize text-textPrimary">{h.status}</p>
                    {h.note && <p className="text-xs text-textSecondary">{h.note}</p>}
                    <p className="text-xs text-textMuted">{formatDateTime(h.timestamp)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
