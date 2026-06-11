import {
  createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode,
} from 'react';
import {
  apiGetWishlist, apiAddToWishlist, apiRemoveFromWishlist, apiGetWishlistItem,
  type WishlistListItem,
} from '@/api/commerce/wishlist';

export interface WishlistContextValue {
  wishlistItems:      WishlistListItem[];
  wishlistCount:      number;
  loading:            boolean;
  wishlisting:        string | null;   // variantId currently being toggled
  isWishlisted:       (productId: string, variantId: string) => boolean;
  addToWishlist:      (productId: string, variantId: string) => Promise<void>;
  removeFromWishlist: (productId: string, variantId: string) => Promise<void>;
  toggleWishlist:     (productId: string, variantId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function useWishlistContext() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlistContext must be used inside WishlistProvider');
  return ctx;
}

function wKey(productId: string, variantId: string) {
  return `${productId}::${variantId}`;
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<WishlistListItem[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [wishlisting,   setWishlisting]   = useState<string | null>(null);
  const [wishlistedKeys, setWishlistedKeys] = useState(() => new Set<string>());

  // Maps "productId::variantId" → wishlistId (needed for removal)
  const idMap = useRef(new Map<string, string>());

  // Initial fetch — silently skip if not authenticated
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiGetWishlist()
      .then(res => {
        if (cancelled) return;
        const items = res.data ?? [];
        setWishlistItems(items);
        const keys = new Set<string>();
        items.forEach(item => {
          item.variants.forEach(v => keys.add(wKey(item.product._id, v._id)));
        });
        setWishlistedKeys(keys);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const isWishlisted = useCallback(
    (productId: string, variantId: string) => wishlistedKeys.has(wKey(productId, variantId)),
    [wishlistedKeys],
  );

  const addToWishlist = useCallback(async (productId: string, variantId: string) => {
    const k = wKey(productId, variantId);
    setWishlisting(variantId);
    // Optimistic
    setWishlistedKeys(prev => new Set(prev).add(k));
    try {
      const res = await apiAddToWishlist(productId, variantId);
      idMap.current.set(k, res.data.wishlist._id);
      setWishlistItems(prev => {
        if (prev.some(i => i.product._id === productId)) return prev;
        return [...prev, { product: res.data.product, variants: [res.data.variant] }];
      });
    } catch {
      setWishlistedKeys(prev => { const s = new Set(prev); s.delete(k); return s; });
    } finally {
      setWishlisting(null);
    }
  }, []);

  const removeFromWishlist = useCallback(async (productId: string, variantId: string) => {
    const k = wKey(productId, variantId);
    setWishlisting(variantId);
    // Optimistic
    setWishlistedKeys(prev => { const s = new Set(prev); s.delete(k); return s; });
    setWishlistItems(prev => prev.filter(i => i.product._id !== productId));
    try {
      let wishlistId = idMap.current.get(k);
      if (!wishlistId) {
        const r = await apiGetWishlistItem(productId, variantId);
        wishlistId = r.data.wishlist._id;
        idMap.current.set(k, wishlistId);
      }
      await apiRemoveFromWishlist(wishlistId);
    } catch {
      // Rollback keys (don't restore items list for simplicity)
      setWishlistedKeys(prev => new Set(prev).add(k));
    } finally {
      setWishlisting(null);
    }
  }, []);

  const toggleWishlist = useCallback(async (productId: string, variantId: string) => {
    if (wishlistedKeys.has(wKey(productId, variantId))) {
      await removeFromWishlist(productId, variantId);
    } else {
      await addToWishlist(productId, variantId);
    }
  }, [wishlistedKeys, addToWishlist, removeFromWishlist]);

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      wishlistCount: wishlistItems.length,
      loading,
      wishlisting,
      isWishlisted,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  );
}
