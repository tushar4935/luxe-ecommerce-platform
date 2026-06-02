import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, X } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { formatCurrency } from '../../utils/formatCurrency';
import { effectivePrice } from '../../utils/calculateDiscount';

/**
 * A single row in the cart table. Fades + collapses on removal.
 */
export default function CartItem({ item }) {
  const { updateItem, removeItem } = useCart();
  const [removing, setRemoving] = useState(false);
  const product = item.product;

  const unit = effectivePrice(product);
  const lineTotal = unit * item.quantity;
  const maxStock = product.stock || 99;

  const handleRemove = () => {
    setRemoving(true);
    // Wait for the fade/slide animation before mutating the list
    setTimeout(() => removeItem(item._id), 280);
  };

  const setQty = (q) => updateItem(item._id, { quantity: Math.max(1, Math.min(maxStock, q)) });

  return (
    <div
      className={`grid grid-cols-[1fr_auto] items-center gap-4 border-b border-border py-5 transition-all duration-300 ease-luxe sm:grid-cols-[2fr_1fr_1fr_1fr_auto] ${
        removing ? '-translate-y-2 opacity-0' : 'opacity-100'
      }`}
    >
      {/* Product */}
      <div className="flex items-center gap-4">
        <Link
          to={`/product/${product.slug}`}
          className="h-20 w-20 flex-shrink-0 overflow-hidden rounded border border-border"
        >
          <img src={product.images?.[0]?.url} alt={product.name} className="h-full w-full object-cover" />
        </Link>
        <div className="min-w-0">
          <Link
            to={`/product/${product.slug}`}
            className="line-clamp-1 text-sm font-semibold text-textPrimary hover:text-accent"
          >
            {product.name}
          </Link>
          <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-textSecondary">
            {item.size && <span>Size: {item.size}</span>}
            {item.color && <span>Color: {item.color}</span>}
          </div>
          {/* Mobile price */}
          <p className="mt-1 text-sm font-bold text-accent sm:hidden">{formatCurrency(unit)}</p>
        </div>
      </div>

      {/* Price (desktop) */}
      <p className="hidden text-sm text-textSecondary sm:block">{formatCurrency(unit)}</p>

      {/* Quantity */}
      <div className="flex items-center justify-end sm:justify-start">
        <div className="flex items-center rounded border border-border">
          <button
            onClick={() => setQty(item.quantity - 1)}
            className="px-2.5 py-2 text-textSecondary hover:text-accent"
            aria-label="Decrease quantity"
          >
            <Minus size={13} />
          </button>
          <span className="w-8 text-center text-sm text-textPrimary">{item.quantity}</span>
          <button
            onClick={() => setQty(item.quantity + 1)}
            className="px-2.5 py-2 text-textSecondary hover:text-accent"
            aria-label="Increase quantity"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* Line total (desktop) */}
      <p className="hidden text-sm font-bold text-accent sm:block">{formatCurrency(lineTotal)}</p>

      {/* Remove */}
      <button
        onClick={handleRemove}
        aria-label="Remove item"
        className="flex h-8 w-8 items-center justify-center rounded-full text-textMuted transition-colors hover:bg-error/10 hover:text-error"
      >
        <X size={16} />
      </button>
    </div>
  );
}
