import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useProductsByCategory } from '@/hooks/marketplace/useProductsByCategory';
import { useBanners } from '@/hooks/useBanners';
import { useCartContext } from '@/contexts/CartContext';
import { TokenStorage } from '@/api/services/auth';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { Button } from '@/components/comman/ui/Button';
import { Pagination, FilterDropdown, BuyerNavbar, AppDownloadBanner, Footer, TrustServiceStrip, FloatingAppWidget, DealsBanner, StoreFeatureCard } from '@/components/comman/ui';
import { ProductCard, ProductCardSkeleton, ProductImage } from '@/components/comman/marketplace/ProductCard';
import { FilterAccordionSection, FilterChipPill } from '@/components/comman/marketplace/FilterAccordionSection';
import { BannerCarousel } from '@/components/comman/marketplace/BannerCarousel';
import {
  ShoppingBag, Star,
  SlidersHorizontal, X, ChevronRight,
  ShieldCheck, BadgeCheck, RefreshCcw,
  ChevronDown, Tag, Globe,
} from 'lucide-react';
import type { MarketplaceProduct } from '@/api/services/marketplace';
import { apiGetCategoryTree, type CategoryNode } from '@/api/services/categories';
import { apiGetTopStores, type PublicStoreListItem } from '@/api/services/store';
import { apiSearchStores } from '@/api/services/search';


// ── Countdown to local midnight — real, deterministic timer (not tied to a
// fabricated campaign end-time); frames "today's deals" honestly. ──────────
function msToMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

function useCountdownToMidnight() {
  const [ms, setMs] = useState(msToMidnight);
  useEffect(() => {
    const id = setInterval(() => setMs(msToMidnight()), 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    h: pad(Math.floor(ms / 3_600_000)),
    m: pad(Math.floor((ms % 3_600_000) / 60_000)),
    s: pad(Math.floor((ms % 60_000) / 1000)),
  };
}

// ── Compact rail card — dense Flash Sale / Top Picks strip card ────────────────
function RailCard({ product, onClick, badge, rank }: {
  product: MarketplaceProduct;
  onClick: (id: string) => void;
  badge?: React.ReactNode;
  rank?: number;
}) {
  const dv        = product.variants.find(v => v.isDefault) ?? product.variants[0];
  const price     = dv?.price ?? null;
  const compareAt = dv?.compareAtPrice ?? null;
  return (
    <button
      onClick={() => onClick(product._id)}
      className="relative shrink-0 w-[112px] sm:w-[126px] text-left bg-white rounded-[14px] border border-bone overflow-hidden cursor-pointer group transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_10px_24px_rgba(0,0,0,0.1)] hover:border-brand-orange/25"
    >
      <div className="relative">
        <ProductImage
          images={product.images ?? []}
          name={product.name}
          className="h-[92px] sm:h-[100px] transition-transform duration-500 ease-out group-hover:scale-[1.06]"
        />
        {badge && <div className="absolute top-[5px] left-[5px]">{badge}</div>}
        {rank != null && (
          <span className="absolute bottom-[5px] left-[5px] w-[18px] h-[18px] rounded-full bg-carbon/85 backdrop-blur-sm text-white text-[10px] font-bold flex items-center justify-center">
            {rank}
          </span>
        )}
      </div>
      <div className="px-[9px] py-[8px]">
        <p className="text-[11px] font-semibold text-carbon leading-tight line-clamp-2 mb-[5px] min-h-[28px]">{product.name}</p>
        <div className="flex items-baseline gap-[4px]">
          <span className="text-[12px] font-bold text-carbon">{price != null ? `$${price.toLocaleString()}` : '—'}</span>
          {compareAt != null && compareAt > (price ?? 0) && (
            <span className="text-[9.5px] text-slate line-through">${compareAt.toLocaleString()}</span>
          )}
        </div>
        {product.averageRating > 0 && (
          <span className="flex items-center gap-[2px] text-[9.5px] text-slate mt-[3px]">
            <Star size={8} className="text-brand-orange fill-brand-orange" />
            {product.averageRating.toFixed(1)}
          </span>
        )}
      </div>
    </button>
  );
}

// ── Category bar icon — reuses each category's real uploaded image, falls back to a tag glyph ──
function CategoryBarIcon({ category }: { category: CategoryNode }) {
  if (category.image) {
    return (
      <span className="w-[24px] h-[24px] rounded-lg overflow-hidden shrink-0 bg-cream border border-bone">
        <img loading="lazy" decoding="async" src={category.image} alt="" className="w-full h-full object-cover" />
      </span>
    );
  }
  return (
    <span className="w-[24px] h-[24px] rounded-lg bg-brand-pale-orange flex items-center justify-center shrink-0">
      <Tag size={13} className="text-brand-orange" />
    </span>
  );
}

const CATEGORY_BAR_TRENDING = ['Wireless Earbuds', 'Digital Planner', 'Desk Organizer', 'Handmade Jewelry', 'Watercolor Prints'];

// ── Alibaba-style category mega menu — opened from the ☰ / "All" trigger in the category bar ──
function CategoryBarMegaMenu({
  categories, spotlight, onShopCategory, onProductClick, onTrendingTerm,
}: {
  categories:     CategoryNode[];
  spotlight:      MarketplaceProduct[];
  onShopCategory: (id: string) => void;
  onProductClick: (id: string) => void;
  onTrendingTerm: (term: string) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(categories[0]?._id ?? null);
  const active = categories.find(c => c._id === activeId) ?? categories[0] ?? null;
  const siblingChips = categories.filter(c => c._id !== active?._id).slice(0, 6);

  if (categories.length === 0) return null;

  return (
    <div className="dropdown-enter flex bg-white border border-bone rounded-2xl shadow-[0_24px_56px_rgba(0,0,0,0.18)] overflow-hidden w-[860px] max-w-[92vw]">
      {/* Left rail — main categories */}
      <div className="w-[220px] shrink-0 border-r border-bone py-2 bg-cream/50 max-h-[480px] overflow-y-auto">
        {categories.map(cat => (
          <button
            key={cat._id}
            onMouseEnter={() => setActiveId(cat._id)}
            onFocus={() => setActiveId(cat._id)}
            onClick={() => onShopCategory(cat._id)}
            className={clsx(
              'w-full flex items-center gap-[10px] px-[14px] py-[10px] text-left bg-transparent border-none cursor-pointer transition-colors duration-150',
              activeId === cat._id ? 'bg-white text-brand-orange' : 'text-charcoal hover:bg-white/70',
            )}
          >
            <CategoryBarIcon category={cat} />
            <span className="flex-1 text-[12.5px] font-medium truncate">{cat.name}</span>
            <ChevronRight size={13} className={clsx('shrink-0 transition-transform', activeId === cat._id ? 'text-brand-orange translate-x-[2px]' : 'text-slate/50')} />
          </button>
        ))}
      </div>

      {/* Right panel — subcategories / popular categories / popular products / trending / banner */}
      {active && (
        <div className="flex-1 p-6 max-h-[480px] overflow-y-auto flex gap-7">
          <div className="flex-1 min-w-0">
            <p className="text-[10.5px] font-bold text-slate uppercase tracking-[0.07em] mb-3">Subcategories</p>
            {active.children.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-5">
                {active.children.map(sub => (
                  <button
                    key={sub._id}
                    onClick={() => onShopCategory(sub._id)}
                    className="text-left text-[12.5px] text-charcoal bg-transparent border-none cursor-pointer p-0 hover:text-brand-orange transition-colors"
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-slate mb-5">No subcategories yet — browse everything in {active.name}.</p>
            )}

            {siblingChips.length > 0 && (
              <>
                <p className="text-[10.5px] font-bold text-slate uppercase tracking-[0.07em] mb-3">Popular Categories</p>
                <div className="flex flex-wrap gap-[6px] mb-5">
                  {siblingChips.map(c => (
                    <button
                      key={c._id}
                      onClick={() => onShopCategory(c._id)}
                      className="px-[10px] py-[5px] rounded-full text-[11.5px] font-medium bg-cream text-charcoal border border-bone hover:border-brand-orange hover:text-brand-orange transition-colors cursor-pointer"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            {spotlight.length > 0 && (
              <>
                <p className="text-[10.5px] font-bold text-slate uppercase tracking-[0.07em] mb-3">Popular Products</p>
                <div className="flex gap-3 mb-5">
                  {spotlight.slice(0, 3).map(p => <RailCard key={p._id} product={p} onClick={onProductClick} />)}
                </div>
              </>
            )}

            <p className="text-[10.5px] font-bold text-slate uppercase tracking-[0.07em] mb-3">Trending Searches</p>
            <div className="flex flex-wrap gap-[6px]">
              {CATEGORY_BAR_TRENDING.map(term => (
                <button
                  key={term}
                  onClick={() => onTrendingTerm(term)}
                  className="px-[10px] py-[5px] rounded-full text-[11.5px] font-medium bg-white text-charcoal border border-bone hover:border-brand-orange hover:text-brand-orange transition-colors cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          <div className="w-[210px] shrink-0">
            <div className="rounded-xl overflow-hidden border border-bone bg-brand-pale-orange h-[130px] flex items-center justify-center mb-3">
              {active.image
                ? <img loading="lazy" decoding="async" src={active.image} alt="" className="w-full h-full object-cover" />
                : <Tag size={28} className="text-brand-orange opacity-50" />}
            </div>
            <button
              onClick={() => onShopCategory(active._id)}
              className="w-full flex items-center justify-center gap-[6px] text-[12.5px] font-semibold text-white bg-brand-orange rounded-lg py-[10px] cursor-pointer border-none hover:opacity-90 transition-opacity"
            >
              Shop {active.name}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── "About Solvexo.store" mega menu — company / commerce-tools / support links ──
function AboutSolvexoMegaMenu({ onNavigate }: { onNavigate: (path: string) => void }) {
  const columns: { title: string; items: { label: string; path: string }[] }[] = [
    {
      title: 'Company',
      items: [
        { label: 'About Solvexo', path: '/' },
        { label: 'Why Solvexo',   path: '/' },
        { label: 'Marketplace',   path: '/marketplace' },
        { label: 'Education Marketplace', path: '/education' },
      ],
    },
    {
      title: 'Commerce Tools',
      items: [
        { label: 'AI Commerce', path: '/sellers' },
        { label: 'POS',         path: '/sellers' },
        { label: 'Seller Benefits', path: '/sellers' },
      ],
    },
    {
      title: 'Support',
      items: [
        { label: 'Buyer Protection', path: '/faq' },
        { label: 'Help Center',      path: '/faq' },
        { label: 'Contact',          path: '/faq' },
      ],
    },
  ];

  return (
    <div className="dropdown-enter grid grid-cols-3 gap-6 bg-white border border-bone rounded-2xl shadow-[0_24px_56px_rgba(0,0,0,0.18)] p-6 w-[420px]">
      {columns.map(col => (
        <div key={col.title}>
          <p className="text-[10.5px] font-bold text-slate uppercase tracking-[0.07em] mb-3">{col.title}</p>
          <div className="flex flex-col gap-[9px]">
            {col.items.map(item => (
              <button
                key={item.label}
                onClick={() => onNavigate(item.path)}
                className="text-left text-[12.5px] text-charcoal bg-transparent border-none cursor-pointer p-0 hover:text-brand-orange transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Deals dropdown — Flash Sale / Top Picks / Featured Sellers, tucked behind one trigger instead of full-page bands ──
interface DealsDropdownMenuProps {
  flashDeals: { product: MarketplaceProduct; pct: number }[];
  topPicks:   MarketplaceProduct[];
  topStores:  PublicStoreListItem[];
  countdown:  { h: string; m: string; s: string };
  onProductClick: (id: string) => void;
  onStoreClick:   (slug: string) => void;
}
function DealsDropdownMenu({ flashDeals, topPicks, topStores, countdown, onProductClick, onStoreClick }: DealsDropdownMenuProps) {
  type DealTab = 'flash-sale' | 'top-picks' | 'featured-sellers';
  const [active, setActive] = useState<DealTab>('flash-sale');

  const items: { id: DealTab; label: string }[] = [
    { id: 'flash-sale',       label: 'Flash Sale' },
    { id: 'top-picks',        label: 'Top Picks' },
    { id: 'featured-sellers', label: 'Featured Sellers' },
  ];

  return (
    <div className="dropdown-enter flex bg-white border border-bone rounded-2xl shadow-[0_24px_56px_rgba(0,0,0,0.18)] overflow-hidden w-[640px] max-w-[92vw]">
      {/* Left — the three sections */}
      <div className="w-[190px] shrink-0 border-r border-bone py-2 bg-cream/50">
        {items.map(item => (
          <button
            key={item.id}
            onMouseEnter={() => setActive(item.id)}
            onFocus={() => setActive(item.id)}
            className={clsx(
              'w-full flex items-center justify-between px-[14px] py-[11px] text-left bg-transparent border-none cursor-pointer transition-colors',
              active === item.id ? 'bg-white text-brand-orange' : 'text-charcoal hover:bg-white/70',
            )}
          >
            <span className="text-[12.5px] font-medium">{item.label}</span>
            <ChevronRight size={13} className={active === item.id ? 'text-brand-orange' : 'text-slate/50'} />
          </button>
        ))}
      </div>

      {/* Right — that section's real cards */}
      <div className="flex-1 p-5 max-h-[380px] overflow-y-auto">
        {active === 'flash-sale' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] font-bold text-carbon">Flash Sale</p>
              <span className="text-[11px] text-slate tabular-nums">Ends in {countdown.h}:{countdown.m}:{countdown.s}</span>
            </div>
            <div className="flex gap-[10px] overflow-x-auto scrollbar-hide pb-1">
              {flashDeals.length === 0 && <p className="text-[12px] text-slate">No flash deals right now.</p>}
              {flashDeals.map(({ product, pct }) => (
                <RailCard
                  key={product._id}
                  product={product}
                  onClick={onProductClick}
                  badge={
                    <span className="px-[6px] py-[2px] rounded-[5px] text-[9px] font-bold bg-[#E11D48] text-white shadow-sm">
                      -{pct}%
                    </span>
                  }
                />
              ))}
            </div>
          </>
        )}

        {active === 'top-picks' && (
          <>
            <p className="text-[12px] font-bold text-carbon mb-3">Top Picks</p>
            <div className="flex gap-[10px] overflow-x-auto scrollbar-hide pb-1">
              {topPicks.length === 0 && <p className="text-[12px] text-slate">No top picks yet.</p>}
              {topPicks.map(product => (
                <RailCard
                  key={product._id}
                  product={product}
                  onClick={onProductClick}
                  badge={product.purchaseCount > 0 ? (
                    <span className="px-[6px] py-[2px] rounded-[5px] text-[9px] font-bold bg-carbon/80 text-white backdrop-blur-sm">
                      {product.purchaseCount} sold
                    </span>
                  ) : undefined}
                />
              ))}
            </div>
          </>
        )}

        {active === 'featured-sellers' && (
          <>
            <p className="text-[12px] font-bold text-carbon mb-3">Featured Sellers</p>
            <div className="flex gap-[14px] overflow-x-auto scrollbar-hide pb-1">
              {topStores.length === 0 && <p className="text-[12px] text-slate">No featured sellers yet.</p>}
              {topStores.map(s => (
                <StoreFeatureCard key={s.storeId} store={s} onClick={onStoreClick} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Generic hover trigger — shared open/close/debounce/escape/click-outside for the category bar's mega menus ──
function HoverMegaTrigger({ trigger, panel, panelAlign = 'left' }: {
  trigger: (open: boolean) => React.ReactNode;
  panel:   React.ReactNode;
  panelAlign?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [open]);

  const clearCloseTimer = () => { if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; } };
  const scheduleClose = () => { clearCloseTimer(); closeTimer.current = setTimeout(() => setOpen(false), 150); };

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => { clearCloseTimer(); setOpen(true); }}
      onMouseLeave={scheduleClose}
    >
      {/* Tap-to-toggle wrapper — onMouseEnter/Leave alone never fires on touch devices,
          so without this, mobile/tablet users have no way to open the panel at all. */}
      <div onClick={() => setOpen(o => !o)}>
        {trigger(open)}
      </div>
      <div
        className={clsx(
          'absolute top-[calc(100%+10px)] z-50 transition-all duration-200 origin-top',
          panelAlign === 'left' ? 'left-0' : 'right-0',
          open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-1 pointer-events-none',
        )}
      >
        {panel}
      </div>
    </div>
  );
}

// ── Filter data ───────────────────────────────────────────────────────────────
const FILTER_GROUPS = [
  { key: 'price',  title: 'Price Range',  items: ['Under $10', '$10–$50', '$50–$100', '$100+'] },
  { key: 'type',   title: 'Product Type', items: ['Physical', 'Digital', 'Educational']         },
  { key: 'rating', title: 'Rating',       items: ['4★ & up', '3★ & up']                        },
];

interface FilterState { price: string[]; type: string[]; rating: string[]; }

function FilterPanel({ filters, onChange, categories = [], selectedCategory, onCategoryChange }: {
  filters:  FilterState;
  onChange: (key: keyof FilterState, value: string) => void;
  categories:       CategoryNode[];
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {categories.length > 0 && (
        <FilterAccordionSection title="Category">
          <div className="flex flex-wrap gap-[7px]">
            <FilterChipPill label="All" active={selectedCategory === ''} onClick={() => onCategoryChange('')} />
            {categories.map(c => (
              <FilterChipPill key={c._id} label={c.name} active={selectedCategory === c._id} onClick={() => onCategoryChange(c._id)} />
            ))}
          </div>
        </FilterAccordionSection>
      )}
      {FILTER_GROUPS.map(group => (
        <FilterAccordionSection key={group.key} title={group.title}>
          <div className="flex flex-wrap gap-[7px]">
            {group.items.map(label => {
              const active = (filters[group.key as keyof FilterState] as string[]).includes(label);
              return (
                <FilterChipPill key={label} label={label} active={active} onClick={() => onChange(group.key as keyof FilterState, label)} />
              );
            })}
          </div>
        </FilterAccordionSection>
      ))}
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
  const [searchParams] = useSearchParams();
  usePageTitle('Marketplace');

  const [activeTab,     setActiveTab]     = useState('All');
  const [sortBy,        setSortBy]        = useState('newest');
  const [page,          setPage]          = useState(1);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ price: [], type: [], rating: [] });
  const [searchInput, setSearchInput] = useState('');
  const [search,      setSearch]      = useState('');
  const [categories,       setCategories]       = useState<CategoryNode[]>([]);
  // Seeded from ?category= so links from the mega menu / other pages land
  // pre-filtered to that category.
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') ?? '');
  const [topStores,        setTopStores]        = useState<PublicStoreListItem[]>([]);
  const [storeResults,     setStoreResults]      = useState<PublicStoreListItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    apiGetCategoryTree()
      .then(res => { if (!cancelled) setCategories(res.data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Re-sync when ?category= changes while already on this page (mega menu
  // link clicked from here) — the initial-mount case is covered by the
  // useState initializer above.
  useEffect(() => {
    const fromUrl = searchParams.get('category') ?? '';
    setSelectedCategory(fromUrl);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    apiGetTopStores(10)
      .then(res => { if (!cancelled) setTopStores(res.data.stores); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Store/seller matches for the navbar search — runs alongside the existing
  // client-side product filter, so search covers both products and stores.
  useEffect(() => {
    if (!search) { setStoreResults([]); return; }
    let cancelled = false;
    apiSearchStores(search, 1, 6)
      .then(res => { if (!cancelled) setStoreResults(res.data.stores); })
      .catch(() => { if (!cancelled) setStoreResults([]); });
    return () => { cancelled = true; };
  }, [search]);

  const handleCategoryChange = (id: string) => {
    setSelectedCategory(id);
    setPage(1);
  };

  const LIMIT = 20;
  const { products, total, loading, error, refetch } = useProductsByCategory(page, LIMIT, selectedCategory || undefined);
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
      const dv = p.variants.find(v => v.isDefault) ?? p.variants[0];
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

  const totalPages        = Math.ceil(total / LIMIT) || 1;
  const activeFilterCount = filters.price.length + filters.type.length + filters.rating.length;

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const toggleFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => {
      const arr = prev[key];
      return { ...prev, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  const clearFilters = () => setFilters({ price: [], type: [], rating: [] });

  const goToPage = (p: number) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };

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
    if (filters.price.length === 0 || price == null) return true;
    return filters.price.some(label => {
      if (label === 'Under $10')  return price < 10;
      if (label === '$10–$50')    return price >= 10 && price <= 50;
      if (label === '$50–$100')   return price >= 50 && price <= 100;
      if (label === '$100+')      return price > 100;
      return true;
    });
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
      if (activeTab === 'Physical' && pType !== 'physical') return false;
      if (activeTab === 'Digital'  && pType !== 'digital')  return false;
      if (filters.type.length > 0 && !filters.type.some(t => t.toLowerCase() === pType)) return false;
      if (search && !p.name.toLowerCase().includes(search) && !p.tags?.some(t => t.toLowerCase().includes(search))) return false;
      const lowestPrice = p.variants.length > 0 ? Math.min(...p.variants.map(v => v.price)) : null;
      if (!matchesPriceFilter(lowestPrice)) return false;
      if (!matchesRatingFilter(p.averageRating)) return false;
      return true;
    })
    .sort((a, b) => {
      const priceOf = (p: MarketplaceProduct) => p.variants.length > 0 ? Math.min(...p.variants.map(v => v.price)) : 0;
      if (sortBy === 'price-asc')  return priceOf(a) - priceOf(b);
      if (sortBy === 'price-desc') return priceOf(b) - priceOf(a);
      if (sortBy === 'best-rated') return b.averageRating - a.averageRating;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="min-h-screen bg-cream">

      <BuyerNavbar
        contextLabel="Marketplace"
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
              banners.length > 0 ? 'text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]' : 'text-carbon',
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

      {/* ── Category line — "All Categories" mega-menu dropdown (left), utility links (right) ── */}
      <div className="bg-white border-b border-bone">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">

          {/* LEFT: single "All Categories" dropdown trigger */}
          <div className="flex items-center min-w-0 flex-1 py-[11px]">
            <HoverMegaTrigger
              trigger={openState => (
                <button
                  onClick={() => setActiveTab('All')}
                  aria-haspopup="true"
                  aria-expanded={openState}
                  className={clsx(
                    'flex items-center gap-[6px] text-[13px] font-semibold bg-transparent border-none cursor-pointer whitespace-nowrap transition-colors duration-150',
                    openState ? 'text-brand-orange' : 'text-charcoal hover:text-brand-orange',
                  )}
                >
                  All Categories
                  <ChevronDown size={14} className={clsx('transition-transform duration-200', openState && 'rotate-180')} />
                </button>
              )}
              panel={
                <CategoryBarMegaMenu
                  categories={categories}
                  spotlight={topPicks}
                  onShopCategory={id => { handleCategoryChange(id); setActiveTab('All'); }}
                  onProductClick={handleCardClick}
                  onTrendingTerm={term => { setSearchInput(term); setSearch(term); }}
                />
              }
            />
          </div>

          {/* RIGHT: utility links */}
          <div className="hidden lg:flex items-center gap-4 shrink-0 text-[12.5px] text-slate whitespace-nowrap py-3">
            <button onClick={() => navigate('/marketplace')} className="flex items-center gap-1 bg-transparent border-none cursor-pointer text-slate hover:text-brand-orange transition-colors p-0">
              <BadgeCheck size={13} className="text-success" /> Verified Sellers
            </button>
            <button onClick={() => navigate('/marketplace')} className="flex items-center gap-1 bg-transparent border-none cursor-pointer text-slate hover:text-brand-orange transition-colors p-0">
              <ShieldCheck size={13} className="text-success" /> Verified Stores
            </button>
            <button
              onClick={() => navigate(TokenStorage.isLoggedIn() ? '/account/orders' : '/login')}
              className="bg-transparent border-none cursor-pointer text-slate hover:text-brand-orange transition-colors p-0"
            >
              Track Order
            </button>
            <button onClick={() => navigate('/faq')} className="bg-transparent border-none cursor-pointer text-slate hover:text-brand-orange transition-colors p-0">
              Help Center
            </button>
            <button onClick={() => navigate('/faq')} className="bg-transparent border-none cursor-pointer text-slate hover:text-brand-orange transition-colors p-0">
              Contact
            </button>
          </div>
        </div>
      </div>

      {/* ── Welcome line — brand message (left), Deals dropdown + About (right) ── */}
      <div className="bg-white border-b border-bone">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-10 py-[10px]">
          <p className="text-[15px] text-charcoal tracking-[-0.1px]">
            Welcome to <span className="font-bold text-brand-orange">Solvexo Store</span>
          </p>

          <div className="flex items-center gap-4 text-[12.5px] text-slate whitespace-nowrap">
            <HoverMegaTrigger
              panelAlign="right"
              trigger={openState => (
                <button
                  aria-haspopup="true"
                  aria-expanded={openState}
                  className={clsx(
                    'flex items-center gap-[6px] bg-transparent border-none cursor-pointer transition-colors p-0 font-medium',
                    openState ? 'text-brand-orange' : 'text-charcoal hover:text-brand-orange',
                  )}
                >
                  Top Picks · Featured Sellers · Flash Sale
                  <ChevronDown size={13} className={clsx('transition-transform', openState && 'rotate-180')} />
                </button>
              )}
              panel={
                <DealsDropdownMenu
                  flashDeals={flashDeals}
                  topPicks={topPicks}
                  topStores={topStores}
                  countdown={countdown}
                  onProductClick={handleCardClick}
                  onStoreClick={slug => navigate(`/store/${slug}`)}
                />
              }
            />
            <span className="h-3 w-px bg-bone hidden sm:inline-block" />
            <HoverMegaTrigger
              panelAlign="right"
              trigger={openState => (
                <button
                  aria-haspopup="true"
                  aria-expanded={openState}
                  className={clsx(
                    'hidden sm:inline bg-transparent border-none cursor-pointer transition-colors p-0',
                    openState ? 'text-brand-orange' : 'text-slate hover:text-brand-orange',
                  )}
                >
                  About Solvexo.store
                </button>
              )}
              panel={<AboutSolvexoMegaMenu onNavigate={navigate} />}
            />
            <span className="hidden sm:flex items-center gap-1 text-slate/80">
              <Globe size={12} /> EN
            </span>
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-5 lg:py-6">

        {/* Mobile: filter + sort bar */}
        <div className="lg:hidden flex items-center justify-between gap-3 mb-4">
          <button
            onClick={() => setMobileFilters(true)}
            className={clsx(
              'flex items-center gap-2 px-3 py-[9px] rounded-[10px] border text-[13px] font-medium transition-colors',
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

        <div className="flex gap-5 lg:gap-6 items-start">

          {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
          <aside className="hidden lg:block w-[210px] xl:w-[230px] shrink-0 sticky top-[68px] self-start">
            <div className="bg-white rounded-[16px] border border-bone overflow-hidden">
              <div className="px-5 pt-[18px] pb-4 border-b border-bone flex items-center justify-between">
                <div className="flex items-center gap-[7px]">
                  <div className="size-7 rounded-[7px] bg-brand-pale-orange flex items-center justify-center shrink-0">
                    <SlidersHorizontal size={13} className="text-brand-orange" strokeWidth={2.2} />
                  </div>
                  <span className="text-[14px] font-bold text-carbon">Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="min-w-[18px] h-[18px] rounded-full bg-brand-orange text-white text-[9px] font-bold flex items-center justify-center px-[4px] leading-none">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-[11px] font-medium text-brand-orange hover:opacity-70 transition-opacity cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="px-5 py-5">
                <FilterPanel filters={filters} onChange={toggleFilter} categories={categories} selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} />
              </div>
            </div>
          </aside>

          {/* ── Products area ─────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Desktop: count + sort row */}
            <div className="hidden lg:flex items-center justify-between mb-4">
              <span className="text-[13px] text-slate">
                {!loading && (error ? 'Error loading' : `Showing ${filtered.length} of ${total} products`)}
              </span>
              <FilterDropdown options={SORT_OPTIONS} value={sortBy} onChange={setSortBy} />
            </div>

            {/* Mobile: product count */}
            <p className="lg:hidden text-[12px] text-slate mb-3">
              {!loading && !error && `${filtered.length} of ${total} products`}
            </p>

            {error && !loading && (
              <div className="p-6 flex flex-col items-center gap-3 text-center bg-error-bg rounded-[12px] border border-[#FECACA] text-error text-[13px]">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={refetch}>Try again</Button>
              </div>
            )}

            {/* Grid: 2-col mobile → 2-col sm → 3-col md (no sidebar) → 3-col lg → 4-col xl */}
            <div id="marketplace-grid" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-[10px] sm:gap-3 lg:gap-[14px] scroll-mt-[76px]">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : filtered.map(p => {
                    const defVariant = p.variants.find(v => v.isDefault) ?? p.variants[0];
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

        <div className="flex items-center justify-between px-5 py-3 border-b border-bone">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-charcoal" strokeWidth={2} />
            <span className="text-[15px] font-bold text-carbon">Filters</span>
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
                className="text-[12px] font-medium text-slate hover:text-brand-orange transition-colors cursor-pointer"
              >
                Clear all
              </button>
            )}
            <button
              onClick={() => setMobileFilters(false)}
              className="size-8 rounded-full bg-cream flex items-center justify-center cursor-pointer hover:bg-bone transition-colors"
            >
              <X size={15} className="text-charcoal" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 overflow-y-auto max-h-[55vh]">
          <FilterPanel filters={filters} onChange={toggleFilter} categories={categories} selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} />
        </div>

        <div className="px-5 pt-3 pb-6 border-t border-bone">
          <button
            onClick={() => setMobileFilters(false)}
            className="w-full bg-brand-orange text-white py-[13px] rounded-[12px] text-[14px] font-semibold cursor-pointer hover:opacity-[0.9] transition-opacity"
          >
            {activeFilterCount > 0 ? `Apply ${activeFilterCount} Filter${activeFilterCount > 1 ? 's' : ''}` : 'Done'}
          </button>
        </div>
      </div>

    </div>
  );
}
