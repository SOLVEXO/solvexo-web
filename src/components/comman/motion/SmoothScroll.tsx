import { useEffect } from 'react';
import { scrollRootRef, lenisRef } from '@/utils/scrollRoot';

// Lenis smooth scrolling — eases raw wheel/touch deltas instead of letting
// them jump the scroll position instantly, the same fluid feel the
// reference design uses site-wide. Solvexo's actual scroll container isn't
// `window` (see scrollRoot.ts) but RootLayout's own `overflow-y-auto` div,
// so `wrapper` is pointed at that div explicitly — Lenis's documented
// pattern for smoothing a scrollable element instead of the page.
//
// `content` is set to that same div rather than its first child on
// purpose: `wrapper`'s child is remounted fresh on every route change
// (ErrorBoundary above it is keyed by pathname), so a reference captured
// once at mount would go stale/detached after the very first navigation.
// Lenis only reads `content.scrollHeight` when `wrapper` IS `window`; for a
// non-window wrapper (our case) it measures `wrapper.scrollHeight`
// directly instead, so `content`'s exact identity doesn't affect bounds
// here — using `wrapper` keeps the reference permanently valid regardless.
//
// `lenisRef` (scrollRoot.ts) is set here so other code that programmatically
// scrolls that div (route-change reset, "back to top", etc.) can go through
// `lenis.scrollTo` instead of a raw `scrollTo` call that Lenis's own rAF
// loop would otherwise immediately fight/override.
export function SmoothScroll() {
  useEffect(() => {
    const wrapper = scrollRootRef.current;
    if (!wrapper) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let cancelled = false;

    import('lenis').then(({ default: Lenis }) => {
      if (cancelled) return;
      const instance = new Lenis({
        wrapper,
        content: wrapper,
        duration: 1.1,
        smoothWheel: true,
        touchMultiplier: 1.4,
      });
      lenisRef.current = instance;
      // `wrapper`'s own box is pinned by `fixed ... top-0 bottom-0` (see
      // RootLayout.tsx), so it never changes size — Lenis's internal
      // resize-detection (and the one-off `.resize()` calls RootLayout makes
      // on route change) can never catch a CHILD growing later, which is the
      // normal case here: every storefront/marketplace page fetches its real
      // content (products, images, category lists) asynchronously after
      // first paint. Left unhandled, Lenis keeps clamping to the small
      // scroll limit it measured at that first paint forever after — the
      // page visibly has content below the fold but scrolling is stuck. Since
      // this loop already runs every frame for `instance.raf`, piggyback a
      // cheap `scrollHeight` comparison on it instead of adding a separate
      // observer/timer — catches any async content change (API data, image
      // decode, hero rotation, an expanded dropdown) within one frame,
      // regardless of how long it took to arrive.
      let lastScrollHeight = wrapper.scrollHeight;
      const loop = (time: number) => {
        instance.raf(time);
        if (wrapper.scrollHeight !== lastScrollHeight) {
          lastScrollHeight = wrapper.scrollHeight;
          instance.resize();
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, []);

  return null;
}
