import { useCallback, useEffect, useRef, useState, type CSSProperties, type MutableRefObject, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

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

/** What happens when the menu has more links than fit: wrap onto more lines, one line with scroll arrows, or a "More" dropdown. */
export type NavOverflowMode = 'scroll' | 'wrap' | 'more';

/** The links that did not fit (always the LAST ones). Drawn by the theme inside the shared "More" dropdown. */
export interface NavMoreConfig {
  label: string;
  /** Receives the index of the first hidden item (items are the direct children of the row, in order). */
  render: (hiddenFrom: number) => ReactNode;
}

/** Dropdown of the "More" button. Portaled to <body> so a sticky/blurred header can never clip or re-anchor it. */
function MoreMenu({ boxRef, label, arrow, children }: { boxRef: MutableRefObject<HTMLDivElement | null>; label: string; arrow: NavArrowStyle; children: ReactNode }) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const timer = useRef(0);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; x: number; rtl: boolean; font: string } | null>(null);

  const openNow = () => {
    window.clearTimeout(timer.current);
    const b = btnRef.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    const cs = getComputedStyle(b);
    const rtl = cs.direction === 'rtl';
    setPos({ top: r.bottom + 6, x: rtl ? r.left : document.documentElement.clientWidth - r.right, rtl, font: cs.fontFamily });
    setOpen(true);
  };
  const closeSoon = () => { window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setOpen(false), 160); };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); btnRef.current?.focus({ preventScroll: true }); } };
    const onDown = (e: Event) => { const t = e.target as Node; if (!panelRef.current?.contains(t) && !btnRef.current?.contains(t)) setOpen(false); };
    const onScroll = (e: Event) => { if (!panelRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const radius = typeof arrow.radius === 'number' ? Math.min(arrow.radius, 18) : 14;
  return (
    <div ref={boxRef} className="ms-1 shrink-0" style={{ display: 'none' }}>
      <button ref={btnRef} type="button" aria-expanded={open} aria-haspopup="true" onClick={() => (open ? setOpen(false) : openNow())} onMouseEnter={openNow} onMouseLeave={closeSoon}
        className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap border-0 bg-transparent px-3 py-2 text-sm font-medium" style={{ color: 'inherit', font: 'inherit' }}>
        {label}<ChevronDown size={13} aria-hidden className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && pos && createPortal(
        <div ref={panelRef} data-more-panel onMouseEnter={() => window.clearTimeout(timer.current)} onMouseLeave={closeSoon}
          onClick={e => { if ((e.target as HTMLElement).closest('a')) setOpen(false); }}
          style={{ position: 'fixed', top: pos.top, ...(pos.rtl ? { left: pos.x } : { right: pos.x }), zIndex: 1000, minWidth: 220, maxWidth: 'min(320px, 92vw)', maxHeight: `calc(100vh - ${pos.top + 16}px)`, overflowY: 'auto',
            background: arrow.bg, color: arrow.fg, border: `1px solid ${arrow.border ?? 'transparent'}`, borderRadius: radius, padding: 8, fontFamily: pos.font, fontSize: 14,
            boxShadow: '0 12px 32px -12px rgba(0,0,0,.25)' }}>
          {children}
        </div>, document.body)}
    </div>
  );
}

export function NavScrollRow({
  mode, more, className, navClassName, wrapClassName, navStyle, wrapperStyle, arrow, navRef, ariaLabel, children,
}: {
  /** `wrap` = plain `<nav>` exactly as before; `scroll` = one line with arrows; `more` = one line, the rest in a "More" dropdown (falls back to `scroll` without `more`). */
  mode: NavOverflowMode;
  more?: NavMoreConfig;
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
  const enabled = mode !== 'wrap';
  const moreMode = mode === 'more' && !!more;
  const inner = useRef<HTMLElement | null>(null);
  const moreBox = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState({ start: false, end: false, rtl: false });
  const [hiddenFrom, setHiddenFrom] = useState<number | null>(null);

  /** Hides the trailing links that do not fit (they move into the "More" dropdown). Runs synchronously, so nothing flickers. */
  const fitMore = useCallback(() => {
    const el = inner.current;
    const box = moreBox.current;
    if (!el || !box) return;
    const kids = Array.from(el.children) as HTMLElement[];
    kids.forEach(k => k.removeAttribute('data-nav-hidden'));
    box.style.display = 'none';
    if (el.scrollWidth <= el.clientWidth + 1) { setHiddenFrom(null); return; }
    box.style.display = '';
    const avail = el.clientWidth;
    const nr = el.getBoundingClientRect();
    const rtl = getComputedStyle(el).direction === 'rtl';
    let from = kids.length;
    for (let i = 0; i < kids.length; i++) {
      const r = kids[i].getBoundingClientRect();
      const end = rtl ? nr.right - r.left : r.right - nr.left;
      if (end > avail + 0.5) { from = i; break; }
    }
    if (from >= kids.length) { box.style.display = 'none'; setHiddenFrom(null); return; }
    kids.forEach((k, i) => { if (i >= from) k.setAttribute('data-nav-hidden', ''); });
    setHiddenFrom(from);
  }, []);

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
    const later = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; if (moreMode) fitMore(); update(); placeAll(el); }); };
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
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(later);
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
  }, [enabled, moreMode, update, fitMore]);

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
    <div className={`relative min-w-0 max-w-full ${moreMode ? 'flex items-center' : ''} ${className ?? ''}`} style={wrapperStyle}>
      {moreMode && <style>{'[data-nav-hidden]{display:none!important}'}</style>}
      {!moreMode && state.start && btn(-1)}
      <nav ref={setRef} data-lenis-prevent={moreMode ? undefined : true} aria-label={ariaLabel} tabIndex={-1}
        className={`flex min-w-0 max-w-full ${moreMode ? 'overflow-hidden' : 'overflow-x-auto overscroll-x-contain'} outline-none [&::-webkit-scrollbar]:hidden ${navClassName}`}
        style={{ scrollbarWidth: 'none', ...navStyle }}>
        {children}
      </nav>
      {moreMode && more && (
        <MoreMenu boxRef={moreBox} label={more.label} arrow={arrow}>{hiddenFrom !== null ? more.render(hiddenFrom) : null}</MoreMenu>
      )}
      {!moreMode && state.end && btn(1)}
    </div>
  );
}
