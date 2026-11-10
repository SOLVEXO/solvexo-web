import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { VendorLink } from '@/features/storefront-themes/core/VendorLink';
import { ShoppingBag, Minus, Plus } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import type { ProductVariant } from '@/api/services/marketplace';
import { apiGetPublicStoreProducts, type PublicStoreProduct } from '@/api/services/store';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCartContext } from '@/contexts/CartContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { useProductById } from '@/hooks/marketplace/useProductById';
import { useRecordProductView } from '@/hooks/marketplace/useRecordProductView';
import { useLocalize } from '@/hooks/useLocalize';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import { displayMoney, saleInfo } from '../../core/money';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { useJsonLd } from '../../core/hooks/useJsonLd';
import { breadcrumbJsonLd, pageUrlBuilder, productJsonLd } from '../../core/seo/jsonLd';
import { clampQty, resolveQtyRules } from '../../sellingRules';
import { stockState, variantCanBuy, variantMaxQty } from '../../variantAvailability';
import { useCartDrawer } from '../../cartDrawerContext';
import { LedupBox, LedupBreadcrumbs, LedupButton, LedupError, LedupSkeleton } from '../ui/ledupUi';
import { LedupProductCard } from '../components/LedupProductCard';
import { ledupTheme as t } from '../theme.config';
import { Link as WholesaleLink } from 'react-router-dom';
import { BundleIncludes } from '../../core/merchandising/BundleIncludes';
import { productPreorderNote } from '../../core/merchandising/purchaseNotes';
import { useWholesaleGate, useWholesalePrice } from '../../core/b2b/useWholesale';

/** `/product/:slug`. Gallery card on the left; title, price, a technical-characteristics table (reference, every option as pills) and the buy row on the right; related products below. */
export function LedupProductPage() {
  const { slug = '' } = useParams();
  // keyed by slug so the picked options, quantity and gallery position reset when another product opens
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

  const [picked, setPicked] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [gallery, setGallery] = useState<{ vid: string; i: number }>({ vid: '', i: 0 });
  const [related, setRelated] = useState<PublicStoreProduct[]>([]);

  const optionNames = useMemo(() => Array.from(new Set(variants.flatMap(v => (v.options ?? []).map(o => o.name)))), [variants]);
  const variant: ProductVariant | null = useMemo(() => {
    if (!variants.length) return null;
    const exact = variants.find(v => optionNames.every(n => !picked[n] || v.options?.find(o => o.name === n)?.value === picked[n]));
    return exact ?? detail?.defaultVariant ?? variants[0];
  }, [variants, optionNames, picked, detail?.defaultVariant]);

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

  const categoryId = detail?.product.categoryId;
  const productId = detail?.product._id;
  useEffect(() => {
    if (!categoryId) return;
    let off = false;
    apiGetPublicStoreProducts(store.storeId, { categoryId, limit: 5 })
      .then(r => { if (!off) setRelated((r.data?.products ?? []).filter(p => p._id !== productId).slice(0, 4)); })
      .catch(() => {});
    return () => { off = true; };
  }, [store.storeId, categoryId, productId]);

  const images = useMemo(() => {
    const own = variant?.images?.filter(Boolean) ?? [];
    const all = detail?.product.images ?? [];
    return [...own, ...all.filter(i => !own.includes(i))];
  }, [variant, detail?.product.images]);
  const imageIndex = gallery.vid === (variant?._id ?? '') ? Math.min(gallery.i, Math.max(0, images.length - 1)) : 0;

  // Wholesale gate + price: hooks stay above the early return below.
  const wholesale = useWholesaleGate();
  const wholesalePrice = useWholesalePrice(variant?._id, qty, wholesale.approved);

  const { origin, pathname } = window.location;
  const pageUrl = `${origin}${pathname}`;
  useStorefrontSeo({ title: product?.name, description: product?.description?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160), image: images[0] });
  useJsonLd('product', product && variant ? productJsonLd({
    name: product.name, description: product.description, images, sku: variant.sku, vendor: detail?.product.vendor,
    price: variant.price, currency: String(variant.currency ?? store.baseCurrency ?? ''), inStock: variantCanBuy(variant, isDigital),
    url: pageUrl, origin,
  }) : null);
  useJsonLd('breadcrumb', product ? breadcrumbJsonLd([{ name: store.name, url: pageUrlBuilder(origin, pathname)('/') }, { name: product.name, url: pageUrl }]) : null);

  if (loading) {
    return (
      <LedupBox>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <LedupSkeleton h={480} />
          <div className="flex flex-col gap-4"><LedupSkeleton h={40} /><LedupSkeleton h={24} /><LedupSkeleton h={180} /><LedupSkeleton h={50} /></div>
        </div>
      </LedupBox>
    );
  }
  if ((error && !detail) || !detail || !product || !variant) {
    return <LedupBox><LedupError message={ts('product.loadError', "We couldn't load this product.")} onRetry={refetch} /></LedupBox>;
  }

  const base = String(variant.currency ?? store.baseCurrency ?? currency);
  const ref = { productId: detail.product._id, variantId: variant._id };
  const conv = { currency, convert, canConvert };
  const show = (n: number, compare = false) => displayMoney(conv, n, base, { ...ref, compare });
  const sale = saleInfo({ ...conv, fixedPriceFor }, variant.price, variant.compareAtPrice, base, ref);
  const state = stockState(variant, isDigital, store.lowStockThreshold);
  const canBuy = variantCanBuy(variant, isDigital);
  // Shared parity pieces (same behaviour as Maison / Tech): pre-order note, wholesale gate + price.
  const pre = productPreorderNote(detail.product, variant);
  const maxQty = variantMaxQty(variant, isDigital);
  const rules = resolveQtyRules(detail.product, Number.isFinite(maxQty) ? maxQty : 999);
  const safeQty = clampQty(qty, rules);
  const busy = adding === variant._id;
  const mainImage = images[imageIndex] ?? '';
  const description = product.description ? sanitizeHtml(product.description) : '';
  const short = product.shortDescription?.trim();

  const add = async () => {
    const ok = await addToCart(detail.product._id, variant._id, isDigital ? 'digital' : 'physical', safeQty);
    if (ok && drawerMounted) openDrawer(); else if (ok) navigate('/cart');
  };

  const rowCls = 'grid grid-cols-[minmax(0,1fr)_2.2fr] items-center gap-4 border-b border-[#e2dedb] py-5 last:border-b-0';
  const labelCls = 'font-medium text-stone-600';

  return (
    <div className="ld-split-bg py-8">
      <LedupBox padY={false}>
        <LedupBreadcrumbs items={[{ label: ts('pg.home', 'Home'), to: '/' }, { label: product.name }]} />

        <div className="mt-6 grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-6">
            <div className="relative flex aspect-square w-full items-center justify-center rounded-3xl bg-white p-8 sm:p-12">
              {mainImage
                ? <img src={mainImage} alt={product.name} className="max-h-full max-w-full object-contain transition duration-300" />
                : <div className="text-sm text-stone-300">{ts('ld.noImage', 'No image')}</div>}
            </div>
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button key={img + i} type="button" aria-label={ts('product.showImage', 'Show image {{n}}', { n: i + 1 })} aria-current={imageIndex === i}
                    onClick={() => setGallery({ vid: variant._id, i })}
                    className={`relative aspect-square h-20 w-20 shrink-0 rounded-2xl border bg-white p-2 transition ${imageIndex === i ? 'border-[var(--ld-accent)] ring-2 ring-[var(--ld-accent)]/20' : 'border-stone-200 hover:border-stone-400'}`}>
                    <img src={img} alt="" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col lg:col-span-6">
            {detail.product.vendor && <p className="m-0 mb-1 text-xs font-medium uppercase tracking-wider text-stone-400"><VendorLink name={detail.product.vendor} /></p>}
            <h1 className="m-0 text-[clamp(32px,4vw,48px)] font-bold uppercase leading-tight tracking-tight" style={{ fontFamily: t.fonts.display, color: 'var(--ld-accent)' }}>{product.name}</h1>
            {short && <p className="mt-2 text-sm font-normal leading-relaxed text-stone-500">{short}</p>}

            <div className="mt-6 flex flex-wrap items-baseline gap-3">
              {!wholesale.locked && <span className="text-2xl font-bold" style={{ color: sale.onSale ? t.colors.danger : t.colors.price }}>{show(variant.price)}</span>}
              {!wholesale.locked && sale.onSale && <s className="text-base text-stone-400">{show(sale.compareAmount, true)}</s>}
            </div>

            <div className="mt-8 border-t border-stone-200/80 pt-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-stone-900">{ts('ld.technicalSpecs', 'Technical characteristics')}</h2>
              <div className="flex flex-col text-xs sm:text-sm">
                {variant.sku && (
                  <div className={rowCls}><span className={labelCls}>{ts('ld.reference', 'Reference')}</span><span className="ld-spec-pill ld-spec-pill-active"><bdi>{variant.sku}</bdi></span></div>
                )}
                {optionNames.map(name => {
                  const values = Array.from(new Set(variants.map(v => v.options?.find(o => o.name === name)?.value).filter((v): v is string => !!v)));
                  const current = variant.options?.find(o => o.name === name)?.value;
                  return (
                    <div key={name} className={rowCls} role="group" aria-label={name}>
                      <span className={labelCls}>{name}</span>
                      <div className="flex flex-wrap items-center gap-2">
                        {values.map(val => (
                          <button key={val} type="button" aria-pressed={current === val}
                            onClick={() => setPicked(p => ({ ...p, [name]: val }))}
                            className={`ld-spec-pill ${current === val ? 'ld-spec-pill-active' : 'ld-spec-pill-idle'}`}>{val}</button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {(detail.product.tags ?? []).length > 0 && (
                  <div className={rowCls}>
                    <span className={labelCls}>{ts('ld.tags', 'Tags')}</span>
                    <div className="flex flex-wrap items-center gap-2">{detail.product.tags!.slice(0, 8).map(tag => <span key={tag} className="ld-spec-pill ld-spec-pill-idle">{tag}</span>)}</div>
                  </div>
                )}
              </div>
            </div>

            <p className="mt-4 text-xs font-medium" style={{ color: state === 'sold_out' ? t.colors.danger : t.colors.success }} aria-live="polite">
              {state === 'sold_out' ? ts('product.soldOut', 'Sold out') : state === 'low' ? ts('product.lowStock', 'Low stock') : state === 'preorder' ? ts('product.preorder', 'Pre-order') : ts('product.inStock', 'In stock')}
            </p>

            {wholesale.locked && (
              <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-stone-200 p-4">
                <p className="m-0 text-sm font-medium">{ts('b2b.locked_title', 'Wholesale customers only')}</p>
                <p className="m-0 text-xs text-stone-500">{wholesale.signedIn ? ts('b2b.locked_apply', 'Prices and ordering are for approved wholesale accounts. Apply for one to start buying.') : ts('b2b.locked_signin', 'Sign in with your wholesale account to see prices and order.')}</p>
                <WholesaleLink to={wholesale.signedIn ? '/wholesale' : '/login'} className="text-sm font-medium underline">{wholesale.signedIn ? ts('b2b.apply_link', 'Apply for wholesale') : ts('b2b.signin_link', 'Sign in')}</WholesaleLink>
              </div>
            )}
            {!wholesale.locked && pre && <p className="mt-3 text-sm font-medium text-stone-600" role="status">{pre}</p>}
            {!wholesale.locked && wholesalePrice?.available && wholesalePrice.unitPrice != null && (
              <div role="status" className="mt-3 text-sm text-stone-900">
                <p className="m-0 font-medium">{ts('b2b.your_price', 'Your wholesale price: {{price}} each', { price: show(wholesalePrice.unitPrice) })}</p>
                {(wholesalePrice.priceBreaks ?? []).length > 0 && <p className="m-0 mt-1 text-xs text-stone-500">{(wholesalePrice.priceBreaks ?? []).map((b) => `${b.minQty}+ → ${show(b.price)}`).join(' · ')}</p>}
              </div>
            )}
            {!wholesale.locked && wholesalePrice && !wholesalePrice.available && wholesalePrice.error && <p role="alert" className="mt-2 text-xs font-medium" style={{ color: t.colors.danger }}>{wholesalePrice.error}</p>}
            {!wholesale.locked && <div className="mt-3"><BundleIncludes bundle={detail.bundle} ink={t.colors.ink} inkMuted={t.colors.inkMuted} /></div>}

            {!wholesale.locked && <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center rounded-full border border-stone-300 bg-white px-3 py-1.5">
                <button type="button" aria-label={ts('product.decreaseQty', 'Decrease quantity')} disabled={safeQty <= rules.min} onClick={() => setQty(clampQty(safeQty - rules.step, rules))} className="p-1 text-stone-500 hover:text-stone-900 disabled:opacity-30"><Minus size={14} aria-hidden /></button>
                <span className="w-10 text-center text-sm font-semibold text-stone-900" aria-live="polite">{safeQty}</span>
                <button type="button" aria-label={ts('product.increaseQty', 'Increase quantity')} disabled={safeQty >= rules.max} onClick={() => setQty(clampQty(safeQty + rules.step, rules))} className="p-1 text-stone-500 hover:text-stone-900 disabled:opacity-30"><Plus size={14} aria-hidden /></button>
              </div>
              <LedupButton variant="primary" onClick={add} loading={busy} disabled={!canBuy} className="!h-12 !px-8 flex-1">
                <ShoppingBag size={16} aria-hidden /> {!canBuy ? ts('product.soldOut', 'Sold out') : pre ? ts('product.preorder', 'Pre-order') : ts('product.addToCart', 'Add to cart')}
              </LedupButton>
            </div>}

            {description && (
              <div className="mt-10 border-t border-stone-200/80 pt-6">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-900">{ts('product.description', 'Description')}</h2>
                <div className="prose prose-sm max-w-none text-stone-600" dangerouslySetInnerHTML={{ __html: description }} />
              </div>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-24 border-t border-stone-200 pt-12">
            <div className="mb-8 inline-block">
              <span className="inline-flex rounded-full bg-[var(--ld-accent)] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white">{ts('ld.relatedProducts', 'Related products')}</span>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
              {related.map(p => <LedupProductCard key={p._id} product={p} currency={currency} />)}
            </div>
          </div>
        )}
      </LedupBox>
    </div>
  );
}
