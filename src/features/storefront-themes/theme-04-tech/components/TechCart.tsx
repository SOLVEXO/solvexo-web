import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ImageOff, X } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { useCartContext } from '@/contexts/CartContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { displayMoney, displayMoneySum, type MoneyLine } from '../../core/money';
import { CartDrawerContext } from '../../cartDrawerContext';
import { useDialogFocus } from '../../core/hooks/useDialogFocus';
import { imgProps } from './imgProps';
import { techTheme as t } from '../theme.config';
import { TechButton } from '../ui/techUi';

/** Provides the shared cart-drawer context (product cards and sections call `useCartDrawer`) and draws Tech's "My Cart" pop-over under the header. */
export function TechCartProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  // Open state is tied to the path it was opened on, so navigating anywhere dismisses it.
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === location.pathname;
  const navigate = useNavigate();
  const { theme: storeTheme } = useStorefront();
  const cartPage = (storeTheme?.theme as { cartType?: string } | undefined)?.cartType === 'page';
  const openDrawer = useCallback(() => { if (cartPage) navigate('/cart'); else setOpenPath(location.pathname); }, [cartPage, navigate, location.pathname]);
  const closeDrawer = useCallback(() => setOpenPath(null), []);
  const value = useMemo(() => ({ open, openDrawer, closeDrawer, mounted: true }), [open, openDrawer, closeDrawer]);
  return (
    <CartDrawerContext.Provider value={value}>
      {children}
      {open && <MiniCart onClose={closeDrawer} />}
    </CartDrawerContext.Provider>
  );
}

function MiniCart({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogFocus(ref, onClose);
  const navigate = useNavigate();
  const { store } = useStorefront();
  const { cart, loading, removeItem, error } = useCartContext();
  const { currency, convert, canConvert } = useCurrencyPreference();
  const [busy, setBusy] = useState<string | null>(null);
  const items = cart?.items ?? [];
  const base = String(store.baseCurrency ?? currency);
  const conv = { currency, convert, canConvert };
  const unit = (i: (typeof items)[number]) => i.unitPrice ?? i.price ?? 0;
  const lines: MoneyLine[] = items.map(i => ({ amount: unit(i) * i.quantity, from: i.currency ?? base, unit: unit(i), qty: i.quantity, ref: { productId: i.productId, variantId: i.productVariantId } }));
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const go = (to: string) => { onClose(); navigate(to); };
  const remove = async (productId: string, variantId: string) => {
    setBusy(variantId);
    try { await removeItem(productId, variantId); } finally { setBusy(null); }
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <button type="button" aria-label={ts('cart.close', 'Close cart')} onClick={onClose} className="absolute inset-0 border-0" style={{ background: 'rgba(2,2,3,.35)' }} />
      <div ref={ref} role="dialog" aria-modal="true" aria-label={ts('cart.myCart', 'My cart')} className="tx-pop absolute end-3 top-3 flex max-h-[calc(100dvh-24px)] w-[min(94vw,360px)] flex-col sm:end-6 sm:top-20"
        style={{ background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body, border: `1px solid ${t.colors.border}`, boxShadow: '0 16px 40px -12px rgba(2,2,3,.35)' }}>
        <div className="flex items-start justify-between gap-3 p-4 text-center">
          <div className="flex-1">
            <p className="m-0 text-base font-semibold">{ts('cart.myCart', 'My cart')}</p>
            <p className="m-0 text-xs" style={{ color: t.colors.inkMuted }}>{ts('cart.itemsInCart', '{{count}} items in cart', { count })}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={ts('cart.close', 'Close cart')} className="grid size-8 cursor-pointer place-items-center border-0 bg-transparent" style={{ color: t.colors.ink }}><X size={18} /></button>
        </div>
        <div className="px-4 pb-3"><TechButton variant="outline" block onClick={() => go('/cart')}>{ts('cart.viewEdit', 'View or edit your cart')}</TechButton></div>
        {error && <p role="alert" className="m-0 px-4 pb-2 text-xs" style={{ color: t.colors.danger }}>{error}</p>}
        <ul className="m-0 flex-1 list-none overflow-y-auto p-0" style={{ borderTop: `1px solid ${t.colors.border}` }}>
          {loading && !cart && <li className="p-4 text-sm" style={{ color: t.colors.inkMuted }}>{ts('pg.loading', 'Loading')}</li>}
          {!loading && items.length === 0 && <li className="p-6 text-center text-sm" style={{ color: t.colors.inkMuted }}>{ts('cart.cartEmpty', 'Your cart is empty')}</li>}
          {items.map(i => {
            const img = i.image?.[0] ?? i.images?.[0];
            return (
              <li key={`${i.productId}:${i.productVariantId}`} className="flex items-center gap-3 p-4" style={{ borderBottom: `1px solid ${t.colors.border}` }}>
                <span className="text-sm">{i.quantity}×</span>
                <Link to={`/product/${i.productId}`} onClick={onClose} className="grid size-14 shrink-0 place-items-center overflow-hidden" style={{ background: t.colors.bgAlt }}>
                  {img ? <img {...imgProps(img, [96, 160], '56px')} alt={i.name} className="size-full object-contain" /> : <ImageOff size={18} aria-hidden style={{ color: t.colors.inkMuted }} />}
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="m-0 line-clamp-2 text-xs font-medium leading-snug">{i.name}</p>
                  <p className="m-0 mt-1 text-xs font-semibold">{displayMoney(conv, unit(i) * i.quantity, i.currency ?? base, { productId: i.productId, variantId: i.productVariantId })}</p>
                  {i.unavailable && <p role="alert" className="m-0 text-[11px]" style={{ color: t.colors.danger }}>{ts('cart.itemUnavailableShort', 'No longer available')}</p>}
                </div>
                <button type="button" onClick={() => remove(i.productId, i.productVariantId)} disabled={busy === i.productVariantId} aria-label={ts('cart.removeItem', 'Remove {{name}}', { name: i.name })} className="tx-icon-btn disabled:opacity-40"><X size={14} aria-hidden /></button>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-col gap-3 p-4" style={{ borderTop: `1px solid ${t.colors.border}` }}>
          <p className="m-0 text-center text-sm"><span style={{ color: t.colors.inkMuted }}>{ts('cart.subtotal', 'Subtotal')}: </span><b className="text-lg">{displayMoneySum(conv, lines)}</b></p>
          <TechButton block disabled={items.length === 0 || items.some(i => i.unavailable)} onClick={() => go('/checkout')}>{ts('cart.goToCheckout', 'Go to checkout')}</TechButton>
        </div>
      </div>
    </div>
  );
}
