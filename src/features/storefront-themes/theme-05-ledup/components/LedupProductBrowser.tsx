import { useState, type FormEvent } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { clampPageSize, useProductBrowse } from '@/features/storefront/browse/useProductBrowse';
import { PRODUCT_TYPE_LABEL, SORT_OPTIONS, clearFilters, hasActiveFilters, toggleIn, toggleOption, type BrowseSort, type BrowseState } from '@/features/storefront/browse/browseState';
import { moneyText } from '../../core/money';
import { LedupSkeleton, LedupError } from '../ui/ledupUi';
import { LedupProductCard } from './LedupProductCard';
import { LedupFilterCheck, LedupFilterGroup, LedupFilterShell } from './LedupFilterSidebar';

const PAGE_SIZE = 12;

function PriceFilter({ symbol, lowest, highest, minPrice, maxPrice, onApply }: { symbol: string; lowest: number | null; highest: number | null; minPrice?: number; maxPrice?: number; onApply: (lo?: number, hi?: number) => void }) {
  const [lo, setLo] = useState(minPrice != null ? String(minPrice) : '');
  const [hi, setHi] = useState(maxPrice != null ? String(maxPrice) : '');
  const num = (s: string) => { const n = s.trim() === '' ? undefined : Number(s); return n != null && Number.isFinite(n) ? n : undefined; };
  const submit = (e: FormEvent) => { e.preventDefault(); onApply(num(lo), num(hi)); };
  const field = 'w-full rounded-full border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 focus:border-stone-400 focus:outline-none';
  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="ld-min">{ts('browse.minPrice', 'Minimum price')}</label>
        <input id="ld-min" inputMode="decimal" value={lo} onChange={e => setLo(e.target.value)} placeholder={lowest != null ? `${symbol}${Math.floor(lowest)}` : symbol} className={field} />
        <span aria-hidden>–</span>
        <label className="sr-only" htmlFor="ld-max">{ts('browse.maxPrice', 'Maximum price')}</label>
        <input id="ld-max" inputMode="decimal" value={hi} onChange={e => setHi(e.target.value)} placeholder={highest != null ? `${symbol}${Math.ceil(highest)}` : symbol} className={field} />
      </div>
      <button type="submit" className="cursor-pointer self-start rounded-full border border-stone-300 bg-white px-4 py-1.5 text-xs font-semibold text-stone-800 hover:border-stone-900">{ts('browse.apply', 'Apply')}</button>
    </form>
  );
}

/** Product list for a collection, category or search: real filters from the store's own products (stock, price, type, options, tags), sort, count and a "Load more" button. */
export function LedupProductBrowser({ categoryId, collectionId, search, syncUrl = true, emptyText }: { categoryId?: string; collectionId?: string; search?: string; syncUrl?: boolean; emptyText?: string }) {
  const pageSize = clampPageSize(PAGE_SIZE);
  const { state, update, products, total, totalPages, facets, priceRange, loading, error, retry, currency } = useProductBrowse({ categoryId, collectionId, search, syncUrl, pageSize, accumulate: true });
  const [mobileFilters, setMobileFilters] = useState(false);

  const change = (fn: (s: BrowseState) => BrowseState) => update(s => ({ ...fn(s), page: 1 }));
  const loadMore = () => update(s => ({ ...s, page: s.page + 1 }));
  const canMore = products !== null && state.page < totalPages;
  const symbol = moneyText(0, currency).replace(/[\d.,\s]/g, '');

  const filters = facets && (
    <LedupFilterShell canClear={hasActiveFilters(state)} onClear={() => change(clearFilters)}>
      {(facets.availability.in_stock + facets.availability.out_of_stock > 0) && (
        <LedupFilterGroup title={ts('browse.availability', 'Availability')}>
          <LedupFilterCheck label={ts('browse.inStock', 'In stock')} count={facets.availability.in_stock} checked={state.availability === 'in_stock'} onToggle={() => change(s => ({ ...s, availability: s.availability === 'in_stock' ? undefined : 'in_stock' }))} />
          <LedupFilterCheck label={ts('browse.outOfStock', 'Out of stock')} count={facets.availability.out_of_stock} checked={state.availability === 'out_of_stock'} onToggle={() => change(s => ({ ...s, availability: s.availability === 'out_of_stock' ? undefined : 'out_of_stock' }))} />
        </LedupFilterGroup>
      )}
      {(priceRange.min != null || state.minPrice != null || state.maxPrice != null) && (
        <LedupFilterGroup title={ts('browse.price', 'Price')}>
          <PriceFilter key={`${state.minPrice ?? ''}-${state.maxPrice ?? ''}`} symbol={symbol} lowest={priceRange.min} highest={priceRange.max} minPrice={state.minPrice} maxPrice={state.maxPrice} onApply={(lo, hi) => change(s => ({ ...s, minPrice: lo, maxPrice: hi }))} />
        </LedupFilterGroup>
      )}
      {(facets.productTypes.length > 1 || state.productTypes.length > 0) && (
        <LedupFilterGroup title={ts('browse.productType', 'Product type')}>
          {facets.productTypes.map(o => <LedupFilterCheck key={o.value} label={PRODUCT_TYPE_LABEL[o.value] ?? o.value} count={o.count} checked={state.productTypes.includes(o.value)} onToggle={() => change(s => ({ ...s, productTypes: toggleIn(s.productTypes, o.value) }))} />)}
        </LedupFilterGroup>
      )}
      {facets.options.map(opt => (
        <LedupFilterGroup key={opt.name} title={opt.name}>
          {opt.values.map(o => <LedupFilterCheck key={o.value} label={o.value} count={o.count} checked={!!state.options[opt.name]?.includes(o.value)} onToggle={() => change(s => ({ ...s, options: toggleOption(s.options, opt.name, o.value) }))} />)}
        </LedupFilterGroup>
      ))}
      {(facets.tags.length > 0 || state.tags.length > 0) && (
        <LedupFilterGroup title={ts('browse.tags', 'Tags')} defaultOpen={false}>
          {facets.tags.map(o => <LedupFilterCheck key={o.value} label={o.value} count={o.count} checked={state.tags.includes(o.value)} onToggle={() => change(s => ({ ...s, tags: toggleIn(s.tags, o.value) }))} />)}
        </LedupFilterGroup>
      )}
    </LedupFilterShell>
  );

  const shown = products?.length ?? 0;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between border-b border-stone-200 pb-4">
        <p className="m-0 text-xs font-medium text-stone-500" aria-live="polite">
          {ts('browse.showingCount', 'Showing {{shown}} of {{total}} products', { shown, total })}
        </p>
        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <label htmlFor="ld-sort" className="me-2 text-xs font-medium text-stone-500">{ts('browse.sortBy', 'Sort by:')}</label>
            <select id="ld-sort" value={state.sort} onChange={e => change(s => ({ ...s, sort: e.target.value as BrowseSort }))}
              className="cursor-pointer appearance-none rounded-full border border-stone-200 bg-stone-50/70 py-1.5 ps-3 pe-8 text-xs font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-400">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute end-2.5 text-stone-400" aria-hidden />
          </div>
          <button type="button" aria-expanded={mobileFilters} aria-label={ts('browse.filters', 'Filters')} onClick={() => setMobileFilters(v => !v)} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-stone-100 text-stone-700 md:hidden">
            <SlidersHorizontal size={14} aria-hidden />
          </button>
        </div>
      </div>

      <div className="flex flex-col items-start gap-10 md:flex-row">
        <div className={`${mobileFilters ? 'block' : 'hidden'} w-full md:block md:w-auto`}>{filters}</div>

        <div className="min-w-0 flex-1">
          {error ? (
            <LedupError message={error} onRetry={retry} />
          ) : products === null ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <LedupSkeleton key={i} h={320} />)}</div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-12 text-center text-stone-500">{emptyText ?? ts('browse.noProducts', 'No products found.')}</div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {products.map(p => <LedupProductCard key={p._id} product={p} currency={currency} />)}
              </div>
              {canMore && (
                <div className="mt-12 flex justify-center">
                  <button type="button" disabled={loading} onClick={loadMore} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-stone-300 bg-white px-8 py-3 text-xs font-semibold tracking-wider text-stone-800 shadow-sm transition hover:border-stone-900 hover:bg-stone-50 disabled:opacity-60">
                    {loading ? ts('browse.loadingMore', 'Loading…') : ts('browse.loadMore', 'Load more')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
