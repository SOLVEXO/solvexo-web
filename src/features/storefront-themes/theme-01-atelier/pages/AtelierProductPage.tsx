import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ImageOff, Minus, Plus, CheckCircle2, Star } from 'lucide-react';
import { useProductById } from '@/hooks/marketplace/useProductById';
import { useCartContext } from '@/contexts/CartContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { currencySymbol, fmt2 } from '@/utils/currency';
import type { ProductVariant } from '@/api/services/marketplace';
import { ProductReviewsSection } from '@/features/buyer/pages/ProductReviews';
import { apiGetPublicCollectionTemplate } from '@/api/services/collectionTemplate';
import { apiGetPublicMetafieldValues } from '@/api/services/metafields';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import type { Section } from '@/api/services/storefrontTypes';
import { AtelierSectionRenderer } from '../sections';
import { AtelierButton } from '../components/AtelierButton';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { cloudinaryUrl, cloudinarySrcSet } from '@/utils/cloudinaryImage';
import { atelierTheme as t } from '../theme.config';

function Gallery({ images, name }: { images: string[]; name: string }) {
  const [selected, setSelected] = useState(0);
  const [errored, setErrored] = useState<Record<number, boolean>>({});
  const src = images[selected];

  return (
    <div className="flex flex-col gap-3 min-w-0">
      <div
        className="relative w-full flex items-center justify-center"
        style={{ aspectRatio: '3/4', background: t.colors.bgAlt }}
      >
        {src && !errored[selected]
          ? (
            <img
              src={cloudinaryUrl(src, 900)}
              srcSet={cloudinarySrcSet(src, [640, 900, 1200])}
              sizes="(min-width: 1024px) 50vw, 100vw"
              alt={name}
              className="w-full h-full object-cover"
              onError={() => setErrored(e => ({ ...e, [selected]: true }))}
            />
          )
          : <ImageOff size={36} style={{ color: t.colors.inkMuted }} />}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              className="w-16 h-16 shrink-0 cursor-pointer border-0"
              style={{ outline: selected === i ? `2px solid ${t.colors.ink}` : `1px solid ${t.colors.border}`, outlineOffset: '-1px' }}
            >
              <img src={cloudinaryUrl(img, 128)} alt="" className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function VariantSelector({ variants, selected, onSelect }: {
  variants: ProductVariant[]; selected: ProductVariant | null; onSelect: (v: ProductVariant) => void;
}) {
  const attributeNames = Array.from(new Set(variants.flatMap(v => (v.options ?? []).map(o => o.name))));
  if (!attributeNames.length) return null;
  const valueOf = (v: ProductVariant | null, name: string) => v?.options?.find(o => o.name === name)?.value;

  const pickVariant = (name: string, value: string) => {
    const match =
      variants.find(v => valueOf(v, name) === value && attributeNames.every(n => n === name || valueOf(v, n) === valueOf(selected, n))) ??
      variants.find(v => valueOf(v, name) === value);
    if (match) onSelect(match);
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      {attributeNames.map(name => {
        const values = Array.from(new Set(variants.map(v => valueOf(v, name)).filter((x): x is string => !!x)));
        return (
          <div key={name}>
            <p style={{ fontFamily: t.fonts.body, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: t.colors.inkMuted, marginBottom: '8px' }}>
              {name} — <span style={{ color: t.colors.ink }}>{valueOf(selected, name) ?? '—'}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {values.map(val => {
                const active = valueOf(selected, name) === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => pickVariant(name, val)}
                    className="cursor-pointer"
                    style={{
                      fontFamily: t.fonts.body, fontSize: '12.5px', padding: '8px 14px',
                      border: `1px solid ${active ? t.colors.ink : t.colors.border}`,
                      background: active ? t.colors.ink : 'transparent',
                      color: active ? '#FFFFFF' : t.colors.ink,
                    }}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12" style={{ maxWidth: t.layout.maxWidth, padding: `48px ${t.layout.containerPadX}` }}>
      <div className="animate-pulse" style={{ aspectRatio: '3/4', background: t.colors.bgAlt }} />
      <div className="flex flex-col gap-3">
        <div className="animate-pulse h-7 w-3/4" style={{ background: t.colors.bgAlt }} />
        <div className="animate-pulse h-5 w-1/4 mt-2" style={{ background: t.colors.bgAlt }} />
        <div className="animate-pulse h-11 w-full mt-4" style={{ background: t.colors.bgAlt }} />
      </div>
    </div>
  );
}

export function AtelierProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { store } = useStorefront();
  const { detail, loading, error } = useProductById(slug ?? '');
  const { addToCart, updateQty, adding } = useCartContext();
  const { currency: displayCurrency, convert } = useCurrencyPreference();
  const symbol = currencySymbol(displayCurrency);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [qty, setQty] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [templateSections, setTemplateSections] = useState<Section[]>([]);
  // Dynamic Sources — this product's own real metafield values, keyed
  // `"namespace:key"` for O(1) lookup by `RichTextSection`'s `paragraph`
  // block. See `atelierSectionRenderer.tsx`'s `SectionRenderFn` doc comment.
  const [dynamicSourceValues, setDynamicSourceValues] = useState<Record<string, string>>({});

  const product = detail?.product ?? null;
  useStorefrontSeo({
    title: product?.name,
    description: product?.description || undefined,
    image: product?.images?.[0] || undefined,
  });

  // Everything above/around this — gallery, variant selection, quantity,
  // add-to-cart, reviews — is commerce-critical CORE, fixed chrome outside
  // the section system (same boundary the legacy engine always kept). Only
  // the SURROUNDING content (below the reviews) is theme/template-driven,
  // via the store's own real "product" alternate-template document — the
  // exact same backend `collection-template` infra Product/Collection
  // Template editing already uses elsewhere in this app.
  useEffect(() => {
    if (!product) return;
    apiGetPublicCollectionTemplate(store.storeId, 'product', product.templateKey || 'default')
      .then(res => setTemplateSections(res.data.sections ?? []))
      .catch(() => setTemplateSections([]));
  }, [store.storeId, product?.templateKey, product?._id]);

  useEffect(() => {
    if (!product) return;
    apiGetPublicMetafieldValues(store.storeId, 'product', product._id)
      .then(res => setDynamicSourceValues(Object.fromEntries(res.data.map(v => [`${v.namespace}:${v.key}`, v.value]))))
      .catch(() => setDynamicSourceValues({}));
  }, [store.storeId, product?._id]);

  useEffect(() => {
    if (product && product.slug && product.slug !== slug) {
      navigate(`/product/${product.slug}`, { replace: true });
    }
  }, [product, slug, navigate]);

  const variants = detail?.variants ?? [];
  const activeVariant = selectedVariant ?? detail?.defaultVariant ?? null;
  const allImages = [...(product?.images ?? []), ...(activeVariant?.images ?? [])].filter((v, i, a) => a.indexOf(v) === i);
  const pType = product?.productType ?? product?.type ?? 'physical';
  const isDigital = pType !== 'physical';
  const stock = isDigital || activeVariant?.unlimitedStock ? Infinity : (activeVariant?.stock ?? 0);
  const pctOff = activeVariant?.compareAtPrice != null && activeVariant.compareAtPrice > activeVariant.price
    ? Math.round((1 - activeVariant.price / activeVariant.compareAtPrice) * 100) : null;
  const displayPrice = activeVariant ? convert(activeVariant.price, activeVariant.currency) : null;
  const displayCompareAt = activeVariant?.compareAtPrice != null ? convert(activeVariant.compareAtPrice, activeVariant.currency) : null;

  useEffect(() => { setQty(1); }, [activeVariant?._id]);

  const handleAddToCart = async () => {
    if (!product || !activeVariant) return;
    await addToCart(product._id, activeVariant._id, isDigital ? 'digital' : 'physical');
    // `addToCart` always adds exactly 1 unit (real shared CartContext/API
    // behavior, app-wide) — honor a higher selected quantity the same way
    // the Cart page's own stepper does, via sequential `updateQty` calls,
    // so this stepper is functional rather than cosmetic.
    for (let i = 1; i < qty; i++) {
      await updateQty(product._id, activeVariant._id, 'increase');
    }
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  if (loading) return <ProductSkeleton />;

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-center" style={{ padding: `80px ${t.layout.containerPadX}` }}>
        <p style={{ fontFamily: t.fonts.body, fontSize: '14px', color: t.colors.inkMuted }}>This product isn't available.</p>
        <Link to="/" className="no-underline" style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.accent }}>Back to shop</Link>
      </div>
    );
  }

  return (
    <main>
      <div className="mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12" style={{ maxWidth: t.layout.maxWidth, padding: `48px ${t.layout.containerPadX}` }}>
        <Gallery images={allImages} name={product.name} />

        <div className="flex flex-col">
          <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(26px, 3vw, 34px)', fontWeight: 600, color: t.colors.ink, lineHeight: 1.15 }}>
            {product.name}
          </h1>

          {product.averageRating > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <Star size={13} fill={t.colors.accent} color={t.colors.accent} />
              <span style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.inkMuted }}>
                {product.averageRating.toFixed(1)} ({product.totalRatings ?? 0} reviews)
              </span>
            </div>
          )}

          <div className="flex items-baseline gap-3 mt-4 mb-6">
            <span style={{ fontFamily: t.fonts.body, fontSize: '22px', color: t.colors.ink, fontWeight: 500 }}>
              {symbol}{displayPrice != null ? fmt2(displayPrice) : ''}
            </span>
            {displayCompareAt != null && (
              <>
                <span style={{ fontFamily: t.fonts.body, fontSize: '15px', color: t.colors.inkMuted, textDecoration: 'line-through' }}>
                  {symbol}{fmt2(displayCompareAt)}
                </span>
                {pctOff != null && (
                  <span style={{ fontFamily: t.fonts.body, fontSize: '11px', fontWeight: 600, color: t.colors.accent }}>−{pctOff}%</span>
                )}
              </>
            )}
          </div>

          <VariantSelector variants={variants} selected={activeVariant} onSelect={setSelectedVariant} />

          {!isDigital && (
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center" style={{ border: `1px solid ${t.colors.border}` }}>
                <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 flex items-center justify-center bg-transparent border-0 cursor-pointer" style={{ color: t.colors.ink }}>
                  <Minus size={13} />
                </button>
                <span style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.ink, width: '36px', textAlign: 'center' }}>{qty}</span>
                <button type="button" onClick={() => setQty(q => Math.min(stock === Infinity ? q + 1 : stock, q + 1))} className="w-9 h-9 flex items-center justify-center bg-transparent border-0 cursor-pointer" style={{ color: t.colors.ink }}>
                  <Plus size={13} />
                </button>
              </div>
              <span style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted }}>
                {stock > 0 ? `${stock === Infinity ? '' : stock + ' '}in stock` : 'Out of stock'}
              </span>
            </div>
          )}

          <AtelierButton
            disabled={stock <= 0}
            loading={adding === activeVariant?._id}
            onClick={handleAddToCart}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {addedFeedback ? <><CheckCircle2 size={14} /> Added to Cart</> : stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
          </AtelierButton>

          {product.description && (
            <div className="mt-8 pt-8" style={{ borderTop: `1px solid ${t.colors.border}` }}>
              <p style={{ fontFamily: t.fonts.body, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: t.colors.inkMuted, marginBottom: '10px' }}>Description</p>
              <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.ink, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{product.description}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth, padding: `0 ${t.layout.containerPadX} 48px` }}>
        <ProductReviewsSection productId={product._id} />
      </div>

      {templateSections.length > 0 && <AtelierSectionRenderer sections={templateSections} dynamicSourceValues={dynamicSourceValues} />}
    </main>
  );
}
