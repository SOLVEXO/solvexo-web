import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { ShoppingCart, X, ImageOff, ArrowRight } from 'lucide-react';
import { useCartContext, type CartItem } from '@/contexts/CartContext';
import { Button } from './Button';

function ItemThumb({ item }: { item: CartItem }) {
  const src = item.image?.[0] ?? item.images?.[0];
  if (!src) {
    return (
      <div className="w-11 h-11 rounded-[9px] bg-brand-pale-orange flex items-center justify-center shrink-0">
        <ImageOff size={14} className="text-brand-orange opacity-50" />
      </div>
    );
  }
  return (
    <img loading="lazy" decoding="async" src={src} alt={item.name}
      className="w-11 h-11 rounded-[9px] object-cover shrink-0 border border-bone" />
  );
}

function lineTotal(item: CartItem) {
  return item.itemTotal ?? (item.unitPrice ?? item.price ?? 0) * item.quantity;
}

// Amazon/Alibaba-style mini cart: the cart icon opens a preview drawer
// (recent items + subtotal + View Cart / Checkout) instead of navigating away immediately.
export function MiniCart({ accentColor }: { accentColor?: string }) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { cart, cartCount } = useCartContext();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const items = cart?.items ?? [];
  const recent = [...items].reverse().slice(0, 4);
  const hiddenCount = Math.max(0, items.length - recent.length);
  const subtotal = cart?.totalPrice ?? items.reduce((s, i) => s + lineTotal(i), 0);

  const goTo = (path: string) => { setOpen(false); navigate(path); };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        aria-label={`Cart${cartCount > 0 ? ` (${cartCount} items)` : ''}`}
        style={accentColor ? { background: accentColor } : undefined}
        className={clsx(
          'relative w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shrink-0 transition-transform hover:scale-105',
          'outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40 focus-visible:ring-offset-1',
          !accentColor && 'bg-brand-orange',
        )}
      >
        <ShoppingCart size={16} className="text-white" />
        {cartCount > 0 && (
          <span className="absolute top-[-4px] right-[-4px] min-w-[18px] h-[18px] rounded-[9px] bg-[#E11D48] text-white text-[10px] font-bold leading-[18px] text-center px-1 shadow-[0_0_0_2px_#fff]">
            {cartCount > 99 ? '99+' : cartCount}
          </span>
        )}
      </button>

      {open && (
        <div className="dropdown-enter absolute right-0 top-[calc(100%+10px)] z-[100] w-[320px] bg-white border border-bone rounded-[16px] shadow-[0_24px_56px_rgba(0,0,0,0.16)] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-bone">
            <p className="text-[13px] font-bold text-carbon">Your Cart{cartCount > 0 ? ` (${cartCount})` : ''}</p>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="w-6 h-6 rounded-md flex items-center justify-center bg-transparent border-none cursor-pointer text-slate hover:bg-cream transition-colors"
            >
              <X size={13} />
            </button>
          </div>

          {items.length === 0 ? (
            <div className="py-9 px-4 text-center">
              <div className="w-11 h-11 rounded-full bg-cream flex items-center justify-center mx-auto mb-3">
                <ShoppingCart size={18} className="text-bone" />
              </div>
              <p className="text-[12.5px] font-semibold text-charcoal">Your cart is empty</p>
              <p className="text-[11px] text-slate mt-[3px]">Add items to see them here.</p>
            </div>
          ) : (
            <>
              <div className="max-h-[264px] overflow-y-auto divide-y divide-[#F5F4EF]">
                {recent.map(item => (
                  <div key={item.productVariantId} className="flex gap-2.5 p-3">
                    <ItemThumb item={item} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-charcoal leading-tight line-clamp-1">{item.name}</p>
                      <p className="text-[11px] text-slate mt-[3px]">Qty {item.quantity}</p>
                    </div>
                    <p className="text-[12.5px] font-bold text-carbon shrink-0">${lineTotal(item).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              {hiddenCount > 0 && (
                <p className="text-[10.5px] text-slate text-center py-2 border-t border-bone bg-cream/40">
                  +{hiddenCount} more item{hiddenCount !== 1 ? 's' : ''} in your cart
                </p>
              )}

              <div className="p-4 border-t border-bone">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[12px] text-slate">Subtotal</span>
                  <span className="text-[15px] font-bold text-carbon">${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" fullWidth className="justify-center" onClick={() => goTo('/cart')}>
                    View Cart
                  </Button>
                  <Button variant="primary" size="sm" fullWidth className="justify-center" onClick={() => goTo('/checkout')}>
                    Checkout <ArrowRight size={12} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
