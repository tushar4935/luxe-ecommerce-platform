import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Plus, ShoppingBag, GitCompare } from 'lucide-react';
import StarRating from '../components/ui/StarRating';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '../utils/formatCurrency';
import { effectivePrice } from '../utils/calculateDiscount';

const COMPARE_KEY = 'luxe_compare';

export default function Compare() {
  const { addItem } = useCart();
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem(COMPARE_KEY)) || []);
    } catch {
      setItems([]);
    }
  }, []);

  const removeItem = (id) => {
    const next = items.filter((p) => p._id !== id);
    setItems(next);
    localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
  };

  const clearAll = () => {
    setItems([]);
    localStorage.removeItem(COMPARE_KEY);
  };

  if (items.length === 0) {
    return (
      <div className="container-luxe py-10">
        <EmptyState
          icon={GitCompare}
          title="Nothing to compare yet"
          message="Add products to compare their features side by side. Look for the compare icon on product pages."
          ctaLabel="Browse Products"
          ctaTo="/shop"
        />
      </div>
    );
  }

  const slots = [...items];
  const canAddMore = slots.length < 4;

  const Row = ({ label, render }) => (
    <tr className="border-b border-border">
      <td className="sticky left-0 z-10 w-36 bg-surface px-4 py-4 text-sm font-medium text-textSecondary">
        {label}
      </td>
      {slots.map((p) => (
        <td key={p._id} className="min-w-[200px] px-4 py-4 align-top">
          {render(p)}
        </td>
      ))}
      {canAddMore && <td className="min-w-[200px] px-4 py-4" />}
    </tr>
  );

  return (
    <div className="container-luxe py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl text-textPrimary">Compare</h1>
          <p className="mt-2 text-sm text-textSecondary">{items.length} of 4 products</p>
        </div>
        <Button variant="ghost" size="sm" onClick={clearAll}>
          Clear All
        </Button>
      </div>

      <div className="overflow-x-auto rounded-card border border-border bg-card">
        <table className="w-full border-collapse">
          <tbody>
            {/* Image + remove */}
            <tr className="border-b border-border">
              <td className="sticky left-0 z-10 bg-surface px-4 py-4" />
              {slots.map((p) => (
                <td key={p._id} className="min-w-[200px] px-4 py-4">
                  <div className="relative">
                    <Link to={`/product/${p.slug}`}>
                      <img
                        src={p.images?.[0]?.url}
                        alt={p.name}
                        className="aspect-square w-full rounded border border-border object-cover"
                      />
                    </Link>
                    <button
                      onClick={() => removeItem(p._id)}
                      aria-label="Remove from compare"
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background/80 text-textPrimary hover:border-error hover:text-error"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </td>
              ))}
              {canAddMore && (
                <td className="min-w-[200px] px-4 py-4">
                  <Link
                    to="/shop"
                    className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded border border-dashed border-border text-textSecondary transition-colors hover:border-accent hover:text-accent"
                  >
                    <Plus size={28} />
                    <span className="text-sm">Add Product</span>
                  </Link>
                </td>
              )}
            </tr>

            <Row
              label="Name"
              render={(p) => (
                <Link to={`/product/${p.slug}`} className="text-sm font-medium text-textPrimary hover:text-accent">
                  {p.name}
                </Link>
              )}
            />
            <Row
              label="Price"
              render={(p) => (
                <span className="text-base font-bold text-accent">{formatCurrency(effectivePrice(p))}</span>
              )}
            />
            <Row label="Rating" render={(p) => <StarRating value={p.ratings || 0} size={14} />} />
            <Row label="Brand" render={(p) => <span className="text-sm text-textSecondary">{p.brand || '—'}</span>} />
            <Row
              label="Category"
              render={(p) => <span className="text-sm text-textSecondary">{p.category?.name || '—'}</span>}
            />
            <Row
              label="Add to Cart"
              render={(p) => (
                <Button size="sm" onClick={() => addItem(p, { quantity: 1 })}>
                  <ShoppingBag size={14} /> Add
                </Button>
              )}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}
