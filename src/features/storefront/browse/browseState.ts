import type { PublicStoreProductsParams } from '@/api/services/store';

/**
 * URL <-> filter state for storefront product listings (collection, category,
 * search). Shopify Storefront Filtering URL shape:
 *   ?filter.v.availability=1|0
 *   &filter.v.price.gte=10&filter.v.price.lte=50      (buyer's display currency)
 *   &filter.p.product_type=digital  (repeatable)
 *   &filter.p.tag=summer            (repeatable)
 *   &filter.v.option.color=Red      (repeatable, one key per option name)
 *   &sort_by=price-ascending&page=2
 * Anything else in the query string (`q`, ...) is preserved untouched.
 */

export type BrowseSort = NonNullable<PublicStoreProductsParams['sort']>;
export type BrowseAvailability = NonNullable<PublicStoreProductsParams['availability']>;

export interface BrowseState {
  sort: BrowseSort;
  page: number;
  availability?: BrowseAvailability;
  /** Buyer display currency amounts (what the inputs show / the URL carries). */
  minPrice?: number;
  maxPrice?: number;
  productTypes: string[];
  tags: string[];
  options: Record<string, string[]>;
}

export const DEFAULT_SORT: BrowseSort = 'newest';

const SORT_TO_URL: Record<BrowseSort, string> = {
  newest: 'manual',
  oldest: 'created-ascending',
  title_asc: 'title-ascending',
  title_desc: 'title-descending',
  price_asc: 'price-ascending',
  price_desc: 'price-descending',
  best_rated: 'rating-descending',
};
const URL_TO_SORT: Record<string, BrowseSort> = {
  ...Object.fromEntries(Object.entries(SORT_TO_URL).map(([k, v]) => [v, k as BrowseSort])),
  'created-descending': 'newest',
  'best-selling': 'newest',
};

export const SORT_OPTIONS: { value: BrowseSort; label: string }[] = [
  { value: 'newest', label: 'Featured' },
  { value: 'best_rated', label: 'Best rated' },
  { value: 'title_asc', label: 'Alphabetically, A-Z' },
  { value: 'title_desc', label: 'Alphabetically, Z-A' },
  { value: 'price_asc', label: 'Price, low to high' },
  { value: 'price_desc', label: 'Price, high to low' },
  { value: 'oldest', label: 'Date, old to new' },
];

export const PRODUCT_TYPE_LABEL: Record<string, string> = { physical: 'Physical', digital: 'Digital', educational: 'Educational' };

const K_AVAIL = 'filter.v.availability';
const K_GTE = 'filter.v.price.gte';
const K_LTE = 'filter.v.price.lte';
const K_TYPE = 'filter.p.product_type';
const K_TAG = 'filter.p.tag';
const K_OPT = 'filter.v.option.';

const num = (v: string | null): number | undefined => {
  if (v == null || v.trim() === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

export function parseBrowseState(sp: URLSearchParams): BrowseState {
  const options: Record<string, string[]> = {};
  for (const key of new Set(sp.keys())) {
    if (!key.startsWith(K_OPT)) continue;
    const name = key.slice(K_OPT.length);
    const values = sp.getAll(key).filter(Boolean);
    if (name && values.length) options[name] = values;
  }
  const avail = sp.get(K_AVAIL);
  const page = Math.floor(Number(sp.get('page')));
  return {
    sort: URL_TO_SORT[sp.get('sort_by') ?? ''] ?? DEFAULT_SORT,
    page: Number.isFinite(page) && page >= 1 ? page : 1,
    availability: avail === '1' ? 'in_stock' : avail === '0' ? 'out_of_stock' : undefined,
    minPrice: num(sp.get(K_GTE)),
    maxPrice: num(sp.get(K_LTE)),
    productTypes: sp.getAll(K_TYPE).filter(Boolean),
    tags: sp.getAll(K_TAG).filter(Boolean),
    options,
  };
}

/** Writes `state` into a copy of `base`, replacing every filter/sort/page key and keeping the rest. */
export function writeBrowseState(base: URLSearchParams, state: BrowseState): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [k, v] of base.entries()) {
    if (k.startsWith('filter.') || k === 'sort_by' || k === 'page') continue;
    sp.append(k, v);
  }
  if (state.availability) sp.set(K_AVAIL, state.availability === 'in_stock' ? '1' : '0');
  if (state.minPrice != null) sp.set(K_GTE, String(state.minPrice));
  if (state.maxPrice != null) sp.set(K_LTE, String(state.maxPrice));
  state.productTypes.forEach(v => sp.append(K_TYPE, v));
  state.tags.forEach(v => sp.append(K_TAG, v));
  for (const [name, values] of Object.entries(state.options)) values.forEach(v => sp.append(K_OPT + name, v));
  if (state.sort !== DEFAULT_SORT) sp.set('sort_by', SORT_TO_URL[state.sort]);
  if (state.page > 1) sp.set('page', String(state.page));
  return sp;
}

export function hasActiveFilters(s: BrowseState): boolean {
  return !!s.availability || s.minPrice != null || s.maxPrice != null || s.productTypes.length > 0 || s.tags.length > 0
    || Object.keys(s.options).length > 0;
}

export function clearFilters(s: BrowseState): BrowseState {
  return { ...s, page: 1, availability: undefined, minPrice: undefined, maxPrice: undefined, productTypes: [], tags: [], options: {} };
}

export function toggleIn(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value];
}

export function toggleOption(options: Record<string, string[]>, name: string, value: string): Record<string, string[]> {
  const next = toggleIn(options[name] ?? [], value);
  const copy = { ...options };
  if (next.length) copy[name] = next; else delete copy[name];
  return copy;
}
