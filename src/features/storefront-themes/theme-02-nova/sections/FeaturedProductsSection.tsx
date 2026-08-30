import { useEffect, useState } from 'react';
import type { Section } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { apiGetPublicStoreProducts, type PublicStoreProduct, type PublicStoreProductsParams } from '@/api/services/store';
import { NovaProductCard } from '../components/NovaProductCard';
import { novaTheme as t } from '../theme.config';
import { registerNovaSection } from './novaSectionRenderer';

/** Same disclosed limitation as `AtelierProductCatalogSection`'s equivalent
 *  helper — `pinned`/`manual` have no backing public endpoint today, so both
 *  fall back to `newest` rather than silently rendering nothing. */
function paramsForSource(settings: Section['settings']): PublicStoreProductsParams {
  const limit = Math.min(24, Math.max(1, settings.limit ?? 8));
  switch (settings.source) {
    case 'category':   return { categoryId: settings.categoryId, sort: 'newest', limit };
    case 'collection': return { collectionId: settings.collectionId, sort: 'newest', limit };
    case 'onSale':     return { onSale: true, sort: 'newest', limit };
    case 'bestsellers':
    case 'trending':   return { sort: 'best_rated', limit };
    case 'newArrivals':
    case 'pinned':
    case 'manual':
    default:           return { sort: 'newest', limit };
  }
}

function FeaturedProductsSection({ section }: { section: Section }) {
  const { store } = useStorefront();
  const { currency } = useCurrencyPreference();
  const [products, setProducts] = useState<PublicStoreProduct[] | null>(null);

  useEffect(() => {
    apiGetPublicStoreProducts(store.storeId, paramsForSource(section.settings))
      .then(res => setProducts(res.data?.products ?? []))
      .catch(() => setProducts([]));
  }, [store.storeId, section.settings]);

  if (products !== null && products.length === 0) return null;

  return (
    <div style={{ padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}` }}>
      <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth }}>
        {section.settings.heading && (
          <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 700, color: t.colors.ink, marginBottom: '36px' }}>
            {section.settings.heading}
          </h2>
        )}
        {products === null ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="animate-pulse" style={{ aspectRatio: '1/1', background: t.colors.bgAlt, borderRadius: t.radius.md }} />
                <div className="animate-pulse h-3 w-3/4" style={{ background: t.colors.bgAlt }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {products.map(p => <NovaProductCard key={p._id} product={p} currency={currency} />)}
          </div>
        )}
      </div>
    </div>
  );
}

registerNovaSection('featured_products', (section: Section) => <FeaturedProductsSection section={section} />);
