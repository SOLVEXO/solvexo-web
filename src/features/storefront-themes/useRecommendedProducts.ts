import { useEffect, useRef, useState } from 'react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicStoreProducts, type PublicStoreProduct } from '@/api/services/store';
import { dropSsr, peekSsr, wantSsr } from '@/utils/ssrData';
import { useProductPage } from './productContext';

export type RecommendationSource = 'related' | 'complementary' | 'category' | 'collection' | 'manual';
const SOURCES: readonly RecommendationSource[] = ['related', 'complementary', 'category', 'collection', 'manual'];

const list = (r: { data?: { products?: PublicStoreProduct[] } }) => r.data?.products ?? [];

interface Query {
  source: RecommendationSource; productId?: string; categoryId?: string; subCategoryId?: string; limit: number;
  ids: string[]; settingsCategoryId?: string; settingsCollectionId?: string;
}

/** The products one recommendations section shows (already without the viewed product, at most `limit`). */
async function fetchRecommended(storeId: string, q: Query): Promise<PublicStoreProduct[]> {
  const { source, productId, categoryId, subCategoryId, limit, ids, settingsCategoryId, settingsCollectionId } = q;
  const final = (rows: PublicStoreProduct[]) => rows.filter(p => p._id !== productId).slice(0, limit);
  if (source === 'complementary' || source === 'manual') {
    if (ids.length === 0) return [];
    return final(list(await apiGetPublicStoreProducts(storeId, { ids, limit: ids.length })));
  }
  if (source === 'category') {
    if (!settingsCategoryId) return [];
    return final(list(await apiGetPublicStoreProducts(storeId, { categoryId: settingsCategoryId, limit: limit + 1, sort: 'newest' })));
  }
  if (source === 'collection') {
    if (!settingsCollectionId) return [];
    return final(list(await apiGetPublicStoreProducts(storeId, { collectionId: settingsCollectionId, limit: limit + 1, sort: 'newest' })));
  }
  // related: the closest match first (own subcategory), then the wider main category.
  let rows = list(await apiGetPublicStoreProducts(storeId, { categoryId: subCategoryId ?? categoryId, limit: limit + 1, sort: 'best_selling' })).filter(p => p._id !== productId);
  if (rows.length < limit && subCategoryId && categoryId && categoryId !== subCategoryId) {
    const wider = list(await apiGetPublicStoreProducts(storeId, { categoryId, limit: limit + 1, sort: 'best_selling' }));
    const have = new Set(rows.map(p => p._id));
    rows = [...rows, ...wider.filter(p => p._id !== productId && !have.has(p._id))];
  }
  return final(rows);
}

/**
 * Products for a "Product Recommendations" (`related_products`) section — one implementation shared by every theme.
 *  related        same subcategory as the viewed product, topped up from its main category
 *  complementary  the products the seller picked on that product's own edit page
 *  category / collection / manual   the same fixed list on every page
 * `related` and `complementary` need a product page; the other three work anywhere.
 * Returns `null` while loading (or when there is nothing to show / not applicable) and a list otherwise.
 * A server-rendered page carries the list, so it is already in the first HTML and the browser's first render makes no request.
 */
export function useRecommendedProducts(settings: Record<string, any>): { items: PublicStoreProduct[] | null; applicable: boolean } { // eslint-disable-line @typescript-eslint/no-explicit-any -- seller-authored section JSON
  const { store } = useStorefront();
  const product = useProductPage();
  const limit = Math.min(12, Math.max(2, Number(settings.limit) || 4));
  const source: RecommendationSource = SOURCES.find(x => x === settings.source) ?? 'related';
  const productId = product?.productId;
  const categoryId = product?.categoryId ?? undefined;
  const subCategoryId = product?.subCategoryId ?? undefined;
  const picked = (source === 'manual' ? settings.productIds : source === 'complementary' ? product?.complementaryProductIds : undefined) as string[] | undefined;
  const pickedKey = (picked ?? []).join(',');
  const needsProduct = source === 'related' || source === 'complementary';
  const applicable = !needsProduct || !!productId;
  const settingsCategoryId = settings.categoryId as string | undefined;
  const settingsCollectionId = settings.collectionId as string | undefined;

  const query: Query = { source, productId, categoryId, subCategoryId, limit, ids: pickedKey ? pickedKey.split(',') : [], settingsCategoryId, settingsCollectionId };
  const ssrKey = `recs:${store.storeId}:${JSON.stringify([source, productId ?? '', categoryId ?? '', subCategoryId ?? '', limit, pickedKey, settingsCategoryId ?? '', settingsCollectionId ?? ''])}`;
  const [seeded] = useState(() => peekSsr<PublicStoreProduct[]>(ssrKey));
  const skipFirst = useRef(seeded !== undefined);
  const [items, setItems] = useState<PublicStoreProduct[] | null>(seeded ?? null);
  // Server collecting pass: ask for the list (no effect runs on the server).
  if (seeded === undefined && applicable) wantSsr(ssrKey, () => fetchRecommended(store.storeId, query));

  useEffect(() => {
    if (needsProduct && !productId) return;
    if (skipFirst.current) { skipFirst.current = false; dropSsr(ssrKey); return; }
    let off = false;
    fetchRecommended(store.storeId, query)
      .then(rows => { if (!off) setItems(rows); })
      .catch(() => { if (!off) setItems([]); });
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.storeId, source, productId, categoryId, subCategoryId, limit, pickedKey, settingsCategoryId, settingsCollectionId, needsProduct]);

  return { items: applicable ? items : null, applicable };
}
