import { useState, useCallback, useEffect, type RefObject } from 'react';

interface DropdownPos {
  top: number;
  left?: number;
  right?: number;
}

// Viewport-fixed position anchored to a trigger element — for dropdown/preview
// panels that render via a `document.body` portal (see ActionMenu, MiniCart,
// MiniWishlist, NotificationBell) so they never get clipped by an ancestor
// with `overflow: hidden/auto/scroll` (e.g. BuyerNavbar's horizontally-
// scrollable actions row). Recomputed on resize; not on scroll — every
// caller today sits in a `sticky top-0` navbar, so its on-screen position
// doesn't change while scrolling, and a scroll listener would risk firing
// for the panel's own internal scrollable content (cart/notification lists).
export function useDropdownPosition(
  triggerRef: RefObject<HTMLElement | null>,
  open: boolean,
  align: 'left' | 'right' = 'right',
  gap = 10,
) {
  const [pos, setPos] = useState<DropdownPos>({ top: 0 });

  const calc = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({
      top: rect.bottom + gap,
      ...(align === 'right' ? { right: window.innerWidth - rect.right } : { left: rect.left }),
    });
  }, [triggerRef, align, gap]);

  useEffect(() => {
    if (!open) return;
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [open, calc]);

  return pos;
}
