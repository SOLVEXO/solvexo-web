import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import {
  apiGetCart, apiAddToCart, apiUpdateCartQuantity, apiRemoveCartItem, apiClearCart,
  type Cart, type CartItem,
} from '@/api/services/cart';
import { TokenStorage } from '@/api/services/auth';

// ── localStorage: variantId → type map ────────────────────────────────────────
const TYPES_KEY = 'solvexo_cart_types';

function getStoredTypes(): Record<string, 'physical' | 'digital'> {
  try { return JSON.parse(localStorage.getItem(TYPES_KEY) ?? '{}'); }
  catch { return {}; }
}

function storeType(variantId: string, type: 'physical' | 'digital') {
  const map = getStoredTypes();
  map[variantId] = type;
  localStorage.setItem(TYPES_KEY, JSON.stringify(map));
}

function removeType(variantId: string) {
  const map = getStoredTypes();
  delete map[variantId];
  localStorage.setItem(TYPES_KEY, JSON.stringify(map));
}

function clearTypes() {
  localStorage.removeItem(TYPES_KEY);
}

function mergeTypes(cart: Cart): Cart {
  const stored = getStoredTypes();
  return {
    ...cart,
    items: (cart.items ?? []).map(item => ({
      ...item,
      type: item.type ?? stored[item.productVariantId],
    })),
  };
}

// ── Context ───────────────────────────────────────────────────────────────────

interface CartContextValue {
  cart:          Cart | null;
  cartCount:     number;
  loading:       boolean;
  adding:        string | null;
  error:         string | null;
  clearError:    () => void;
  addToCart:     (productId: string, productVariantId: string, type?: 'physical' | 'digital') => Promise<void>;
  updateQty:     (productId: string, productVariantId: string, action: 'increase' | 'decrease') => Promise<void>;
  removeItem:    (productId: string, productVariantId: string) => Promise<void>;
  clearCart:     () => Promise<void>;
  refetch:       () => void;
}

const CartCtx = createContext<CartContextValue | null>(null);

function syncCart(setCart: (c: Cart) => void) {
  apiGetCart().then(res => setCart(mergeTypes(res.data))).catch(() => {});
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart,    setCart]    = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [adding,  setAdding]  = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const clearError = useCallback(() => setError(null), []);

  const fetchCart = useCallback(() => {
    if (!TokenStorage.isLoggedIn()) return;
    setLoading(true);
    apiGetCart()
      .then(res => setCart(mergeTypes(res.data)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const cartCount = cart?.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;

  const addToCart = useCallback(async (
    productId: string,
    productVariantId: string,
    type?: 'physical' | 'digital',
  ) => {
    setAdding(productVariantId);
    if (type) storeType(productVariantId, type);
    setError(null);
    try {
      const res = await apiAddToCart(productId, productVariantId);
      setCart(mergeTypes(res.data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item to cart.');
    } finally {
      setAdding(null);
    }
  }, []);

  const updateQty = useCallback(async (
    productId: string, productVariantId: string, action: 'increase' | 'decrease',
  ) => {
    setCart(prev => {
      if (!prev) return prev;
      const items = (prev.items ?? []).map(item => {
        if (item.productVariantId !== productVariantId) return item;
        const newQty    = action === 'increase' ? item.quantity + 1 : Math.max(1, item.quantity - 1);
        const unitPrice = item.unitPrice ?? item.price ?? 0;
        return { ...item, quantity: newQty, itemTotal: unitPrice * newQty };
      });
      const totalItems = items.reduce((s, i) => s + i.quantity, 0);
      const totalPrice = items.reduce((s, i) => s + (i.itemTotal ?? 0), 0);
      return { ...prev, items, totalItems, totalPrice };
    });

    setError(null);
    try {
      await apiUpdateCartQuantity(productId, productVariantId, action);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quantity.');
    } finally {
      syncCart(c => setCart(c));
    }
  }, []);

  const removeItem = useCallback(async (productId: string, productVariantId: string) => {
    removeType(productVariantId);
    setCart(prev => {
      if (!prev) return prev;
      const items      = (prev.items ?? []).filter(i => i.productVariantId !== productVariantId);
      const totalItems = items.reduce((s, i) => s + i.quantity, 0);
      const totalPrice = items.reduce((s, i) => s + (i.itemTotal ?? (i.unitPrice ?? i.price ?? 0) * i.quantity), 0);
      return { ...prev, items, totalItems, totalPrice };
    });

    setError(null);
    try {
      await apiRemoveCartItem(productId, productVariantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item.');
    } finally {
      syncCart(c => setCart(c));
    }
  }, []);

  const clearCart = useCallback(async () => {
    if (!cart?._id) return;
    clearTypes();
    setCart(null);
    setError(null);
    try {
      await apiClearCart(cart._id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cart.');
      syncCart(c => setCart(c));
    }
  }, [cart]);

  const value = useMemo<CartContextValue>(() => ({
    cart, cartCount, loading, adding, error, clearError, addToCart, updateQty, removeItem, clearCart, refetch: fetchCart,
  }), [cart, cartCount, loading, adding, error, clearError, addToCart, updateQty, removeItem, clearCart, fetchCart]);

  return (
    <CartCtx.Provider value={value}>
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
