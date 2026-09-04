import { useEffect, useState } from 'react';
import type { Section } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { apiGetPublicStoreProducts, type PublicStoreProduct, type PublicStoreProductsParams } from '@/api/services/store';
import { AtelierProductCard } from '../components/AtelierProductCard';
import { atelierTheme as t, type AtelierSectionColors } from '../theme.config';
import { registerAtelierSection } from './atelierSectionRenderer';

/** Maps the section's merchant-facing `source` to the real public products
 *  query. `pinned`/`manual` have no backing public endpoint today (no
 *  seller "pin a product" flag, no bulk by-ids fetch) — both fall back to
 *  `newest` rather than silently rendering nothing, a disclosed limitation
 *  rather than a fake curated list. */
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

function FeaturedProductsSection({ section, colors }: { section: Section; colors: AtelierSectionColors }) {
  const { store } = useStorefront();
  const { currency } = useCurrencyPreference();
  // The Theme Library's static demo preview (`themeDemoPreview.ts`) has no
  // real store/products to fetch — it sets `section.settings.demoProducts`
  // to a fixed, fictional list instead, so this same registered section
  // (and the same real `AtelierProductCard`, with `demo` passed through)
  // renders a genuinely finished-looking product grid there too, rather
  // than every theme's preview disclosing away every section that needs
  // real data. A real store's sections never set this, so the live fetch
  // below is completely untouched for every actual seller.
  const demoProducts = section.settings.demoProducts as PublicStoreProduct[] | undefined;
  const [products, setProducts] = useState<PublicStoreProduct[] | null>(demoProducts ?? null);

  useEffect(() => {
    if (demoProducts) return;
    apiGetPublicStoreProducts(store.storeId, paramsForSource(section.settings))
      .then(res => setProducts(res.data?.products ?? []))
      .catch(() => setProducts([]));
  }, [store.storeId, section.settings, demoProducts]);

  if (products !== null && products.length === 0) return null;

  return (
    <div style={{ padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}` }}>
      <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth }}>
        {section.settings.heading && (
          <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 600, color: colors.ink, marginBottom: '36px' }}>
            {section.settings.heading}
          </h2>
        )}
        {products === null ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="animate-pulse" style={{ aspectRatio: '3/4', background: colors.bgAlt }} />
                <div className="animate-pulse h-3 w-3/4" style={{ background: colors.bgAlt }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {products.map(p => <AtelierProductCard key={p._id} product={p} currency={currency} demo={!!demoProducts} />)}
          </div>
        )}
      </div>
    </div>
  );
}

registerAtelierSection('featured_products', (section: Section, _blocks, colors: AtelierSectionColors) => <FeaturedProductsSection section={section} colors={colors} />);
