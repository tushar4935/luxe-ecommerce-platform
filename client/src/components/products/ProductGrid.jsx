import { ShoppingBag, Heart, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import StarRating from '../ui/StarRating';
import Badge from '../ui/Badge';
import { ProductGridSkeleton } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import { PackageSearch } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { formatCurrency } from '../../utils/formatCurrency';
import { effectivePrice, hasDiscount, discountPercent } from '../../utils/calculateDiscount';

/**
 * Renders products as a responsive grid OR a stacked list, with loading and
 * empty states handled internally.
 */
export default function ProductGrid({ products, loading, view = 'grid', onQuickView, skeletonCount = 6 }) {
  const { addItem } = useCart();

  if (loading) return <ProductGridSkeleton count={skeletonCount} />;

  if (!products || products.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="No products found"
        message="Try adjusting your filters or search to find what you're looking for."
      />
    );
  }

  if (view === 'list') {
    return (
      <div className="flex flex-col gap-4">
        {products.map((product) => {
          const img = product.images?.[0]?.url;
          const out = product.stock <= 0;
          return (
            <Link
              key={product._id}
              to={`/product/${product.slug}`}
              className="group flex gap-5 overflow-hidden rounded-card border border-border bg-card p-4 transition-all duration-300 hover:border-accent/40"
            >
              <div className="relative h-40 w-40 flex-shrink-0 overflow-hidden rounded">
                <img
                  src={img}
                  alt={product.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {hasDiscount(product) && (
                  <Badge tone="solidRed" className="absolute left-2 top-2">
                    -{discountPercent(product)}%
                  </Badge>
                )}
              </div>
              <div className="flex flex-1 flex-col">
                <span className="text-[11px] font-medium uppercase tracking-widest text-accent">
                  {product.category?.name || product.brand}
                </span>
                <h3 className="mt-1 text-base font-semibold text-textPrimary">{product.name}</h3>
                <div className="mt-1">
                  <StarRating value={product.ratings || 0} size={13} count={product.numReviews || 0} />
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-textSecondary">
                  {product.shortDescription || product.description}
                </p>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-accent">
                      {formatCurrency(effectivePrice(product))}
                    </span>
                    {hasDiscount(product) && (
                      <span className="text-xs text-textMuted line-through">
                        {formatCurrency(product.price)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        onQuickView?.(product);
                      }}
                      aria-label="Quick view"
                      className="flex h-9 w-9 items-center justify-center rounded border border-border text-textPrimary hover:border-accent hover:text-accent"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (!out) addItem(product, { quantity: 1 });
                      }}
                      disabled={out}
                      className="flex items-center gap-2 rounded bg-accent px-4 py-2 text-xs font-semibold text-background hover:bg-accent-light disabled:opacity-50"
                    >
                      <ShoppingBag size={14} /> {out ? 'Sold Out' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} onQuickView={onQuickView} />
      ))}
    </div>
  );
}
