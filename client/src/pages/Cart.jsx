import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import EmptyState from '../components/ui/EmptyState';
import { useCart } from '../hooks/useCart';

export default function Cart() {
  const { items, subtotal, count } = useCart();

  if (count === 0) {
    return (
      <div className="container-luxe py-10">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          message="Looks like you haven't added anything yet. Explore the collection and find something you love."
          ctaLabel="Start Shopping"
          ctaTo="/shop"
        />
      </div>
    );
  }

  return (
    <div className="container-luxe py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-4xl text-textPrimary">Shopping Cart</h1>
        <Link
          to="/shop"
          className="hidden items-center gap-2 text-sm text-textSecondary hover:text-accent sm:flex"
        >
          <ArrowLeft size={16} /> Continue shopping
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.8fr_1fr]">
        <div className="rounded-card border border-border bg-card p-6">
          {/* Table header (desktop) */}
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 border-b border-border pb-3 text-xs font-semibold uppercase tracking-wider text-textSecondary sm:grid">
            <span>Product</span>
            <span>Price</span>
            <span>Quantity</span>
            <span>Total</span>
            <span />
          </div>

          {items.map((item) => (
            <CartItem key={item._id} item={item} />
          ))}

          <p className="mt-4 text-sm text-textSecondary">
            {count} item{count !== 1 ? 's' : ''} in your cart
          </p>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <CartSummary subtotal={subtotal} />
        </div>
      </div>
    </div>
  );
}
