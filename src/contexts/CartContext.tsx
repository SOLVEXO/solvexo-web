import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  apiGetCart, apiAddToCart, apiUpdateCartQuantity, apiRemoveCartItem, apiClearCart,
  type Cart, type CartItem,
} from '@/api/commerce/cart';
import { TokenStorage } from '@/api/commerce/auth';

interface CartContextValue {
  cart:          Cart | null;
  cartCount:     number;
  loading:       boolean;
  adding:        string | null;
  addToCart:     (productId: string, productVariantId: string) => Promise<void>;
  updateQty:     (productId: string, productVariantId: string, action: 'increase' | 'decrease') => Promise<void>;
  removeItem:    (productId: string, productVariantId: string) => Promise<void>;
  clearCart:     () => Promise<void>;
  refetch:       () => void;
}

const CartCtx = createContext<CartContextValue | null>(null);

// Silent background sync — never touches `loading` state
function syncCart(setCart: (c: Cart) => void) {
  apiGetCart().then(res => setCart(res.data)).catch(() => {});
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart,    setCart]    = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [adding,  setAdding]  = useState<string | null>(null);

  // Initial load only — shows skeleton on first open
  const fetchCart = useCallback(() => {
    if (!TokenStorage.isLoggedIn()) return;
    setLoading(true);
    apiGetCart()
      .then(res => setCart(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const cartCount = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;

  const addToCart = useCallback(async (productId: string, productVariantId: string) => {
    setAdding(productVariantId);
    try {
      const res = await apiAddToCart(productId, productVariantId);
      setCart(res.data);
    } finally {
      setAdding(null);
    }
  }, []);

  const updateQty = useCallback(async (
    productId: string, productVariantId: string, action: 'increase' | 'decrease',
  ) => {
    // Optimistic: update quantity & itemTotal in local state immediately
    setCart(prev => {
      if (!prev) return prev;
      const items = prev.items.map(item => {
        if (item.productVariantId !== productVariantId) return item;
        const newQty   = action === 'increase' ? item.quantity + 1 : Math.max(1, item.quantity - 1);
        const unitPrice = item.unitPrice ?? item.price ?? 0;
        return { ...item, quantity: newQty, itemTotal: unitPrice * newQty };
      });
      const totalItems = items.reduce((s, i) => s + i.quantity, 0);
      const totalPrice = items.reduce((s, i) => s + (i.itemTotal ?? 0), 0);
      return { ...prev, items, totalItems, totalPrice };
    });

    // Background API call + silent sync
    try {
      await apiUpdateCartQuantity(productId, productVariantId, action);
    } finally {
      syncCart(c => setCart(c));
    }
  }, []);

  const removeItem = useCallback(async (productId: string, productVariantId: string) => {
    // Optimistic: remove from list immediately
    setCart(prev => {
      if (!prev) return prev;
      const items = prev.items.filter(i => i.productVariantId !== productVariantId);
      const totalItems = items.reduce((s, i) => s + i.quantity, 0);
      const totalPrice = items.reduce((s, i) => s + (i.itemTotal ?? (i.unitPrice ?? i.price ?? 0) * i.quantity), 0);
      return { ...prev, items, totalItems, totalPrice };
    });

    try {
      await apiRemoveCartItem(productId, productVariantId);
    } finally {
      syncCart(c => setCart(c));
    }
  }, []);

  const clearCart = useCallback(async () => {
    if (!cart?._id) return;
    setCart(null);
    try {
      await apiClearCart(cart._id);
    } catch {
      syncCart(c => setCart(c));
    }
  }, [cart]);

  return (
    <CartCtx.Provider value={{ cart, cartCount, loading, adding, addToCart, updateQty, removeItem, clearCart, refetch: fetchCart }}>
      {children}
    </CartCtx.Provider>
  );
}

export function useCartContext() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error('useCartContext must be used inside CartProvider');
  return ctx;
}

export type { CartItem, Cart };
