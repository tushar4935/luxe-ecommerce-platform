import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check, Repeat, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { StatusBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { FullPageSpinner } from '../../components/ui/Spinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { orderApi } from '../../api/orderApi';
import { getErrorMessage } from '../../api/axios';
import { useCart } from '../../hooks/useCart';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateTime } from '../../utils/formatDate';

const TIMELINE = ['processing', 'confirmed', 'shipped', 'delivered'];

export default function OrderDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = () => {
    setLoading(true);
    orderApi
      .byId(id)
      .then((res) => setOrder(res.data.order))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  if (loading) return <FullPageSpinner />;
  if (!order) return <p className="text-textSecondary">Order not found.</p>;

  const cancellable = ['processing', 'confirmed'].includes(order.orderStatus);
  const isCancelled = ['cancelled', 'returned'].includes(order.orderStatus);
  const activeStep = TIMELINE.indexOf(order.orderStatus);

  const cancelOrder = async () => {
    setCancelling(true);
    try {
      await orderApi.cancel(id);
      toast.success('Order cancelled');
      setConfirmCancel(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const reorder = async () => {
    for (const item of order.items) {
      if (item.product?._id) {
        // eslint-disable-next-line no-await-in-loop
        await addItem(
          { _id: item.product._id, name: item.name, slug: item.product.slug, price: item.price, discountPrice: item.discountPrice, images: item.product.images || [{ url: item.image }], stock: 99 },
          { quantity: item.quantity, size: item.size, color: item.color }
        );
      }
    }
    toast.success('Items added to cart');
  };

  return (
    <div>
      <Link to="/account/orders" className="mb-6 inline-flex items-center gap-2 text-sm text-textSecondary hover:text-accent">
        <ArrowLeft size={15} /> Back to orders
      </Link>

      <div className="rounded-card border border-border bg-card p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h2 className="font-serif text-2xl text-textPrimary">{order.orderNumber}</h2>
            <p className="mt-1 text-sm text-textSecondary">Placed on {formatDateTime(order.createdAt)}</p>
          </div>
          <StatusBadge status={order.orderStatus} />
        </div>

        {/* Timeline */}
        {!isCancelled ? (
          <div className="py-8">
            <div className="flex items-center justify-between">
              {TIMELINE.map((stage, i) => (
                <div key={stage} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                        i <= activeStep
                          ? 'border-accent bg-accent text-background'
                          : 'border-border text-textMuted'
                      }`}
                    >
                      {i <= activeStep ? <Check size={16} /> : i + 1}
                    </div>
                    <span className={`mt-2 text-xs capitalize ${i <= activeStep ? 'text-textPrimary' : 'text-textMuted'}`}>
                      {stage}
                    </span>
                  </div>
                  {i < TIMELINE.length - 1 && (
                    <div className={`mx-1 h-0.5 flex-1 ${i < activeStep ? 'bg-accent' : 'bg-border'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-card border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
            <Ban size={18} /> This order was {order.orderStatus}.
          </div>
        )}

        <div className="grid gap-8 pt-6 lg:grid-cols-[1.6fr_1fr]">
          {/* Items */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-textSecondary">Items</h3>
            <div className="space-y-4">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-4 border-b border-border pb-4 last:border-0">
                  <img src={item.image} alt={item.name} className="h-16 w-16 rounded border border-border object-cover" />
                  <div className="flex-1">
                    {item.product?.slug ? (
                      <Link to={`/product/${item.product.slug}`} className="text-sm font-medium text-textPrimary hover:text-accent">
                        {item.name}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium text-textPrimary">{item.name}</p>
                    )}
                    <p className="text-xs text-textSecondary">
                      {item.size && `Size ${item.size} · `}
                      {item.color && `${item.color} · `}Qty {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-accent">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="ghost" size="sm" onClick={reorder}>
                <Repeat size={15} /> Reorder
              </Button>
              {cancellable && (
                <Button variant="danger" size="sm" onClick={() => setConfirmCancel(true)}>
                  Cancel Order
                </Button>
              )}
            </div>
          </div>

          {/* Summary + address */}
          <div className="space-y-6">
            <div className="rounded-card border border-border p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-textSecondary">Summary</h3>
              <div className="space-y-2 text-sm">
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
                <div className="flex justify-between border-t border-border pt-2 text-base">
                  <span className="font-medium text-textPrimary">Total</span>
                  <span className="font-bold text-accent">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-card border border-border p-5 text-sm">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-textSecondary">
                Shipping Address
              </h3>
              <p className="text-textPrimary">{order.shippingAddress?.fullName}</p>
              <p className="text-textSecondary">{order.shippingAddress?.street}</p>
              <p className="text-textSecondary">
                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip}
              </p>
              <p className="text-textSecondary">{order.shippingAddress?.country}</p>
              <p className="mt-1 text-textSecondary">{order.shippingAddress?.phone}</p>
              <p className="mt-3 text-xs text-textMuted">
                Payment: <span className="capitalize">{order.paymentMethod}</span> · {order.paymentStatus}
              </p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={cancelOrder}
        loading={cancelling}
        title="Cancel this order?"
        message="This will cancel your order and restock the items. This cannot be undone."
        confirmLabel="Yes, cancel"
      />
    </div>
  );
}
