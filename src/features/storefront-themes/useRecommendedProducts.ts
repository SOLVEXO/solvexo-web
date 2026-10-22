import { useEffect, useState } from 'react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicStoreProducts, type PublicStoreProduct } from '@/api/services/store';
import { useProductPage } from './productContext';

export type RecommendationSource = 'related' | 'complementary' | 'category' | 'collection' | 'manual';
const SOURCES: readonly RecommendationSource[] = ['related', 'complementary', 'category', 'collection', 'manual'];

const list = (r: { data?: { products?: PublicStoreProduct[] } }) => r.data?.products ?? [];

/**
 * Products for a "Product Recommendations" (`related_products`) section — one implementation shared by every theme.
 *  related        same subcategory as the viewed product, topped up from its main category
 *  complementary  the products the seller picked on that product's own edit page
 *  category / collection / manual   the same fixed list on every page
 * `related` and `complementary` need a product page; the other three work anywhere.
 * Returns `null` while loading (or when there is nothing to show / not applicable) and a list otherwise.
 */
export function useRecommendedProducts(settings: Record<string, any>): { items: PublicStoreProduct[] | null; applicable: boolean } { // eslint-disable-line @typescript-eslint/no-explicit-any -- seller-authored section JSON
  const { store } = useStorefront();
  const product = useProductPage();
  const [items, setItems] = useState<PublicStoreProduct[] | null>(null);
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

  useEffect(() => {
    if (needsProduct && !productId) return;
    let off = false;
    const done = (rows: PublicStoreProduct[]) => { if (!off) setItems(rows.filter(p => p._id !== productId).slice(0, limit)); };
    const fail = () => { if (!off) setItems([]); };
    const ids = pickedKey ? pickedKey.split(',') : [];

    if (source === 'complementary' || source === 'manual') {
      if (ids.length === 0) { Promise.resolve().then(() => done([])); return () => { off = true; }; }
      apiGetPublicStoreProducts(store.storeId, { ids, limit: ids.length }).then(r => done(list(r))).catch(fail);
    } else if (source === 'category') {
      if (!settingsCategoryId) { Promise.resolve().then(() => done([])); return () => { off = true; }; }
      apiGetPublicStoreProducts(store.storeId, { categoryId: settingsCategoryId, limit: limit + 1, sort: 'newest' }).then(r => done(list(r))).catch(fail);
    } else if (source === 'collection') {
      if (!settingsCollectionId) { Promise.resolve().then(() => done([])); return () => { off = true; }; }
      apiGetPublicStoreProducts(store.storeId, { collectionId: settingsCollectionId, limit: limit + 1, sort: 'newest' }).then(r => done(list(r))).catch(fail);
    } else {
      // related: the closest match first (own subcategory), then the wider main category.
      apiGetPublicStoreProducts(store.storeId, { categoryId: subCategoryId ?? categoryId, limit: limit + 1, sort: 'best_selling' })
        .then(async r => {
          let rows = list(r).filter(p => p._id !== productId);
          if (rows.length < limit && subCategoryId && categoryId && categoryId !== subCategoryId) {
            const wider = list(await apiGetPublicStoreProducts(store.storeId, { categoryId, limit: limit + 1, sort: 'best_selling' }));
            const have = new Set(rows.map(p => p._id));
            rows = [...rows, ...wider.filter(p => p._id !== productId && !have.has(p._id))];
          }
          done(rows);
        })
        .catch(fail);
    }
    return () => { off = true; };
  }, [store.storeId, source, productId, categoryId, subCategoryId, limit, pickedKey, settingsCategoryId, settingsCollectionId, needsProduct]);

  return { items: applicable ? items : null, applicable };
}
