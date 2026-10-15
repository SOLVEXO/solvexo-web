import { useCallback, useEffect, useState, type CSSProperties, type RefObject } from 'react';

/**
 * Header behaviour while the page scrolls: sticky, "show only when scrolling up", and a transparent header that
 * sits over the first section (the hero) until the shopper scrolls. Transparency works by pulling the content up
 * under the header with a negative margin equal to the header's own height, so the layout never jumps.
 */
export function useHeaderScroll(stickyMode: 'off' | 'always' | 'scroll-up', transparent: boolean) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  /** Ref callback for the <header>; also fills any other refs that need the same element (e.g. the mega menu's). */
  const attach = useCallback((el: HTMLElement | null, ...others: RefObject<HTMLElement | null>[]) => {
    for (const r of others) r.current = el;
    if (el) setNode(prev => (prev === el ? prev : el));
  }, []);
  const [atTop, setAtTop] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (stickyMode === 'off' && !transparent) return;
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setAtTop(y < 8);
      if (stickyMode === 'scroll-up') setHidden(y > 120 && y > lastY);
      lastY = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [stickyMode, transparent]);

  useEffect(() => {
    if (!transparent || !node || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setHeight(node.offsetHeight));
    ro.observe(node);
    return () => ro.disconnect();
  }, [transparent, node]);

  const style: CSSProperties = {
    ...(stickyMode !== 'off' ? { position: 'sticky', top: 0, zIndex: 40 } : transparent ? { position: 'relative', zIndex: 40 } : {}),
    ...(stickyMode === 'scroll-up' ? { transform: hidden ? 'translateY(-100%)' : 'none', transition: 'transform .3s ease, background-color .25s ease' } : { transition: 'background-color .25s ease' }),
    ...(transparent ? { marginBottom: -height } : {}),
  };
  /** `clear` = the header is currently see-through (transparent mode, page at the top). */
  return { attach, clear: transparent && atTop, style };
}
