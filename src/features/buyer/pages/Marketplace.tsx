import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useProductsByCategory } from '@/hooks/marketplace/useProductsByCategory';
import { useCartContext } from '@/contexts/CartContext';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ArrowRight, ShoppingCart, ShoppingBag, Star, Heart, ImageOff, Loader2 } from 'lucide-react';
import type { MarketplaceProduct } from '@/api/commerce/marketplace';

const DIGITAL_COLOR = '#7C3AED';
const DIGITAL_BG    = '#EDE9FE';
const DEEP_ORANGE   = '#B95A3A';

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
      <div className="animate-pulse h-[180px] bg-bone" />
      <div className="p-4">
        <div className="animate-pulse h-[13px] bg-bone rounded-[6px] mb-2" />
        <div className="animate-pulse h-[11px] bg-bone rounded-[6px] w-[55%] mb-[10px]" />
        <div className="flex gap-[6px] mb-[10px]">
          <div className="animate-pulse h-5 w-16 bg-bone rounded" />
          <div className="animate-pulse h-5 w-[72px] bg-bone rounded" />
        </div>
        <div className="flex justify-between items-center">
          <div className="animate-pulse h-5 w-16 bg-bone rounded-[6px]" />
          <div className="animate-pulse h-[30px] w-[86px] bg-bone rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ── Product Image ─────────────────────────────────────────────────────────────
function ProductImage({ images, name }: { images: string[]; name: string }) {
  const [errored, setErrored] = useState(false);
  const src = images[0];

  if (!src || errored) {
    return (
      <div className="h-[180px] bg-brand-pale-orange rounded-t-[12px] flex flex-col items-center justify-center gap-[6px]">
        <ImageOff size={36} className="text-brand-orange opacity-[0.45]" />
        <span className="text-[10px] text-[#8C8A82] max-w-[120px] text-center leading-[1.4]">
          {name.slice(0, 24)}{name.length > 24 ? '…' : ''}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setErrored(true)}
      className="h-[180px] w-full object-cover rounded-t-[12px] block"
    />
  );
}

// ── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-[3px]">
      {[1,2,3,4,5].map(i => (
        <Star
          key={i}
          size={11}
          style={{
            color: i <= Math.round(rating) ? '#D97757' : '#E8E6DC',
            fill:  i <= Math.round(rating) ? '#D97757' : '#E8E6DC',
          }}
        />
      ))}
      {count !== undefined && (
        <span className="text-[11px] text-[#8C8A82] ml-[2px]">({count})</span>
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
  const pType = product.productType ?? product.type ?? 'physical';
  const isDigital = pType === 'digital';

  const defaultVariant = product.variants.find(v => v.isDefault) ?? product.variants[0];
  const lowestPrice = product.variants.length > 0
    ? Math.min(...product.variants.map(v => v.price))
    : null;
  const compareAt = defaultVariant?.compareAtPrice ?? null;
  const ratingCount = product.totalRatings ?? 0;

  return (
    <Card padding="none" hover onClick={onClick}>
      {/* Image + wishlist */}
      <div className="relative">
        <ProductImage images={product.images ?? []} name={product.name} />

        {/* Wishlist heart */}
        <button
          onClick={onToggleWishlist}
          disabled={isWishlisting}
          className={clsx(
            'absolute top-[10px] right-[10px] w-8 h-8 rounded-full bg-[rgba(255,255,255,0.92)] border-none flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.12)] transition-transform duration-150 hover:scale-[1.15]',
            isWishlisting ? 'cursor-wait' : 'cursor-pointer',
          )}
        >
          <Heart
            size={15}
            style={{
              color: isWishlisted ? '#E11D48' : '#8C8A82',
              fill:  isWishlisted ? '#E11D48' : 'none',
              transition: 'color 0.15s, fill 0.15s',
            }}
          />
        </button>

        {/* Type badge */}
        <span
          className="absolute top-[10px] left-[10px] px-2 py-[3px] rounded-[5px] text-[10px] font-semibold border"
          style={{
            background:  isDigital ? DIGITAL_BG  : '#FBECE4',
            color:       isDigital ? DIGITAL_COLOR : DEEP_ORANGE,
            borderColor: isDigital ? '#DDD6FE'   : '#F5D0BC',
          }}
        >
          {isDigital ? 'Digital' : 'Physical'}
        </span>
      </div>

      {/* Card body */}
      <div className="px-[14px] pt-3 pb-[14px]">
        <div className="font-bold text-[13px] text-[#141413] mb-[3px] leading-[1.35] overflow-hidden text-ellipsis whitespace-nowrap">
          {product.name}
        </div>

        <StarRating rating={product.averageRating} count={ratingCount} />

        {/* Tags */}
        {(product.tags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1 mt-[6px]">
            {product.tags!.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] px-[6px] py-[1px] rounded bg-cream text-[#8C8A82] border border-bone">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Price row */}
        <div className="flex items-center justify-between mt-[10px]">
          <div className="flex items-baseline gap-[5px]">
            <span className="font-bold text-[15px] text-[#141413]">
              {lowestPrice != null ? `$${lowestPrice.toLocaleString()}` : '—'}
            </span>
            {compareAt != null && compareAt > (lowestPrice ?? 0) && (
              <span className="text-[11px] text-[#8C8A82] line-through">
                ${compareAt.toLocaleString()}
              </span>
            )}
          </div>
          <Button
            variant="secondary" size="sm"
            onClick={onAddToCart}
          >
            {isAdding
              ? <Loader2 size={11} className="animate-spin" />
              : <ShoppingCart size={11} />
            }
            {isAdding ? 'Adding…' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

const TABS = ['All', 'Physical', 'Digital', 'Education', 'Art & Design', 'Templates', 'Music'];
const PRICE_FILTERS  = ['Under $10', '$10–$50', '$50–$100', '$100+'];
const TYPE_FILTERS   = ['Physical', 'Digital'];
const RATING_FILTERS = ['4★ & up', '3★ & up'];

export function Marketplace() {
  const navigate = useNavigate();
  usePageTitle('Marketplace');
  const [activeTab, setActiveTab] = useState('All');
  const [page, setPage] = useState(1);
  const LIMIT = 15;

  const { products, total, loading, error } = useProductsByCategory(page, LIMIT);
  const { cartCount, addToCart, adding } = useCartContext();
  const { wishlistCount, isWishlisted, wishlisting, toggleWishlist } = useWishlistContext();

  const totalPages = Math.ceil(total / LIMIT) || 1;

  const goToPage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // client-side filter by tab (Physical/Digital)
  const filtered = activeTab === 'All'
    ? products
    : activeTab === 'Physical'
      ? products.filter(p => (p.productType ?? p.type) === 'physical')
      : activeTab === 'Digital'
        ? products.filter(p => (p.productType ?? p.type) === 'digital')
        : products;

  return (
    <div className="min-h-screen bg-cream">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-bone h-[60px] flex items-center gap-4 px-10">
        <div className="flex items-center gap-2 flex-shrink-0">
          <SolvexoIcon size={28} />
          <span className="font-bold text-[15px] text-[#141413]">Solvex</span>
          <span className="font-bold text-[15px] text-brand-orange">o</span>
          <span className="text-bone mx-1">|</span>
          <span className="text-[13px] text-[#8C8A82]">Marketplace</span>
        </div>
        <div className="flex-1 flex justify-center">
          <input
            placeholder="Search marketplace..."
            className="w-full max-w-[440px] px-[14px] py-2 rounded-lg border border-bone bg-cream text-[13px] text-charcoal outline-none"
          />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>Home</Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/onboarding')}>Sell on Solvexo</Button>

          {/* Wishlist icon */}
          <div
            onClick={() => navigate('/account/profile?tab=wishlist')}
            className="relative w-9 h-9 rounded-full bg-[#FFF0F5] border border-[#FECDD3] flex items-center justify-center cursor-pointer"
          >
            <Heart size={16} style={{ color: '#E11D48', fill: wishlistCount > 0 ? '#E11D48' : 'none' }} />
            {wishlistCount > 0 && (
              <span className="absolute top-[-4px] right-[-4px] min-w-[18px] h-[18px] rounded-[9px] bg-[#E11D48] text-white text-[10px] font-bold leading-[18px] text-center px-1 shadow-[0_0_0_2px_#fff]">
                {wishlistCount > 99 ? '99+' : wishlistCount}
              </span>
            )}
          </div>

          {/* Cart icon */}
          <div
            onClick={() => navigate('/cart')}
            className="relative w-9 h-9 rounded-full bg-brand-orange flex items-center justify-center cursor-pointer"
          >
            <ShoppingCart size={16} className="text-white" />
            {cartCount > 0 && (
              <span className="absolute top-[-4px] right-[-4px] min-w-[18px] h-[18px] rounded-[9px] bg-[#E11D48] text-white text-[10px] font-bold leading-[18px] text-center px-1 shadow-[0_0_0_2px_#fff]">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div
        className="px-10 py-9 flex items-center justify-between"
        style={{ background: 'linear-gradient(120deg, #FBECE4, #FFF5EE)' }}
      >
        <div>
          <h1 className="text-[28px] font-bold text-[#141413] mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            Discover Something Made with Love
          </h1>
          <p className="text-[14px] text-[#8C8A82] mb-5">
            Shop unique products from independent sellers, creators, and educators.
          </p>
          <Button variant="primary" size="md">
            Shop Now <ArrowRight size={14} className="inline align-middle ml-1" />
          </Button>
        </div>
        <ShoppingBag size={80} className="text-brand-orange" />
      </div>

      {/* Category tabs */}
      <div className="bg-white border-b border-bone">
        <div className="flex px-10">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 text-[13px] cursor-pointer outline-none"
              style={{
                borderBottom: `2px solid ${activeTab === tab ? C.orange : 'transparent'}`,
                backgroundColor: activeTab === tab ? C.paleOrange : 'transparent',
                color: activeTab === tab ? C.deepOrange : C.slate,
                fontWeight: activeTab === tab ? 700 : 400,
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex gap-6 px-10 py-6">
        {/* Filters */}
        <aside className="w-[200px] flex-shrink-0">
          <div className="text-[14px] font-bold text-[#141413] mb-[14px]">Filters</div>
          {[
            { title: 'Price Range',   items: PRICE_FILTERS  },
            { title: 'Product Type',  items: TYPE_FILTERS   },
            { title: 'Rating',        items: RATING_FILTERS },
          ].map(group => (
            <div key={group.title} className="mb-5">
              <div className="text-[12px] text-[#8C8A82] uppercase tracking-[0.05em] mb-2">
                {group.title}
              </div>
              {group.items.map(label => (
                <label key={label} className="flex items-center gap-2 mb-[6px] cursor-pointer">
                  <input type="checkbox" className="w-[14px] h-[14px] rounded-[2px] border border-bone accent-brand-orange" />
                  <span className="text-[12px] text-charcoal">{label}</span>
                </label>
              ))}
            </div>
          ))}
        </aside>

        {/* Products */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] text-[#8C8A82]">
              {!loading && (error ? 'Error loading products' : `Showing ${filtered.length} of ${total} products`)}
            </span>
            <select className="px-[10px] py-[6px] rounded-lg border border-bone bg-white text-[13px] text-charcoal outline-none cursor-pointer">
              <option>Newest</option>
              <option>Price: Low–High</option>
              <option>Price: High–Low</option>
              <option>Best Rated</option>
            </select>
          </div>

          {error && !loading && (
            <div className="p-6 text-center bg-[#FFF3F0] rounded-[12px] border border-[#FECACA] text-[#C13030] text-[13px]">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-[18px]">
            {loading
              ? Array.from({ length: 9 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : filtered.map(p => {
                  const defVariant = p.variants.find(v => v.isDefault) ?? p.variants[0];
                  const vId = defVariant?._id ?? '';
                  return (
                    <ProductCard
                      key={p._id}
                      product={p}
                      onClick={() => navigate(`/marketplace/${p._id}`)}
                      isAdding={adding === vId}
                      onAddToCart={e => {
                        e.stopPropagation();
                        if (defVariant) addToCart(p._id, vId);
                      }}
                      isWishlisted={isWishlisted(p._id, vId)}
                      isWishlisting={wishlisting === vId}
                      onToggleWishlist={e => {
                        e.stopPropagation();
                        if (defVariant) toggleWishlist(p._id, vId);
                      }}
                    />
                  );
                })
            }
          </div>

          {/* Empty state */}
          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-[60px] text-[#8C8A82] text-[14px]">
              No products found in this category yet.
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div className="flex items-center justify-center gap-[6px] mt-8 pb-2">
              {/* Prev */}
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                className={clsx('h-9 px-[14px] rounded-lg text-[13px] border border-bone bg-white flex items-center gap-1 font-medium', page === 1 ? 'cursor-not-allowed text-bone' : 'cursor-pointer text-charcoal')}
              >
                ← Prev
              </button>

              {/* Page numbers */}
              {buildPageNumbers(page, totalPages).map((item, i) =>
                item === '...' ? (
                  <span key={`ellipsis-${i}`} className="w-9 text-center text-[#8C8A82] text-[13px]">…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => goToPage(item as number)}
                    className="w-9 h-9 rounded-lg text-[13px] font-semibold cursor-pointer"
                    style={{
                      border: `1px solid ${page === item ? C.orange : C.bone}`,
                      background: page === item ? C.orange : C.white,
                      color: page === item ? '#fff' : C.charcoal,
                    }}
                  >
                    {item}
                  </button>
                )
              )}

              {/* Next */}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
                className={clsx('h-9 px-[14px] rounded-lg text-[13px] border border-bone bg-white flex items-center gap-1 font-medium', page === totalPages ? 'cursor-not-allowed text-bone' : 'cursor-pointer text-charcoal')}
              >
                Next →
              </button>
            </div>
          )}

          {/* Page info */}
          {!loading && !error && totalPages > 1 && (
            <div className="text-center mt-2 mb-6 text-[12px] text-[#8C8A82]">
              Page {page} of {totalPages} · {total} products total
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Pagination helper ─────────────────────────────────────────────────────────
function buildPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [];
  const addPage = (n: number) => { if (!pages.includes(n)) pages.push(n); };

  addPage(1);
  if (current > 3) pages.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) addPage(i);
  if (current < total - 2) pages.push('...');
  addPage(total);

  return pages;
}
