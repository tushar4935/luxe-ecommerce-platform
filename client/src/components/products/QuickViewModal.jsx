import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, Minus, Plus } from 'lucide-react';
import Modal from '../ui/Modal';
import StarRating from '../ui/StarRating';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import { formatCurrency } from '../../utils/formatCurrency';
import { effectivePrice, hasDiscount, discountPercent } from '../../utils/calculateDiscount';

export default function QuickViewModal({ product, open, onClose }) {
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');

  useEffect(() => {
    if (product) {
      setQty(1);
      setSize(product.sizes?.[0] || '');
      setColor(product.colors?.[0]?.name || '');
    }
  }, [product]);

  if (!product) return null;
  const out = product.stock <= 0;

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Quick View">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-card border border-border">
          <img
            src={product.images?.[0]?.url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
          {hasDiscount(product) && (
            <Badge tone="solidRed" className="absolute left-3 top-3">
              -{discountPercent(product)}%
            </Badge>
          )}
        </div>

        <div>
          <span className="text-[11px] font-medium uppercase tracking-widest text-accent">
            {product.category?.name || product.brand}
          </span>
          <h3 className="mt-1 font-serif text-2xl text-textPrimary">{product.name}</h3>
          <div className="mt-2">
            <StarRating value={product.ratings || 0} size={15} count={product.numReviews || 0} />
          </div>

          <div className="mt-3 flex items-center gap-3">
            <span className="text-2xl font-bold text-accent">
              {formatCurrency(effectivePrice(product))}
            </span>
            {hasDiscount(product) && (
              <span className="text-sm text-textMuted line-through">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>

          <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-textSecondary">
            {product.shortDescription || product.description}
          </p>

          {/* Sizes */}
          {product.sizes?.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs uppercase tracking-wider text-textSecondary">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`flex h-9 min-w-9 items-center justify-center rounded border px-3 text-xs transition-colors ${
                      size === s ? 'border-accent text-accent' : 'border-border text-textSecondary hover:border-accent'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          {product.colors?.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs uppercase tracking-wider text-textSecondary">Color</p>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setColor(c.name)}
                    aria-label={c.name}
                    title={c.name}
                    className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      color === c.name ? 'border-accent ring-2 ring-accent/40' : 'border-border'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quantity + actions */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded border border-border">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 py-2.5 text-textSecondary hover:text-accent"
                aria-label="Decrease quantity"
              >
                <Minus size={14} />
              </button>
              <span className="w-10 text-center text-sm text-textPrimary">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
                className="px-3 py-2.5 text-textSecondary hover:text-accent"
                aria-label="Increase quantity"
              >
                <Plus size={14} />
              </button>
            </div>

            <Button
              fullWidth
              disabled={out}
              onClick={() => {
                addItem(product, { quantity: qty, size, color });
                onClose();
              }}
            >
              <ShoppingBag size={16} /> {out ? 'Sold Out' : 'Add to Cart'}
            </Button>
            <button
              onClick={() => toggle(product)}
              aria-label="Toggle wishlist"
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded border border-border hover:border-accent"
            >
              <Heart
                size={18}
                className={isWishlisted(product._id) ? 'fill-accent text-accent' : 'text-textPrimary'}
              />
            </button>
          </div>

          <Link
            to={`/product/${product.slug}`}
            onClick={onClose}
            className="mt-4 inline-block text-sm text-accent underline-offset-4 hover:underline"
          >
            View full details →
          </Link>
        </div>
      </div>
    </Modal>
  );
}
