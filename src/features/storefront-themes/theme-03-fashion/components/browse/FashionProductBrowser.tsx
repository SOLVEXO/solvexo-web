import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { currencySymbol } from '@/utils/currency';
import { moneyText } from '../../../core/money';
import type { PublicStoreProduct } from '@/api/services/store';
import {
  PRODUCT_TYPE_LABEL, SORT_OPTIONS, clearFilters, hasActiveFilters, toggleIn, toggleOption,
  type BrowseState,
} from '@/features/storefront/browse/browseState';
import { useProductBrowse } from '@/features/storefront/browse/useProductBrowse';
import { responsiveGridColumnsClass } from '@/features/storefront/browse/gridLayout';
import { fashionTheme as t } from '../../theme.config';
import { BrowseButton, BrowsePagination, BrowseSkeleton, CheckRow, FilterDrawer, PriceFields, type FacetGroup } from './FashionFilterParts';
import { ts } from '@/utils/tStatic';

interface Props {
  renderCard: (p: PublicStoreProduct, currency: string) => ReactNode;
  heading?: string;
  categoryId?: string;
  collectionId?: string;
  search?: string;
  /** Keep filters/sort/page in the URL (collection, category, search pages). */
  syncUrl?: boolean;
  /** Theme section settings; omitted values keep the storefront defaults. */
  defaultSort?: BrowseState['sort'];
  columns?: 2 | 3 | 4;
  showFilters?: boolean;
  emptyText?: string;
  /** Reports the products currently shown (used for the collection's structured data). */
  onProducts?: (products: PublicStoreProduct[]) => void;
}

/** Maison product listing: facet pills with popovers (drawer on phones), sort, active chips, grid, pagination. */
export function FashionProductBrowser({ renderCard, heading, categoryId, collectionId, search, syncUrl = false, defaultSort, columns, showFilters = true, emptyText, onProducts }: Props) {
  const { t: tr } = useTranslation('storefront');
  const { store } = useStorefront();
  const { currency, convert } = useCurrencyPreference();
  const { state, update, products, total, totalPages, facets, loading, error, retry } = useProductBrowse({ categoryId, collectionId, search, syncUrl, defaultSort });
  const [open, setOpen] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const baseCurrency = String(store.baseCurrency ?? currency);
  const symbol = currencySymbol(currency);
  const active = hasActiveFilters(state);
  useEffect(() => { if (products) onProducts?.(products); }, [products, onProducts]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null); };
    const onDown = (e: MouseEvent) => { if (barRef.current && !barRef.current.contains(e.target as Node)) setOpen(null); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); };
  }, [open]);

  const goPage = (page: number) => {
    update(s => ({ ...s, page }));
    topRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };
  const change = (fn: (s: BrowseState) => BrowseState) => update(s => ({ ...fn(s), page: 1 }));

  const fromBase = (n: number | null | undefined) => (n == null ? null : convert(n, baseCurrency));
  const priceMin = fromBase(facets?.price.min);
  const priceMax = fromBase(facets?.price.max);

  // Facet group model shared by the desktop popovers and the phone drawer.
  const groups: FacetGroup[] = [];
  const row = (key: string, label: string, count: number, checked: boolean, onToggle: () => void) => <CheckRow key={key} label={label} count={count} checked={checked} onToggle={onToggle} />;

  if (facets) {
    groups.push({
      id: 'availability', label: tr('browse.availability', 'Availability'), count: state.availability ? 1 : 0,
      body: (
        <>
          {row('in', tr('browse.inStock', 'In stock'), facets.availability.in_stock, state.availability === 'in_stock', () => change(s => ({ ...s, availability: s.availability === 'in_stock' ? undefined : 'in_stock' })))}
          {row('out', tr('browse.outOfStock', 'Out of stock'), facets.availability.out_of_stock, state.availability === 'out_of_stock', () => change(s => ({ ...s, availability: s.availability === 'out_of_stock' ? undefined : 'out_of_stock' })))}
        </>
      ),
    });
    groups.push({
      id: 'price', label: tr('browse.price', 'Price'), count: state.minPrice != null || state.maxPrice != null ? 1 : 0,
      body: (
        <PriceFields key={`${state.minPrice ?? ''}-${state.maxPrice ?? ''}`} symbol={symbol} currency={currency} highest={priceMax} lowest={priceMin}
          minPrice={state.minPrice} maxPrice={state.maxPrice} onApply={(lo, hi) => change(s => ({ ...s, minPrice: lo, maxPrice: hi }))} />
      ),
    });
    if (facets.productTypes.length > 1 || state.productTypes.length) {
      groups.push({
        id: 'type', label: tr('browse.productType', 'Product type'), count: state.productTypes.length,
        body: facets.productTypes.map(o => row(o.value, PRODUCT_TYPE_LABEL[o.value] ?? o.value, o.count, state.productTypes.includes(o.value), () => change(s => ({ ...s, productTypes: toggleIn(s.productTypes, o.value) })))),
      });
    }
    for (const opt of facets.options) {
      groups.push({
        id: `opt:${opt.name}`, label: opt.name, count: state.options[opt.name]?.length ?? 0,
        body: opt.values.map(o => row(o.value, o.value, o.count, !!state.options[opt.name]?.includes(o.value), () => change(s => ({ ...s, options: toggleOption(s.options, opt.name, o.value) })))),
      });
    }
    if (facets.tags.length || state.tags.length) {
      groups.push({
        id: 'tag', label: tr('browse.tags', 'Tags'), count: state.tags.length,
        body: facets.tags.map(o => row(o.value, o.value, o.count, state.tags.includes(o.value), () => change(s => ({ ...s, tags: toggleIn(s.tags, o.value) })))),
      });
    }
  }

  // Active filter chips.
  const chips: { key: string; label: string; remove: () => void }[] = [];
  if (state.availability) chips.push({ key: 'avail', label: tr('browse.availabilityChip', 'Availability: {{value}}', { value: state.availability === 'in_stock' ? tr('browse.inStock', 'In stock') : tr('browse.outOfStock', 'Out of stock') }), remove: () => change(s => ({ ...s, availability: undefined })) });
  if (state.minPrice != null || state.maxPrice != null) {
    chips.push({
      key: 'price',
      label: `${moneyText(state.minPrice ?? 0, currency)} - ${state.maxPrice != null ? moneyText(state.maxPrice, currency) : ts('pg.and_up', 'and up')}`,
      remove: () => change(s => ({ ...s, minPrice: undefined, maxPrice: undefined })),
    });
  }
  state.productTypes.forEach(v => chips.push({ key: `t:${v}`, label: PRODUCT_TYPE_LABEL[v] ?? v, remove: () => change(s => ({ ...s, productTypes: s.productTypes.filter(x => x !== v) })) }));
  Object.entries(state.options).forEach(([name, vals]) => vals.forEach(v => chips.push({ key: `o:${name}:${v}`, label: `${name}: ${v}`, remove: () => change(s => ({ ...s, options: toggleOption(s.options, name, v) })) })));
  state.tags.forEach(v => chips.push({ key: `g:${v}`, label: v, remove: () => change(s => ({ ...s, tags: s.tags.filter(x => x !== v) })) }));

  const sortLabel = SORT_OPTIONS.find(o => o.value === state.sort)?.label;
  const first = products === null;

  const pill = 'flex h-11 cursor-pointer items-center gap-2 rounded-full bg-transparent px-5 text-sm font-medium transition-colors hover:bg-[color-mix(in_srgb,currentColor_8%,transparent)]';
  const pillStyle = (on: boolean) => ({ border: `1px solid ${on ? t.colors.selected : t.colors.border}`, color: t.colors.ink, fontFamily: t.fonts.body }) as const;
  const popover = 'fx-pop absolute top-[calc(100%+8px)] z-20 max-h-[360px] overflow-y-auto p-1.5';
  const popoverStyle = { background: t.colors.bg, border: `1px solid ${t.colors.border}`, borderRadius: 20, boxShadow: '0 18px 48px rgba(0,0,0,.14)' } as const;

  return (
    <div ref={topRef} style={{ scrollMarginTop: 80, fontFamily: t.fonts.body, color: t.colors.ink }}>
      {heading && <h1 className="m-0 mb-7 text-[clamp(26px,3.4vw,40px)] font-medium leading-tight tracking-tight" style={{ fontFamily: t.fonts.display }}>{heading}</h1>}

      <div ref={barRef} className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {showFilters && (
          <div className="hidden flex-wrap items-center gap-2.5 md:flex">
            {groups.map(g => (
              <div key={g.id} className="relative">
                <button type="button" aria-expanded={open === g.id} aria-haspopup="true" onClick={() => setOpen(o => (o === g.id ? null : g.id))} className={pill} style={pillStyle(g.count > 0 || open === g.id)}>
                  {g.label}{g.count > 0 && <span className="grid size-5 place-items-center rounded-full text-[11px] font-semibold" style={{ background: t.colors.accent, color: t.colors.accentInk }}>{g.count}</span>}
                  <ChevronDown size={14} aria-hidden="true" />
                </button>
                {open === g.id && <div className={`${popover} left-0`} style={{ ...popoverStyle, minWidth: g.id === 'price' ? 300 : 230 }}>{g.body}</div>}
              </div>
            ))}
          </div>
        )}

        {showFilters && (
          <button type="button" className={`${pill} md:hidden`} style={pillStyle(chips.length > 0)} onClick={() => setDrawer(true)} aria-haspopup="dialog">
            <SlidersHorizontal size={15} aria-hidden="true" />
            {chips.length > 0 ? tr('browse.filterCount', 'Filter and sort ({{count}})', { count: chips.length }) : tr('browse.filterAndSort', 'Filter and sort')}
          </button>
        )}

        <div className="ml-auto flex items-center gap-4">
          {!first && <span className="text-sm" style={{ color: t.colors.inkMuted }} aria-live="polite">{ts('pg.products_count', '{{count}} products', { count: total })}</span>}
          <div className="relative hidden md:block">
            <button type="button" aria-expanded={open === 'sort'} aria-haspopup="listbox" aria-label={tr('browse.sortByAria', 'Sort by')} onClick={() => setOpen(o => (o === 'sort' ? null : 'sort'))} className={pill} style={pillStyle(open === 'sort')}>
              <span style={{ color: t.colors.inkMuted }}>{tr('browse.sortBy', 'Sort by:')}</span> {sortLabel} <ChevronDown size={14} aria-hidden="true" />
            </button>
            {open === 'sort' && (
              <div role="listbox" aria-label={tr('browse.sortByAria', 'Sort by')} className={`${popover} right-0 min-w-[240px]`} style={popoverStyle}>
                {SORT_OPTIONS.map(o => (
                  <button key={o.value} type="button" role="option" aria-selected={o.value === state.sort} onClick={() => { change(s => ({ ...s, sort: o.value })); setOpen(null); }}
                    className="block w-full cursor-pointer rounded-xl border-0 bg-transparent px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-[color-mix(in_srgb,currentColor_8%,transparent)]" style={{ fontWeight: o.value === state.sort ? 600 : 400, color: t.colors.ink }}>
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {chips.map(c => (
            <button key={c.key} type="button" onClick={c.remove} aria-label={tr('browse.removeFilter', 'Remove filter: {{label}}', { label: c.label })}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border-0 py-1.5 pl-3.5 pr-2.5 text-[13px] font-medium" style={{ background: t.colors.bgAlt, color: t.colors.ink }}>
              {c.label} <X size={13} aria-hidden="true" />
            </button>
          ))}
          <button type="button" onClick={() => change(clearFilters)} className="cursor-pointer border-0 bg-transparent px-2 text-[13px] underline" style={{ color: t.colors.ink }}>{tr('browse.removeAll', 'Remove all')}</button>
        </div>
      )}

      {first && !error && <BrowseSkeleton columns={columns} />}

      {error && (
        <div role="alert" className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="m-0 text-sm" style={{ color: t.colors.danger }}>{error}</p>
          <BrowseButton onClick={retry}>{tr('orders.tryAgain', 'Try again')}</BrowseButton>
        </div>
      )}

      {products !== null && products.length === 0 && !error && (
        <div className="flex flex-col items-center px-6 py-20 text-center" style={{ background: t.colors.bgAlt, borderRadius: 24 }}>
          <p className="m-0 mb-1.5 text-xl font-medium tracking-tight">{active ? tr('browse.noProducts', 'No products found') : tr('browse.nothingYet', 'Nothing here yet')}</p>
          <p className={`m-0 text-sm ${active ? 'mb-5' : ''}`} style={{ color: t.colors.inkMuted }}>
            {active ? tr('browse.fewerFilters', 'Use fewer filters or remove all.') : (emptyText ?? tr('browse.tryDifferent', 'Try a different search or check back soon.'))}
          </p>
          {active && <BrowseButton onClick={() => change(clearFilters)} solid>{tr('browse.removeAllFilters', 'Remove all filters')}</BrowseButton>}
        </div>
      )}

      {products !== null && products.length > 0 && !error && (
        <div aria-busy={loading} style={{ opacity: loading ? 0.5 : 1, transition: 'opacity .15s' }}>
          <div className={`grid ${responsiveGridColumnsClass(columns)} fx-grid-gap`}>
            {products.map(p => <div key={p._id}>{renderCard(p, currency)}</div>)}
          </div>
          {totalPages > 1 && <BrowsePagination page={state.page} totalPages={totalPages} onPage={goPage} />}
        </div>
      )}

      {showFilters && drawer && (
        <FilterDrawer onClose={() => setDrawer(false)} total={total} active={active} onClear={() => change(clearFilters)}
          groups={groups} sort={state.sort} onSort={v => change(s => ({ ...s, sort: v }))} facets={facets} />
      )}
    </div>
  );
}
