import { useTranslation } from 'react-i18next';
import { imgProps } from '../components/imgProps';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCartContext } from '@/contexts/CartContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { moneyText } from '../../core/checkout/checkoutMath';
import { FashionSectionRenderer } from '../sections';
import { FashionButton } from '../components/FashionButton';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { fashionTheme as t } from '../theme.config';
import { PageBox } from './pageParts';
import { splitAround, useTemplateSections } from '../../core/pageHooks';

/** `/cart` — line items with quantity steppers on the left, order summary on the right. */
export function FashionCartPage() {
  const { t: tr } = useTranslation('storefront');
  const { store } = useStorefront();
  const navigate = useNavigate();
  const { cart, loading, error, setQty, removeItem, adding, refetch } = useCartContext();
  const { currency, convert, ratesLoaded } = useCurrencyPreference();
  const split = splitAround(useTemplateSections(store.storeId, 'page', 'cart'), 'cart_items');
  // This page draws the order summary itself; the template's `cart_summary` section is an editor-only placeholder.
  const before = split.before.filter(s => s.type !== 'cart_summary');
  const after = split.after.filter(s => s.type !== 'cart_summary');
  useStorefrontSeo({ title: 'Cart', noindex: true });

  const items = cart?.items ?? [];
  const base = String(store.baseCurrency ?? currency);
  const unit = (i: (typeof items)[number]) => i.unitPrice ?? i.price ?? 0;
  // Never print a native amount with the buyer-currency symbol: until rates load, show a dash.
  const ratesOk = ratesLoaded || items.every(i => !(i.currency ?? base) || (i.currency ?? base) === currency);
  const fmt = (n: number) => (ratesOk ? moneyText(n, currency) : '—');
  const show = (n: number, from?: string | null) => fmt(convert(n, from ?? base));
  const subtotal = items.reduce((sum, i) => sum + convert(unit(i) * i.quantity, i.currency ?? base), 0);
  const count = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <>
      {before.length > 0 && <FashionSectionRenderer sections={before} />}
      <PageBox>
        <h1 className="m-0 mb-8 text-[clamp(28px,4vw,48px)] font-medium leading-[1.1] tracking-tight">{tr('cart.yourLead', 'Your')} <span className="fx-serif">{tr('cart.yourAccent', 'cart')}</span></h1>

        {error && <div role="alert" className="mb-6 flex items-center justify-between gap-4 rounded-2xl px-5 py-4 text-sm" style={{ background: t.colors.bgAlt }}>{error}<button type="button" onClick={refetch} className="cursor-pointer border-0 bg-transparent underline">{tr('cart.retry', 'Retry')}</button></div>}

        {loading && !cart ? (
          <div aria-busy="true" className="grid gap-4">{[0, 1].map(i => <div key={i} className="h-28 animate-pulse" style={{ background: t.colors.bgAlt, borderRadius: 16 }} />)}</div>
        ) : items.length === 0 ? (
          <div className="grid place-items-center gap-4 px-6 py-20 text-center" style={{ background: t.colors.bgAlt, borderRadius: 28 }}>
            <span className="grid size-14 place-items-center rounded-full" style={{ background: t.colors.bg }}><ShoppingBag size={24} /></span>
            <p className="m-0 text-xl font-semibold">{tr('cart.cartEmpty', 'Your cart is empty')}</p>
            <p className="m-0 text-sm" style={{ color: t.colors.inkMuted }}>{tr('cart.emptyHint', "Looks like you haven't added anything yet.")}</p>
            <Link to="/search" className="fx-pill" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: t.buttonRadiusPx }}>{tr('cart.startShopping', 'Start shopping')}</Link>
          </div>
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-12">
            <ul className="m-0 flex list-none flex-col gap-4 p-0 lg:col-span-8">
              {items.map(i => {
                const key = `${i.productId}:${i.productVariantId}`;
                const img = i.image?.[0] ?? i.images?.[0];
                const busy = adding === i.productVariantId;
                return (
                  <li key={key} className="flex gap-4 p-4 md:gap-6 md:p-5" style={{ border: `1px solid ${t.colors.border}`, borderRadius: 20 }}>
                    <Link to={`/product/${i.productId}`} className="size-24 shrink-0 overflow-hidden md:size-28" style={{ background: t.colors.bgAlt, borderRadius: 14 }}>
                      {img && <img {...imgProps(img, [160, 240], '112px')} alt={i.name} className="size-full object-cover" />}
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link to={`/product/${i.productId}`} className="no-underline" style={{ color: t.colors.ink }}><h2 className="m-0 truncate text-base font-medium">{i.name}</h2></Link>
                          {(i.options?.length ?? 0) > 0 && <p className="m-0 mt-1 text-sm" style={{ color: t.colors.inkMuted }}>{i.options?.map(o => o.value).join(' / ')}</p>}
                          {i.quantity > 1 && <p className="m-0 mt-1 text-sm" style={{ color: t.colors.inkMuted }}>{show(unit(i), i.currency)} {tr('cart.each', 'each')}</p>}
                        </div>
                        <p className="m-0 shrink-0 text-base font-semibold">{show(unit(i) * i.quantity, i.currency)}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center" style={{ border: `1px solid ${t.colors.border}`, borderRadius: 9999 }}>
                          <button type="button" aria-label={tr('cart.decreaseQty', 'Decrease quantity of {{name}}', { name: i.name })} disabled={busy || i.quantity <= 1} onClick={() => setQty(i.productId, i.productVariantId, i.quantity - 1)} className="grid size-9 cursor-pointer place-items-center border-0 bg-transparent disabled:opacity-40"><Minus size={14} /></button>
                          <span className="min-w-8 text-center text-sm font-medium" aria-live="polite">{i.quantity}</span>
                          <button type="button" aria-label={tr('cart.increaseQty', 'Increase quantity of {{name}}', { name: i.name })} disabled={busy} onClick={() => setQty(i.productId, i.productVariantId, i.quantity + 1)} className="grid size-9 cursor-pointer place-items-center border-0 bg-transparent disabled:opacity-40"><Plus size={14} /></button>
                        </div>
                        <button type="button" onClick={() => removeItem(i.productId, i.productVariantId)} disabled={busy} className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent text-sm disabled:opacity-40" style={{ color: t.colors.inkMuted }}><Trash2 size={15} />{tr('cart.remove', 'Remove')}</button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <aside className="p-6 lg:sticky lg:top-24 lg:col-span-4" style={{ background: t.colors.bgAlt, borderRadius: 24 }} aria-label={tr('cart.summaryTitle', 'Order summary')}>
              <h2 className="m-0 mb-5 text-lg font-semibold">{tr('cart.summaryTitle', 'Order summary')}</h2>
              <dl className="m-0 flex flex-col gap-3 text-sm">
                <div className="flex justify-between"><dt style={{ color: t.colors.inkMuted }}>{tr('cart.subtotalItems', 'Subtotal ({{count}} items)', { count })}</dt><dd className="m-0 font-medium">{fmt(subtotal)}</dd></div>
                <div className="flex justify-between"><dt style={{ color: t.colors.inkMuted }}>{tr('cart.shippingTaxes', 'Shipping & taxes')}</dt><dd className="m-0" style={{ color: t.colors.inkMuted }}>{tr('cart.atCheckout', 'At checkout')}</dd></div>
              </dl>
              <div className="my-5 border-0 border-t" style={{ borderColor: t.colors.border, borderTopWidth: 1, borderStyle: 'solid' }} />
              <div className="mb-6 flex items-baseline justify-between"><span className="text-base font-semibold">{tr('cart.estimatedTotal', 'Estimated total')}</span><span className="text-2xl font-semibold">{fmt(subtotal)}</span></div>
              <FashionButton arrow fullWidth onClick={() => navigate('/checkout')}>{tr('cart.checkout', 'Checkout')}</FashionButton>
              <p className="m-0 mt-4 text-center text-xs" style={{ color: t.colors.inkMuted }}><Link to="/search" style={{ color: 'inherit' }}>{tr('cart.continueShoppingLower', 'Continue shopping')}</Link></p>
            </aside>
          </div>
        )}
      </PageBox>
      {after.length > 0 && <FashionSectionRenderer sections={after} />}
    </>
  );
}
