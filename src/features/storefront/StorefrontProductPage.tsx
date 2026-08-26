import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { Star, Minus, Plus, ShoppingCart, ImageOff, Loader2, CheckCircle2 } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useProductById } from '@/hooks/marketplace/useProductById';
import { useCartContext } from '@/contexts/CartContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { currencySymbol, fmt2 } from '@/utils/currency';
import type { ProductVariant } from '@/api/services/marketplace';
import { useStorefront } from './StorefrontContext';
import { ThemedButton } from './ThemedButton';
import { ProductReviewsSection } from '@/features/buyer/pages/ProductReviews';
import { apiGetPublicCollectionTemplate } from '@/api/services/collectionTemplate';
import { SectionRenderer } from './SectionRenderer';
import type { Section } from '@/api/services/storefrontTypes';

function Gallery({ images, name }: { images: string[]; name: string }) {
  const [selected, setSelected] = useState(0);
  const [errored, setErrored] = useState<Record<number, boolean>>({});
  const src = images[selected];

  return (
    <div className="flex flex-col gap-3 min-w-0">
      <div className="relative w-full h-[320px] md:h-[420px] rounded-2xl overflow-hidden border border-bone bg-white flex items-center justify-center">
        {src && !errored[selected]
          ? <img src={src} alt={name} className="w-full h-full object-contain" onError={() => setErrored(e => ({ ...e, [selected]: true }))} />
          : <ImageOff size={40} className="text-bone" />}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button key={i} type="button" onClick={() => setSelected(i)}
              className={clsx('w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 bg-white cursor-pointer', selected === i ? 'border-brand-orange' : 'border-bone opacity-70 hover:opacity-100')}>
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function VariantSelector({ variants, selected, onSelect, textColor, primaryColor }: {
  variants: ProductVariant[]; selected: ProductVariant | null; onSelect: (v: ProductVariant) => void;
  textColor: string; primaryColor: string;
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
    <div className="flex flex-col gap-3 mb-4">
      {attributeNames.map(name => {
        const values = Array.from(new Set(variants.map(v => valueOf(v, name)).filter((x): x is string => !!x)));
        return (
          <div key={name}>
            <p className="text-[12px] font-semibold mb-[6px]" style={{ color: textColor }}>
              {name}: <span className="font-normal opacity-70">{valueOf(selected, name) ?? '—'}</span>
            </p>
            <div className="flex flex-wrap gap-[6px]">
              {values.map(val => {
                const active = valueOf(selected, name) === val;
                return (
                  <button key={val} type="button" onClick={() => pickVariant(name, val)}
                    className="px-[10px] py-1 rounded-[6px] text-[12px] cursor-pointer border-[1.5px]"
                    style={active ? { borderColor: primaryColor, background: `${primaryColor}14`, color: primaryColor, fontWeight: 600 } : { borderColor: '#e8e6dc', background: '#fff', color: textColor }}>
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

export function StorefrontProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { cfg, store } = useStorefront();
  const { detail, loading, error } = useProductById(slug ?? '');
  const { addToCart, adding } = useCartContext();
  const { currency: displayCurrency, convert } = useCurrencyPreference();
  const displaySymbol = currencySymbol(displayCurrency);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [qty, setQty] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);
  // The Product Template's own surrounding-sections composition (recommendations,
  // rich text, etc.) — a real theme template, per the Product Template
  // architecture. Never includes the commerce-critical core above (gallery/
  // variant/qty/add-to-cart) — that stays fixed chrome outside this system,
  // per the same architectural boundary Home/Collection sections follow.
  const [templateSections, setTemplateSections] = useState<Section[]>([]);

  const product = detail?.product ?? null;
  usePageTitle(product?.name ?? 'Product');

  useEffect(() => {
    if (!store?.storeId) return;
    apiGetPublicCollectionTemplate(store.storeId, 'product', product?.templateKey ?? 'default')
      .then((res) => setTemplateSections(res.data.sections ?? []))
      .catch(() => setTemplateSections([]));
  }, [store?.storeId, product?.templateKey]);

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
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-10 py-8">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">
          <div className="w-full h-[320px] md:h-[420px] rounded-2xl bg-cream animate-pulse" />
          <div className="flex flex-col gap-3">
            <div className="w-3/4 h-6 rounded bg-cream animate-pulse" />
            <div className="w-1/3 h-8 rounded bg-cream animate-pulse mt-2" />
            <div className="w-full h-11 rounded-lg bg-cream animate-pulse mt-3" />
            <div className="w-full h-11 rounded-lg bg-cream animate-pulse" />
            <div className="w-full h-4 rounded bg-cream animate-pulse mt-3" />
            <div className="w-2/3 h-4 rounded bg-cream animate-pulse" />
          </div>
        </div>
      </div>
    );
  }
  if (error || !product) {
    return <div className="px-4 sm:px-6 lg:px-10 py-16 text-center text-[13px] text-slate">This product isn't available.</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8" style={{ fontFamily: `${cfg.font}, sans-serif` }}>
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">
        <Gallery images={allImages} name={product.name} />

        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-bold" style={{ color: cfg.textColor }}>{product.name}</h1>
          {product.averageRating > 0 && (
            <div className="flex items-center gap-1 text-[12.5px] mb-1" style={{ color: cfg.textColor }}>
              <Star size={13} className="fill-current" style={{ color: cfg.primaryColor }} />
              {product.averageRating.toFixed(1)} <span className="opacity-60">({product.totalRatings ?? 0} reviews)</span>
            </div>
          )}

          <div className="flex items-baseline gap-2 my-2">
            <span className="text-[26px] font-bold" style={{ color: cfg.textColor }}>{displaySymbol}{displayPrice != null ? fmt2(displayPrice) : ''}</span>
            {displayCompareAt != null && (
              <>
                <span className="text-[15px] line-through opacity-50" style={{ color: cfg.textColor }}>{displaySymbol}{fmt2(displayCompareAt)}</span>
                {pctOff != null && <span className="text-[12px] font-bold px-2 py-[2px] rounded-full" style={{ background: `${cfg.primaryColor}18`, color: cfg.primaryColor }}>-{pctOff}%</span>}
              </>
            )}
          </div>

          <VariantSelector variants={variants} selected={activeVariant} onSelect={setSelectedVariant} textColor={cfg.textColor} primaryColor={cfg.primaryColor} />

          {!isDigital && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center border rounded-lg" style={{ borderColor: '#e8e6dc' }}>
                <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer"><Minus size={14} /></button>
                <span className="w-10 text-center text-[13px] font-semibold" style={{ color: cfg.textColor }}>{qty}</span>
                <button type="button" onClick={() => setQty(q => Math.min(stock, q + 1))} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer"><Plus size={14} /></button>
              </div>
              <span className="text-[12px]" style={{ color: cfg.textColor, opacity: 0.7 }}>{stock > 0 ? `${stock} in stock` : 'Out of stock'}</span>
            </div>
          )}

          <ThemedButton size="lg" className="w-full text-center flex items-center justify-center gap-2" onClick={handleAddToCart}>
            {adding ? <Loader2 size={16} className="animate-spin" /> : addedFeedback ? <CheckCircle2 size={16} /> : <ShoppingCart size={16} />}
            {addedFeedback ? 'Added to Cart' : stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
          </ThemedButton>

          {product.description && (
            <div className="mt-6 pt-6 border-t border-bone">
              <p className="text-[13px] font-bold mb-2" style={{ color: cfg.textColor }}>Description</p>
              <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: cfg.textColor, opacity: 0.85 }}>{product.description}</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto mt-10">
        <ProductReviewsSection productId={product._id} />
      </div>

      {templateSections.length > 0 && (
        <div className="mt-10 -mx-4 sm:-mx-6 lg:-mx-10">
          <SectionRenderer sections={templateSections} />
        </div>
      )}
    </div>
  );
}
