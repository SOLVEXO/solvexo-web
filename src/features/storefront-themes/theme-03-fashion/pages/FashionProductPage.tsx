import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { imgProps } from '../components/imgProps';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, Star, ZoomIn } from 'lucide-react';
import type { ProductVariant } from '@/api/services/marketplace';
import { apiGetProductReviews, type ProductReviewEntry, type ProductReviewStats } from '@/api/services/rating';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCartContext } from '@/contexts/CartContext';
import { TokenStorage, isGuestUser } from '@/api/services/auth';
import { useReviewedProducts } from '../../useReviewedProducts';
import { ReviewEditDialog } from './account/ReviewEditDialog';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { useProductById } from '@/hooks/marketplace/useProductById';
import { useRecordProductView } from '@/hooks/marketplace/useRecordProductView';
import { useLocalize } from '@/hooks/useLocalize';
import { renderRichText } from '@/utils/richText';
import { moneyText } from '../../core/money';
import { ProductPageContext } from '../../productContext';
import { recordRecentlyViewed } from '../../moreSections';
import { resolveProductMainLayout, splitProductTemplateSections } from '../../productPageLayout';
import { clampQty, preorderLabel, qtyRuleHint, resolveQtyRules } from '../../sellingRules';
import { optionValueAvailable, stockState, variantAvailable, variantCanBuy, variantMaxQty } from '../../variantAvailability';
import { ProductShareButton, ProductSku, ProductSpecsBlock, ProductWishlistButton } from '../components/product/ProductParts';
import { ProductBuyNowButton, ProductCollapsibleTab, ProductSizeChart } from '../components/product/ProductExtraBlocks';
import { FashionImageLightbox } from '../components/product/FashionImageLightbox';
import { StickyBuyBar } from '../components/product/StickyBuyBar';
import { ProductDelivery } from '../components/product/ProductDelivery';
import { useCartDrawer } from '../../cartDrawerContext';
import { FashionSectionRenderer } from '../sections';
import { FashionButton } from '../components/FashionButton';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { useJsonLd } from '../../core/hooks/useJsonLd';
import { fashionTheme as t } from '../theme.config';
import { FashionNotFoundPage } from './FashionNotFoundPage';
import { ErrorBlock, PageSkeleton } from './pageParts';
import { useTemplateSections } from '../../core/pageHooks';

const stars = (n: number, size = 15) => (
  <span className="inline-flex" aria-hidden>{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={size} fill={i < Math.round(n) ? t.colors.star : 'none'} stroke="#FB923C" />)}</span>
);

/** `/product/:slug` — gallery on the left, buy box on the right, then the seller's own template sections and reviews. */
export function FashionProductPage() {
  const { slug = '' } = useParams();
  // keyed by slug so picked options, quantity and gallery position reset when the shopper opens another product
  return <ProductPageInner key={slug} slug={slug} />;
}

function ProductPageInner({ slug }: { slug: string }) {
  const { store } = useStorefront();
  const navigate = useNavigate();
  const { t: tr } = useTranslation('storefront');
  const { addToCart, adding } = useCartContext();
  const { openDrawer, mounted: drawerMounted } = useCartDrawer();
  const { currency, convert, canConvert } = useCurrencyPreference();
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
  // The gallery position belongs to the chosen variant: picking another variant starts at that variant's own photo.
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

  // Fetch every gallery photo up front so switching thumbnails or variants shows the next one at once.
  useEffect(() => {
    images.forEach(src => {
      const p = imgProps(src, [480, 768, 1024, 1440], '(min-width: 1024px) 58vw, 100vw');
      const img = new Image();
      if ('sizes' in p && p.sizes) img.sizes = p.sizes;
      if ('srcSet' in p && p.srcSet) img.srcset = p.srcSet;
      img.src = p.src;
    });
  }, [images]);

  useStorefrontSeo({ title: product?.name, description: product?.description?.replace(/\s+/g, ' ').slice(0, 160), image: images[0] });
  useJsonLd('product', product && variant ? {
    '@context': 'https://schema.org', '@type': 'Product', name: product.name,
    description: product.description?.replace(/\s+/g, ' ').slice(0, 300) || undefined,
    image: images.slice(0, 6), sku: variant.sku || undefined,
    brand: detail?.product.vendor ? { '@type': 'Brand', name: detail.product.vendor } : undefined,
    offers: {
      '@type': 'Offer', url: window.location.href, price: variant.price, priceCurrency: String(variant.currency ?? store.baseCurrency ?? ''),
      availability: variantCanBuy(variant, isDigital) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    ...(reviews && reviews.stats.totalReviews > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: reviews.stats.averageRating, reviewCount: reviews.stats.totalReviews } } : {}),
  } : null);

  if (loading) return <PageSkeleton />;
  if (error && !detail) return /not found|404/i.test(error) ? <FashionNotFoundPage /> : <ErrorBlock message={tr('product.loadError', "We couldn't load this product.")} onRetry={refetch} />;
  if (!detail || !product || !variant) return <FashionNotFoundPage />;

  const base = String(variant.currency ?? store.baseCurrency ?? currency);
  const show = (n: number) => (canConvert(base, currency) ? moneyText(convert(n, base), currency) : '—');
  const state = stockState(variant, isDigital, store.lowStockThreshold);
  const canBuy = variantCanBuy(variant, isDigital);
  const rules = resolveQtyRules(detail.product, Number.isFinite(variantMaxQty(variant, isDigital)) ? variantMaxQty(variant, isDigital) : 999);
  const safeQty = clampQty(qty, rules);
  const onSale = variant.compareAtPrice != null && variant.compareAtPrice > variant.price;
  const percentOff = onSale ? Math.round((1 - variant.price / (variant.compareAtPrice as number)) * 100) : 0;
  const pre = preorderLabel(detail.product);
  const busy = adding === variant._id;
  const rating = reviews?.stats.averageRating ?? detail.product.averageRating ?? 0;
  const reviewCount = reviews?.stats.totalReviews ?? detail.product.totalRatings ?? 0;

  const add = async (goCheckout = false) => {
    const ok = await addToCart(detail.product._id, variant._id, isDigital ? 'digital' : 'physical', safeQty);
    if (!ok) return;
    if (goCheckout) navigate('/checkout'); else if (drawerMounted) openDrawer();
  };

  const info: Record<string, (settings: Record<string, unknown>) => ReactNode> = {
    product_title: () => (
      <div>
        {detail.product.vendor && t.showVendor && <p className="m-0 mb-2 text-sm font-medium" style={{ color: t.colors.inkMuted }}>{detail.product.vendor}</p>}
        <h1 className="m-0 text-[clamp(28px,3.4vw,42px)] font-semibold leading-[1.1] tracking-tight">{product.name}</h1>
      </div>
    ),
    product_rating: () => reviewCount > 0 || rating > 0 ? (
      <a href="#fx-reviews" className="inline-flex items-center gap-3 no-underline" style={{ color: t.colors.ink }}>
        {stars(rating)}<span className="text-sm font-medium">{rating.toFixed(1)}</span><span className="text-sm" style={{ color: t.colors.inkMuted }}>{tr('reviews.count', '{{count}} reviews', { count: reviewCount })}</span>
      </a>
    ) : null,
    product_price: () => (
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[28px] font-semibold" style={{ color: onSale ? t.colors.danger : t.colors.price }}>{show(variant.price)}</span>
        {onSale && <><span className="text-xl line-through opacity-50">{show(variant.compareAtPrice as number)}</span><span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: `color-mix(in srgb, ${t.colors.danger} 12%, transparent)`, color: t.colors.danger }}>{tr('product.savePercent', 'Save {{percent}}%', { percent: percentOff })}</span></>}
      </div>
    ),
    product_description: s => product.description ? (
      <div>
        {typeof s.heading === 'string' && s.heading.trim() && <h2 className="m-0 mb-3 text-lg font-semibold">{s.heading}</h2>}
        <div className="text-base leading-[1.75]" style={{ color: t.colors.inkMuted }}>{renderRichText(product.description)}</div>
      </div>
    ) : null,
    product_variant_picker: s => optionNames.length === 0 ? null : (
      <div className="flex flex-col gap-5">
        {optionNames.map(name => {
          const values = Array.from(new Set(variants.map(v => v.options?.find(o => o.name === name)?.value).filter((v): v is string => !!v)));
          const current = variant.options?.find(o => o.name === name)?.value;
          if (s.pickerStyle === 'dropdown') {
            return (
              <label key={name} className="flex flex-col gap-2 text-sm font-medium">
                {name}
                <select value={current ?? ''} onChange={e => setPicked(p => ({ ...p, [name]: e.target.value }))}
                  className="cursor-pointer bg-transparent px-4 py-3 text-sm font-normal" style={{ borderRadius: 9999, border: `1px solid ${t.colors.border}`, color: t.colors.ink }}>
                  {values.map(v => <option key={v} value={v}>{v}{optionValueAvailable(variants, variant, name, v, isDigital) ? '' : ` — ${tr('product.soldOut', 'Sold out')}`}</option>)}
                </select>
              </label>
            );
          }
          return (
            <fieldset key={name} className="m-0 border-0 p-0">
              <legend className="mb-3 p-0 text-sm font-medium">{name}: <span style={{ color: t.colors.inkMuted }}>{current}</span></legend>
              <div className="flex flex-wrap gap-2">
                {values.map(v => {
                  const on = current === v;
                  const ok = optionValueAvailable(variants, variant, name, v, isDigital);
                  return (
                    <button key={v} type="button" aria-pressed={on} onClick={() => setPicked(p => ({ ...p, [name]: v }))}
                      className="min-w-12 cursor-pointer px-4 py-2.5 text-sm font-medium transition-colors"
                      style={{ borderRadius: 9999, border: `1px solid ${on ? t.colors.ink : t.colors.border}`, background: on ? t.colors.ink : 'transparent', color: on ? t.colors.bg : t.colors.ink, opacity: ok ? 1 : 0.45, textDecoration: ok ? undefined : 'line-through' }}>{v}</button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>
    ),
    product_quantity: () => (
      <div>
        <p className="m-0 mb-3 text-sm font-medium">{tr('product.quantity', 'Quantity')}</p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="inline-flex items-center" style={{ border: `1px solid ${t.colors.border}`, borderRadius: 9999 }}>
            <button type="button" aria-label={tr('product.decreaseQty', 'Decrease quantity')} disabled={safeQty <= rules.min} onClick={() => setQty(clampQty(safeQty - rules.step, rules))} className="grid size-11 cursor-pointer place-items-center border-0 bg-transparent disabled:opacity-40"><Minus size={15} /></button>
            <span className="min-w-10 text-center text-sm font-medium" aria-live="polite">{safeQty}</span>
            <button type="button" aria-label={tr('product.increaseQty', 'Increase quantity')} disabled={safeQty >= rules.max} onClick={() => setQty(clampQty(safeQty + rules.step, rules))} className="grid size-11 cursor-pointer place-items-center border-0 bg-transparent disabled:opacity-40"><Plus size={15} /></button>
          </div>
          {t.showStockStatus && <span className="text-sm" style={{ color: state === 'low' ? t.colors.danger : state === 'sold_out' ? t.colors.danger : t.colors.success }}>
            {state === 'sold_out' ? tr('product.soldOut', 'Sold out') : state === 'low' ? tr('product.onlyLeft', 'Only {{count}} left', { count: variantAvailable(variant, isDigital) }) : state === 'backorder' ? tr('product.backorder', 'Available on backorder') : tr('product.inStock', 'In stock')}
          </span>}
        </div>
        {qtyRuleHint(rules) && <p className="m-0 mt-2 text-xs" style={{ color: t.colors.inkMuted }}>{qtyRuleHint(rules)}</p>}
      </div>
    ),
    product_buy_buttons: s => {
      // The seller's own button wording wins; blank keeps the theme's (translated) text.
      const own = (k: string) => (typeof s[k] === 'string' && (s[k] as string).trim() ? (s[k] as string).trim() : null);
      return (
        <div id="fx-buy" className="flex flex-col gap-3">
          {pre && <p className="m-0 text-sm font-medium" style={{ color: t.colors.inkMuted }}>{pre}</p>}
          <FashionButton arrow fullWidth disabled={!canBuy} loading={busy} onClick={() => add(false)}>{!canBuy ? (own('soldOutLabel') ?? tr('product.soldOut', 'Sold out')) : pre ? (own('preorderLabel') ?? tr('product.preorder', 'Pre-order')) : busy ? tr('product.adding', 'Adding…') : (own('addToCartLabel') ?? tr('product.addToCart', 'Add to cart'))}</FashionButton>
        </div>
      );
    },
    product_buy_now: s => <ProductBuyNowButton settings={s} disabled={!canBuy} loading={busy} onBuy={() => add(true)} />,
    product_wishlist: () => <ProductWishlistButton productId={detail.product._id} variantId={variant._id} />,
    product_share: () => <ProductShareButton title={product.name} />,
    product_sku: () => <ProductSku sku={variant.sku} />,
    product_specs: () => <ProductSpecsBlock storeId={store.storeId} productId={detail.product._id} />,
    product_collapsible_tab: s => <ProductCollapsibleTab settings={s} />,
    product_size_chart: s => <ProductSizeChart settings={s} />,
  };

  return (
    <ProductPageContext.Provider value={{ productId: detail.product._id, categoryId: detail.product.categoryId ?? null, subCategoryId: detail.product.subCategoryId ?? null, complementaryProductIds: detail.product.complementaryProductIds ?? [] }}>
      {before.length > 0 && <FashionSectionRenderer sections={before} />}
      <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth, padding: `clamp(20px, 3vw, 40px) ${t.layout.containerPadX} clamp(40px, 6vw, 88px)` }}>
        {t.showBreadcrumbs && <nav aria-label={tr('product.breadcrumb', 'Breadcrumb')} className="mb-6 text-sm" style={{ color: t.colors.inkMuted }}>
          <Link to="/" className="no-underline" style={{ color: 'inherit' }}>{tr('product.crumbHome', 'Home')}</Link> <span aria-hidden>/</span> <Link to="/search" className="no-underline" style={{ color: 'inherit' }}>{tr('product.crumbShop', 'Shop')}</Link> <span aria-hidden>/</span> <span style={{ color: t.colors.ink }}>{product.name}</span>
        </nav>}
        <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-12">
          {layout.mediaOn && (
            <div className="lg:sticky lg:top-24 lg:col-span-7">
              {images.length === 0 ? <div style={{ aspectRatio: '4 / 5', background: t.colors.bgAlt, borderRadius: 24 }} /> : (
                <div className="flex flex-col gap-4 md:flex-row-reverse">
                  <button type="button" onClick={() => setZoom(true)} aria-label={tr('product.zoomImage', 'Zoom image')} className="group relative flex-1 cursor-zoom-in overflow-hidden border-0 p-0" style={{ aspectRatio: '4 / 5', background: t.colors.bgAlt, borderRadius: 24 }}>
                    <img key={images[imageIndex] ?? images[0]} {...imgProps(images[imageIndex] ?? images[0], [480, 768, 1024, 1440], '(min-width: 1024px) 58vw, 100vw')} alt={product.name} className="fx-fade size-full object-cover" fetchPriority="high" />
                    <span className="absolute bottom-4 right-4 grid size-10 place-items-center rounded-full opacity-0 transition-opacity group-hover:opacity-100" style={{ background: t.colors.bg }}><ZoomIn size={18} /></span>
                  </button>
                  {images.length > 1 && (
                    <div className="fx-hide-scroll flex gap-3 overflow-x-auto md:w-[84px] md:flex-col md:overflow-y-auto md:overflow-x-hidden" style={{ maxHeight: 'min(640px, 70vh)' }}>
                      {images.map((src, i) => (
                        <button key={src + i} type="button" onClick={() => setImageIndex(i)} aria-label={tr('product.showImageN', 'Show image {{n}}', { n: i + 1 })} aria-current={i === imageIndex}
                          className="size-20 shrink-0 cursor-pointer overflow-hidden p-0 md:size-[84px]" style={{ borderRadius: 14, background: t.colors.bgAlt, border: `2px solid ${i === imageIndex ? t.colors.ink : 'transparent'}` }}>
                          <img {...imgProps(src, [160, 240], '84px')} alt="" loading="lazy" className="size-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <div className={`flex flex-col gap-6 ${layout.mediaOn ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
            {layout.infoItems.map(item => {
              const node = info[item.type]?.(item.settings);
              return node ? <div key={item.key}>{node}</div> : null;
            })}
            {t.showDelivery && !isDigital && <ProductDelivery storeId={store.storeId} />}
          </div>
        </div>
      </div>

      {t.showReviews && <section id="fx-reviews" style={{ background: t.colors.bgAlt, padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}` }}>
        <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth }}>
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <h2 className="m-0 text-[clamp(24px,3vw,36px)] font-semibold tracking-tight">{tr('reviews.title', 'Customer reviews')}</h2>
            <button type="button" className="fx-pill cursor-pointer" style={{ border: `1px solid ${t.colors.border}`, color: t.colors.ink, background: 'transparent', borderRadius: t.buttonRadiusPx }}
              onClick={() => { if (!TokenStorage.isLoggedIn() || isGuestUser()) { navigate('/login'); return; } setWritingReview(true); }}>
              {myReviews.has(product._id) ? tr('reviews.editYours', 'Edit your review') : tr('reviews.write', 'Write a review')}
            </button>
          </div>
          {!reviews || reviews.reviews.length === 0 ? (
            <p className="m-0 text-base" style={{ color: t.colors.inkMuted }}>{reviews ? tr('reviews.noneYet', 'No reviews yet. Be the first to share what you think.') : tr('reviews.loadingReviews', 'Loading reviews…')}</p>
          ) : (
            <div className="grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <p className="m-0 text-5xl font-semibold">{reviews.stats.averageRating.toFixed(1)}</p>
                <div className="mt-2">{stars(reviews.stats.averageRating, 18)}</div>
                <p className="m-0 mt-2 text-sm" style={{ color: t.colors.inkMuted }}>{tr('reviews.count', '{{count}} reviews', { count: reviews.stats.totalReviews })}</p>
                <div className="mt-5 flex flex-col gap-2">
                  {(['5', '4', '3', '2', '1'] as const).map(k => {
                    const n = reviews.stats.ratingBreakdown[k] ?? 0;
                    const pct = reviews.stats.totalReviews ? (n / reviews.stats.totalReviews) * 100 : 0;
                    return <div key={k} className="flex items-center gap-3 text-xs"><span className="w-3">{k}</span><span className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: t.colors.border }}><span className="block h-full rounded-full" style={{ width: `${pct}%`, background: t.colors.ink }} /></span><span className="w-6 text-right" style={{ color: t.colors.inkMuted }}>{n}</span></div>;
                  })}
                </div>
              </div>
              <ul className="m-0 flex list-none flex-col gap-4 p-0 lg:col-span-8">
                {reviews.reviews.map(r => (
                  <li key={r.reviewId} className="p-5 md:p-6" style={{ background: t.colors.bg, borderRadius: 20 }}>
                    <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">{r.rating != null && stars(r.rating)}<span className="text-sm font-semibold">{r.customerName}</span>{r.isVerifiedPurchase && <span className="text-xs" style={{ color: t.colors.success }}>{tr('reviews.verified', 'Verified purchase')}</span>}<span className="text-xs" style={{ color: t.colors.inkMuted }}>{new Date(r.createdAt).toLocaleDateString()}</span></div>
                    {r.comments.map((c, i) => <p key={i} className="m-0 text-[15px] leading-relaxed" style={{ color: t.colors.inkMuted }}>{c.text}</p>)}
                    {r.sellerReply && <p className="m-0 mt-3 rounded-xl px-4 py-3 text-sm" style={{ background: t.colors.bgAlt }}><strong>{tr('reviews.replyFrom', 'Reply from {{store}}:', { store: store.name })}</strong> {r.sellerReply.text}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>}

      {after.length > 0 && <FashionSectionRenderer sections={after} />}
      {t.stickyBuyBar && <StickyBuyBar targetId="fx-buy" name={product.name} price={show(variant.price)} disabled={!canBuy} loading={busy} onAdd={() => add(false)} label={!canBuy ? tr('product.soldOut', 'Sold out') : pre ? tr('product.preorder', 'Pre-order') : tr('product.addToCart', 'Add to cart')} />}
      {writingReview && (
        <ReviewEditDialog review={myReviews.get(product._id)} target={{ productId: product._id, productName: product.name, variantId: variant._id }}
          onClose={() => setWritingReview(false)} onSaved={() => { setWritingReview(false); reloadMyReviews(); setReviewsTick(n => n + 1); }} />
      )}
      {zoom && <FashionImageLightbox images={images} index={imageIndex} alt={product.name} onIndexChange={setImageIndex} onClose={() => setZoom(false)} />}
    </ProductPageContext.Provider>
  );
}
