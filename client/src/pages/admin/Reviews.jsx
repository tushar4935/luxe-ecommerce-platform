import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import StarRating from '../../components/ui/StarRating';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { reviewApi } from '../../api/productApi';
import { getErrorMessage } from '../../api/axios';
import { formatDate } from '../../utils/formatDate';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    reviewApi
      .all({ rating: rating || undefined, page, limit: 12 })
      .then((res) => {
        setReviews(res.data.reviews || []);
        setMeta({ page: res.data.page, pages: res.data.pages, total: res.data.total });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [rating, page]);

  useEffect(load, [load]);
  useEffect(() => setPage(1), [rating]);

  const remove = async () => {
    try {
      await reviewApi.remove(deleteId);
      toast.success('Review deleted');
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-textPrimary">Reviews</h1>
          <p className="mt-1 text-sm text-textSecondary">{meta.total} reviews</p>
        </div>
        <select value={rating} onChange={(e) => setRating(e.target.value)} className="rounded border border-border bg-card px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none">
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {r} stars
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : reviews.length === 0 ? (
        <p className="py-16 text-center text-textSecondary">No reviews found.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((r) => (
            <div key={r._id} className="rounded-card border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {r.product?.images?.[0]?.url && (
                    <Link to={r.product?.slug ? `/product/${r.product.slug}` : '#'}>
                      <img src={r.product.images[0].url} alt={r.product.name} className="h-12 w-12 rounded border border-border object-cover" />
                    </Link>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-textPrimary">{r.product?.name || 'Product'}</p>
                    <StarRating value={r.rating} size={13} />
                  </div>
                </div>
                <button onClick={() => setDeleteId(r._id)} className="text-textSecondary hover:text-error" aria-label="Delete review">
                  <Trash2 size={16} />
                </button>
              </div>

              {r.title && <p className="mt-3 text-sm font-semibold text-textPrimary">{r.title}</p>}
              <p className="mt-1 line-clamp-3 text-sm text-textSecondary">{r.comment}</p>

              <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-textMuted">
                <span className="flex items-center gap-1.5">
                  {r.user?.name || 'Anonymous'}
                  {r.isVerifiedPurchase && <BadgeCheck size={13} className="text-success" />}
                </span>
                <span>{formatDate(r.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {meta.pages > 1 && (
        <div className="mt-6">
          <Pagination page={meta.page} pages={meta.pages} onChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={remove}
        title="Delete review?"
        message="This review will be permanently removed and the product rating recalculated."
        confirmLabel="Delete"
      />
    </div>
  );
}
