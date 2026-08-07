import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { ProductImage, StarRating } from '@/components/comman/marketplace/ProductCard';
import { useStorefrontProductSection } from '@/hooks/useStorefrontProductSections';
import { apiGetPublicStoreProducts, type PublicStoreProduct } from '@/api/services/store';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { currencySymbol } from '@/utils/currency';
import { getMainAppUrl } from '@/utils/storefrontUrl';
import { useStorefront } from '../StorefrontContext';

export interface FeaturedProductsSectionSettings {
  heading?:    string;
  source:      'manual' | 'category' | 'bestsellers' | 'newArrivals' | 'trending' | 'pinned';
  categoryId?: string;
  productIds?: string[];
  limit?:      number;
}

const HOOK_SOURCE: Record<string, 'pinned' | 'bestSellers' | 'newArrivals' | 'trending'> = {
  pinned: 'pinned', bestsellers: 'bestSellers', newArrivals: 'newArrivals', trending: 'trending',
};

function useCuratedProducts(storeId: string | undefined, settings: FeaturedProductsSectionSettings) {
  const [manualOrCategory, setManualOrCategory] = useState<PublicStoreProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const hookSource = HOOK_SOURCE[settings.source];
  const { products: hookProducts } = useStorefrontProductSection(hookSource ? storeId : undefined, hookSource ?? 'pinned');

  useEffect(() => {
    if (hookSource || !storeId) return;
    setLoading(true);
    if (settings.source === 'category' && settings.categoryId) {
      apiGetPublicStoreProducts(storeId, { categoryId: settings.categoryId, limit: settings.limit ?? 8 })
        .then(res => setManualOrCategory(res.data?.products ?? []))
        .finally(() => setLoading(false));
    } else if (settings.source === 'manual' && settings.productIds?.length) {
      // No dedicated "fetch by ids" endpoint exists yet — fetch a wider page of
      // the store's own catalog and filter/reorder client-side by the seller's
      // chosen ids, rather than pretending a not-yet-built endpoint exists.
      apiGetPublicStoreProducts(storeId, { limit: 50 })
        .then(res => {
          const byId = new Map((res.data?.products ?? []).map(p => [p._id, p]));
          setManualOrCategory(settings.productIds!.map(id => byId.get(id)).filter(Boolean) as PublicStoreProduct[]);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [storeId, hookSource, settings.source, settings.categoryId, JSON.stringify(settings.productIds), settings.limit]);

  if (hookSource) return { products: hookProducts.slice(0, settings.limit ?? 8), loading: false };
  return { products: manualOrCategory.slice(0, settings.limit ?? 8), loading };
}

// A horizontal strip of curated products — pinned/best-sellers/trending/new
// arrivals (reusing the same endpoints the old fixed storefront always
// showed), a specific category, or a hand-picked list. Distinct from
// `ProductCatalogSection`, which is the full paginated browse grid.
export function FeaturedProductsSection({ settings }: { settings: FeaturedProductsSectionSettings }) {
  const { store, cfg } = useStorefront();
  const { currency: displayCurrency, convert } = useCurrencyPreference();
  const displaySymbol = currencySymbol(displayCurrency);
  const { products, loading } = useCuratedProducts(store.storeId, settings);

  if (!loading && products.length === 0) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6">
      {settings.heading && <h2 className="text-[20px] font-bold mb-4" style={{ color: cfg.textColor }}>{settings.heading}</h2>}
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
        {products.map(p => {
          const pType = p.productType ?? p.type ?? 'physical';
          const isDigital = pType !== 'physical';
          return (
            <button key={p._id} onClick={() => { window.location.href = getMainAppUrl(`/marketplace/${p._id}`); }}
              className="group shrink-0 w-[160px] text-left bg-white border border-bone rounded-xl overflow-hidden cursor-pointer transition-colors duration-200 hover:bg-brand-pale-orange/[0.12]">
              <div className="relative p-2">
                <div className="relative overflow-hidden aspect-square rounded-lg bg-bone">
                  {p.images?.[0]
                    ? <ProductImage images={p.images} name={p.name} className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]" />
                    : <div className="w-full h-full flex items-center justify-center"><Package size={24} className="text-brand-orange" /></div>}
                </div>
                <span className={`absolute top-3 left-3 px-[6px] py-[1px] rounded-[4px] text-[9px] font-semibold border ${isDigital ? 'bg-accent-violet-bg text-accent-violet border-accent-violet/25' : 'bg-brand-pale-orange text-brand-deep-orange border-[#f5d0bc]'}`}>
                  {isDigital ? (pType === 'educational' ? 'Educational' : 'Digital') : 'Physical'}
                </span>
              </div>
              <div className="px-[10px] pb-[10px]">
                <p className="text-[12px] font-semibold text-carbon mb-[3px] line-clamp-2 leading-[1.3]">{p.name}</p>
                <StarRating rating={p.averageRating ?? 0} />
                {p.defaultVariantPrice != null && (
                  <p className="text-[14px] font-bold text-carbon mt-[6px]">{displaySymbol}{convert(p.defaultVariantPrice, store.baseCurrency).toLocaleString()}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
