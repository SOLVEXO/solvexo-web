import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useProductsByCategory } from '@/hooks/marketplace/useProductsByCategory';
import { useCartContext } from '@/contexts/CartContext';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { Button } from '@/components/comman/ui/Button';
import { Card } from '@/components/comman/ui/Card';
import { TabBar, Pagination, FilterDropdown } from '@/components/comman/ui';
import type { Tab } from '@/components/comman/ui';
import {
  ShoppingCart, ShoppingBag, Star, Heart, ImageOff,
  Loader2, SlidersHorizontal, X,
} from 'lucide-react';
import type { MarketplaceProduct } from '@/api/commerce/marketplace';

function SolvexoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#D97757"/>
      <text x="4" y="26" fontFamily="'Poppins',sans-serif" fontWeight="800" fontSize="26" fill="white">s</text>
      <rect x="16.5" y="2" width="13" height="13" rx="3.5" fill="#C8694E" fillOpacity="0.7"/>
      <path d="M23 11.5V5.5M23 5.5L20 8.5M23 5.5L26 8.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-[12px] border border-bone overflow-hidden">
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
      onError={() => setErrored(true)}
      className={clsx('w-full object-cover block', className)}
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
function ProductCard({ product, onClick, onAddToCart, isAdding, isWishlisted, isWishlisting, onToggleWishlist }: {
  product:          MarketplaceProduct;
  onClick:          () => void;
  onAddToCart:      (e: React.MouseEvent) => void;
  isAdding:         boolean;
  isWishlisted:     boolean;
  isWishlisting:    boolean;
  onToggleWishlist: (e: React.MouseEvent) => void;
}) {
  const pType     = product.productType ?? product.type ?? 'physical';
  const isDigital = pType === 'digital';

  const defaultVariant = product.variants.find(v => v.isDefault) ?? product.variants[0];
  const lowestPrice    = product.variants.length > 0
    ? Math.min(...product.variants.map(v => v.price))
    : null;
  const compareAt   = defaultVariant?.compareAtPrice ?? null;
  const ratingCount = product.totalRatings ?? 0;

  return (
    <Card padding="none" hover onClick={onClick} className="overflow-hidden">
      {/* Image */}
      <div className="relative">
        <ProductImage
          images={product.images ?? []}
          name={product.name}
          className="h-[130px] sm:h-[160px] lg:h-[180px]"
        />
        <button
          onClick={onToggleWishlist}
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
        <span className={clsx(
          'absolute top-[8px] left-[8px] px-[6px] py-[2px] rounded-[5px] text-[9px] sm:text-[10px] font-semibold border',
          isDigital
            ? 'bg-[#EDE9FE] text-[#7C3AED] border-[#DDD6FE]'
            : 'bg-brand-pale-orange text-brand-deep-orange border-[#F5D0BC]',
        )}>
          {isDigital ? 'Digital' : 'Physical'}
        </span>
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
        <div className="flex items-center justify-between mt-[8px] sm:mt-[10px]">
          <div className="flex items-baseline gap-[3px]">
            <span className="font-bold text-[13px] sm:text-[15px] text-carbon">
              {lowestPrice != null ? `$${lowestPrice.toLocaleString()}` : '—'}
            </span>
            {compareAt != null && compareAt > (lowestPrice ?? 0) && (
              <span className="hidden sm:inline text-[11px] text-slate line-through">${compareAt.toLocaleString()}</span>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={onAddToCart} className="inline-flex shrink-0">
            {isAdding ? <Loader2 size={11} className="animate-spin" /> : <ShoppingCart size={11} />}
            <span className="hidden lg:inline">{isAdding ? 'Adding…' : 'Add to Cart'}</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ── Filter data ───────────────────────────────────────────────────────────────
const FILTER_GROUPS = [
  { key: 'price',  title: 'Price Range',  items: ['Under $10', '$10–$50', '$50–$100', '$100+'] },
  { key: 'type',   title: 'Product Type', items: ['Physical', 'Digital']                       },
  { key: 'rating', title: 'Rating',       items: ['4★ & up', '3★ & up']                        },
];

interface FilterState { price: string[]; type: string[]; rating: string[]; }

function FilterPanel({ filters, onChange }: {
  filters:  FilterState;
  onChange: (key: keyof FilterState, value: string) => void;
}) {
  return (
    <div className="space-y-5">
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

  const LIMIT = 15;
  const { products, total, loading, error } = useProductsByCategory(page, LIMIT);
  const { cartCount, addToCart, adding }    = useCartContext();
  const { wishlistCount, isWishlisted, wishlisting, toggleWishlist } = useWishlistContext();

  const totalPages        = Math.ceil(total / LIMIT) || 1;
  const activeFilterCount = filters.price.length + filters.type.length + filters.rating.length;

  const toggleFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => {
      const arr = prev[key];
      return { ...prev, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  const clearFilters = () => setFilters({ price: [], type: [], rating: [] });

  const goToPage = (p: number) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const filtered = activeTab === 'All'
    ? products
    : activeTab === 'Physical'
      ? products.filter(p => (p.productType ?? p.type) === 'physical')
      : activeTab === 'Digital'
        ? products.filter(p => (p.productType ?? p.type) === 'digital')
        : products;

  return (
    <div className="min-h-screen bg-cream">

      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-bone">
        <div className="h-[60px] flex items-center gap-3 px-4 sm:px-6 lg:px-10">

          {/* Logo */}
          <div className="flex items-center gap-[6px] shrink-0">
            <SolvexoIcon size={28} />
            <span className="font-bold text-[15px] text-[#141413]">Solvex</span>
            <span className="font-bold text-[15px] text-brand-orange">o</span>
            <span className="text-bone mx-1 hidden md:inline">|</span>
            <span className="text-[13px] text-slate hidden md:inline">Marketplace</span>
          </div>

          {/* Search */}
          <div className="flex-1 flex justify-center px-2 sm:px-4">
            <input
              placeholder="Search marketplace..."
              className="w-full max-w-[240px] sm:max-w-[360px] lg:max-w-[480px] px-[14px] py-[9px] rounded-lg border border-bone bg-cream text-[13px] text-charcoal outline-none focus:border-brand-orange transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Home + Sell — hidden on mobile; BottomNav handles navigation below md */}
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="hidden md:inline-flex">
              Home
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/onboarding')}
              className="hidden md:inline-flex"
            >
              Sell on Solvexo
            </Button>

            {/* Wishlist */}
            <div
              onClick={() => navigate('/account/profile?tab=wishlist')}
              className="relative w-9 h-9 rounded-full bg-[#FFF0F5] border border-[#FECDD3] flex items-center justify-center cursor-pointer shrink-0"
            >
              <Heart size={16} className={wishlistCount > 0 ? 'text-[#E11D48] fill-[#E11D48]' : 'text-[#E11D48] fill-none'} />
              {wishlistCount > 0 && (
                <span className="absolute top-[-4px] right-[-4px] min-w-[18px] h-[18px] rounded-[9px] bg-[#E11D48] text-white text-[10px] font-bold leading-[18px] text-center px-1 shadow-[0_0_0_2px_#fff]">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </div>

            {/* Cart */}
            <div
              onClick={() => navigate('/cart')}
              className="relative w-9 h-9 rounded-full bg-brand-orange flex items-center justify-center cursor-pointer shrink-0"
            >
              <ShoppingCart size={16} className="text-white" />
              {cartCount > 0 && (
                <span className="absolute top-[-4px] right-[-4px] min-w-[18px] h-[18px] rounded-[9px] bg-[#E11D48] text-white text-[10px] font-bold leading-[18px] text-center px-1 shadow-[0_0_0_2px_#fff]">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#FBECE4] to-[#FFF5EE] border-b border-[#F5D5C2]">
        <div className="px-4 sm:px-6 lg:px-10 py-7 sm:py-9 lg:py-10 flex items-center justify-between gap-6">

          {/* Left text */}
          <div className="min-w-0">
            <h1 className="font-serif text-[20px] sm:text-[26px] lg:text-[30px] font-bold text-carbon mb-[6px] sm:mb-2 leading-[1.2]">
              Discover Something<br className="hidden sm:block" /> Made with Love
            </h1>
            <p className="text-[12px] sm:text-[13px] text-slate mb-4 sm:mb-5 max-w-[380px]">
              Shop unique products from independent sellers, creators, and educators.
            </p>
            <Button variant="primary" size="md">
              Shop Now <span className="ml-1">→</span>
            </Button>
          </div>

          <ShoppingBag size={80} className="text-brand-orange hidden sm:block shrink-0" />
        </div>
      </div>

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
                <FilterPanel filters={filters} onChange={toggleFilter} />
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
              <div className="p-6 text-center bg-[#FFF3F0] rounded-[12px] border border-[#FECACA] text-[#C13030] text-[13px]">
                {error}
              </div>
            )}

            {/* Grid: 2-col mobile → 2-col sm → 3-col md (no sidebar) → 3-col lg → 4-col xl */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-[10px] sm:gap-3 lg:gap-[14px]">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : filtered.map(p => {
                    const defVariant = p.variants.find(v => v.isDefault) ?? p.variants[0];
                    const vId = defVariant?._id ?? '';
                    return (
                      <ProductCard
                        key={p._id}
                        product={p}
                        onClick={() => navigate(`/marketplace/${p._id}`)}
                        isAdding={adding === vId}
                        onAddToCart={e => { e.stopPropagation(); if (defVariant) addToCart(p._id, vId, p.productType ?? p.type ?? 'physical'); }}
                        isWishlisted={isWishlisted(p._id, vId)}
                        isWishlisting={wishlisting === vId}
                        onToggleWishlist={e => { e.stopPropagation(); if (defVariant) toggleWishlist(p._id, vId); }}
                      />
                    );
                  })
              }
            </div>

            {!loading && !error && filtered.length === 0 && (
              <div className="text-center py-[60px] text-slate text-[14px]">
                No products found in this category yet.
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
          <FilterPanel filters={filters} onChange={toggleFilter} />
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
