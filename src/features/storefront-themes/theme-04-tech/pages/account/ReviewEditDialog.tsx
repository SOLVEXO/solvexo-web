import { useState } from 'react';
import { ts } from '@/utils/tStatic';
import { ImagePlus, Mic, Star, Video } from 'lucide-react';
import { apiAddReview, apiEditReview, type MyReviewEntry } from '@/api/services/rating';
import { reviewText } from '../../../accountUi';
import { techTheme as t } from '../../theme.config';
import { Dialog } from '../../ui/techDialog';
import { Field, TextArea, PillButton, Notice } from '../../ui/techForm';
import { ReviewMediaTiles } from '../../../core/reviews/ReviewMediaTiles';
import { useReviewMedia } from '../../../core/reviews/useReviewMedia';


/** What a NEW review is about (the order line or product page it was started from). */
export interface ReviewTarget { productId: string; productName: string; variantId?: string; orderId?: string }

/** Write a review (`target`) or edit the buyer's own (`review`): rating, comment, photos, one audio note and one video. */
export function ReviewEditDialog({ review, target, onClose, onSaved }: { review?: MyReviewEntry; target?: ReviewTarget; onClose: () => void; onSaved: () => void }) {
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [comment, setComment] = useState(review ? reviewText(review) : '');
  const { media, uploading, error, setError, counts, inputRef, openPicker, addFiles, remove, limits } = useReviewMedia(review?.media);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (rating < 1) { setError(ts('reviews.err.rating', 'Please select a star rating.')); return; }
    setSaving(true); setError('');
    try {
      if (review) await apiEditReview(review.reviewId, { rating, comment, media });
      else if (target) await apiAddReview({ productId: target.productId, productVariantId: target.variantId, orderId: target.orderId, rating, comment: comment.trim() || undefined, media });
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : ts('reviews.err.save', 'Could not save your review.')); setSaving(false); }
  }

  return (
    <Dialog title={review ? ts('pg.edit_review', 'Edit review') : ts('pg.write_a_review', 'Write a review')} onClose={onClose}
      footer={<><PillButton variant="outline" className="flex-1" onClick={onClose}>{ts('common.cancel', 'Cancel')}</PillButton><PillButton className="flex-1" loading={saving} disabled={uploading} onClick={submit}>{ts('pg.save_review', 'Save review')}</PillButton></>}>
      <div className="flex flex-col gap-5">
        {(review?.product?.name ?? target?.productName) && <p className="m-0 text-[15px] font-semibold">{review?.product?.name ?? target?.productName}</p>}
        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-2 text-sm font-medium">{ts('pg.rating', 'Rating')}</legend>
          <div className="flex gap-1" role="radiogroup" aria-label={ts('pg.rating', 'Rating')}>
            {[1, 2, 3, 4, 5].map(i => (
              <button key={i} type="button" role="radio" aria-checked={rating === i} aria-label={ts('reviews.starsAria', '{{count}} stars', { count: i })} onClick={() => { setRating(i); setError(''); }} className="cursor-pointer border-0 bg-transparent p-1">
                <Star size={28} aria-hidden style={{ color: t.colors.ink, fill: i <= rating ? t.colors.ink : 'transparent' }} />
              </button>
            ))}
          </div>
        </fieldset>
        <Field label={ts('pg.your_review', 'Your review')}>{p => <TextArea {...p} value={comment} onChange={e => setComment(e.target.value)} maxLength={2000} />}</Field>
        <div className="flex flex-col gap-3">
          <input ref={inputRef} type="file" hidden onChange={e => addFiles(e.target.files)} aria-label={ts('pg.add_photos', 'Add photos')} />
          <div className="flex flex-wrap gap-2">
            <PillButton variant="outline" loading={uploading} disabled={counts.image >= limits.images} onClick={() => openPicker('image')}>
              <ImagePlus size={16} aria-hidden /> {ts('pg.add_photos', 'Add photos')} ({counts.image}/{limits.images})
            </PillButton>
            <PillButton variant="outline" loading={uploading} disabled={counts.audio >= limits.audio} onClick={() => openPicker('audio')}>
              <Mic size={16} aria-hidden /> {ts('pg.add_audio', 'Add audio')} ({counts.audio}/{limits.audio})
            </PillButton>
            <PillButton variant="outline" loading={uploading} disabled={counts.video >= limits.video} onClick={() => openPicker('video')}>
              <Video size={16} aria-hidden /> {ts('pg.add_video', 'Add video')} ({counts.video}/{limits.video})
            </PillButton>
          </div>
          <p className="m-0 text-xs" style={{ color: t.colors.inkMuted }}>{ts('pg.media_limits', 'Photos up to 4 · one audio note (25 MB) · one video (50 MB)')}</p>
          <ReviewMediaTiles media={media} tokens={{ ink: t.colors.ink, muted: t.colors.inkMuted, bg: t.colors.bg, radius: 12 }} onRemove={remove} />
        </div>
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    </Dialog>
  );
}