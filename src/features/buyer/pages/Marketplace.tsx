import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useProductsByCategory } from '@/hooks/marketplace/useProductsByCategory';
import { useProductSearch } from '@/hooks/marketplace/useProductSearch';
import type { MarketplaceSortBy } from '@/api/services/marketplace';
import { useBanners } from '@/hooks/useBanners';
import { useCountdownToMidnight } from '@/hooks/useCountdownToMidnight';
import { useCartContext } from '@/contexts/CartContext';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { Button } from '@/components/comman/ui/Button';
import { Pagination, FilterDropdown, BuyerNavbar, SearchBox, AppDownloadBanner, Footer, TrustServiceStrip, StoreFeatureCard, FloatingAppWidget, EmptyState } from '@/components/comman/ui';
import { ProductCard, ProductCardSkeleton } from '@/components/comman/marketplace/ProductCard';
import { FlashSaleCard } from '@/components/comman/marketplace/FlashSaleCard';
import { FilterAccordionSection, FilterRadioRow, FilterCheckboxRow, FilterStarRow, ActiveFilterChip, PriceRangeSlider, PRICE_MIN, PRICE_MAX } from '@/components/comman/marketplace/FilterAccordionSection';
import { MegaMenuBar } from '@/components/comman/marketplace/MegaMenuBar';
import { WelcomeStrip } from '@/components/comman/marketplace/WelcomeStrip';
import {
  ShoppingBag,
  SlidersHorizontal, X, Zap, LayoutGrid, LayoutList,
  RefreshCcw,
} from 'lucide-react';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { currencySymbol } from '@/utils/currency';
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

  // Every one of these is seeded from the URL on first mount so a shared/
  // bookmarked/back-button link reproduces the exact same browse state.
  const [sortBy,        setSortBy]        = useState(() => searchParams.get('sort') ?? 'newest');
  const [viewMode,      setViewMode]      = useState<'grid' | 'list'>('grid');
  const [page,          setPage]          = useState(() => { const p = Number(searchParams.get('page')); return p > 0 ? p : 1; });
  const [mobileFilters, setMobileFilters] = useState(false);
  // Flash Sale rail auto-advances one card at a time — paused on hover/touch
  // so a shopper reading or reaching for a card never has it slide away
  // mid-interaction.
  const flashSaleTrackRef = useRef<HTMLDivElement>(null);
  const [flashSalePaused, setFlashSalePaused] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ priceRange: [PRICE_MIN, PRICE_MAX], type: [], rating: [] });
  const isPriceRangeActive = filters.priceRange[0] !== PRICE_MIN || filters.priceRange[1] !== PRICE_MAX;
  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') ?? '');
  const [search,      setSearch]      = useState(() => (searchParams.get('search') ?? '').trim().toLowerCase());
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

  // Re-sync category/campaign when ?category=/?campaign= change while already
  // on this page from a raw navigate() elsewhere (e.g. DealsBanner's "Shop the
  // Sale") — the initial-mount case is covered by the useState initializers
  // above. Tracked against a ref of the last URL values we ourselves saw (not
  // against current state) so this doesn't fight the write-back effect below,
  // which echoes state into the URL on every change and would otherwise
  // re-trigger this effect and stomp the page number back to 1 forever.
  const lastUrlFilters = useRef({ category: selectedCategory, campaign: campaignFilterId });
  useEffect(() => {
    const fromUrl = searchParams.get('category') ?? '';
    const fromUrlCampaign = searchParams.get('campaign') ?? '';
    if (fromUrl !== lastUrlFilters.current.category || fromUrlCampaign !== lastUrlFilters.current.campaign) {
      setSelectedCategory(fromUrl);
      setCampaignFilterId(fromUrlCampaign);
      setPage(1);
    }
    lastUrlFilters.current = { category: fromUrl, campaign: fromUrlCampaign };
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

  // Reset to page 1 whenever the active facet set actually changes (new
  // category/campaign/search/sort) — not on every page-number change itself,
  // which would otherwise loop with the URL write-back effect below.
  const isFirstFacetRun = useRef(true);
  useEffect(() => {
    if (isFirstFacetRun.current) { isFirstFacetRun.current = false; return; }
    setPage(1);
    // Price/rating/type are now real server-side facets (see serverMinPrice/
    // serverMinRating/serverProductType above), so changing them must reset
    // the page like every other facet — otherwise a filter change while on
    // page 3 would fetch page 3 of the NEW filtered set instead of page 1.
  }, [selectedCategory, campaignFilterId, search, sortBy, filters.priceRange[0], filters.priceRange[1], filters.type.join(','), filters.rating.join(',')]);

  // Write the current browse state into the URL — shareable/bookmarkable,
  // and what lets a back/forward navigation or a pasted link reproduce this
  // exact view. `replace` so typing/paging doesn't spam browser history.
  useEffect(() => {
    const next = new URLSearchParams();
    if (selectedCategory)    next.set('category', selectedCategory);
    if (campaignFilterId)    next.set('campaign', campaignFilterId);
    if (search)              next.set('search', search);
    if (sortBy !== 'newest') next.set('sort', sortBy);
    if (page > 1)            next.set('page', String(page));
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, campaignFilterId, search, sortBy, page]);

  const handleCategoryChange = (id: string) => {
    setSelectedCategory(id);
  };

  // Browsing (an active search, category, or campaign filter) replaces the
  // homepage-style landing view (Hero + Trust Strip) with results, immediately
  // — same behavior Amazon/Alibaba use once a shopper has committed to a query.
  const isBrowsing = !!search || !!selectedCategory || !!campaignFilterId;

  const LIMIT = 20;

  // Real server-side facets — the backend's products-by-category endpoint
  // already supports minPrice/maxPrice/minRating/sortBy (see
  // ProductsController), it just wasn't being sent. `productType` only goes
  // server-side when exactly one type is checked (the endpoint takes a
  // single value, not a set) — with 0 or 2+ types checked, `filtered` below
  // still does a light client-side pass on top of the (now-correct) fetched
  // page, same as before for that one edge case only.
  const serverSortBy: MarketplaceSortBy | undefined =
    sortBy === 'price-asc' ? 'price_asc' :
    sortBy === 'price-desc' ? 'price_desc' :
    sortBy === 'best-rated' ? 'rating' : undefined;
  const serverProductType = filters.type.length === 1
    ? (filters.type[0].toLowerCase() as 'physical' | 'digital' | 'educational')
    : undefined;
  const serverMinPrice = isPriceRangeActive ? filters.priceRange[0] : undefined;
  const serverMaxPrice = isPriceRangeActive && filters.priceRange[1] < PRICE_MAX ? filters.priceRange[1] : undefined;
  const serverMinRating = filters.rating.includes('4★ & up') ? 4 : filters.rating.includes('3★ & up') ? 3 : undefined;

  // A real search term switches the data source entirely to the dedicated
  // full-catalog search endpoint (useProductSearch) instead of narrowing
  // whatever single category-scoped page happened to already be loaded —
  // that endpoint doesn't support category/price/rating/type facets, so an
  // active search intentionally takes priority over those for now.
  const browseResult = useProductsByCategory(
    page, LIMIT, selectedCategory || undefined, serverProductType, undefined, undefined, campaignFilterId || undefined,
    serverMinPrice, serverMaxPrice, serverMinRating, serverSortBy,
  );
  const searchResult = useProductSearch(search, page, LIMIT);
  const { products, total, loading, error, refetch } = search ? searchResult : browseResult;
  const { addToCart, adding }    = useCartContext();
  const { isWishlisted, wishlisting, toggleWishlist } = useWishlistContext();
  const { currency: displayCurrency, convert } = useCurrencyPreference();
  const priceSymbol = currencySymbol(displayCurrency);
  const { banners: marketplaceBanners } = useBanners('marketplaceHero');
  // Category Hero — same hero region, but scoped to the `categoryHero`
  // placement whenever the shopper is browsing a specific category (via the
  // mega-menu/sidebar/?category= link), instead of the generic marketplace-wide banner.
  const { banners: categoryBanners } = useBanners('categoryHero');
  const banners = selectedCategory ? categoryBanners : marketplaceBanners;
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

  // Distinct real signal from topPicks — pure rating (tie-broken by review
  // count), not the purchase+rating blend, so Top Picks' second section
  // isn't just the same list under a different name.
  const bestRated = [...featuredPool]
    .filter(p => p.averageRating > 0)
    .sort((a, b) => b.averageRating - a.averageRating || (b.totalRatings ?? 0) - (a.totalRatings ?? 0))
    .slice(0, 10);

  // Auto-scroll the Flash Sale rail one card at a time, looping back to the
  // start at the end — pauses on hover/touch (see the handlers on the rail
  // below) so it never fights a shopper's own scroll/tap.
  useEffect(() => {
    const track = flashSaleTrackRef.current;
    if (!track || flashSalePaused || flashDeals.length === 0) return;
    const id = setInterval(() => {
      const card = track.firstElementChild as HTMLElement | null;
      const step = (card?.offsetWidth ?? 140) + 12; // card width + the rail's gap-3
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + step, behavior: 'smooth' });
    }, 2200);
    return () => clearInterval(id);
  }, [flashSalePaused, flashDeals.length]);

  const totalPages = Math.ceil(total / LIMIT) || 1;
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

  // Price/rating/sort/search/single-selected-type are all real server-side
  // facets now (see serverMinPrice/serverMaxPrice/serverMinRating/
  // serverSortBy/serverProductType above and useProductSearch for the search
  // path) — `products`/`total` already reflect the correctly filtered full
  // result set, not just today's page. The only thing still applied
  // client-side here is the 2-or-more-types-checked case, since the backend
  // only accepts one `productType` value at a time.
  const multiTypeSelected = filters.type.length > 1;
  const filtered = multiTypeSelected
    ? products.filter(p => {
        const pType = p.productType ?? p.type ?? 'physical';
        return filters.type.some(t => t.toLowerCase() === pType);
      })
    : products;

  // Only the multi-type-select edge case still only narrows the current
  // page rather than the full result set — everything else (search, price,
  // rating, sort, a single selected type) is a real server query, so the
  // total/range below is accurate for it.
  const isNarrowedView = multiTypeSelected;
  const rangeStart = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const rangeEnd   = Math.min(page * LIMIT, total);
  const countLabel = isNarrowedView
    ? `${filtered.length} matching on this page`
    : `${rangeStart}–${rangeEnd} of ${total} Products`;

  return (
    <div className="min-h-screen bg-cream">

      <BuyerNavbar
        hideSearch
        search={{
          value: searchInput,
          onChange: setSearchInput,
          placeholder: 'Search marketplace...',
          categories: categories.map(c => ({ id: c._id, name: c.name })),
          onCategorySelect: handleCategoryChange,
          popularStores: topStores,
        }}
      />

      {/* ── Marketplace navigation — single merged row: All Categories + Flash
         Sale/Top Picks/Featured Stores/About (real discovery features, kept —
         not removed), plus the utility links on the right. Sits above the
         hero banner/search bar, not below, so the full navigation is visible
         before a shopper ever scrolls past the hero. ── */}
      <MegaMenuBar
        compact
        categories={categories}
        topPicks={topPicks}
        bestRated={bestRated}
        flashDeals={flashDeals}
        topStores={topStores}
        countdown={countdown}
        onShopCategory={handleCategoryChange}
        onProductClick={handleCardClick}
        onStoreClick={slug => navigate(`/${slug}`)}
        onTrendingTerm={term => { setSearchInput(term); setSearch(term); }}
        onNavigate={navigate}
      />

      {/* ── Big search bar — the real navbar SearchBox (same suggestions
         dropdown, same searchInput/search state), just rendered at its `lg`
         scale as a standalone hero search. The navbar's own compact copy is
         hidden on this page (hideSearch above) so this is the one and only
         search entry point, not a second, disconnected one. ── */}
      <div className="bg-gradient-to-b from-brand-pale-orange/60 via-brand-pale-orange/25 to-transparent px-4 sm:px-6 lg:px-10 py-7 sm:py-9 flex justify-center">
        <SearchBox
          size="lg"
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search for products, brands, and stores..."
          categories={categories.map(c => ({ id: c._id, name: c.name }))}
          onCategorySelect={handleCategoryChange}
          popularStores={topStores}
          onSubmit={term => setSearch((term ?? searchInput).trim().toLowerCase())}
        />
      </div>

      {/* ── "Welcome to Solvexo" discovery strip — Categories for you, plus
         the real Hero Banner and DealsBanner side by side. Replaces the old
         separately-stacked DealsBanner + full-bleed hero sections that used
         to sit here. ── */}
      <div className="px-4 sm:px-6 lg:px-10 pb-5">
        <WelcomeStrip
          categories={categories}
          topPicks={topPicks}
          banners={banners.map(b => ({ _id: b._id, order: b.order, imageUrl: b.bannerImage, linkUrl: b.urlOnTap }))}
          onShopCategory={handleCategoryChange}
          onProductClick={handleCardClick}
          onTrendingTerm={term => { setSearchInput(term); setSearch(term); }}
          onNavigate={navigate}
        />
      </div>

      {/* ── Trust & Service strip — now below the hero, not right after the
         navbar, so the hero image is the first thing a visitor sees. ── */}
      <TrustServiceStrip />

      {/* ── Flash Sale — a compact, always-visible rail (real discount signal
         from the same `flashDeals` pool the mega-menu dropdown already uses),
         not just hidden behind a hover trigger. Hidden while actively
         browsing/searching — a discovery rail doesn't belong above a
         shopper's own filtered results. Reuses FlashSaleCard as-is (already
         used by Homepage's rail) rather than a new component. ── */}
      {!isBrowsing && flashDeals.length > 0 && (
        <div className="px-4 sm:px-6 lg:px-10 pt-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-error-bg text-error">
                <Zap size={14} className="fill-error" />
              </span>
              <h2 className="font-serif text-[16px] sm:text-[19px] font-bold text-carbon tracking-[-0.01em]">Flash Sale</h2>
            </div>
            <div className="flex items-center gap-[6px] text-[11px] sm:text-[12px] font-semibold text-slate">
              <span className="hidden sm:inline">Ends in</span>
              <span className="tabular-nums text-error font-bold">{countdown.h}:{countdown.m}:{countdown.s}</span>
            </div>
          </div>
          <div
            ref={flashSaleTrackRef}
            onMouseEnter={() => setFlashSalePaused(true)}
            onMouseLeave={() => setFlashSalePaused(false)}
            onTouchStart={() => setFlashSalePaused(true)}
            onTouchEnd={() => setTimeout(() => setFlashSalePaused(false), 1500)}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 snap-x snap-mandatory scroll-smooth"
          >
            {flashDeals.map(({ product: p }) => {
              const dv = (p.variants ?? []).find(v => v.isDefault) ?? p.variants?.[0];
              const vId = dv?._id ?? '';
              return (
                <div key={p._id} className="w-[118px] sm:w-[132px] lg:w-[144px] shrink-0 snap-start">
                  <FlashSaleCard
                    compact
                    product={p}
                    onClick={handleCardClick}
                    isAdding={adding === vId}
                    onAddToCart={handleAddToCart}
                    isWishlisted={isWishlisted(p._id, vId)}
                    isWishlisting={wishlisting === vId}
                    onToggleWishlist={handleToggleWishlist}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-5 lg:py-6">

        {/* Results heading — only when browsing (search/category/campaign), so
            a shopper always knows what narrowed the grid they're looking at.
            Category/campaign already get their own indicator further down
            (the removable category chip / the campaign banner) — this only
            fills the one real gap: there was no visible confirmation of what
            was typed into the search box. */}
        {isBrowsing && search && (
          <p className="text-[13px] text-slate mb-4">
            Search results for <span className="font-semibold text-carbon">"{search}"</span>
          </p>
        )}

        {/* Sort/view toolbar — Filters now lives on its own tab stuck to the
           left edge of the viewport (see below), not in this row. */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <span className="text-[13px] font-medium text-slate">
            {!loading && (error ? 'Error loading' : <>Showing <span className="text-carbon font-semibold">{countLabel}</span></>)}
          </span>
          <div className="flex items-center gap-3">
            <FilterDropdown options={SORT_OPTIONS} value={sortBy} onChange={setSortBy} />
            <div className="hidden sm:flex items-center gap-[2px] rounded-lg border border-bone bg-white p-[3px]">
              <button
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
                className={clsx(
                  'flex items-center justify-center w-8 h-8 rounded-md cursor-pointer transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange',
                  viewMode === 'grid' ? 'bg-brand-pale-orange text-brand-orange' : 'bg-transparent text-slate hover:text-charcoal',
                )}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
                className={clsx(
                  'flex items-center justify-center w-8 h-8 rounded-md cursor-pointer transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange',
                  viewMode === 'list' ? 'bg-brand-pale-orange text-brand-orange' : 'bg-transparent text-slate hover:text-charcoal',
                )}
              >
                <LayoutList size={15} />
              </button>
            </div>
          </div>
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
                <StoreFeatureCard key={s.storeId} store={s} onClick={slug => navigate(`/${slug}`)} />
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
                    <> · {campaignFilterInfo.discountType === 'percentage' ? `Up to ${campaignFilterInfo.discountValue}% off` : `${priceSymbol}${convert(campaignFilterInfo.discountValue as number, campaignFilterInfo.currency ?? 'USD')} off`}</>
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
                    <> · {campaignFilterInfo.discountType === 'percentage' ? `Up to ${campaignFilterInfo.discountValue}% off` : `${priceSymbol}${convert(campaignFilterInfo.discountValue as number, campaignFilterInfo.currency ?? 'USD')} off`}</>
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

        {/* ── Products area — full width, no persistent sidebar (Filters
           lives in the toolbar above, opening the same panel as a bottom
           sheet at every breakpoint). ── */}
        <div>

          {/* Active filter chips — one removable chip per applied facet */}
          {activeFilterChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {activeFilterChips.map(chip => (
                <ActiveFilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
              ))}
            </div>
          )}

          {/* Mobile: product count (sm+ already shows this inline in the toolbar above) */}
          <p className="sm:hidden text-[12px] text-slate mb-3">
            {!loading && !error && countLabel}
          </p>

          {error && !loading && (
            <div className="p-6 flex flex-col items-center gap-3 text-center bg-error-bg rounded-[12px] border border-error-border text-error text-[13px]">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={refetch}>Try again</Button>
            </div>
          )}

          {/* No sidebar to share width with anymore, so the grid gets a wider
              ceiling: 2 @ 320-767 → 3 @ md → 4 @ lg → 5 @ xl, denser like a
              full-width marketplace grid instead of stopping at 4 columns.
              List view collapses to a single column of horizontal rows. */}
          <div
            id="marketplace-grid"
            className={clsx(
              'scroll-mt-[76px]',
              viewMode === 'list'
                ? 'flex flex-col gap-3'
                : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5',
            )}
          >
            {loading
              ? Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} layout={viewMode} />)
              : filtered.map(p => {
                  const defVariant = (p.variants ?? []).find(v => v.isDefault) ?? p.variants?.[0];
                  const vId = defVariant?._id ?? '';
                  return (
                    <ProductCard
                      key={p._id}
                      layout={viewMode}
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
            <EmptyState
              icon={<ShoppingBag size={30} className="text-brand-orange" />}
              title={search || activeFilterCount > 0 ? 'No products match' : 'No products yet'}
              description={
                search || activeFilterCount > 0
                  ? 'No products match your search or filters.'
                  : 'No products found in this category yet.'
              }
              action={
                search
                  ? { label: 'Clear search', onClick: () => { setSearchInput(''); setSearch(''); } }
                  : activeFilterCount > 0
                  ? { label: 'Clear filters', onClick: clearFilters }
                  : undefined
              }
            />
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

      {/* ── App download + footer ────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-10 pb-8 pt-2">
        <AppDownloadBanner />
      </div>
      <Footer />
      <FloatingAppWidget />

      {/* ── Filters — a real sidebar, not an inline panel or a bottom sheet.
         A small tab stays stuck to the left edge of the viewport at every
         breakpoint; clicking it slides a full-height drawer in from the
         left, over the page. Anchored low (not vertical-center, which sat
         right on top of the page's own content) and kept small/slim so it
         reads as a discreet edge tab, not a button floating over the page. ── */}
      <button
        onClick={() => setMobileFilters(o => !o)}
        aria-expanded={mobileFilters}
        aria-label="Toggle filters"
        className={clsx(
          'fixed left-0 bottom-24 z-[58] flex items-center gap-[6px] rounded-r-[10px] border border-l-0 py-2 pl-2 pr-[10px] text-[12px] font-semibold shadow-[0_2px_8px_rgba(20,15,10,0.1)] cursor-pointer transition-colors',
          mobileFilters || activeFilterCount > 0
            ? 'bg-brand-pale-orange border-brand-orange text-brand-deep-orange'
            : 'bg-white border-bone text-charcoal hover:bg-cream',
        )}
      >
        <SlidersHorizontal size={13} strokeWidth={2} />
        Filters
        {activeFilterCount > 0 && (
          <span className="min-w-[18px] h-[18px] rounded-full bg-brand-orange text-white text-[9px] font-bold flex items-center justify-center px-[4px] leading-none">
            {activeFilterCount}
          </span>
        )}
      </button>

      <div
        className={clsx(
          'fixed inset-0 bg-black/40 z-[59] transition-opacity duration-300',
          mobileFilters ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setMobileFilters(false)}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-hidden={!mobileFilters}
        className={clsx(
          'fixed top-0 left-0 h-full w-[300px] max-w-[85vw] z-[60] bg-white shadow-2xl outline-none overflow-y-auto',
          'transition-transform duration-300 ease-out',
          mobileFilters ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="sticky top-0 bg-white z-[1] flex items-center justify-between gap-2 px-5 py-4 border-b border-bone">
          <div className="flex items-center gap-[9px]">
            <SlidersHorizontal size={15} className="text-charcoal" strokeWidth={2} />
            <span className="text-[14.5px] font-bold text-carbon tracking-[-0.01em]">Filters</span>
            {activeFilterCount > 0 && (
              <span className="min-w-[18px] h-[18px] rounded-full bg-brand-orange text-white text-[9px] font-bold flex items-center justify-center px-[4px] leading-none">
                {activeFilterCount}
              </span>
            )}
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
              aria-label="Close filters"
              className="size-9 rounded-full bg-cream flex items-center justify-center cursor-pointer hover:bg-bone transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
            >
              <X size={14} className="text-charcoal" />
            </button>
          </div>
        </div>
        <div className="px-5 py-4">
          <FilterPanel filters={filters} onChange={toggleFilter} onPriceRangeChange={setPriceRange} categories={categories} selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} />
        </div>
      </div>
    </div>
  );
}
