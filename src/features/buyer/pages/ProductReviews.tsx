import { useEffect, useState } from 'react';
import { ShieldCheck, Pencil, Trash2, Star } from 'lucide-react';
import { StarRating, Button } from '@/components/comman/ui';
import { TokenStorage } from '@/api/services/auth';
import { apiGetProductReviews, apiDeleteReview, type ProductReviewEntry, type ProductReviewStats } from '@/api/services/rating';
import { ReviewFormModal } from '../components/ReviewFormModal';

const AVATAR_PALETTE = [
  ['#FDECEA', '#C0392B'], ['#EAF3FB', '#2156A8'], ['#EAF7EF', '#1E7A3C'],
  ['#FFF4E5', '#B36200'], ['#F1EEFB', '#5B3EC4'], ['#E5F4FB', '#1A6A8A'],
];
function avatarStyle(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_PALETTE.length;
  const [bg, color] = AVATAR_PALETTE[idx];
  return { bg, color };
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return mins <= 1 ? 'Just now' : `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

interface ProductReviewsSectionProps {
  productId: string;
}

export function ProductReviewsSection({ productId }: ProductReviewsSectionProps) {
  const [reviews, setReviews]   = useState<ProductReviewEntry[]>([]);
  const [stats, setStats]       = useState<ProductReviewStats | null>(null);
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showWrite, setShowWrite] = useState(false);
  const [editingReview, setEditingReview] = useState<ProductReviewEntry | null>(null);

  const isLoggedIn = TokenStorage.isLoggedIn();
  const hasOwnReview = reviews.some(r => r.isOwn);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiGetProductReviews(productId, { page, rating: ratingFilter ?? undefined })
      .then(res => {
        if (cancelled) return;
        setReviews(res.data.reviews);
        setStats(res.data.stats);
        setTotalPages(res.data.pagination.totalPages);
      })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load reviews.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productId, page, ratingFilter, refreshKey]);

  async function handleDelete(review: ProductReviewEntry) {
    if (!window.confirm('Delete your review? This cannot be undone.')) return;
    try {
      await apiDeleteReview(review.reviewId);
      setRefreshKey(k => k + 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete review.');
    }
  }

  const hasReviews = !!stats && stats.totalReviews > 0;

  return (
    <div>
      <div className="text-[15px] font-bold text-carbon mb-4">
        Ratings &amp; Reviews
      </div>

      {/* Summary */}
      {hasReviews && (
        <div className="flex flex-col sm:flex-row gap-6 mb-5 pb-5 border-b border-bone">
          <div className="flex flex-col items-center sm:items-start shrink-0 sm:w-[140px]">
            <p className="text-[40px] font-extrabold text-carbon leading-none">{stats!.averageRating.toFixed(1)}</p>
            <StarRating value={stats!.averageRating} size={16} className="my-[6px]" />
            <p className="text-[12px] text-slate">{stats!.totalReviews} review{stats!.totalReviews !== 1 ? 's' : ''}</p>
          </div>

          <div className="flex-1 flex flex-col gap-[6px] min-w-0">
            {(['5', '4', '3', '2', '1'] as const).map(star => {
              const count = stats!.ratingBreakdown[star] ?? 0;
              const pct = stats!.totalReviews > 0 ? Math.round((count / stats!.totalReviews) * 100) : 0;
              const active = ratingFilter === Number(star);
              return (
                <button
                  key={star}
                  onClick={() => { setRatingFilter(active ? null : Number(star)); setPage(1); }}
                  className="flex items-center gap-2 bg-transparent border-0 cursor-pointer p-0 group"
                >
                  <span className={`text-[12px] w-9 text-left shrink-0 ${active ? 'font-bold text-brand-orange' : 'text-graphite'}`}>{star} ★</span>
                  <div className="flex-1 h-[7px] rounded-full bg-bone overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-[width] duration-300 ${active ? 'bg-brand-orange' : 'bg-[#D9D6CC] group-hover:bg-brand-orange/60'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-slate w-7 text-right shrink-0">{count}</span>
                </button>
              );
            })}
            {ratingFilter && (
              <button onClick={() => { setRatingFilter(null); setPage(1); }} className="self-start text-[11px] text-brand-orange bg-transparent border-0 cursor-pointer mt-1 p-0">
                Clear filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* Write / manage own review */}
      {isLoggedIn && !hasOwnReview && (
        <Button variant="outline" size="sm" icon={<Pencil size={13} />} onClick={() => setShowWrite(true)} className="mb-5">
          Write a Review
        </Button>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map(i => <div key={i} className="animate-pulse h-[90px] rounded-xl bg-bone" />)}
        </div>
      ) : error ? (
        <p className="text-[13px] text-error">{error}</p>
      ) : !hasReviews ? (
        <div className="text-center py-8">
          <Star size={28} className="text-bone mx-auto mb-2" />
          <p className="text-[13px] text-slate">No reviews yet. Be the first to buy and review!</p>
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-[13px] text-slate py-4">No {ratingFilter}-star reviews.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {reviews.map(r => {
            const av = avatarStyle(r.customerName);
            const initials = r.isOwn ? 'Y' : r.customerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div key={r.reviewId} className={`rounded-xl p-4 ${r.isOwn ? 'bg-brand-pale-orange/40 border border-brand-orange/30' : 'border border-bone'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0" style={{ background: av.bg, color: av.color }}>
                      {initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-bold text-carbon">{r.customerName}</span>
                        {r.isVerifiedPurchase && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-success bg-success-bg px-[7px] py-[2px] rounded-full">
                            <ShieldCheck size={10} /> Verified Purchase
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-[3px]">
                        {r.rating != null && <StarRating value={r.rating} size={12} />}
                        <span className="text-[11px] text-slate">{timeAgo(r.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {r.isOwn && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setEditingReview(r)} title="Edit your review" className="w-7 h-7 flex items-center justify-center rounded-lg border border-bone bg-white text-slate cursor-pointer">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => handleDelete(r)} title="Delete your review" className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#F5C6C2] bg-error-bg text-error cursor-pointer">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {r.comments.length > 0 && (
                  <div className="mt-3">
                    {r.comments.map((c, i) => (
                      <p key={i} className="text-[13px] text-graphite leading-[1.6] mb-1">{c.text}</p>
                    ))}
                  </div>
                )}

                {r.media.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {r.media.map((url, i) => (
                      <img loading="lazy" decoding="async" key={i} src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-bone" />
                    ))}
                  </div>
                )}

                {r.sellerReply && (
                  <div className="bg-white border border-bone rounded-lg px-3 py-[10px] mt-3">
                    <p className="text-[11px] font-semibold text-brand-orange mb-1">Reply from the seller</p>
                    <p className="text-[12px] text-graphite leading-[1.5]">{r.sellerReply.text}</p>
                  </div>
                )}
              </div>
            );
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 rounded-lg border border-bone text-[11px] cursor-pointer disabled:opacity-30"
              >
                Prev
              </button>
              <span className="text-[11px] text-slate">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded-lg border border-bone text-[11px] cursor-pointer disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {showWrite && (
        <ReviewFormModal
          mode="create"
          productId={productId}
          onClose={() => setShowWrite(false)}
          onSaved={() => { setShowWrite(false); setPage(1); setRatingFilter(null); setRefreshKey(k => k + 1); }}
        />
      )}

      {editingReview && (
        <ReviewFormModal
          mode="edit"
          reviewId={editingReview.reviewId}
          initialRating={editingReview.rating ?? 0}
          initialComment={editingReview.comments[0]?.text ?? ''}
          initialMedia={editingReview.media}
          onClose={() => setEditingReview(null)}
          onSaved={() => { setEditingReview(null); setRefreshKey(k => k + 1); }}
        />
      )}
    </div>
  );
}
