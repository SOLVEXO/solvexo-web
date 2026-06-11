import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useProductsByCategory } from '@/hooks/marketplace/useProductsByCategory';
import { useCartContext } from '@/contexts/CartContext';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ArrowRight, ShoppingCart, ShoppingBag, Star, Heart, ImageOff, Loader2 } from 'lucide-react';
import type { MarketplaceProduct } from '@/api/commerce/marketplace';

const C = {
  orange: '#D97757', deepOrange: '#B95A3A', paleOrange: '#FBECE4',
  carbon: '#141413', charcoal: '#2C2A28', slate: '#8C8A82',
  bone: '#E8E6DC', cream: '#FAF9F5', white: '#FFFFFF',
  success: '#2D8A4E', successBg: '#EBF7EF',
  digital: '#7C3AED', digitalBg: '#EDE9FE',
};

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
    <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.bone}`, overflow: 'hidden' }}>
      <div className="animate-pulse" style={{ height: 180, background: '#E8E6DC' }} />
      <div style={{ padding: 16 }}>
        <div className="animate-pulse" style={{ height: 13, background: '#E8E6DC', borderRadius: 6, marginBottom: 8 }} />
        <div className="animate-pulse" style={{ height: 11, background: '#E8E6DC', borderRadius: 6, width: '55%', marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <div className="animate-pulse" style={{ height: 20, width: 64, background: '#E8E6DC', borderRadius: 4 }} />
          <div className="animate-pulse" style={{ height: 20, width: 72, background: '#E8E6DC', borderRadius: 4 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="animate-pulse" style={{ height: 20, width: 64, background: '#E8E6DC', borderRadius: 6 }} />
          <div className="animate-pulse" style={{ height: 30, width: 86, background: '#E8E6DC', borderRadius: 8 }} />
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
      <div style={{
        height: 180, background: C.paleOrange, borderRadius: '12px 12px 0 0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 6,
      }}>
        <ImageOff size={36} style={{ color: '#D97757', opacity: 0.45 }} />
        <span style={{ fontSize: 10, color: C.slate, maxWidth: 120, textAlign: 'center', lineHeight: 1.4 }}>
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
      style={{ height: 180, width: '100%', objectFit: 'cover', borderRadius: '12px 12px 0 0', display: 'block' }}
    />
  );
}

// ── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {[1,2,3,4,5].map(i => (
        <Star
          key={i}
          size={11}
          style={{
            color: i <= Math.round(rating) ? '#D97757' : C.bone,
            fill:  i <= Math.round(rating) ? '#D97757' : C.bone,
          }}
        />
      ))}
      {count !== undefined && (
        <span style={{ fontSize: 11, color: C.slate, marginLeft: 2 }}>({count})</span>
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
      <div style={{ position: 'relative' }}>
        <ProductImage images={product.images ?? []} name={product.name} />

        {/* Wishlist heart */}
        <button
          onClick={onToggleWishlist}
          disabled={isWishlisting}
          style={{
            position: 'absolute', top: 10, right: 10,
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: isWishlisting ? 'wait' : 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.15)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
        >
          <Heart
            size={15}
            style={{
              color: isWishlisted ? '#E11D48' : C.slate,
              fill:  isWishlisted ? '#E11D48' : 'none',
              transition: 'color 0.15s, fill 0.15s',
            }}
          />
        </button>

        {/* Type badge */}
        <span style={{
          position: 'absolute', top: 10, left: 10,
          padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600,
          background: isDigital ? C.digitalBg : C.paleOrange,
          color:      isDigital ? C.digital   : C.deepOrange,
          border:     `1px solid ${isDigital ? '#DDD6FE' : '#F5D0BC'}`,
        }}>
          {isDigital ? 'Digital' : 'Physical'}
        </span>
      </div>

      {/* Card body */}
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: C.carbon, marginBottom: 3, lineHeight: 1.35,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.name}
        </div>

        <StarRating rating={product.averageRating} count={ratingCount} />

        {/* Tags */}
        {(product.tags?.length ?? 0) > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {product.tags!.slice(0, 3).map(tag => (
              <span key={tag} style={{
                fontSize: 10, padding: '1px 6px', borderRadius: 4,
                background: C.cream, color: C.slate, border: `1px solid ${C.bone}`,
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Price row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: C.carbon }}>
              {lowestPrice != null ? `$${lowestPrice.toLocaleString()}` : '—'}
            </span>
            {compareAt != null && compareAt > (lowestPrice ?? 0) && (
              <span style={{ fontSize: 11, color: C.slate, textDecoration: 'line-through' }}>
                ${compareAt.toLocaleString()}
              </span>
            )}
          </div>
          <Button
            variant="secondary" size="sm"
            onClick={onAddToCart}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {isAdding
              ? <Loader2 size={11} style={{ animation: 'spin 0.7s linear infinite' }} />
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
    <div style={{ minHeight: '100vh', backgroundColor: C.cream }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: C.white, borderBottom: `1px solid ${C.bone}`,
        height: 60, display: 'flex', alignItems: 'center',
        gap: 16, paddingLeft: 40, paddingRight: 40,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <SolvexoIcon size={28} />
          <span style={{ fontWeight: 700, fontSize: 15, color: C.carbon }}>Solvex</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: C.orange }}>o</span>
          <span style={{ color: C.bone, marginLeft: 4, marginRight: 4 }}>|</span>
          <span style={{ fontSize: 13, color: C.slate }}>Marketplace</span>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <input
            placeholder="Search marketplace..."
            style={{
              width: '100%', maxWidth: 440,
              padding: '8px 14px', borderRadius: 8,
              border: `1px solid ${C.bone}`, backgroundColor: C.cream,
              fontSize: 13, color: C.charcoal, outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>Home</Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/onboarding')}>Sell on Solvexo</Button>

          {/* Wishlist icon */}
          <div
            onClick={() => navigate('/account/profile?tab=wishlist')}
            style={{
              position: 'relative', width: 36, height: 36, borderRadius: '50%',
              backgroundColor: '#FFF0F5', border: '1px solid #FECDD3',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <Heart size={16} style={{ color: '#E11D48', fill: wishlistCount > 0 ? '#E11D48' : 'none' }} />
            {wishlistCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                minWidth: 18, height: 18, borderRadius: 9,
                background: '#E11D48', color: '#fff',
                fontSize: 10, fontWeight: 700, lineHeight: '18px',
                textAlign: 'center', padding: '0 4px',
                boxShadow: '0 0 0 2px #fff',
              }}>
                {wishlistCount > 99 ? '99+' : wishlistCount}
              </span>
            )}
          </div>

          {/* Cart icon */}
          <div
            onClick={() => navigate('/cart')}
            style={{
              position: 'relative', width: 36, height: 36, borderRadius: '50%',
              backgroundColor: C.orange, display: 'flex',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <ShoppingCart size={16} style={{ color: '#fff' }} />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                minWidth: 18, height: 18, borderRadius: 9,
                background: '#E11D48', color: '#fff',
                fontSize: 10, fontWeight: 700, lineHeight: '18px',
                textAlign: 'center', padding: '0 4px',
                boxShadow: '0 0 0 2px #fff',
              }}>
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(120deg, #FBECE4, #FFF5EE)',
        padding: '36px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, color: C.carbon, marginBottom: 8 }}>
            Discover Something Made with Love
          </h1>
          <p style={{ fontSize: 14, color: C.slate, marginBottom: 20 }}>
            Shop unique products from independent sellers, creators, and educators.
          </p>
          <Button variant="primary" size="md">
            Shop Now <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
          </Button>
        </div>
        <ShoppingBag size={80} style={{ color: '#D97757' }} />
      </div>

      {/* Category tabs */}
      <div style={{ backgroundColor: C.white, borderBottom: `1px solid ${C.bone}` }}>
        <div style={{ display: 'flex', paddingLeft: 40, paddingRight: 40 }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                borderBottom: `2px solid ${activeTab === tab ? C.orange : 'transparent'}`,
                backgroundColor: activeTab === tab ? C.paleOrange : 'transparent',
                color: activeTab === tab ? C.deepOrange : C.slate,
                fontWeight: activeTab === tab ? 700 : 400,
                fontSize: 13, cursor: 'pointer', outline: 'none',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{ display: 'flex', gap: 24, padding: '24px 40px' }}>
        {/* Filters */}
        <aside style={{ width: 200, flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.carbon, marginBottom: 14 }}>Filters</div>
          {[
            { title: 'Price Range',   items: PRICE_FILTERS  },
            { title: 'Product Type',  items: TYPE_FILTERS   },
            { title: 'Rating',        items: RATING_FILTERS },
          ].map(group => (
            <div key={group.title} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                {group.title}
              </div>
              {group.items.map(label => (
                <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
                  <input type="checkbox" style={{ width: 14, height: 14, borderRadius: 2, border: `1px solid ${C.bone}`, accentColor: C.orange }} />
                  <span style={{ fontSize: 12, color: C.charcoal }}>{label}</span>
                </label>
              ))}
            </div>
          ))}
        </aside>

        {/* Products */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: C.slate }}>
              {!loading && (error ? 'Error loading products' : `Showing ${filtered.length} of ${total} products`)}
            </span>
            <select style={{
              padding: '6px 10px', borderRadius: 8,
              border: `1px solid ${C.bone}`, backgroundColor: C.white,
              fontSize: 13, color: C.charcoal, outline: 'none', cursor: 'pointer',
            }}>
              <option>Newest</option>
              <option>Price: Low–High</option>
              <option>Price: High–Low</option>
              <option>Best Rated</option>
            </select>
          </div>

          {error && !loading && (
            <div style={{
              padding: 24, textAlign: 'center', background: '#FFF3F0',
              borderRadius: 12, border: '1px solid #FECACA', color: '#C13030', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
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
            <div style={{ textAlign: 'center', padding: '60px 0', color: C.slate, fontSize: 14 }}>
              No products found in this category yet.
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 6, marginTop: 32, paddingBottom: 8,
            }}>
              {/* Prev */}
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                style={{
                  height: 36, padding: '0 14px', borderRadius: 8, fontSize: 13,
                  border: `1px solid ${C.bone}`, background: C.white, cursor: page === 1 ? 'not-allowed' : 'pointer',
                  color: page === 1 ? C.bone : C.charcoal, fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                ← Prev
              </button>

              {/* Page numbers */}
              {buildPageNumbers(page, totalPages).map((item, i) =>
                item === '...' ? (
                  <span key={`ellipsis-${i}`} style={{ width: 36, textAlign: 'center', color: C.slate, fontSize: 13 }}>…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => goToPage(item as number)}
                    style={{
                      width: 36, height: 36, borderRadius: 8, fontSize: 13, fontWeight: 600,
                      border: `1px solid ${page === item ? C.orange : C.bone}`,
                      background: page === item ? C.orange : C.white,
                      color: page === item ? '#fff' : C.charcoal,
                      cursor: 'pointer',
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
                style={{
                  height: 36, padding: '0 14px', borderRadius: 8, fontSize: 13,
                  border: `1px solid ${C.bone}`, background: C.white, cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  color: page === totalPages ? C.bone : C.charcoal, fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                Next →
              </button>
            </div>
          )}

          {/* Page info */}
          {!loading && !error && totalPages > 1 && (
            <div style={{ textAlign: 'center', marginTop: 8, marginBottom: 24, fontSize: 12, color: C.slate }}>
              Page {page} of {totalPages} · {total} products total
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
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
