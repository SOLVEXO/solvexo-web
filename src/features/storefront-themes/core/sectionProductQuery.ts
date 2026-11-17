import type { PublicStoreProductsParams } from '@/api/services/store';

/** What a "Featured products" section asks the public products API for. ONE place for every theme (it used to be copied into
 *  five section files). Sources: the fixed lists (best sellers, new, trending, on sale, a category, a collection, hand-picked) and
 *  `rules`: products matching the seller's own rules (tags, vendors, price range, type, stock, sale, sort). The API re-checks
 *  everything, so a bad value here can only give a shorter list. */

type Settings = Record<string, unknown>;

export const PRODUCT_RULE_SORTS = ['newest', 'oldest', 'best_selling', 'trending', 'price_asc', 'price_desc', 'title_asc', 'title_desc', 'best_rated'] as const;
type RuleSort = (typeof PRODUCT_RULE_SORTS)[number];

const strings = (v: unknown): string[] =>
  (Array.isArray(v) ? v : []).filter((x): x is string => typeof x === 'string' && x.trim() !== '').map(x => x.trim()).slice(0, 20);
const money = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : undefined);
const text = (v: unknown): string => (typeof v === 'string' ? v : '');

function rulesQuery(s: Settings, limit: number): PublicStoreProductsParams {
  const q: PublicStoreProductsParams = { limit, sort: (PRODUCT_RULE_SORTS as readonly string[]).includes(text(s.ruleSort)) ? (s.ruleSort as RuleSort) : 'newest' };
  if (text(s.categoryId)) q.categoryId = text(s.categoryId);
  if (text(s.collectionId)) q.collectionId = text(s.collectionId);
  const tags = strings(s.ruleTags);
  if (tags.length) q.tags = tags;
  const vendors = strings(s.ruleVendors);
  if (vendors.length) q.vendors = vendors;
  const min = money(s.rulePriceMin);
  const max = money(s.rulePriceMax);
  if (min !== undefined) q.minPrice = min;
  if (max !== undefined) q.maxPrice = max;
  if (s.ruleType === 'physical' || s.ruleType === 'digital') q.type = s.ruleType;
  if (s.ruleStock === 'in_stock') q.availability = 'in_stock';
  if (s.ruleOnSale === true) q.onSale = true;
  return q;
}

export function featuredProductsQuery(s: Settings, defaultLimit = 8): PublicStoreProductsParams {
  const limit = Math.min(24, Math.max(1, Number(s.limit) || defaultLimit));
  let q: PublicStoreProductsParams;
  switch (s.source) {
    case 'bestsellers': q = { limit, sort: 'best_selling' }; break;
    case 'trending': q = { limit, sort: 'trending' }; break;
    case 'onSale': q = { limit, onSale: true, sort: 'newest' }; break;
    case 'category': q = { limit, categoryId: text(s.categoryId), sort: 'newest' }; break;
    case 'collection': q = { limit, collectionId: text(s.collectionId), sort: 'newest' }; break;
    case 'rules': q = rulesQuery(s, limit); break;
    case 'manual':
    case 'pinned': {
      const ids = strings(s.productIds);
      q = ids.length ? { ids, limit } : { limit, sort: 'newest' };
      break;
    }
    default: q = { limit, sort: 'newest' };
  }
  // any source: do not show what can not be bought right now
  if (s.hideSoldOut === true) q.availability = 'in_stock';
  return q;
}

/** Where "View all" goes: the collection when that is the whole list, otherwise the shop-wide search. */
export function featuredViewAllPath(s: Settings): string {
  const collection = text(s.collectionId);
  if (!collection) return '/search';
  if (s.source === 'collection') return `/collections/${collection}`;
  if (s.source === 'rules') {
    const hasOtherRule = strings(s.ruleTags).length || strings(s.ruleVendors).length || money(s.rulePriceMin) !== undefined || money(s.rulePriceMax) !== undefined
      || s.ruleType === 'physical' || s.ruleType === 'digital' || s.ruleStock === 'in_stock' || s.ruleOnSale === true || text(s.categoryId);
    if (!hasOtherRule) return `/collections/${collection}`;
  }
  return '/search';
}
