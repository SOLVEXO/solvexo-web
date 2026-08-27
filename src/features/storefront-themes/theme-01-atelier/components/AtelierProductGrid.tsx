import { useCallback, useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { apiGetPublicStoreProducts, type PublicStoreProduct, type PublicStoreProductsParams } from '@/api/services/store';
import { AtelierProductCard } from './AtelierProductCard';
import { AtelierButton } from './AtelierButton';
import { atelierTheme as t } from '../theme.config';

const SORT_OPTIONS: { value: NonNullable<PublicStoreProductsParams['sort']>; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'best_rated', label: 'Best Rated' },
];

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="animate-pulse" style={{ aspectRatio: '3/4', background: t.colors.bgAlt }} />
          <div className="animate-pulse h-3 w-3/4" style={{ background: t.colors.bgAlt }} />
          <div className="animate-pulse h-3 w-1/3" style={{ background: t.colors.bgAlt }} />
        </div>
      ))}
    </div>
  );
}

/** Shared Theme 01 product-listing engine — Category browse, Collection
 *  detail, and Search results are all a scoped instance of this one grid
 *  (real pagination/sort against `apiGetPublicStoreProducts`, Atelier's own
 *  card/typography), rather than three separate re-implementations. This
 *  mirrors the legacy engine's own "one ProductCatalogSection, three
 *  callers" shape, just with Theme 01's own independent presentation. */
export function AtelierProductGrid({
  heading, categoryId, collectionId, search,
}: {
  heading?: string;
  categoryId?: string;
  collectionId?: string;
  search?: string;
}) {
  const { store } = useStorefront();
  const { currency } = useCurrencyPreference();
  const [products, setProducts] = useState<PublicStoreProduct[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState<NonNullable<PublicStoreProductsParams['sort']>>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setProducts(null);
    setError('');
    apiGetPublicStoreProducts(store.storeId, { page, limit: 12, sort, categoryId, collectionId, search })
      .then(res => {
        setProducts(res.data?.products ?? []);
        setTotal(res.data?.pagination?.total ?? 0);
        setTotalPages(res.data?.pagination?.totalPages ?? 1);
      })
      .catch(() => setError('Could not load products right now.'));
  }, [store.storeId, page, sort, categoryId, collectionId, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [categoryId, collectionId, search]);

  return (
    <div>
      <div className="flex items-end justify-between flex-wrap gap-3 mb-8">
        {heading && (
          <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 600, color: t.colors.ink }}>
            {heading}
          </h1>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={() => setSortOpen(o => !o)}
            className="flex items-center gap-1.5 cursor-pointer bg-transparent"
            style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.ink, border: `1px solid ${t.colors.border}`, padding: '8px 14px' }}
          >
            {SORT_OPTIONS.find(o => o.value === sort)?.label} <ChevronDown size={13} />
          </button>
          {sortOpen && (
            <div className="absolute right-0 z-10" style={{ top: 'calc(100% + 4px)', background: '#FFFFFF', border: `1px solid ${t.colors.border}`, minWidth: '190px' }}>
              {SORT_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { setSort(o.value); setSortOpen(false); }}
                  className="block w-full text-left cursor-pointer bg-transparent"
                  style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: o.value === sort ? t.colors.accent : t.colors.ink, padding: '9px 14px' }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {products !== null && (
        <p style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted, marginBottom: '20px' }}>{total} product{total !== 1 ? 's' : ''}</p>
      )}

      {products === null && !error && <GridSkeleton />}

      {error && <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.danger }}>{error}</p>}

      {products !== null && products.length === 0 && !error && (
        <div className="flex flex-col items-center text-center" style={{ padding: '80px 0', border: `1px solid ${t.colors.border}` }}>
          <p style={{ fontFamily: t.fonts.display, fontSize: '18px', fontWeight: 600, color: t.colors.ink, marginBottom: '6px' }}>Nothing here yet</p>
          <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted }}>Try a different search or check back soon.</p>
        </div>
      )}

      {products !== null && products.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {products.map(p => <AtelierProductCard key={p._id} product={p} currency={currency} />)}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-14">
              <AtelierButton variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</AtelierButton>
              <span style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.inkMuted }}>Page {page} of {totalPages}</span>
              <AtelierButton variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</AtelierButton>
            </div>
          )}
        </>
      )}
    </div>
  );
}
