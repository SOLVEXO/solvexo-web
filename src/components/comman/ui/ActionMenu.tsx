import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import { clsx } from 'clsx';

export interface ActionMenuItem {
  label:   string;
  onClick: () => void;
  icon?:   ReactNode;
  danger?: boolean;
}

interface ActionMenuProps {
  items:      ActionMenuItem[];
  align?:     'left' | 'right';
  className?: string;
}

interface DropdownPos {
  top?:    number;
  bottom?: number;
  left?:   number;
  right?:  number;
}

// ── Portal dropdown ───────────────────────────────────────────────────────────
function DropdownPortal({
  items, pos, portalRef, onClose,
}: {
  items:     ActionMenuItem[];
  pos:       DropdownPos;
  portalRef: React.RefObject<HTMLDivElement | null>;
  onClose:   () => void;
}) {
  return createPortal(
    <div
      ref={portalRef}
      className="fixed z-[9999] bg-white border border-bone rounded-[10px] py-1 min-w-[160px]"
      style={pos}
    >
      {items.map((item, i) => (
        <button
          key={i}
          type="button"
          onClick={e => { e.stopPropagation(); item.onClick(); onClose(); }}
          className={clsx(
            'w-full flex items-center gap-2 px-4 py-[9px] text-[13px] font-medium text-left cursor-pointer transition-colors border-none bg-transparent',
            item.danger
              ? 'text-error hover:bg-error-bg'
              : 'text-carbon hover:bg-cream',
          )}
        >
          {item.icon && <span className="shrink-0 opacity-70">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}

// ── Walk up the DOM to find the nearest clipping ancestor ────────────────────
function getContainerRect(el: HTMLElement): DOMRect {
  let node: HTMLElement | null = el.parentElement;
  while (node && node !== document.documentElement) {
    const { overflow, overflowX, overflowY } = getComputedStyle(node);
    if (/hidden|auto|scroll/.test(`${overflow}${overflowX}${overflowY}`)) {
      return node.getBoundingClientRect();
    }
    node = node.parentElement;
  }
  return new DOMRect(0, 0, window.innerWidth, window.innerHeight);
}

// ── ActionMenu ────────────────────────────────────────────────────────────────
export function ActionMenu({ items, align = 'right', className }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState<DropdownPos>({});

  const btnRef    = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  const calcPos = useCallback(() => {
    if (!btnRef.current) return;
    const rect          = btnRef.current.getBoundingClientRect();
    const container     = getContainerRect(btnRef.current);
    const ESTIMATED_H   = items.length * 42 + 8;
    const GAP           = 4;
    const spaceBelow    = container.bottom - rect.bottom;
    const spaceAbove    = rect.top - container.top;
    const openUpward    = spaceBelow < ESTIMATED_H + GAP && spaceAbove >= ESTIMATED_H;

    const next: DropdownPos = {};
    next[openUpward ? 'bottom' : 'top'] = openUpward
      ? window.innerHeight - rect.top + GAP
      : rect.bottom + GAP;

    next[align === 'right' ? 'right' : 'left'] = align === 'right'
      ? window.innerWidth - rect.right
      : rect.left;

    setPos(next);
  }, [items.length, align]);

  useEffect(() => {
    if (!open) return;

    calcPos();

    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      const insideBtn    = btnRef.current?.contains(t)    ?? false;
      const insidePortal = portalRef.current?.contains(t) ?? false;
      if (!insideBtn && !insidePortal) close();
    };

    const onScrollOrResize = () => close();

    document.addEventListener('mousedown', onMouseDown);
    window.addEventListener('scroll',  onScrollOrResize, true);
    window.addEventListener('resize',  onScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('scroll',  onScrollOrResize, true);
      window.removeEventListener('resize',  onScrollOrResize);
    };
  }, [open, calcPos, close]);

  return (
    <div className={clsx('relative inline-block', className)}>
      <button
        ref={btnRef}
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className={clsx(
          'w-8 h-8 rounded-[7px] border flex items-center justify-center transition-colors cursor-pointer',
          open
            ? 'bg-brand-pale-orange border-brand-orange text-brand-orange'
            : 'bg-white border-bone text-slate hover:bg-cream hover:border-[#c5c4bc]',
        )}
      >
        <MoreVertical size={15} />
      </button>

      {open && (
        <DropdownPortal
          items={items}
          pos={pos}
          portalRef={portalRef}
          onClose={close}
        />
      )}
    </div>
  );
}
