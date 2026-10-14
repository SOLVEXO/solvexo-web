import { useEffect, useState } from 'react';
import type { Section } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { apiGetPublicStoreProducts, type PublicStoreProduct, type PublicStoreProductsParams } from '@/api/services/store';
import { apiGetPinnedProducts } from '@/api/services/product';
import { NovaProductCard } from '../components/NovaProductCard';
import { responsiveGridColumnsClass } from '@/features/storefront/browse/gridLayout';
import { novaTheme as t, type NovaSectionColors } from '../theme.config';
import { registerNovaSection } from './novaSectionRenderer';
import { copyText, showEyebrow } from '../../sectionCopy';

/** Same helper as `AtelierFeaturedProductsSection`'s equivalent — `pinned`/
 *  `manual` (the section editor's two names for the same seller-curated
 *  pick list — see `apiGetPinnedProducts`'s own doc comment, "Manual Pin"/
 *  "Seller Featured") are handled separately in the effect below via that
 *  dedicated endpoint, not here. */
function paramsForSource(settings: Section['settings']): PublicStoreProductsParams {
  const limit = Math.min(24, Math.max(1, settings.limit ?? 8));
  switch (settings.source) {
    case 'category':   return { categoryId: settings.categoryId, sort: 'newest', limit };
    case 'collection': return { collectionId: settings.collectionId, sort: 'newest', limit };
    case 'onSale':     return { onSale: true, sort: 'newest', limit };
    case 'bestsellers': return { sort: 'best_selling', limit };
    case 'trending':    return { sort: 'trending', limit };
    case 'newArrivals':
    default:           return { sort: 'newest', limit };
  }
}

function FeaturedProductsSection({ section, colors }: { section: Section; colors: NovaSectionColors }) {
  const { store } = useStorefront();
  const { currency } = useCurrencyPreference();
  // Same static demo-data escape hatch as `AtelierFeaturedProductsSection`
  // (see its doc comment) — the Theme Library preview sets
  // `section.settings.demoProducts` since it has no real store to fetch.
  const demoProducts = section.settings.demoProducts as PublicStoreProduct[] | undefined;
  const [products, setProducts] = useState<PublicStoreProduct[] | null>(demoProducts ?? null);

  useEffect(() => {
    if (demoProducts) return;
    const { source, limit: limitSetting } = section.settings;
    const limit = Math.min(24, Math.max(1, limitSetting ?? 8));
    const pickedIds: string[] = Array.isArray(section.settings.productIds) ? section.settings.productIds : [];
    const request = (source === 'manual' || source === 'pinned') && pickedIds.length > 0
      // Hand-picked in this section: exactly these products, in this order.
      ? apiGetPublicStoreProducts(store.storeId, { ids: pickedIds.slice(0, 50), limit: Math.min(50, pickedIds.length) })
          .then(res => (res.data?.products ?? []).slice(0, limit))
      : source === 'pinned' || source === 'manual'
      ? apiGetPinnedProducts(store.storeId).then(res => (res.data?.products ?? []).slice(0, limit))
      : apiGetPublicStoreProducts(store.storeId, paramsForSource(section.settings)).then(res => res.data?.products ?? []);
    request.then(setProducts).catch(() => setProducts([]));
  }, [store.storeId, section.settings, demoProducts]);

  if (products !== null && products.length === 0) return null;

  return (
    <div style={{ padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}`, background: colors.bgAlt }}>
      <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth }}>
        {section.settings.heading && (
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              {showEyebrow(section.settings) && (<span style={{ display: 'inline-block', fontFamily: t.fonts.body, fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.colors.accent, background: colors.bg, borderRadius: '9999px', padding: '6px 12px', marginBottom: '12px' }}>{copyText(section.settings, 'eyebrow', 'Picked for you')}</span>)}
              <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 700, color: colors.ink, lineHeight: 1.05 }}>
                {section.settings.heading}
              </h2>
            </div>
            <div className="hidden sm:block" aria-hidden="true" style={{ width: '52px', height: '6px', borderRadius: '9999px', background: colors.accent, marginBottom: '5px' }} />
          </div>
        )}
        {products === null ? (
          <div className={`grid ${responsiveGridColumnsClass(section.settings.columns)} gap-x-6 gap-y-10`}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="animate-pulse" style={{ aspectRatio: '1/1', background: colors.bgAlt, borderRadius: t.radius.md }} />
                <div className="animate-pulse h-3 w-3/4" style={{ background: colors.bgAlt }} />
              </div>
            ))}
          </div>
        ) : (
          <div className={`grid ${responsiveGridColumnsClass(section.settings.columns)} gap-x-6 gap-y-10`}>
            {products.map(p => <NovaProductCard key={p._id} product={p} currency={currency} demo={!!demoProducts} />)}
          </div>
        )}
      </div>
    </div>
  );
}

registerNovaSection('featured_products', (section: Section, _blocks, colors: NovaSectionColors) => <FeaturedProductsSection section={section} colors={colors} />);
