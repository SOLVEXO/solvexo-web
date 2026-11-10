import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { VendorLink } from '@/features/storefront-themes/core/VendorLink';
import { Minus, Plus, ShoppingCart, ZoomIn } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import type { ProductVariant } from '@/api/services/marketplace';
import { apiGetProductReviews, type ProductReviewEntry, type ProductReviewStats } from '@/api/services/rating';
import { TokenStorage, isGuestUser } from '@/api/services/auth';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCartContext } from '@/contexts/CartContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { useProductById } from '@/hooks/marketplace/useProductById';
import { useRecordProductView } from '@/hooks/marketplace/useRecordProductView';
import { useLocalize } from '@/hooks/useLocalize';
import { displayMoney, saleInfo } from '../../core/money';
import { ProductPageContext } from '../../productContext';
import { recordRecentlyViewed } from '../../moreSections';
import { resolveProductMainLayout, splitProductTemplateSections } from '../../productPageLayout';
import { clampQty, qtyRuleHint, resolveQtyRules } from '../../sellingRules';
import { BundleIncludes } from '../../core/merchandising/BundleIncludes';
import { useWholesaleGate, useWholesalePrice } from '../../core/b2b/useWholesale';
import { Link as WholesaleLink } from 'react-router-dom';
import { productPreorderNote } from '../../core/merchandising/purchaseNotes';
import { optionValueAvailable, stockState, variantAvailable, variantCanBuy, variantMaxQty } from '../../variantAvailability';
import { useCartDrawer } from '../../cartDrawerContext';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { useJsonLd } from '../../core/hooks/useJsonLd';
import { breadcrumbJsonLd, pageUrlBuilder, productJsonLd } from '../../core/seo/jsonLd';
import { useTemplateSections } from '../../core/pageHooks';
import { useReviewedProducts } from '../../useReviewedProducts';
import { imgProps } from '../components/imgProps';
import { TechNotFoundPage } from './TechNotFoundPage';
import { ReviewEditDialog } from './account/ReviewEditDialog';
// Small, token-driven product widgets reused as they are (they read the bridged Tech palette): share, wishlist, SKU, specs,
// delivery estimate, description tabs, text/pickup/size-chart blocks and the image zoom.
import { ProductShareButton, ProductSku, ProductSpecsBlock, ProductWishlistButton } from '../components/product/ProductParts';
import { ProductBuyNowButton, ProductCollapsibleTab, ProductSizeChart, ProductTextBlock, ProductPickup } from '../components/product/ProductExtraBlocks';
import { ProductDescriptionTabs, type DescriptionTab } from '../components/product/ProductDescriptionTabs';
import { ProductDelivery } from '../components/product/ProductDelivery';
import { StickyBuyBar } from '../components/product/StickyBuyBar';
import { TechImageLightbox } from '../components/product/TechImageLightbox';
import { TechSectionRenderer } from '../sections';
import { TechBox, TechBreadcrumbs, TechButton, TechError, TechSkeleton, TechStars } from '../ui/techUi';
import { techTheme as t } from '../theme.config';
import { baseTheme as b } from '../theme.base';

/** `/product/:slug`: buy panel on the left, gallery on the right, a sticky price/add-to-cart bar, then the seller's template sections and reviews. */
export function TechProductPage() {
  const { slug = '' } = useParams();
  // keyed by slug so picked options, quantity and gallery position reset when the shopper opens another product
  return <Inner key={slug} slug={slug} />;
}

function Inner({ slug }: { slug: string }) {
  const { store } = useStorefront();
  const navigate = useNavigate();
  const { addToCart, adding } = useCartContext();
  const { openDrawer, mounted: drawerMounted } = useCartDrawer();
  const { currency, convert, canConvert, fixedPriceFor } = useCurrencyPreference();
  const localize = useLocalize();
  const { detail, loading, error, refetch } = useProductById(slug);
  const product = detail ? localize.product(detail.product) : null;
  const variants = useMemo(() => detail?.variants ?? [], [detail?.variants]);
  const isDigital = detail?.product.type === 'digital' || detail?.product.productType === 'digital';
  useRecordProductView(detail?.product._id);
  const viewedId = detail?.product._id;
  useEffect(() => { if (viewedId) recordRecentlyViewed(store.storeId, viewedId); }, [store.storeId, viewedId]);

  const sections = useTemplateSections(store.storeId, 'product', detail?.product.templateKey || 'default');
  const { before, after } = splitProductTemplateSections(sections);
  const layout = useMemo(() => resolveProductMainLayout(sections.find(s => s.type === 'product_main')), [sections]);

  const [picked, setPicked] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [gallery, setGallery] = useState<{ vid: string; i: number }>({ vid: '', i: 0 });
  const [zoom, setZoom] = useState(false);
  const [reviews, setReviews] = useState<{ stats: ProductReviewStats; reviews: ProductReviewEntry[] } | null>(null);
  const [reviewsTick, setReviewsTick] = useState(0);
  const [writingReview, setWritingReview] = useState(false);
  const { byProduct: myReviews, reload: reloadMyReviews } = useReviewedProducts();

  const optionNames = useMemo(() => Array.from(new Set(variants.flatMap(v => (v.options ?? []).map(o => o.name)))), [variants]);
  const variant: ProductVariant | null = useMemo(() => {
    if (!variants.length) return null;
    const exact = variants.find(v => optionNames.every(n => !picked[n] || v.options?.find(o => o.name === n)?.value === picked[n]));
    return exact ?? detail?.defaultVariant ?? variants[0];
  }, [variants, optionNames, picked, detail?.defaultVariant]);

  // Wholesale: who is looking (approved company buyer / locked out of a wholesale-only store) and their server-computed price.
  const wholesale = useWholesaleGate();
  const wholesalePrice = useWholesalePrice(variant?._id, qty, wholesale.approved);

  // A shared link carries ?variant=<id>: start on that option (once per product).
  const linkedFor = useRef('');
  useEffect(() => {
    const pid = detail?.product._id;
    if (!pid || linkedFor.current === pid) return;
    linkedFor.current = pid;
    const wanted = new URLSearchParams(window.location.search).get('variant');
    const v = wanted ? variants.find(x => x._id === wanted) : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync of the shared link's variant into local state
    if (v?.options?.length) setPicked(Object.fromEntries(v.options.map(o => [o.name, o.value])));
  }, [detail?.product._id, variants]);

  useEffect(() => {
    if (!detail?.product._id) return;
    let off = false;
    apiGetProductReviews(detail.product._id, { limit: 5, sort: 'most_helpful' }).then(r => { if (!off) setReviews({ stats: r.data.stats, reviews: r.data.reviews }); }).catch(() => {});
    return () => { off = true; };
  }, [detail?.product._id, reviewsTick]);

  const images = useMemo(() => {
    const own = variant?.images?.filter(Boolean) ?? [];
    const all = detail?.product.images ?? [];
    return [...own, ...all.filter(i => !own.includes(i))];
  }, [variant, detail?.product.images]);
  const imageIndex = gallery.vid === (variant?._id ?? '') ? Math.min(gallery.i, Math.max(0, images.length - 1)) : 0;
  const setImageIndex = (i: number) => setGallery({ vid: variant?._id ?? '', i });

  useStorefrontSeo({ title: product?.name, description: product?.description?.replace(/\s+/g, ' ').slice(0, 160), image: images[0] });
  const { origin, pathname } = window.location;
  const pageUrl = `${origin}${pathname}`;
  useJsonLd('product', product && variant ? productJsonLd({
    name: product.name, description: product.description, images, sku: variant.sku, vendor: detail?.product.vendor,
    price: variant.price, currency: String(variant.currency ?? store.baseCurrency ?? ''), inStock: variantCanBuy(variant, isDigital),
    url: pageUrl, origin, rating: reviews ? { value: reviews.stats.averageRating, count: reviews.stats.totalReviews } : null,
  }) : null);
  useJsonLd('breadcrumb', product ? breadcrumbJsonLd([{ name: store.name, url: pageUrlBuilder(origin, pathname)('/') }, { name: product.name, url: pageUrl }]) : null);

  // Description first, then this product's own tabs, then the store-wide "Show as a tab" blocks (real data only).
  const descriptionTabs = useMemo<DescriptionTab[]>(() => {
    if (!product) return [];
    const own = (detail?.product.tabs ?? []).map((x, i) => ({ key: `own-${i}`, title: x.title, content: x.content, html: true }));
    const shared = layout.infoItems.filter(i => i.type === 'product_collapsible_tab' && i.settings.showAsTab === true && typeof i.settings.title === 'string' && typeof i.settings.content === 'string' && i.settings.content.trim())
      .map(i => ({ key: `store-${i.key}`, title: String(i.settings.title), content: String(i.settings.content), html: false }));
    const main: DescriptionTab[] = product.description ? [{ key: 'description', title: ts('product.description', 'Description'), content: product.description, html: true }] : [];
    return [...main, ...own, ...shared];
  }, [product, detail?.product.tabs, layout.infoItems]);

  if (loading) return <TechBox><TechSkeleton h={420} /></TechBox>;
  if (error && !detail) return /not found|404/i.test(error) ? <TechNotFoundPage /> : <TechError message={ts('product.loadError', "We couldn't load this product.")} onRetry={refetch} />;
  if (!detail || !product || !variant) return <TechNotFoundPage />;

  const base = String(variant.currency ?? store.baseCurrency ?? currency);
  const ref = { productId: detail.product._id, variantId: variant._id };
  const show = (n: number, compare = false) => displayMoney({ currency, convert, canConvert }, n, base, { ...ref, compare });
  const state = stockState(variant, isDigital, store.lowStockThreshold);
  const canBuy = variantCanBuy(variant, isDigital);
  const maxQty = variantMaxQty(variant, isDigital);
  const rules = resolveQtyRules(detail.product, Number.isFinite(maxQty) ? maxQty : 999);
  const safeQty = clampQty(qty, rules);
  const sale = saleInfo({ currency, convert, canConvert, fixedPriceFor }, variant.price, variant.compareAtPrice, base, ref);
  const pre = productPreorderNote(detail.product, variant);
  const busy = adding === variant._id;
  const rating = reviews?.stats.averageRating ?? detail.product.averageRating ?? 0;
  const reviewCount = reviews?.stats.totalReviews ?? detail.product.totalRatings ?? 0;
  const addLabel = !canBuy ? ts('product.soldOut', 'Sold out') : pre ? ts('product.preorder', 'Pre-order') : busy ? ts('product.adding', 'Adding…') : ts('product.addToCart', 'Add to cart');

  const add = async (goCheckout = false) => {
    const ok = await addToCart(detail.product._id, variant._id, isDigital ? 'digital' : 'physical', safeQty);
    if (!ok) return;
    if (goCheckout) navigate('/checkout'); else if (drawerMounted) openDrawer();
  };

  const stepper = (
    <div className="inline-flex items-center" style={{ background: t.colors.bgAlt }}>
      <button type="button" aria-label={ts('product.decreaseQty', 'Decrease quantity')} disabled={safeQty <= rules.min} onClick={() => setQty(clampQty(safeQty - rules.step, rules))} className="grid size-10 cursor-pointer place-items-center border-0 bg-transparent disabled:opacity-40" style={{ color: t.colors.ink }}><Minus size={14} /></button>
      <span className="min-w-8 text-center text-sm font-semibold" aria-live="polite">{safeQty}</span>
      <button type="button" aria-label={ts('product.increaseQty', 'Increase quantity')} disabled={safeQty >= rules.max} onClick={() => setQty(clampQty(safeQty + rules.step, rules))} className="grid size-10 cursor-pointer place-items-center border-0 bg-transparent disabled:opacity-40" style={{ color: t.colors.ink }}><Plus size={14} /></button>
    </div>
  );

  const info: Record<string, (settings: Record<string, unknown>) => ReactNode> = {
    product_title: () => (
      <div>
        {b.showVendor && detail.product.vendor && <p className="m-0 mb-1 text-xs font-medium uppercase" style={{ color: t.colors.inkMuted, letterSpacing: '.06em' }}><VendorLink name={detail.product.vendor} /></p>}
        <h1 className="m-0 text-[clamp(24px,3vw,34px)] font-semibold leading-tight" style={{ fontFamily: t.fonts.display }}>{product.name}</h1>
      </div>
    ),
    product_rating: () => !b.showReviews ? null : (
      <a href="#tx-reviews" className="inline-flex items-center gap-2 text-xs no-underline" style={{ color: t.colors.accent }}>
        {reviewCount > 0 ? <><TechStars value={rating} /><span>{ts('reviews.count', '{{count}} reviews', { count: reviewCount })}</span></> : <span>{ts('reviews.beFirst', 'Be the first to review this product')}</span>}
      </a>
    ),
    product_price: () => wholesale.locked ? null : (
      <>
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-[28px] font-semibold" style={{ color: sale.onSale ? t.colors.danger : t.colors.price }}>{show(variant.price)}</span>
          {sale.onSale && <><s className="text-lg" style={{ color: t.colors.inkMuted }}>{show(sale.compareAmount, true)}</s><span className="text-xs font-semibold" style={{ color: t.colors.danger }}>{ts('product.savePercent', 'Save {{percent}}%', { percent: sale.percentOff })}</span></>}
        </div>
        {product.shortDescription?.trim() && <p className="m-0 mt-3 text-sm leading-relaxed" style={{ color: t.colors.inkMuted }}>{product.shortDescription}</p>}
      </>
    ),
    product_description: s => descriptionTabs.length > 0 ? <ProductDescriptionTabs tabs={descriptionTabs} heading={typeof s.heading === 'string' ? s.heading : undefined} /> : null,
    product_variant_picker: () => optionNames.length === 0 ? null : (
      <div className="flex flex-col gap-4">
        {optionNames.map(name => {
          const values = Array.from(new Set(variants.map(v => v.options?.find(o => o.name === name)?.value).filter((v): v is string => !!v)));
          const current = variant.options?.find(o => o.name === name)?.value;
          return (
            <fieldset key={name} className="m-0 border-0 p-0">
              <legend className="mb-2 p-0 text-sm font-semibold">{name}: <span className="font-normal" style={{ color: t.colors.inkMuted }}>{current}</span></legend>
              <div className="flex flex-wrap gap-2">
                {values.map(v => {
                  const on = current === v;
                  const ok = optionValueAvailable(variants, variant, name, v, isDigital);
                  return (
                    <button key={v} type="button" aria-pressed={on} onClick={() => setPicked(p => ({ ...p, [name]: v }))} className="min-w-12 cursor-pointer px-4 py-2 text-sm font-medium"
                      style={{ borderRadius: t.fieldRadiusPx, border: `1.5px solid ${on ? t.colors.accent : t.colors.border}`, background: t.colors.bg, color: on ? t.colors.accent : t.colors.ink, opacity: ok ? 1 : 0.45, textDecoration: ok ? undefined : 'line-through' }}>{v}</button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>
    ),
    product_quantity: () => wholesale.locked ? null : (
      <div>
        <p className="m-0 mb-2 text-sm font-semibold">{ts('product.quantity', 'Quantity')}</p>
        <div className="flex flex-wrap items-center gap-4">
          {stepper}
          <span className="text-sm font-medium" hidden={!b.showStockStatus && state !== 'sold_out'} style={{ color: state === 'sold_out' ? t.colors.danger : state === 'low' ? t.colors.warning : t.colors.success }}>
            {state === 'preorder' ? ts('product.preorder', 'Pre-order') : state === 'sold_out' ? ts('product.soldOut', 'Sold out') : state === 'low' ? ts('product.onlyLeft', 'Only {{count}} left', { count: variantAvailable(variant, isDigital) }) : state === 'backorder' ? ts('product.backorder', 'Available on backorder') : ts('product.inStock', 'In stock')}
          </span>
        </div>
        {qtyRuleHint(rules) && <p className="m-0 mt-2 text-xs" style={{ color: t.colors.inkMuted }}>{qtyRuleHint(rules)}</p>}
      </div>
    ),
    product_buy_buttons: s => {
      if (wholesale.locked) return (
            <div id="tx-buy" className="flex flex-col gap-2 p-4" style={{ border: `1px solid ${t.colors.border}`, borderRadius: 8 }}>
              <p className="m-0 text-sm font-semibold">{ts('b2b.locked_title', 'Wholesale customers only')}</p>
              <p className="m-0 text-xs" style={{ color: t.colors.inkMuted }}>{wholesale.signedIn ? ts('b2b.locked_apply', 'Prices and ordering are for approved wholesale accounts. Apply for one to start buying.') : ts('b2b.locked_signin', 'Sign in with your wholesale account to see prices and order.')}</p>
              <WholesaleLink to={wholesale.signedIn ? '/wholesale' : '/login'} className="text-sm font-semibold underline">{wholesale.signedIn ? ts('b2b.apply_link', 'Apply for wholesale') : ts('b2b.signin_link', 'Sign in')}</WholesaleLink>
            </div>
      );
      const own = (k: string) => (typeof s[k] === 'string' && (s[k] as string).trim() ? (s[k] as string).trim() : null);
      return (
        <div id="tx-buy" className="flex flex-col gap-3">
          {pre && <p role="status" className="m-0 text-sm font-medium" style={{ color: t.colors.inkMuted }}>{pre}</p>}
          {wholesalePrice?.available && wholesalePrice.unitPrice != null && (
            <div role="status" className="text-sm" style={{ color: t.colors.ink }}>
              <p className="m-0 font-medium">{ts('b2b.your_price', 'Your wholesale price: {{price}} each', { price: show(wholesalePrice.unitPrice) })}</p>
              {(wholesalePrice.priceBreaks ?? []).length > 0 && <p className="m-0 mt-1 text-xs" style={{ color: t.colors.inkMuted }}>{(wholesalePrice.priceBreaks ?? []).map(b => `${b.minQty}+ → ${show(b.price)}`).join(' · ')}</p>}
            </div>
          )}
          {wholesalePrice && !wholesalePrice.available && wholesalePrice.error && <p role="alert" className="m-0 text-xs font-medium" style={{ color: t.colors.danger }}>{wholesalePrice.error}</p>}
          <BundleIncludes bundle={detail.bundle} ink={t.colors.ink} inkMuted={t.colors.inkMuted} />
          <TechButton block disabled={!canBuy} loading={busy} onClick={() => add(false)}><ShoppingCart size={16} aria-hidden />{!canBuy ? (own('soldOutLabel') ?? addLabel) : pre ? (own('preorderLabel') ?? addLabel) : (own('addToCartLabel') ?? addLabel)}</TechButton>
        </div>
      );
    },
    product_buy_now: s => wholesale.locked ? null : <ProductBuyNowButton settings={s} disabled={!canBuy} loading={busy} onBuy={() => add(true)} />,
    product_wishlist: () => <ProductWishlistButton productId={detail.product._id} variantId={variant._id} />,
    product_share: s => <ProductShareButton settings={s} title={product.name} image={product.images?.[0]} variantId={variants.length > 1 ? variant._id : undefined} />,
    product_sku: () => <ProductSku sku={variant.sku} />,
    product_specs: () => <ProductSpecsBlock storeId={store.storeId} productId={detail.product._id} />,
    product_collapsible_tab: s => s.showAsTab === true ? null : <ProductCollapsibleTab settings={s} />,
    product_size_chart: s => <ProductSizeChart settings={s} />,
    product_pickup: s => <ProductPickup storeId={store.storeId} storeName={store.name} settings={s} available={canBuy && !isDigital} />,
    product_text: s => typeof s.text === 'string' && s.text.trim() ? <ProductTextBlock settings={s} /> : null,
  };

  const thumb = 'size-16 shrink-0 cursor-pointer overflow-hidden p-0';
  return (
    <ProductPageContext.Provider value={{ productId: detail.product._id, categoryId: detail.product.categoryId ?? null, subCategoryId: detail.product.subCategoryId ?? null, complementaryProductIds: detail.product.complementaryProductIds ?? [] }}>
      {before.length > 0 && <TechSectionRenderer sections={before} />}

      <div className="sticky top-0 z-30 hidden md:block" style={{ background: t.colors.bg, borderBottom: `1px solid ${t.colors.border}`, fontFamily: t.fonts.body }}>
        <div className="mx-auto flex items-center gap-4" style={{ maxWidth: t.layout.maxWidth, padding: `10px ${t.layout.containerPadX}` }}>
          <p className="m-0 min-w-0 flex-1 truncate text-sm font-semibold">{product.name}</p>
          <span className="text-sm">{sale.onSale ? ts('product.onSaleFrom', 'On sale from') : ''} <b>{show(variant.price)}</b></span>
          {stepper}
          <TechButton small disabled={!canBuy} loading={busy} onClick={() => add(false)}>{addLabel}</TechButton>
        </div>
      </div>

      <div style={{ background: t.colors.bgAlt }}>
        <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth, padding: `clamp(20px,3vw,40px) ${t.layout.containerPadX} clamp(32px,5vw,64px)`, fontFamily: t.fonts.body, color: t.colors.ink }}>
          {b.showBreadcrumbs && <TechBreadcrumbs items={[{ label: ts('product.crumbHome', 'Home'), to: '/' }, { label: ts('product.crumbShop', 'Shop'), to: '/search' }, { label: product.name }]} />}
          <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-14">
            <div className="flex flex-col gap-5">
              {layout.infoItems.map(item => {
                const node = info[item.type]?.(item.settings);
                return node ? <div key={item.key}>{node}</div> : null;
              })}
              {!isDigital && b.showDelivery && <ProductDelivery storeId={store.storeId} />}
            </div>
            {layout.mediaOn && (
              <div className="lg:sticky lg:top-24">
                {images.length === 0 ? <div style={{ aspectRatio: '1 / 1', background: t.colors.bg }} /> : (
                  <div className={t.gallery === 'left' ? 'lg:flex lg:flex-row-reverse lg:items-start lg:gap-3' : ''}>
                    <button type="button" onClick={() => setZoom(true)} aria-label={ts('product.zoomImage', 'Zoom image')} className="group relative block w-full cursor-zoom-in overflow-hidden border-0 p-4" style={{ aspectRatio: '1 / 1', background: t.colors.bg }}>
                      <img key={images[imageIndex]} {...imgProps(images[imageIndex], [480, 768, 1024], '(min-width: 1024px) 50vw, 100vw')} alt={product.name} className="size-full object-contain" fetchPriority="high" />
                      <span className="absolute bottom-3 end-3 grid size-9 place-items-center rounded-full opacity-0 transition-opacity group-hover:opacity-100" style={{ background: t.colors.bgAlt }}><ZoomIn size={16} /></span>
                    </button>
                    {images.length > 1 && (
                      <div className={`tx-hide-scroll mt-3 flex gap-2 overflow-x-auto ${t.gallery === 'left' ? 'lg:mt-0 lg:max-h-[560px] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden' : ''}`}>
                        {images.map((src, i) => (
                          <button key={src + i} type="button" onClick={() => setImageIndex(i)} aria-label={ts('product.showImageN', 'Show image {{n}}', { n: i + 1 })} aria-current={i === imageIndex} className={thumb} style={{ background: t.colors.bg, border: `2px solid ${i === imageIndex ? t.colors.accent : 'transparent'}` }}>
                            <img {...imgProps(src, [96, 160], '64px')} alt="" loading="lazy" className="size-full object-contain" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {after.length > 0 && <TechSectionRenderer sections={after} />}

      {b.showReviews && <section id="tx-reviews" style={{ fontFamily: t.fonts.body, color: t.colors.ink }}>
        <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth, padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}` }}>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 text-xl font-semibold" style={{ fontFamily: t.fonts.display }}>{ts('reviews.title', 'Customer reviews')}</h2>
            <TechButton variant="outline" small onClick={() => { if (!TokenStorage.isLoggedIn() || isGuestUser()) { navigate('/login'); return; } setWritingReview(true); }}>
              {myReviews.has(product._id) ? ts('reviews.editYours', 'Edit your review') : ts('reviews.write', 'Write a review')}
            </TechButton>
          </div>
          {!reviews || reviews.reviews.length === 0 ? (
            <p className="m-0 text-sm" style={{ color: t.colors.inkMuted }}>{reviews ? ts('reviews.noneYet', 'No reviews yet. Be the first to share what you think.') : ts('reviews.loadingReviews', 'Loading reviews…')}</p>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
              <div>
                <p className="m-0 text-4xl font-semibold">{reviews.stats.averageRating.toFixed(1)}</p>
                <div className="mt-1"><TechStars value={reviews.stats.averageRating} size={16} count={reviews.stats.totalReviews} /></div>
                <div className="mt-4 flex flex-col gap-2">
                  {(['5', '4', '3', '2', '1'] as const).map(k => {
                    const n = reviews.stats.ratingBreakdown[k] ?? 0;
                    const pct = reviews.stats.totalReviews ? (n / reviews.stats.totalReviews) * 100 : 0;
                    return <div key={k} className="flex items-center gap-2 text-xs"><span className="w-3">{k}</span><span className="h-1.5 flex-1" style={{ background: t.colors.border }}><span className="block h-full" style={{ width: `${pct}%`, background: t.colors.star }} /></span><span className="w-6 text-end" style={{ color: t.colors.inkMuted }}>{n}</span></div>;
                  })}
                </div>
              </div>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {reviews.reviews.map(r => (
                  <li key={r.reviewId} className="p-4" style={{ background: t.colors.bgAlt }}>
                    <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">{r.rating != null && <TechStars value={r.rating} />}<span className="text-sm font-semibold">{r.customerName}</span>{r.isVerifiedPurchase && <span className="text-xs" style={{ color: t.colors.success }}>{ts('reviews.verified', 'Verified purchase')}</span>}</div>
                    {r.comments.map((c, i) => <p key={i} className="m-0 text-sm leading-relaxed" style={{ color: t.colors.inkMuted }}>{c.text}</p>)}
                    {r.sellerReply && <p className="m-0 mt-3 px-3 py-2 text-sm" style={{ background: t.colors.bg }}><strong>{ts('reviews.replyFrom', 'Reply from {{store}}:', { store: store.name })}</strong> {r.sellerReply.text}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>}

      {b.stickyBuyBar && <StickyBuyBar targetId="tx-buy" name={product.name} price={show(variant.price)} disabled={!canBuy} loading={busy} onAdd={() => add(false)} label={addLabel} />}
      {writingReview && (
        <ReviewEditDialog review={myReviews.get(product._id)} target={{ productId: product._id, productName: product.name, variantId: variant._id }}
          onClose={() => setWritingReview(false)} onSaved={() => { setWritingReview(false); reloadMyReviews(); setReviewsTick(n => n + 1); }} />
      )}
      {zoom && <TechImageLightbox images={images} index={imageIndex} alt={product.name} onIndexChange={setImageIndex} onClose={() => setZoom(false)} />}
    </ProductPageContext.Provider>
  );
}
