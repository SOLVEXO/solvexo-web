import {
  useCallback, useEffect, useMemo, useRef, useState,
  type ComponentType, type ButtonHTMLAttributes, type ReactNode,
} from 'react';
import { CartDrawerContext } from './cartDrawerContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Download, ImageOff, Loader2, Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { useCartContext } from '@/contexts/CartContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useFocusTrap } from '@/components/comman/ui/useFocusTrap';
import { currencySymbol, fmt2 } from '@/utils/currency';

/** Shopify (Dawn) "cart drawer": add-to-cart (or the header cart icon) slides a
 *  focus-trapped drawer in from the right with the line items, quantity
 *  steppers, remove, a cart note, the subtotal and a Checkout button. The
 *  behavior is shared by every theme; each theme only passes its own design
 *  tokens (read at render time, since the theme object is a mutable singleton
 *  that merchant customization writes into) and its own button component. */
export interface CartDrawerTheme {
  colors: { bg: string; bgAlt: string; ink: string; inkMuted: string; border: string; danger: string };
  fonts: { display: string; body: string };
  /** Corner radius for thumbnails / stepper (Atelier is square, Nova is rounded). */
  radius: { sm: string };
  headingWeight?: number;
}

type DrawerButton = ComponentType<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline'; loading?: boolean }>;


const noteKey = (storeId: string) => `solvexo_cart_note_${storeId}`;

export function CartDrawerProvider({ theme, Button, children }: { theme: CartDrawerTheme; Button: DrawerButton; children: ReactNode }) {
  const location = useLocation();
  // Open state is tied to the path it was opened on, so navigating anywhere (checkout, /cart,
  // a product link) dismisses the drawer without an effect.
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === location.pathname;
  const openDrawer = useCallback(() => setOpenPath(location.pathname), [location.pathname]);
  const closeDrawer = useCallback(() => setOpenPath(null), []);
  const value = useMemo(() => ({ open, openDrawer, closeDrawer, mounted: true }), [open, openDrawer, closeDrawer]);
  return (
    <CartDrawerContext.Provider value={value}>
      {children}
      {open && <CartDrawerPanel theme={theme} Button={Button} onClose={closeDrawer} />}
    </CartDrawerContext.Provider>
  );
}

function Thumb({ src, name, t }: { src?: string; name: string; t: CartDrawerTheme }) {
  const [bad, setBad] = useState(false);
  if (!src || bad) {
    return (
      <div className="w-20 h-20 flex items-center justify-center shrink-0" style={{ background: t.colors.bgAlt, borderRadius: t.radius.sm }}>
        <ImageOff size={18} style={{ color: t.colors.inkMuted }} />
      </div>
    );
  }
  return <img src={src} alt={name} loading="lazy" decoding="async" onError={() => setBad(true)} className="w-20 h-20 object-cover shrink-0 block" style={{ borderRadius: t.radius.sm }} />;
}

function CartDrawerPanel({ theme: t, Button, onClose }: { theme: CartDrawerTheme; Button: DrawerButton; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, onClose);
  const navigate = useNavigate();
  const { store } = useStorefront();
  const { cart, loading, updateQty, removeItem, error } = useCartContext();
  const { currency: displayCurrency, convert, ratesLoaded } = useCurrencyPreference();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState(() => { try { return localStorage.getItem(noteKey(store.storeId)) ?? ''; } catch { return ''; } });

  // Lock page scroll while the drawer is open (Dawn does the same).
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const saveNote = (v: string) => {
    setNote(v);
    try { if (v) localStorage.setItem(noteKey(store.storeId), v); else localStorage.removeItem(noteKey(store.storeId)); } catch { /* storage unavailable */ }
  };

  const items = cart?.items ?? [];
  // Never print a native amount with the buyer-currency symbol: until rates load, show a dash.
  const ratesOk = ratesLoaded || items.every(i => !i.currency || i.currency === displayCurrency);
  const money = (n: number) => (ratesOk ? `${currencySymbol(displayCurrency)}${fmt2(n)}` : '—');
  const subtotal = items.reduce((s, i) => s + convert(i.itemTotal ?? (i.unitPrice ?? i.price ?? 0) * i.quantity, i.currency), 0);

  const run = (key: string, fn: () => Promise<void | boolean>) => { setBusy(key); fn().finally(() => setBusy(null)); };
  const body = { fontFamily: t.fonts.body } as const;

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <style>{`@keyframes sx-drawer-in{from{transform:translateX(100%)}to{transform:none}}@keyframes sx-fade-in{from{opacity:0}to{opacity:1}}@media (prefers-reduced-motion:reduce){.sx-drawer,.sx-drawer-bg{animation:none!important}}`}</style>
      <div className="sx-drawer-bg absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)', animation: 'sx-fade-in .2s ease' }} onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sx-cart-drawer-title"
        tabIndex={-1}
        className="sx-drawer relative flex flex-col h-full w-full outline-none"
        style={{ maxWidth: '440px', background: t.colors.bg, color: t.colors.ink, boxShadow: '-8px 0 32px rgba(0,0,0,0.18)', animation: 'sx-drawer-in .25s ease', ...body }}
      >
        <div className="flex items-center justify-between shrink-0" style={{ padding: '18px 20px', borderBottom: `1px solid ${t.colors.border}` }}>
          <h2 id="sx-cart-drawer-title" style={{ fontFamily: t.fonts.display, fontSize: '18px', fontWeight: t.headingWeight ?? 600, color: t.colors.ink }}>
            Your cart{items.length > 0 ? ` (${items.reduce((s, i) => s + i.quantity, 0)})` : ''}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close cart" className="bg-transparent border-0 cursor-pointer p-1" style={{ color: t.colors.ink }}>
            <X size={20} />
          </button>
        </div>

        {error && <p role="alert" style={{ ...body, fontSize: '12.5px', color: t.colors.danger, padding: '10px 20px', borderBottom: `1px solid ${t.colors.border}` }}>{error}</p>}

        {loading && items.length === 0 ? (
          <div className="flex-1 overflow-y-auto" style={{ padding: '8px 20px' }} aria-busy="true">
            {[1, 2].map(i => (
              <div key={i} className="flex gap-4 py-4">
                <div className="animate-pulse w-20 h-20 shrink-0" style={{ background: t.colors.bgAlt, borderRadius: t.radius.sm }} />
                <div className="flex-1 flex flex-col gap-2 pt-2">
                  <div className="animate-pulse h-3 w-1/2" style={{ background: t.colors.bgAlt }} />
                  <div className="animate-pulse h-3 w-1/4" style={{ background: t.colors.bgAlt }} />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3" style={{ padding: '24px' }}>
            <ShoppingBag size={32} style={{ color: t.colors.inkMuted }} />
            <p style={{ fontFamily: t.fonts.display, fontSize: '18px', fontWeight: t.headingWeight ?? 600 }}>Your cart is empty</p>
            <Button type="button" variant="outline" onClick={() => { onClose(); navigate('/#shop'); }}>Continue shopping</Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto list-none m-0" style={{ padding: '0 20px' }}>
              {items.map(item => {
                const key = item.productVariantId;
                const unit = convert(item.unitPrice ?? item.price ?? 0, item.currency);
                const line = convert(item.itemTotal ?? (item.unitPrice ?? item.price ?? 0) * item.quantity, item.currency);
                const working = busy === key;
                return (
                  <li key={key} className="flex gap-4 py-4 transition-opacity" style={{ borderBottom: `1px solid ${t.colors.border}`, opacity: working ? 0.6 : 1 }}>
                    <Thumb src={(item.image ?? item.images)?.[0]} name={item.name} t={t} />
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex justify-between gap-2">
                        <p style={{ ...body, fontSize: '13.5px', fontWeight: 500 }}>{item.name}</p>
                        <p className="shrink-0" style={{ ...body, fontSize: '13.5px', fontWeight: 500 }}>{money(line)}</p>
                      </div>
                      <p style={{ ...body, fontSize: '12px', color: t.colors.inkMuted }}>{money(unit)}</p>
                      {item.type === 'digital' && (
                        <span className="inline-flex items-center gap-1 self-start px-2 py-[1px]" style={{ background: t.colors.bgAlt, fontSize: '10px', color: t.colors.inkMuted, borderRadius: t.radius.sm }}>
                          <Download size={9} /> Digital
                        </span>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center" style={{ border: `1px solid ${t.colors.border}`, borderRadius: t.radius.sm }}>
                          <button type="button" aria-label={`Decrease quantity of ${item.name}`} disabled={item.quantity <= 1 || working}
                            onClick={() => run(key, () => updateQty(item.productId, key, 'decrease'))}
                            className="w-8 h-8 flex items-center justify-center bg-transparent border-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed" style={{ color: t.colors.ink }}>
                            <Minus size={12} />
                          </button>
                          <span aria-live="polite" style={{ ...body, fontSize: '13px', width: '30px', textAlign: 'center' }}>
                            {working ? <Loader2 size={12} className="animate-spin mx-auto" /> : item.quantity}
                          </span>
                          <button type="button" aria-label={`Increase quantity of ${item.name}`} disabled={working}
                            onClick={() => run(key, () => updateQty(item.productId, key, 'increase'))}
                            className="w-8 h-8 flex items-center justify-center bg-transparent border-0 cursor-pointer disabled:opacity-40" style={{ color: t.colors.ink }}>
                            <Plus size={12} />
                          </button>
                        </div>
                        <button type="button" disabled={working} onClick={() => run(key, () => removeItem(item.productId, key))}
                          className="bg-transparent border-0 cursor-pointer underline" style={{ ...body, fontSize: '12px', color: t.colors.inkMuted }}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="shrink-0 flex flex-col gap-3" style={{ padding: '16px 20px 20px', borderTop: `1px solid ${t.colors.border}` }}>
              <label className="flex flex-col gap-1.5">
                <span style={{ ...body, fontSize: '12px', color: t.colors.inkMuted }}>Order note</span>
                <textarea
                  value={note}
                  onChange={e => saveNote(e.target.value)}
                  rows={2}
                  maxLength={500}
                  style={{ ...body, fontSize: '13px', padding: '8px 10px', border: `1px solid ${t.colors.border}`, background: t.colors.bg, color: t.colors.ink, borderRadius: t.radius.sm, resize: 'vertical' }}
                />
              </label>
              <div className="flex justify-between items-baseline">
                <span style={{ ...body, fontSize: '14px' }}>Subtotal</span>
                <span style={{ fontFamily: t.fonts.display, fontSize: '18px', fontWeight: t.headingWeight ?? 600 }}>{money(subtotal)}</span>
              </div>
              <p style={{ ...body, fontSize: '11.5px', color: t.colors.inkMuted }}>Taxes and shipping are calculated at checkout.</p>
              <Button type="button" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { onClose(); navigate('/checkout'); }}>Check out</Button>
              <Link to="/cart" onClick={onClose} className="text-center underline" style={{ ...body, fontSize: '12.5px', color: t.colors.inkMuted }}>View cart</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
