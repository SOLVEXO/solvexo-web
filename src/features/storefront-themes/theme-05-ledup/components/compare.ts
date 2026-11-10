import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { PublicStoreProduct } from '@/api/services/store';

/** Client-side product compare: up to four products, kept in this browser only (no backend). Only fields the product list already returns are stored. */
export const COMPARE_MAX = 4;
const EVENT = 'lb-compare-change';

export type CompareProduct = Pick<PublicStoreProduct, '_id' | 'slug' | 'name' | 'vendor' | 'tags' | 'averageRating' | 'defaultVariantPrice' | 'compareAtPrice' | 'inStock' | 'variantId' | 'type' | 'productType'> & { image?: string; options: { name: string; values: string[] }[] };

const keyOf = (storeId: string) => `lb-compare:${storeId}`;

/** The small, serialisable slice of a listed product that the compare table needs. */
export function toCompareProduct(p: PublicStoreProduct): CompareProduct {
  const byName = new Map<string, Set<string>>();
  for (const v of p.variants ?? []) for (const o of v.options ?? []) { if (!byName.has(o.name)) byName.set(o.name, new Set()); byName.get(o.name)!.add(o.value); }
  return {
    _id: p._id, slug: p.slug, name: p.name, vendor: p.vendor, tags: (p.tags ?? []).slice(0, 6), averageRating: p.averageRating, defaultVariantPrice: p.defaultVariantPrice,
    compareAtPrice: p.compareAtPrice, inStock: p.inStock, variantId: p.variantId, type: p.type, productType: p.productType, image: p.images?.[0],
    options: Array.from(byName, ([name, values]) => ({ name, values: Array.from(values).slice(0, 8) })),
  };
}

function parse(raw: string): CompareProduct[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter(x => x && typeof x._id === 'string').slice(0, COMPARE_MAX) : [];
  } catch { return []; }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);
  return () => { window.removeEventListener(EVENT, cb); window.removeEventListener('storage', cb); };
}

function write(storeId: string, items: CompareProduct[]) {
  try { localStorage.setItem(keyOf(storeId), JSON.stringify(items)); } catch { /* private mode: compare then lasts until the page reloads */ }
  window.dispatchEvent(new Event(EVENT));
}

export function useCompare(storeId: string) {
  const raw = useSyncExternalStore(subscribe, () => { try { return localStorage.getItem(keyOf(storeId)) ?? '[]'; } catch { return '[]'; } }, () => '[]');
  const items = useMemo(() => parse(raw), [raw]);
  const has = useCallback((id: string) => items.some(i => i._id === id), [items]);
  /** Adds or removes; returns false when the list is full and the product was not added. */
  const toggle = useCallback((p: PublicStoreProduct): boolean => {
    if (items.some(i => i._id === p._id)) { write(storeId, items.filter(i => i._id !== p._id)); return true; }
    if (items.length >= COMPARE_MAX) return false;
    write(storeId, [...items, toCompareProduct(p)]);
    return true;
  }, [items, storeId]);
  const remove = useCallback((id: string) => write(storeId, items.filter(i => i._id !== id)), [items, storeId]);
  const clear = useCallback(() => write(storeId, []), [storeId]);
  return { items, has, toggle, remove, clear, full: items.length >= COMPARE_MAX };
}
