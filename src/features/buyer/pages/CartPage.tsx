import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useCartContext } from '@/contexts/CartContext';
import { Button } from '@/components/comman/ui/Button';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ImageOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';


function SolvexoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#D97757"/>
      <text x="4" y="26" fontFamily="'Poppins',sans-serif" fontWeight="800" fontSize="26" fill="white">s</text>
      <rect x="16.5" y="2" width="13" height="13" rx="3.5" fill="#C8694E" fillOpacity="0.7"/>
      <path d="M23 11.5V5.5M23 5.5L20 8.5M23 5.5L26 8.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CartItemImage({ images, name }: { images?: string[]; name: string }) {
  const [errored, setErrored] = useState(false);
  const src = images?.[0];
  if (!src || errored) {
    return (
      <div className="w-20 h-20 rounded-[10px] bg-brand-pale-orange flex items-center justify-center flex-shrink-0">
        <ImageOff size={22} className="text-brand-orange opacity-50" />
      </div>
    );
  }
  return (
    <img
      src={src} alt={name} onError={() => setErrored(true)}
      className="w-20 h-20 rounded-[10px] object-cover flex-shrink-0 block"
    />
  );
}

export function CartPage() {
  const navigate = useNavigate();
  usePageTitle('Cart');

  const { cart, loading, cartCount, updateQty, removeItem, clearCart } = useCartContext();
  const [clearing, setClearing] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdateQty = async (
    productId: string, variantId: string, action: 'increase' | 'decrease',
  ) => {
    setUpdatingId(variantId);
    try { await updateQty(productId, variantId, action); }
    finally { setUpdatingId(null); }
  };

  const handleRemove = async (productId: string, variantId: string) => {
    setRemovingId(variantId);
    try { await removeItem(productId, variantId); }
    finally { setRemovingId(null); }
  };

  const handleClear = async () => {
    setClearing(true);
    try { await clearCart(); }
    finally { setClearing(false); }
  };

  const isEmpty = !loading && (!cart?.items.length);

  return (
    <div className="min-h-screen bg-cream">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-bone h-[60px] flex items-center px-10 gap-4">
        <div className="flex-1 flex items-center gap-2">
          <SolvexoIcon size={28} />
          <span className="font-bold text-[15px] text-[#141413]">Solvex</span>
          <span className="font-bold text-[15px] text-brand-orange">o</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/marketplace')}>
          <ArrowLeft size={14} className="inline align-middle mr-1" />
          Continue Shopping
        </Button>
      </nav>

      <div className="max-w-[900px] mx-auto px-6 py-8">
        <h1 className="text-[22px] font-bold text-[#141413] mb-1">
          Shopping Cart
        </h1>
        <p className="text-[13px] text-[#8C8A82] mb-7">
          {loading ? 'Loading…' : `${cartCount} item${cartCount !== 1 ? 's' : ''} in your cart`}
        </p>

        {/* Loading skeleton */}
        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-[12px] border border-bone p-5 flex gap-4">
                <div className="animate-pulse w-20 h-20 rounded-[10px] bg-bone flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-[10px]">
                  <div className="animate-pulse h-[14px] rounded-[6px] bg-bone w-[60%]" />
                  <div className="animate-pulse h-[11px] rounded bg-bone w-[30%]" />
                  <div className="animate-pulse h-8 rounded-lg bg-bone w-[110px]" />
                </div>
                <div className="animate-pulse w-[70px] h-6 rounded-[6px] bg-bone" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {isEmpty && (
          <div className="text-center py-20">
            <ShoppingBag size={64} className="text-bone mx-auto mb-4" />
            <p className="text-[16px] font-semibold text-[#141413] mb-2">Your cart is empty</p>
            <p className="text-[13px] text-[#8C8A82] mb-6">
              Browse the marketplace and add products to get started.
            </p>
            <Button variant="primary" onClick={() => navigate('/marketplace')}>Browse Marketplace</Button>
          </div>
        )}

        {/* Cart items + summary */}
        {!loading && (cart?.items.length ?? 0) > 0 && (
          <div className="grid gap-6 items-start" style={{ gridTemplateColumns: '1fr 320px' }}>
            {/* Items list */}
            <div className="flex flex-col gap-3">
              {cart!.items.map(item => {
                const key = item.productVariantId;
                const imgs = item.image ?? item.images;
                const price = item.unitPrice ?? item.price ?? 0;
                const total = item.itemTotal ?? price * item.quantity;
                const isRemoving = removingId === key;
                const isUpdating = updatingId === key;

                return (
                  <div
                    key={key}
                    className={clsx('bg-white rounded-[12px] border border-bone p-5 flex gap-4 items-start transition-opacity duration-200', isRemoving && 'opacity-50')}
                  >
                    <CartItemImage images={imgs} name={item.name} />

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[14px] text-[#141413] mb-1 leading-[1.35]">
                        {item.name}
                      </p>
                      <p className="text-[12px] text-[#8C8A82] mb-3">
                        ${price.toLocaleString()} each
                      </p>

                      {/* Qty controls */}
                      <div className="flex items-center gap-[6px]">
                        <button
                          onClick={() => handleUpdateQty(item.productId, key, 'decrease')}
                          disabled={item.quantity <= 1 || isUpdating}
                          className={clsx('w-[30px] h-[30px] rounded-[7px] border border-bone bg-cream flex items-center justify-center text-charcoal', item.quantity <= 1 || isUpdating ? 'cursor-not-allowed' : 'cursor-pointer', item.quantity <= 1 && 'opacity-40')}
                        >
                          <Minus size={12} />
                        </button>

                        <span className="min-w-9 text-center text-[14px] font-bold text-[#141413]">
                          {isUpdating ? <Loader2 size={13} className="animate-spin" /> : item.quantity}
                        </span>

                        <button
                          onClick={() => handleUpdateQty(item.productId, key, 'increase')}
                          disabled={isUpdating}
                          className={clsx('w-[30px] h-[30px] rounded-[7px] border border-bone bg-cream flex items-center justify-center text-charcoal', isUpdating ? 'cursor-not-allowed' : 'cursor-pointer')}
                        >
                          <Plus size={12} />
                        </button>

                        <button
                          onClick={() => handleRemove(item.productId, key)}
                          disabled={isRemoving}
                          className="ml-2 px-2 py-1 rounded-[6px] border border-[#FECACA] bg-[#FFF0F0] cursor-pointer flex items-center gap-1 text-[11px] text-[#C13030] font-medium"
                        >
                          {isRemoving
                            ? <Loader2 size={11} className="animate-spin" />
                            : <Trash2 size={11} />
                          }
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Line total */}
                    <div className="font-bold text-[15px] text-[#141413] flex-shrink-0">
                      ${total.toLocaleString()}
                    </div>
                  </div>
                );
              })}

              {/* Clear cart */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleClear}
                  disabled={clearing}
                  className={clsx('px-[14px] py-[6px] rounded-lg text-[12px] border border-bone bg-white text-[#8C8A82] flex items-center gap-[6px]', clearing ? 'cursor-not-allowed' : 'cursor-pointer')}
                >
                  {clearing ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  Clear Cart
                </button>
              </div>
            </div>

            {/* Order summary */}
            <div className="bg-white rounded-[12px] border border-bone p-6 sticky top-20">
              <p className="text-[15px] font-bold text-[#141413] mb-[18px]">Order Summary</p>

              <div className="flex flex-col gap-3 mb-5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#8C8A82]">Subtotal ({cartCount} items)</span>
                  <span className="font-semibold text-[#141413]">${(cart?.totalPrice ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#8C8A82]">Shipping</span>
                  <span className="text-success font-medium">Calculated at checkout</span>
                </div>
              </div>

              <div className="h-px bg-bone mb-4" />

              <div className="flex justify-between text-[16px] font-bold mb-5">
                <span className="text-[#141413]">Total</span>
                <span className="text-[#141413]">${(cart?.totalPrice ?? 0).toLocaleString()}</span>
              </div>

              <Button variant="primary" size="lg" fullWidth className="justify-center">
                Proceed to Checkout
              </Button>
              <Button variant="ghost" size="sm" fullWidth className="justify-center mt-[10px]"
                onClick={() => navigate('/marketplace')}>
                Continue Shopping
              </Button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
