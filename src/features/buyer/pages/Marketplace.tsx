import { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useProductsByCategory } from '@/hooks/marketplace/useProductsByCategory';
import { useBanners } from '@/hooks/useBanners';
import type { Banner } from '@/api/services/banner';
import { useCartContext } from '@/contexts/CartContext';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { Button } from '@/components/comman/ui/Button';
import { Card } from '@/components/comman/ui/Card';
import { TabBar, Pagination, FilterDropdown, BuyerNavbar, AppDownloadBanner, Footer, TrustServiceStrip, MarketplaceAppPromo, FloatingAppWidget } from '@/components/comman/ui';
import type { Tab } from '@/components/comman/ui';
import {
  ShoppingCart, ShoppingBag, Star, Heart, ImageOff,
  Loader2, SlidersHorizontal, X, ChevronLeft, ChevronRight,
  ShieldCheck, BadgeCheck, RefreshCcw, Flame, Clock, TrendingUp,
} from 'lucide-react';
import type { MarketplaceProduct } from '@/api/services/marketplace';
import { apiGetCategoryTree, type CategoryNode } from '@/api/services/categories';

// ── Promotional banner carousel — full-bleed hero background (admin-managed) ──
function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const id = setInterval(() => setIndex(i => (i + 1) % banners.length), 5000);
    return () => clearInterval(id);
  }, [banners.length]);

  const sorted = [...banners].sort((a, b) => a.order - b.order);
  const active = sorted[index];

  const go = (dir: 1 | -1) => setIndex(i => (i + dir + sorted.length) % sorted.length);

  const content = <img loading="lazy" decoding="async" src={active.bannerImage} alt="" className="absolute inset-0 w-full h-full object-cover" />;

  return (
    <div className="absolute inset-0 group">
      {active.urlOnTap ? (
        <a href={active.urlOnTap} target="_blank" rel="noreferrer" className="absolute inset-0">{content}</a>
      ) : content}

      {sorted.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="Previous banner"
            className="absolute left-3 top-1/2 -translate-y-1/2 size-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <ChevronLeft size={16} className="text-charcoal" />
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Next banner"
            className="absolute right-3 top-1/2 -translate-y-1/2 size-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <ChevronRight size={16} className="text-charcoal" />
          </button>
          <div className="absolute bottom-4 right-4 sm:right-6 lg:right-10 flex gap-[6px] z-10">
            {sorted.map((b, i) => (
              <button
                key={b._id}
                onClick={() => setIndex(i)}
                aria-label={`Go to banner ${i + 1}`}
                className="h-[6px] rounded-full border-none cursor-pointer transition-all"
                style={{ width: i === index ? 18 : 6, background: i === index ? '#D97757' : 'rgba(255,255,255,0.7)' }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-bone overflow-hidden">
      <div className="animate-pulse h-[130px] sm:h-[160px] lg:h-[180px] bg-bone" />
      <div className="p-2 sm:p-4">
        <div className="animate-pulse h-[12px] bg-bone rounded-[6px] mb-2" />
        <div className="animate-pulse h-[10px] bg-bone rounded-[6px] w-[55%] mb-[10px]" />
        <div className="flex justify-between items-center">
          <div className="animate-pulse h-5 w-14 bg-bone rounded-[6px]" />
          <div className="animate-pulse h-[28px] w-8 sm:w-[86px] bg-bone rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ── Product Image ─────────────────────────────────────────────────────────────
function ProductImage({ images, name, className }: { images: string[]; name: string; className?: string }) {
  const [errored, setErrored] = useState(false);
  const src = images[0];

  if (!src || errored) {
    return (
      <div className={clsx('bg-brand-pale-orange flex flex-col items-center justify-center gap-[6px]', className)}>
        <ImageOff size={24} className="text-brand-orange opacity-[0.45]" style={{ display: 'block', flexShrink: 0 }} />
        <span className="text-[9px] text-slate max-w-[80px] text-center leading-[1.4] overflow-hidden">
          {name.slice(0, 20)}{name.length > 20 ? '…' : ''}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      decoding="async"
      onError={() => setErrored(true)}
      className={clsx('w-full object-cover block transition-transform duration-500 ease-out group-hover:scale-[1.07]', className)}
    />
  );
}

// ── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-[3px]">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={10}
          className={i <= Math.round(rating) ? 'text-brand-orange fill-brand-orange' : 'text-bone fill-bone'}
        />
      ))}
      {count !== undefined && (
        <span className="text-[10px] text-slate ml-[2px] hidden sm:inline">({count})</span>
      )}
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
const ProductCard = memo(function ProductCard({ product, onClick, onAddToCart, isAdding, isWishlisted, isWishlisting, onToggleWishlist }: {
  product:          MarketplaceProduct;
  onClick:          (id: string) => void;
  onAddToCart:      (e: React.MouseEvent, id: string, variantId: string, type: 'physical' | 'digital') => void;
  isAdding:         boolean;
  isWishlisted:     boolean;
  isWishlisting:    boolean;
  onToggleWishlist: (e: React.MouseEvent, id: string, variantId: string) => void;
}) {
  const pType     = product.productType ?? product.type ?? 'physical';
  const isDigital = pType === 'digital';

  const defaultVariant = product.variants.find(v => v.isDefault) ?? product.variants[0];
  const lowestPrice    = product.variants.length > 0
    ? Math.min(...product.variants.map(v => v.price))
    : null;
  const compareAt   = defaultVariant?.compareAtPrice ?? null;
  const ratingCount = product.totalRatings ?? 0;
  const vId         = defaultVariant?._id ?? '';
  const subscriberPrice = defaultVariant?.subscriberPrice;
  const discountPercent = defaultVariant?.discountPercent;
  const pctOff = compareAt != null && lowestPrice != null && compareAt > lowestPrice
    ? Math.round((1 - lowestPrice / compareAt) * 100)
    : null;
  // Stock tracking only applies to physical goods — digital products are always available.
  const stock = isDigital ? Infinity : (defaultVariant?.stock ?? 0);

  return (
    <Card padding="none" hover onClick={() => onClick(product._id)} className="overflow-hidden">
      {/* Image container */}
      <div className="relative overflow-hidden group/img">
        <ProductImage
          images={product.images ?? []}
          name={product.name}
          className="h-[130px] sm:h-[160px] lg:h-[180px] transition-transform duration-500 ease-out group-hover/img:scale-[1.07]"
        />

        {/* Hover overlay — dark gradient + Quick View label */}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(20,20,19,0.55)] via-[rgba(20,20,19,0.18)] to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-center pb-[10px] opacity-0 group-hover/img:opacity-100 translate-y-[6px] group-hover/img:translate-y-0 transition-all duration-300 pointer-events-none">
          <span className="px-3 py-[4px] rounded-full bg-white/90 text-carbon text-[10.5px] font-semibold tracking-wide backdrop-blur-sm shadow-sm">
            Quick View
          </span>
        </div>

        {/* Wishlist button */}
        <button
          onClick={e => onToggleWishlist(e, product._id, vId)}
          disabled={isWishlisting}
          className={clsx(
            'absolute top-[8px] right-[8px] w-7 h-7 sm:w-8 sm:h-8 rounded-full',
            'bg-[rgba(255,255,255,0.92)] border-none flex items-center justify-center',
            'shadow-[0_1px_4px_rgba(0,0,0,0.12)] transition-transform duration-150 hover:scale-[1.15]',
            isWishlisting ? 'cursor-wait' : 'cursor-pointer',
          )}
        >
          <Heart
            size={13}
            className={clsx('transition-[color,fill] duration-150', isWishlisted ? 'text-[#E11D48] fill-[#E11D48]' : 'text-slate fill-none')}
          />
        </button>
        <div className="absolute top-[8px] left-[8px] flex flex-col gap-[4px] items-start">
          <span className={clsx(
            'px-[6px] py-[2px] rounded-[5px] text-[9px] sm:text-[10px] font-semibold border',
            isDigital
              ? 'bg-[#EDE9FE] text-[#7C3AED] border-[#DDD6FE]'
              : 'bg-brand-pale-orange text-brand-deep-orange border-[#F5D0BC]',
          )}>
            {isDigital ? 'Digital' : 'Physical'}
          </span>
          {pctOff != null && pctOff > 0 && (
            <span className="px-[6px] py-[2px] rounded-[5px] text-[9px] sm:text-[10px] font-bold bg-[#E11D48] text-white shadow-sm">
              -{pctOff}%
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-2 pt-2 pb-2 sm:px-[14px] sm:pt-3 sm:pb-[14px]">
        <p className="font-bold text-[12px] sm:text-[13px] text-carbon mb-[3px] leading-[1.4] line-clamp-2">
          {product.name}
        </p>
        <StarRating rating={product.averageRating} count={ratingCount} />
        {(product.tags?.length ?? 0) > 0 && (
          <div className="hidden lg:flex flex-wrap gap-1 mt-[6px]">
            {product.tags!.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] px-[6px] py-[1px] rounded bg-cream text-slate border border-bone">
                {tag}
              </span>
            ))}
          </div>
        )}
        {subscriberPrice != null && (
          <p className="text-[9px] sm:text-[10px] font-semibold text-brand-orange mt-1">Members save {discountPercent}%</p>
        )}
        {stock <= 0 ? (
          <p className="text-[9px] sm:text-[10px] font-semibold text-error mt-1">Out of stock</p>
        ) : stock <= 5 && (
          <p className="text-[9px] sm:text-[10px] font-semibold text-amber-600 mt-1">Only {stock} left</p>
        )}
        <div className="flex items-center justify-between mt-[8px] sm:mt-[10px]">
          <div className="flex items-baseline gap-[3px]">
            <span className={clsx('font-bold text-[13px] sm:text-[15px]', subscriberPrice != null ? 'text-brand-orange' : 'text-carbon')}>
              {subscriberPrice != null ? `$${subscriberPrice.toLocaleString()}` : lowestPrice != null ? `$${lowestPrice.toLocaleString()}` : '—'}
            </span>
            {subscriberPrice != null && lowestPrice != null ? (
              <span className="hidden sm:inline text-[11px] text-slate line-through">${lowestPrice.toLocaleString()}</span>
            ) : compareAt != null && compareAt > (lowestPrice ?? 0) && (
              <span className="hidden sm:inline text-[11px] text-slate line-through">${compareAt.toLocaleString()}</span>
            )}
          </div>
          <Button
            variant="secondary"
            size="sm"
            disabled={stock <= 0}
            onClick={e => onAddToCart(e, product._id, vId, product.productType ?? product.type ?? 'physical')}
            className="inline-flex shrink-0"
          >
            {isAdding ? <Loader2 size={11} className="animate-spin" /> : <ShoppingCart size={11} />}
            <span className="hidden lg:inline">{stock <= 0 ? 'Sold Out' : isAdding ? 'Adding…' : 'Add to Cart'}</span>
          </Button>
        </div>
      </div>
    </Card>
  );
});

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

// ── Compact rail card — shared shape for the Flash Sale / Top Picks rails ──────
function RailCard({ product, onClick, badge }: {
  product: MarketplaceProduct;
  onClick: (id: string) => void;
  badge?: React.ReactNode;
}) {
  const dv    = product.variants.find(v => v.isDefault) ?? product.variants[0];
  const price = dv?.price ?? null;
  return (
    <button
      onClick={() => onClick(product._id)}
      className="shrink-0 w-[136px] sm:w-[152px] text-left bg-white rounded-xl border border-bone overflow-hidden cursor-pointer group transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_12px_28px_rgba(0,0,0,0.1)] hover:border-brand-orange/25"
    >
      <div className="relative">
        <ProductImage
          images={product.images ?? []}
          name={product.name}
          className="h-[100px] sm:h-[112px] transition-transform duration-500 ease-out group-hover:scale-[1.06]"
        />
        {badge && <div className="absolute top-[6px] left-[6px]">{badge}</div>}
      </div>
      <div className="px-[10px] py-[9px]">
        <p className="text-[11.5px] font-semibold text-carbon leading-tight line-clamp-2 mb-1">{product.name}</p>
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] font-bold text-carbon">{price != null ? `$${price.toLocaleString()}` : '—'}</span>
          {product.averageRating > 0 && (
            <span className="flex items-center gap-[2px] text-[10px] text-slate">
              <Star size={9} className="text-brand-orange fill-brand-orange" />
              {product.averageRating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Filter data ───────────────────────────────────────────────────────────────
const FILTER_GROUPS = [
  { key: 'price',  title: 'Price Range',  items: ['Under $10', '$10–$50', '$50–$100', '$100+'] },
  { key: 'type',   title: 'Product Type', items: ['Physical', 'Digital']                       },
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
    <div className="space-y-5">
      {categories.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-slate uppercase tracking-[0.1em] mb-[10px]">
            Category
          </p>
          <div className="flex flex-wrap gap-[6px]">
            <button
              onClick={() => onCategoryChange('')}
              className={clsx(
                'px-[10px] py-[5px] rounded-full text-[11.5px] font-medium border transition-all duration-150 cursor-pointer leading-none',
                selectedCategory === ''
                  ? 'bg-brand-orange text-white border-brand-orange'
                  : 'bg-white text-charcoal border-[#DDD9D0] hover:border-brand-orange hover:text-brand-orange',
              )}
            >
              All
            </button>
            {categories.map(c => (
              <button
                key={c._id}
                onClick={() => onCategoryChange(c._id)}
                className={clsx(
                  'px-[10px] py-[5px] rounded-full text-[11.5px] font-medium border transition-all duration-150 cursor-pointer leading-none',
                  selectedCategory === c._id
                    ? 'bg-brand-orange text-white border-brand-orange'
                    : 'bg-white text-charcoal border-[#DDD9D0] hover:border-brand-orange hover:text-brand-orange',
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="h-px bg-bone my-5" />
        </div>
      )}
      {FILTER_GROUPS.map((group, gi) => (
        <div key={group.key}>
          {gi > 0 && <div className="h-px bg-bone mb-5 -mt-[2px]" />}
          <p className="text-[10px] font-bold text-slate uppercase tracking-[0.1em] mb-[10px]">
            {group.title}
          </p>
          <div className="flex flex-wrap gap-[6px]">
            {group.items.map(label => {
              const active = (filters[group.key as keyof FilterState] as string[]).includes(label);
              return (
                <button
                  key={label}
                  onClick={() => onChange(group.key as keyof FilterState, label)}
                  className={clsx(
                    'px-[10px] py-[5px] rounded-full text-[11.5px] font-medium border transition-all duration-150 cursor-pointer leading-none',
                    active
                      ? 'bg-brand-orange text-white border-brand-orange'
                      : 'bg-white text-charcoal border-[#DDD9D0] hover:border-brand-orange hover:text-brand-orange',
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Config ────────────────────────────────────────────────────────────────────
const TABS: Tab[] = ['All', 'Physical', 'Digital', 'Education', 'Art & Design', 'Templates', 'Music']
  .map(t => ({ id: t, label: t }));

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest'         },
  { value: 'price-asc',  label: 'Price: Low–High' },
  { value: 'price-desc', label: 'Price: High–Low' },
  { value: 'best-rated', label: 'Best Rated'      },
];


export function Marketplace() {
  const navigate = useNavigate();
  usePageTitle('Marketplace');

  const [activeTab,     setActiveTab]     = useState('All');
  const [sortBy,        setSortBy]        = useState('newest');
  const [page,          setPage]          = useState(1);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ price: [], type: [], rating: [] });
  const [searchInput, setSearchInput] = useState('');
  const [search,      setSearch]      = useState('');
  const [categories,       setCategories]       = useState<CategoryNode[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiGetCategoryTree()
      .then(res => { if (!cancelled) setCategories(res.data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

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

        {/* Compact app promotion — desktop only, top-right so it never collides with the carousel's own controls (bottom-right) or the hero copy (left) */}
        <div className="hidden xl:block absolute right-6 lg:right-10 top-6 lg:top-8 z-[1]">
          <MarketplaceAppPromo tone={banners.length > 0 ? 'dark' : 'light'} />
        </div>
      </div>

      {/* ── Flash Sale — real, currently-active discounts; countdown is a real timer to local midnight ── */}
      {flashDeals.length > 0 && (
        <div className="bg-white border-b border-bone">
          <div className="px-4 sm:px-6 lg:px-10 py-5">
            <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#FFF0F0] flex items-center justify-center shrink-0">
                  <Flame size={16} className="text-[#E11D48]" />
                </span>
                <div>
                  <p className="text-[14px] font-bold text-carbon leading-tight">Flash Sale</p>
                  <p className="text-[10.5px] text-slate">Real discounts, live on the marketplace right now</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-[6px] rounded-full bg-cream border border-bone">
                <Clock size={12} className="text-slate" />
                <span className="text-[11px] font-semibold text-charcoal tabular-nums">
                  {countdown.h}:{countdown.m}:{countdown.s}
                </span>
                <span className="text-[10px] text-slate">left today</span>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {flashDeals.map(({ product, pct }) => (
                <RailCard
                  key={product._id}
                  product={product}
                  onClick={handleCardClick}
                  badge={
                    <span className="px-[6px] py-[2px] rounded-[5px] text-[9px] font-bold bg-[#E11D48] text-white shadow-sm">
                      -{pct}%
                    </span>
                  }
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Top Picks — real purchase count + rating signal, not an ML claim ── */}
      {topPicks.length > 0 && (
        <div className="bg-white border-b border-bone">
          <div className="px-4 sm:px-6 lg:px-10 py-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-brand-pale-orange flex items-center justify-center shrink-0">
                <TrendingUp size={16} className="text-brand-orange" />
              </span>
              <div>
                <p className="text-[14px] font-bold text-carbon leading-tight">Top Picks</p>
                <p className="text-[10.5px] text-slate">Highest rated and most purchased on Solvexo</p>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {topPicks.map(product => (
                <RailCard
                  key={product._id}
                  product={product}
                  onClick={handleCardClick}
                  badge={product.purchaseCount > 0 ? (
                    <span className="px-[6px] py-[2px] rounded-[5px] text-[9px] font-bold bg-carbon/80 text-white backdrop-blur-sm">
                      {product.purchaseCount} sold
                    </span>
                  ) : undefined}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Trust & Service strip ────────────────────────────────────────────── */}
      <TrustServiceStrip />

      {/* ── Category navigation (real categories, admin-managed) ────────────── */}
      {categories.length > 0 && (
        <div className="bg-white border-b border-bone">
          <div className="flex gap-5 sm:gap-6 px-4 sm:px-6 lg:px-10 py-5 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => handleCategoryChange('')}
              className="relative flex flex-col items-center gap-2 shrink-0 w-[72px] cursor-pointer bg-transparent border-none group pb-[3px]"
            >
              <div className={clsx(
                'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border-[1.5px] transition-all duration-200 ease-out',
                'group-hover:-translate-y-[2px] group-hover:shadow-[0_8px_20px_rgba(184,90,54,0.14)]',
                selectedCategory === '' ? 'border-brand-orange bg-brand-pale-orange shadow-[0_8px_20px_rgba(184,90,54,0.14)]' : 'border-bone bg-cream group-hover:border-brand-orange/40',
              )}>
                <ShoppingBag size={22} className={selectedCategory === '' ? 'text-brand-orange' : 'text-slate'} />
              </div>
              <span className={clsx(
                'text-[11px] font-semibold text-center leading-tight transition-colors',
                selectedCategory === '' ? 'text-brand-orange' : 'text-charcoal group-hover:text-brand-orange',
              )}>
                All
              </span>
              {selectedCategory === '' && (
                <span className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full bg-brand-orange" />
              )}
            </button>
            {categories.map(cat => {
              const active = selectedCategory === cat._id;
              return (
                <button
                  key={cat._id}
                  onClick={() => handleCategoryChange(cat._id)}
                  className="relative flex flex-col items-center gap-2 shrink-0 w-[72px] cursor-pointer bg-transparent border-none group pb-[3px]"
                >
                  <div className={clsx(
                    'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden flex items-center justify-center border-[1.5px] transition-all duration-200 ease-out',
                    'group-hover:-translate-y-[2px] group-hover:shadow-[0_8px_20px_rgba(184,90,54,0.14)]',
                    active ? 'border-brand-orange bg-brand-pale-orange shadow-[0_8px_20px_rgba(184,90,54,0.14)]' : 'border-bone bg-cream group-hover:border-brand-orange/40',
                  )}>
                    {cat.image
                      ? <img loading="lazy" decoding="async" src={cat.image} alt="" className="w-full h-full object-cover" />
                      : <ShoppingBag size={22} className={active ? 'text-brand-orange' : 'text-slate'} />
                    }
                  </div>
                  <span className={clsx(
                    'text-[11px] font-semibold text-center leading-tight truncate w-full transition-colors',
                    active ? 'text-brand-orange' : 'text-charcoal group-hover:text-brand-orange',
                  )}>
                    {cat.name}
                  </span>
                  {active && (
                    <span className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full bg-brand-orange" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Category Tabs ────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-bone overflow-x-auto scrollbar-hide">
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} className="px-4 sm:px-6 lg:px-10" />
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
