import { useState } from 'react';
import { ts } from '@/utils/tStatic';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useRequireRealAccount } from '@/hooks/auth/useRequireRealAccount';
import { apiDeleteReview, type MyReviewEntry } from '@/api/services/rating';
import { REVIEW_STATUS_LABEL, formatAccountDate, reviewText } from '../../accountUi';
import { useMyReviews } from '../../useAccountLists';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { fashionTheme as t } from '../theme.config';
import { Card, EmptyState, ErrorState, Notice, PillButton, SkeletonBlock, StatusPill } from '../ui/primitives';
import { AccountLayout } from '../ui/AccountLayout';
import { ConfirmDialog } from '../ui/Dialog';
import { ReviewEditDialog } from './account/ReviewEditDialog';
import { PendingReviews } from './account/PendingReviews';
import { useConfirmAction } from '../../core/account/useConfirmAction';

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(i => <Star key={i} size={15} aria-hidden style={{ color: t.colors.ink, fill: i <= value ? t.colors.ink : 'transparent' }} />)}
    </span>
  );
}

/** `/reviews`: the buyer's own product reviews (paged) with edit and delete. */
export function FashionMyReviewsPage() {
  const guest = useRequireRealAccount();
  useStorefrontSeo({ title: 'My reviews', noindex: true });
  const { reviews, totalPages, page, setPage, loading, error, reload } = useMyReviews();
  const [editing, setEditing] = useState<MyReviewEntry | null>(null);
  const del = useConfirmAction<MyReviewEntry>(r => apiDeleteReview(r.reviewId).then(() => undefined), reload);

  if (guest) return null;
  const link = 'cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold underline';

  return (
    <AccountLayout title="My" accent={ts('pg.word_reviews', 'reviews')} subtitle="What you have said about the products you bought.">
      <PendingReviews onReviewed={reload} />
      {loading && !reviews ? <div aria-busy="true"><SkeletonBlock h={130} rows={3} /></div>
        : error && !reviews ? <ErrorState message={error} onRetry={reload} />
        : !reviews || reviews.length === 0 ? <EmptyState icon={<Star size={22} aria-hidden />} title={ts('pg.no_reviews_yet', 'No reviews yet')} text={ts('pg.review_a_product_from_one_of_your_orders', 'Review a product from one of your orders.')} action={<Link to="/orders" className="fx-pill" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: t.buttonRadiusPx }}>{ts('pg.view_your_orders', 'View your orders')}</Link>} />
        : (
          <>
            {error && <div className="mb-4"><Notice tone="error" action={<button type="button" onClick={reload} className={link}>{ts('cart.retry', 'Retry')}</button>}>{error}</Notice></div>}
            <div className="flex flex-col gap-4" style={{ opacity: loading ? 0.6 : 1 }}>
              {reviews.map(r => (
                <Card key={r.reviewId}>
                  <div className="flex gap-4">
                    {r.product?.image && <img src={r.product.image} alt="" className="size-16 shrink-0 object-cover" style={{ borderRadius: 12 }} />}
                    <div className="min-w-0 flex-1">
                      <p className="m-0 text-base font-semibold">{r.product?.name ?? 'Product no longer available'}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <Stars value={r.rating ?? 0} />
                        <span className="text-[13px]" style={{ color: t.colors.inkMuted }}>{formatAccountDate(r.createdAt)}</span>
                        <StatusPill tone={r.status === 'rejected' ? 'bad' : r.status === 'published' ? 'good' : 'warn'}>{REVIEW_STATUS_LABEL[r.status] ?? r.status}</StatusPill>
                      </div>
                    </div>
                  </div>
                  {reviewText(r) && <p className="m-0 mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">{reviewText(r)}</p>}
                  {r.media?.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{r.media.map(u => <img key={u} src={u} alt={ts('pg.attached_to_your_review', 'Attached to your review')} className="size-16 object-cover" style={{ borderRadius: 12 }} />)}</div>}
                  {r.sellerReply && (
                    <div className="mt-3 rounded-xl px-4 py-3" style={{ background: t.colors.bgAlt }}>
                      <p className="m-0 text-xs font-semibold" style={{ color: t.colors.inkMuted }}>{ts('reviews.reply', 'Reply from the store')}</p>
                      <p className="m-0 mt-1 whitespace-pre-wrap text-sm">{r.sellerReply.text}</p>
                    </div>
                  )}
                  <div className="mt-4 flex gap-5">
                    <button type="button" onClick={() => setEditing(r)} className={link} style={{ color: t.colors.ink }}>{ts('addresses.edit', 'Edit')}</button>
                    <button type="button" onClick={() => del.open(r)} className={link} style={{ color: t.colors.ink }}>{ts('addresses.delete', 'Delete')}</button>
                  </div>
                </Card>
              ))}
            </div>
            {totalPages > 1 && (
              <nav aria-label={ts('pg.reviews_pages', 'Reviews pages')} className="mt-6 flex items-center justify-between gap-3 text-sm" style={{ color: t.colors.inkMuted }}>
                <PillButton variant="outline" disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)}>{ts('orders.previous', 'Previous')}</PillButton>
                <span>Page {page} of {totalPages}</span>
                <PillButton variant="outline" disabled={page >= totalPages || loading} onClick={() => setPage(p => p + 1)}>{ts('orders.next', 'Next')}</PillButton>
              </nav>
            )}
          </>
        )}
      {editing && <ReviewEditDialog key={editing.reviewId} review={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      {del.target && <ConfirmDialog title={ts('reviews.deleteTitle', 'Delete review')} confirmLabel="Delete" busy={del.busy} error={del.error} onClose={del.close} onConfirm={() => void del.confirm()} message={ts('pg.are_you_sure_you_want_to_delete_this_rev', 'Are you sure you want to delete this review? This cannot be undone.')} />}
    </AccountLayout>
  );
}
