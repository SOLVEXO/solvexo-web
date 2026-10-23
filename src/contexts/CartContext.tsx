import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import {
  apiGetCart, apiAddToCart, apiUpdateCartQuantity, apiSetCartQuantity, apiRemoveCartItem, apiClearCart,
  type Cart, type CartItem,
} from '@/api/services/cart';
import { apiGetProductById, type MarketplaceProduct, type ProductVariant } from '@/api/services/marketplace';
import { TokenStorage } from '@/api/services/auth';
import {
  getGuestCartItems, addGuestCartItem, updateGuestCartQty, setGuestCartItemQuantity, removeGuestCartItem, clearGuestCart,
} from '@/utils/guestCart';
import { useToast } from '@/contexts/ToastContext';
import { trackPixelEvent } from '@/utils/trackingPixels';
import { ts } from '@/utils/tStatic';

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
  addToCart:     (productId: string, productVariantId: string, type?: 'physical' | 'digital', quantity?: number) => Promise<boolean>;
  updateQty:     (productId: string, productVariantId: string, action: 'increase' | 'decrease') => Promise<boolean>;
  setQty:        (productId: string, productVariantId: string, quantity: number) => Promise<boolean>;
  removeItem:    (productId: string, productVariantId: string) => Promise<boolean>;
  /** `silent: true` skips the success/error toast — for an automatic clear
   *  (checkout success, gateway return) rather than the buyer explicitly
   *  clicking "Clear cart". */
  clearCart:     (opts?: { silent?: boolean }) => Promise<void>;
  refetch:       () => void;
}

const CartCtx = createContext<CartContextValue | null>(null);

function syncCart(storeId: string, setCart: (c: Cart) => void) {
  apiGetCart(storeId).then(res => setCart(mergeTypes(res.data))).catch(() => {});
}

// `storeId` scopes the server-side cart to one store — pass the current
// storefront's `store.storeId` (via `useStorefront()`) when mounting this
// provider inside a store's subdomain. Nesting a second `<CartProvider
// storeId={...}>` inside `StorefrontLayout` (below where the store is
// resolved) shadows the app-wide instance mounted in `main.tsx` for every
// consumer under it — see `StorefrontLayout.tsx`.
export function CartProvider({ storeId, children }: { storeId?: string; children: ReactNode }) {
  const toast = useToast();
  const [cart,    setCart]    = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [adding,  setAdding]  = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const clearError = useCallback(() => setError(null), []);

  // Guest-only: caches each product's fetched detail (name/image/variants)
  // by id, so re-rendering the guest cart after a quantity bump doesn't
  // re-fetch products already fetched this session.
  const productCacheRef = useRef<Map<string, { product: MarketplaceProduct; variants: ProductVariant[] }>>(new Map());

  // Builds the same `Cart` shape the server returns, from the guest's
  // localStorage items — the rest of the app (BuyerNavbar's badge, CartPage,
  // CheckoutPage) reads `cart`/`cartCount` the same way regardless of which
  // source it came from.
  const refreshGuestCartDisplay = useCallback(async () => {
    const guestItems = getGuestCartItems();
    if (guestItems.length === 0) { if (!TokenStorage.isLoggedIn()) setCart(null); return; }

    setLoading(true);
    const uniqueProductIds = Array.from(new Set(guestItems.map(i => i.productId)));
    await Promise.all(uniqueProductIds.map(async pid => {
      if (productCacheRef.current.has(pid)) return;
      try {
        const res = await apiGetProductById(pid);
        productCacheRef.current.set(pid, { product: res.data.product, variants: res.data.variants });
      } catch {
        // Left uncached — this item is dropped from the display below
        // (e.g. the product was removed/unpublished since it was added).
      }
    }));

    const items: CartItem[] = [];
    for (const gi of guestItems) {
      const cached = productCacheRef.current.get(gi.productId);
      const variant = cached?.variants.find(v => v._id === gi.productVariantId);
      if (!cached || !variant) continue;
      const unitPrice = variant.price;
      items.push({
        productId:        gi.productId,
        productVariantId: gi.productVariantId,
        name:             cached.product.name,
        image:            cached.product.images,
        images:           cached.product.images,
        unitPrice,
        price:            unitPrice,
        currency:         variant.currency,
        quantity:         gi.quantity,
        options:          variant.options ?? [],
        itemTotal:        unitPrice * gi.quantity,
        type:             gi.type,
        orderMinQuantity:  cached.product.orderMinQuantity,
        orderMaxQuantity:  cached.product.orderMaxQuantity,
        orderQuantityStep: cached.product.orderQuantityStep,
      });
    }
    // A session started while the product lookups above were in flight (guest checkout / login): the real
    // server cart is the truth now, so a stale local snapshot must not overwrite it.
    if (TokenStorage.isLoggedIn()) { setLoading(false); return; }
    const totalItems = items.reduce((s, i) => s + i.quantity, 0);
    const totalPrice = items.reduce((s, i) => s + (i.itemTotal ?? 0), 0);
    setCart({ userId: 'guest', items, totalItems, totalPrice });
    setLoading(false);
  }, []);

  const fetchCart = useCallback(() => {
    if (!TokenStorage.isLoggedIn()) { refreshGuestCartDisplay(); return; }
    // No `storeId` means this provider isn't mounted on a store's subdomain
    // (the legacy, now-disconnected apex marketplace cart/checkout pages) —
    // there's no server-side cart to scope to, so just show nothing rather
    // than firing a request the backend will reject.
    if (!storeId) { setCart(null); return; }
    setLoading(true);
    apiGetCart(storeId)
      .then(res => setCart(mergeTypes(res.data)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshGuestCartDisplay, storeId]);

  // Loading the cart when the store/login state changes is a sync with the server (the loading flag is set inside).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchCart(); }, [fetchCart]);

  // Merges a guest's local cart into their real server cart the instant they
  // log in (any surface — full-page LoginPage, the inline AuthGateModal,
  // social login, OTP verify — all dispatch this same event from
  // TokenStorage.save()). Runs sequentially per item, not in parallel,
  // so concurrent add/increase calls never race on the same server cart doc.
  useEffect(() => {
    const onLogin = async () => {
      if (!storeId) { fetchCart(); return; }
      const guestItems = getGuestCartItems();
      if (guestItems.length > 0) {
        setLoading(true);
        for (const item of guestItems) {
          try {
            await apiAddToCart(item.productId, item.productVariantId, storeId);
            for (let i = 1; i < item.quantity; i++) {
              await apiUpdateCartQuantity(item.productId, item.productVariantId, 'increase', storeId);
            }
          } catch {
            // Product may no longer be available — skip it rather than
            // blocking the rest of the merge.
          }
        }
        clearGuestCart();
      }
      fetchCart();
    };
    window.addEventListener('solvexo:auth-login', onLogin);
    return () => window.removeEventListener('solvexo:auth-login', onLogin);
  }, [fetchCart, storeId]);

  const cartCount = cart?.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;

  const addToCart = useCallback(async (
    productId: string,
    productVariantId: string,
    type?: 'physical' | 'digital',
    quantity = 1,
  ) => {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) return false;
    if (type) storeType(productVariantId, type);
    setError(null);
    setAdding(productVariantId);

    if (!TokenStorage.isLoggedIn()) {
      addGuestCartItem(productId, productVariantId, type, quantity);
      await refreshGuestCartDisplay();
      setAdding(null);
      toast.success(ts('pg.added_to_cart', 'Added to cart'));
      trackPixelEvent('AddToCart', { contentIds: [productId] });
      return true;
    }

    if (!storeId) { setAdding(null); return false; }

    try {
      const res = await apiAddToCart(productId, productVariantId, storeId, quantity);
      setCart(mergeTypes(res.data));
      toast.success(ts('pg.added_to_cart', 'Added to cart'));
      trackPixelEvent('AddToCart', { contentIds: [productId] });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add item to cart.';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setAdding(null);
    }
  }, [refreshGuestCartDisplay, toast, storeId]);

  const updateQty = useCallback(async (
    productId: string, productVariantId: string, action: 'increase' | 'decrease',
  ) => {
    if (!TokenStorage.isLoggedIn()) {
      updateGuestCartQty(productVariantId, action);
      await refreshGuestCartDisplay();
      return true;
    }

    if (!storeId) return false;

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
      await apiUpdateCartQuantity(productId, productVariantId, action, storeId);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : ts('pg.failed_to_update_quantity', 'Failed to update quantity.');
      setError(message);
      toast.error(message);
      return false;
    } finally {
      syncCart(storeId, c => setCart(c));
    }
  }, [refreshGuestCartDisplay, toast, storeId]);

  const setQty = useCallback(async (productId: string, productVariantId: string, quantity: number) => {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) return false;
    if (!TokenStorage.isLoggedIn()) {
      setGuestCartItemQuantity(productVariantId, quantity);
      await refreshGuestCartDisplay();
      return true;
    }
    if (!storeId) return false;
    setCart(prev => {
      if (!prev) return prev;
      const items = (prev.items ?? []).map(item => item.productVariantId === productVariantId
        ? { ...item, quantity, itemTotal: (item.unitPrice ?? item.price ?? 0) * quantity }
        : item);
      return {
        ...prev, items,
        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: items.reduce((sum, item) => sum + (item.itemTotal ?? 0), 0),
      };
    });
    try {
      await apiSetCartQuantity(productId, productVariantId, quantity, storeId);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : ts('pg.failed_to_set_cart_quantity', 'Failed to set cart quantity.');
      setError(message);
      toast.error(message);
      return false;
    } finally {
      syncCart(storeId, c => setCart(c));
    }
  }, [refreshGuestCartDisplay, storeId, toast]);

  const removeItem = useCallback(async (productId: string, productVariantId: string) => {
    removeType(productVariantId);

    if (!TokenStorage.isLoggedIn()) {
      removeGuestCartItem(productVariantId);
      await refreshGuestCartDisplay();
      toast.success(ts('pg.removed_from_cart', 'Removed from cart'));
      return true;
    }

    if (!storeId) return false;

    setCart(prev => {
      if (!prev) return prev;
      const items      = (prev.items ?? []).filter(i => i.productVariantId !== productVariantId);
      const totalItems = items.reduce((s, i) => s + i.quantity, 0);
      const totalPrice = items.reduce((s, i) => s + (i.itemTotal ?? (i.unitPrice ?? i.price ?? 0) * i.quantity), 0);
      return { ...prev, items, totalItems, totalPrice };
    });

    setError(null);
    try {
      await apiRemoveCartItem(productId, productVariantId, storeId);
      toast.success(ts('pg.removed_from_cart', 'Removed from cart'));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : ts('pg.failed_to_remove_item', 'Failed to remove item.');
      setError(message);
      toast.error(message);
      return false;
    } finally {
      syncCart(storeId, c => setCart(c));
    }
  }, [refreshGuestCartDisplay, toast, storeId]);

  const clearCart = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!TokenStorage.isLoggedIn()) {
      clearGuestCart();
      clearTypes();
      setCart(null);
      if (!silent) toast.success(ts('pg.cart_cleared', 'Cart cleared'));
      return;
    }
    // Was `!cart?._id` — the backend's getCart response never included `_id`
    // (fixed separately), so this guard always fired on a real account: every
    // page mount re-fetches the cart, silently overwriting any `_id` a
    // previous addToCart response had set, before this ever ran. That made
    // every post-order `clearCart()` call (checkout success, gateway return)
    // a no-op — the header badge stayed stale until something else
    // refetched the cart. `storeId` alone is enough to clear; the backend
    // route doesn't even read the cart id (see cart.controller.ts clear-cart).
    if (!storeId) return;
    clearTypes();
    setCart(null);
    setError(null);
    try {
      await apiClearCart(cart?._id ?? '', storeId);
      if (!silent) toast.success(ts('pg.cart_cleared', 'Cart cleared'));
    } catch (err) {
      const message = err instanceof Error ? err.message : ts('pg.failed_to_clear_cart', 'Failed to clear cart.');
      setError(message);
      if (!silent) toast.error(message);
      syncCart(storeId, c => setCart(c));
    }
  }, [cart, toast, storeId]);

  const value = useMemo<CartContextValue>(() => ({
    cart, cartCount, loading, adding, error, clearError, addToCart, updateQty, setQty, removeItem, clearCart, refetch: fetchCart,
  }), [cart, cartCount, loading, adding, error, clearError, addToCart, updateQty, setQty, removeItem, clearCart, fetchCart]);

  return (
    <CartCtx.Provider value={value}>
      {children}
    </CartCtx.Provider>
  );
}

// The provider and its hook live together by design (one import for consumers).
// eslint-disable-next-line react-refresh/only-export-components
export function useCartContext() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error('useCartContext must be used inside CartProvider');
  return ctx;
}

export type { CartItem, Cart };
