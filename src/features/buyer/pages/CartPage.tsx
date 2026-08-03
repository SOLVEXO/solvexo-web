import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useCartContext } from '@/contexts/CartContext';
import { Button } from '@/components/comman/ui/Button';
import { BuyerNavbar, Breadcrumb, Footer, EmptyState, SkeletonBox } from '@/components/comman/ui';
import {
  Minus, Plus, Trash2, ShoppingBag, ImageOff,
  Loader2, Package, Download, ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { currencySymbol } from '@/utils/currency';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';

function CartItemImage({ images, name }: { images?: string[]; name: string }) {
  const [errored, setErrored] = useState(false);
  const src = images?.[0];
  if (!src || errored) {
    return (
      <div className="w-[72px] h-[72px] rounded-[10px] bg-brand-pale-orange flex items-center justify-center shrink-0">
        <ImageOff size={20} className="text-brand-orange opacity-50" />
      </div>
    );
  }
  return (
    <img loading="lazy" decoding="async"
      src={src} alt={name} onError={() => setErrored(true)}
      className="w-[72px] h-[72px] rounded-[10px] object-cover shrink-0 block"
    />
  );
}

export function CartPage() {
  const navigate = useNavigate();
  usePageTitle('Cart');

  const { cart, loading, cartCount, updateQty, removeItem, clearCart, error, clearError } = useCartContext();
  const [clearing,   setClearing]   = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  // ── Cart type detection ────────────────────────────────────────────────────
  const items       = cart?.items ?? [];
  const hasPhysical = items.some(i => i.type === 'physical');
  const hasDigital  = items.some(i => i.type === 'digital');
  const typeKnown   = hasPhysical || hasDigital;

  const physicalCount = items.filter(i => i.type === 'physical').reduce((s, i) => s + i.quantity, 0);
  const digitalCount  = items.filter(i => i.type === 'digital').reduce((s, i) => s + i.quantity, 0);

  const isEmpty = !loading && !items.length;

  // Every line is converted from its OWN native (seller) currency into the
  // buyer's currently-selected display currency — this is what makes the
  // navbar PKR/USD switch actually update prices here, and it's also what
  // lets a cart with items from different-currency sellers still show one
  // real, correctly-summed total instead of an ambiguous "confirmed at
  // checkout" placeholder. The authoritative amount is still always
  // recomputed fresh, server-side, at checkout creation regardless.
  const { currency: displayCurrency, convert } = useCurrencyPreference();
  const displaySymbol = currencySymbol(displayCurrency);
  const displayTotal = items.reduce((s, i) => {
    const unit = i.unitPrice ?? i.price ?? 0;
    const lineTotal = i.itemTotal ?? unit * i.quantity;
    return s + convert(lineTotal, i.currency);
  }, 0);

  return (
    <div className="min-h-screen bg-cream">

      <BuyerNavbar backTo={{ label: 'Continue Shopping', path: '/marketplace' }} />

      <div className="max-w-[960px] mx-auto px-4 md:px-6 py-6 md:py-8">
        <Breadcrumb className="mb-4" items={[
          { label: 'Home', path: '/' },
          { label: 'Cart' },
        ]} />

        {/* ── Error banner ── */}
        {error && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-[10px] border border-[#FECACA] bg-error-bg px-4 py-3">
            <span className="text-[13px] text-error">{error}</span>
            <button
              onClick={clearError}
              aria-label="Dismiss error"
              className="text-[12px] font-semibold text-error cursor-pointer shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ── Empty ── */}
        {isEmpty && (
          <div className="bg-white rounded-xl border border-bone">
            <EmptyState
              icon={<ShoppingBag size={30} className="text-brand-orange" />}
              title="Your cart is empty"
              description="Browse the marketplace and add products to get started."
              action={{ label: 'Browse Marketplace', onClick: () => navigate('/marketplace') }}
            />
          </div>
        )}

        {/* ── Cart + Summary ── */}
        {(loading || items.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

            {/* ── Left: Cart card ── */}
            <div className="bg-white rounded-xl border border-bone overflow-hidden">

              {/* Card header */}
              <div className="px-6 pt-5 pb-4 border-b border-bone flex items-center justify-between">
                <div>
                  <h1 className="text-[20px] font-bold text-carbon leading-tight">Shopping Cart</h1>
                  <p className="text-[12px] text-slate mt-[2px]">
                    {loading ? 'Loading…' : `${cartCount} item${cartCount !== 1 ? 's' : ''} in your cart`}
                  </p>
                </div>
                {!loading && cartCount > 0 && (
                  <span className="text-[11px] font-semibold px-3 py-[5px] rounded-full bg-brand-pale-orange text-brand-orange">
                    {cartCount} {cartCount === 1 ? 'item' : 'items'}
                  </span>
                )}
              </div>

              {/* Loading skeleton */}
              {loading && (
                <div className="divide-y divide-bone">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4 items-center px-5 py-4">
                      <SkeletonBox width={72} height={72} rounded="10px" className="shrink-0" />
                      <div className="flex-1 flex flex-col gap-[10px]">
                        <SkeletonBox height={13} width="55%" />
                        <SkeletonBox height={11} width="25%" />
                        <SkeletonBox height={32} width={100} rounded="8px" />
                      </div>
                      <SkeletonBox width={55} height={20} />
                    </div>
                  ))}
                </div>
              )}

              {/* Items */}
              {!loading && items.map((item, idx) => {
                const key        = item.productVariantId;
                const imgs       = item.image ?? item.images;
                const nativePrice = item.unitPrice ?? item.price ?? 0;
                const nativeLineTotal = item.itemTotal ?? nativePrice * item.quantity;
                const price      = convert(nativePrice, item.currency);
                const lineTotal  = convert(nativeLineTotal, item.currency);
                const isRemoving = removingId === key;
                const isUpdating = updatingId === key;
                const isLast     = idx === (items.length - 1);

                return (
                  <div
                    key={key}
                    className={clsx(
                      'flex flex-wrap gap-4 items-start px-5 py-4 transition-opacity duration-200',
                      !isLast && 'border-b border-bone',
                      isRemoving && 'opacity-50',
                    )}
                  >
                    <CartItemImage images={imgs} name={item.name} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-[3px] flex-wrap">
                        <p className="font-semibold text-[14px] text-carbon leading-[1.35]">
                          {item.name}
                        </p>
                        {item.type === 'physical' && (
                          <span className="shrink-0 px-2 py-[2px] rounded-full text-[10px] font-semibold bg-[#FFF4DC] text-[#B36200]">
                            Physical
                          </span>
                        )}
                        {item.type === 'digital' && (
                          <span className="shrink-0 flex items-center gap-[3px] px-2 py-[2px] rounded-full text-[10px] font-semibold bg-[#EEF0FF] text-[#3851D1]">
                            <Download size={9} /> Digital
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-slate mb-3">
                        {displaySymbol}{price.toLocaleString()} each
                      </p>

                      {/* Qty controls — 40x40px min hit area for touch */}
                      <div className="flex items-center gap-[6px] flex-wrap">
                        <button
                          onClick={() => handleUpdateQty(item.productId, key, 'decrease')}
                          disabled={item.quantity <= 1 || isUpdating}
                          aria-label={`Decrease quantity of ${item.name}`}
                          className={clsx(
                            'w-10 h-10 rounded-[7px] border border-bone bg-cream flex items-center justify-center text-charcoal transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange',
                            item.quantity <= 1 || isUpdating
                              ? 'cursor-not-allowed opacity-40'
                              : 'cursor-pointer hover:bg-bone',
                          )}
                        >
                          <Minus size={14} />
                        </button>

                        <span className="min-w-[36px] text-center text-[14px] font-bold text-carbon">
                          {isUpdating
                            ? <Loader2 size={13} className="animate-spin mx-auto block" />
                            : item.quantity}
                        </span>

                        <button
                          onClick={() => handleUpdateQty(item.productId, key, 'increase')}
                          disabled={isUpdating}
                          aria-label={`Increase quantity of ${item.name}`}
                          className={clsx(
                            'w-10 h-10 rounded-[7px] border border-bone bg-cream flex items-center justify-center text-charcoal transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange',
                            isUpdating ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-bone',
                          )}
                        >
                          <Plus size={14} />
                        </button>

                        <Button
                          variant="danger" size="xs"
                          className="ml-2! py-[11px]! min-h-10"
                          onClick={() => handleRemove(item.productId, key)}
                          loading={isRemoving}
                          icon={!isRemoving && <Trash2 size={11} />}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>

                    {/* Line total */}
                    <p className="font-bold text-[15px] text-carbon shrink-0">
                      {displaySymbol}{lineTotal.toLocaleString()}
                    </p>
                  </div>
                );
              })}

              {/* Footer: clear cart */}
              {!loading && items.length > 0 && (
                <div className="px-5 py-3 border-t border-bone flex justify-end">
                  <Button
                    variant="outline" size="xs"
                    onClick={handleClear}
                    loading={clearing}
                    icon={!clearing && <Trash2 size={12} />}
                  >
                    Clear Cart
                  </Button>
                </div>
              )}
            </div>

            {/* ── Right: Order Summary ── */}
            <div className="bg-white rounded-xl border border-bone p-6 lg:sticky top-20 flex flex-col gap-5">
              <p className="text-[15px] font-bold text-carbon">Order Summary</p>

              {/* Item list */}
              {!loading && (
                <div className="flex flex-col gap-2">
                  {items.map(item => {
                    const nativePrice = item.unitPrice ?? item.price ?? 0;
                    const nativeTtl   = item.itemTotal ?? nativePrice * item.quantity;
                    const ttl = convert(nativeTtl, item.currency);
                    return (
                      <div key={item.productVariantId} className="flex justify-between text-[12px] gap-2">
                        <span className="text-carbon truncate">
                          {item.name}
                          <span className="text-slate ml-1">×{item.quantity}</span>
                        </span>
                        <span className="font-medium text-carbon shrink-0">{displaySymbol}{ttl.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="h-px bg-bone" />

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate">Subtotal ({cartCount} items)</span>
                  <span className="font-semibold text-carbon">{displaySymbol}{displayTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate">{hasPhysical ? 'Shipping' : 'Delivery'}</span>
                  <span className="text-charcoal font-medium text-[12px]">
                    {hasPhysical ? 'Calculated at checkout' : 'Instant'}
                  </span>
                </div>
              </div>

              <div className="h-px bg-bone" />

              <div className="flex justify-between text-[16px] font-bold">
                <span className="text-carbon">Total</span>
                <span className="text-carbon">{displaySymbol}{displayTotal.toLocaleString()}</span>
              </div>

              {/* ── Checkout ── One order for the whole cart, mixed physical +
                  digital included — matches Amazon/Alibaba/Shopify/Daraz, and
                  avoids the old two-button flow's double-checkout/billing bug. */}
              <div className="flex flex-col gap-2">
                {typeKnown && hasPhysical && hasDigital && (
                  <p className="text-[11px] text-slate text-center -mt-1 mb-1">
                    {physicalCount} physical · {digitalCount} digital — delivered together
                  </p>
                )}
                <Button
                  variant="primary" fullWidth
                  className="justify-between! px-5! py-[11px]! rounded-xl!"
                  onClick={() => navigate('/checkout')}
                >
                  <span className="flex items-center gap-2">
                    <Package size={15} />
                    Proceed to Checkout
                  </span>
                  <span className="flex items-center gap-1 opacity-80 text-[12px]">
                    {cartCount} item{cartCount !== 1 ? 's' : ''}
                    <ChevronRight size={13} />
                  </span>
                </Button>
              </div>

              <Button
                variant="ghost" size="sm" fullWidth className="justify-center"
                onClick={() => navigate('/marketplace')}
              >
                Continue Shopping
              </Button>
            </div>

          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
