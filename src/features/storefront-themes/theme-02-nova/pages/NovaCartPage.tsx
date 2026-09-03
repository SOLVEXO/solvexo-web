import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ImageOff, Loader2, Download } from 'lucide-react';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { useCartContext } from '@/contexts/CartContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicCollectionTemplate } from '@/api/services/collectionTemplate';
import type { Section } from '@/api/services/storefrontTypes';
import { currencySymbol, fmt2 } from '@/utils/currency';
import { NovaSectionRenderer } from '../sections';
import { NovaButton } from '../components/NovaButton';
import { novaTheme as t } from '../theme.config';

function CartItemImage({ images, name }: { images?: string[]; name: string }) {
  const [errored, setErrored] = useState(false);
  const src = images?.[0];
  if (!src || errored) {
    return (
      <div className="w-20 h-20 flex items-center justify-center shrink-0" style={{ background: t.colors.bgAlt, borderRadius: t.radius.sm }}>
        <ImageOff size={18} style={{ color: t.colors.inkMuted }} />
      </div>
    );
  }
  return (
    <img
      loading="lazy" decoding="async" src={src} alt={name} onError={() => setErrored(true)}
      className="w-20 h-20 object-cover shrink-0 block" style={{ borderRadius: t.radius.sm }}
    />
  );
}

/** Theme 02's own Cart page — same real backend flow as `AtelierCartPage`
 *  (cart context, quantity/remove/clear, cross-sell template sections below
 *  the cart via `collection-template`'s `page`/`cart` bucket), just Nova's
 *  own rounded/bold presentation instead of Atelier's sharp-cornered one. */
export function NovaCartPage() {
  useStorefrontSeo({ title: 'Cart', noindex: true });
  const navigate = useNavigate();
  const { store } = useStorefront();
  const { cart, loading, updateQty, removeItem, clearCart, error, clearError } = useCartContext();
  const [clearing, setClearing] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [templateSections, setTemplateSections] = useState<Section[]>([]);

  useEffect(() => {
    apiGetPublicCollectionTemplate(store.storeId, 'page', 'cart')
      .then(res => setTemplateSections(res.data.sections ?? []))
      .catch(() => setTemplateSections([]));
  }, [store.storeId]);

  const items = cart?.items ?? [];
  const isEmpty = !loading && !items.length;

  const { currency: displayCurrency, convert } = useCurrencyPreference();
  const symbol = currencySymbol(displayCurrency);
  const displayTotal = items.reduce((s, i) => {
    const unit = i.unitPrice ?? i.price ?? 0;
    const lineTotal = i.itemTotal ?? unit * i.quantity;
    return s + convert(lineTotal, i.currency);
  }, 0);

  const handleUpdateQty = (productId: string, variantId: string, action: 'increase' | 'decrease') => {
    setUpdatingId(variantId);
    updateQty(productId, variantId, action).finally(() => setUpdatingId(null));
  };
  const handleRemove = (productId: string, variantId: string) => {
    setRemovingId(variantId);
    removeItem(productId, variantId).finally(() => setRemovingId(null));
  };
  const handleClear = () => {
    setClearing(true);
    clearCart().finally(() => setClearing(false));
  };

  return (
    <main className="mx-auto" style={{ maxWidth: t.layout.maxWidth, padding: `48px ${t.layout.containerPadX}` }}>
      <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(26px, 3vw, 34px)', fontWeight: 700, color: t.colors.ink, marginBottom: '32px' }}>
        Your Cart
      </h1>

      {error && (
        <div className="mb-6 flex items-center justify-between gap-3" style={{ border: `1.5px solid ${t.colors.danger}`, borderRadius: t.radius.sm, padding: '12px 16px' }}>
          <span style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.danger }}>{error}</span>
          <button onClick={clearError} className="cursor-pointer border-0 bg-transparent" style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.danger, fontWeight: 700 }}>
            Dismiss
          </button>
        </div>
      )}

      {isEmpty && (
        <div className="flex flex-col items-center text-center" style={{ padding: '80px 0', border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md }}>
          <ShoppingBag size={32} style={{ color: t.colors.inkMuted }} className="mb-4" />
          <p style={{ fontFamily: t.fonts.display, fontSize: '20px', fontWeight: 700, color: t.colors.ink, marginBottom: '8px' }}>Your cart is empty</p>
          <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.inkMuted, maxWidth: '340px', lineHeight: 1.6, marginBottom: '20px' }}>
            Nothing here yet — browse the shop to find something you'll love.
          </p>
          <Link to="/#shop" className="no-underline">
            <NovaButton variant="outline">Continue Shopping</NovaButton>
          </Link>
        </div>
      )}

      {(loading || items.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10 items-start">
          <div>
            {loading && (
              <div className="flex flex-col">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 items-center py-5" style={{ borderBottom: `1.5px solid ${t.colors.border}` }}>
                    <div className="animate-pulse w-20 h-20 shrink-0" style={{ background: t.colors.bgAlt, borderRadius: t.radius.sm }} />
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="animate-pulse h-3 w-1/2" style={{ background: t.colors.bgAlt }} />
                      <div className="animate-pulse h-3 w-1/4" style={{ background: t.colors.bgAlt }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && items.map(item => {
              const key = item.productVariantId;
              const imgs = item.image ?? item.images;
              const nativePrice = item.unitPrice ?? item.price ?? 0;
              const nativeLineTotal = item.itemTotal ?? nativePrice * item.quantity;
              const price = convert(nativePrice, item.currency);
              const lineTotal = convert(nativeLineTotal, item.currency);
              const isRemoving = removingId === key;
              const isUpdating = updatingId === key;

              return (
                <div
                  key={key}
                  className="flex flex-wrap gap-4 items-start py-5 transition-opacity duration-200"
                  style={{ borderBottom: `1.5px solid ${t.colors.border}`, opacity: isRemoving ? 0.5 : 1 }}
                >
                  <CartItemImage images={imgs} name={item.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1 flex-wrap">
                      <p style={{ fontFamily: t.fonts.body, fontSize: '14px', fontWeight: 600, color: t.colors.ink }}>{item.name}</p>
                      {item.type === 'digital' && (
                        <span className="shrink-0 flex items-center gap-1 px-2 py-[2px]" style={{ background: t.colors.bgAlt, fontSize: '10px', color: t.colors.inkMuted, borderRadius: '9999px' }}>
                          <Download size={9} /> Digital
                        </span>
                      )}
                    </div>
                    <p style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted, marginBottom: '10px' }}>{symbol}{fmt2(price)} each</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center" style={{ border: `1.5px solid ${t.colors.border}`, borderRadius: '9999px' }}>
                        <button
                          onClick={() => handleUpdateQty(item.productId, key, 'decrease')}
                          disabled={item.quantity <= 1 || isUpdating}
                          aria-label={`Decrease quantity of ${item.name}`}
                          className="w-8 h-8 flex items-center justify-center bg-transparent border-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ color: t.colors.ink }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.ink, width: '32px', textAlign: 'center' }}>
                          {isUpdating ? <Loader2 size={12} className="animate-spin mx-auto" /> : item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQty(item.productId, key, 'increase')}
                          disabled={isUpdating}
                          aria-label={`Increase quantity of ${item.name}`}
                          className="w-8 h-8 flex items-center justify-center bg-transparent border-0 cursor-pointer disabled:opacity-40"
                          style={{ color: t.colors.ink }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemove(item.productId, key)}
                        disabled={isRemoving}
                        className="flex items-center gap-1 bg-transparent border-0 cursor-pointer"
                        style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted }}
                      >
                        {isRemoving ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />} Remove
                      </button>
                    </div>
                  </div>
                  <p className="shrink-0" style={{ fontFamily: t.fonts.body, fontSize: '14px', fontWeight: 600, color: t.colors.ink }}>{symbol}{fmt2(lineTotal)}</p>
                </div>
              );
            })}

            {!loading && items.length > 0 && (
              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleClear}
                  disabled={clearing}
                  className="flex items-center gap-1.5 bg-transparent border-0 cursor-pointer"
                  style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted }}
                >
                  {clearing ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />} Clear Cart
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5" style={{ border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md, padding: '24px' }}>
            <p style={{ fontFamily: t.fonts.display, fontSize: '17px', fontWeight: 700, color: t.colors.ink }}>Order Summary</p>

            {!loading && (
              <div className="flex flex-col gap-2">
                {items.map(item => {
                  const nativePrice = item.unitPrice ?? item.price ?? 0;
                  const nativeTtl = item.itemTotal ?? nativePrice * item.quantity;
                  const ttl = convert(nativeTtl, item.currency);
                  return (
                    <div key={item.productVariantId} className="flex justify-between gap-2" style={{ fontFamily: t.fonts.body, fontSize: '12.5px' }}>
                      <span className="truncate" style={{ color: t.colors.inkMuted }}>{item.name} ×{item.quantity}</span>
                      <span className="shrink-0" style={{ color: t.colors.ink }}>{symbol}{fmt2(ttl)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ height: '1.5px', background: t.colors.border }} />

            <div className="flex justify-between items-baseline">
              <span style={{ fontFamily: t.fonts.body, fontSize: '15px', color: t.colors.ink }}>Total</span>
              <span style={{ fontFamily: t.fonts.display, fontSize: '20px', fontWeight: 700, color: t.colors.ink }}>{symbol}{fmt2(displayTotal)}</span>
            </div>

            <NovaButton style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/checkout')}>
              Checkout
            </NovaButton>
          </div>
        </div>
      )}

      {templateSections.length > 0 && <div style={{ marginTop: '56px' }}><NovaSectionRenderer sections={templateSections} /></div>}
    </main>
  );
}
