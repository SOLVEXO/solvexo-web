/* eslint-disable react-hooks/set-state-in-effect, react-hooks/refs, jsx-a11y/no-autofocus, jsx-a11y/click-events-have-key-events */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { apiGetPublicStoreProducts, type PublicStoreFacets, type PublicStoreProduct } from '@/api/services/store';
import { DEFAULT_SORT, parseBrowseState, writeBrowseState, type BrowseSort, type BrowseState } from './browseState';

export const BROWSE_PAGE_SIZE = 12;

interface Scope { categoryId?: string; collectionId?: string; search?: string }

/** Filter/sort/page state for a product listing + the server query it drives.
 *  `syncUrl` keeps the state in the query string (history entries per change, so
 *  back/forward and shared links restore it); otherwise it lives in memory (used
 *  by listings embedded in the home page where the URL must stay untouched). */
export function useProductBrowse({ categoryId, collectionId, search, syncUrl, defaultSort = DEFAULT_SORT }: Scope & { syncUrl: boolean; defaultSort?: BrowseSort }) {
  const { store } = useStorefront();
  const { currency, convert, ratesLoaded } = useCurrencyPreference();
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

  const [products, setProducts] = useState<PublicStoreProduct[] | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [facets, setFacets] = useState<PublicStoreFacets | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nonce, setNonce] = useState(0);
  useEffect(() => { setFacets(null); setProducts(null); }, [categoryId, collectionId, search]);

  const baseCurrency = String(store.baseCurrency ?? currency);
  // buyer-currency amount -> store (catalogue) currency. null = rates not ready yet.
  const toBase = useCallback((amount: number | undefined): number | undefined | null => {
    if (amount == null) return undefined;
    if (currency === baseCurrency) return amount;
    if (!ratesLoaded) return null;
    const perBase = convert(1000, baseCurrency) / 1000;
    return perBase > 0 ? Math.round((amount / perBase) * 100) / 100 : amount;
  }, [currency, baseCurrency, ratesLoaded, convert]);

  const wantsPrice = state.minPrice != null || state.maxPrice != null;
  useEffect(() => {
    const min = toBase(state.minPrice);
    const max = toBase(state.maxPrice);
    if (min === null || max === null) return; // wait for exchange rates
    const ctrl = new AbortController();
    setLoading(true);
    setError('');
    apiGetPublicStoreProducts(store.storeId, {
      page: state.page, limit: BROWSE_PAGE_SIZE, sort: state.sort, categoryId, collectionId, search,
      availability: state.availability, minPrice: min, maxPrice: max,
      productTypes: state.productTypes, tags: state.tags, options: state.options, facets: true,
    }, ctrl.signal)
      .then(res => {
        setProducts(res.data?.products ?? []);
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
  }, [store.storeId, paramsKey, categoryId, collectionId, search, nonce, wantsPrice ? ratesLoaded : 0, currency]);

  // A shared link may point past the last page once filters narrow the list.
  useEffect(() => {
    if (!loading && products && state.page > totalPages) update(s => ({ ...s, page: totalPages }), { replace: true });
  }, [loading, products, state.page, totalPages, update]);

  return {
    state, update, products, total, totalPages, facets, loading, error,
    retry: () => setNonce(n => n + 1),
    currency,
  };
}
