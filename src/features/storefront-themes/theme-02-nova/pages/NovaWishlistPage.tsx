import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ImageOff, Loader2 } from 'lucide-react';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { useCartContext } from '@/contexts/CartContext';
import { currencySymbol, fmt2 } from '@/utils/currency';
import { NovaButton } from '../components/NovaButton';
import { novaTheme as t } from '../theme.config';

/** Theme 02's own Wishlist page — ported functionally 1:1 from
 *  `AtelierWishlistPage`, restyled with Nova's rounded/pill vocabulary.
 *  Real, backend-wired (`useWishlistContext`, the same context the product-
 *  card heart icon already writes to). */
export function NovaWishlistPage() {
  useStorefrontSeo({ title: 'My Wishlist', noindex: true });
  const { wishlistItems, loading, wishlisting, removeFromWishlist } = useWishlistContext();
  const { addToCart, adding } = useCartContext();
  const [addedId, setAddedId] = useState<string | null>(null);

  const handleAddToCart = async (productId: string, variantId: string, type: 'physical' | 'digital') => {
    await addToCart(productId, variantId, type);
    setAddedId(variantId);
    setTimeout(() => setAddedId(id => (id === variantId ? null : id)), 1800);
  };

  return (
    <main className="mx-auto" style={{ maxWidth: '960px', padding: `48px ${t.layout.containerPadX}` }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: t.fonts.display, fontSize: '24px', fontWeight: 700, color: t.colors.ink }}>My Wishlist</h1>
        <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted, marginTop: '4px' }}>
          {loading ? 'Loading…' : `${wishlistItems.length} item${wishlistItems.length !== 1 ? 's' : ''} saved`}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse flex gap-4" style={{ border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md, padding: '16px' }}>
              <div style={{ width: '84px', height: '84px', background: t.colors.bgAlt, borderRadius: t.radius.sm, flexShrink: 0 }} />
              <div className="flex-1 flex flex-col gap-2 justify-center">
                <div style={{ height: '12px', width: '70%', background: t.colors.bgAlt, borderRadius: '4px' }} />
                <div style={{ height: '12px', width: '40%', background: t.colors.bgAlt, borderRadius: '4px' }} />
              </div>
            </div>
          ))}
        </div>
      ) : wishlistItems.length === 0 ? (
        <div className="flex flex-col items-center text-center" style={{ padding: '64px 0', border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md }}>
          <Heart size={28} style={{ color: t.colors.inkMuted, marginBottom: '14px' }} />
          <p style={{ fontFamily: t.fonts.display, fontSize: '16px', fontWeight: 700, color: t.colors.ink }}>Your wishlist is empty</p>
          <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted, marginTop: '6px', marginBottom: '20px' }}>
            Tap the heart on any product to save it here.
          </p>
          <NovaButton onClick={() => { window.location.href = '/'; }}>Continue Shopping</NovaButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {wishlistItems.map(({ product, variants }) => {
            const variant = variants[0];
            if (!variant) return null;
            const isBusy = wishlisting === variant._id;
            const isAdding = adding === variant._id;
            const justAdded = addedId === variant._id;
            const type = product.productType === 'physical' || product.type === 'physical' ? 'physical' : 'digital';
            return (
              <div key={product._id} className="flex gap-4" style={{ border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md, padding: '16px' }}>
                <Link to={`/product/${product.slug}`} style={{ width: '84px', height: '84px', flexShrink: 0, background: t.colors.bgAlt, borderRadius: t.radius.sm, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {product.images?.[0]
                    ? <img loading="lazy" decoding="async" src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    : <ImageOff size={20} style={{ color: t.colors.inkMuted }} />}
                </Link>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <Link to={`/product/${product.slug}`} className="no-underline" style={{ fontFamily: t.fonts.display, fontSize: '14px', fontWeight: 700, color: t.colors.ink }}>
                      {product.name}
                    </Link>
                    <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.ink, marginTop: '4px' }}>
                      {currencySymbol(variant.currency)}{fmt2(variant.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3" style={{ marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(product._id, variant._id, type)}
                      disabled={isAdding || variant.stock <= 0}
                      className="flex items-center gap-1.5 cursor-pointer bg-transparent border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 700, color: t.colors.accent }}
                    >
                      {isAdding ? <Loader2 size={13} className="animate-spin" /> : <ShoppingBag size={13} />}
                      {variant.stock <= 0 ? 'Out of stock' : justAdded ? 'Added ✓' : 'Add to Cart'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromWishlist(product._id, variant._id)}
                      disabled={isBusy}
                      aria-label="Remove from wishlist"
                      className="flex items-center gap-1.5 cursor-pointer bg-transparent border-0 disabled:opacity-50"
                      style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted }}
                    >
                      {isBusy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
