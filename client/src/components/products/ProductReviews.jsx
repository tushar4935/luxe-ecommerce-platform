import { useState, useEffect, useCallback } from 'react';
import { ThumbsUp, BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import StarRating from '../ui/StarRating';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { reviewApi } from '../../api/productApi';
import { getErrorMessage } from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/formatDate';

export default function ProductReviews({ productId, productRating = 0, numReviews = 0 }) {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState({ reviews: [], distribution: {}, total: 0 });
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ rating: 5, title: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reviewApi.forProduct(productId, { limit: 20 });
      setData(res.data);
    } catch (err) {
      console.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please log in to write a review');
      return;
    }
    if (!form.comment.trim()) {
      toast.error('Please write a comment');
      return;
    }
    setSubmitting(true);
    try {
      await reviewApi.create(productId, form);
      toast.success('Review added');
      setForm({ rating: 5, title: '', comment: '' });
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const vote = async (id) => {
    if (!isAuthenticated) {
      toast.error('Please log in to vote');
      return;
    }
    try {
      await reviewApi.helpful(id);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const total = data.total || numReviews || 0;
  const dist = data.distribution || {};
  const maxBar = Math.max(1, ...Object.values(dist));

  return (
    <div className="grid gap-10 lg:grid-cols-[300px_1fr]">
      {/* Summary + distribution */}
      <div>
        <div className="rounded-card border border-border bg-card p-6 text-center">
          <p className="font-serif text-5xl text-accent">{(productRating || 0).toFixed(1)}</p>
          <div className="mt-2 flex justify-center">
            <StarRating value={productRating} size={18} />
          </div>
          <p className="mt-1 text-sm text-textSecondary">{total} reviews</p>

          <div className="mt-5 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2">
                <span className="w-6 text-xs text-textSecondary">{star}★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${((dist[star] || 0) / maxBar) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right text-xs text-textMuted">{dist[star] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Write a review */}
        <form onSubmit={submit} className="mt-6 rounded-card border border-border bg-card p-6">
          <h4 className="mb-3 font-serif text-lg text-textPrimary">Write a review</h4>
          <StarRating value={form.rating} size={22} onChange={(r) => setForm((f) => ({ ...f, rating: r }))} />
          <input
            className="input mt-3 text-sm"
            placeholder="Title (optional)"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <textarea
            className="input mt-3 min-h-24 resize-none text-sm"
            placeholder="Share your thoughts…"
            value={form.comment}
            onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
          />
          <Button type="submit" fullWidth className="mt-3" loading={submitting} size="sm">
            Submit Review
          </Button>
        </form>
      </div>

      {/* Review list */}
      <div>
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : data.reviews.length === 0 ? (
          <p className="py-10 text-center text-sm text-textSecondary">
            No reviews yet. Be the first to review this product.
          </p>
        ) : (
          <div className="space-y-5">
            {data.reviews.map((r) => (
              <div key={r._id} className="rounded-card border border-border bg-card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-sm font-semibold text-accent">
                      {r.user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="flex items-center gap-1.5 text-sm font-medium text-textPrimary">
                        {r.user?.name || 'Anonymous'}
                        {r.isVerifiedPurchase && (
                          <BadgeCheck size={14} className="text-success" title="Verified purchase" />
                        )}
                      </p>
                      <StarRating value={r.rating} size={13} />
                    </div>
                  </div>
                  <span className="text-xs text-textMuted">{formatDate(r.createdAt)}</span>
                </div>
                {r.title && <p className="mt-3 text-sm font-semibold text-textPrimary">{r.title}</p>}
                <p className="mt-1 text-sm leading-relaxed text-textSecondary">{r.comment}</p>
                <button
                  onClick={() => vote(r._id)}
                  className="mt-3 flex items-center gap-1.5 text-xs text-textSecondary transition-colors hover:text-accent"
                >
                  <ThumbsUp size={13} /> Helpful ({r.helpful?.length || 0})
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
