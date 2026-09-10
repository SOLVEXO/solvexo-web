import { useState, useRef, useEffect, useCallback, useMemo, useId, type ReactNode, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Search } from 'lucide-react';
import { clsx } from 'clsx';

export interface ActionMenuItem {
  label:     ReactNode;
  onClick:   () => void;
  icon?:     ReactNode;
  danger?:   boolean;
  disabled?: boolean;
  title?:    string;
  /** Plain-text match target for `searchable` mode — `label` is often a
   *  ReactNode (icons, badges) that can't be searched directly. An item
   *  with no `searchText` is never hidden by a search query, so callers
   *  that don't set it keep their existing (non-filterable) behavior. */
  searchText?: string;
}

interface ActionMenuProps {
  items:      ActionMenuItem[];
  align?:     'left' | 'right';
  className?: string;
  /** Replaces the default kebab-icon trigger button's content (e.g. a
   *  currency chip with a flag) — the button itself, its open/close
   *  state, positioning, and accessibility wiring are unchanged. */
  trigger?:        ReactNode;
  triggerClassName?: string;
  ariaLabel?:      string;
  /** Adds a search box above the item list and filters by each item's
   *  `searchText` (case-insensitive substring match) — for a long,
   *  open-ended list (e.g. 150+ currencies) where scanning/scrolling alone
   *  isn't production-usable. Off by default; every short menu (row
   *  actions, etc.) is unaffected. The item list is always height-capped
   *  with internal scroll regardless of this flag, since an uncapped list
   *  already ran off-screen for any caller with more than a handful of items. */
  searchable?:        boolean;
  searchPlaceholder?: string;
}

interface DropdownPos {
  top?:    number;
  bottom?: number;
  left?:   number;
  right?:  number;
}

// ── Portal dropdown ───────────────────────────────────────────────────────────
function DropdownPortal({
  items, pos, portalRef, onClose, menuId, triggerId, align, searchable, searchPlaceholder, query, onQueryChange,
}: {
  items:     ActionMenuItem[];
  pos:       DropdownPos;
  portalRef: React.RefObject<HTMLDivElement | null>;
  onClose:   () => void;
  menuId:    string;
  triggerId: string;
  align:     'left' | 'right';
  searchable?:        boolean;
  searchPlaceholder?: string;
  query:              string;
  onQueryChange:      (v: string) => void;
}) {
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchable) searchRef.current?.focus();
    else itemRefs.current[0]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const focusItem = (index: number) => {
    const count = items.length;
    if (count === 0) return;
    itemRefs.current[(index + count) % count]?.focus();
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const count = items.length;
    const current = itemRefs.current.findIndex(el => el === document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusItem(current === -1 ? 0 : current + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (current <= 0 && document.activeElement !== searchRef.current) searchRef.current?.focus();
      else focusItem(current - 1);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter' && document.activeElement === searchRef.current && count > 0) {
      e.preventDefault();
      const first = items[0];
      if (!first.disabled) { first.onClick(); onClose(); }
    }
  };

  return createPortal(
    <div
      ref={portalRef}
      id={menuId}
      role="menu"
      aria-labelledby={triggerId}
      onKeyDown={onKeyDown}
      className="dropdown-enter fixed z-[9999] bg-white border border-bone rounded-[10px] py-1 min-w-[160px] flex flex-col"
      style={{ ...pos, transformOrigin: align === 'right' ? 'top right' : 'top left', maxHeight: searchable ? 328 : 288 }}
    >
      {searchable && (
        <div className="px-2.5 pt-1 pb-2 border-b border-bone shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={e => onQueryChange(e.target.value)}
              placeholder={searchPlaceholder ?? 'Search…'}
              className="w-full pl-7 pr-2.5 py-[7px] rounded-md border border-bone bg-cream text-[12px] text-charcoal outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10"
            />
          </div>
        </div>
      )}
      <div className="overflow-y-auto min-h-0">
        {items.length === 0 ? (
          <p className="px-4 py-3 text-[12px] text-slate">No matches</p>
        ) : (
          items.map((item, i) => (
            <button
              key={i}
              ref={el => { itemRefs.current[i] = el; }}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              title={item.title}
              aria-disabled={item.disabled}
              onClick={e => { e.stopPropagation(); if (item.disabled) return; item.onClick(); onClose(); }}
              className={clsx(
                'w-full flex items-center gap-2 px-4 py-[9px] text-[13px] font-medium text-left border-none bg-transparent transition-colors',
                item.disabled
                  ? 'text-slate/60 cursor-not-allowed'
                  : item.danger
                    ? 'text-error hover:bg-error-bg cursor-pointer'
                    : 'text-carbon hover:bg-cream cursor-pointer',
              )}
            >
              {item.icon && <span className="shrink-0 opacity-70">{item.icon}</span>}
              {item.label}
            </button>
          ))
        )}
      </div>
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
export function ActionMenu({
  items, align = 'right', className, trigger, triggerClassName, ariaLabel, searchable, searchPlaceholder,
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState<DropdownPos>({});
  const [query, setQuery] = useState('');

  const btnRef    = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const triggerId = useId();
  const menuId    = useId();

  const close = useCallback(() => { setOpen(false); setQuery(''); btnRef.current?.focus(); }, []);

  const visibleItems = useMemo(() => {
    if (!searchable) return items;
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item => (item.searchText ?? '').toLowerCase().includes(q));
  }, [items, searchable, query]);

  // Height cap now matches DropdownPortal's fixed maxHeight (328px searchable /
  // 288px otherwise) instead of growing unboundedly with items.length — with
  // 150+-item lists (e.g. currencies) the menu always scrolls internally rather
  // than running off-screen, so positioning only needs to reason about a capped size.
  const calcPos = useCallback(() => {
    if (!btnRef.current) return;
    const rect          = btnRef.current.getBoundingClientRect();
    const container     = getContainerRect(btnRef.current);
    const ESTIMATED_H   = Math.min(items.length * 42 + 8, searchable ? 328 : 288);
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
  }, [items.length, align, searchable]);

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
        id={triggerId}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={ariaLabel ?? 'Open actions menu'}
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className={triggerClassName ?? clsx(
          'w-8 h-8 rounded-[7px] border flex items-center justify-center transition-colors cursor-pointer',
          open
            ? 'bg-brand-pale-orange border-brand-orange text-brand-orange'
            : 'bg-white border-bone text-slate hover:bg-cream hover:border-[#c5c4bc]',
        )}
      >
        {trigger ?? <MoreVertical size={15} />}
      </button>

      {open && (
        <DropdownPortal
          items={visibleItems}
          pos={pos}
          portalRef={portalRef}
          onClose={close}
          menuId={menuId}
          triggerId={triggerId}
          align={align}
          searchable={searchable}
          searchPlaceholder={searchPlaceholder}
          query={query}
          onQueryChange={setQuery}
        />
      )}
    </div>
  );
}
