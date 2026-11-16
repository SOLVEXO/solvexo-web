import { useRef, type DragEvent, type MouseEvent, type PointerEvent } from 'react';

/** Mouse drag for a slider (touch swipes are handled by the slider's own touch handlers): press, drag sideways, release.
 *  `step` turns the horizontal distance into -1 / 0 / 1 (the theme's own RTL-aware `swipeStep`). A drag that moved the slide
 *  must not also "click" the slide link underneath, so the click that follows is swallowed. Spread the result on the slider root. */
export function useHeroDrag(go: (d: number) => void, step: (dx: number) => 1 | -1 | 0, enabled: boolean) {
  const start = useRef<number | null>(null);
  const swallow = useRef(false);
  if (!enabled) return {};
  return {
    'data-hero-drag': '',
    onPointerDown: (e: PointerEvent) => { if (e.pointerType === 'mouse' && e.button === 0) { start.current = e.clientX; swallow.current = false; } },
    onPointerUp: (e: PointerEvent) => {
      if (start.current === null) return;
      const dx = e.clientX - start.current;
      start.current = null;
      const s = step(dx);
      if (Math.abs(dx) > 8) { swallow.current = true; window.setTimeout(() => { swallow.current = false; }, 0); }
      if (s) go(s);
    },
    onPointerLeave: () => { start.current = null; },
    onClickCapture: (e: MouseEvent) => { if (swallow.current) { e.preventDefault(); e.stopPropagation(); } },
    onDragStart: (e: DragEvent) => e.preventDefault(),
  };
}

/** The seller's slider navigation options -> the classes the three themes share. */
export function heroNavLook(s: Record<string, unknown>, defaultPosition: 'left' | 'center' | 'right') {
  const shape = s.arrowStyle === 'square' ? 'bg-white/90 text-black shadow-md'
    : s.arrowStyle === 'plain' ? 'rounded-full bg-transparent text-white drop-shadow-[0_1px_3px_rgba(0,0,0,.6)]'
      : 'rounded-full bg-white/90 text-black shadow-md';
  const pos = (['left', 'center', 'right'] as const).find(p => p === s.paginationPosition) ?? defaultPosition;
  return {
    arrowShow: s.arrowsOnPhone === true ? 'flex' : 'hidden md:flex',
    arrowShape: shape,
    paginationPos: pos === 'left' ? 'justify-start ps-5 md:ps-10' : pos === 'right' ? 'justify-end pe-5 md:pe-10' : 'justify-center',
  };
}
