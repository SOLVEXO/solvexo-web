import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useProductById } from '@/hooks/marketplace/useProductById';
import { useCartContext } from '@/contexts/CartContext';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import {
  ArrowRight, ArrowLeft, Package, Download, ClipboardList, CheckCircle,
  Search, ShoppingCart, Star, Link2, Mail, Smartphone, ImageOff, Loader2, Heart,
} from 'lucide-react';
import type { ProductVariant } from '@/api/commerce/marketplace';


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
function DetailSkeleton() {
  const box = (w: string | number, h: number, r = 6) => (
    <div className="animate-pulse" style={{ width: w, height: h, borderRadius: r, background: '#E8E6DC' }} />
  );
  return (
    <div className="px-10 py-7">
      {/* Breadcrumb */}
      <div className="flex gap-2 mb-6">
        {[80, 20, 60, 20, 120].map((w, i) => (
          <div key={i} className="animate-pulse h-[13px] rounded bg-bone" style={{ width: w }} />
        ))}
      </div>
      <div className="grid gap-9 items-start" style={{ gridTemplateColumns: '1fr 380px' }}>
        {/* Left */}
        <div>
          <div className="animate-pulse h-[340px] rounded-2xl bg-bone mb-4" />
          <div className="flex gap-[10px] mb-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="animate-pulse w-[70px] h-[70px] rounded-[10px] bg-bone" />
            ))}
          </div>
          {box('40%', 18, 6)}
          <div className="mt-3 flex flex-col gap-2">
            {[100, 95, 90, 80].map((w, i) => (
              <div key={i} className="animate-pulse h-3 rounded bg-bone" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
        {/* Right */}
        <div className="bg-white rounded-[12px] border border-bone p-6">
          {box(60, 20, 4)}
          <div className="mt-3">{box('80%', 24, 6)}</div>
          <div className="mt-2">{box('50%', 13, 4)}</div>
          <div className="mt-4">{box(80, 36, 8)}</div>
          <div className="mt-5 flex flex-col gap-[10px]">
            {box('100%', 44, 10)}
            {box('100%', 40, 10)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Product Image ─────────────────────────────────────────────────────────────
function ProductImage({ images, name, selected }: { images: string[]; name: string; selected: number }) {
  const [errored, setErrored] = useState(false);
  const src = images[selected] ?? images[0];

  if (!src || errored) {
    return (
      <div
        className="h-[340px] rounded-2xl flex flex-col items-center justify-center gap-2 mb-4"
        style={{ background: 'linear-gradient(135deg, #FBECE4, #FFF5EE)' }}
      >
        <ImageOff size={60} className="text-brand-orange opacity-50" />
        <span className="text-[12px] text-[#8C8A82]">{name}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setErrored(true)}
      className="h-[340px] w-full object-cover rounded-2xl block mb-4"
    />
  );
}

// ── Variant Selector ──────────────────────────────────────────────────────────
function VariantSelector({ variants, selected, onSelect }: {
  variants: ProductVariant[];
  selected: ProductVariant | null;
  onSelect: (v: ProductVariant) => void;
}) {
  if (!variants.length) return null;
  return (
    <div className="mb-4">
      {variants.some(v => v.color) && (
        <div className="mb-[10px]">
          <p className="text-[12px] font-semibold text-charcoal mb-[6px]">
            Color: <span className="font-normal text-[#8C8A82]">{selected?.color ?? '—'}</span>
          </p>
          <div className="flex flex-wrap gap-[6px]">
            {variants.map(v => (
              <button
                key={v._id}
                onClick={() => onSelect(v)}
                className="px-[10px] py-1 rounded-[6px] text-[12px] cursor-pointer"
                style={{
                  border: `1.5px solid ${selected?._id === v._id ? '#D97757' : '#E8E6DC'}`,
                  background: selected?._id === v._id ? '#FBECE4' : '#FFFFFF',
                  color: selected?._id === v._id ? '#B95A3A' : '#2C2A28',
                  fontWeight: selected?._id === v._id ? 600 : 400,
                }}
              >
                {v.color}
              </button>
            ))}
          </div>
        </div>
      )}
      {variants.some(v => v.size) && (
        <div>
          <p className="text-[12px] font-semibold text-charcoal mb-[6px]">
            Size: <span className="font-normal text-[#8C8A82]">{selected?.size ?? '—'}</span>
          </p>
          <div className="flex flex-wrap gap-[6px]">
            {variants.map(v => (
              <button
                key={v._id}
                onClick={() => onSelect(v)}
                className="px-[10px] py-1 rounded-[6px] text-[12px] cursor-pointer"
                style={{
                  border: `1.5px solid ${selected?._id === v._id ? '#D97757' : '#E8E6DC'}`,
                  background: selected?._id === v._id ? '#FBECE4' : '#FFFFFF',
                  color: selected?._id === v._id ? '#B95A3A' : '#2C2A28',
                  fontWeight: selected?._id === v._id ? 600 : 400,
                }}
              >
                {v.size}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ProductDetail() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  usePageTitle('Product Detail');

  const { detail, loading, error } = useProductById(id);
  const { cartCount, addToCart, adding } = useCartContext();
  const { wishlistCount, isWishlisted, wishlisting, toggleWishlist } = useWishlistContext();

  const [selectedImgIdx, setSelectedImgIdx] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const product       = detail?.product ?? null;
  const variants      = detail?.variants ?? [];
  const activeVariant = selectedVariant ?? detail?.defaultVariant ?? null;
  const allImages     = [
    ...(product?.images ?? []),
    ...(activeVariant?.images ?? []),
  ].filter((v, i, a) => a.indexOf(v) === i); // deduplicate

  const sellerInitials = product?.sellerName
    ? product.sellerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="min-h-screen bg-cream">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-bone h-[60px] flex items-center px-10">
        <div className="flex-1 flex items-center gap-2">
          <SolvexoIcon size={28} />
          <span className="font-bold text-[15px] text-[#141413]">Solvex</span>
          <span className="font-bold text-[15px] text-brand-orange">o</span>
        </div>
        <div className="w-[440px] relative flex-shrink-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8A82] pointer-events-none flex">
            <Search size={14} />
          </span>
          <input
            placeholder="Search..."
            className="w-full pl-9 pr-[14px] py-[9px] rounded-[20px] border border-bone bg-cream text-[13px] text-charcoal outline-none box-border"
          />
        </div>
        <div className="flex-1 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/marketplace')}>
            <ArrowLeft size={14} className="inline align-middle mr-1" /> Marketplace
          </Button>

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

      {/* Loading */}
      {loading && <DetailSkeleton />}

      {/* Error */}
      {!loading && error && (
        <div className="px-10 py-[60px] text-center">
          <p className="text-[15px] text-[#C13030] mb-4">{error}</p>
          <Button variant="secondary" onClick={() => navigate('/marketplace')}>Back to Marketplace</Button>
        </div>
      )}

      {/* Content */}
      {!loading && product && (
        <div className="px-10 py-7">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6 text-[13px]">
            <span className="text-[#8C8A82] cursor-pointer" onClick={() => navigate('/marketplace')}>Marketplace</span>
            <span className="text-[#8C8A82]">/</span>
            <span className="text-charcoal font-bold overflow-hidden text-ellipsis whitespace-nowrap max-w-[260px]">
              {product.name}
            </span>
          </div>

          <div className="grid gap-9 items-start min-w-0" style={{ gridTemplateColumns: '1fr 380px' }}>
            {/* LEFT */}
            <div className="min-w-0">
              <ProductImage images={allImages} name={product.name} selected={selectedImgIdx} />

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-[10px] mb-6 flex-wrap">
                  {allImages.slice(0, 6).map((img, i) => (
                    <ThumbImage
                      key={i}
                      src={img}
                      active={selectedImgIdx === i}
                      onClick={() => setSelectedImgIdx(i)}
                    />
                  ))}
                </div>
              )}

              {/* Description */}
              <h2 className="text-[18px] font-bold text-[#141413] mb-3">About This Product</h2>
              <p className="text-[13px] text-[#8C8A82] leading-[1.8] mb-4">
                {product.description || 'No description available.'}
              </p>

              {/* Info chips */}
              <div className="flex flex-wrap gap-2 mb-6">
                {product.slug && (
                  <span className="bg-brand-pale-orange text-[#B95A3A] text-[11px] font-medium px-2 py-[3px] rounded-[6px] border border-bone">
                    /{product.slug}
                  </span>
                )}
                {activeVariant?.sku && (
                  <span className="bg-cream text-[#8C8A82] text-[11px] font-medium px-2 py-[3px] rounded-[6px] border border-bone">
                    SKU: {activeVariant.sku}
                  </span>
                )}
                {(activeVariant?.stock ?? 0) > 0 && (
                  <span className="bg-[#EBF7EF] text-[#2D8A4E] text-[11px] font-medium px-2 py-[3px] rounded-[6px] border border-[#A7F3D0]">
                    {activeVariant!.stock} in stock
                  </span>
                )}
              </div>

              <div className="h-px bg-bone my-4" />

              {/* Seller */}
              <div className="text-[15px] font-bold text-[#141413] mb-[14px]">About the Seller</div>
              <div className="flex items-start gap-[14px] mb-4">
                <div className="w-[52px] h-[52px] rounded-full bg-success-bg text-success flex items-center justify-center font-bold text-[16px] flex-shrink-0">
                  {sellerInitials}
                </div>
                <div className="flex-1">
                  <div className="text-[15px] font-bold text-[#141413] mb-1">
                    {product.sellerName ?? 'Unknown Seller'}
                  </div>
                  <p className="text-[12px] text-[#8C8A82] leading-[1.6] mb-[10px]">
                    Independent seller on Solvexo marketplace.
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/store/${product.slug}`)}>
                    View Store <ArrowRight size={14} className="inline align-middle ml-1" />
                  </Button>
                </div>
              </div>

              <div className="h-px bg-bone my-4" />

              {/* Reviews placeholder */}
              <div className="text-[15px] font-bold text-[#141413] mb-3">
                Reviews ({product.totalRatings})
              </div>
              {product.totalRatings === 0 && (
                <p className="text-[13px] text-[#8C8A82]">No reviews yet. Be the first to buy!</p>
              )}
            </div>

            {/* RIGHT: sticky purchase card */}
            <div className="sticky top-20 min-w-0">
              <Card padding="none">
                <div className="px-6 pt-6 pb-0">
                  <Badge color="orange">Physical</Badge>
                  <h1
                    className="text-[21px] font-bold text-[#141413] mt-3 mb-[6px] leading-[1.35] break-words"
                    style={{ fontFamily: "'Lora', Georgia, serif" }}
                  >
                    {product.name}
                  </h1>
                  <p className="text-[12px] text-[#8C8A82] mb-4 flex items-center gap-1 flex-wrap">
                    {product.sellerName && <>by {product.sellerName}</>}
                    {product.averageRating > 0 && (
                      <span className="flex items-center gap-[3px]">
                        • <Star size={11} className="text-brand-orange" style={{ fill: '#D97757' }} />
                        {product.averageRating.toFixed(1)} ({product.totalRatings} reviews)
                      </span>
                    )}
                  </p>

                  {/* Price */}
                  <div className="text-[32px] font-extrabold text-[#141413] mb-1 tracking-[-0.5px]">
                    {activeVariant ? `$${activeVariant.price.toLocaleString()}` : '—'}
                  </div>
                  <div className="text-[12px] text-success mb-4 flex items-center gap-[5px]">
                    <CheckCircle size={13} />
                    {(activeVariant?.stock ?? 0) > 0 ? `${activeVariant!.stock} in stock` : 'Out of stock'}
                  </div>

                  {/* Variant selector */}
                  <VariantSelector
                    variants={variants}
                    selected={activeVariant}
                    onSelect={v => setSelectedVariant(v)}
                  />

                  {/* Buttons */}
                  <div className="flex flex-col gap-[10px] mb-6">
                    <Button
                      variant="primary" size="lg" fullWidth
                      className="justify-center"
                      onClick={async () => {
                        if (!product || !activeVariant) return;
                        await addToCart(product._id, activeVariant._id);
                        navigate('/cart');
                      }}
                    >
                      Buy Now <ArrowRight size={14} className="inline align-middle ml-[6px]" />
                      {activeVariant ? ` $${activeVariant.price.toLocaleString()}` : ''}
                    </Button>

                    <div className="flex gap-2">
                      <Button
                        variant="secondary" size="md" fullWidth
                        className="justify-center flex-1"
                        onClick={async () => {
                          if (!product || !activeVariant) return;
                          await addToCart(product._id, activeVariant._id);
                          setAddedFeedback(true);
                          setTimeout(() => setAddedFeedback(false), 2000);
                        }}
                      >
                        {adding === activeVariant?._id
                          ? <><Loader2 size={13} className="animate-spin" /> Adding…</>
                          : addedFeedback
                            ? '✓ Added to Cart'
                            : 'Add to Cart'
                        }
                      </Button>

                      {/* Wishlist toggle button */}
                      {product && activeVariant && (() => {
                        const wishlisted = isWishlisted(product._id, activeVariant._id);
                        const busy       = wishlisting === activeVariant._id;
                        return (
                          <button
                            onClick={() => toggleWishlist(product._id, activeVariant._id)}
                            disabled={busy}
                            title={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                            className="w-10 flex-shrink-0 rounded-[10px] flex items-center justify-center transition-all duration-150"
                            style={{
                              border: `1.5px solid ${wishlisted ? '#FECDD3' : '#E8E6DC'}`,
                              background: wishlisted ? '#FFF0F5' : '#FFFFFF',
                              cursor: busy ? 'wait' : 'pointer',
                            }}
                          >
                            <Heart
                              size={16}
                              style={{
                                color: wishlisted ? '#E11D48' : '#8C8A82',
                                fill:  wishlisted ? '#E11D48' : 'none',
                                transition: 'color 0.15s, fill 0.15s',
                              }}
                            />
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-bone" />

                {/* Info rows */}
                <div className="px-6 py-5 flex flex-col gap-4">
                  {[
                    { Icon: Package,       label: "Seller",    value: product.sellerName ?? 'Unknown' },
                    { Icon: Download,      label: 'Delivery',  value: 'Ships after purchase' },
                    { Icon: ClipboardList, label: 'SKU',       value: activeVariant?.sku ?? '—' },
                    { Icon: CheckCircle,   label: 'Status',    value: product.status },
                  ].map(row => (
                    <div key={row.label} className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-lg bg-brand-pale-orange flex items-center justify-center flex-shrink-0">
                        <row.Icon size={15} className="text-brand-orange" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[12px] text-charcoal mb-[2px]">{row.label}</div>
                        <div className="text-[11px] text-[#8C8A82] break-words leading-[1.55]">{row.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="h-px bg-bone" />

                {/* Share */}
                <div className="px-6 py-[14px] flex items-center gap-2">
                  <span className="text-[12px] text-[#8C8A82] flex-1">Share this listing</span>
                  {[Link2, Mail, Smartphone].map((Icon, i) => (
                    <button key={i} className="w-[30px] h-[30px] rounded-lg bg-cream border border-bone cursor-pointer flex items-center justify-center text-[#8C8A82]">
                      <Icon size={14} />
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Thumbnail helper ──────────────────────────────────────────────────────────
function ThumbImage({ src, active, onClick }: { src: string; active: boolean; onClick: () => void }) {
  const [errored, setErrored] = useState(false);
  return (
    <div
      onClick={onClick}
      className="w-[70px] h-[70px] rounded-[10px] overflow-hidden cursor-pointer bg-brand-pale-orange flex items-center justify-center"
      style={{ border: `2px solid ${active ? '#D97757' : 'transparent'}` }}
    >
      {!errored && src
        ? <img src={src} alt="" onError={() => setErrored(true)} className="w-full h-full object-cover" />
        : <ImageOff size={20} className="text-brand-orange opacity-50" />
      }
    </div>
  );
}
