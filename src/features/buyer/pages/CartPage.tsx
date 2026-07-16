import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useCartContext } from '@/contexts/CartContext';
import { Button } from '@/components/comman/ui/Button';
import { BuyerNavbar, Breadcrumb, Footer } from '@/components/comman/ui';
import {
  Minus, Plus, Trash2, ShoppingBag, ImageOff,
  Loader2, Package, Download, ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';

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
              className="text-[12px] font-semibold text-error cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ── Empty ── */}
        {isEmpty && (
          <div className="bg-white rounded-xl shadow-card border border-bone p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-bone flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={30} className="text-slate opacity-60" />
            </div>
            <p className="text-[16px] font-semibold text-carbon mb-2">Your cart is empty</p>
            <p className="text-[13px] text-slate mb-6">Browse the marketplace and add products to get started.</p>
            <Button variant="primary" onClick={() => navigate('/marketplace')}>Browse Marketplace</Button>
          </div>
        )}

        {/* ── Cart + Summary ── */}
        {(loading || items.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

            {/* ── Left: Cart card ── */}
            <div className="bg-white rounded-xl shadow-card border border-bone overflow-hidden">

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
                      <div className="animate-pulse w-[72px] h-[72px] rounded-[10px] bg-bone shrink-0" />
                      <div className="flex-1 flex flex-col gap-[10px]">
                        <div className="animate-pulse h-[13px] rounded bg-bone w-[55%]" />
                        <div className="animate-pulse h-[11px] rounded bg-bone w-[25%]" />
                        <div className="animate-pulse h-8 rounded-lg bg-bone w-[100px]" />
                      </div>
                      <div className="animate-pulse w-[55px] h-5 rounded bg-bone" />
                    </div>
                  ))}
                </div>
              )}

              {/* Items */}
              {!loading && items.map((item, idx) => {
                const key        = item.productVariantId;
                const imgs       = item.image ?? item.images;
                const price      = item.unitPrice ?? item.price ?? 0;
                const lineTotal  = item.itemTotal ?? price * item.quantity;
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
                        ${price.toLocaleString()} each
                      </p>

                      {/* Qty controls */}
                      <div className="flex items-center gap-[6px]">
                        <button
                          onClick={() => handleUpdateQty(item.productId, key, 'decrease')}
                          disabled={item.quantity <= 1 || isUpdating}
                          className={clsx(
                            'w-[30px] h-[30px] rounded-[7px] border border-bone bg-cream flex items-center justify-center text-charcoal transition-colors',
                            item.quantity <= 1 || isUpdating
                              ? 'cursor-not-allowed opacity-40'
                              : 'cursor-pointer hover:bg-bone',
                          )}
                        >
                          <Minus size={12} />
                        </button>

                        <span className="min-w-[36px] text-center text-[14px] font-bold text-carbon">
                          {isUpdating
                            ? <Loader2 size={13} className="animate-spin mx-auto block" />
                            : item.quantity}
                        </span>

                        <button
                          onClick={() => handleUpdateQty(item.productId, key, 'increase')}
                          disabled={isUpdating}
                          className={clsx(
                            'w-[30px] h-[30px] rounded-[7px] border border-bone bg-cream flex items-center justify-center text-charcoal transition-colors',
                            isUpdating ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-bone',
                          )}
                        >
                          <Plus size={12} />
                        </button>

                        <Button
                          variant="danger" size="xs"
                          className="ml-2!"
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
                      ${lineTotal.toLocaleString()}
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
            <div className="bg-white rounded-xl shadow-card border border-bone p-6 lg:sticky top-20 flex flex-col gap-5">
              <p className="text-[15px] font-bold text-carbon">Order Summary</p>

              {/* Item list */}
              {!loading && (
                <div className="flex flex-col gap-2">
                  {items.map(item => {
                    const price = item.unitPrice ?? item.price ?? 0;
                    const ttl   = item.itemTotal ?? price * item.quantity;
                    return (
                      <div key={item.productVariantId} className="flex justify-between text-[12px] gap-2">
                        <span className="text-carbon truncate">
                          {item.name}
                          <span className="text-slate ml-1">×{item.quantity}</span>
                        </span>
                        <span className="font-medium text-carbon shrink-0">${ttl.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="h-px bg-bone" />

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate">Subtotal ({cartCount} items)</span>
                  <span className="font-semibold text-carbon">${(cart?.totalPrice ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate">Shipping</span>
                  <span className="text-success font-medium text-[12px]">Calculated at checkout</span>
                </div>
              </div>

              <div className="h-px bg-bone" />

              <div className="flex justify-between text-[16px] font-bold">
                <span className="text-carbon">Total</span>
                <span className="text-carbon">${(cart?.totalPrice ?? 0).toLocaleString()}</span>
              </div>

              {/* ── Checkout Buttons ── */}
              <div className="flex flex-col gap-2">

                {/* Case 1: type not known from API → single general button */}
                {!typeKnown && (
                  <Button
                    variant="primary" fullWidth
                    className="justify-center! px-5! py-[11px]! rounded-xl!"
                    onClick={() => navigate('/checkout', { state: { cartType: 'physical' } })}
                  >
                    <Package size={15} /> Proceed to Checkout
                    <ChevronRight size={14} className="ml-auto" />
                  </Button>
                )}

                {/* Physical button */}
                {hasPhysical && (
                  <Button
                    variant="primary" fullWidth
                    className="justify-between! px-5! py-[11px]! rounded-xl!"
                    onClick={() => navigate('/checkout', { state: { cartType: 'physical' } })}
                  >
                    <span className="flex items-center gap-2">
                      <Package size={15} />
                      Checkout Physical
                    </span>
                    <span className="flex items-center gap-1 opacity-80 text-[12px]">
                      {physicalCount} item{physicalCount !== 1 ? 's' : ''}
                      <ChevronRight size={13} />
                    </span>
                  </Button>
                )}

                {/* Digital button */}
                {hasDigital && (
                  <Button
                    fullWidth
                    className={clsx(
                      'justify-between! px-5! py-[11px]! rounded-xl! border-0!',
                      hasPhysical
                        ? 'bg-[#3851D1]! text-white! hover:bg-[#2E42B0]!'
                        : 'bg-brand-orange! text-white! hover:bg-brand-deep-orange!',
                    )}
                    onClick={() => navigate('/checkout', { state: { cartType: 'digital' } })}
                  >
                    <span className="flex items-center gap-2">
                      <Download size={15} />
                      Get Digital Products
                    </span>
                    <span className="flex items-center gap-1 opacity-80 text-[12px]">
                      {digitalCount} item{digitalCount !== 1 ? 's' : ''}
                      <ChevronRight size={13} />
                    </span>
                  </Button>
                )}

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
