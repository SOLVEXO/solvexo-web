import { useEffect, useState } from 'react';
import { Quote, X } from 'lucide-react';
import { clsx } from 'clsx';
import { TestimonialShareForm } from './TestimonialShareForm';

/**
 * One-time dashboard nudge — shown by `useTestimonialPrompt` (see that hook's
 * own doc comment for the trigger/dismiss rules) instead of burying the
 * "share a story" ask inside Settings where most sellers would never find
 * it. Same real Shopify/Linear-style pattern: a gentle one-time popup, plus
 * an always-reachable copy in Settings (SellerSettings.tsx's "Share Your
 * Story" tab) for anyone who dismissed this or wants to do it later.
 *
 * Deliberately NOT a centered modal — no dark backdrop, the dashboard behind
 * it stays fully visible and interactive. A floating corner card (the same
 * pattern Intercom/Drift-style feedback widgets use) reads as a gentle
 * suggestion, not an interruption blocking the page. Slides/fades in on
 * mount; on mobile it docks as a bottom sheet-style bar (above the app's own
 * bottom tab bar) instead of a corner card, since there's no "corner" to
 * float in on a narrow screen.
 */
export function TestimonialPromptCard({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-label="Share Your Solvexo Story"
      className={clsx(
        'fixed z-50 left-3 right-3 bottom-20 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[380px]',
        'rounded-[20px] bg-white shadow-[0_20px_50px_rgba(28,25,23,0.22)] border border-bone overflow-hidden',
        'transition-all duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 sm:translate-y-4',
      )}
    >
      {/* Header band — same warm gradient + soft blur-glow language as the
         Homepage hero/closing sections, not a new palette. */}
      <div className="relative px-5 pt-5 pb-6 bg-gradient-to-br from-brand-orange via-[#e08f68] to-brand-deep-orange overflow-hidden">
        <div className="absolute w-[140px] h-[140px] rounded-full -top-10 -right-6 bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute w-[100px] h-[100px] rounded-full -bottom-8 left-4 bg-carbon/10 blur-2xl pointer-events-none" />
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 border-none flex items-center justify-center cursor-pointer text-white transition-colors"
        >
          <X size={14} />
        </button>
        <Quote size={24} className="relative text-white/70 mb-2" />
        <p className="relative text-[15px] font-bold text-white leading-[1.35] pr-6">Your story could inspire the next seller.</p>
        <p className="relative text-[12px] text-white/75 mt-1">Featured stories get a spot on our homepage — takes less than a minute.</p>
      </div>

      <div className="px-5 py-5 max-h-[60vh] overflow-y-auto">
        <TestimonialShareForm variant="premium" onSubmitted={onSubmitted} />
      </div>

      <div className="px-5 pb-4 -mt-1 flex justify-end">
        <button
          onClick={onClose}
          className="text-[12.5px] font-semibold text-slate hover:text-charcoal bg-transparent border-none cursor-pointer transition-colors"
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
}
