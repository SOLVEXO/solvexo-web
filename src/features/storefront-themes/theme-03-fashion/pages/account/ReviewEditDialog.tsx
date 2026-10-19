import { useRef, useState } from 'react';
import { ts } from '@/utils/tStatic';
import { ImagePlus, Star, X } from 'lucide-react';
import { apiUploadPublicFile } from '@/api/upload';
import { apiEditReview, type MyReviewEntry } from '@/api/services/rating';
import { reviewText } from '../../../accountUi';
import { fashionTheme as t } from '../../theme.config';
import { Dialog } from '../../ui/Dialog';
import { Field, TextArea, PillButton, Notice } from '../../ui/primitives';


/** Edit rating, comment and attached photos (photos can be removed or added, up to 4) of the buyer's own review. */
export function ReviewEditDialog({ review, onClose, onSaved }: { review: MyReviewEntry; onClose: () => void; onSaved: () => void }) {
  const [rating, setRating] = useState(review.rating ?? 0);
  const [comment, setComment] = useState(reviewText(review));
  const [media, setMedia] = useState<string[]>(review.media ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function addPhotos(files: FileList | null) {
    const picked = Array.from(files ?? []).filter(f => f.type.startsWith('image/')).slice(0, Math.max(0, 4 - media.length));
    if (fileRef.current) fileRef.current.value = '';
    if (picked.length === 0) return;
    setUploading(true); setError('');
    try {
      const urls = await Promise.all(picked.map(f => apiUploadPublicFile(f).then(r => r.data.url)));
      setMedia(m => [...m, ...urls].slice(0, 4));
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not upload the photo.'); }
    finally { setUploading(false); }
  }

  async function submit() {
    if (rating < 1) { setError('Please select a star rating.'); return; }
    setSaving(true); setError('');
    try { await apiEditReview(review.reviewId, { rating, comment, media }); onSaved(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not update your review.'); setSaving(false); }
  }

  return (
    <Dialog title={ts('pg.edit_review', 'Edit review')} onClose={onClose}
      footer={<><PillButton variant="outline" className="flex-1" onClick={onClose}>{ts('common.cancel', 'Cancel')}</PillButton><PillButton className="flex-1" loading={saving} disabled={uploading} onClick={submit}>{ts('pg.save_review', 'Save review')}</PillButton></>}>
      <div className="flex flex-col gap-5">
        {review.product && <p className="m-0 text-[15px] font-semibold">{review.product.name}</p>}
        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-2 text-sm font-medium">{ts('pg.rating', 'Rating')}</legend>
          <div className="flex gap-1" role="radiogroup" aria-label={ts('pg.rating', 'Rating')}>
            {[1, 2, 3, 4, 5].map(i => (
              <button key={i} type="button" role="radio" aria-checked={rating === i} aria-label={`${i} star${i > 1 ? 's' : ''}`} onClick={() => { setRating(i); setError(''); }} className="cursor-pointer border-0 bg-transparent p-1">
                <Star size={28} aria-hidden style={{ color: t.colors.ink, fill: i <= rating ? t.colors.ink : 'transparent' }} />
              </button>
            ))}
          </div>
        </fieldset>
        <Field label={ts('pg.your_review', 'Your review')}>{p => <TextArea {...p} value={comment} onChange={e => setComment(e.target.value)} maxLength={2000} />}</Field>
        <div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={e => addPhotos(e.target.files)} aria-label={ts('pg.add_photos', 'Add photos')} />
          {media.length < 4 && (
            <PillButton variant="outline" loading={uploading} onClick={() => fileRef.current?.click()}><ImagePlus size={16} aria-hidden /> Add photos</PillButton>
          )}
        </div>
        {media.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {media.map(url => (
              <div key={url} className="relative">
                <img src={url} alt={ts('pg.attached_to_your_review', 'Attached to your review')} className="size-16 object-cover" style={{ borderRadius: 12 }} />
                <button type="button" onClick={() => setMedia(m => m.filter(x => x !== url))} aria-label={ts('pg.remove_photo', 'Remove photo')} className="absolute -right-2 -top-2 grid size-6 cursor-pointer place-items-center rounded-full border-0" style={{ background: t.colors.ink, color: t.colors.bg }}><X size={12} aria-hidden /></button>
              </div>
            ))}
          </div>
        )}
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    </Dialog>
  );
}
