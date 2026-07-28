import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useProductsByCategory } from '@/hooks/marketplace/useProductsByCategory';
import { useBanners } from '@/hooks/useBanners';
import { useCountdownToMidnight } from '@/hooks/useCountdownToMidnight';
import { useCartContext } from '@/contexts/CartContext';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { Button } from '@/components/comman/ui/Button';
import { Pagination, FilterDropdown, BuyerNavbar, AppDownloadBanner, Footer, TrustServiceStrip, FloatingAppWidget, DealsBanner, StoreFeatureCard } from '@/components/comman/ui';
import { ProductCard, ProductCardSkeleton } from '@/components/comman/marketplace/ProductCard';
import { FilterAccordionSection, FilterRadioRow, FilterCheckboxRow, FilterStarRow, ActiveFilterChip, PriceRangeSlider, PRICE_MIN, PRICE_MAX } from '@/components/comman/marketplace/FilterAccordionSection';
import { BannerCarousel } from '@/components/comman/marketplace/BannerCarousel';
import { MegaMenuBar } from '@/components/comman/marketplace/MegaMenuBar';
import {
  ShoppingBag,
  SlidersHorizontal, X, Zap,
  ShieldCheck, BadgeCheck, RefreshCcw,
} from 'lucide-react';
import type { MarketplaceProduct } from '@/api/services/marketplace';
import { apiGetCategoryTree, type CategoryNode } from '@/api/services/categories';
import { apiGetTopStores, type PublicStoreListItem } from '@/api/services/store';
import { apiSearchStores } from '@/api/services/search';
import { scrollRootToTop } from '@/utils/scrollRoot';
import { apiGetPublicActiveCampaigns, type PublicCampaign } from '@/api/services/marketing/publicCampaigns';



// ── Filter data ───────────────────────────────────────────────────────────────
const TYPE_ITEMS = ['Physical', 'Digital', 'Educational'];
const RATING_ITEMS: { label: string; stars: number }[] = [
  { label: '4★ & up', stars: 4 },
  { label: '3★ & up', stars: 3 },
];

interface FilterState { priceRange: [number, number]; type: string[]; rating: string[]; }

function FilterPanel({ filters, onChange, onPriceRangeChange, categories = [], selectedCategory, onCategoryChange }: {
  filters:  FilterState;
  onChange: (key: 'type' | 'rating', value: string) => void;
  onPriceRangeChange: (value: [number, number]) => void;
  categories:       CategoryNode[];
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
}) {
  return (
    <div>
      {categories.length > 0 && (
        <FilterAccordionSection title="Category">
          <div className="flex flex-col">
            <FilterRadioRow label="All Categories" active={selectedCategory === ''} onClick={() => onCategoryChange('')} count={categories.reduce((sum, c) => sum + (c.productCount ?? 0), 0)} />
            {categories.map(c => (
              <FilterRadioRow key={c._id} label={c.name} active={selectedCategory === c._id} onClick={() => onCategoryChange(c._id)} count={c.productCount} />
            ))}
          </div>
        </FilterAccordionSection>
      )}
      <FilterAccordionSection title="Price Range">
        <PriceRangeSlider value={filters.priceRange} onChange={onPriceRangeChange} />
      </FilterAccordionSection>
      <FilterAccordionSection title="Product Type">
        <div className="flex flex-col">
          {TYPE_ITEMS.map(label => (
            <FilterCheckboxRow key={label} label={label} active={filters.type.includes(label)} onClick={() => onChange('type', label)} />
          ))}
        </div>
      </FilterAccordionSection>
      <FilterAccordionSection title="Rating">
        <div className="flex flex-col">
          {RATING_ITEMS.map(({ label, stars }) => (
            <FilterStarRow key={label} stars={stars} active={filters.rating.includes(label)} onClick={() => onChange('rating', label)} />
          ))}
        </div>
      </FilterAccordionSection>
    </div>
  );
}

// ── Config ────────────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest'         },
  { value: 'price-asc',  label: 'Price: Low–High' },
  { value: 'price-desc', label: 'Price: High–Low' },
  { value: 'best-rated', label: 'Best Rated'      },
];


export function Marketplace() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  usePageTitle('Marketplace');

  const [sortBy,        setSortBy]        = useState('newest');
  const [page,          setPage]          = useState(1);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ priceRange: [PRICE_MIN, PRICE_MAX], type: [], rating: [] });
  const [searchInput, setSearchInput] = useState('');
  const [search,      setSearch]      = useState('');
  const [categories,       setCategories]       = useState<CategoryNode[]>([]);
  // Seeded from ?category= so links from the mega menu / other pages land
  // pre-filtered to that category.
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') ?? '');
  // Seeded from ?campaign= — "Shop the Sale" on the DealsBanner lands here
  // pre-filtered to only that campaign's participating stores.
  const [campaignFilterId, setCampaignFilterId] = useState(() => searchParams.get('campaign') ?? '');
  const [campaignFilterInfo, setCampaignFilterInfo] = useState<PublicCampaign | null>(null);
  const [topStores,        setTopStores]        = useState<PublicStoreListItem[]>([]);
  const [storeResults,     setStoreResults]      = useState<PublicStoreListItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    apiGetCategoryTree()
      .then(res => { if (!cancelled) setCategories(res.data ?? []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Re-sync when ?category= changes while already on this page (mega menu
  // link clicked from here) — the initial-mount case is covered by the
  // useState initializer above.
  useEffect(() => {
    const fromUrl = searchParams.get('category') ?? '';
    setSelectedCategory(fromUrl);
    setCampaignFilterId(searchParams.get('campaign') ?? '');
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Campaign metadata (name/discount) for the filter banner — the product
  // list itself only needs the id (passed straight to the backend), but the
  // banner needs something human-readable to show what's being browsed.
  useEffect(() => {
    if (!campaignFilterId) { setCampaignFilterInfo(null); return; }
    let cancelled = false;
    apiGetPublicActiveCampaigns()
      .then(res => { if (!cancelled) setCampaignFilterInfo((res.data ?? []).find(c => c._id === campaignFilterId) ?? null); })
      .catch(() => { if (!cancelled) setCampaignFilterInfo(null); });
    return () => { cancelled = true; };
  }, [campaignFilterId]);

  const clearCampaignFilter = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('campaign');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    apiGetTopStores(10)
      .then(res => { if (!cancelled) setTopStores(res.data?.stores ?? []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Store/seller matches for the navbar search — runs alongside the existing
  // client-side product filter, so search covers both products and stores.
  useEffect(() => {
    if (!search) { setStoreResults([]); return; }
    let cancelled = false;
    apiSearchStores(search, 1, 6)
      .then(res => { if (!cancelled) setStoreResults(res.data?.stores ?? []); })
      .catch(() => { if (!cancelled) setStoreResults([]); });
    return () => { cancelled = true; };
  }, [search]);

  const handleCategoryChange = (id: string) => {
    setSelectedCategory(id);
    setPage(1);
  };

  const LIMIT = 20;
  const { products, total, loading, error, refetch } = useProductsByCategory(
    page, LIMIT, selectedCategory || undefined, undefined, undefined, undefined, campaignFilterId || undefined,
  );
  const { addToCart, adding }    = useCartContext();
  const { isWishlisted, wishlisting, toggleWishlist } = useWishlistContext();
  const { banners } = useBanners();
  const countdown = useCountdownToMidnight();

  // Marketplace-wide pool (unfiltered by the user's current category/search) used to
  // surface real, currently-active discounts and real purchase/rating signals —
  // independent of whatever the shopper happens to be filtering by right now.
  const { products: featuredPool } = useProductsByCategory(1, 24);

  const flashDeals = featuredPool
    .map(p => {
      const dv = (p.variants ?? []).find(v => v.isDefault) ?? p.variants?.[0];
      const price = dv?.price ?? 0;
      const compareAt = dv?.compareAtPrice ?? null;
      const pct = compareAt != null && compareAt > price ? Math.round((1 - price / compareAt) * 100) : 0;
      return { product: p, pct };
    })
    .filter(x => x.pct > 0)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 10);

  const topPicks = [...featuredPool]
    .sort((a, b) => (b.purchaseCount + b.averageRating * 10) - (a.purchaseCount + a.averageRating * 10))
    .slice(0, 10);

  const totalPages = Math.ceil(total / LIMIT) || 1;
  const isPriceRangeActive = filters.priceRange[0] !== PRICE_MIN || filters.priceRange[1] !== PRICE_MAX;
  const activeFilterCount = (isPriceRangeActive ? 1 : 0) + filters.type.length + filters.rating.length;

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const toggleFilter = (key: 'type' | 'rating', value: string) => {
    setFilters(prev => {
      const arr = prev[key];
      return { ...prev, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  const setPriceRange = (range: [number, number]) => setFilters(prev => ({ ...prev, priceRange: range }));

  const clearFilters = () => setFilters({ priceRange: [PRICE_MIN, PRICE_MAX], type: [], rating: [] });

  // Active filter chip strip — one removable chip per currently-applied facet,
  // so a shopper can see (and undo) exactly what's narrowing the grid without
  // opening the sidebar accordion it came from.
  const activeFilterChips: { key: string; label: string; onRemove: () => void }[] = [
    ...(selectedCategory
      ? [{ key: 'category', label: categories.find(c => c._id === selectedCategory)?.name ?? 'Category', onRemove: () => handleCategoryChange('') }]
      : []),
    ...(isPriceRangeActive
      ? [{
          key: 'price',
          label: filters.priceRange[1] >= PRICE_MAX ? `$${filters.priceRange[0]}+` : `$${filters.priceRange[0]}–$${filters.priceRange[1]}`,
          onRemove: () => setPriceRange([PRICE_MIN, PRICE_MAX]),
        }]
      : []),
    ...filters.type.map(t => ({ key: `type-${t}`, label: t, onRemove: () => toggleFilter('type', t) })),
    ...filters.rating.map(r => ({ key: `rating-${r}`, label: r, onRemove: () => toggleFilter('rating', r) })),
  ];

  const goToPage = (p: number) => { setPage(p); scrollRootToTop('smooth'); };

  const handleCardClick = useCallback((id: string) => navigate(`/marketplace/${id}`), [navigate]);
  const handleAddToCart = useCallback((e: React.MouseEvent, id: string, variantId: string, type: 'physical' | 'digital') => {
    e.stopPropagation();
    if (variantId) addToCart(id, variantId, type);
  }, [addToCart]);
  const handleToggleWishlist = useCallback((e: React.MouseEvent, id: string, variantId: string) => {
    e.stopPropagation();
    if (variantId) toggleWishlist(id, variantId);
  }, [toggleWishlist]);

  const matchesPriceFilter = (price: number | null) => {
    if (!isPriceRangeActive || price == null) return true;
    const [min, max] = filters.priceRange;
    if (price < min) return false;
    if (max < PRICE_MAX && price > max) return false; // max at the slider's cap means "and up" — no upper bound
    return true;
  };

  const matchesRatingFilter = (rating: number) => {
    if (filters.rating.length === 0) return true;
    return filters.rating.some(label => {
      if (label === '4★ & up') return rating >= 4;
      if (label === '3★ & up') return rating >= 3;
      return true;
    });
  };

  const filtered = products
    .filter(p => {
      const pType = p.productType ?? p.type ?? 'physical';
      if (filters.type.length > 0 && !filters.type.some(t => t.toLowerCase() === pType)) return false;
      if (search && !p.name.toLowerCase().includes(search) && !p.tags?.some(t => t.toLowerCase().includes(search))) return false;
      const lowestPrice = p.variants?.length > 0 ? Math.min(...p.variants.map(v => v.price)) : null;
      if (!matchesPriceFilter(lowestPrice)) return false;
      if (!matchesRatingFilter(p.averageRating)) return false;
      return true;
    })
    .sort((a, b) => {
      const priceOf = (p: MarketplaceProduct) => p.variants?.length > 0 ? Math.min(...p.variants.map(v => v.price)) : 0;
      if (sortBy === 'price-asc')  return priceOf(a) - priceOf(b);
      if (sortBy === 'price-desc') return priceOf(b) - priceOf(a);
      if (sortBy === 'best-rated') return b.averageRating - a.averageRating;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Filters/search only narrow down the current page's results (not a fresh
  // server query), so "X of {total}" would misreport the total once any are
  // active — total describes the unfiltered category, not the filtered set.
  const isNarrowedView = activeFilterCount > 0 || !!search;
  const countLabel = isNarrowedView
    ? `${filtered.length} matching on this page`
    : `${filtered.length} of ${total} products`;

  return (
    <div className="min-h-screen bg-cream">

      <BuyerNavbar
        search={{
          value: searchInput,
          onChange: setSearchInput,
          placeholder: 'Search marketplace...',
          categories: categories.map(c => ({ id: c._id, name: c.name })),
          onCategorySelect: handleCategoryChange,
        }}
      />

      <DealsBanner />

      {/* ── Hero ─ full-bleed banner with overlaid copy ─────────────────────── */}
      <div className="relative overflow-hidden h-[300px] sm:h-[360px] lg:h-[420px] border-b border-[#F5D5C2]">

        {/* Background: live promo banner if available, else brand gradient */}
        {banners.length > 0 ? (
          <BannerCarousel banners={banners} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#FBECE4] via-[#FDF1E9] to-[#FFF5EE]">
            <div className="absolute -top-16 -right-16 size-64 rounded-full bg-brand-orange/[0.08] blur-3xl pointer-events-none" />
            <ShoppingBag size={220} className="absolute -bottom-10 -right-10 text-brand-orange/[0.08] hidden sm:block" />
          </div>
        )}

        {/* Legibility scrim — always present so overlaid text reads over any banner image */}
        <div className={clsx(
          'absolute inset-0 pointer-events-none',
          banners.length > 0
            ? 'bg-gradient-to-r from-black/65 via-black/30 to-transparent'
            : '',
        )} />

        {/* Overlaid copy */}
        <div className="relative z-[1] h-full flex items-center px-4 sm:px-6 lg:px-10">
          <div className="min-w-0 max-w-[520px]">
            <span className={clsx(
              'inline-block text-[10px] font-bold uppercase tracking-[0.12em] rounded-full px-3 py-1 mb-3 border',
              banners.length > 0
                ? 'text-white bg-white/15 border-white/25 backdrop-blur-sm'
                : 'text-brand-deep-orange bg-white/60 border-brand-orange/20',
            )}>
              The marketplace for makers
            </span>
            <h1 className={clsx(
              'font-serif text-[26px] sm:text-[32px] lg:text-[40px] font-bold mb-3 leading-[1.12] tracking-tight',
              banners.length > 0 ? 'text-white' : 'text-carbon',
            )}>
              Discover Something<br className="hidden sm:block" /> Made with Love
            </h1>
            <p className={clsx(
              'text-[12px] sm:text-[13px] mb-5 leading-[1.6]',
              banners.length > 0 ? 'text-white/85' : 'text-slate',
            )}>
              Shop unique products from independent sellers, creators, and educators.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => document.getElementById('marketplace-grid')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Shop Now <span className="ml-1">→</span>
            </Button>

            {/* Trust indicators — real capability statements, not fabricated stats */}
            <div className={clsx(
              'flex flex-wrap items-center gap-x-4 gap-y-2 mt-5 text-[11px] font-medium',
              banners.length > 0 ? 'text-white/80' : 'text-charcoal/70',
            )}>
              <span className="flex items-center gap-[5px]"><ShieldCheck size={13} className="text-brand-orange" /> Secure Checkout</span>
              <span className="flex items-center gap-[5px]"><BadgeCheck size={13} className="text-brand-orange" /> Verified Sellers</span>
              <span className="flex items-center gap-[5px]"><RefreshCcw size={13} className="text-brand-orange" /> Easy Returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Trust & Service strip ────────────────────────────────────────────── */}
      <TrustServiceStrip />

      {/* ── Full-width mega-menu bar — All Categories / Flash Sale / Top Picks / Featured Sellers / About ── */}
      <MegaMenuBar
        categories={categories}
        topPicks={topPicks}
        flashDeals={flashDeals}
        topStores={topStores}
        countdown={countdown}
        onShopCategory={handleCategoryChange}
        onProductClick={handleCardClick}
        onStoreClick={slug => navigate(`/store/${slug}`)}
        onTrendingTerm={term => { setSearchInput(term); setSearch(term); }}
        onNavigate={navigate}
      />

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-5 lg:py-6">

        {/* Mobile: filter + sort bar */}
        <div className="lg:hidden flex items-center justify-between gap-3 mb-4">
          <button
            onClick={() => setMobileFilters(true)}
            className={clsx(
              'flex items-center gap-2 px-3 min-h-11 rounded-[10px] border text-[13px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange',
              activeFilterCount > 0
                ? 'bg-brand-pale-orange border-brand-orange text-brand-deep-orange'
                : 'bg-white border-bone text-charcoal hover:bg-cream',
            )}
          >
            <SlidersHorizontal size={14} strokeWidth={2} />
            Filters
            {activeFilterCount > 0 && (
              <span className="min-w-[18px] h-[18px] rounded-full bg-brand-orange text-white text-[9px] font-bold flex items-center justify-center px-[4px] leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
          <FilterDropdown options={SORT_OPTIONS} value={sortBy} onChange={setSortBy} />
        </div>

        {/* Stores matching the current search — sits above the product grid so a
            search for a seller's name surfaces the store itself, not just products. */}
        {search && storeResults.length > 0 && (
          <div className="mb-5">
            <p className="text-[11px] font-semibold text-slate uppercase tracking-[0.08em] mb-[10px]">
              Stores matching "{search}"
            </p>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {storeResults.map(s => (
                <StoreFeatureCard key={s.storeId} store={s} onClick={slug => navigate(`/store/${slug}`)} />
              ))}
            </div>
          </div>
        )}

        {/* Active campaign filter — cleared explicitly, never silently dropped,
            so a buyer always knows they're viewing a narrowed "sale" set.
            When the campaign has an uploaded banner image, this is its real
            showcase — there's enough height here for a normal photo to read
            properly (unlike the thin DealsBanner ticker, which only ever
            shows a small recognizable preview of the same image). */}
        {campaignFilterId && (
          campaignFilterInfo?.bannerImage ? (
            <div className="relative mb-5 overflow-hidden rounded-[14px] h-[140px] sm:h-[170px]">
              <img src={campaignFilterInfo.bannerImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />
              <button
                onClick={clearCampaignFilter}
                className="absolute top-3 right-3 flex items-center gap-1 rounded-full border border-white/30 bg-black/30 px-3 min-h-10 text-[12px] font-semibold text-white cursor-pointer hover:bg-black/45 backdrop-blur-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <X size={12} /> Clear
              </button>
              <div className="absolute inset-x-0 bottom-0 px-4 pb-3.5 pt-8 sm:px-5">
                <p className="font-serif text-[18px] sm:text-[22px] font-bold text-white leading-tight">{campaignFilterInfo.name}</p>
                <p className="text-[12px] sm:text-[13px] text-white/85 mt-1">
                  {!loading && `${total} product${total === 1 ? '' : 's'} from participating stores`}
                  {campaignFilterInfo.discountType && campaignFilterInfo.discountValue != null && (
                    <> · {campaignFilterInfo.discountType === 'percentage' ? `Up to ${campaignFilterInfo.discountValue}% off` : `$${campaignFilterInfo.discountValue} off`}</>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-5 flex items-center gap-3 rounded-[12px] border border-brand-orange/25 bg-brand-pale-orange px-4 py-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-brand-orange">
                <Zap size={15} className="fill-brand-orange" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-brand-deep-orange truncate">
                  {campaignFilterInfo ? `Shopping: ${campaignFilterInfo.name}` : 'Shopping a platform sale'}
                </p>
                <p className="text-[11.5px] text-charcoal/70">
                  {!loading && `${total} product${total === 1 ? '' : 's'} from participating stores`}
                  {campaignFilterInfo?.discountType && campaignFilterInfo.discountValue != null && (
                    <> · {campaignFilterInfo.discountType === 'percentage' ? `Up to ${campaignFilterInfo.discountValue}% off` : `$${campaignFilterInfo.discountValue} off`}</>
                  )}
                </p>
              </div>
              <button
                onClick={clearCampaignFilter}
                className="shrink-0 flex items-center gap-1 rounded-full border border-brand-orange/30 bg-white px-3 min-h-10 text-[12px] font-semibold text-brand-deep-orange cursor-pointer hover:bg-brand-pale-orange transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
              >
                <X size={12} /> Clear
              </button>
            </div>
          )
        )}

        <div className="flex gap-5 lg:gap-6 items-start">

          {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
          <aside className="hidden lg:block w-[220px] xl:w-[240px] shrink-0 sticky top-[68px] self-start">
            <div className="bg-white rounded-[20px] border border-bone overflow-hidden flex flex-col max-h-[calc(100vh-96px)]">
              {/* Sticky header — stays put while the accordion body below scrolls */}
              <div className="shrink-0 px-4 py-3 border-b border-bone flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={15} className="text-charcoal" strokeWidth={2} />
                  <span className="text-[14px] font-bold text-carbon">Filters</span>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="shrink-0 text-[11.5px] font-semibold text-brand-orange hover:opacity-70 transition-opacity duration-200 cursor-pointer p-2 -m-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="px-4 py-1 overflow-y-auto">
                <FilterPanel filters={filters} onChange={toggleFilter} onPriceRangeChange={setPriceRange} categories={categories} selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} />
              </div>
            </div>
          </aside>

          {/* ── Products area ─────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Active filter chips — one removable chip per applied facet */}
            {activeFilterChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {activeFilterChips.map(chip => (
                  <ActiveFilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
                ))}
              </div>
            )}

            {/* Desktop: count + sort row */}
            <div className="hidden lg:flex items-center justify-between mb-4">
              <span className="text-[13px] text-slate">
                {!loading && (error ? 'Error loading' : `Showing ${countLabel}`)}
              </span>
              <FilterDropdown options={SORT_OPTIONS} value={sortBy} onChange={setSortBy} />
            </div>

            {/* Mobile: product count */}
            <p className="lg:hidden text-[12px] text-slate mb-3">
              {!loading && !error && countLabel}
            </p>

            {error && !loading && (
              <div className="p-6 flex flex-col items-center gap-3 text-center bg-error-bg rounded-[12px] border border-[#FECACA] text-error text-[13px]">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={refetch}>Try again</Button>
              </div>
            )}

            {/* Capped at 4 columns — cards get wider (not more numerous) past lg,
                so they stay comfortably readable instead of shrinking indefinitely
                on very wide screens: 2 @ 320-767 → 3 @ md → 4 @ lg and up. */}
            <div id="marketplace-grid" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[10px] sm:gap-3 lg:gap-[14px] scroll-mt-[76px]">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : filtered.map(p => {
                    const defVariant = (p.variants ?? []).find(v => v.isDefault) ?? p.variants?.[0];
                    const vId = defVariant?._id ?? '';
                    return (
                      <ProductCard
                        key={p._id}
                        product={p}
                        onClick={handleCardClick}
                        isAdding={adding === vId}
                        onAddToCart={handleAddToCart}
                        isWishlisted={isWishlisted(p._id, vId)}
                        isWishlisting={wishlisting === vId}
                        onToggleWishlist={handleToggleWishlist}
                      />
                    );
                  })
              }
            </div>

            {!loading && !error && filtered.length === 0 && (
              <div className="text-center py-[60px] text-slate text-[14px]">
                {search || activeFilterCount > 0
                  ? 'No products match your search or filters.'
                  : 'No products found in this category yet.'}
              </div>
            )}

            {!loading && !error && totalPages > 1 && (
              <div className="flex flex-col items-center gap-2 mt-8 pb-2">
                <Pagination page={page} total={total} perPage={LIMIT} onChange={goToPage} />
                <p className="text-[12px] text-slate text-center">
                  Page {page} of {totalPages} · {total} products total
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── App download + footer ────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-10 pb-8 pt-2">
        <AppDownloadBanner />
      </div>
      <Footer />
      <FloatingAppWidget />

      {/* ── Mobile filter bottom sheet ────────────────────────────────────────── */}
      <div
        className={clsx(
          'fixed inset-0 bg-black/40 z-[59] lg:hidden transition-opacity duration-300',
          mobileFilters ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setMobileFilters(false)}
      />

      <div
        className={clsx(
          'fixed bottom-0 left-0 right-0 z-[60] bg-white lg:hidden',
          'rounded-t-[20px]',
          'transition-transform duration-300 ease-out',
          mobileFilters ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className="flex justify-center pt-[10px] pb-[4px]">
          <div className="w-9 h-[4px] bg-bone rounded-full" />
        </div>

        <div className="flex items-start justify-between px-5 py-3 border-b border-bone">
          <div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={15} className="text-charcoal" strokeWidth={2} />
              <span className="text-[15px] font-bold text-carbon">Filters</span>
              {activeFilterCount > 0 && (
                <span className="min-w-[18px] h-[18px] rounded-full bg-brand-orange text-white text-[9px] font-bold flex items-center justify-center px-[4px] leading-none">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate mt-1 ml-[22px]">
              {!loading && `${total} product${total === 1 ? '' : 's'}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-[12px] font-medium text-slate hover:text-brand-orange transition-colors duration-200 cursor-pointer p-2 -m-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
              >
                <RefreshCcw size={12} /> Reset All
              </button>
            )}
            <button
              onClick={() => setMobileFilters(false)}
              className="size-11 rounded-full bg-cream flex items-center justify-center cursor-pointer hover:bg-bone transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
            >
              <X size={15} className="text-charcoal" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 overflow-y-auto max-h-[55vh]">
          <FilterPanel filters={filters} onChange={toggleFilter} onPriceRangeChange={setPriceRange} categories={categories} selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} />
        </div>

        <div className="px-5 pt-3 pb-6 border-t border-bone">
          <button
            onClick={() => setMobileFilters(false)}
            className="w-full bg-brand-orange text-white py-[13px] rounded-[12px] text-[14px] font-semibold cursor-pointer hover:opacity-[0.9] transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
          >
            {activeFilterCount > 0 ? `Apply ${activeFilterCount} Filter${activeFilterCount > 1 ? 's' : ''}` : 'Done'}
          </button>
        </div>
      </div>

    </div>
  );
}
