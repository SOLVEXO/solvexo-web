import { useState } from 'react';
import { clsx } from 'clsx';
import { useNavigate, useParams } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useProductById } from '@/hooks/marketplace/useProductById';
import { useCartContext } from '@/contexts/CartContext';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { Button } from '@/components/comman/ui/Button';
import { Badge } from '@/components/comman/ui/Badge';
import { Card } from '@/components/comman/ui/Card';
import { SkeletonBox } from '@/components/comman/ui/SkeletonBox';
import { BuyerNavbar, Breadcrumb, AppDownloadBanner, Footer, FloatingAppWidget } from '@/components/comman/ui';
import {
  ArrowRight, Package, Download, ClipboardList, CheckCircle,
  ShoppingCart, Star, Link2, Mail, Smartphone, ImageOff, Heart,
} from 'lucide-react';
import type { ProductVariant } from '@/api/services/marketplace';
import { ProductReviewsSection } from './ProductReviews';

// ── Skeleton ──────────────────────────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="px-4 md:px-6 lg:px-10 py-6 md:py-7">
      {/* Breadcrumb */}
      <div className="flex gap-2 mb-6">
        {[80, 20, 60, 20, 120].map((w, i) => (
          <SkeletonBox key={i} width={w} height={13} rounded="4px" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-9 items-start min-w-0">
        {/* Left */}
        <div>
          <SkeletonBox className="w-full h-[240px] md:h-[340px] lg:h-[400px] mb-4" rounded="16px" />
          <div className="flex gap-[10px] mb-6">
            {[1, 2, 3, 4].map(i => (
              <SkeletonBox key={i} width={70} height={70} rounded="10px" />
            ))}
          </div>
          <SkeletonBox width="40%" height={18} rounded="6px" />
          <div className="mt-3 flex flex-col gap-2">
            {[100, 95, 90, 80].map((w, i) => (
              <SkeletonBox key={i} width={`${w}%`} height={12} rounded="4px" />
            ))}
          </div>
        </div>
        {/* Right */}
        <div className="bg-white rounded-xl border border-bone shadow-xs p-6">
          <SkeletonBox width={60} height={20} rounded="4px" />
          <div className="mt-3"><SkeletonBox width="80%" height={24} rounded="6px" /></div>
          <div className="mt-2"><SkeletonBox width="50%" height={13} rounded="4px" /></div>
          <div className="mt-4"><SkeletonBox width={80} height={36} rounded="8px" /></div>
          <div className="mt-5 flex flex-col gap-[10px]">
            <SkeletonBox width="100%" height={44} rounded="10px" />
            <SkeletonBox width="100%" height={40} rounded="10px" />
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
      <div className="h-[240px] md:h-[340px] lg:h-[400px] rounded-2xl flex flex-col items-center justify-center gap-2 mb-4 bg-gradient-to-br from-[#FBECE4] to-[#FFF5EE]">
        <ImageOff size={60} className="text-brand-orange opacity-50" />
        <span className="text-[12px] text-slate">{name}</span>
      </div>
    );
  }

  return (
    <img loading="lazy" decoding="async"
      src={src}
      alt={name}
      onError={() => setErrored(true)}
      className="h-[240px] md:h-[340px] lg:h-[400px] w-full object-cover rounded-2xl block mb-4"
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
            Color: <span className="font-normal text-slate">{selected?.color ?? '—'}</span>
          </p>
          <div className="flex flex-wrap gap-[6px]">
            {variants.map(v => (
              <button
                key={v._id}
                onClick={() => onSelect(v)}
                className={clsx(
                  'px-[10px] py-1 rounded-[6px] text-[12px] cursor-pointer border-[1.5px]',
                  selected?._id === v._id
                    ? 'border-brand-orange bg-brand-pale-orange text-brand-deep-orange font-semibold'
                    : 'border-bone bg-white text-charcoal font-normal',
                )}
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
            Size: <span className="font-normal text-slate">{selected?.size ?? '—'}</span>
          </p>
          <div className="flex flex-wrap gap-[6px]">
            {variants.map(v => (
              <button
                key={v._id}
                onClick={() => onSelect(v)}
                className={clsx(
                  'px-[10px] py-1 rounded-[6px] text-[12px] cursor-pointer border-[1.5px]',
                  selected?._id === v._id
                    ? 'border-brand-orange bg-brand-pale-orange text-brand-deep-orange font-semibold'
                    : 'border-bone bg-white text-charcoal font-normal',
                )}
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

  const { detail, loading, error, refetch } = useProductById(id);
  const { addToCart, adding } = useCartContext();
  const { isWishlisted, wishlisting, toggleWishlist } = useWishlistContext();

  const [selectedImgIdx, setSelectedImgIdx] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const product = detail?.product ?? null;
  const variants = detail?.variants ?? [];
  const activeVariant = selectedVariant ?? detail?.defaultVariant ?? null;
  const allImages = [
    ...(product?.images ?? []),
    ...(activeVariant?.images ?? []),
  ].filter((v, i, a) => a.indexOf(v) === i); // deduplicate

  const sellerInitials = product?.sellerName
    ? product.sellerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="min-h-screen bg-cream">
      <BuyerNavbar contextLabel="Marketplace" backTo={{ label: 'Marketplace', path: '/marketplace' }} />

      {/* Loading */}
      {loading && <DetailSkeleton />}

      {/* Error */}
      {!loading && error && (
        <div className="px-4 md:px-10 py-[60px] text-center">
          <p className="text-[15px] text-error mb-4">{error}</p>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" onClick={refetch}>Try again</Button>
            <Button variant="secondary" onClick={() => navigate('/marketplace')}>Back to Marketplace</Button>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && product && (
        <div className="px-4 md:px-6 lg:px-10 py-6 md:py-8 pb-[92px] lg:pb-8">
          <Breadcrumb className="mb-4" items={[
            { label: 'Home', path: '/' },
            { label: 'Marketplace', path: '/marketplace' },
            { label: product.name },
          ]} />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-9 items-start min-w-0">
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
              <h2 className="text-[18px] font-bold text-carbon mb-3">About This Product</h2>
              <p className="text-[13px] text-slate leading-[1.8] mb-4">
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
                  <span className="bg-cream text-slate text-[11px] font-medium px-2 py-[3px] rounded-[6px] border border-bone">
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
              <div className="text-[15px] font-bold text-carbon mb-[14px]">
                About the Seller
              </div>

              <div className="flex items-center gap-[14px] mb-4">

                <div className="w-[52px] h-[52px] rounded-full bg-success-bg text-success flex items-center justify-center font-bold text-[16px] flex-shrink-0">
                  {sellerInitials}
                </div>

                <div className="flex-1 min-w-0">

                  <div className="flex items-center justify-between gap-3">

                    <div className="min-w-0">
                      <div className="text-[15px] font-bold text-carbon truncate">
                        {product.sellerName ?? 'Unknown Seller'}
                      </div>

                      <div className="flex items-center gap-1 mt-[3px]">
                        <Star size={12} className="text-brand-orange fill-brand-orange" />

                        <span className="text-[12px] font-semibold text-charcoal">
                          {product.averageRating?.toFixed(1) ?? '0.0'}
                        </span>

                        <span className="text-[12px] text-slate">
                          ({product.totalRatings ?? 0})
                        </span>
                      </div>
                    </div>


                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        product.storeSlug &&
                        navigate(`/store/${product.storeSlug}`)
                      }
                      disabled={!product.storeSlug}
                    >
                      View Store
                      <ArrowRight size={14} className="inline align-middle ml-1" />
                    </Button>

                  </div>


                  <p className="text-[12px] text-slate leading-[1.6] mt-1">
                    Independent seller on Solvexo marketplace.
                  </p>

                </div>

              </div>

              <div className="h-px bg-bone my-4" />

              {/* Reviews */}
              <ProductReviewsSection productId={product._id} storeName={product.sellerName} />
            </div>

            {/* RIGHT: sticky purchase card */}
            <div className="lg:sticky lg:top-20 min-w-0">
              <Card padding="none">
                <div className="px-6 pt-6 pb-0">
                  <Badge color="orange">Physical</Badge>
                  <h1 className="text-[21px] font-bold text-carbon mt-3 mb-[6px] leading-[1.35] break-words font-serif">
                    {product.name}
                  </h1>
                  <p className="text-[12px] text-slate mb-4 flex items-center gap-1 flex-wrap">
                    {product.sellerName && <>by {product.sellerName}</>}
                    {product.averageRating > 0 && (
                      <span className="flex items-center gap-[3px]">
                        • <Star size={11} className="text-brand-orange fill-brand-orange" />
                        {product.averageRating.toFixed(1)} ({product.totalRatings} reviews)
                      </span>
                    )}
                  </p>

                  {/* Price */}
                  <div className="text-[32px] font-extrabold text-carbon mb-1 tracking-[-0.5px]">
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
                      disabled={(activeVariant?.stock ?? 0) <= 0}
                      loading={adding === activeVariant?._id}
                      onClick={async () => {
                        if (!product || !activeVariant) return;
                        await addToCart(product._id, activeVariant._id, product.productType ?? product.type ?? 'physical');
                        navigate('/cart');
                      }}
                    >
                      {(activeVariant?.stock ?? 0) <= 0
                        ? 'Out of Stock'
                        : <>Buy Now <ArrowRight size={14} className="inline align-middle ml-[6px]" />{activeVariant ? ` $${activeVariant.price.toLocaleString()}` : ''}</>}
                    </Button>

                    <div className="flex gap-2">
                      <Button
                        variant="secondary" size="md" fullWidth
                        className="justify-center flex-1"
                        disabled={(activeVariant?.stock ?? 0) <= 0}
                        loading={adding === activeVariant?._id}
                        onClick={async () => {
                          if (!product || !activeVariant) return;
                          await addToCart(product._id, activeVariant._id, product.productType ?? product.type ?? 'physical');
                          setAddedFeedback(true);
                          setTimeout(() => setAddedFeedback(false), 2000);
                        }}
                      >
                        {(activeVariant?.stock ?? 0) <= 0
                          ? 'Out of Stock'
                          : addedFeedback
                            ? '✓ Added to Cart'
                            : 'Add to Cart'
                        }
                      </Button>

                      {/* Wishlist toggle button */}
                      {product && activeVariant && (() => {
                        const wishlisted = isWishlisted(product._id, activeVariant._id);
                        const busy = wishlisting === activeVariant._id;
                        return (
                          <button
                            onClick={() => toggleWishlist(product._id, activeVariant._id)}
                            disabled={busy}
                            title={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                            className={clsx(
                              'w-10 flex-shrink-0 rounded-[10px] flex items-center justify-center transition-all duration-150 border-[1.5px]',
                              wishlisted ? 'border-[#FECDD3] bg-[#FFF0F5]' : 'border-bone bg-white',
                              busy ? 'cursor-wait' : 'cursor-pointer',
                            )}
                          >
                            <Heart
                              size={16}
                              className={clsx(
                                'transition-[color,fill] duration-150',
                                wishlisted ? 'text-[#E11D48] fill-[#E11D48]' : 'text-slate fill-none',
                              )}
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
                    { Icon: Package, label: "Seller", value: product.sellerName ?? 'Unknown' },
                    { Icon: Download, label: 'Delivery', value: 'Ships after purchase' },
                    { Icon: ClipboardList, label: 'SKU', value: activeVariant?.sku ?? '—' },
                    { Icon: CheckCircle, label: 'Status', value: product.status },
                  ].map(row => (
                    <div key={row.label} className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-lg bg-brand-pale-orange flex items-center justify-center flex-shrink-0">
                        <row.Icon size={15} className="text-brand-orange" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[12px] text-charcoal mb-[2px]">{row.label}</div>
                        <div className="text-[11px] text-slate break-words leading-[1.55]">{row.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="h-px bg-bone" />

                {/* Share */}
                <div className="px-6 py-[14px] flex items-center gap-2">
                  <span className="text-[12px] text-slate flex-1">Share this listing</span>
                  {[Link2, Mail, Smartphone].map((Icon, i) => (
                    <button key={i} className="w-[30px] h-[30px] rounded-lg bg-cream border border-bone cursor-pointer flex items-center justify-center text-slate">
                      <Icon size={14} />
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {!loading && product && (
        <div className="pb-[76px] lg:pb-0">
          <div className="px-4 md:px-6 lg:px-10 pb-8">
            <AppDownloadBanner />
          </div>
          <Footer />
        </div>
      )}

      {/* Mobile sticky Add to Cart bar */}
      {!loading && product && activeVariant && (
        <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white border-t border-bone px-4 py-3 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-slate leading-none mb-[3px]">Price</p>
            <p className="text-[17px] font-extrabold text-carbon leading-none truncate">
              ${activeVariant.price.toLocaleString()}
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            className="justify-center flex-1 max-w-[220px]"
            disabled={(activeVariant.stock ?? 0) <= 0}
            loading={adding === activeVariant._id}
            onClick={async () => {
              await addToCart(product._id, activeVariant._id, product.productType ?? product.type ?? 'physical');
              setAddedFeedback(true);
              setTimeout(() => setAddedFeedback(false), 2000);
            }}
          >
            {(activeVariant.stock ?? 0) <= 0
              ? 'Out of Stock'
              : addedFeedback
                ? '✓ Added to Cart'
                : <><ShoppingCart size={14} /> Add to Cart</>
            }
          </Button>
        </div>
      )}

      <FloatingAppWidget mobileBottomClass="bottom-[150px]" />
    </div>
  );
}

// ── Thumbnail helper ──────────────────────────────────────────────────────────
function ThumbImage({ src, active, onClick }: { src: string; active: boolean; onClick: () => void }) {
  const [errored, setErrored] = useState(false);
  return (
    <div
      onClick={onClick}
      className={clsx(
        'w-[70px] h-[70px] rounded-[10px] overflow-hidden cursor-pointer bg-brand-pale-orange flex items-center justify-center border-2 shrink-0',
        'transition-[border-color,opacity,transform] duration-150 ease-out hover:-translate-y-[1px]',
        active ? 'border-brand-orange' : 'border-transparent opacity-70 hover:opacity-100',
      )}
    >
      {!errored && src
        ? <img loading="lazy" decoding="async" src={src} alt="" onError={() => setErrored(true)} className="w-full h-full object-cover" />
        : <ImageOff size={20} className="text-brand-orange opacity-50" />
      }
    </div>
  );
}
