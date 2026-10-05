import { useRequireRealAccount } from '@/hooks/auth/useRequireRealAccount';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, AlertCircle } from 'lucide-react';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { apiDeleteReview, type MyReviewEntry } from '@/api/services/rating';
import { ReviewFormModal } from '@/features/buyer/components/ReviewFormModal';
import { REVIEW_STATUS_LABEL, formatAccountDate, reviewText } from '../../accountUi';
import { useMyReviews } from '../../useAccountLists';
import { ConfirmModal } from '../../AccountModals';
import { atelierTheme as t } from '../theme.config';

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={13} style={{ color: t.colors.accent, fill: i <= value ? t.colors.accent : 'transparent' }} />
      ))}
    </span>
  );
}

/** Theme 01's "My reviews" page: the buyer's own product reviews with edit/delete. */
export function AtelierMyReviewsPage() {
  useRequireRealAccount();
  useStorefrontSeo({ title: 'My reviews', noindex: true });
  const { reviews, totalPages, page, setPage, loading, error, reload } = useMyReviews();
  const [editing, setEditing] = useState<MyReviewEntry | null>(null);
  const [deleting, setDeleting] = useState<MyReviewEntry | null>(null);

  const btn = { color: t.colors.ink, border: `1px solid ${t.colors.border}`, padding: '7px 14px', fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 600 } as const;
  const linkBtn = { color: t.colors.ink, border: 'none', fontFamily: t.fonts.body, fontSize: '12px' } as const;

  return (
    <main className="mx-auto" style={{ maxWidth: '720px', padding: `48px ${t.layout.containerPadX}` }}>
      <h1 style={{ fontFamily: t.fonts.display, fontSize: '24px', fontWeight: 600, color: t.colors.ink, marginBottom: '28px' }}>Reviews</h1>

      {loading && !reviews ? (
        <div className="flex flex-col gap-2.5" aria-busy="true">
          {[1, 2, 3].map(i => <div key={i} className="animate-pulse" style={{ height: '110px', background: t.colors.bgAlt }} />)}
        </div>
      ) : error && !reviews ? (
        <div role="alert" className="flex flex-col items-center text-center" style={{ padding: '56px 0', border: `1px solid ${t.colors.border}` }}>
          <AlertCircle size={26} style={{ color: t.colors.danger, marginBottom: '12px' }} />
          <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.ink }}>{error}</p>
          <button type="button" onClick={reload} className="cursor-pointer bg-transparent" style={{ ...btn, marginTop: '14px' }}>Try again</button>
        </div>
      ) : !reviews || reviews.length === 0 ? (
        <div className="flex flex-col items-center text-center" style={{ padding: '56px 0', border: `1px solid ${t.colors.border}` }}>
          <Star size={26} style={{ color: t.colors.inkMuted, marginBottom: '12px' }} />
          <p style={{ fontFamily: t.fonts.display, fontSize: '15px', fontWeight: 600, color: t.colors.ink }}>You haven't written any reviews yet</p>
          <Link to="/orders" className="underline" style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.ink, marginTop: '8px' }}>
            View your orders to review a product
          </Link>
        </div>
      ) : (
        <>
          {error && (
            <div role="alert" className="flex items-center gap-2" style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.danger, marginBottom: '12px' }}>
              <AlertCircle size={13} /> {error}
              <button type="button" onClick={reload} className="cursor-pointer bg-transparent underline" style={linkBtn}>Retry</button>
            </div>
          )}
          <div className="flex flex-col gap-3" style={{ opacity: loading ? 0.6 : 1 }}>
            {reviews.map(r => (
              <div key={r.reviewId} style={{ border: `1px solid ${t.colors.border}`, padding: '16px 18px' }}>
                <div className="flex gap-3">
                  {r.product?.image && <img src={r.product.image} alt="" className="shrink-0 object-cover" style={{ width: '56px', height: '56px' }} />}
                  <div className="min-w-0 flex-1">
                    <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', fontWeight: 600, color: t.colors.ink }}>{r.product?.name ?? 'Product no longer available'}</p>
                    <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: '4px' }}>
                      <Stars value={r.rating ?? 0} />
                      <span style={{ fontFamily: t.fonts.body, fontSize: '11.5px', color: t.colors.inkMuted }}>{formatAccountDate(r.createdAt)}</span>
                      <span style={{ fontFamily: t.fonts.body, fontSize: '10.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: r.status === 'rejected' ? t.colors.danger : t.colors.inkMuted, border: `1px solid ${t.colors.border}`, padding: '1px 7px' }}>
                        {REVIEW_STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </div>
                  </div>
                </div>
                {reviewText(r) && <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.ink, marginTop: '10px', whiteSpace: 'pre-wrap' }}>{reviewText(r)}</p>}
                {r.sellerReply && (
                  <div style={{ background: t.colors.bgAlt, padding: '10px 12px', marginTop: '10px' }}>
                    <p style={{ fontFamily: t.fonts.body, fontSize: '11px', fontWeight: 600, color: t.colors.inkMuted, marginBottom: '2px' }}>Reply from the store</p>
                    <p style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.ink, whiteSpace: 'pre-wrap' }}>{r.sellerReply.text}</p>
                  </div>
                )}
                <div className="flex items-center gap-4" style={{ marginTop: '12px' }}>
                  <button type="button" onClick={() => setEditing(r)} className="cursor-pointer bg-transparent underline" style={linkBtn}>Edit</button>
                  <button type="button" onClick={() => setDeleting(r)} className="cursor-pointer bg-transparent underline" style={linkBtn}>Delete</button>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between" style={{ marginTop: '16px', fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted }}>
              <button type="button" disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)} className="cursor-pointer bg-transparent disabled:opacity-40 disabled:cursor-not-allowed" style={btn}>Previous</button>
              <span>Page {page} of {totalPages}</span>
              <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage(p => p + 1)} className="cursor-pointer bg-transparent disabled:opacity-40 disabled:cursor-not-allowed" style={btn}>Next</button>
            </div>
          )}
        </>
      )}

      {editing && (
        <ReviewFormModal
          mode="edit"
          reviewId={editing.reviewId}
          initialRating={editing.rating ?? 0}
          initialComment={reviewText(editing)}
          initialMedia={editing.media}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
        />
      )}
      {deleting && (
        <ConfirmModal
          title="Delete review"
          message="Are you sure you want to delete this review? This can't be undone."
          confirmLabel="Delete"
          onClose={() => setDeleting(null)}
          onConfirm={async () => { await apiDeleteReview(deleting.reviewId); setDeleting(null); reload(); }}
        />
      )}
    </main>
  );
}
