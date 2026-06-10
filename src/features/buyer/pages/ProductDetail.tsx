import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useProductById } from '@/hooks/marketplace/useProductById';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import {
  ArrowRight, ArrowLeft, Package, Download, ClipboardList, CheckCircle,
  Search, ShoppingCart, Star, Link2, Mail, Smartphone, ImageOff,
} from 'lucide-react';
import type { ProductVariant } from '@/api/commerce/marketplace';

const C = {
  orange: '#D97757', deepOrange: '#B95A3A', paleOrange: '#FBECE4',
  carbon: '#141413', charcoal: '#2C2A28', slate: '#8C8A82',
  bone: '#E8E6DC', cream: '#FAF9F5', white: '#FFFFFF',
  success: '#2D8A4E', successBg: '#EBF7EF',
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
function DetailSkeleton() {
  const box = (w: string | number, h: number, r = 6) => (
    <div className="animate-pulse" style={{ width: w, height: h, borderRadius: r, background: '#E8E6DC' }} />
  );
  return (
    <div style={{ padding: '28px 40px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[80, 20, 60, 20, 120].map((w, i) => (
          <div key={i} className="animate-pulse" style={{ width: w, height: 13, borderRadius: 4, background: '#E8E6DC' }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 36, alignItems: 'start' }}>
        {/* Left */}
        <div>
          <div className="animate-pulse" style={{ height: 340, borderRadius: 16, background: '#E8E6DC', marginBottom: 16 }} />
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            {[1,2,3,4].map(i => (
              <div key={i} className="animate-pulse" style={{ width: 70, height: 70, borderRadius: 10, background: '#E8E6DC' }} />
            ))}
          </div>
          {box('40%', 18, 6)}
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[100, 95, 90, 80].map((w, i) => (
              <div key={i} className="animate-pulse" style={{ height: 12, borderRadius: 4, background: '#E8E6DC', width: `${w}%` }} />
            ))}
          </div>
        </div>
        {/* Right */}
        <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.bone}`, padding: 24 }}>
          {box(60, 20, 4)}
          <div style={{ marginTop: 12 }}>{box('80%', 24, 6)}</div>
          <div style={{ marginTop: 8 }}>{box('50%', 13, 4)}</div>
          <div style={{ marginTop: 16 }}>{box(80, 36, 8)}</div>
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
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
      <div style={{
        height: 340, borderRadius: 16,
        background: 'linear-gradient(135deg, #FBECE4, #FFF5EE)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 8, marginBottom: 16,
      }}>
        <ImageOff size={60} style={{ color: '#D97757', opacity: 0.5 }} />
        <span style={{ fontSize: 12, color: C.slate }}>{name}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setErrored(true)}
      style={{
        height: 340, width: '100%', objectFit: 'cover',
        borderRadius: 16, display: 'block', marginBottom: 16,
      }}
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
    <div style={{ marginBottom: 16 }}>
      {variants.some(v => v.color) && (
        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.charcoal, marginBottom: 6 }}>
            Color: <span style={{ fontWeight: 400, color: C.slate }}>{selected?.color ?? '—'}</span>
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {variants.map(v => (
              <button
                key={v._id}
                onClick={() => onSelect(v)}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  border: `1.5px solid ${selected?._id === v._id ? C.orange : C.bone}`,
                  background: selected?._id === v._id ? C.paleOrange : C.white,
                  color: selected?._id === v._id ? C.deepOrange : C.charcoal,
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
          <p style={{ fontSize: 12, fontWeight: 600, color: C.charcoal, marginBottom: 6 }}>
            Size: <span style={{ fontWeight: 400, color: C.slate }}>{selected?.size ?? '—'}</span>
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {variants.map(v => (
              <button
                key={v._id}
                onClick={() => onSelect(v)}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  border: `1.5px solid ${selected?._id === v._id ? C.orange : C.bone}`,
                  background: selected?._id === v._id ? C.paleOrange : C.white,
                  color: selected?._id === v._id ? C.deepOrange : C.charcoal,
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

  const [selectedImgIdx, setSelectedImgIdx] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

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
    <div style={{ minHeight: '100vh', backgroundColor: C.cream }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: C.white, borderBottom: `1px solid ${C.bone}`,
        height: 60, display: 'flex', alignItems: 'center',
        paddingLeft: 40, paddingRight: 40,
      }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          <SolvexoIcon size={28} />
          <span style={{ fontWeight: 700, fontSize: 15, color: C.carbon }}>Solvex</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: C.orange }}>o</span>
        </div>
        <div style={{ width: 440, position: 'relative', flexShrink: 0 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.slate, pointerEvents: 'none', display: 'flex' }}>
            <Search size={14} />
          </span>
          <input
            placeholder="Search..."
            style={{
              width: '100%', paddingLeft: 36, paddingRight: 14, paddingTop: 9, paddingBottom: 9,
              borderRadius: 20, border: `1px solid ${C.bone}`, backgroundColor: C.cream,
              fontSize: 13, color: C.charcoal, outline: 'none', fontFamily: "'Poppins', sans-serif",
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/marketplace')}>
            <ArrowLeft size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Marketplace
          </Button>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            backgroundColor: C.orange, display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <ShoppingCart size={16} style={{ color: '#fff' }} />
          </div>
        </div>
      </nav>

      {/* Loading */}
      {loading && <DetailSkeleton />}

      {/* Error */}
      {!loading && error && (
        <div style={{ padding: '60px 40px', textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: '#C13030', marginBottom: 16 }}>{error}</p>
          <Button variant="secondary" onClick={() => navigate('/marketplace')}>Back to Marketplace</Button>
        </div>
      )}

      {/* Content */}
      {!loading && product && (
        <div style={{ padding: '28px 40px' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13 }}>
            <span style={{ color: C.slate, cursor: 'pointer' }} onClick={() => navigate('/marketplace')}>Marketplace</span>
            <span style={{ color: C.slate }}>/</span>
            <span style={{ color: C.charcoal, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
              {product.name}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 36, alignItems: 'start', minWidth: 0 }}>
            {/* LEFT */}
            <div style={{ minWidth: 0 }}>
              <ProductImage images={allImages} name={product.name} selected={selectedImgIdx} />

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
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
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.carbon, marginBottom: 12 }}>About This Product</h2>
              <p style={{ fontSize: 13, color: C.slate, lineHeight: 1.8, marginBottom: 16 }}>
                {product.description || 'No description available.'}
              </p>

              {/* Info chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                {product.slug && (
                  <span style={{ background: C.paleOrange, color: C.deepOrange, fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 6, border: `1px solid ${C.bone}` }}>
                    /{product.slug}
                  </span>
                )}
                {activeVariant?.sku && (
                  <span style={{ background: C.cream, color: C.slate, fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 6, border: `1px solid ${C.bone}` }}>
                    SKU: {activeVariant.sku}
                  </span>
                )}
                {(activeVariant?.stock ?? 0) > 0 && (
                  <span style={{ background: '#EBF7EF', color: C.success, fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 6, border: `1px solid #A7F3D0` }}>
                    {activeVariant!.stock} in stock
                  </span>
                )}
              </div>

              <div style={{ height: 1, backgroundColor: C.bone, margin: '16px 0' }} />

              {/* Seller */}
              <div style={{ fontSize: 15, fontWeight: 700, color: C.carbon, marginBottom: 14 }}>About the Seller</div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  backgroundColor: C.successBg, color: C.success,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 16, flexShrink: 0,
                  fontFamily: "'Poppins', sans-serif",
                }}>
                  {sellerInitials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.carbon, marginBottom: 4 }}>
                    {product.sellerName ?? 'Unknown Seller'}
                  </div>
                  <p style={{ fontSize: 12, color: C.slate, lineHeight: 1.6, marginBottom: 10 }}>
                    Independent seller on Solvexo marketplace.
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/store/${product.slug}`)}>
                    View Store <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
                  </Button>
                </div>
              </div>

              <div style={{ height: 1, backgroundColor: C.bone, margin: '16px 0' }} />

              {/* Reviews placeholder */}
              <div style={{ fontSize: 15, fontWeight: 700, color: C.carbon, marginBottom: 12 }}>
                Reviews ({product.totalRatings})
              </div>
              {product.totalRatings === 0 && (
                <p style={{ fontSize: 13, color: C.slate }}>No reviews yet. Be the first to buy!</p>
              )}
            </div>

            {/* RIGHT: sticky purchase card */}
            <div style={{ position: 'sticky', top: 80, minWidth: 0 }}>
              <Card padding="none">
                <div style={{ padding: '24px 24px 0' }}>
                  <Badge color="orange">Physical</Badge>
                  <h1 style={{
                    fontFamily: "'Lora', Georgia, serif", fontSize: 21, fontWeight: 700,
                    color: C.carbon, marginTop: 12, marginBottom: 6, lineHeight: 1.35,
                    wordBreak: 'break-word',
                  }}>
                    {product.name}
                  </h1>
                  <p style={{ fontSize: 12, color: C.slate, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    {product.sellerName && <>by {product.sellerName}</>}
                    {product.averageRating > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        • <Star size={11} style={{ color: '#D97757', fill: '#D97757' }} />
                        {product.averageRating.toFixed(1)} ({product.totalRatings} reviews)
                      </span>
                    )}
                  </p>

                  {/* Price */}
                  <div style={{ fontSize: 32, fontWeight: 800, color: C.carbon, marginBottom: 4, letterSpacing: '-0.5px' }}>
                    {activeVariant ? `$${activeVariant.price.toLocaleString()}` : '—'}
                  </div>
                  <div style={{ fontSize: 12, color: C.success, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 5 }}>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                    <Button variant="primary" size="lg" fullWidth style={{ justifyContent: 'center' }}>
                      Buy Now <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 6 }} />
                      {activeVariant ? ` $${activeVariant.price.toLocaleString()}` : ''}
                    </Button>
                    <Button variant="secondary" size="md" fullWidth style={{ justifyContent: 'center' }}>
                      Add to Cart
                    </Button>
                  </div>
                </div>

                <div style={{ height: 1, backgroundColor: C.bone }} />

                {/* Info rows */}
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { Icon: Package,       label: "Seller",    value: product.sellerName ?? 'Unknown' },
                    { Icon: Download,      label: 'Delivery',  value: 'Ships after purchase' },
                    { Icon: ClipboardList, label: 'SKU',       value: activeVariant?.sku ?? '—' },
                    { Icon: CheckCircle,   label: 'Status',    value: product.status },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        backgroundColor: C.paleOrange, display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <row.Icon size={15} style={{ color: '#D97757' }} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 12, color: C.charcoal, marginBottom: 2 }}>{row.label}</div>
                        <div style={{ fontSize: 11, color: C.slate, overflowWrap: 'break-word', lineHeight: 1.55 }}>{row.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ height: 1, backgroundColor: C.bone }} />

                {/* Share */}
                <div style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: C.slate, flex: 1 }}>Share this listing</span>
                  {[Link2, Mail, Smartphone].map((Icon, i) => (
                    <button key={i} style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: C.cream, border: `1px solid ${C.bone}`,
                      cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: C.slate,
                    }}>
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
      style={{
        width: 70, height: 70, borderRadius: 10, overflow: 'hidden',
        border: `2px solid ${active ? C.orange : 'transparent'}`,
        cursor: 'pointer', background: C.paleOrange,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {!errored && src
        ? <img src={src} alt="" onError={() => setErrored(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <ImageOff size={20} style={{ color: '#D97757', opacity: 0.5 }} />
      }
    </div>
  );
}
