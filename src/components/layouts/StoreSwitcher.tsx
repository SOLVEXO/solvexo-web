import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { ChevronDown, Plus, Store as StoreIcon, Check } from 'lucide-react';
import type { MyStoreItem } from '@/api/services/store';

// Shopify-style store switcher — shared by SellerLayout (cross-store pages,
// no single active store) and StoreLayout (a specific store's own dashboard,
// where the trigger shows that store's own identity). Switching always just
// navigates to the target store's dashboard — there's no "current store"
// concept to update anywhere else, unlike ActiveStoreContext's activeStoreId
// (that one is a cross-store analytics filter, a different concept).
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

export function StoreSwitcher({ stores, loading, currentStoreId, variant = 'dark', compact = false }: StoreSwitcherProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const currentStore = currentStoreId ? stores.find(s => s._id === currentStoreId) ?? null : null;
  const initials = currentStore?.name?.slice(0, 2).toUpperCase() ?? '';

  const displayName = loading ? 'Loading…' : currentStore ? currentStore.name : 'My Stores';
  const displaySub = loading
    ? ''
    : currentStore
      ? `/${currentStore.slug}${currentStore.plan ? ` · ${currentStore.plan}` : ''}`
      : `${stores.length} store${stores.length !== 1 ? 's' : ''}`;

  const isLight = variant === 'light';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className={clsx(
          'flex items-center gap-2 cursor-pointer transition-colors duration-150',
          isLight
            ? clsx('rounded-lg border py-[6px] px-[10px] bg-white', open ? 'border-brand-orange/40 bg-cream' : 'border-bone hover:bg-cream')
            : clsx('w-full rounded-md py-2 px-[10px] border-0', open ? 'bg-charcoal' : 'bg-dark-active hover:bg-charcoal'),
        )}
      >
        <div className={clsx(
          'rounded-sm bg-brand-orange overflow-hidden flex items-center justify-center shrink-0 font-bold text-white',
          isLight ? 'size-5 text-[8px]' : 'size-6 text-[9px]',
        )}>
          {currentStore?.logo
            ? <img loading="lazy" decoding="async" src={currentStore.logo} className="w-full h-full object-cover" alt="" />
            : currentStore
              ? initials
              : <StoreIcon size={isLight ? 11 : 13} className="text-white" />}
        </div>
        <div className={clsx('min-w-0 text-left', compact && 'hidden sm:block')}>
          <p className={clsx('font-semibold leading-[1.3] truncate max-w-[140px]', isLight ? 'text-[12px] text-charcoal' : 'text-[11px] text-white')}>
            {displayName}
          </p>
          {displaySub && (
            <p className={clsx('leading-[1.3] truncate max-w-[140px]', isLight ? 'text-[10px] text-slate' : 'text-[10px] text-slate')}>
              {displaySub}
            </p>
          )}
        </div>
        <ChevronDown size={13} className={clsx('shrink-0 transition-transform duration-200', isLight ? 'text-slate' : 'text-slate', open && 'rotate-180')} />
      </button>

      {open && (
        <div className={clsx(
          'absolute top-[calc(100%+6px)] z-[200] rounded-[14px] p-[6px] w-[220px]',
          isLight ? 'right-0 bg-white border border-bone' : 'left-0 right-0 bg-[#1a1917] border border-charcoal',
        )}>
          <p className={clsx('text-[10px] font-semibold uppercase tracking-[0.08em] px-[10px] pt-1 pb-2', isLight ? 'text-slate' : 'text-dark-label')}>
            Switch Store
          </p>
          <div className="max-h-[220px] overflow-y-auto">
            {stores.map(store => (
              <StoreSwitcherItem
                key={store._id}
                label={store.name}
                sub={`/${store.slug}${store.plan ? ` · ${store.plan}` : ''}`}
                logo={store.logo}
                active={store._id === currentStoreId}
                light={isLight}
                onClick={() => {
                  setOpen(false);
                  if (store._id !== currentStoreId) navigate(`/store/${store._id}/dashboard`);
                }}
              />
            ))}
            {stores.length === 0 && !loading && (
              <p className={clsx('text-[11px] px-[10px] py-[6px]', isLight ? 'text-slate' : 'text-dark-label')}>No stores yet</p>
            )}
          </div>
          <div className={clsx('h-px mx-[6px] my-1', isLight ? 'bg-bone' : 'bg-charcoal')} />
          <button
            onClick={() => { setOpen(false); navigate('/onboard'); }}
            className={clsx(
              'flex items-center gap-[7px] w-full py-2 px-[10px] rounded-[7px] bg-transparent border-0 cursor-pointer text-[11px] font-semibold text-brand-orange transition-colors duration-150',
              isLight ? 'hover:bg-cream' : 'hover:bg-charcoal',
            )}
          >
            <Plus size={12} /> New Store
          </button>
        </div>
      )}
    </div>
  );
}

function StoreSwitcherItem({ label, sub, logo, active, light, onClick }: {
  label:   string;
  sub:     string;
  logo?:   string | null;
  active?: boolean;
  light?:  boolean;
  onClick: () => void;
}) {
  const initials = label.slice(0, 2).toUpperCase();
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-[9px] w-full py-[7px] px-[10px] rounded-md bg-transparent border-0 cursor-pointer text-left transition-colors duration-[120ms]',
        light
          ? clsx(active ? 'bg-cream' : 'hover:bg-cream')
          : clsx(active ? 'bg-dark-hover' : 'hover:bg-dark-hover'),
      )}
    >
      <div className={clsx(
        'size-[26px] rounded-[7px] shrink-0 overflow-hidden flex items-center justify-center text-[9px] font-bold',
        light ? 'bg-bone text-slate' : 'bg-charcoal text-slate',
      )}>
        {logo ? <img loading="lazy" decoding="async" src={logo} alt={label} className="w-full h-full object-cover" /> : initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className={clsx('text-[12px] font-medium truncate', light ? 'text-charcoal' : 'text-dark-text')}>{label}</p>
        <p className={clsx('text-[10px]', light ? 'text-slate' : 'text-dark-label')}>{sub}</p>
      </div>
      {active && <Check size={13} className="text-brand-orange shrink-0" />}
    </button>
  );
}
