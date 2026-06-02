import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutGrid, List, SlidersHorizontal, X, Search } from 'lucide-react';
import ProductGrid from '../components/products/ProductGrid';
import ProductFilters from '../components/products/ProductFilters';
import QuickViewModal from '../components/products/QuickViewModal';
import Pagination from '../components/ui/Pagination';
import { productApi, categoryApi } from '../api/productApi';
import { useDebounce } from '../hooks/useDebounce';
import { useLocalStorage } from '../hooks/useLocalStorage';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'top-rated', label: 'Top Rated' },
];

const BRANDS = ['Aurelia', 'Noir & Co', 'Lumen', 'Maison Vega', 'Atelier 9', 'Velour'];

// Convert URLSearchParams → filters object
const csv = (v) => (v ? v.split(',').filter(Boolean) : []);

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useLocalStorage('luxe_shop_view', 'grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [quickView, setQuickView] = useState(null);

  // Local search box state → debounced → pushed to URL
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(searchInput, 300);

  const filters = useMemo(
    () => ({
      search: searchParams.get('search') || '',
      category: csv(searchParams.get('category')),
      brand: csv(searchParams.get('brand')),
      size: csv(searchParams.get('size')),
      color: csv(searchParams.get('color')),
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : '',
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : '',
      rating: searchParams.get('rating') ? Number(searchParams.get('rating')) : '',
      sort: searchParams.get('sort') || 'newest',
      page: Number(searchParams.get('page')) || 1,
    }),
    [searchParams]
  );

  // Push debounced search into the URL (resetting page)
  useEffect(() => {
    if (debouncedSearch === (searchParams.get('search') || '')) return;
    const next = new URLSearchParams(searchParams);
    if (debouncedSearch) next.set('search', debouncedSearch);
    else next.delete('search');
    next.delete('page');
    setSearchParams(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Load categories once
  useEffect(() => {
    categoryApi.list().then((res) => setCategories(res.data.categories || [])).catch(() => {});
  }, []);

  // Fetch products whenever the URL filters change
  useEffect(() => {
    setLoading(true);
    const params = {
      search: filters.search || undefined,
      category: filters.category.join(',') || undefined,
      brand: filters.brand.join(',') || undefined,
      size: filters.size.join(',') || undefined,
      color: filters.color.join(',') || undefined,
      minPrice: filters.minPrice || undefined,
      maxPrice: filters.maxPrice || undefined,
      rating: filters.rating || undefined,
      sort: filters.sort,
      page: filters.page,
      limit: 9,
    };
    productApi
      .list(params)
      .then((res) => {
        setProducts(res.data.products || []);
        setMeta({ total: res.data.total, page: res.data.page, pages: res.data.pages });
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filters]);

  // Update one or more filter keys (arrays/scalars), reset page
  const updateFilters = useCallback(
    (patch) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          if (value.length) next.set(key, value.join(','));
          else next.delete(key);
        } else if (value === '' || value === undefined || value === null) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });
      if (!('page' in patch)) next.delete('page');
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const clearFilters = useCallback(() => {
    const next = new URLSearchParams();
    if (filters.sort && filters.sort !== 'newest') next.set('sort', filters.sort);
    setSearchParams(next);
    setSearchInput('');
  }, [filters.sort, setSearchParams]);

  const goToPage = (p) => updateFilters({ page: p });

  return (
    <div className="container-luxe py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-textPrimary">Shop</h1>
        <p className="mt-2 text-sm text-textSecondary">
          {meta.total} product{meta.total !== 1 ? 's' : ''} available
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <ProductFilters
              filters={filters}
              onChange={updateFilters}
              onClear={clearFilters}
              categories={categories}
              brands={BRANDS}
            />
          </div>
        </aside>

        {/* Main */}
        <div>
          {/* Toolbar */}
          <div className="mb-6 flex flex-col gap-4 rounded-card border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products…"
                className="input py-2.5 pl-9 text-sm"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="flex items-center gap-2 rounded border border-border px-3 py-2 text-sm text-textSecondary lg:hidden"
              >
                <SlidersHorizontal size={15} /> Filters
              </button>

              <select
                value={filters.sort}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                className="rounded border border-border bg-card px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none"
                aria-label="Sort products"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value} className="bg-card">
                    {s.label}
                  </option>
                ))}
              </select>

              <div className="hidden items-center rounded border border-border sm:flex">
                <button
                  onClick={() => setView('grid')}
                  aria-label="Grid view"
                  className={`p-2 ${view === 'grid' ? 'text-accent' : 'text-textMuted'}`}
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setView('list')}
                  aria-label="List view"
                  className={`p-2 ${view === 'list' ? 'text-accent' : 'text-textMuted'}`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          <ProductGrid
            products={products}
            loading={loading}
            view={view}
            onQuickView={setQuickView}
            skeletonCount={9}
          />

          {!loading && meta.pages > 1 && (
            <div className="mt-10">
              <Pagination page={meta.page} pages={meta.pages} onChange={goToPage} />
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto bg-background p-4 animate-slide-in-right">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-serif text-xl text-textPrimary">Filters</h2>
              <button onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters">
                <X size={22} className="text-textSecondary" />
              </button>
            </div>
            <ProductFilters
              filters={filters}
              onChange={updateFilters}
              onClear={clearFilters}
              categories={categories}
              brands={BRANDS}
            />
          </div>
        </div>
      )}

      <QuickViewModal product={quickView} open={Boolean(quickView)} onClose={() => setQuickView(null)} />
    </div>
  );
}
