import { useEffect, useState } from 'react';
import { Loader2, Check, Quote, Star } from 'lucide-react';
import { clsx } from 'clsx';
import { StarRating } from '@/components/comman/ui';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import {
  apiGetMyTestimonialSubmission, apiSubmitTestimonial, type MyTestimonialSubmission,
} from '@/api/services/testimonials';

/** Bigger, tactile star row for the premium (dashboard-popup) variant —
 *  `StarRating` itself has no per-star press/scale hook, so this is a
 *  separate small primitive rather than fighting that component's API. */
function PremiumStarRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(i)}
          aria-label={`${i} star${i > 1 ? 's' : ''}`}
          className="bg-transparent border-none p-0 cursor-pointer transition-transform duration-150 ease-out hover:scale-110 active:scale-95"
        >
          <Star
            size={30}
            className={clsx(
              'transition-colors duration-150',
              i <= display ? 'text-brand-orange fill-brand-orange drop-shadow-[0_0_6px_rgba(217,119,87,0.35)]' : 'text-bone fill-bone',
            )}
          />
        </button>
      ))}
    </div>
  );
}

/**
 * The reusable guts of "share a testimonial about Solvexo" — star rating +
 * quote textarea + submit, or (once a submission exists) an explicit
 * "Submitted!" status view. No card/modal chrome of its own, so the same
 * logic drives both `SellerSettings.tsx`'s dedicated "Share Story" tab
 * (`variant="plain"`, the default) and `TestimonialPromptModal`'s one-time
 * dashboard popup (`variant="premium"`) — never two separate implementations
 * of the same submit flow, just two visual treatments of one state machine.
 *
 * `onSubmitted` fires once, right after a successful submit (not on the
 * initial "already submitted" load) — the popup uses it to auto-close.
 */
export function TestimonialShareForm({ variant = 'plain', onSubmitted }: { variant?: 'plain' | 'premium'; onSubmitted?: () => void }) {
  const [submission, setSubmission] = useState<MyTestimonialSubmission | null | undefined>(undefined);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  // Only used by the premium variant's live preview card — a real name, not
  // fabricated (already-cached shared resource, so this costs no extra
  // request when SellerSettings/StoreDashboard have it loaded too).
  const { profile } = useGetProfile();

  useEffect(() => {
    let cancelled = false;
    apiGetMyTestimonialSubmission()
      .then(res => { if (!cancelled) setSubmission(res.data); })
      .catch(() => { if (!cancelled) setSubmission(null); });
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit() {
    if (!rating || !text.trim()) { setError('Please add a rating and a short story.'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await apiSubmitTestimonial({ rating, text: text.trim() });
      setSubmission(res.data);
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit your story.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submission === undefined) return null;
  // A prior rejected submission is treated the same as "none yet" — the
  // seller can submit again rather than being permanently locked out.
  const hasSubmission = !!submission && submission.status !== 'rejected';
  const premium = variant === 'premium';

  if (hasSubmission) {
    return (
      <div
        className={clsx(
          'flex items-start gap-3',
          premium && 'p-4 rounded-[14px] border border-[#f0dcc8] bg-gradient-to-br from-brand-pale-orange/40 to-white',
        )}
      >
        <div
          className={clsx(
            'rounded-full flex items-center justify-center shrink-0 mt-[1px]',
            premium ? 'w-10 h-10 bg-gradient-to-br from-brand-orange to-brand-deep-orange shadow-[0_4px_14px_rgba(217,119,87,0.35)]' : 'w-8 h-8 bg-success-bg',
          )}
        >
          <Check size={premium ? 18 : 16} className={premium ? 'text-white' : 'text-success'} />
        </div>
        <div className="min-w-0">
          <p className={clsx('font-bold text-charcoal', premium ? 'text-[14.5px]' : 'text-[13.5px]')}>
            Submitted! {submission!.status === 'approved' ? "It's live on our homepage." : "It's pending review."}
          </p>
          <StarRating value={submission!.rating} size={13} className="mt-[6px] mb-2" />
          <p className="text-[13px] text-charcoal italic leading-[1.6]">"{submission!.text}"</p>
          <span
            className="inline-flex items-center mt-3 px-[10px] py-[3px] rounded-full text-[11px] font-semibold"
            style={submission!.status === 'approved' ? { background: '#E3F4EA', color: '#1E7A3C' } : { background: '#FDF3E7', color: '#9A6A17' }}
          >
            {submission!.status === 'approved' ? 'Published' : 'Pending Review'}
          </span>
        </div>
      </div>
    );
  }

  if (!premium) {
    return (
      <div>
        <label className="text-[12px] font-medium text-slate mb-2 block">Your rating</label>
        <StarRating value={rating} onChange={setRating} size={22} className="mb-4" />
        <label className="text-[12px] font-medium text-slate mb-[5px] block">Your story</label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
          placeholder="What has Solvexo helped you do?"
          className="w-full px-3 py-[10px] text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 transition-colors resize-none"
        />
        {error && <p className="text-[11.5px] text-error mt-2">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`mt-4 px-6 py-[10px] bg-brand-orange border-none rounded-lg text-[13px] font-semibold text-white flex items-center gap-2 ${submitting ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
        >
          {submitting && <Loader2 size={13} className="animate-spin" />}
          {submitting ? 'Submitting…' : 'Submit Your Story'}
        </button>
      </div>
    );
  }

  // ── Premium variant ── tactile stars + a live preview of the real
  // Homepage testimonial card, so the seller sees exactly what they're
  // contributing before submitting — same brand tokens throughout
  // (brand-orange/cream/carbon), no new palette introduced.
  return (
    <div>
      <p className="text-[12px] font-semibold text-slate uppercase tracking-[0.06em] mb-2">How would you rate Solvexo?</p>
      <PremiumStarRow value={rating} onChange={setRating} />

      <p className="text-[12px] font-semibold text-slate uppercase tracking-[0.06em] mt-5 mb-2">Your story</p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={3}
        placeholder="What has Solvexo helped you do?"
        className="w-full px-4 py-3 text-[13.5px] border border-bone rounded-[14px] outline-none text-charcoal bg-cream/60 box-border focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 transition-all resize-none"
      />

      {/* Live preview — same card language (quote glyph, stars, italic
         quote, name) as the real Homepage testimonial cards. */}
      {text.trim().length > 0 && (
        <div className="mt-4 rounded-[14px] border border-bone bg-white p-4 relative overflow-hidden">
          <Quote size={26} className="absolute top-3 right-3 text-brand-orange/15 fill-brand-orange/15" />
          <p className="text-[11px] font-semibold text-brand-orange uppercase tracking-[0.06em] mb-2">Preview</p>
          <StarRating value={rating} size={12} className="mb-2" />
          <p className="text-[12.5px] text-charcoal italic leading-[1.6] line-clamp-3">"{text}"</p>
          {profile?.name && <p className="text-[11.5px] font-semibold text-carbon mt-2">{profile.name}</p>}
        </div>
      )}

      {error && <p className="text-[11.5px] text-error mt-3">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className={clsx(
          'mt-5 w-full px-6 py-[12px] rounded-[12px] border-none text-[13.5px] font-bold text-white flex items-center justify-center gap-2 transition-transform duration-150',
          'bg-gradient-to-r from-brand-orange to-brand-deep-orange shadow-[0_6px_18px_rgba(217,119,87,0.3)]',
          submitting ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]',
        )}
      >
        {submitting && <Loader2 size={14} className="animate-spin" />}
        {submitting ? 'Submitting…' : 'Submit Your Story'}
      </button>
    </div>
  );
}
