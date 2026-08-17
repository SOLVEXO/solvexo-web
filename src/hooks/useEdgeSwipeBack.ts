import { useRef } from 'react';

/**
 * Native-app-style edge-swipe-to-go-back: only registers a gesture that
 * starts within 24px of the left edge and travels right far enough — avoids
 * hijacking normal horizontal/vertical scrolling anywhere else on the page.
 * Spread the returned handlers onto the same element that owns the page's
 * touch surface (e.g. its outermost wrapper).
 */
export function useEdgeSwipeBack(onBack: (() => void) | undefined) {
  const touchStartX = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX < 24 ? e.touches[0].clientX : null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 60) onBack?.();
    touchStartX.current = null;
  };

  return { onTouchStart, onTouchEnd };
}
