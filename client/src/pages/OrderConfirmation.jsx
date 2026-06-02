import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight } from 'lucide-react';
import { FullPageSpinner } from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { orderApi } from '../api/orderApi';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi
      .byId(id)
      .then((res) => setOrder(res.data.order))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <FullPageSpinner />;
  if (!order)
    return (
      <div className="container-luxe py-20 text-center">
        <p className="text-textSecondary">Order not found.</p>
        <Link to="/shop" className="mt-4 inline-block text-accent hover:underline">
          Back to shop
        </Link>
      </div>
    );

  return (
    <div className="container-luxe py-12">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10 text-success animate-pop">
          <CheckCircle2 size={44} />
        </div>
        <h1 className="mt-6 font-serif text-4xl text-textPrimary">Thank you for your order!</h1>
        <p className="mt-3 text-textSecondary">
          Your order <span className="font-medium text-accent">{order.orderNumber}</span> has been
          placed and a confirmation email is on its way.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-2xl rounded-card border border-border bg-card p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-textSecondary">Order Number</p>
            <p className="font-medium text-textPrimary">{order.orderNumber}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-textSecondary">Date</p>
            <p className="font-medium text-textPrimary">{formatDate(order.createdAt)}</p>
          </div>
          <StatusBadge status={order.orderStatus} />
        </div>

        <div className="space-y-4 py-5">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <img
                src={item.image}
                alt={item.name}
                className="h-16 w-16 rounded border border-border object-cover"
              />
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

        <div className="space-y-2 border-t border-border pt-5 text-sm">
          <div className="flex justify-between">
            <span className="text-textSecondary">Subtotal</span>
            <span className="text-textPrimary">{formatCurrency(order.itemsTotal)}</span>
          </div>
          {order.couponDiscount > 0 && (
            <div className="flex justify-between">
              <span className="text-textSecondary">Discount</span>
              <span className="text-accent">- {formatCurrency(order.couponDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-textSecondary">Shipping</span>
            <span className="text-textPrimary">
              {order.shippingCost === 0 ? 'Free' : formatCurrency(order.shippingCost)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-textSecondary">Tax</span>
            <span className="text-textPrimary">{formatCurrency(order.tax)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-base">
            <span className="font-medium text-textPrimary">Total</span>
            <span className="font-serif text-xl font-bold text-accent">
              {formatCurrency(order.totalAmount)}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row sm:justify-center">
        <Link to={`/account/orders/${order._id}`}>
          <Button variant="ghost" fullWidth>
            <Package size={16} /> Track Order
          </Button>
        </Link>
        <Link to="/shop">
          <Button fullWidth>
            Continue Shopping <ArrowRight size={16} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
