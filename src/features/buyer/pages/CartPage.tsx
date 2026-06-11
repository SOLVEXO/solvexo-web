import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useCartContext } from '@/contexts/CartContext';
import { Button } from '@/components/ui/Button';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ImageOff, Loader2 } from 'lucide-react';
import { useState } from 'react';

const C = {
  orange: '#D97757', deepOrange: '#B95A3A', paleOrange: '#FBECE4',
  carbon: '#141413', charcoal: '#2C2A28', slate: '#8C8A82',
  bone: '#E8E6DC', cream: '#FAF9F5', white: '#FFFFFF',
  success: '#2D8A4E',
};

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
      <div style={{
        width: 80, height: 80, borderRadius: 10, background: C.paleOrange,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <ImageOff size={22} style={{ color: '#D97757', opacity: 0.5 }} />
      </div>
    );
  }
  return (
    <img
      src={src} alt={name} onError={() => setErrored(true)}
      style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover', flexShrink: 0, display: 'block' }}
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
    <div style={{ minHeight: '100vh', backgroundColor: C.cream, fontFamily: "'Poppins', sans-serif" }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: C.white, borderBottom: `1px solid ${C.bone}`,
        height: 60, display: 'flex', alignItems: 'center',
        paddingLeft: 40, paddingRight: 40, gap: 16,
      }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          <SolvexoIcon size={28} />
          <span style={{ fontWeight: 700, fontSize: 15, color: C.carbon }}>Solvex</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: C.orange }}>o</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/marketplace')}>
          <ArrowLeft size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
          Continue Shopping
        </Button>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.carbon, marginBottom: 4 }}>
          Shopping Cart
        </h1>
        <p style={{ fontSize: 13, color: C.slate, marginBottom: 28 }}>
          {loading ? 'Loading…' : `${cartCount} item${cartCount !== 1 ? 's' : ''} in your cart`}
        </p>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.bone}`, padding: 20, display: 'flex', gap: 16 }}>
                <div className="animate-pulse" style={{ width: 80, height: 80, borderRadius: 10, background: '#E8E6DC', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="animate-pulse" style={{ height: 14, borderRadius: 6, background: '#E8E6DC', width: '60%' }} />
                  <div className="animate-pulse" style={{ height: 11, borderRadius: 4, background: '#E8E6DC', width: '30%' }} />
                  <div className="animate-pulse" style={{ height: 32, borderRadius: 8, background: '#E8E6DC', width: 110 }} />
                </div>
                <div className="animate-pulse" style={{ width: 70, height: 24, borderRadius: 6, background: '#E8E6DC' }} />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {isEmpty && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <ShoppingBag size={64} style={{ color: C.bone, marginBottom: 16 }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: C.carbon, marginBottom: 8 }}>Your cart is empty</p>
            <p style={{ fontSize: 13, color: C.slate, marginBottom: 24 }}>
              Browse the marketplace and add products to get started.
            </p>
            <Button variant="primary" onClick={() => navigate('/marketplace')}>Browse Marketplace</Button>
          </div>
        )}

        {/* Cart items + summary */}
        {!loading && (cart?.items.length ?? 0) > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
            {/* Items list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                    style={{
                      background: C.white, borderRadius: 12,
                      border: `1px solid ${C.bone}`, padding: 20,
                      display: 'flex', gap: 16, alignItems: 'flex-start',
                      opacity: isRemoving ? 0.5 : 1, transition: 'opacity 0.2s',
                    }}
                  >
                    <CartItemImage images={imgs} name={item.name} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 14, color: C.carbon, marginBottom: 4, lineHeight: 1.35 }}>
                        {item.name}
                      </p>
                      <p style={{ fontSize: 12, color: C.slate, marginBottom: 12 }}>
                        ${price.toLocaleString()} each
                      </p>

                      {/* Qty controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          onClick={() => handleUpdateQty(item.productId, key, 'decrease')}
                          disabled={item.quantity <= 1 || isUpdating}
                          style={{
                            width: 30, height: 30, borderRadius: 7,
                            border: `1px solid ${C.bone}`, background: C.cream,
                            cursor: item.quantity <= 1 || isUpdating ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: C.charcoal, opacity: item.quantity <= 1 ? 0.4 : 1,
                          }}
                        >
                          <Minus size={12} />
                        </button>

                        <span style={{
                          minWidth: 36, textAlign: 'center', fontSize: 14,
                          fontWeight: 700, color: C.carbon,
                        }}>
                          {isUpdating ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : item.quantity}
                        </span>

                        <button
                          onClick={() => handleUpdateQty(item.productId, key, 'increase')}
                          disabled={isUpdating}
                          style={{
                            width: 30, height: 30, borderRadius: 7,
                            border: `1px solid ${C.bone}`, background: C.cream,
                            cursor: isUpdating ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: C.charcoal,
                          }}
                        >
                          <Plus size={12} />
                        </button>

                        <button
                          onClick={() => handleRemove(item.productId, key)}
                          disabled={isRemoving}
                          style={{
                            marginLeft: 8, padding: '4px 8px', borderRadius: 6,
                            border: `1px solid #FECACA`, background: '#FFF0F0',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                            fontSize: 11, color: '#C13030', fontWeight: 500,
                          }}
                        >
                          {isRemoving
                            ? <Loader2 size={11} style={{ animation: 'spin 0.8s linear infinite' }} />
                            : <Trash2 size={11} />
                          }
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Line total */}
                    <div style={{ fontWeight: 700, fontSize: 15, color: C.carbon, flexShrink: 0 }}>
                      ${total.toLocaleString()}
                    </div>
                  </div>
                );
              })}

              {/* Clear cart */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
                <button
                  onClick={handleClear}
                  disabled={clearing}
                  style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 12,
                    border: `1px solid ${C.bone}`, background: C.white,
                    cursor: clearing ? 'not-allowed' : 'pointer', color: C.slate,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {clearing ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Trash2 size={12} />}
                  Clear Cart
                </button>
              </div>
            </div>

            {/* Order summary */}
            <div style={{
              background: C.white, borderRadius: 12, border: `1px solid ${C.bone}`,
              padding: 24, position: 'sticky', top: 80,
            }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: C.carbon, marginBottom: 18 }}>Order Summary</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: C.slate }}>Subtotal ({cartCount} items)</span>
                  <span style={{ fontWeight: 600, color: C.carbon }}>${(cart?.totalPrice ?? 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: C.slate }}>Shipping</span>
                  <span style={{ color: C.success, fontWeight: 500 }}>Calculated at checkout</span>
                </div>
              </div>

              <div style={{ height: 1, background: C.bone, marginBottom: 16 }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
                <span style={{ color: C.carbon }}>Total</span>
                <span style={{ color: C.carbon }}>${(cart?.totalPrice ?? 0).toLocaleString()}</span>
              </div>

              <Button variant="primary" size="lg" fullWidth style={{ justifyContent: 'center' }}>
                Proceed to Checkout
              </Button>
              <Button variant="ghost" size="sm" fullWidth style={{ justifyContent: 'center', marginTop: 10 }}
                onClick={() => navigate('/marketplace')}>
                Continue Shopping
              </Button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
