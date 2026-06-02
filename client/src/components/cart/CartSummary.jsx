import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tag, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import { couponApi } from '../../api/cartApi';
import { getErrorMessage } from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatCurrency';

const FREE_SHIPPING_THRESHOLD = 100;
const SHIPPING_COST = 9.99;
const TAX_RATE = 0.1;
const COUPON_KEY = 'luxe_coupon';

export const readSavedCoupon = () => {
  try {
    return JSON.parse(localStorage.getItem(COUPON_KEY));
  } catch {
    return null;
  }
};
export const clearSavedCoupon = () => localStorage.removeItem(COUPON_KEY);

/**
 * Computes the order totals from a subtotal + optional coupon discount.
 */
export const computeTotals = (subtotal, discount = 0) => {
  const discounted = Math.max(0, subtotal - discount);
  const shipping = discounted >= FREE_SHIPPING_THRESHOLD || discounted === 0 ? 0 : SHIPPING_COST;
  const tax = Math.round(discounted * TAX_RATE * 100) / 100;
  const total = Math.round((discounted + shipping + tax) * 100) / 100;
  return { discounted, shipping, tax, total };
};

export default function CartSummary({ subtotal, showCheckout = true, checkoutLabel = 'Proceed to Checkout' }) {
  const { isAuthenticated } = useAuth();
  const [code, setCode] = useState('');
  const [coupon, setCoupon] = useState(() => readSavedCoupon());
  const [applying, setApplying] = useState(false);

  // Re-validate / clear the saved coupon if subtotal drops below its minimum.
  useEffect(() => {
    if (coupon) localStorage.setItem(COUPON_KEY, JSON.stringify(coupon));
  }, [coupon]);

  const discount = coupon?.discount || 0;
  const { shipping, tax, total } = computeTotals(subtotal, discount);

  const apply = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    if (!isAuthenticated) {
      toast.error('Please log in to apply a coupon');
      return;
    }
    setApplying(true);
    try {
      const { data } = await couponApi.validate(code.trim().toUpperCase(), subtotal);
      const applied = { code: data.code, discount: data.discount };
      setCoupon(applied);
      setCode('');
      toast.success(`Coupon ${data.code} applied`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setApplying(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    clearSavedCoupon();
  };

  const line = (label, value, opts = {}) => (
    <div className="flex items-center justify-between text-sm">
      <span className="text-textSecondary">{label}</span>
      <span className={opts.accent ? 'text-accent' : 'text-textPrimary'}>{value}</span>
    </div>
  );

  return (
    <div className="rounded-card border border-border bg-card p-6">
      <h2 className="mb-5 font-serif text-xl text-textPrimary">Order Summary</h2>

      {/* Promo code */}
      <form onSubmit={apply} className="mb-5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Promo code"
              className="input py-2.5 pl-9 text-sm uppercase"
            />
          </div>
          <Button type="submit" variant="ghost" size="sm" loading={applying}>
            Apply
          </Button>
        </div>
        {coupon && (
          <div className="mt-2 flex items-center justify-between rounded bg-success/10 px-3 py-2 text-xs text-success">
            <span>
              {coupon.code} — {formatCurrency(coupon.discount)} off
            </span>
            <button onClick={removeCoupon} aria-label="Remove coupon" className="hover:text-error">
              <X size={14} />
            </button>
          </div>
        )}
      </form>

      <div className="space-y-3 border-t border-border pt-5">
        {line('Subtotal', formatCurrency(subtotal))}
        {discount > 0 && line('Discount', `- ${formatCurrency(discount)}`, { accent: true })}
        {line('Shipping', shipping === 0 ? 'Free' : formatCurrency(shipping))}
        {line('Tax (10%)', formatCurrency(tax))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
        <span className="text-sm font-medium text-textPrimary">Total</span>
        <span className="font-serif text-2xl font-bold text-accent">{formatCurrency(total)}</span>
      </div>

      {subtotal < FREE_SHIPPING_THRESHOLD && subtotal > 0 && (
        <p className="mt-3 text-xs text-textMuted">
          Add {formatCurrency(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping.
        </p>
      )}

      {showCheckout && (
        <>
          <Link to="/checkout" className="mt-6 block">
            <Button fullWidth disabled={subtotal <= 0}>
              {checkoutLabel}
            </Button>
          </Link>
          <Link
            to="/shop"
            className="mt-3 block text-center text-sm text-textSecondary transition-colors hover:text-accent"
          >
            Continue shopping
          </Link>
        </>
      )}
    </div>
  );
}
