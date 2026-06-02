import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { ArrowRight, Truck, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import ProductCard from '../components/products/ProductCard';
import QuickViewModal from '../components/products/QuickViewModal';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import { productApi, categoryApi } from '../api/productApi';

const categoryImage = (name) =>
  `https://picsum.photos/seed/cat-${name.toLowerCase().replace(/\s/g, '')}/500/500`;

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickView, setQuickView] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [f, c, n] = await Promise.all([
          productApi.featured(),
          categoryApi.list(),
          productApi.list({ sort: 'newest', limit: 8 }),
        ]);
        setFeatured(f.data.products || []);
        setCategories(c.data.categories || []);
        setNewArrivals(n.data.products || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 70% 30%, #1a1a1a 0%, #0a0a0a 60%)' }}
        />
        <div className="container-luxe relative grid min-h-[88vh] items-center gap-10 py-16 lg:grid-cols-[1.2fr_1fr]">
          <div className="animate-slide-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/50 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-accent">
              <Sparkles size={14} /> New Collection 2025
            </span>
            <h1 className="mt-6 font-serif text-5xl font-bold leading-tight text-textPrimary sm:text-6xl md:text-7xl">
              Elevate Your <span className="text-gradient-gold">Style</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-textSecondary">
              Discover thoughtfully curated luxury essentials. Timeless craftsmanship,
              modern silhouettes, and pieces designed to last a lifetime.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/shop" className="btn-primary">
                Shop Collection <ArrowRight size={18} />
              </Link>
              <Link to="/shop?sort=popular" className="btn-secondary">
                Best Sellers
              </Link>
            </div>

            {/* Floating stats */}
            <div className="mt-12 flex flex-wrap items-center gap-6 sm:gap-10">
              {[
                ['10K+', 'Products'],
                ['50K+', 'Customers'],
                ['Free', 'Returns'],
              ].map(([num, label], i) => (
                <div key={label} className="flex items-center gap-6 sm:gap-10">
                  {i > 0 && <span className="hidden h-10 w-px bg-border sm:block" />}
                  <div>
                    <p className="font-serif text-2xl font-bold text-accent">{num}</p>
                    <p className="text-xs uppercase tracking-wider text-textSecondary">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative aspect-[4/5] overflow-hidden rounded-card border border-border shadow-cardHover">
              <img
                src="https://picsum.photos/seed/luxe-hero/800/1000"
                alt="LUXE new collection"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
            </div>
            <div className="absolute -left-6 bottom-12 rounded-card border border-border bg-card/90 px-5 py-4 backdrop-blur shadow-modal">
              <p className="text-xs uppercase tracking-wider text-textSecondary">Starting at</p>
              <p className="font-serif text-2xl font-bold text-accent">$45.00</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ──────────────────────────────────────── */}
      <section className="section">
        <div className="container-luxe">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-3xl text-textPrimary md:text-4xl">Shop by Category</h2>
              <p className="mt-2 text-sm text-textSecondary">Find exactly what you’re looking for.</p>
            </div>
            <Link to="/shop" className="hidden text-sm text-accent hover:underline sm:block">
              View all →
            </Link>
          </div>

          <Swiper
            modules={[Navigation]}
            navigation
            spaceBetween={16}
            slidesPerView={2.2}
            breakpoints={{ 640: { slidesPerView: 3.2 }, 1024: { slidesPerView: 5 } }}
          >
            {categories.map((c) => (
              <SwiperSlide key={c._id}>
                <Link
                  to={`/shop?category=${c._id}`}
                  className="group relative block aspect-square overflow-hidden rounded-card border border-border"
                >
                  <img
                    src={c.image?.url || categoryImage(c.name)}
                    alt={c.name}
                    className="h-full w-full object-cover transition-transform duration-500 ease-luxe group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent transition-colors duration-300 group-hover:from-background/95" />
                  <div className="absolute inset-x-0 bottom-0 border-b-2 border-transparent p-4 text-center transition-all duration-300 group-hover:border-accent">
                    <p className="font-serif text-lg font-semibold text-textPrimary">{c.name}</p>
                    <p className="text-xs text-textSecondary">{c.productCount} items</p>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* ── Featured products ───────────────────────────────── */}
      <section className="section pt-0">
        <div className="container-luxe">
          <div className="mb-10 text-center">
            <h2 className="font-serif text-3xl text-textPrimary md:text-4xl">Featured Pieces</h2>
            <p className="mt-2 text-sm text-textSecondary">Hand-picked highlights from the new collection.</p>
          </div>
          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : (
            <Swiper
              modules={[Navigation, Autoplay]}
              navigation
              autoplay={{ delay: 4000, disableOnInteraction: true }}
              spaceBetween={20}
              slidesPerView={1.3}
              breakpoints={{ 640: { slidesPerView: 2.3 }, 1024: { slidesPerView: 4 } }}
            >
              {featured.map((p) => (
                <SwiperSlide key={p._id} className="h-auto pb-2">
                  <ProductCard product={p} onQuickView={setQuickView} />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </section>

      {/* ── Promo banner ────────────────────────────────────── */}
      <section className="container-luxe">
        <div className="relative overflow-hidden rounded-card border border-border">
          <img
            src="https://picsum.photos/seed/luxe-banner/1600/500"
            alt="Seasonal offer"
            className="h-64 w-full object-cover md:h-80"
          />
          <div className="absolute inset-0 flex flex-col justify-center bg-gradient-to-r from-background via-background/80 to-transparent px-8 md:px-16">
            <span className="text-xs uppercase tracking-widest text-accent">Limited Time</span>
            <h3 className="mt-2 max-w-md font-serif text-3xl font-bold text-textPrimary md:text-4xl">
              Up to 40% off select styles
            </h3>
            <Link to="/shop?sort=price-asc" className="btn-primary mt-6 w-fit">
              Shop the Sale <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── New arrivals ────────────────────────────────────── */}
      <section className="section">
        <div className="container-luxe">
          <div className="mb-10 flex items-end justify-between">
            <h2 className="font-serif text-3xl text-textPrimary md:text-4xl">New Arrivals</h2>
            <Link to="/shop?sort=newest" className="text-sm text-accent hover:underline">
              View all →
            </Link>
          </div>
          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {newArrivals.slice(0, 4).map((p) => (
                <ProductCard key={p._id} product={p} onQuickView={setQuickView} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Trust strip ─────────────────────────────────────── */}
      <section className="border-t border-border bg-surface">
        <div className="container-luxe grid grid-cols-1 gap-8 py-12 sm:grid-cols-3">
          {[
            [Truck, 'Free Shipping', 'On all orders over $100'],
            [RefreshCw, 'Easy Returns', '30-day hassle-free returns'],
            [ShieldCheck, 'Secure Payment', '100% protected checkout'],
          ].map(([Icon, title, sub]) => (
            <div key={title} className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Icon size={22} />
              </div>
              <div>
                <p className="font-semibold text-textPrimary">{title}</p>
                <p className="text-sm text-textSecondary">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <QuickViewModal product={quickView} open={Boolean(quickView)} onClose={() => setQuickView(null)} />
    </div>
  );
}
