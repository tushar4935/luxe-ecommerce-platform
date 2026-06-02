import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { formatCurrency } from '../../utils/formatCurrency';
import { effectivePrice } from '../../utils/calculateDiscount';
import Button from '../ui/Button';

/**
 * Slide-in mini-cart from the right. Opens automatically when an item is
 * added to the cart (CartContext sets drawerOpen).
 */
export default function CartDrawer() {
  const { items, subtotal, count, drawerOpen, setDrawerOpen, removeItem } = useCart();

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  if (!drawerOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-label="Shopping cart"
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-modal animate-slide-in-right"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="flex items-center gap-2 font-serif text-xl text-textPrimary">
            <ShoppingBag size={20} className="text-accent" /> Your Cart ({count})
          </h2>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Close cart"
            className="text-textSecondary hover:text-accent"
          >
            <X size={22} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <ShoppingBag size={48} strokeWidth={1} className="text-textMuted" />
            <p className="text-textSecondary">Your cart is empty</p>
            <Link to="/shop" onClick={() => setDrawerOpen(false)}>
              <Button variant="secondary" size="sm">
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.map((item) => (
                <div key={item._id} className="flex gap-4 border-b border-border py-4">
                  <Link
                    to={`/product/${item.product.slug}`}
                    onClick={() => setDrawerOpen(false)}
                    className="h-20 w-20 flex-shrink-0 overflow-hidden rounded border border-border"
                  >
                    <img
                      src={item.product.images?.[0]?.url}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      to={`/product/${item.product.slug}`}
                      onClick={() => setDrawerOpen(false)}
                      className="line-clamp-1 text-sm font-medium text-textPrimary hover:text-accent"
                    >
                      {item.product.name}
                    </Link>
                    <div className="mt-0.5 flex gap-2 text-xs text-textSecondary">
                      {item.size && <span>{item.size}</span>}
                      {item.color && <span>· {item.color}</span>}
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-sm text-textSecondary">
                        {item.quantity} × {formatCurrency(effectivePrice(item.product))}
                      </span>
                      <button
                        onClick={() => removeItem(item._id)}
                        aria-label="Remove"
                        className="text-textMuted hover:text-error"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-textSecondary">Subtotal</span>
                <span className="font-serif text-xl font-bold text-accent">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <Link to="/cart" onClick={() => setDrawerOpen(false)}>
                <Button variant="ghost" fullWidth className="mb-2">
                  View Cart
                </Button>
              </Link>
              <Link to="/checkout" onClick={() => setDrawerOpen(false)}>
                <Button fullWidth>Checkout</Button>
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>,
    document.body
  );
}
