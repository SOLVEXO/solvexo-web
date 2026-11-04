import { Link, useNavigate } from 'react-router-dom';
import { ImageOff, Minus, Plus, X } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCartContext } from '@/contexts/CartContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { displayMoney, displayMoneyLine, displayMoneySum, type MoneyLine } from '../../core/money';
import { cartLineRules, cartQtyHint, clampQty, stepQty } from '../../sellingRules';
import { splitAround, useTemplateSections } from '../../core/pageHooks';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { imgProps } from '../components/imgProps';
import { TechSectionRenderer } from '../sections';
import { TechBox, TechBreadcrumbs, TechButton, TechEmpty, TechLinkButton, TechPageTitle, TechSkeleton } from '../ui/techUi';
import { techTheme as t } from '../theme.config';

/** `/cart`: item table on the left, summary on the right. Shipping, tax and discount codes are worked out at checkout (the cart has no estimator). */
export function TechCartPage() {
  const { store } = useStorefront();
  const navigate = useNavigate();
  const { cart, loading, error, setQty, removeItem, clearCart, adding, refetch } = useCartContext();
  const { currency, convert, canConvert } = useCurrencyPreference();
  const split = splitAround(useTemplateSections(store.storeId, 'page', 'cart'), 'cart_items');
  const before = split.before.filter(s => s.type !== 'cart_summary');
  const after = split.after.filter(s => s.type !== 'cart_summary');
  useStorefrontSeo({ title: ts('footer.cart', 'Cart'), noindex: true });

  const items = cart?.items ?? [];
  const hasUnavailable = items.some(i => i.unavailable);
  const base = String(store.baseCurrency ?? currency);
  const conv = { currency, convert, canConvert };
  const unit = (i: (typeof items)[number]) => i.unitPrice ?? i.price ?? 0;
  const lineOf = (i: (typeof items)[number]): MoneyLine => ({ amount: unit(i) * i.quantity, from: i.currency ?? base, unit: unit(i), qty: i.quantity, ref: { productId: i.productId, variantId: i.productVariantId } });
  const subtotal = displayMoneySum(conv, items.map(lineOf));
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const head = 'px-2 py-3 text-start text-sm font-semibold';

  return (
    <>
      {before.length > 0 && <TechSectionRenderer sections={before} />}
      <TechBox>
        <TechBreadcrumbs items={[{ label: ts('pg.home', 'Home'), to: '/' }, { label: ts('footer.cart', 'Cart') }]} />
        <TechPageTitle>{ts('cart.shoppingCart', 'Shopping cart')}</TechPageTitle>
        {error && <div role="alert" className="mb-5 flex items-center justify-between gap-4 px-4 py-3 text-sm" style={{ background: t.colors.bgAlt }}>{error}<button type="button" onClick={refetch} className="cursor-pointer border-0 bg-transparent underline" style={{ color: t.colors.ink }}>{ts('cart.retry', 'Retry')}</button></div>}

        {loading && !cart ? <TechSkeleton h={110} rows={2} /> : items.length === 0 ? (
          <TechEmpty title={ts('cart.cartEmpty', 'Your cart is empty')} text={ts('cart.emptyHint', "Looks like you haven't added anything yet.")} action={<TechLinkButton to="/search">{ts('cart.startShopping', 'Start shopping')}</TechLinkButton>} />
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px]">
            <div>
              <table className="w-full border-collapse" style={{ borderTop: `1px solid ${t.colors.border}` }}>
                <caption className="sr-only">{ts('cart.shoppingCart', 'Shopping cart')}</caption>
                <thead className="hidden md:table-header-group" style={{ borderBottom: `1px solid ${t.colors.border}` }}>
                  <tr><th scope="col" className={head}>{ts('cart.item', 'Item')}</th><th scope="col" className={head}>{ts('cart.price', 'Price')}</th><th scope="col" className={head}>{ts('cart.qty', 'Qty')}</th><th scope="col" className={head}>{ts('cart.subtotal', 'Subtotal')}</th><th scope="col" className="w-10"><span className="sr-only">{ts('cart.remove', 'Remove')}</span></th></tr>
                </thead>
                <tbody>
                  {items.map(i => {
                    const key = `${i.productId}:${i.productVariantId}`;
                    const img = i.image?.[0] ?? i.images?.[0];
                    const busy = adding === i.productVariantId;
                    const rules = cartLineRules(i);
                    const hint = cartQtyHint(i);
                    const prev = stepQty(i.quantity, -1, rules);
                    const next = stepQty(i.quantity, 1, rules);
                    const ref = { productId: i.productId, variantId: i.productVariantId };
                    return (
                      <tr key={key} className="block border-b md:table-row" style={{ borderColor: t.colors.border }}>
                        <td className="block px-2 py-4 md:table-cell">
                          <div className="flex items-center gap-4">
                            <Link to={`/product/${i.productId}`} className="grid size-24 shrink-0 place-items-center overflow-hidden" style={{ background: t.colors.bgAlt }}>
                              {img ? <img {...imgProps(img, [160, 240], '96px')} alt={i.name} className="size-full object-contain" /> : <ImageOff size={20} aria-hidden style={{ color: t.colors.inkMuted }} />}
                            </Link>
                            <div className="min-w-0">
                              <Link to={`/product/${i.productId}`} className="text-sm font-medium no-underline hover:underline" style={{ color: t.colors.ink }}>{i.name}</Link>
                              {(i.options?.length ?? 0) > 0 && <p className="m-0 mt-1 text-xs" style={{ color: t.colors.inkMuted }}>{i.options?.map(o => o.value).join(' / ')}</p>}
                              {hint && <p className="m-0 mt-1 text-xs" style={{ color: t.colors.inkMuted }}>{hint}</p>}
                              {i.unavailable && <p role="alert" className="m-0 mt-1 text-xs font-medium" style={{ color: t.colors.danger }}>{ts('cart.itemUnavailable', 'This item is no longer available. Please remove it to check out.')}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="inline-block px-2 py-2 text-sm font-medium md:table-cell">{displayMoney(conv, unit(i), i.currency ?? base, ref)}</td>
                        <td className="inline-block px-2 py-2 md:table-cell">
                          <div className="inline-flex items-center" style={{ background: t.colors.bgAlt }}>
                            <button type="button" aria-label={ts('cart.decreaseQty', 'Decrease quantity of {{name}}', { name: i.name })} disabled={busy || prev === null} onClick={() => prev !== null && setQty(i.productId, i.productVariantId, prev)} className="grid size-9 cursor-pointer place-items-center border-0 bg-transparent disabled:opacity-40" style={{ color: t.colors.ink }}><Minus size={13} /></button>
                            <input type="text" inputMode="numeric" aria-label={ts('cart.quantityOf', 'Quantity of {{name}}', { name: i.name })} key={i.quantity} defaultValue={i.quantity} disabled={busy}
                              onBlur={e => { const n = parseInt(e.target.value, 10); const q = clampQty(Number.isFinite(n) ? n : i.quantity, rules); if (q !== i.quantity) setQty(i.productId, i.productVariantId, q); else e.target.value = String(i.quantity); }}
                              onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                              className="w-9 border-0 bg-transparent p-0 text-center text-sm font-medium outline-none" style={{ color: t.colors.ink }} />
                            <button type="button" aria-label={ts('cart.increaseQty', 'Increase quantity of {{name}}', { name: i.name })} disabled={busy || next === null} onClick={() => next !== null && setQty(i.productId, i.productVariantId, next)} className="grid size-9 cursor-pointer place-items-center border-0 bg-transparent disabled:opacity-40" style={{ color: t.colors.ink }}><Plus size={13} /></button>
                          </div>
                        </td>
                        <td className="inline-block px-2 py-2 text-sm font-semibold md:table-cell">{displayMoneyLine(conv, lineOf(i))}</td>
                        <td className="inline-block px-2 py-2 md:table-cell"><button type="button" onClick={() => removeItem(i.productId, i.productVariantId)} disabled={busy} aria-label={ts('cart.removeItem', 'Remove {{name}}', { name: i.name })} className="tx-icon-btn disabled:opacity-40"><X size={14} aria-hidden /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-3">
                  <TechLinkButton to="/search" variant="outline" small>{ts('cart.continueShopping', 'Continue shopping')}</TechLinkButton>
                  <TechButton variant="dark" small onClick={() => { void clearCart(); }}>{ts('cart.clearCart', 'Clear shopping cart')}</TechButton>
                </div>
              </div>
            </div>

            <aside className="p-5 lg:sticky lg:top-24" style={{ background: t.colors.bgAlt }} aria-label={ts('cart.summaryTitle', 'Order summary')}>
              <h2 className="m-0 mb-4 text-xl font-semibold" style={{ fontFamily: t.fonts.display }}>{ts('cart.summary', 'Summary')}</h2>
              <dl className="m-0 flex flex-col gap-3 text-sm">
                <div className="flex justify-between"><dt style={{ color: t.colors.inkMuted }}>{ts('cart.subtotalItems', 'Subtotal ({{count}} items)', { count })}</dt><dd className="m-0 font-semibold">{subtotal}</dd></div>
                <div className="flex justify-between"><dt style={{ color: t.colors.inkMuted }}>{ts('cart.shippingTaxes', 'Shipping & taxes')}</dt><dd className="m-0" style={{ color: t.colors.inkMuted }}>{ts('cart.atCheckout', 'At checkout')}</dd></div>
              </dl>
              <div className="my-4" style={{ borderTop: `1px solid ${t.colors.border}` }} />
              <div className="mb-5 flex items-baseline justify-between"><span className="text-sm font-semibold">{ts('cart.estimatedTotal', 'Estimated total')}</span><span className="text-2xl font-semibold">{subtotal}</span></div>
              <TechButton block disabled={hasUnavailable} onClick={() => navigate('/checkout')}>{ts('cart.proceedToCheckout', 'Proceed to checkout')}</TechButton>
            </aside>
          </div>
        )}
      </TechBox>
      {after.length > 0 && <TechSectionRenderer sections={after} />}
    </>
  );
}
