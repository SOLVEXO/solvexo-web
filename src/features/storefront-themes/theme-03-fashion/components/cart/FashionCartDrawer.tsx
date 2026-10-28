import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccentText } from '../../ui/AccentText';
import { imgProps } from '../imgProps';
import { ts } from '@/utils/tStatic';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Download, ImageOff, Loader2, Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { useCartContext } from '@/contexts/CartContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { displayMoney, displayMoneyLine, displayMoneySum, type MoneyLine } from '../../../core/money';
import { cartLineRules, cartQtyHint, stepQty } from '../../../sellingRules';
import { CartDrawerContext } from '../../../cartDrawerContext';
import { fashionTheme as t } from '../../theme.config';
import { useDialogFocus } from '../../../core/hooks/useDialogFocus';
import { FashionButton } from '../FashionButton';
import { PillButton } from '../../ui/primitives';

/** Maison cart drawer: provides the shared cart-drawer context (sections call useCartDrawer) and draws the panel. */
export function FashionCartDrawerProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  // Open state is tied to the path it was opened on, so navigating anywhere dismisses the drawer.
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === location.pathname;
  const navigate = useNavigate();
  const { theme: storeTheme } = useStorefront();
  // Theme setting "Cart type": the cart page instead of the drawer.
  const cartPage = (storeTheme?.theme as { cartType?: string } | undefined)?.cartType === 'page';
  const openDrawer = useCallback(() => {
    if (cartPage) navigate('/cart');
    else setOpenPath(location.pathname);
  }, [cartPage, navigate, location.pathname]);
  const closeDrawer = useCallback(() => setOpenPath(null), []);
  const value = useMemo(() => ({ open, openDrawer, closeDrawer, mounted: true }), [open, openDrawer, closeDrawer]);
  return (
    <CartDrawerContext.Provider value={value}>
      {children}
      {open && <DrawerPanel onClose={closeDrawer} />}
    </CartDrawerContext.Provider>
  );
}

function Thumb({ src, name }: { src?: string; name: string }) {
  const [bad, setBad] = useState(false);
  const box = 'size-24 shrink-0';
  if (!src || bad) {
    return <div className={`${box} grid place-items-center`} style={{ background: t.colors.bgAlt, borderRadius: t.imageRadiusPx }}><ImageOff size={20} style={{ color: t.colors.inkMuted }} /></div>;
  }
  return <img {...imgProps(src, [160, 240], '96px')} alt={name} loading="lazy" onError={() => setBad(true)} className={`${box} block object-cover`} style={{ borderRadius: t.imageRadiusPx, background: t.colors.bgAlt }} />;
}

function DrawerPanel({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogFocus(ref, onClose);
  const navigate = useNavigate();
  const { t: tr } = useTranslation('storefront');
  const { store } = useStorefront();
  const { cart, loading, setQty, removeItem, error } = useCartContext();
  const { currency: displayCurrency, convert, canConvert } = useCurrencyPreference();
  const [busy, setBusy] = useState<string | null>(null);
  const items = cart?.items ?? [];
  const count = items.reduce((s, i) => s + i.quantity, 0);
  // No rate for the buyer's currency: amounts stay in the store's own currency (never a wrong symbol).
  const conv = { currency: displayCurrency, convert, canConvert };
  const base = String(store.baseCurrency ?? displayCurrency);
  const lineNative = (i: (typeof items)[number]) => i.itemTotal ?? (i.unitPrice ?? i.price ?? 0) * i.quantity;
  // Fixed market prices are per unit: convert the unit price, then multiply (only when the line total is plain unit x quantity).
  const lineOf = (i: (typeof items)[number]): MoneyLine => {
    const u = i.unitPrice ?? i.price ?? 0;
    const plain = i.itemTotal == null || Math.abs(i.itemTotal - u * i.quantity) < 0.005;
    return { amount: lineNative(i), from: i.currency ?? base, ...(plain ? { unit: u, qty: i.quantity, ref: { productId: i.productId, variantId: i.productVariantId } } : {}) };
  };
  const subtotalText = displayMoneySum(conv, items.map(lineOf));
  const run = (key: string, fn: () => Promise<void | boolean>) => { setBusy(key); fn().finally(() => setBusy(null)); };

  const stepBtn = 'grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 transition-colors hover:bg-[color-mix(in_srgb,currentColor_8%,transparent)] disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div className="fx-backdrop absolute inset-0" style={{ background: 'rgba(9,9,11,0.45)', backdropFilter: 'blur(2px)' }} onClick={onClose} aria-hidden="true" />
      <div
        ref={ref} role="dialog" aria-modal="true" aria-labelledby="fx-cart-title" tabIndex={-1}
        className="fx-drawer-right relative flex h-full w-full max-w-[460px] flex-col outline-none sm:h-[calc(100%-24px)] sm:my-3 sm:mr-3 sm:rounded-[28px]"
        style={{ background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body, boxShadow: '0 24px 64px rgba(0,0,0,.22)' }}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 px-6 py-5">
          <h2 id="fx-cart-title" className="m-0 flex items-center gap-2.5 text-xl font-medium tracking-tight" style={{ fontFamily: t.fonts.display }}>
            {tr('cart.yourCart', 'Your cart')}
            {count > 0 && <span className="grid h-6 min-w-6 place-items-center rounded-full px-2 text-xs font-semibold" style={{ background: t.colors.bgAlt }}>{count}</span>}
          </h2>
          <button type="button" onClick={onClose} aria-label={tr('cart.closeCart', 'Close cart')} className="grid size-10 cursor-pointer place-items-center rounded-full border-0 p-0 transition-colors hover:bg-[color-mix(in_srgb,currentColor_14%,transparent)]" style={{ background: t.colors.bgAlt, color: t.colors.ink }}>
            <X size={18} />
          </button>
        </div>

        {error && <p role="alert" className="m-0 mx-6 mb-2 rounded-xl px-4 py-2.5 text-[13px]" style={{ background: `color-mix(in srgb, ${t.colors.danger} 9%, transparent)`, color: t.colors.danger }}>{error}</p>}

        {loading && items.length === 0 ? (
          <div className="flex-1 overflow-y-auto px-6" aria-busy="true">
            {[1, 2].map(i => (
              <div key={i} className="flex gap-4 py-4">
                <div className="size-24 shrink-0 animate-pulse" style={{ background: t.colors.bgAlt, borderRadius: t.imageRadiusPx }} />
                <div className="flex flex-1 flex-col gap-2.5 pt-3">
                  <div className="h-3 w-2/3 animate-pulse rounded-full" style={{ background: t.colors.bgAlt }} />
                  <div className="h-3 w-1/4 animate-pulse rounded-full" style={{ background: t.colors.bgAlt }} />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="grid size-16 place-items-center rounded-full" style={{ background: t.colors.bgAlt }}><ShoppingBag size={26} style={{ color: t.colors.inkMuted }} /></span>
            <p className="m-0 text-2xl font-medium tracking-tight"><AccentText text={ts('h.your_cart_is_empty', 'Your cart is *empty*')} size="1.08em" /></p>
            <p className="m-0 max-w-[280px] text-sm" style={{ color: t.colors.inkMuted }}>{tr('cart.cartEmpty', 'Your cart is empty')}</p>
            <PillButton variant="outline" onClick={() => { onClose(); navigate('/#shop'); }}>{tr('cart.continueShoppingLower', 'Continue shopping')}</PillButton>
          </div>
        ) : (
          <>
            <ul className="m-0 flex-1 list-none overflow-y-auto px-6 pb-2">
              {items.map(item => {
                const key = item.productVariantId;
                const from = item.currency ?? base;
                const unit = displayMoney(conv, item.unitPrice ?? item.price ?? 0, from, { productId: item.productId, variantId: item.productVariantId });
                const line = displayMoneyLine(conv, lineOf(item));
                const rules = cartLineRules(item);
                const hint = cartQtyHint(item);
                const prev = stepQty(item.quantity, -1, rules);
                const next = stepQty(item.quantity, 1, rules);
                const working = busy === key;
                return (
                  <li key={key} className="flex gap-4 py-4 transition-opacity" style={{ opacity: working ? 0.6 : 1, borderTop: `1px solid ${t.colors.border}` }}>
                    <Thumb src={(item.image ?? item.images)?.[0]} name={item.name} />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex justify-between gap-3">
                        <p className="m-0 text-sm font-medium leading-snug">{item.name}</p>
                        <p className="m-0 shrink-0 text-sm font-semibold">{line}</p>
                      </div>
                      {(item.options?.length ?? 0) > 0 && <p className="m-0 text-[13px]" style={{ color: t.colors.inkMuted }}>{item.options?.map(o => o.value).join(' / ')}</p>}
                      {item.quantity > 1 && <p className="m-0 text-[13px]" style={{ color: t.colors.inkMuted }}>{unit} {ts('cart.each', 'each')}</p>}
                      {hint && <p className="m-0 text-xs" style={{ color: t.colors.inkMuted }}>{hint}</p>}
                      {item.type === 'digital' && (
                        <span className="inline-flex items-center gap-1 self-start rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ background: t.colors.bgAlt, color: t.colors.inkMuted }}>
                          <Download size={11} /> {tr('cart.digital', 'Digital')}
                        </span>
                      )}
                      <div className="mt-auto flex items-center gap-3 pt-1.5">
                        <div className="flex items-center rounded-full" style={{ border: `1px solid ${t.colors.border}` }}>
                          <button type="button" className={stepBtn} aria-label={tr('cart.decreaseQty', 'Decrease quantity of {{name}}', { name: item.name })} disabled={prev === null || working}
                            onClick={() => prev !== null && run(key, () => setQty(item.productId, key, prev))}><Minus size={13} /></button>
                          <span aria-live="polite" className="w-7 text-center text-sm font-medium">{working ? <Loader2 size={13} className="mx-auto animate-spin" /> : item.quantity}</span>
                          <button type="button" className={stepBtn} aria-label={tr('cart.increaseQty', 'Increase quantity of {{name}}', { name: item.name })} disabled={next === null || working}
                            onClick={() => next !== null && run(key, () => setQty(item.productId, key, next))}><Plus size={13} /></button>
                        </div>
                        <button type="button" disabled={working} onClick={() => run(key, () => removeItem(item.productId, key))}
                          className="cursor-pointer border-0 bg-transparent p-0 text-[13px] underline disabled:opacity-40" style={{ color: t.colors.inkMuted }}>
                          {tr('cart.remove', 'Remove')}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="shrink-0 px-4 pb-4 sm:px-5 sm:pb-5" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
              <div className="flex flex-col gap-3.5 p-5" style={{ background: t.colors.bgAlt, borderRadius: 24 }}>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm">{tr('cart.subtotal', 'Subtotal')}</span>
                  <span className="text-xl font-semibold tracking-tight">{subtotalText}</span>
                </div>
                <p className="m-0 text-xs" style={{ color: t.colors.inkMuted }}>{tr('cart.taxesNote', 'Taxes and shipping are calculated at checkout.')}</p>
                <FashionButton arrow fullWidth onClick={() => { onClose(); navigate('/checkout'); }}>{tr('cart.checkOut', 'Check out')}</FashionButton>
                <Link to="/cart" onClick={onClose} className="text-center text-[13px] underline" style={{ color: t.colors.inkMuted }}>{tr('cart.viewCart', 'View cart')}</Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
