/* eslint-disable react-hooks/set-state-in-effect, react-hooks/refs, jsx-a11y/no-autofocus, jsx-a11y/click-events-have-key-events */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { useStorefrontMarketOptional } from '@/features/storefront/storefrontMarket';
import { apiGetPublicStoreProducts, type PublicStoreFacets, type PublicStoreProduct } from '@/api/services/store';
import { DEFAULT_SORT, parseBrowseState, writeBrowseState, type BrowseSort, type BrowseState } from './browseState';
import { dropSsr, peekSsr, wantSsr } from '@/utils/ssrData';

interface BrowseSeed { products: PublicStoreProduct[]; total: number; totalPages: number; facets: PublicStoreFacets | null }

/** Key under which a server-rendered page carries a product listing's default (first) page. */
export function browseSsrKey(storeId: string, scope: { categoryId?: string; collectionId?: string; search?: string; pageSize?: number; defaultSort?: string }): string {
  return `browse:${storeId}:${scope.categoryId ?? ''}:${scope.collectionId ?? ''}:${scope.search ?? ''}:${scope.pageSize ?? BROWSE_PAGE_SIZE}:${scope.defaultSort ?? DEFAULT_SORT}`;
}

export const BROWSE_PAGE_SIZE = 12;
/** How many products one request asks for (seller-chosen, kept to a safe range). */
export const clampPageSize = (n: number) => Math.min(100, Math.max(4, Math.round(n) || BROWSE_PAGE_SIZE));

interface Scope { categoryId?: string; collectionId?: string; search?: string }

/** Filter/sort/page state for a product listing + the server query it drives.
 *  `syncUrl` keeps the state in the query string (history entries per change, so
 *  back/forward and shared links restore it); otherwise it lives in memory (used
 *  by listings embedded in the home page where the URL must stay untouched). */
export function useProductBrowse({ categoryId, collectionId, search, syncUrl, defaultSort = DEFAULT_SORT, pageSize = BROWSE_PAGE_SIZE, accumulate = false }: Scope & {
  syncUrl: boolean; defaultSort?: BrowseSort; pageSize?: number;
  /** "Load more" / infinite scroll: later pages are added to the list instead of replacing it. */
  accumulate?: boolean;
}) {
  const { store } = useStorefront();
  const { currency, convert } = useCurrencyPreference();
  // The buyer's market: the server prices, filters and sorts by the price this buyer SEES (market rule, fixed prices),
  // so the request carries the currency + market instead of converting the typed price back to the store currency.
  const marketCtx = useStorefrontMarketOptional();
  const marketId = marketCtx?.market?.id;
  const marketsReady = marketCtx ? marketCtx.loaded : true;
  const [urlParams, setUrlParams] = useSearchParams();
  const [localParams, setLocalParams] = useState(() => new URLSearchParams());
  const params = syncUrl ? urlParams : localParams;
  const paramsKey = params.toString();
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const state = useMemo(() => {
    const parsed = parseBrowseState(new URLSearchParams(paramsKey));
    return new URLSearchParams(paramsKey).has('sort_by') ? parsed : { ...parsed, sort: defaultSort };
  }, [paramsKey, defaultSort]);

  const update = useCallback((fn: (s: BrowseState) => BrowseState, opts?: { replace?: boolean }) => {
    const currentParams = paramsRef.current;
    const current = parseBrowseState(currentParams);
    if (!currentParams.has('sort_by')) current.sort = defaultSort;
    const next = writeBrowseState(currentParams, fn(current));
    if (syncUrl) setUrlParams(next, { replace: opts?.replace });
    else setLocalParams(next);
  }, [syncUrl, setUrlParams, defaultSort]);

  // In-memory listings start fresh when their scope changes.
  useEffect(() => { if (!syncUrl) setLocalParams(new URLSearchParams()); }, [syncUrl, categoryId, collectionId, search]);

  // A server-rendered page carries the DEFAULT listing (page 1, default sort, no filters). It is used for the first render only,
  // and only when the address has no filters of its own; the effect below then skips its first request.
  const ssrKey = paramsKey === '' ? browseSsrKey(store.storeId, { categoryId, collectionId, search, pageSize, defaultSort }) : undefined;
  const [seeded] = useState(() => peekSsr<BrowseSeed>(ssrKey));
  const skipFirst = useRef(seeded !== undefined);
  const [products, setProducts] = useState<PublicStoreProduct[] | null>(seeded?.products ?? null);
  const [total, setTotal] = useState(seeded?.total ?? 0);
  const [totalPages, setTotalPages] = useState(seeded?.totalPages ?? 1);
  const [facets, setFacets] = useState<PublicStoreFacets | null>(seeded?.facets ?? null);
  const [loading, setLoading] = useState(seeded === undefined);
  const [error, setError] = useState('');
  const [nonce, setNonce] = useState(0);
  // Server collecting pass: ask for the default listing (no effect runs on the server).
  if (seeded === undefined && ssrKey) {
    wantSsr(ssrKey, () => apiGetPublicStoreProducts(store.storeId, { page: 1, limit: clampPageSize(pageSize), sort: defaultSort, categoryId, collectionId, search, facets: true })
      .then(res => ({ products: res.data?.products ?? [], total: res.data?.pagination?.total ?? 0, totalPages: Math.max(1, res.data?.pagination?.totalPages ?? 1), facets: res.data?.facets ?? null })));
  }
  const scopeKey = `${categoryId ?? ''}|${collectionId ?? ''}|${search ?? ''}`;
  const lastScope = useRef(scopeKey);
  useEffect(() => {
    if (lastScope.current === scopeKey) return; // not on mount: a seeded first render must keep its products
    lastScope.current = scopeKey;
    setFacets(null); setProducts(null);
  }, [scopeKey]);

  const baseCurrency = String(store.baseCurrency ?? currency);
  // The facet price range in the buyer's currency. The server prices it for this buyer (currency + market sent below);
  // a store-currency range (rates missing server-side) is converted here as before.
  const facetPrice = facets?.price;
  const priceRange = useMemo(() => {
    if (!facetPrice) return { min: null as number | null, max: null as number | null };
    if (facetPrice.currency === currency) return { min: facetPrice.min, max: facetPrice.max };
    const conv = (n: number | null) => (n == null ? null : convert(n, facetPrice.currency ?? baseCurrency));
    return { min: conv(facetPrice.min), max: conv(facetPrice.max) };
  }, [facetPrice, currency, baseCurrency, convert]);

  useEffect(() => {
    if (!marketsReady) return; // the market decides the prices: wait for it
    if (skipFirst.current) {
      skipFirst.current = false;
      if (ssrKey) dropSsr(ssrKey);
      // The server copy is in the store's own currency with no market: right for a visitor who sees exactly that.
      if (!marketId && currency === baseCurrency) return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    setError('');
    apiGetPublicStoreProducts(store.storeId, {
      page: state.page, limit: clampPageSize(pageSize), sort: state.sort, categoryId, collectionId, search,
      availability: state.availability, minPrice: state.minPrice, maxPrice: state.maxPrice, currency, marketId,
      productTypes: state.productTypes, tags: state.tags, vendors: state.vendors, options: state.options, facets: true,
    }, ctrl.signal)
      .then(res => {
        const list = res.data?.products ?? [];
        setProducts(prev => (accumulate && state.page > 1 && prev ? [...prev, ...list.filter(p => !prev.some(q => q._id === p._id))] : list));
        setTotal(res.data?.pagination?.total ?? 0);
        setTotalPages(Math.max(1, res.data?.pagination?.totalPages ?? 1));
        if (res.data?.facets) setFacets(res.data.facets);
        setLoading(false);
      })
      .catch(err => {
        if (ctrl.signal.aborted || err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
        setError('Could not load products right now.');
        setLoading(false);
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.storeId, paramsKey, categoryId, collectionId, search, nonce, currency, marketId, marketsReady, pageSize]);

  // A shared link may point past the last page once filters narrow the list.
  useEffect(() => {
    if (!loading && products && state.page > totalPages) update(s => ({ ...s, page: totalPages }), { replace: true });
  }, [loading, products, state.page, totalPages, update]);

  return {
    state, update, products, total, totalPages, facets, priceRange, loading, error,
    retry: () => setNonce(n => n + 1),
    currency,
  };
}
