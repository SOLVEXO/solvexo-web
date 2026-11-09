/** Direction helpers for carousels: "next" follows reading direction, not the physical side. */

/** True when the document is laid out right-to-left (set by `applyDocumentDirection`). */
export function isDocumentRtl(): boolean {
  return typeof document !== 'undefined' && document.documentElement.getAttribute('dir') === 'rtl';
}

/** Arrow key -> +1 (next) / -1 (previous) / 0 (not a step key). ArrowLeft is "next" in RTL. */
export function keyStep(key: string, rtl: boolean): 1 | -1 | 0 {
  if (key === 'ArrowRight') return rtl ? -1 : 1;
  if (key === 'ArrowLeft') return rtl ? 1 : -1;
  return 0;
}

/** Horizontal swipe distance (end - start, px) -> step. Swiping toward the inline-start side shows the next slide. */
export function swipeStep(dx: number, rtl: boolean, threshold = 50): 1 | -1 | 0 {
  if (Math.abs(dx) <= threshold) return 0;
  const towardStart = rtl ? dx > 0 : dx < 0;
  return towardStart ? 1 : -1;
}

/** Sign for a translateX that moves the track to slide `index` (negative in LTR, positive in RTL). */
export function trackOffsetPct(index: number, rtl: boolean): number {
  return (rtl ? 1 : -1) * index * 100;
}
