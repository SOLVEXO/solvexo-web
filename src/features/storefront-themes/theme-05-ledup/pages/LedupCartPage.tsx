import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowUpRight } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCartContext } from '@/contexts/CartContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { displayMoney, displayMoneyLine, displayMoneySum, type MoneyLine } from '../../core/money';
import { cartLineRules, cartQtyHint, stepQty } from '../../sellingRules';
import { LedupBox, LedupBreadcrumbs, LedupButton, LedupSkeleton } from '../ui/ledupUi';

export function LedupCartPage() {
  const { store } = useStorefront();
  const navigate = useNavigate();
  const { cart, loading, error, adding, setQty, removeItem, clearCart } = useCartContext();
  const { currency, convert, canConvert } = useCurrencyPreference();

  const items = cart?.items ?? [];
  const hasUnavailable = items.some(i => i.unavailable);
  const base = String(store.baseCurrency ?? currency);
  const conv = { currency, convert, canConvert };
  const unit = (i: (typeof items)[number]) => i.unitPrice ?? i.price ?? 0;
  const lineOf = (i: (typeof items)[number]): MoneyLine => ({
    amount: unit(i) * i.quantity,
    from: i.currency ?? base,
    unit: unit(i),
    qty: i.quantity,
    ref: { productId: i.productId, variantId: i.productVariantId },
  });
  const subtotal = displayMoneySum(conv, items.map(lineOf));

  return (
    <div className="py-12">
      <LedupBox>
        <LedupBreadcrumbs items={[{ label: ts('pg.home', 'Home'), to: '/' }, { label: ts('footer.cart', 'Cart') }]} />
        <h1 className="mb-8 text-3xl font-bold text-stone-900 md:text-4xl">{ts('cart.shoppingCart', 'Shopping cart')}</h1>

        {error && <div role="alert" className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {loading && !cart ? (
          <LedupSkeleton h={110} rows={2} />
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-stone-200 bg-stone-50/50 p-16 text-center">
            <ShoppingBag size={48} className="mx-auto mb-4 text-stone-300" aria-hidden />
            <h2 className="mb-2 text-xl font-bold text-stone-900">{ts('cart.cartEmpty', 'Your cart is empty')}</h2>
            <p className="mb-6 text-sm text-stone-500">{ts('cart.emptyHint', "Looks like you haven't added anything yet.")}</p>
            <Link to="/search" className="inline-flex items-center gap-2 rounded-full bg-[#8C7355] px-6 py-3 text-sm font-medium text-white no-underline transition hover:bg-[#796247]">
              {ts('cart.startShopping', 'Start shopping')} <ArrowUpRight size={14} aria-hidden />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
            <div className="flex flex-col divide-y divide-stone-200 rounded-3xl border border-stone-200/70 bg-white p-6 sm:p-8 lg:col-span-8">
              {items.map(item => {
                const key = `${item.productId}:${item.productVariantId}`;
                const img = item.image?.[0] ?? item.images?.[0];
                const rules = cartLineRules(item);
                const hint = cartQtyHint(item);
                const prev = stepQty(item.quantity, -1, rules);
                const next = stepQty(item.quantity, 1, rules);
                const busy = adding === item.productVariantId;
                return (
                  <div key={key} className="flex flex-col items-start justify-between gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                      <Link to={`/product/${item.productId}`} className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-stone-100 bg-stone-50 p-2">
                        {img ? <img src={img} alt={item.name} className="h-full w-full object-contain" /> : <ShoppingBag size={20} className="text-stone-300" aria-hidden />}
                      </Link>
                      <div className="min-w-0">
                        <Link to={`/product/${item.productId}`} className="text-base font-semibold text-stone-900 no-underline hover:underline">{item.name}</Link>
                        {item.options && item.options.length > 0 && (
                          <p className="mt-0.5 text-xs text-stone-500">{item.options.map(o => `${o.name}: ${o.value}`).join(' · ')}</p>
                        )}
                        <p className="mt-1 text-sm font-bold text-stone-900">{displayMoney(conv, unit(item), item.currency ?? base, { productId: item.productId, variantId: item.productVariantId })}</p>
                        {hint && <p className="mt-1 text-[11px] text-stone-400">{hint}</p>}
                        {item.unavailable && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{ts('cart.itemUnavailable', 'No longer available')}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <div className="flex items-center rounded-full border border-stone-200 px-3 py-1">
                        <button type="button" disabled={busy || prev == null} aria-label={ts('cart.decrease', 'Decrease quantity')} onClick={() => prev != null && setQty(item.productId, item.productVariantId, prev)} className="p-1 text-stone-400 hover:text-stone-900 disabled:opacity-30">
                          <Minus size={13} aria-hidden />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-stone-900" aria-live="polite">{item.quantity}</span>
                        <button type="button" disabled={busy || next == null} aria-label={ts('cart.increase', 'Increase quantity')} onClick={() => next != null && setQty(item.productId, item.productVariantId, next)} className="p-1 text-stone-400 hover:text-stone-900 disabled:opacity-30">
                          <Plus size={13} aria-hidden />
                        </button>
                      </div>
                      <span className="hidden w-24 text-end text-sm font-semibold text-stone-900 sm:block">{displayMoneyLine(conv, lineOf(item))}</span>
                      <button type="button" disabled={busy} aria-label={ts('cart.remove', 'Remove')} onClick={() => removeItem(item.productId, item.productVariantId)} className="p-1 text-stone-400 transition hover:text-red-500">
                        <Trash2 size={16} aria-hidden />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-6 rounded-3xl border border-stone-200/70 bg-stone-50/60 p-8 lg:col-span-4">
              <h2 className="text-lg font-bold text-stone-900">{ts('cart.orderSummary', 'Order summary')}</h2>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>{ts('cart.subtotal', 'Subtotal')}</span>
                  <span className="font-semibold text-stone-900">{subtotal}</span>
                </div>
                <p className="text-xs text-stone-500">{ts('cart.shippingTaxesAtCheckout', 'Shipping and taxes are calculated at checkout.')}</p>
              </div>

              {hasUnavailable && <p role="alert" className="text-xs font-medium text-red-600">{ts('cart.removeUnavailable', 'Remove the unavailable items to continue.')}</p>}

              <LedupButton variant="primary" disabled={hasUnavailable} onClick={() => navigate('/checkout')} className="w-full !h-12 !text-sm">
                {ts('cart.checkout', 'Checkout')} <ArrowUpRight size={15} aria-hidden />
              </LedupButton>

              <div className="text-center">
                <button type="button" onClick={() => clearCart()} className="text-xs text-stone-400 underline hover:text-stone-600">
                  {ts('cart.clearCart', 'Clear cart')}
                </button>
              </div>
            </div>
          </div>
        )}
      </LedupBox>
    </div>
  );
}
