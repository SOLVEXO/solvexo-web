import { useLayoutEffect, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { fashionTheme as t } from '../../theme.config';

/** Floating message-actions bar. It is drawn on the page (not inside the scrolling chat), so the chat never clips it and the
 *  message list does not jump; it opens below the message, or above when there is no room, and stays inside the screen. */
export function ActionsPopover({ anchor, align, onClose, children }: { anchor: RefObject<HTMLElement | null>; align: 'start' | 'end'; onClose: () => void; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    const a = anchor.current;
    const b = box.current;
    if (!a || !b) return;
    const r = a.getBoundingClientRect();
    const w = b.offsetWidth;
    const h = b.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = align === 'end' ? r.right - w : r.left;
    left = Math.max(8, Math.min(left, vw - w - 8));
    let top = r.bottom + 6;
    if (top + h > vh - 8) top = Math.max(8, r.top - h - 6);
    setPos({ top, left });
  }, [anchor, align]);

  useEffect(() => {
    const down = (e: PointerEvent) => {
      const target = e.target as Node;
      if (box.current?.contains(target) || anchor.current?.contains(target)) return;
      onClose();
    };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    // the chat scrolls inside its own box: close instead of leaving the bar floating over other messages
    const close = () => onClose();
    document.addEventListener('pointerdown', down);
    document.addEventListener('keydown', key);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', down);
      document.removeEventListener('keydown', key);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [anchor, onClose]);

  return createPortal(
    <div
      ref={box} role="menu"
      className="fixed z-[80] flex flex-wrap items-center gap-1 p-1.5"
      style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? 'visible' : 'hidden', maxWidth: 'calc(100vw - 16px)', borderRadius: 24, background: t.colors.bg, border: `1px solid ${t.colors.border}` }}
    >
      {children}
    </div>,
    document.body,
  );
}
