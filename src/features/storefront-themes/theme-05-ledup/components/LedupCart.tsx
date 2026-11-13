import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ImageOff, X } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { useCartContext } from '@/contexts/CartContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicStoreProducts, type PublicStoreProduct } from '@/api/services/store';
import { displayMoney, displayMoneySum, type MoneyLine } from '../../core/money';
import { cartLineNotes } from '../../core/merchandising/purchaseNotes';
import { CartDrawerContext } from '../../cartDrawerContext';
import { useDialogFocus } from '../../core/hooks/useDialogFocus';
import { imgProps } from './imgProps';
import { ledupTheme as t } from '../theme.config';
import { LedupButton } from '../ui/ledupUiPort';

/** Provides the shared cart-drawer context (product cards and sections call `useCartDrawer`) and draws the "My Cart" pop-over under the header. */
export function LedupCartProvider({ children }: { children: ReactNode }) {
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

/** Up to two best sellers that are not in the cart yet (real store data; nothing is shown when there are none). */
function MiniCartUpsell({ inCart, onAdded }: { inCart: string[]; onAdded: () => void }) {
  const { store } = useStorefront();
  const { addToCart, adding } = useCartContext();
  const { currency, convert, canConvert } = useCurrencyPreference();
  const [list, setList] = useState<PublicStoreProduct[]>([]);
  useEffect(() => {
    const ctl = new AbortController();
    apiGetPublicStoreProducts(store.storeId, { limit: 8, sort: 'best_selling' }, ctl.signal)
      .then(r => setList(((r as { data?: { products?: PublicStoreProduct[] } }).data?.products ?? []) as PublicStoreProduct[]))
      .catch(() => { /* suggestions are optional */ });
    return () => ctl.abort();
  }, [store.storeId]);
  const picks = list.filter(p => !!p.variantId && p.inStock !== false && p.type !== 'digital' && !inCart.includes(p._id)).slice(0, 2);
  if (picks.length === 0) return null;
  const base = String(store.baseCurrency ?? currency);
  return (
    <div className="p-4" style={{ borderTop: `1px solid ${t.colors.border}` }}>
      <p className="m-0 mb-3 text-xs font-semibold uppercase" style={{ color: t.colors.inkMuted, letterSpacing: '.04em' }}>{ts('cart.youMayLike', 'You may also like')}</p>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {picks.map(p => (
          <li key={p._id} className="flex items-center gap-3">
            <Link to={`/product/${p._id}`} className="grid size-12 shrink-0 place-items-center overflow-hidden" style={{ background: t.colors.bgAlt }}>
              {p.images?.[0] ? <img {...imgProps(p.images[0], [96, 160], '48px')} alt="" className="size-full object-contain" /> : <ImageOff size={16} aria-hidden style={{ color: t.colors.inkMuted }} />}
            </Link>
            <div className="min-w-0 flex-1">
              <p className="m-0 line-clamp-1 text-xs font-medium">{p.name}</p>
              {p.defaultVariantPrice != null && <p className="m-0 text-xs font-semibold">{displayMoney({ currency, convert, canConvert }, p.defaultVariantPrice, base, { productId: p._id, variantId: p.variantId })}</p>}
            </div>
            <LedupButton variant="outline" small loading={adding === p.variantId} onClick={async () => { if (p.variantId && await addToCart(p._id, p.variantId, 'physical', 1)) onAdded(); }}>{ts('pg.add', 'Add')}</LedupButton>
          </li>
        ))}
      </ul>
    </div>
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
    <div className="fixed inset-0 z-[200]">
      <button type="button" aria-label={ts('cart.close', 'Close cart')} onClick={onClose} className="absolute inset-0 border-0" style={{ background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }} />
      <div ref={ref} role="dialog" aria-modal="true" aria-label={ts('cart.myCart', 'My cart')} className="ld-drawer absolute inset-y-0 end-0 z-[2] flex w-[min(100vw,420px)] flex-col rounded-s-[20px]"
        style={{ background: '#fff', color: '#4b423b', fontFamily: t.fonts.body, boxShadow: '-12px 0 40px -16px rgba(0,0,0,.3)' }}>
        <div className="flex items-center justify-between gap-3 px-6 pb-4 pt-6">
          <div>
            <h2 className="m-0 text-[18px] font-semibold">{ts('cart.myCart', 'My cart')}</h2>
            {count > 0 && <p className="m-0 mt-0.5 text-xs" style={{ color: '#8c847e' }}>{count === 1 ? ts('cart.itemInCart', '1 item in cart') : ts('cart.itemsInCart', '{{count}} items in cart', { count })}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label={ts('cart.close', 'Close cart')} className="grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-transparent transition hover:bg-[#f1efed]" style={{ color: '#4b423b' }}><X size={20} strokeWidth={1.4} /></button>
        </div>
        {items.length > 0 && <div className="px-6 pb-3"><LedupButton variant="outline" block onClick={() => go('/cart')}>{ts('cart.viewEdit', 'View or edit your cart')}</LedupButton></div>}
        {error && <p role="alert" className="m-0 px-4 pb-2 text-xs" style={{ color: t.colors.danger }}>{error}</p>}
        <ul className="m-0 flex-1 list-none overflow-y-auto p-0" style={{ borderTop: items.length ? `1px solid ${t.colors.border}` : 'none' }}>
          {loading && !cart && <li className="p-4 text-sm" style={{ color: t.colors.inkMuted }}>{ts('pg.loading', 'Loading')}</li>}
          {!loading && items.length === 0 && (
            <li className="flex flex-col items-start gap-5 px-6 py-4">
              <span className="text-[15px]" style={{ color: '#4b423b' }}>{ts('cart.cartEmpty', 'Your cart is empty')}</span>
              <button type="button" onClick={() => go('/search')} className="lds-pill cursor-pointer">{ts('ld.exploreProducts', 'Explore products')}</button>
            </li>
          )}
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
                  {i.isBundle && <p className="m-0 text-[11px]" style={{ color: t.colors.inkMuted }}>{ts('product.bundleBadge', 'Bundle')}</p>}
                  {cartLineNotes(i).preorder &&<p role="status" className="m-0 text-[11px]" style={{ color: t.colors.inkMuted }}>{cartLineNotes(i).preorder}</p>}
                  {(i.unavailable || i.b2bError) && <p role="alert" className="m-0 text-[11px]" style={{ color: t.colors.danger }}>{i.b2bError ?? ts('cart.itemUnavailableShort', 'No longer available')}</p>}
                </div>
                <button type="button" onClick={() => remove(i.productId, i.productVariantId)} disabled={busy === i.productVariantId} aria-label={ts('cart.removeItem', 'Remove {{name}}', { name: i.name })} className="lb-icon-btn disabled:opacity-40"><X size={14} aria-hidden /></button>
              </li>
            );
          })}
        </ul>
        {t.cartUpsell && items.length > 0 && <MiniCartUpsell inCart={items.map(i => i.productId)} onAdded={() => undefined} />}
        {items.length > 0 && <div className="flex flex-col gap-3 p-6" style={{ borderTop: `1px solid ${t.colors.border}` }}>
          <p className="m-0 text-center text-sm"><span style={{ color: t.colors.inkMuted }}>{ts('cart.subtotal', 'Subtotal')}: </span><b className="text-lg">{displayMoneySum(conv, lines)}</b></p>
          <LedupButton block disabled={items.length === 0 || items.some(i => i.unavailable)} onClick={() => go('/checkout')}>{ts('cart.goToCheckout', 'Go to checkout')}</LedupButton>
        </div>}
      </div>
    </div>
  );
}
