import { useState, useEffect, Fragment, type ReactNode } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ImageOff, Minus, Plus, CheckCircle2, Star, Eye, Loader2 } from 'lucide-react';
import { useProductById } from '@/hooks/marketplace/useProductById';
import { useRecordProductView } from '@/hooks/marketplace/useRecordProductView';
import { useProductPreview } from '@/hooks/marketplace/useProductPreview';
import { useCartContext } from '@/contexts/CartContext';
import { Modal } from '@/components/comman/ui';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { currencySymbol, fmt2 } from '@/utils/currency';
import type { ProductVariant } from '@/api/services/marketplace';
import { ProductReviewsSection } from '@/features/buyer/pages/ProductReviews';
import { apiGetPublicCollectionTemplate } from '@/api/services/collectionTemplate';
import { apiGetPublicMetafieldValues } from '@/api/services/metafields';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import type { Section } from '@/api/services/storefrontTypes';
import { resolveProductMainLayout, splitProductTemplateSections, type ProductInfoBlock } from '../../productPageLayout';
import { ProductBuyNowButton, ProductCollapsibleTab, ProductSizeChart } from '../../ProductExtraBlocks';
import { recordRecentlyViewed } from '../../moreSections';
import { copyText } from '../../sectionCopy';
import { ProductPageContext } from '../../productContext';
import { ImageLightbox } from '../../ImageLightbox';
import { ProductWishlistButton, ProductShareButton, ProductSku, ProductSpecs, type PartTokens } from '../../ProductPageParts';
import type { MetafieldValueEntry } from '@/api/services/metafields';
import { AtelierSectionRenderer } from '../sections';
import { AtelierButton } from '../components/AtelierButton';
import { atelierInput } from '../components/atelierFormStyles';
import { useBackInStock } from '../../useBackInStock';
import { useCartDrawer } from '../../cartDrawerContext';
import { resolveQtyRules, clampQty, qtyRuleHint, preorderLabel } from '../../sellingRules';
import { variantAvailable, variantCanBuy, variantMaxQty, stockState, optionValueAvailable } from '../../variantAvailability';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { cloudinaryUrl, cloudinarySrcSet } from '@/utils/cloudinaryImage';
import { atelierTheme as t } from '../theme.config';

function Gallery({ images, name }: { images: string[]; name: string }) {
  const [selected, setSelected] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [errored, setErrored] = useState<Record<number, boolean>>({});
  const src = images[selected];
  const ratio = {
    square: '1 / 1',
    portrait: '3 / 4',
    landscape: '4 / 3',
    adapt: undefined,
  }[t.productImageRatio];

  return (
    <div className="flex flex-col gap-3 min-w-0">
      <div
        className="relative w-full flex items-center justify-center"
        role={src && !errored[selected] ? 'button' : undefined}
        tabIndex={src && !errored[selected] ? 0 : undefined}
        aria-label={src && !errored[selected] ? 'Enlarge photo' : undefined}
        onClick={() => { if (src && !errored[selected]) setZoomed(true); }}
        onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && src && !errored[selected]) { e.preventDefault(); setZoomed(true); } }}
        style={{ cursor: src && !errored[selected] ? 'zoom-in' : undefined, aspectRatio: ratio ?? (src && !errored[selected] ? 'auto' : '3 / 4'), background: t.colors.bgAlt, borderRadius: t.imageRadiusPx, overflow: 'hidden' }}
      >
        {src && !errored[selected]
          ? (
            <img
              src={cloudinaryUrl(src, 900)}
              srcSet={cloudinarySrcSet(src, [640, 900, 1200])}
              sizes="(min-width: 1024px) 50vw, 100vw"
              alt={name}
              className={ratio ? 'w-full h-full object-cover' : 'w-full h-auto object-cover'}
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
              style={{ borderRadius: t.imageRadiusPx, overflow: 'hidden', outline: selected === i ? `2px solid ${t.colors.ink}` : `1px solid ${t.colors.border}`, outlineOffset: '-1px' }}
            >
              <img src={cloudinaryUrl(img, 128)} alt="" className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      {zoomed && <ImageLightbox images={images} index={selected} alt={name} onIndexChange={setSelected} onClose={() => setZoomed(false)} />}
    </div>
  );
}

function VariantSelector({ variants, selected, onSelect, isDigital, pickerStyle = 'pills' }: {
  variants: ProductVariant[]; selected: ProductVariant | null; onSelect: (v: ProductVariant) => void; isDigital: boolean;
  /** Seller's choice on the Variant picker block: buttons (pills) or a dropdown. */
  pickerStyle?: 'pills' | 'dropdown';
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
    <div className="flex flex-col gap-4">
      {attributeNames.map(name => {
        const values = Array.from(new Set(variants.map(v => valueOf(v, name)).filter((x): x is string => !!x)));
        if (pickerStyle === 'dropdown') {
          const selectId = `variant-${name.replace(/\W+/g, '-')}`;
          return (
            <div key={name} className="flex flex-col gap-2">
              <label htmlFor={selectId} style={{ fontFamily: t.fonts.body, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: t.colors.inkMuted }}>{name}</label>
              <select id={selectId} value={valueOf(selected, name) ?? ''} onChange={e => pickVariant(name, e.target.value)}
                className="cursor-pointer"
                style={{ fontFamily: t.fonts.body, fontSize: '13px', padding: '10px 12px', border: `1px solid ${t.colors.border}`, background: t.colors.bg, color: t.colors.ink, borderRadius: t.radius?.sm ?? 0 }}>
                {values.map(val => (
                  <option key={val} value={val}>{val}{optionValueAvailable(variants, selected, name, val, isDigital) ? '' : ' — sold out'}</option>
                ))}
              </select>
            </div>
          );
        }
        return (
          <div key={name}>
            <p style={{ fontFamily: t.fonts.body, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: t.colors.inkMuted, marginBottom: '8px' }}>
              {name} — <span style={{ color: t.colors.ink }}>{valueOf(selected, name) ?? '—'}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {values.map(val => {
                const active = valueOf(selected, name) === val;
                // Dawn: unavailable combinations stay selectable but are dimmed + struck through.
                const unavailable = !optionValueAvailable(variants, selected, name, val, isDigital);
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => pickVariant(name, val)}
                    aria-pressed={active}
                    title={unavailable ? `${val} — sold out or unavailable` : undefined}
                    className="cursor-pointer"
                    style={{
                      opacity: unavailable && !active ? 0.45 : 1,
                      textDecoration: unavailable ? 'line-through' : 'none',
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
  const { currency: displayCurrency, convert, ratesLoaded } = useCurrencyPreference();
  const symbol = currencySymbol(displayCurrency);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [rawQty, setQty] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { data: previewData, loading: previewLoading, error: previewError, load: loadPreview, reset: resetPreview } = useProductPreview(slug ?? '');
  const [templateSections, setTemplateSections] = useState<Section[]>([]);
  // Dynamic Sources — this product's own real metafield values, keyed
  // `"namespace:key"` for O(1) lookup by `RichTextSection`'s `paragraph`
  // block. See `atelierSectionRenderer.tsx`'s `SectionRenderFn` doc comment.
  const [dynamicSourceValues, setDynamicSourceValues] = useState<Record<string, string>>({});
  // The same values with their field names — the Specifications block lists these.
  const [metafieldEntries, setMetafieldEntries] = useState<MetafieldValueEntry[]>([]);

  const product = detail?.product ?? null;
  useRecordProductView(product?._id);
  useStorefrontSeo({
    entityType: 'product',
    entityId: product?._id,
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
  //
  // Phase 4: the template now also always carries a real, LOCKED
  // `product_main` section (seeded server-side — see
  // `collection-template/core-sections.util.ts`) purely so the Customize
  // editor's section list/preview shows this fixed content instead of
  // looking blank. It is NOT re-rendered here via the generic section
  // renderer (that would duplicate this exact markup on the real page) —
  // instead, `resolveProductMainLayout` reads its 7 blocks' real `enabled` flags and order so a
  // merchant hiding one of them (e.g. Quantity) in the editor has a real
  // effect here, not a no-op. A store whose published template predates
  // this (no `product_main` entry at all) resolves every block to "on",
  // byte-identical to before this existed.
  useEffect(() => {
    if (!product) return;
    apiGetPublicCollectionTemplate(store.storeId, 'product', product.templateKey || 'default')
      .then(res => setTemplateSections(res.data.sections ?? []))
      .catch(() => setTemplateSections([]));
  }, [store.storeId, product?.templateKey, product?._id]);

  useEffect(() => {
    if (!product) return;
    apiGetPublicMetafieldValues(store.storeId, 'product', product._id)
      .then(res => { setDynamicSourceValues(Object.fromEntries(res.data.map(v => [`${v.namespace}:${v.key}`, v.value]))); setMetafieldEntries(res.data); })
      .catch(() => { setDynamicSourceValues({}); setMetafieldEntries([]); });
  }, [store.storeId, product?._id]);

  useEffect(() => {
    if (product && product.slug && product.slug !== slug) {
      navigate(`/product/${product.slug}`, { replace: true });
    }
  }, [product, slug, navigate]);

  const productMainSection = templateSections.find(s => s.type === 'product_main');

  const variants = detail?.variants ?? [];
  const activeVariant = selectedVariant ?? detail?.defaultVariant ?? null;
  const allImages = [...(product?.images ?? []), ...(activeVariant?.images ?? [])].filter((v, i, a) => a.indexOf(v) === i);
  const pType = product?.productType ?? product?.type ?? 'physical';
  const isDigital = pType !== 'physical';
  // Shopify-style availability from the server's own formula (stock - committed - damaged - inTransit);
  // allowBackorder = "continue selling when out of stock".
  const stock = variantAvailable(activeVariant, isDigital);
  const canBuy = variantCanBuy(activeVariant, isDigital);
  const maxQty = variantMaxQty(activeVariant, isDigital);
  const state = stockState(activeVariant, isDigital, store.lowStockThreshold);
  const cartDrawer = useCartDrawer();
  const rules = resolveQtyRules(product, maxQty);
  const qty = clampQty(rawQty, rules);
  const preorderText = preorderLabel(product);
  const ruleHint = qtyRuleHint(rules);
  const pctOff = activeVariant?.compareAtPrice != null && activeVariant.compareAtPrice > activeVariant.price
    ? Math.round((1 - activeVariant.price / activeVariant.compareAtPrice) * 100) : null;
  const displayPrice = activeVariant ? convert(activeVariant.price, activeVariant.currency) : null;
  const displayCompareAt = activeVariant?.compareAtPrice != null ? convert(activeVariant.compareAtPrice, activeVariant.currency) : null;
  // Never print a native amount with the buyer-currency symbol: until rates load, show a dash.
  const ratesOk = ratesLoaded || !activeVariant?.currency || activeVariant.currency === displayCurrency;
  const money = (n: number) => (ratesOk ? `${symbol}${fmt2(n)}` : '—');

  useEffect(() => { setQty(rules.min); }, [activeVariant?._id, rules.min]);
  // "Notify me when available" — only for a physical variant that's sold out.
  // Feeds the "Recently viewed" section (this browser only).
  useEffect(() => { if (product?._id) recordRecentlyViewed(store.storeId, product._id); }, [store.storeId, product?._id]);
  const backInStock = useBackInStock(store.storeId, product?._id, activeVariant?._id, !isDigital && !canBuy);

  const handleAddToCart = async () => {
    if (!product || !activeVariant || !canBuy) return;
    const wanted = qty;
    await addToCart(product._id, activeVariant._id, isDigital ? 'digital' : 'physical');
    // `addToCart` always adds exactly 1 unit (real shared CartContext/API
    // behavior, app-wide) — honor a higher selected quantity the same way
    // the Cart page's own stepper does, via sequential `updateQty` calls,
    // so this stepper is functional rather than cosmetic.
    for (let i = 1; i < wanted; i++) {
      await updateQty(product._id, activeVariant._id, 'increase');
    }
    setAddedFeedback(true);
    cartDrawer.openDrawer();
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

  const layout = resolveProductMainLayout(productMainSection);
  // Seller's own button/heading text on the Buy buttons and Description blocks.
  const buyCopy = layout.infoItems.find(i => i.type === 'product_buy_buttons')?.settings;
  const descCopy = layout.infoItems.find(i => i.type === 'product_description')?.settings;
  const pickerStyle = layout.infoItems.find(i => i.type === 'product_variant_picker')?.settings.pickerStyle === 'dropdown' ? 'dropdown' : 'pills';
  // "Buy it now": add the chosen variant/quantity, then straight to checkout.
  const handleBuyNow = async () => {
    if (!product || !activeVariant || !canBuy) return;
    await addToCart(product._id, activeVariant._id, isDigital ? 'digital' : 'physical');
    for (let i = 1; i < qty; i++) await updateQty(product._id, activeVariant._id, 'increase');
    navigate('/checkout');
  };
  const { before: sectionsBefore, after: sectionsAfter } = splitProductTemplateSections(templateSections);

  const buyOn = layout.infoOrder.includes('product_buy_buttons');
  const partTokens: PartTokens = { fonts: t.fonts, colors: t.colors, buttonRadius: '0px' };
  const productContext = { productId: product._id, categoryId: product.categoryId ?? null };
  // A divider above Description only makes sense when something sits above it.
  const descLeads = layout.infoOrder[0] === 'product_description';

  const ratingLine = product.averageRating > 0 && (
    <div className="flex items-center gap-1.5 mt-2">
      <Star size={13} fill={t.colors.accent} color={t.colors.accent} />
      <span style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.inkMuted }}>
        {product.averageRating.toFixed(1)} ({product.totalRatings ?? 0} reviews)
      </span>
    </div>
  );

  const previewButton = isDigital && product.digital?.previewAvailable && (
    <button
      type="button"
      onClick={() => { setPreviewOpen(true); loadPreview(); }}
      className="w-full flex items-center justify-center gap-2 cursor-pointer bg-transparent"
      style={{ fontFamily: t.fonts.body, fontSize: '13px', fontWeight: 600, color: t.colors.ink, border: `1px solid ${t.colors.border}`, padding: '11px 0' }}
    >
      <Eye size={14} /> Preview before you buy
    </button>
  );

  const backInStockBox = backInStock.show && (
    <div style={{ border: `1px solid ${t.colors.border}`, padding: '14px 16px', background: t.colors.bgAlt }}>
      {backInStock.status === 'done' || backInStock.status === 'available' ? (
        <p className="flex items-start gap-2" style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.success }}>
          <CheckCircle2 size={14} className="mt-[2px] shrink-0" /> {backInStock.message}
        </p>
      ) : (
        <form onSubmit={backInStock.submit} className="flex flex-col gap-2.5 atelier-form">
          <p style={{ fontFamily: t.fonts.body, fontSize: '13px', fontWeight: 600, color: t.colors.ink }}>Get notified when it's back</p>
          <div className="flex gap-2">
            <input
              type="email"
              required
              value={backInStock.email}
              onChange={e => backInStock.setEmail(e.target.value)}
              placeholder="Your email"
              aria-label="Email for back-in-stock alert"
              style={atelierInput}
            />
            <AtelierButton type="submit" loading={backInStock.status === 'loading'} style={{ flexShrink: 0 }}>Notify me</AtelierButton>
          </div>
          {backInStock.status === 'error' && (
            <p style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.danger }}>{backInStock.message}</p>
          )}
        </form>
      )}
    </div>
  );

  // The info column, one entry per `product_main` block — rendered below in
  // the order the seller arranged them in the editor (see `productPageLayout`).
  const infoBlocks: Record<ProductInfoBlock, ReactNode> = {
    product_title: (
      <div>
        {product.vendor ? <p style={{ fontFamily: t.fonts.body, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: t.colors.inkMuted, margin: '0 0 6px' }}>{product.vendor}</p> : null}
      <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(26px, 3vw, 34px)', fontWeight: 600, color: t.colors.ink, lineHeight: 1.15 }}>
        {product.name}
      </h1>
        {preorderText ? <p style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted, margin: '8px 0 0' }}>{preorderText}</p> : null}
      </div>
    ),
    product_rating: ratingLine,
    product_sku: <ProductSku sku={activeVariant?.sku} tokens={partTokens} />,
    product_wishlist: <ProductWishlistButton productId={product._id} variantId={activeVariant?._id} tokens={partTokens} />,
    product_share: <ProductShareButton title={product.name} tokens={partTokens} />,
    product_specs: <ProductSpecs entries={metafieldEntries} tokens={partTokens} />,
    product_price: (
      <div className="flex items-baseline gap-3">
        <span style={{ fontFamily: t.fonts.body, fontSize: '22px', color: t.colors.ink, fontWeight: 500 }}>
          {displayPrice != null ? money(displayPrice) : ''}
        </span>
        {displayCompareAt != null && (
          <>
            <span style={{ fontFamily: t.fonts.body, fontSize: '15px', color: t.colors.inkMuted, textDecoration: 'line-through' }}>
              {money(displayCompareAt)}
            </span>
            {pctOff != null && (
              <span style={{ fontFamily: t.fonts.body, fontSize: '11px', fontWeight: 600, color: t.colors.accent }}>−{pctOff}%</span>
            )}
          </>
        )}
      </div>
    ),
    product_variant_picker: <VariantSelector variants={variants} selected={activeVariant} onSelect={setSelectedVariant} isDigital={isDigital} pickerStyle={pickerStyle} />,
    product_quantity: !isDigital && (
      <div className="flex items-center gap-4">
        <div className="flex items-center" style={{ border: `1px solid ${t.colors.border}` }}>
          <button type="button" disabled={qty <= rules.min} aria-label="Decrease quantity" onClick={() => setQty(q => clampQty(q - rules.step, rules))} className="w-9 h-9 flex items-center justify-center bg-transparent border-0 cursor-pointer" style={{ color: t.colors.ink }}>
            <Minus size={13} />
          </button>
          <span style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.ink, width: '36px', textAlign: 'center' }}>{qty}</span>
          <button type="button" onClick={() => setQty(q => clampQty(q + rules.step, rules))} disabled={!canBuy || qty >= rules.max} aria-label="Increase quantity" className="w-9 h-9 flex items-center justify-center bg-transparent border-0 cursor-pointer" style={{ color: t.colors.ink }}>
            <Plus size={13} />
          </button>
        </div>
        <span style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted }}>
          {state === 'sold_out' ? 'Sold out' : state === 'low' ? `Only ${stock} left` : state === 'backorder' ? 'Available on backorder' : 'In stock'}
          {ruleHint ? ` · ${ruleHint}` : ''}
        </span>
      </div>
    ),
    product_buy_buttons: (
      <div className="flex flex-col gap-3">
        {previewButton}
        <AtelierButton
          disabled={!canBuy}
          loading={adding === activeVariant?._id}
          onClick={handleAddToCart}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {addedFeedback ? <><CheckCircle2 size={14} /> {copyText(buyCopy, 'addedLabel', 'Added to Cart')}</> : !canBuy ? copyText(buyCopy, 'soldOutLabel', 'Sold out') : preorderText ? copyText(buyCopy, 'preorderLabel', 'Pre-order') : copyText(buyCopy, 'addToCartLabel', 'Add to Cart')}
        </AtelierButton>
        {backInStockBox}
      </div>
    ),
    product_description: product.description && (
      <div className={descLeads ? undefined : 'pt-6'} style={descLeads ? undefined : { borderTop: `1px solid ${t.colors.border}` }}>
        <p style={{ fontFamily: t.fonts.body, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: t.colors.inkMuted, marginBottom: '10px' }}>{copyText(descCopy, 'heading', 'Description')}</p>
        <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.ink, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{product.description}</p>
      </div>
    ),
  };
  // Title + rating are one tight group; wishlist + share sit on one row; everything else stacks.
  const renderedInfo: ReactNode[] = [];
  const items = layout.infoItems;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type === 'product_buy_now') {
      if (buyOn && !isDigital) renderedInfo.push(<ProductBuyNowButton key={item.key} settings={item.settings} tokens={partTokens} disabled={!canBuy} loading={adding === activeVariant?._id} onBuy={handleBuyNow} />);
      continue;
    }
    if (item.type === 'product_collapsible_tab') { renderedInfo.push(<ProductCollapsibleTab key={item.key} settings={item.settings} tokens={partTokens} />); continue; }
    if (item.type === 'product_size_chart') { renderedInfo.push(<ProductSizeChart key={item.key} settings={item.settings} tokens={partTokens} />); continue; }
    const type = item.type;
    const nextType = items[i + 1]?.type;
    const next = nextType && nextType in infoBlocks ? (nextType as ProductInfoBlock) : undefined;
    if (type === 'product_title' && next === 'product_rating') {
      renderedInfo.push(<div key="title-rating" className="flex flex-col">{infoBlocks.product_title}{infoBlocks.product_rating}</div>);
      i++;
    } else if ((type === 'product_wishlist' && next === 'product_share') || (type === 'product_share' && next === 'product_wishlist')) {
      renderedInfo.push(<div key="wishlist-share" className="flex flex-wrap gap-3">{infoBlocks[type]}{infoBlocks[next]}</div>);
      i++;
    } else {
      renderedInfo.push(<Fragment key={type}>{infoBlocks[type]}</Fragment>);
    }
  }

  return (
    <main>
      <ProductPageContext.Provider value={productContext}>
      {/* Sections the seller placed above the main product block. */}
      {sectionsBefore.length > 0 && <AtelierSectionRenderer sections={sectionsBefore} dynamicSourceValues={dynamicSourceValues} />}

      <div className={`mx-auto grid grid-cols-1 gap-12 ${layout.mediaOn ? 'lg:grid-cols-2' : ''}`} style={{ maxWidth: t.layout.maxWidth, padding: `48px ${t.layout.containerPadX}` }}>
        {layout.mediaOn && <Gallery images={allImages} name={product.name} />}

        <div className={`flex flex-col gap-6 ${layout.mediaOn ? '' : 'w-full max-w-[640px] mx-auto'}`}>
          {/* The rating, preview button and back-in-stock box always showed
              even when their neighbouring block was hidden — keep that. */}
          {renderedInfo}
          {!buyOn && <>{previewButton}{backInStockBox}</>}
        </div>
      </div>

      <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth, padding: `0 ${t.layout.containerPadX} 48px` }}>
        <ProductReviewsSection productId={product._id} />
      </div>

      {/* `product_main` (the locked core section, seeded server-side) is
         NOT re-rendered here — it's already the real, always-rendered
         gallery/title/price/etc. above; rendering it again via the generic
         section renderer would duplicate that content on the page. Only
         genuinely surrounding sections a seller added reach this call. */}
      {sectionsAfter.length > 0 && <AtelierSectionRenderer sections={sectionsAfter} dynamicSourceValues={dynamicSourceValues} />}

      {previewOpen && (
        <Modal title="Preview" onClose={() => { setPreviewOpen(false); resetPreview(); }} width={560} mobileSheet>
          {previewLoading && (
            <div className="flex items-center justify-center gap-2 py-10" style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted }}>
              <Loader2 size={16} className="animate-spin" /> Loading preview…
            </div>
          )}
          {!previewLoading && previewError && (
            <p className="text-center py-10" style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.danger }}>{previewError}</p>
          )}
          {!previewLoading && !previewError && previewData?.type === 'pdf' && (
            <div className="flex flex-col gap-3">
              {previewData.pages.map((url, i) => <img key={i} src={url} alt={`Preview page ${i + 1}`} className="w-full" />)}
            </div>
          )}
          {!previewLoading && !previewError && previewData?.type === 'image' && (
            <img src={previewData.url} alt="Preview" className="w-full" />
          )}
          {!previewLoading && !previewError && previewData?.type === 'video' && (
            <video src={previewData.url} controls className="w-full" />
          )}
          {!previewLoading && !previewError && previewData?.type === 'audio' && (
            <audio src={previewData.url} controls className="w-full" />
          )}
        </Modal>
      )}
      </ProductPageContext.Provider>
    </main>
  );
}
