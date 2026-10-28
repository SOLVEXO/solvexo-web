import { useTranslation } from 'react-i18next';
import { AccentText } from '../ui/AccentText';
import { imgProps } from '../components/imgProps';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCartContext } from '@/contexts/CartContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { displayMoney, displayMoneyLine, displayMoneySum, type MoneyLine } from '../../core/money';
import { cartLineRules, cartQtyHint, clampQty, stepQty } from '../../sellingRules';
import { FashionSectionRenderer } from '../sections';
import { FashionButton } from '../components/FashionButton';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { fashionTheme as t } from '../theme.config';
import { PageBox } from './pageParts';
import { splitAround, useTemplateSections } from '../../core/pageHooks';
import { ts } from '@/utils/tStatic';

/** `/cart` — line items with quantity steppers on the left, order summary on the right. */
export function FashionCartPage() {
  const { t: tr } = useTranslation('storefront');
  const { store } = useStorefront();
  const navigate = useNavigate();
  const { cart, loading, error, setQty, removeItem, adding, refetch } = useCartContext();
  const { currency, convert, canConvert } = useCurrencyPreference();
  const split = splitAround(useTemplateSections(store.storeId, 'page', 'cart'), 'cart_items');
  // This page draws the order summary itself; the template's `cart_summary` section is an editor-only placeholder.
  const before = split.before.filter(s => s.type !== 'cart_summary');
  const after = split.after.filter(s => s.type !== 'cart_summary');
  useStorefrontSeo({ title: ts('footer.cart', 'Cart'), noindex: true });

  const items = cart?.items ?? [];
  const base = String(store.baseCurrency ?? currency);
  const unit = (i: (typeof items)[number]) => i.unitPrice ?? i.price ?? 0;
  // No rate for the buyer's currency: amounts stay in the store's own currency (never a wrong symbol).
  const conv = { currency, convert, canConvert };
  // The market's fixed price (if the seller set one) is per unit: convert the unit price, then multiply by the quantity (like checkout).
  const lineOf = (i: (typeof items)[number]): MoneyLine => ({ amount: unit(i) * i.quantity, from: i.currency ?? base, unit: unit(i), qty: i.quantity, ref: { productId: i.productId, variantId: i.productVariantId } });
  const subtotalText = displayMoneySum(conv, items.map(lineOf));
  const count = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <>
      {before.length > 0 && <FashionSectionRenderer sections={before} />}
      <PageBox>
        <h1 className="m-0 mb-8 text-[clamp(28px,4vw,48px)] font-medium leading-[1.1] tracking-tight"><AccentText text={tr('h.your_cart', 'Your *cart*')} size="1em" /></h1>

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
                const rules = cartLineRules(i);
                const hint = cartQtyHint(i);
                const prev = stepQty(i.quantity, -1, rules);
                const next = stepQty(i.quantity, 1, rules);
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
                          {hint && <p className="m-0 mt-1 text-xs" style={{ color: t.colors.inkMuted }}>{hint}</p>}
                          {i.quantity > 1 && <p className="m-0 mt-1 text-sm" style={{ color: t.colors.inkMuted }}>{displayMoney(conv, unit(i), i.currency ?? base, lineOf(i).ref)} {tr('cart.each', 'each')}</p>}
                        </div>
                        <p className="m-0 shrink-0 text-base font-semibold">{displayMoneyLine(conv, lineOf(i))}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center" style={{ border: `1px solid ${t.colors.border}`, borderRadius: 9999 }}>
                          <button type="button" aria-label={tr('cart.decreaseQty', 'Decrease quantity of {{name}}', { name: i.name })} disabled={busy || prev === null} onClick={() => prev !== null && setQty(i.productId, i.productVariantId, prev)} className="grid size-9 cursor-pointer place-items-center border-0 bg-transparent disabled:opacity-40"><Minus size={14} /></button>
                          <input type="text" inputMode="numeric" aria-label={tr('cart.quantityOf', 'Quantity of {{name}}', { name: i.name })} key={i.quantity} defaultValue={i.quantity} disabled={busy}
                            onBlur={e => { const n = parseInt(e.target.value, 10); const q = clampQty(Number.isFinite(n) ? n : i.quantity, rules); if (q !== i.quantity) setQty(i.productId, i.productVariantId, q); else e.target.value = String(i.quantity); }}
                            onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                            className="w-10 border-0 bg-transparent p-0 text-center text-sm font-medium outline-none" />
                          <button type="button" aria-label={tr('cart.increaseQty', 'Increase quantity of {{name}}', { name: i.name })} disabled={busy || next === null} onClick={() => next !== null && setQty(i.productId, i.productVariantId, next)} className="grid size-9 cursor-pointer place-items-center border-0 bg-transparent disabled:opacity-40"><Plus size={14} /></button>
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
                <div className="flex justify-between"><dt style={{ color: t.colors.inkMuted }}>{tr('cart.subtotalItems', 'Subtotal ({{count}} items)', { count })}</dt><dd className="m-0 font-medium">{subtotalText}</dd></div>
                <div className="flex justify-between"><dt style={{ color: t.colors.inkMuted }}>{tr('cart.shippingTaxes', 'Shipping & taxes')}</dt><dd className="m-0" style={{ color: t.colors.inkMuted }}>{tr('cart.atCheckout', 'At checkout')}</dd></div>
              </dl>
              <div className="my-5 border-0 border-t" style={{ borderColor: t.colors.border, borderTopWidth: 1, borderStyle: 'solid' }} />
              <div className="mb-6 flex items-baseline justify-between"><span className="text-base font-semibold">{tr('cart.estimatedTotal', 'Estimated total')}</span><span className="text-2xl font-semibold">{subtotalText}</span></div>
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
