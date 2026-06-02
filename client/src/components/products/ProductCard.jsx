import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, Eye } from 'lucide-react';
import StarRating from '../ui/StarRating';
import Badge from '../ui/Badge';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import { formatCurrency } from '../../utils/formatCurrency';
import { effectivePrice, hasDiscount, discountPercent } from '../../utils/calculateDiscount';

const placeholder = (seed) => `https://picsum.photos/seed/${seed}/600/600`;

export default function ProductCard({ product, onQuickView }) {
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();

  const img = product.images?.[0]?.url || placeholder(product._id);
  const wished = isWishlisted(product._id);
  const outOfStock = product.stock <= 0;

  const handleAdd = (e) => {
    e.preventDefault();
    if (outOfStock) return;
    addItem(product, { quantity: 1 });
  };

  const handleWish = (e) => {
    e.preventDefault();
    toggle(product);
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    onQuickView?.(product);
  };

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-card border border-border bg-card transition-all duration-300 ease-luxe hover:-translate-y-1 hover:border-accent/40 hover:shadow-cardHover"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-surface">
        <img
          src={img}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-luxe group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {hasDiscount(product) && <Badge tone="solidRed">-{discountPercent(product)}%</Badge>}
          {product.isFeatured && <Badge tone="solidGold">Featured</Badge>}
          {outOfStock && <Badge tone="gray">Sold Out</Badge>}
        </div>

        {/* Wishlist toggle (top-right) */}
        <button
          onClick={handleWish}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/70 backdrop-blur transition-colors hover:border-accent"
        >
          <Heart size={16} className={wished ? 'fill-accent text-accent' : 'text-textPrimary'} />
        </button>

        {/* Quick actions — slide up on hover */}
        <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center gap-2 bg-gradient-to-t from-background/95 to-transparent p-3 opacity-0 transition-all duration-300 ease-luxe group-hover:translate-y-0 group-hover:opacity-100">
          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className="flex flex-1 items-center justify-center gap-2 rounded bg-accent px-3 py-2 text-xs font-semibold text-background transition-colors hover:bg-accent-light disabled:opacity-50"
          >
            <ShoppingBag size={14} /> {outOfStock ? 'Sold Out' : 'Add'}
          </button>
          <button
            onClick={handleQuickView}
            aria-label="Quick view"
            className="flex h-9 w-9 items-center justify-center rounded border border-border bg-card text-textPrimary transition-colors hover:border-accent hover:text-accent"
          >
            <Eye size={16} />
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col p-4">
        <span className="text-[11px] font-medium uppercase tracking-widest text-accent">
          {product.category?.name || product.brand || 'LUXE'}
        </span>
        <h3 className="mt-1 line-clamp-1 text-sm font-semibold text-textPrimary">{product.name}</h3>

        <div className="mt-2">
          <StarRating value={product.ratings || 0} size={13} count={product.numReviews || 0} />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-base font-bold text-accent">
            {formatCurrency(effectivePrice(product))}
          </span>
          {hasDiscount(product) && (
            <span className="text-xs text-textMuted line-through">
              {formatCurrency(product.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
