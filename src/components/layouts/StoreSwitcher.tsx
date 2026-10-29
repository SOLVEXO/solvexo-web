import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { Check, ChevronDown, Plus, Search, Store as StoreIcon, X } from 'lucide-react';
import { useDropdownPosition } from '@/hooks/useDropdownPosition';
import type { MyStoreItem } from '@/api/services/store';

// Shopify-style store switcher — shared by SellerLayout (cross-store pages,
// no single active store) and StoreLayout (a specific store's own dashboard,
// where the trigger shows that store's own identity). Switching always just
// navigates to the target store's dashboard — there's no "current store"
// concept to update anywhere else, unlike ActiveStoreContext's activeStoreId
// (that one is a cross-store analytics filter, a different concept).
//
// The panel is a filterable list rather than a flat menu: it autofocuses its
// search box, so typing narrows to a store and ArrowDown hands off to the rows,
// which are real buttons (Tab/Enter/Escape work without a pointer). The store
// left behind is remembered per browser so the return trip sits at the top.
interface StoreSwitcherProps {
  stores: MyStoreItem[];
  loading: boolean;
  /** When set, the trigger shows THIS store's own identity instead of a generic "My Stores" summary. */
  currentStoreId?: string;
  /** 'dark' (default) — the sidebar rail's own palette (SellerLayout). 'light' — a white/cream top-navbar bar (StoreLayout's StorePageHeader). */
  variant?: 'dark' | 'light';
  /** Collapses the trigger to just the store avatar + chevron below the `sm` breakpoint, so it fits next to a page title in a tight mobile header. */
  compact?: boolean;
}

const RECENT_STORES_KEY = 'solvexo:storeSwitchRecent';
const PANEL_WIDTH = 340;

/** Stores visited most recently, newest first. Empty for a first-time or
 *  unreadable (private mode, corrupt JSON) read — that only costs the Recent group. */
function readRecentIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_STORES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function labelize(value?: string | null) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function StoreSwitcher({ stores, loading, currentStoreId, variant = 'dark', compact = false }: StoreSwitcherProps) {
  const navigate = useNavigate();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recentIds, setRecentIds] = useState<string[]>(readRecentIds);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const pos = useDropdownPosition(triggerRef, open, variant === 'dark' ? 'left' : 'right', 6, PANEL_WIDTH);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (containerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const currentStore = currentStoreId ? stores.find(s => s._id === currentStoreId) ?? null : null;
  const initials = currentStore?.name?.slice(0, 2).toUpperCase() ?? '';

  const displayName = loading ? 'Loading…' : currentStore ? currentStore.name : 'My Stores';
  const displayPlan = loading ? '' : labelize(currentStore?.plan);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  /** Group-ordered rows — `Recent` holds the stores last left behind, so the
   *  common case (go back where you just were) needs no typing at all. */
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      const hits = stores.filter(s => s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q));
      return hits.map(store => ({ store, group: hits.length === 1 ? 'Match' : `${hits.length} matches` }));
    }
    const recent = recentIds
      .map(id => stores.find(s => s._id === id))
      .filter((s): s is MyStoreItem => !!s && s._id !== currentStoreId)
      .slice(0, 2);
    const inRecent = new Set(recent.map(s => s._id));
    return [
      ...recent.map(store => ({ store, group: 'Recent' })),
      ...stores.filter(s => !inRecent.has(s._id)).map(store => ({ store, group: 'All stores' })),
    ];
  }, [stores, recentIds, currentStoreId, query]);

  const select = (store: MyStoreItem) => {
    setOpen(false);
    if (store._id === currentStoreId) { triggerRef.current?.focus(); return; }
    const next = [store._id, ...recentIds.filter(id => id !== store._id)].slice(0, 5);
    setRecentIds(next);
    try {
      localStorage.setItem(RECENT_STORES_KEY, JSON.stringify(next));
    } catch {
      // An unwritable localStorage only costs the Recent group.
    }
    navigate(`/store/${store._id}/dashboard`);
  };

  /** Rows are real buttons, so the arrow keys move DOM focus between them;
   *  ArrowDown from the search box enters the list, ArrowUp leaves it. */
  const focusRow = (index: number) => {
    const items = listRef.current?.querySelectorAll<HTMLButtonElement>('[data-store-row]') ?? [];
    if (!items.length) return;
    items[(index + items.length) % items.length]?.focus();
  };

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); focusRow(0); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
  };

  const onRowKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); focusRow(index + 1); }
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index === 0) inputRef.current?.focus();
      else focusRow(index - 1);
    } else if (e.key === 'Escape') { e.preventDefault(); close(); }
  };

  const isLight = variant === 'light';

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        className={clsx(
          'flex items-center gap-2 cursor-pointer transition-colors duration-150',
          isLight
            ? clsx('rounded-lg border py-[6px] px-[10px] bg-white', open ? 'border-brand-orange/40 bg-cream' : 'border-bone hover:bg-cream')
            : clsx('w-full rounded-md py-2 px-[10px] border-0', open ? 'bg-charcoal' : 'bg-dark-active hover:bg-charcoal'),
        )}
      >
        {/* Below `sm` the label text is hidden, which would leave this an
            unlabeled icon button — the name lives in the DOM instead. */}
        {compact && <span className="sr-only sm:hidden">Switch store</span>}
        <div className={clsx(
          'rounded-sm bg-brand-orange overflow-hidden flex items-center justify-center shrink-0 font-bold text-white',
          isLight ? 'size-5 text-[8px]' : 'size-6 text-[9px]',
        )}>
          {currentStore?.logo
            ? <img loading="lazy" decoding="async" src={currentStore.logo} className="max-w-full max-h-full object-contain" alt="" />
            : currentStore
              ? initials
              : <StoreIcon size={isLight ? 11 : 13} className="text-white" />}
        </div>
        <div className={clsx('min-w-0 text-left', compact && 'hidden sm:block')}>
          <p className={clsx('font-semibold leading-[1.3] truncate max-w-[140px]', isLight ? 'text-[12px] text-charcoal' : 'text-[11px] text-white')}>
            {displayName}
          </p>
          <span className="flex items-center gap-1 min-w-0">
            <p className={clsx('leading-[1.3] truncate', isLight ? 'text-[10px] text-slate' : 'text-[10px] text-slate')}>
              {loading ? '' : currentStore ? `/${currentStore.slug}` : `${stores.length} store${stores.length !== 1 ? 's' : ''}`}
            </p>
            {displayPlan && (
              <span className={clsx(
                'shrink-0 rounded-full px-[5px] text-[9px] font-semibold leading-[14px]',
                isLight ? 'bg-brand-pale-orange text-brand-deep-orange' : 'bg-charcoal text-dark-text',
              )}>
                {displayPlan}
              </span>
            )}
          </span>
        </div>
        <ChevronDown size={13} className={clsx('shrink-0 text-slate transition-transform duration-200', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          role="group"
          aria-label="Switch store"
          style={{ top: pos.top, left: pos.left }}
          className={clsx(
            'dropdown-enter fixed z-[9999] flex flex-col overflow-hidden rounded-[16px] border',
            'w-[340px] max-w-[calc(100vw-24px)]',
            isLight ? 'bg-white border-bone' : 'bg-[#1a1917] border-charcoal',
          )}
        >
          <div className={clsx('flex items-center gap-2 px-3 py-[10px] border-b', isLight ? 'bg-cream/40 border-bone' : 'bg-charcoal/40 border-charcoal')}>
            <Search size={14} className={clsx('shrink-0', isLight ? 'text-slate' : 'text-dark-label')} aria-hidden="true" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder={loading ? 'Loading stores…' : 'Search stores…'}
              aria-label="Search your stores"
              aria-controls={listId}
              autoComplete="off"
              className={clsx(
                'flex-1 min-w-0 bg-transparent border-0 outline-none text-[13px]',
                isLight ? 'text-carbon placeholder:text-slate' : 'text-white placeholder:text-dark-label',
              )}
            />
            <button
              onClick={close}
              aria-label="Close"
              className={clsx(
                'shrink-0 size-6 rounded-md border-0 flex items-center justify-center cursor-pointer transition-colors duration-150',
                isLight ? 'text-slate hover:bg-bone' : 'text-dark-label hover:bg-charcoal',
              )}
            >
              <X size={14} />
            </button>
          </div>

          <div ref={listRef} id={listId} className="max-h-[292px] overflow-y-auto py-1">
            {loading && [0, 1, 2].map(i => (
              <div key={i} className="flex items-center gap-[10px] px-[13px] py-[9px]">
                <div className={clsx('size-[30px] rounded-[9px] shrink-0 animate-pulse', isLight ? 'bg-bone' : 'bg-charcoal')} />
                <div className="flex-1 space-y-[6px]">
                  <div className={clsx('h-[10px] rounded-full animate-pulse', isLight ? 'bg-bone' : 'bg-charcoal')} />
                  <div className={clsx('h-[8px] w-2/3 rounded-full animate-pulse', isLight ? 'bg-bone' : 'bg-charcoal')} />
                </div>
              </div>
            ))}

            {!loading && rows.length === 0 && (
              <p className={clsx('px-[14px] py-4 text-[12px]', isLight ? 'text-slate' : 'text-dark-label')}>
                No store matches “{query.trim()}”.
              </p>
            )}

            {!loading && rows.map((row, i) => {
              const isCurrent = row.store._id === currentStoreId;
              const showGroup = i === 0 || rows[i - 1].group !== row.group;
              return (
                <div key={row.store._id}>
                  {showGroup && (
                    <p className={clsx(
                      'px-[14px] pt-2 pb-1 text-[9px] font-semibold uppercase tracking-[0.08em]',
                      isLight ? 'text-slate' : 'text-dark-label',
                    )}>
                      {row.group}
                    </p>
                  )}
                  <button
                    type="button"
                    data-store-row
                    aria-current={isCurrent ? 'true' : undefined}
                    onClick={() => select(row.store)}
                    onKeyDown={e => onRowKeyDown(e, i)}
                    className={clsx(
                      'relative flex items-center gap-[10px] w-full px-[13px] py-[9px] text-left cursor-pointer transition-colors duration-[120ms]',
                      isCurrent
                        ? isLight ? 'bg-cream' : 'bg-dark-hover'
                        : isLight ? 'hover:bg-brand-pale-orange/60' : 'hover:bg-dark-hover',
                    )}
                  >
                    {isCurrent && <span className="absolute left-[4px] top-[10px] bottom-[10px] w-[2px] rounded-full bg-brand-orange" aria-hidden="true" />}
                    <span className={clsx(
                      'size-[30px] rounded-[9px] shrink-0 overflow-hidden flex items-center justify-center text-[10px] font-bold',
                      isLight ? 'bg-bone text-slate' : 'bg-charcoal text-dark-text',
                    )}>
                      {row.store.logo
                        ? <img loading="lazy" decoding="async" src={row.store.logo} alt="" className="max-w-full max-h-full object-contain" />
                        : row.store.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className={clsx('block text-[12px] font-semibold truncate leading-[1.35]', isLight ? 'text-carbon' : 'text-dark-text')}>
                        {row.store.name}
                      </span>
                      <span className="flex items-center gap-[5px] min-w-0">
                        <span
                          className={clsx('size-[5px] rounded-full shrink-0', row.store.status === 'active' ? 'bg-[#3FA36B]' : 'bg-[#D9A441]')}
                          aria-hidden="true"
                        />
                        <span className={clsx('block text-[10px] truncate leading-[1.35]', isLight ? 'text-slate' : 'text-dark-label')}>
                          /{row.store.slug}
                        </span>
                        {row.store.plan && (
                          <span className={clsx(
                            'shrink-0 rounded-full px-[5px] text-[9px] font-semibold leading-[14px]',
                            isLight ? 'bg-bone text-graphite' : 'bg-charcoal text-dark-label',
                          )}>
                            {labelize(row.store.plan)}
                          </span>
                        )}
                        {row.store.status !== 'active' && (
                          <span className={clsx('shrink-0 text-[9px] font-semibold uppercase', isLight ? 'text-[#B9832F]' : 'text-dark-label')}>
                            {labelize(row.store.status)}
                          </span>
                        )}
                      </span>
                    </span>
                    {isCurrent ? (
                      <Check size={14} className="text-brand-orange shrink-0" aria-label="Current store" />
                    ) : (
                      <span className={clsx('shrink-0 text-[10px] tabular-nums', isLight ? 'text-slate' : 'text-dark-label')}>
                        {row.store.productCount} {row.store.productCount === 1 ? 'product' : 'products'}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className={clsx('flex items-center justify-between gap-2 px-[6px] py-[6px] border-t', isLight ? 'border-bone' : 'border-charcoal')}>
            <button
              onClick={() => { setOpen(false); navigate('/onboard'); }}
              className={clsx(
                'flex items-center gap-[6px] rounded-[7px] border-0 cursor-pointer text-[11px] font-semibold text-brand-orange py-[7px] px-[9px] transition-colors duration-150',
                isLight ? 'hover:bg-cream' : 'hover:bg-charcoal',
              )}
            >
              <Plus size={13} /> New store
            </button>
            <span className={clsx('pr-1 text-[10px]', isLight ? 'text-slate' : 'text-dark-label')}>
              {stores.length} store{stores.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
