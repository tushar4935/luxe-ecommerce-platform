import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import StarRating from '../ui/StarRating';
import { formatCurrency } from '../../utils/formatCurrency';

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border py-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-sm font-semibold uppercase tracking-wider text-textPrimary"
      >
        {title}
        <ChevronDown
          size={16}
          className={`text-textSecondary transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-luxe ${
          open ? 'mt-4 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

const Checkbox = ({ label, checked, onChange, count }) => (
  <label className="flex cursor-pointer items-center justify-between py-1.5 text-sm">
    <span className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded-sm border-border bg-card accent-accent"
      />
      <span className={checked ? 'text-accent' : 'text-textSecondary'}>{label}</span>
    </span>
    {count !== undefined && <span className="text-xs text-textMuted">{count}</span>}
  </label>
);

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const COLOR_SWATCHES = [
  { name: 'Black', hex: '#0a0a0a' },
  { name: 'Ivory', hex: '#f5f5f5' },
  { name: 'Gold', hex: '#c9a84c' },
  { name: 'Charcoal', hex: '#2a2a2a' },
  { name: 'Camel', hex: '#a8893c' },
  { name: 'Burgundy', hex: '#5a1a2a' },
];

/**
 * Filter sidebar. `filters` holds arrays for multi-selects + scalar price/rating.
 */
export default function ProductFilters({
  filters,
  onChange,
  onClear,
  categories = [],
  brands = [],
  maxPriceBound = 500,
}) {
  const toggleArray = (key, value) => {
    const current = filters[key] || [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ [key]: next });
  };

  const hasActive =
    (filters.category?.length || 0) +
      (filters.brand?.length || 0) +
      (filters.size?.length || 0) +
      (filters.color?.length || 0) >
      0 ||
    filters.rating ||
    filters.minPrice ||
    filters.maxPrice;

  return (
    <div className="rounded-card border border-border bg-card p-5">
      <div className="flex items-center justify-between pb-2">
        <h2 className="font-serif text-lg text-textPrimary">Filters</h2>
        {hasActive && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-textSecondary transition-colors hover:text-accent"
          >
            <X size={12} /> Clear all
          </button>
        )}
      </div>

      {/* Categories */}
      <Section title="Categories">
        {categories.length === 0 && <p className="text-xs text-textMuted">No categories</p>}
        {categories.map((c) => (
          <Checkbox
            key={c._id}
            label={c.name}
            count={c.productCount}
            checked={(filters.category || []).includes(c._id)}
            onChange={() => toggleArray('category', c._id)}
          />
        ))}
      </Section>

      {/* Price */}
      <Section title="Price Range">
        <div className="px-1">
          <input
            type="range"
            min="0"
            max={maxPriceBound}
            value={filters.maxPrice || maxPriceBound}
            onChange={(e) => onChange({ maxPrice: Number(e.target.value) })}
            className="w-full accent-accent"
            aria-label="Maximum price"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-textSecondary">
            <span>{formatCurrency(filters.minPrice || 0)}</span>
            <span>{formatCurrency(filters.maxPrice || maxPriceBound)}</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ''}
              onChange={(e) => onChange({ minPrice: e.target.value ? Number(e.target.value) : '' })}
              className="input py-2 text-xs"
            />
            <span className="text-textMuted">–</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ''}
              onChange={(e) => onChange({ maxPrice: e.target.value ? Number(e.target.value) : '' })}
              className="input py-2 text-xs"
            />
          </div>
        </div>
      </Section>

      {/* Brands */}
      {brands.length > 0 && (
        <Section title="Brands">
          {brands.map((b) => (
            <Checkbox
              key={b}
              label={b}
              checked={(filters.brand || []).includes(b)}
              onChange={() => toggleArray('brand', b)}
            />
          ))}
        </Section>
      )}

      {/* Ratings */}
      <Section title="Rating">
        {[4, 3, 2, 1].map((r) => (
          <button
            key={r}
            onClick={() => onChange({ rating: filters.rating === r ? '' : r })}
            className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
              filters.rating === r ? 'bg-accent/10 text-accent' : 'text-textSecondary hover:text-accent'
            }`}
          >
            <StarRating value={r} size={14} />
            <span className="text-xs">& up</span>
          </button>
        ))}
      </Section>

      {/* Sizes */}
      <Section title="Sizes" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => {
            const active = (filters.size || []).includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleArray('size', s)}
                className={`flex h-9 min-w-9 items-center justify-center rounded border px-2 text-xs transition-colors ${
                  active
                    ? 'border-accent text-accent'
                    : 'border-border text-textSecondary hover:border-accent'
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Colors */}
      <Section title="Colors" defaultOpen={false}>
        <div className="flex flex-wrap gap-3">
          {COLOR_SWATCHES.map((c) => {
            const active = (filters.color || []).includes(c.name);
            return (
              <button
                key={c.name}
                onClick={() => toggleArray('color', c.name)}
                aria-label={c.name}
                title={c.name}
                className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                  active ? 'border-accent' : 'border-border'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            );
          })}
        </div>
      </Section>
    </div>
  );
}
