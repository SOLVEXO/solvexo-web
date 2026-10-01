import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { currencySymbol } from '@/utils/currency';
import { apiGetPublicStoreProducts, type PublicStoreProduct, type PublicStoreProductsParams } from '@/api/services/store';
import { AtelierProductCard } from './AtelierProductCard';
import { AtelierButton } from './AtelierButton';
import { atelierTheme as t } from '../theme.config';

type Sort = NonNullable<PublicStoreProductsParams['sort']>;
type Availability = NonNullable<PublicStoreProductsParams['availability']>;

// Same sort choices a Shopify collection page offers.
const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: 'newest', label: 'Featured' },
  { value: 'best_rated', label: 'Best rated' },
  { value: 'title_asc', label: 'Alphabetically, A-Z' },
  { value: 'title_desc', label: 'Alphabetically, Z-A' },
  { value: 'price_asc', label: 'Price, low to high' },
  { value: 'price_desc', label: 'Price, high to low' },
  { value: 'oldest', label: 'Date, old to new' },
];

const AVAILABILITY_LABEL: Record<Availability, string> = { in_stock: 'In stock', out_of_stock: 'Out of stock' };

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

const triggerStyle = {
  fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.ink, border: `1px solid ${t.colors.border}`, padding: '8px 14px',
} as const;
const menuStyle = { top: 'calc(100% + 4px)', background: '#FFFFFF', border: `1px solid ${t.colors.border}` } as const;

/** Shared Theme 01 product-listing engine — Category browse, Collection
 *  detail, Search results and the Products page are all a scoped instance of
 *  this one grid. Mirrors a Shopify collection page: Availability + Price
 *  filters with removable chips, Sort by, product count, pagination — all
 *  applied server-side so counts/pages stay correct. */
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
  const symbol = currencySymbol(currency);
  const [products, setProducts] = useState<PublicStoreProduct[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState<Sort>('newest');
  const [availability, setAvailability] = useState<Availability | undefined>();
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [minDraft, setMinDraft] = useState('');
  const [maxDraft, setMaxDraft] = useState('');
  const [open, setOpen] = useState<'sort' | 'availability' | 'price' | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setProducts(null);
    setError('');
    apiGetPublicStoreProducts(store.storeId, { page, limit: 12, sort, categoryId, collectionId, search, availability, minPrice, maxPrice })
      .then(res => {
        setProducts(res.data?.products ?? []);
        setTotal(res.data?.pagination?.total ?? 0);
        setTotalPages(res.data?.pagination?.totalPages ?? 1);
      })
      .catch(() => setError('Could not load products right now.'));
  }, [store.storeId, page, sort, categoryId, collectionId, search, availability, minPrice, maxPrice]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [categoryId, collectionId, search, availability, minPrice, maxPrice, sort]);

  const hasFilters = !!availability || minPrice != null || maxPrice != null;
  const clearAll = () => { setAvailability(undefined); setMinPrice(undefined); setMaxPrice(undefined); setMinDraft(''); setMaxDraft(''); };
  const applyPrice = () => {
    const lo = minDraft.trim() === '' ? undefined : Math.max(0, Number(minDraft));
    const hi = maxDraft.trim() === '' ? undefined : Math.max(0, Number(maxDraft));
    setMinPrice(lo != null && Number.isFinite(lo) ? lo : undefined);
    setMaxPrice(hi != null && Number.isFinite(hi) ? hi : undefined);
    setOpen(null);
  };
  const toggle = (k: 'sort' | 'availability' | 'price') => setOpen(o => (o === k ? null : k));

  const chip = (label: string, onRemove: () => void) => (
    <button
      key={label}
      type="button"
      onClick={onRemove}
      className="flex items-center gap-1.5 cursor-pointer bg-transparent"
      style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.ink, border: `1px solid ${t.colors.border}`, padding: '5px 10px' }}
    >
      {label} <X size={12} />
    </button>
  );

  return (
    <div>
      {heading && (
        <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 600, color: t.colors.ink, marginBottom: '24px' }}>
          {heading}
        </h1>
      )}

      {open && <div className="fixed inset-0 z-[5]" onClick={() => setOpen(null)} />}

      <div className="flex items-center justify-between flex-wrap gap-3 mb-4" style={{ borderTop: `1px solid ${t.colors.border}`, borderBottom: `1px solid ${t.colors.border}`, padding: '14px 0' }}>
        <div className="flex items-center gap-3 flex-wrap">
          <span style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.inkMuted }}>Filter:</span>

          <div className="relative z-10">
            <button type="button" onClick={() => toggle('availability')} className="flex items-center gap-1.5 cursor-pointer bg-transparent" style={triggerStyle}>
              Availability <ChevronDown size={13} />
            </button>
            {open === 'availability' && (
              <div className="absolute left-0" style={{ ...menuStyle, minWidth: '170px' }}>
                {(Object.keys(AVAILABILITY_LABEL) as Availability[]).map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => { setAvailability(availability === a ? undefined : a); setOpen(null); }}
                    className="block w-full text-left cursor-pointer bg-transparent"
                    style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: availability === a ? t.colors.accent : t.colors.ink, padding: '9px 14px' }}
                  >
                    {AVAILABILITY_LABEL[a]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative z-10">
            <button type="button" onClick={() => toggle('price')} className="flex items-center gap-1.5 cursor-pointer bg-transparent" style={triggerStyle}>
              Price <ChevronDown size={13} />
            </button>
            {open === 'price' && (
              <div className="absolute left-0 flex flex-col gap-3" style={{ ...menuStyle, padding: '14px', width: '260px' }}>
                <div className="flex items-center gap-2">
                  {[
                    { v: minDraft, set: setMinDraft, ph: 'From' },
                    { v: maxDraft, set: setMaxDraft, ph: 'To' },
                  ].map(f => (
                    <label key={f.ph} className="flex items-center gap-1 flex-1" style={{ border: `1px solid ${t.colors.border}`, padding: '7px 8px', fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.inkMuted }}>
                      {symbol}
                      <input
                        type="number"
                        min={0}
                        value={f.v}
                        placeholder={f.ph}
                        onChange={e => f.set(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') applyPrice(); }}
                        className="w-full bg-transparent outline-none"
                        style={{ color: t.colors.ink }}
                      />
                    </label>
                  ))}
                </div>
                <AtelierButton variant="outline" onClick={applyPrice}>Apply</AtelierButton>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.inkMuted }}>Sort by:</span>
            <div className="relative z-10">
              <button type="button" onClick={() => toggle('sort')} className="flex items-center gap-1.5 cursor-pointer bg-transparent" style={triggerStyle}>
                {SORT_OPTIONS.find(o => o.value === sort)?.label} <ChevronDown size={13} />
              </button>
              {open === 'sort' && (
                <div className="absolute right-0" style={{ ...menuStyle, minWidth: '200px' }}>
                  {SORT_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => { setSort(o.value); setOpen(null); }}
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
            <span style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.inkMuted }}>{total} product{total !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {hasFilters && (
        <div className="flex items-center gap-2 flex-wrap mb-6">
          {availability && chip(`Availability: ${AVAILABILITY_LABEL[availability]}`, () => setAvailability(undefined))}
          {(minPrice != null || maxPrice != null) &&
            chip(
              `${symbol}${minPrice ?? 0} – ${maxPrice != null ? `${symbol}${maxPrice}` : 'and up'}`,
              () => { setMinPrice(undefined); setMaxPrice(undefined); setMinDraft(''); setMaxDraft(''); },
            )}
          <button
            type="button"
            onClick={clearAll}
            className="cursor-pointer bg-transparent border-0 underline"
            style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.ink }}
          >
            Remove all
          </button>
        </div>
      )}

      {products === null && !error && <GridSkeleton />}

      {error && <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.danger }}>{error}</p>}

      {products !== null && products.length === 0 && !error && (
        <div className="flex flex-col items-center text-center" style={{ padding: '80px 0', border: `1px solid ${t.colors.border}` }}>
          <p style={{ fontFamily: t.fonts.display, fontSize: '18px', fontWeight: 600, color: t.colors.ink, marginBottom: '6px' }}>
            {hasFilters ? 'No products found' : 'Nothing here yet'}
          </p>
          <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted, marginBottom: hasFilters ? '16px' : 0 }}>
            {hasFilters ? 'Use fewer filters or remove all.' : 'Try a different search or check back soon.'}
          </p>
          {hasFilters && <AtelierButton variant="outline" onClick={clearAll}>Remove all filters</AtelierButton>}
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
