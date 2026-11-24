import { useCallback, useEffect, useRef, useState, type CSSProperties, type MutableRefObject, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Headless "one line menu with scroll arrows" shared by every native theme (the YouTube chip-bar pattern).
 * The theme supplies its own markup for the items and the colours / radius of the two small arrow buttons.
 *
 * Menu items carry dropdown / mega panels as children. A scrolling box would clip them, so while this row is
 * enabled every `[data-nav-group] > [data-nav-panel]` is switched to `position: fixed` and placed from the
 * item's own rectangle when it is hovered, focused or clicked, and again while the row scrolls. A panel marked
 * `data-nav-mega` spans the whole `<header>` instead of sitting under its item.
 */

export interface NavArrowStyle {
  /** Button background. */
  bg: string;
  /** Chevron colour. */
  fg: string;
  border?: string;
  /** CSS border-radius (the theme's own button radius, 9999px for round). */
  radius?: number | string;
  /** Colour the labels fade into behind the arrow (omit when the bar is see-through). */
  fade?: string;
}

const EDGE_PX = 8;

/** Places one panel with `position: fixed`, whatever ancestor (header with backdrop-filter or the viewport) is its containing block. */
function placePanel(group: HTMLElement, panel: HTMLElement) {
  const s = panel.style;
  s.position = 'fixed';
  s.right = 'auto';
  s.bottom = 'auto';
  // left/top must never animate: the theme panels use `transition-all`
  s.transitionProperty = 'opacity, visibility';
  s.left = '0px';
  s.top = '0px';
  const origin = panel.getBoundingClientRect();
  const g = group.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  let left: number;
  if (panel.hasAttribute('data-nav-mega')) {
    const header = group.closest('header');
    const h = header ? header.getBoundingClientRect() : { left: 0, width: vw };
    s.width = `${h.width}px`;
    left = h.left;
  } else {
    const w = origin.width;
    const rtl = getComputedStyle(group).direction === 'rtl';
    left = rtl ? g.right - w : g.left;
    left = Math.max(EDGE_PX, Math.min(left, vw - w - EDGE_PX));
  }
  s.left = `${left - origin.left}px`;
  s.top = `${g.bottom - origin.top}px`;
}

function placeAll(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('[data-nav-group]').forEach(g => {
    const panel = g.querySelector<HTMLElement>(':scope > [data-nav-panel]');
    if (panel) placePanel(g, panel);
  });
}

function resetPanels(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('[data-nav-group] > [data-nav-panel]').forEach(p => {
    const s = p.style;
    s.position = ''; s.left = ''; s.top = ''; s.right = ''; s.bottom = ''; s.width = ''; s.transitionProperty = '';
  });
}

export function NavScrollRow({
  enabled, className, navClassName, wrapClassName, navStyle, wrapperStyle, arrow, navRef, ariaLabel, children,
}: {
  /** false = plain `<nav>` exactly as before (the seller chose wrapping rows). */
  enabled: boolean;
  /** Classes of the wrapper that sits in the header layout (carries `hidden lg:flex`, flex-1, the theme's pill, ...). */
  className?: string;
  /** Classes of the `<nav>` itself (flex, gap...). Items should be `shrink-0`. */
  navClassName: string;
  /** Extra nav classes used only in wrap mode (e.g. `flex-wrap justify-center`). */
  wrapClassName?: string;
  navStyle?: CSSProperties;
  wrapperStyle?: CSSProperties;
  arrow: NavArrowStyle;
  navRef?: MutableRefObject<HTMLElement | null>;
  ariaLabel: string;
  children: ReactNode;
}) {
  const inner = useRef<HTMLElement | null>(null);
  const [state, setState] = useState({ start: false, end: false, rtl: false });

  const update = useCallback(() => {
    const el = inner.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const pos = Math.abs(el.scrollLeft); // distance from the START edge, in LTR and RTL alike
    const next = { start: max > 2 && pos > 2, end: max > 2 && pos < max - 2, rtl: getComputedStyle(el).direction === 'rtl' };
    setState(p => (p.start === next.start && p.end === next.end && p.rtl === next.rtl ? p : next));
  }, []);

  useEffect(() => {
    const el = inner.current;
    if (!enabled || !el) return;
    let raf = 0;
    const later = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); placeAll(el); }); };
    const onGroup = (e: Event) => {
      const group = (e.target as HTMLElement | null)?.closest?.<HTMLElement>('[data-nav-group]');
      const panel = group?.querySelector<HTMLElement>(':scope > [data-nav-panel]');
      if (group && panel) placePanel(group, panel);
    };
    el.addEventListener('scroll', later, { passive: true });
    el.addEventListener('pointerover', onGroup);
    el.addEventListener('focusin', onGroup);
    el.addEventListener('click', onGroup, true);
    // Esc closes a panel that only opens through focus (CSS focus-within themes): move focus to the row itself
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setTimeout(() => {
        const a = document.activeElement as HTMLElement | null;
        const panel = a?.closest<HTMLElement>('[data-nav-group]')?.querySelector<HTMLElement>(':scope > [data-nav-panel]');
        if (panel && getComputedStyle(panel).visibility === 'visible') el.focus({ preventScroll: true });
      }, 0);
    };
    el.addEventListener('keydown', onKey);
    window.addEventListener('resize', later);
    // Older browsers (and jsdom in tests) have no ResizeObserver: the window resize and mutation observers still cover it.
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(later) : null;
    ro?.observe(el);
    const mo = new MutationObserver(later);
    mo.observe(el, { childList: true, subtree: true, characterData: true });
    // a language switch flips `<html dir>` without touching the menu items
    const dirMo = new MutationObserver(later);
    dirMo.observe(document.documentElement, { attributes: true, attributeFilter: ['dir', 'lang'] });
    later();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener('scroll', later);
      el.removeEventListener('pointerover', onGroup);
      el.removeEventListener('focusin', onGroup);
      el.removeEventListener('click', onGroup, true);
      el.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', later);
      ro?.disconnect(); mo.disconnect(); dirMo.disconnect();
      resetPanels(el);
    };
  }, [enabled, update]);

  const setRef = (el: HTMLElement | null) => { inner.current = el; if (navRef) navRef.current = el; };

  if (!enabled) {
    return <nav ref={setRef} className={`${className ?? ''} ${navClassName} ${wrapClassName ?? ''}`} style={{ ...wrapperStyle, ...navStyle }} aria-label={ariaLabel}>{children}</nav>;
  }

  const go = (dir: 1 | -1) => {
    const el = inner.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === 'rtl';
    el.scrollBy({ left: dir * (rtl ? -1 : 1) * el.clientWidth * 0.7, behavior: 'smooth' });
  };
  const hasFade = !!arrow.fade && arrow.fade !== 'transparent';
  const btn = (dir: 1 | -1) => {
    const atStart = dir === -1;
    // the start edge is the left one in LTR and the right one in RTL
    const Icon = (atStart !== state.rtl) ? ChevronLeft : ChevronRight;
    const side = atStart ? 'start-0' : 'end-0';
    const fadeDir = (atStart !== state.rtl) ? 'to right' : 'to left';
    return (
      <div className={`pointer-events-none absolute inset-y-0 ${side} z-[2] flex items-center ${atStart ? 'justify-start' : 'justify-end'}`}
        style={hasFade ? { width: 56, background: `linear-gradient(${fadeDir}, ${arrow.fade} 45%, transparent)` } : undefined}>
        <button type="button" tabIndex={-1} aria-hidden="true" data-nav-arrow={atStart ? 'start' : 'end'} onClick={() => go(dir)}
          className="pointer-events-auto m-0 grid size-7 shrink-0 cursor-pointer place-items-center p-0"
          style={{ background: arrow.bg, color: arrow.fg, border: `1px solid ${arrow.border ?? 'transparent'}`, borderRadius: arrow.radius ?? 9999, boxShadow: '0 1px 4px rgba(0,0,0,.12)' }}>
          <Icon size={16} aria-hidden />
        </button>
      </div>
    );
  };

  return (
    <div className={`relative min-w-0 max-w-full ${className ?? ''}`} style={wrapperStyle}>
      {state.start && btn(-1)}
      <nav ref={setRef} data-lenis-prevent aria-label={ariaLabel} tabIndex={-1} className={`flex min-w-0 max-w-full overflow-x-auto overscroll-x-contain outline-none [&::-webkit-scrollbar]:hidden ${navClassName}`}
        style={{ scrollbarWidth: 'none', ...navStyle }}>
        {children}
      </nav>
      {state.end && btn(1)}
    </div>
  );
}
