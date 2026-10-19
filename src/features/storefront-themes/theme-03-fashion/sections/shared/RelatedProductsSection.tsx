import { useEffect, useState } from 'react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicStoreProducts, type PublicStoreProduct } from '@/api/services/store';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { useProductPage } from '../../../productContext';
import { FashionProductCard } from '../../components/FashionProductCard';
import { SectionShell } from '../SectionShell';
import type { SharedSectionProps } from './types';

/** Other products of the viewed product's category; renders nothing outside a product page. */
export function RelatedProductsSection({ section, colors }: SharedSectionProps) {
  const { store } = useStorefront();
  const product = useProductPage();
  const { currency } = useCurrencyPreference();
  const [items, setItems] = useState<PublicStoreProduct[] | null>(null);
  const limit = Math.min(12, Math.max(2, Number(section.settings.limit) || 4));
  const productId = product?.productId;
  const categoryId = product?.categoryId ?? undefined;

  useEffect(() => {
    if (!productId) return;
    let off = false;
    apiGetPublicStoreProducts(store.storeId, { categoryId, limit: limit + 1, sort: 'best_selling' })
      .then(res => { if (!off) setItems((res.data?.products ?? []).filter(p => p._id !== productId).slice(0, limit)); })
      .catch(() => { if (!off) setItems([]); });
    return () => { off = true; };
  }, [store.storeId, productId, categoryId, limit]);

  if (!productId || !items || items.length === 0) return null;
  const cols = [2, 3, 4].includes(Number(section.settings.columns)) ? Number(section.settings.columns) : 4;
  return (
    <SectionShell colors={colors} heading={section.settings.heading}>
      <div className="grid fx-grid-gap" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${Math.floor(1100 / cols)}px), 1fr))` }}>
        {items.map(p => <FashionProductCard key={p._id} product={p} currency={currency} />)}
      </div>
    </SectionShell>
  );
}
