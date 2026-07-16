import { useState } from 'react';
import { StarRating, Button, ImageUpload, Modal } from '@/components/comman/ui';
import { apiAddReview, apiEditReview } from '@/api/services/rating';

interface ReviewFormModalProps {
  mode:            'create' | 'edit';
  productId?:      string;   // required for create
  reviewId?:       string;   // required for edit
  initialRating?:  number;
  initialComment?: string;
  initialMedia?:   string[];
  onClose:         () => void;
  onSaved:         () => void;
}

export function ReviewFormModal({
  mode, productId, reviewId,
  initialRating = 0, initialComment = '', initialMedia = [],
  onClose, onSaved,
}: ReviewFormModalProps) {
  const [rating, setRating]     = useState(initialRating);
  const [comment, setComment]   = useState(initialComment);
  const [media, setMedia]       = useState<string[]>(initialMedia);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  async function submit() {
    if (rating < 1) { setError('Please select a star rating.'); return; }
    setError('');
    setSaving(true);
    try {
      if (mode === 'create' && productId) {
        await apiAddReview({ productId, rating, comment: comment || undefined, media, isAnonymous });
      } else if (mode === 'edit' && reviewId) {
        await apiEditReview(reviewId, { rating, comment, media });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save your review.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={mode === 'create' ? 'Write a Review' : 'Edit Your Review'}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} fullWidth>Cancel</Button>
          <Button onClick={submit} loading={saving} fullWidth>
            {mode === 'create' ? 'Submit Review' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <p className="text-[12px] font-semibold text-charcoal mb-2">How would you rate this product?</p>
      <StarRating value={rating} onChange={setRating} size={30} className="mb-5" />

      <p className="text-[12px] font-semibold text-charcoal mb-2">Your review</p>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="What did you like or dislike? How did you use this product?"
        rows={4}
        className="w-full border border-bone rounded-lg px-3 py-2 text-[13px] text-charcoal outline-none box-border resize-vertical mb-4 focus:border-brand-orange"
      />

      <p className="text-[12px] font-semibold text-charcoal mb-2">Add photos <span className="font-normal text-slate">(optional)</span></p>
      <ImageUpload value={media} onChange={setMedia} maxFiles={4} className="mb-4" />

      {mode === 'create' && (
        <label className="flex items-center gap-2 text-[12px] text-slate mb-4 cursor-pointer">
          <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
          Post this review anonymously
        </label>
      )}

      {error && <p className="text-[12px] text-error mb-1">{error}</p>}
    </Modal>
  );
}
