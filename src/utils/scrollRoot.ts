// RootLayout's content wrapper (not window/document) is the app's single
// scroll container, so it sits below the fixed 44px ReferenceNav instead of
// the native scrollbar spanning behind it. Anything that used to read
// window.scrollY / call window.scrollTo must go through this instead.
export const scrollRootRef: { current: HTMLDivElement | null } = { current: null };

// Set by SmoothScroll once Lenis has taken over `scrollRootRef`'s element.
// Lenis drives that element's scrollTop on every rAF tick, so a raw
// `el.scrollTo(...)` call fights it (Lenis overwrites the jump on the very
// next frame) — anything that needs to move the scroll position
// programmatically should go through `lenis.scrollTo` when it's present.
export const lenisRef: { current: { scrollTo: (target: number, opts?: { immediate?: boolean }) => void; raf: (t: number) => void; resize: () => void; destroy: () => void } | null } = { current: null };

export function scrollRootToTop(behavior: ScrollBehavior = 'auto') {
  if (lenisRef.current) {
    lenisRef.current.scrollTo(0, { immediate: behavior !== 'smooth' });
    return;
  }
  scrollRootRef.current?.scrollTo({ top: 0, behavior });
}
