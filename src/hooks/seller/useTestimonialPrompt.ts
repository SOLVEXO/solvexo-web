import { useEffect, useState } from 'react';
import { apiGetMyTestimonialSubmission } from '@/api/services/testimonials';

// Per-browser, not per-seller-account — same simplification `RememberedAccount`
// and other one-time dismissal flags in this codebase already make (see
// AnnouncementBanner's per-announcement-id localStorage dismissal).
const DISMISS_KEY = 'solvexo:testimonialPromptDismissed';

/**
 * Drives the one-time "Share Your Story" dashboard popup — real
 * Shopify/Linear-style pattern, not a nag shown on every login:
 * - Never shows if this browser already dismissed it, or the seller already
 *   has a submission (pending/approved/rejected — any status counts, since
 *   the seller can still resubmit from Settings if it was rejected).
 * - Shows once, after a short delay so it never blocks the dashboard's own
 *   first paint.
 * - `dismiss()` (either "Maybe Later" or a successful submit) permanently
 *   suppresses it for this browser.
 */
export function useTestimonialPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let dismissedAlready = false;
    try { dismissedAlready = window.localStorage.getItem(DISMISS_KEY) === '1'; } catch { /* ignore */ }
    if (dismissedAlready) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    apiGetMyTestimonialSubmission()
      .then(res => {
        if (cancelled || res.data) return; // already has a submission — never prompt
        timer = setTimeout(() => { if (!cancelled) setShow(true); }, 1500);
      })
      .catch(() => { /* non-critical — just don't prompt */ });

    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, []);

  function dismiss() {
    try { window.localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    setShow(false);
  }

  return { show, dismiss };
}
