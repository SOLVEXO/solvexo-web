import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

/*
 * The one floating panel behind the date / colour / range pickers (the dropdown has its own copy of the same rules):
 *  - portaled to <body> above dialogs (z 10050) so no container can clip it,
 *  - opens below the field, flips above when there is no room, stays inside the screen,
 *  - bottom sheet under 640px,
 *  - Escape closes ONLY this panel (captured, so a dialog behind it stays open), outside click closes it.
 */

const PANEL_Z = 10050;
const MARGIN = 8;

interface Place { left: number; width: number; top?: number; bottom?: number; maxHeight: number }

export interface PopoverProps {
  open: boolean;
  onClose: () => void;
  /** The field the panel hangs from. */
  anchorRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  /** Panel width in px on a computer (default: the field's width, at least 280). */
  width?: number;
  /** Rough height, only used to decide whether to open upward. */
  estimatedHeight?: number;
  /** Heading shown at the top of the phone sheet. */
  sheetTitle?: string;
  /** Accessible name of the panel. */
  label?: string;
  /** Align the panel's right edge with the field's right edge instead of the left one. */
  alignEnd?: boolean;
}

export function Popover({ open, onClose, anchorRef, children, width, estimatedHeight = 360, sheetTitle, label, alignEnd }: PopoverProps) {
  const panel = useRef<HTMLDivElement | null>(null);
  const [sheet, setSheet] = useState(false);
  const [place, setPlace] = useState<Place | null>(null);

  const measure = useCallback((): Place | null => {
    const el = anchorRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const w = Math.min(width ?? Math.max(r.width, 280), window.innerWidth - MARGIN * 2);
    const wantLeft = alignEnd ? r.right - w : r.left;
    const left = Math.max(MARGIN, Math.min(wantLeft, window.innerWidth - w - MARGIN));
    const below = window.innerHeight - r.bottom - MARGIN;
    const above = r.top - MARGIN;
    const up = below < Math.min(estimatedHeight, 300) && above > below;
    return up
      ? { left, width: w, bottom: window.innerHeight - r.top + 4, maxHeight: Math.max(200, above - 4) }
      : { left, width: w, top: r.bottom + 4, maxHeight: Math.max(200, below - 4) };
  }, [anchorRef, width, alignEnd, estimatedHeight]);

  useLayoutEffect(() => {
    if (!open) return;
    const isSheet = typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 639px)').matches;
    // Measuring the field needs the DOM, so this has to happen after it is on screen (same as the dropdown).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSheet(isSheet);
    setPlace(isSheet ? null : measure());
  }, [open, measure]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (anchorRef.current?.contains(t) || panel.current?.contains(t)) return;
      onClose();
    };
    const onMove = (e: Event) => {
      if (e.target instanceof Node && panel.current?.contains(e.target)) return;
      if (sheet) return;
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) { onClose(); return; }
      setPlace(measure());
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      e.preventDefault();
      onClose();
      anchorRef.current?.focus?.();
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    window.addEventListener('keydown', onEsc, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('keydown', onEsc, true);
    };
  }, [open, sheet, anchorRef, measure, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    sheet ? (
      <div className="fixed inset-0" style={{ zIndex: PANEL_Z }}>
        <div className="absolute inset-0 bg-black/40" onMouseDown={onClose} aria-hidden />
        <div
          ref={panel}
          role="dialog"
          aria-label={label ?? sheetTitle}
          className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col overflow-y-auto rounded-t-2xl bg-white"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-bone" aria-hidden />
          {sheetTitle && <div className="px-4 pb-1 pt-3 text-[14px] font-semibold text-carbon">{sheetTitle}</div>}
          {children}
        </div>
      </div>
    ) : (
      <div
        ref={panel}
        role="dialog"
        aria-label={label ?? sheetTitle}
        className="fixed flex flex-col overflow-y-auto rounded-xl border border-bone bg-white"
        style={{
          zIndex: PANEL_Z, left: place?.left ?? 0, top: place?.top, bottom: place?.bottom, maxHeight: place?.maxHeight,
          width: place?.width ?? width ?? 280,
          boxShadow: '0 12px 30px -10px rgba(20,20,19,.25)',
        }}
      >
        {children}
      </div>
    ),
    document.body,
  );
}
