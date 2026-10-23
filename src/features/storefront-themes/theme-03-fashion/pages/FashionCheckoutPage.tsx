import { useCallback, useEffect, useState } from 'react';
import { ts } from '@/utils/tStatic';
import { scrollRootToTop } from '@/utils/scrollRoot';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCartContext } from '@/contexts/CartContext';
import { useCheckoutSession } from '../../useGuestContact';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { fashionTheme as t } from '../theme.config';
import { EmptyState, ErrorState, Page } from '../ui/primitives';
import type { PlacedLike } from '../../core/checkout/checkoutApi';
import { parseBuyNow } from '../../core/checkout/checkoutMath';
import { CheckoutBody } from './checkout/CheckoutBody';
import { CheckoutSkeleton } from './checkout/CheckoutSkeleton';
import { OrderPlaced } from './checkout/OrderPlaced';
import { WithPageSections } from '../ui/WithPageSections';

/** `/checkout` - Maison's own checkout: contact, delivery, payment and a live order summary. */
export function FashionCheckoutPage() {
  return <WithPageSections pageKey="checkout"><FashionCheckoutPageContent /></WithPageSections>;
}

function FashionCheckoutPageContent() {
  const { store } = useStorefront();
  const [params] = useSearchParams();
  const { loggedIn, guest, preparing, denied } = useCheckoutSession();
  const { cart, loading, error, refetch, clearCart } = useCartContext();
  const [placed, setPlaced] = useState<{ orders: PlacedLike[]; guestEmail: string | null } | null>(null);
  useStorefrontSeo({ title: placed ? ts('checkout.orderConfirmed', 'Order confirmed') : ts('checkout.title', 'Checkout'), noindex: true });
  // The confirmation replaces a long, scrolled page: show it from the top.
  const isPlaced = !!placed;
  useEffect(() => { if (isPlaced) scrollRootToTop(); }, [isPlaced]);

  // "Buy it now" (?buyNow=productId:variantId): only that line is checked out, and only if it is really in the cart.
  const wanted = parseBuyNow(params.get('buyNow'));
  const allItems = cart?.items ?? [];
  const buyNowLines = wanted ? allItems.filter(i => i.productId === wanted.productId && i.productVariantId === wanted.variantId) : [];
  const buyNow = buyNowLines.length > 0 ? wanted : null;
  const items = buyNow ? buyNowLines : allItems;

  // The guest cart can finish building its local copy AFTER the session started and the server cart loaded, and then
  // overwrite it; once signed in a local ('guest') cart is stale, so load the real one again instead of waiting forever.
  const staleLocalCart = loggedIn && !preparing && !loading && cart?.userId === 'guest';
  useEffect(() => { if (staleLocalCart) refetch(); }, [staleLocalCart, refetch]);

  const onPlaced = useCallback((orders: PlacedLike[], guestEmail: string | null) => {
    setPlaced({ orders, guestEmail });
    // The confirmation is shown first, so clearing the cart can never flash an "empty cart" screen.
    if (buyNow) refetch(); else void clearCart({ silent: true });
  }, [buyNow, refetch, clearCart]);

  if (placed) return <OrderPlaced orders={placed.orders} storeName={store.name} guestEmail={placed.guestEmail} />;
  if (preparing) return <CheckoutSkeleton />;
  if (!loggedIn || denied) return <Navigate to={`/login?redirect=${encodeURIComponent('/checkout')}`} replace />;

  // A local guest cart (userId 'guest') is being merged into the server cart right after the session starts.
  if ((loading && !cart) || cart?.userId === 'guest') return <CheckoutSkeleton />;
  if (error && !cart) return <Page><ErrorState message={error} onRetry={refetch} /></Page>;
  if (!cart || items.length === 0) {
    return (
      <Page narrow>
        <EmptyState
          icon={<ShoppingBag size={24} aria-hidden />} title={ts('cart.cartEmpty', 'Your cart is empty')} text={ts('checkout.cartEmptyBefore', 'Add something to your cart before checking out.')}
          action={<Link to="/search" className="fx-pill" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: t.buttonRadiusPx }}>{ts('cart.startShopping', 'Start shopping')}</Link>}
        />
      </Page>
    );
  }

  return (
    <CheckoutBody
      storeId={cart.storeId ?? store.storeId} storeName={store.name} baseCurrency={String(store.baseCurrency ?? 'USD')}
      items={items} buyNow={buyNow} guest={guest} loggedIn={loggedIn} onPlaced={onPlaced}
    />
  );
}

export default FashionCheckoutPage;
