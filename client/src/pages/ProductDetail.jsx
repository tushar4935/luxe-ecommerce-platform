import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Heart,
  Minus,
  Plus,
  Truck,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
  Check,
  GitCompare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import StarRating from '../components/ui/StarRating';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { FullPageSpinner } from '../components/ui/Spinner';
import ProductImageGallery from '../components/products/ProductImageGallery';
import ProductReviews from '../components/products/ProductReviews';
import RelatedProducts from '../components/products/RelatedProducts';
import QuickViewModal from '../components/products/QuickViewModal';
import { productApi } from '../api/productApi';
import { getErrorMessage } from '../api/axios';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { formatCurrency } from '../utils/formatCurrency';
import { effectivePrice, hasDiscount, discountPercent } from '../utils/calculateDiscount';

const COMPARE_KEY = 'luxe_compare';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [tab, setTab] = useState('description');
  const [quickView, setQuickView] = useState(null);

  useEffect(() => {
    setLoading(true);
    productApi
      .bySlug(slug)
      .then((res) => {
        const p = res.data.product;
        setProduct(p);
        setSize(p.sizes?.[0] || '');
        setColor(p.colors?.[0]?.name || '');
        setQty(1);
        setTab('description');
      })
      .catch((err) => {
        toast.error(getErrorMessage(err));
        navigate('/shop');
      })
      .finally(() => setLoading(false));
    window.scrollTo({ top: 0 });
  }, [slug, navigate]);

  if (loading) return <FullPageSpinner />;
  if (!product) return null;

  const out = product.stock <= 0;
  const wished = isWishlisted(product._id);

  const addToCompare = () => {
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem(COMPARE_KEY)) || [];
    } catch {
      list = [];
    }
    if (list.some((p) => p._id === product._id)) {
      toast('Already in compare');
      return;
    }
    if (list.length >= 4) {
      toast.error('You can compare up to 4 products');
      return;
    }
    list.push({
      _id: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      discountPrice: product.discountPrice,
      images: product.images,
      ratings: product.ratings,
      brand: product.brand,
      category: product.category,
    });
    localStorage.setItem(COMPARE_KEY, JSON.stringify(list));
    toast.success('Added to compare');
  };

  return (
    <div className="container-luxe py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-textSecondary">
        <Link to="/" className="hover:text-accent">Home</Link>
        <ChevronRight size={14} />
        <Link to="/shop" className="hover:text-accent">Shop</Link>
        <ChevronRight size={14} />
        {product.category?.slug && (
          <>
            <Link to={`/shop?category=${product.category._id}`} className="hover:text-accent">
              {product.category.name}
            </Link>
            <ChevronRight size={14} />
          </>
        )}
        <span className="truncate text-textPrimary">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductImageGallery images={product.images} alt={product.name} />

        {/* Info */}
        <div>
          <span className="text-xs font-medium uppercase tracking-widest text-accent">
            {product.brand} {product.category?.name ? `· ${product.category.name}` : ''}
          </span>
          <h1 className="mt-2 font-serif text-3xl text-textPrimary md:text-4xl">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <StarRating value={product.ratings || 0} size={16} count={product.numReviews || 0} />
            {out ? <Badge tone="red">Out of Stock</Badge> : <Badge tone="green">In Stock</Badge>}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <span className="text-3xl font-bold text-accent">{formatCurrency(effectivePrice(product))}</span>
            {hasDiscount(product) && (
              <>
                <span className="text-lg text-textMuted line-through">{formatCurrency(product.price)}</span>
                <Badge tone="solidRed">-{discountPercent(product)}%</Badge>
              </>
            )}
          </div>

          <p className="mt-5 leading-relaxed text-textSecondary">
            {product.shortDescription || product.description}
          </p>

          {/* Size selector */}
          {product.sizes?.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-textPrimary">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`flex h-10 min-w-10 items-center justify-center rounded border px-3 text-sm transition-colors ${
                      size === s
                        ? 'border-accent font-medium text-accent'
                        : 'border-border text-textSecondary hover:border-accent'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color selector */}
          {product.colors?.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-textPrimary">
                Color: <span className="text-textSecondary">{color}</span>
              </p>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setColor(c.name)}
                    aria-label={c.name}
                    title={c.name}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-transform hover:scale-110 ${
                      color === c.name ? 'border-accent ring-2 ring-accent/40' : 'border-border'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {color === c.name && <Check size={14} className="text-background mix-blend-difference" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + actions */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded border border-border">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-4 py-3 text-textSecondary hover:text-accent"
                aria-label="Decrease quantity"
              >
                <Minus size={15} />
              </button>
              <span className="w-12 text-center text-textPrimary">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
                className="px-4 py-3 text-textSecondary hover:text-accent"
                aria-label="Increase quantity"
              >
                <Plus size={15} />
              </button>
            </div>
            <span className="text-xs text-textMuted">{product.stock} available</span>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              size="lg"
              disabled={out}
              className="flex-1 min-w-[200px]"
              onClick={() => addItem(product, { quantity: qty, size, color })}
            >
              <ShoppingBag size={18} /> {out ? 'Sold Out' : 'Add to Cart'}
            </Button>
            <Button variant="ghost" size="lg" onClick={() => toggle(product)}>
              <Heart size={18} className={wished ? 'fill-accent text-accent' : ''} />
              {wished ? 'Saved' : 'Wishlist'}
            </Button>
            <Button variant="ghost" size="lg" onClick={addToCompare} aria-label="Add to compare">
              <GitCompare size={18} />
            </Button>
          </div>

          {/* Delivery strip */}
          <div className="mt-8 grid grid-cols-1 gap-4 rounded-card border border-border bg-card p-5 sm:grid-cols-3">
            {[
              [Truck, 'Free Shipping', 'Orders over $100'],
              [RefreshCw, 'Easy Returns', 'Within 30 days'],
              [ShieldCheck, 'Secure Payment', 'Protected checkout'],
            ].map(([Icon, title, sub]) => (
              <div key={title} className="flex items-center gap-3">
                <Icon size={20} className="flex-shrink-0 text-accent" />
                <div>
                  <p className="text-sm font-medium text-textPrimary">{title}</p>
                  <p className="text-xs text-textSecondary">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-16">
        <div className="flex gap-8 border-b border-border">
          {[
            ['description', 'Description'],
            ['specifications', 'Specifications'],
            ['reviews', `Reviews (${product.numReviews || 0})`],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`relative -mb-px pb-4 text-sm font-medium transition-colors ${
                tab === key ? 'text-accent' : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              {label}
              {tab === key && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" />}
            </button>
          ))}
        </div>

        <div className="py-8">
          {tab === 'description' && (
            <div className="max-w-3xl text-sm leading-relaxed text-textSecondary">
              <p>{product.description}</p>
              {product.tags?.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {product.tags.map((t) => (
                    <Badge key={t} tone="gray">#{t}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'specifications' && (
            <div className="max-w-2xl">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ['Brand', product.brand || '—'],
                    ['Category', product.category?.name || '—'],
                    ['Available Sizes', product.sizes?.join(', ') || '—'],
                    ['Colors', product.colors?.map((c) => c.name).join(', ') || '—'],
                    ['Stock', `${product.stock} units`],
                    ['SKU', product._id.slice(-8).toUpperCase()],
                  ].map(([k, v]) => (
                    <tr key={k} className="border-b border-border">
                      <td className="py-3 pr-4 font-medium text-textPrimary">{k}</td>
                      <td className="py-3 text-textSecondary">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'reviews' && (
            <ProductReviews
              productId={product._id}
              productRating={product.ratings}
              numReviews={product.numReviews}
            />
          )}
        </div>
      </div>

      <RelatedProducts productId={product._id} onQuickView={setQuickView} />

      <QuickViewModal product={quickView} open={Boolean(quickView)} onClose={() => setQuickView(null)} />
    </div>
  );
}
