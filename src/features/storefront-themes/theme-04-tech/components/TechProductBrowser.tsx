import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { currencySymbol } from '@/utils/currency';
import type { PublicStoreProduct } from '@/api/services/store';
import {
  PRODUCT_TYPE_LABEL, SORT_OPTIONS, clearFilters, hasActiveFilters, toggleIn, toggleOption, type BrowseState,
} from '@/features/storefront/browse/browseState';
import { BROWSE_PAGE_SIZE, useProductBrowse } from '@/features/storefront/browse/useProductBrowse';
import { useDialogFocus } from '../../core/hooks/useDialogFocus';
import { moneyText } from '../../core/money';
import { techTheme as t } from '../theme.config';
import { TechButton, TechError } from '../ui/techUi';
import { TechProductCard } from './TechProductCard';

interface Props {
  heading?: ReactNode;
  categoryId?: string;
  collectionId?: string;
  search?: string;
  /** Keep filters/sort/page in the URL (collection, category, search pages). */
  syncUrl?: boolean;
  defaultSort?: BrowseState['sort'];
  showFilters?: boolean;
  emptyText?: string;
  onProducts?: (products: PublicStoreProduct[]) => void;
  /** Extra blocks the page wants in the sidebar (e.g. a wishlist summary). */
  sidebarExtra?: ReactNode;
}

type View = 'grid' | 'list';

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="m-0 border-0 p-0" style={{ borderBottom: `1px solid ${t.colors.border}` }}>
      <legend className="float-left mb-2 w-full pt-4 text-sm font-semibold">{title}</legend>
      <div className="clear-both flex flex-col gap-1 pb-4">{children}</div>
    </fieldset>
  );
}

function Check({ label, count, checked, onToggle }: { label: string; count: number; checked: boolean; onToggle: () => void }) {
  const dim = count === 0 && !checked;
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-[13px]" style={{ opacity: dim ? 0.45 : 1 }}>
      <input type="checkbox" checked={checked} onChange={onToggle} disabled={dim} className="size-4" style={{ accentColor: t.colors.accent }} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="text-xs" style={{ color: t.colors.inkMuted }}>{count}</span>
    </label>
  );
}

function PriceFilter({ symbol, lowest, highest, minPrice, maxPrice, onApply }: { symbol: string; lowest: number | null; highest: number | null; minPrice?: number; maxPrice?: number; onApply: (lo?: number, hi?: number) => void }) {
  const [lo, setLo] = useState(minPrice != null ? String(minPrice) : '');
  const [hi, setHi] = useState(maxPrice != null ? String(maxPrice) : '');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const a = lo.trim() === '' ? undefined : Number(lo);
    const b = hi.trim() === '' ? undefined : Number(hi);
    onApply(a != null && Number.isFinite(a) ? a : undefined, b != null && Number.isFinite(b) ? b : undefined);
  };
  const field = { border: `1px solid ${t.colors.border}`, background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body, borderRadius: t.fieldRadiusPx } as const;
  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="tx-min">{ts('browse.minPrice', 'Minimum price')}</label>
        <input id="tx-min" inputMode="decimal" value={lo} onChange={e => setLo(e.target.value)} placeholder={lowest != null ? `${symbol}${Math.floor(lowest)}` : symbol} className="w-full px-2.5 py-2 text-[13px]" style={field} />
        <span aria-hidden>–</span>
        <label className="sr-only" htmlFor="tx-max">{ts('browse.maxPrice', 'Maximum price')}</label>
        <input id="tx-max" inputMode="decimal" value={hi} onChange={e => setHi(e.target.value)} placeholder={highest != null ? `${symbol}${Math.ceil(highest)}` : symbol} className="w-full px-2.5 py-2 text-[13px]" style={field} />
      </div>
      <TechButton type="submit" variant="outline" small>{ts('browse.apply', 'Apply')}</TechButton>
    </form>
  );
}

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  const nums: (number | '…')[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) nums.push(p);
    else if (nums[nums.length - 1] !== '…') nums.push('…');
  }
  const cell = 'grid size-9 cursor-pointer place-items-center rounded-full text-sm font-medium';
  return (
    <nav aria-label={ts('browse.pagination', 'Pagination')} className="mt-10 flex flex-wrap items-center justify-center gap-2">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label={ts('browse.prevPage', 'Previous page')} className={`${cell} disabled:opacity-40`} style={{ border: `1px solid ${t.colors.border}`, background: 'transparent', color: t.colors.ink }}>‹</button>
      {nums.map((n, i) => n === '…'
        ? <span key={`e${i}`} className="px-1 text-sm" style={{ color: t.colors.inkMuted }}>…</span>
        : <button key={n} type="button" aria-current={n === page ? 'page' : undefined} onClick={() => onPage(n)} className={cell} style={n === page ? { background: t.colors.accent, color: t.colors.accentInk, border: `1px solid ${t.colors.accent}` } : { border: `1px solid ${t.colors.border}`, background: 'transparent', color: t.colors.ink }}>{n}</button>)}
      <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label={ts('browse.nextPage', 'Next page')} className={`${cell} disabled:opacity-40`} style={{ border: `1px solid ${t.colors.border}`, background: 'transparent', color: t.colors.ink }}>›</button>
    </nav>
  );
}

/** Tech listing: filter sidebar on the left (a slide-in panel on phones), sort + grid/list switch on top, chips, pagination. */
export function TechProductBrowser({ heading, categoryId, collectionId, search, syncUrl = false, defaultSort, showFilters = true, emptyText, onProducts, sidebarExtra }: Props) {
  const { currency } = useCurrencyPreference();
  const { state, update, products, total, totalPages, facets, priceRange, loading, error, retry } = useProductBrowse({ categoryId, collectionId, search, syncUrl, defaultSort });
  const [view, setView] = useState<View>('grid');
  const [drawer, setDrawer] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const symbol = currencySymbol(currency);
  const active = hasActiveFilters(state);
  const drawerOnly = t.filterLayout === 'drawer';
  useEffect(() => { if (products) onProducts?.(products); }, [products, onProducts]);

  const change = (fn: (s: BrowseState) => BrowseState) => update(s => ({ ...fn(s), page: 1 }));
  const goPage = (page: number) => { update(s => ({ ...s, page })); topRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }); };

  const chips: { key: string; label: string; remove: () => void }[] = [];
  if (state.availability) chips.push({ key: 'a', label: state.availability === 'in_stock' ? ts('browse.inStock', 'In stock') : ts('browse.outOfStock', 'Out of stock'), remove: () => change(s => ({ ...s, availability: undefined })) });
  if (state.minPrice != null || state.maxPrice != null) chips.push({ key: 'p', label: `${moneyText(state.minPrice ?? 0, currency)} - ${state.maxPrice != null ? moneyText(state.maxPrice, currency) : ts('pg.and_up', 'and up')}`, remove: () => change(s => ({ ...s, minPrice: undefined, maxPrice: undefined })) });
  state.productTypes.forEach(v => chips.push({ key: `t:${v}`, label: PRODUCT_TYPE_LABEL[v] ?? v, remove: () => change(s => ({ ...s, productTypes: s.productTypes.filter(x => x !== v) })) }));
  Object.entries(state.options).forEach(([name, vals]) => vals.forEach(v => chips.push({ key: `o:${name}:${v}`, label: `${name}: ${v}`, remove: () => change(s => ({ ...s, options: toggleOption(s.options, name, v) })) })));
  state.tags.forEach(v => chips.push({ key: `g:${v}`, label: v, remove: () => change(s => ({ ...s, tags: s.tags.filter(x => x !== v) })) }));

  const filters = facets && showFilters ? (
    <>
      <FilterGroup title={ts('browse.availability', 'Availability')}>
        <Check label={ts('browse.inStock', 'In stock')} count={facets.availability.in_stock} checked={state.availability === 'in_stock'} onToggle={() => change(s => ({ ...s, availability: s.availability === 'in_stock' ? undefined : 'in_stock' }))} />
        <Check label={ts('browse.outOfStock', 'Out of stock')} count={facets.availability.out_of_stock} checked={state.availability === 'out_of_stock'} onToggle={() => change(s => ({ ...s, availability: s.availability === 'out_of_stock' ? undefined : 'out_of_stock' }))} />
      </FilterGroup>
      <FilterGroup title={ts('browse.price', 'Price')}>
        <PriceFilter key={`${state.minPrice ?? ''}-${state.maxPrice ?? ''}`} symbol={symbol} lowest={priceRange.min} highest={priceRange.max} minPrice={state.minPrice} maxPrice={state.maxPrice} onApply={(lo, hi) => change(s => ({ ...s, minPrice: lo, maxPrice: hi }))} />
      </FilterGroup>
      {(facets.productTypes.length > 1 || state.productTypes.length > 0) && (
        <FilterGroup title={ts('browse.productType', 'Product type')}>
          {facets.productTypes.map(o => <Check key={o.value} label={PRODUCT_TYPE_LABEL[o.value] ?? o.value} count={o.count} checked={state.productTypes.includes(o.value)} onToggle={() => change(s => ({ ...s, productTypes: toggleIn(s.productTypes, o.value) }))} />)}
        </FilterGroup>
      )}
      {facets.options.map(opt => (
        <FilterGroup key={opt.name} title={opt.name}>
          {opt.values.map(o => <Check key={o.value} label={o.value} count={o.count} checked={!!state.options[opt.name]?.includes(o.value)} onToggle={() => change(s => ({ ...s, options: toggleOption(s.options, opt.name, o.value) }))} />)}
        </FilterGroup>
      ))}
      {(facets.tags.length > 0 || state.tags.length > 0) && (
        <FilterGroup title={ts('browse.tags', 'Tags')}>
          {facets.tags.map(o => <Check key={o.value} label={o.value} count={o.count} checked={state.tags.includes(o.value)} onToggle={() => change(s => ({ ...s, tags: toggleIn(s.tags, o.value) }))} />)}
        </FilterGroup>
      )}
    </>
  ) : null;

  const from = total === 0 ? 0 : (state.page - 1) * BROWSE_PAGE_SIZE + 1;
  const to = Math.min(total, state.page * BROWSE_PAGE_SIZE);
  const toggleBtn = (v: View, icon: ReactNode, label: string) => (
    <button type="button" aria-pressed={view === v} aria-label={label} onClick={() => setView(v)} className="grid size-9 cursor-pointer place-items-center border-0 bg-transparent" style={{ color: view === v ? t.colors.ink : t.colors.border }}>{icon}</button>
  );

  return (
    <div ref={topRef} style={{ scrollMarginTop: 80, fontFamily: t.fonts.body, color: t.colors.ink }}>
      {heading}
      <div className={`grid gap-6 ${drawerOnly ? '' : 'lg:grid-cols-[220px_1fr]'}`}>
        {showFilters && !drawerOnly && (
          <aside className="hidden lg:block" aria-label={ts('browse.filters', 'Filters')}>
            <div className="p-4" style={{ background: t.colors.bgAlt }}>
              <p className="m-0 mb-2 text-center text-sm font-semibold">{ts('browse.filters', 'Filters')}</p>
              <TechButton variant="outline" small block disabled={!active} onClick={() => change(clearFilters)}>{ts('browse.clearFilter', 'Clear filter')}</TechButton>
              {filters}
            </div>
            {sidebarExtra}
          </aside>
        )}

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {showFilters && (
              <button type="button" onClick={() => setDrawer(true)} aria-haspopup="dialog" className={`tx-btn tx-btn-sm ${drawerOnly ? '' : 'lg:hidden!'}`} style={{ background: 'transparent', color: t.colors.ink, borderColor: t.colors.border, borderRadius: t.fieldRadiusPx }}>
                <SlidersHorizontal size={14} aria-hidden />{chips.length > 0 ? ts('browse.filterCount', 'Filter ({{count}})', { count: chips.length }) : ts('browse.filter', 'Filter')}
              </button>
            )}
            {products !== null && <span className="text-xs" style={{ color: t.colors.inkMuted }} aria-live="polite">{ts('browse.itemsRange', 'Items {{from}}-{{to}} of {{total}}', { from, to, total })}</span>}
            <div className="ms-auto flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs" style={{ color: t.colors.inkMuted }}>
                {ts('browse.sortBy', 'Sort by:')}
                <select value={state.sort} onChange={e => change(s => ({ ...s, sort: e.target.value as BrowseState['sort'] }))} className="px-2 py-2 text-[13px] font-medium" style={{ border: `1px solid ${t.colors.border}`, background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body, borderRadius: t.fieldRadiusPx }}>
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              <span className="hidden sm:inline-flex">
                {toggleBtn('grid', <LayoutGrid size={18} />, ts('browse.gridView', 'Grid view'))}
                {toggleBtn('list', <List size={18} />, ts('browse.listView', 'List view'))}
              </span>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {chips.map(c => (
                <button key={c.key} type="button" onClick={c.remove} aria-label={ts('browse.removeFilter', 'Remove filter: {{label}}', { label: c.label })} className="inline-flex cursor-pointer items-center gap-1.5 border px-3 py-1.5 text-xs font-medium" style={{ borderColor: t.colors.border, background: t.colors.bg, color: t.colors.ink, borderRadius: t.fieldRadiusPx }}>
                  {c.label}<X size={12} aria-hidden style={{ color: t.colors.danger }} />
                </button>
              ))}
              <button type="button" onClick={() => change(clearFilters)} className="cursor-pointer border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: t.colors.border, background: t.colors.bg, color: t.colors.ink, borderRadius: t.fieldRadiusPx }}>{ts('browse.clearAll', 'Clear all')}</button>
            </div>
          )}

          {products === null && !error && <div aria-busy="true" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-[320px] animate-pulse" style={{ background: t.colors.bgAlt }} />)}</div>}
          {error && <TechError message={error} onRetry={retry} />}
          {products !== null && products.length === 0 && !error && (
            <div className="grid place-items-center gap-3 px-6 py-14 text-center" style={{ background: t.colors.bgAlt }}>
              <p className="m-0 text-lg font-semibold">{active ? ts('browse.noProducts', 'No products found') : ts('browse.nothingYet', 'Nothing here yet')}</p>
              <p className="m-0 text-sm" style={{ color: t.colors.inkMuted }}>{active ? ts('browse.fewerFilters', 'Use fewer filters or remove all.') : (emptyText ?? ts('browse.tryDifferent', 'Try a different search or check back soon.'))}</p>
              {active && <TechButton onClick={() => change(clearFilters)}>{ts('browse.removeAllFilters', 'Remove all filters')}</TechButton>}
            </div>
          )}
          {products !== null && products.length > 0 && !error && (
            <div aria-busy={loading} style={{ opacity: loading ? 0.5 : 1, transition: 'opacity .15s' }}>
              {view === 'grid'
                ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{products.map(p => <TechProductCard key={p._id} product={p} currency={currency} />)}</div>
                : <div className="flex flex-col gap-3">{products.map(p => <TechProductCard key={p._id} product={p} currency={currency} layout="list" />)}</div>}
              {totalPages > 1 && <Pagination page={state.page} totalPages={totalPages} onPage={goPage} />}
            </div>
          )}
        </div>
      </div>

      {drawer && showFilters && <FilterDrawer onClose={() => setDrawer(false)} onClear={() => change(clearFilters)} active={active} total={total}>{filters}</FilterDrawer>}
    </div>
  );
}

function FilterDrawer({ onClose, onClear, active, total, children }: { onClose: () => void; onClear: () => void; active: boolean; total: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogFocus(ref, onClose);
  return (
    <div className="fixed inset-0 z-[60]">
      <button type="button" aria-label={ts('browse.close', 'Close')} onClick={onClose} className="absolute inset-0 border-0" style={{ background: 'rgba(2,2,3,.5)' }} />
      <div ref={ref} role="dialog" aria-modal="true" aria-label={ts('browse.filters', 'Filters')} className="absolute inset-y-0 end-0 flex w-[min(92vw,380px)] flex-col" style={{ background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${t.colors.border}` }}>
          <b>{ts('browse.filters', 'Filters')}</b>
          <button type="button" onClick={onClose} aria-label={ts('browse.close', 'Close')} className="grid size-9 cursor-pointer place-items-center border-0 bg-transparent" style={{ color: t.colors.ink }}><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-4">{children}</div>
        <div className="flex gap-3 p-4" style={{ borderTop: `1px solid ${t.colors.border}` }}>
          <TechButton variant="outline" block disabled={!active} onClick={onClear}>{ts('browse.clearFilter', 'Clear filter')}</TechButton>
          <TechButton block onClick={onClose}>{ts('browse.showItems', 'Show {{count}} items', { count: total })}</TechButton>
        </div>
      </div>
    </div>
  );
}
