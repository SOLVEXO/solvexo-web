import { useState, useCallback, useEffect, type RefObject } from 'react';

interface DropdownPos {
  top: number;
  left?: number;
  /** Horizontal offset (from the panel's own left edge) for the small
   *  connector-arrow every caller renders pointing back at its trigger.
   *  Needed because the panel's `left` above is clamped to stay on-screen
   *  and can end up well away from the trigger on a narrow phone — a
   *  hardcoded `right-[14px]`-from-the-panel arrow would then point at
   *  nothing. This keeps the arrow under the trigger's own center
   *  regardless of where the panel itself had to move to. */
  arrowLeft: number;
}

const ARROW_SIZE = 12; // the rotated `w-3 h-3` diamond every caller renders

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
  // Approximate rendered panel width — used only to keep a right-aligned
  // panel's LEFT edge from going past the screen edge on a narrow phone.
  // A rough constant is fine here (every caller's panel is ~320px on
  // mobile — wider `md:` variants only apply at widths with room to
  // spare anyway): the real bug this fixes is triggers that sit well
  // left of the true viewport edge (other icons/padding after them),
  // where right-aligning to the trigger alone pushed the panel's left
  // edge into negative territory, off-screen.
  panelWidth = 320,
) {
  const [pos, setPos] = useState<DropdownPos>({ top: 0, arrowLeft: 14 });

  const calc = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const margin = 12;
    const naturalLeft = align === 'right' ? rect.right - panelWidth : rect.left;
    const left = Math.max(margin, naturalLeft);
    const triggerCenter = rect.left + rect.width / 2;
    const arrowLeft = Math.min(
      Math.max(triggerCenter - left - ARROW_SIZE / 2, 14),
      panelWidth - 14 - ARROW_SIZE,
    );
    setPos({ top: rect.bottom + gap, left, arrowLeft });
  }, [triggerRef, align, gap, panelWidth]);

  useEffect(() => {
    if (!open) return;
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [open, calc]);

  return pos;
}
