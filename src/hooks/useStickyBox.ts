import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { scrollRootRef } from '@/utils/scrollRoot';

interface StickyBoxResult {
  /** Ref for the placeholder box — always stays in normal flow (an explicit
   *  `height` is set on it while stuck, so removing the content from flow
   *  doesn't collapse the row around it). */
  wrapperRef: RefObject<HTMLDivElement | null>;
  /** Ref for the actual visible content — gets a `position: fixed` inline
   *  style while stuck, `undefined` otherwise. Spread onto the content box. */
  contentRef: RefObject<HTMLDivElement | null>;
  contentStyle: CSSProperties | undefined;
  wrapperStyle: CSSProperties | undefined;
}

/** A "sticky sidebar" driven by a scroll listener rather than CSS
 *  `position: sticky`. This app's real scroll container is RootLayout's
 *  `position: fixed; overflow-y: auto` wrapper (see `utils/scrollRoot.ts`),
 *  not `window` — the same reason `BuyerNavbar`'s own scroll-direction
 *  detection (`useCompactOnScroll`) already reads `scrollRootRef` directly
 *  instead of relying on `window`/CSS. `position: sticky` does not reliably
 *  engage against that custom scroll root, so this measures the box's
 *  natural (unstuck) position on every scroll tick and manually pins it via
 *  `position: fixed` for exactly the range a native sticky element would
 *  occupy: stuck at `topOffset` while there's a taller sibling to scroll
 *  through in `boundingSelector`'s row, released once that row's bottom
 *  edge is reached (pinned to the row's bottom edge in between, mirroring
 *  how native sticky releases at its containing block's edge, then scrolls
 *  away with the rest of the page beyond that). */
// `recomputeDeps` — pass in whatever above-the-fold loading flags/lengths
// (banners, categories, flash deals, ...) can change this box's row's
// natural position on the page *after* mount, from async data arriving.
// Without this, a `recompute()` that happens to run before that content has
// loaded in (page still short) can decide the sidebar "would stick" against
// the still-collapsed layout, then never re-evaluate — since the only other
// triggers are `scroll`/`resize` — leaving it wrongly pinned/overlapping
// content once the real (taller) layout has rendered, until the user
// actually scrolls the page themselves.
export function useStickyBox(topOffset: number, recomputeDeps: readonly unknown[] = []): StickyBoxResult {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [fixedTop, setFixedTop] = useState<number | null>(null);
  const naturalHeight = useRef(0);

  useEffect(() => {
    const scrollEl = scrollRootRef.current;
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!scrollEl || !wrapper || !content) return;

    const recompute = () => {
      const row = wrapper.parentElement;
      if (!row) return;
      naturalHeight.current = content.offsetHeight;

      const wrapperRect = wrapper.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      const height = naturalHeight.current;

      const wouldStick = wrapperRect.top < topOffset;
      const roomBelow = rowRect.bottom >= topOffset + height;
      // Hard release: once the row itself has scrolled entirely past the
      // sticky line, there is nothing left to pin against — full stop,
      // regardless of the two branches below. Without this, once
      // `wouldStick` goes true it can never go false again on its own (the
      // wrapper's natural top only ever decreases as the page scrolls
      // down), so a missed/late recompute right around the release point
      // could leave the box permanently pinned at its last computed
      // position — floating over whatever content is below the row
      // (promo cards, the app-download banner, the footer) for the rest of
      // the page, instead of releasing and scrolling away with it.
      const rowFullyPassed = rowRect.bottom < topOffset;

      if (rowFullyPassed) {
        setFixedTop(null);
      } else if (wouldStick && roomBelow) {
        setFixedTop(topOffset);
      } else if (wouldStick && !roomBelow) {
        setFixedTop(rowRect.bottom - height);
      } else {
        setFixedTop(null);
      }
    };

    recompute();
    scrollEl.addEventListener('scroll', recompute, { passive: true });
    window.addEventListener('resize', recompute);
    return () => {
      scrollEl.removeEventListener('scroll', recompute);
      window.removeEventListener('resize', recompute);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topOffset, ...recomputeDeps]);

  const stuck = fixedTop != null;
  // `left`/`width` are read fresh from the wrapper each render rather than
  // cached in state — they only ever change on resize (handled above), and
  // reading them here keeps the effect's dependency list free of layout
  // values that would otherwise force it to re-run every render.
  const rect = stuck ? wrapperRef.current?.getBoundingClientRect() : undefined;

  return {
    wrapperRef,
    contentRef,
    wrapperStyle: stuck ? { height: naturalHeight.current } : undefined,
    contentStyle: stuck && rect
      ? { position: 'fixed', top: fixedTop, left: rect.left, width: rect.width, zIndex: 40 }
      : undefined,
  };
}
