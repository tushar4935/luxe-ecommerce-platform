import { Heart, ShoppingBag, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/ui/EmptyState';
import StarRating from '../components/ui/StarRating';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { useWishlist } from '../hooks/useWishlist';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '../utils/formatCurrency';
import { effectivePrice, hasDiscount, discountPercent } from '../utils/calculateDiscount';

export default function Wishlist() {
  const { products, count, loading, remove } = useWishlist();
  const { addItem } = useCart();

  if (loading) {
    return (
      <div className="container-luxe flex justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="container-luxe py-10">
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          message="Save the pieces you love and they'll show up here, ready when you are."
          ctaLabel="Explore Products"
          ctaTo="/shop"
        />
      </div>
    );
  }

  const moveToCart = (product) => {
    addItem(product, { quantity: 1, size: product.sizes?.[0] || '', color: product.colors?.[0]?.name || '' });
    remove(product._id);
  };

  return (
    <div className="container-luxe py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-serif text-4xl text-textPrimary">Wishlist</h1>
          <p className="mt-2 text-sm text-textSecondary">
            {count} saved item{count !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {products.map((product) => {
          const out = product.stock <= 0;
          return (
            <div
              key={product._id}
              className="group flex flex-col overflow-hidden rounded-card border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-cardHover"
            >
              <div className="relative aspect-square overflow-hidden">
                <Link to={`/product/${product.slug}`}>
                  <img
                    src={product.images?.[0]?.url}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </Link>
                {hasDiscount(product) && (
                  <Badge tone="solidRed" className="absolute left-3 top-3">
                    -{discountPercent(product)}%
                  </Badge>
                )}
                <button
                  onClick={() => remove(product._id)}
                  aria-label="Remove from wishlist"
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/70 text-textPrimary backdrop-blur transition-colors hover:border-error hover:text-error"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <span className="text-[11px] font-medium uppercase tracking-widest text-accent">
                  {product.category?.name || product.brand}
                </span>
                <Link
                  to={`/product/${product.slug}`}
                  className="mt-1 line-clamp-1 text-sm font-semibold text-textPrimary hover:text-accent"
                >
                  {product.name}
                </Link>
                <div className="mt-2">
                  <StarRating value={product.ratings || 0} size={13} count={product.numReviews || 0} />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-base font-bold text-accent">
                    {formatCurrency(effectivePrice(product))}
                  </span>
                  {hasDiscount(product) && (
                    <span className="text-xs text-textMuted line-through">
                      {formatCurrency(product.price)}
                    </span>
                  )}
                </div>

                <Button
                  size="sm"
                  fullWidth
                  className="mt-4"
                  disabled={out}
                  onClick={() => moveToCart(product)}
                >
                  <ShoppingBag size={14} /> {out ? 'Sold Out' : 'Move to Cart'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
