import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { apiGetPublishedLiquidThemeHtml } from '@/api/services/storeTheme';
import { apiSubscribeNewsletter } from '@/api/services/newsletter';
import { useCartContext } from '@/contexts/CartContext';
import { resolveLiquidStorefrontPath } from './liquidStorefrontRouting';

export function PublishedLiquidStorefront({ storeId }: { storeId: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const { cart, addToCart, setQty, removeItem, clearCart } = useCartContext();
  const [html, setHtml] = useState('');
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const [loadedKey, setLoadedKey] = useState('');
  const [retry, setRetry] = useState(0);
  const [frameHeight, setFrameHeight] = useState<number | null>(null);
  const route = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const cartSignature = JSON.stringify((cart?.items ?? []).map((item) => ({
    productId: item.productId,
    productVariantId: item.productVariantId,
    quantity: item.quantity,
  })));
  const cartItems = useMemo(() => JSON.parse(cartSignature) as {
    productId: string; productVariantId: string; quantity: number;
  }[], [cartSignature]);
  const requestKey = `${storeId}:${route}:${retry}:${cartSignature}`;
  const error = failure?.key === requestKey ? failure.message : '';
  const loading = loadedKey !== requestKey && !error;

  useEffect(() => {
    let cancelled = false;
    apiGetPublishedLiquidThemeHtml(storeId, route, cartItems)
      .then((result) => {
        if (!cancelled) {
          setHtml(result.data.html);
          setFailure(null);
          setLoadedKey(requestKey);
        }
      })
      .catch((reason) => {
        if (!cancelled) {
          setFailure({
            key: requestKey,
            message: reason instanceof Error ? reason.message : 'Published theme could not be rendered.',
          });
          setLoadedKey(requestKey);
        }
      })
    return () => { cancelled = true; };
  }, [cartItems, requestKey, route, storeId]);

  useEffect(() => {
    const navigate = (path: string) => {
      const target = resolveLiquidStorefrontPath(path);
      if (target) window.location.assign(target);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow || !event.data || typeof event.data !== 'object') return;
      if (event.data.type === 'solvexo:resize' && Number.isInteger(event.data.height)) {
        setFrameHeight(Math.max(window.innerHeight, Math.min(30000, Number(event.data.height))));
      }
      if (event.data.type === 'solvexo:navigate' && typeof event.data.path === 'string') {
        navigate(event.data.path);
      }
      if (event.data.type === 'solvexo:subscribe') {
        const email = typeof event.data.email === 'string' ? event.data.email.trim().slice(0, 254) : '';
        const reply = (ok: boolean, message: string) => frameRef.current?.contentWindow?.postMessage({ type: 'solvexo:subscribed', ok, message }, '*');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { reply(false, 'Enter a valid email address.'); return; }
        void apiSubscribeNewsletter(email, { storeId, source: 'store_section' })
          .then(() => reply(true, "Thanks for subscribing! If this store asks for confirmation, check your inbox."))
          .catch((reason) => reply(false, reason instanceof Error ? reason.message : 'Could not subscribe right now.'));
      }
      if (event.data.type === 'solvexo:checkout') navigate('/checkout');
      if (event.data.type === 'solvexo:cart-clear') {
        void clearCart().then(() => navigate('/cart'));
      }
      if (event.data.type === 'solvexo:cart-update' && Array.isArray(event.data.items)) {
        const updates = event.data.items as unknown[];
        if (updates.length > 100) return;
        void (async () => {
          for (const update of updates) {
            if (!update || typeof update !== 'object') continue;
            const item = update as { variantId?: unknown; index?: unknown; quantity?: unknown };
            if (!Number.isInteger(item.quantity)) continue;
            const quantity = Number(item.quantity);
            if (quantity < 0 || quantity > 999) continue;
            const current = typeof item.variantId === 'string'
              ? cart?.items.find((line) => line.productVariantId === item.variantId)
              : Number.isInteger(item.index) ? cart?.items[Number(item.index)] : undefined;
            if (!current) continue;
            const changed = quantity === 0
              ? await removeItem(current.productId, current.productVariantId)
              : await setQty(current.productId, current.productVariantId, quantity);
            if (!changed) return;
          }
          navigate('/cart');
        })();
      }
      if (
        event.data.type === 'solvexo:add-to-cart' &&
        typeof event.data.productId === 'string' &&
        typeof event.data.variantId === 'string' &&
        event.data.variantId.length > 0
      ) {
        const quantity = Number(event.data.quantity ?? 1);
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) return;
        const type = event.data.productType === 'digital' ? 'digital' : 'physical';
        void (async () => {
          const added = await addToCart(event.data.productId, event.data.variantId, type, quantity);
          if (!added) return;
          navigate('/cart');
        })();
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [addToCart, cart, clearCart, removeItem, setQty, storeId]);

  if (loading) return <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-slate"><Loader2 size={18} className="animate-spin" /> Loading published theme…</div>;
  if (error) return <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
    <p role="alert" className="m-0 text-sm text-error">{error}</p>
    <button type="button" onClick={() => setRetry((current) => current + 1)} className="flex items-center gap-2 rounded-lg border border-bone bg-white px-3 py-2 text-sm font-semibold"><RefreshCw size={14} /> Retry</button>
  </div>;
  return <iframe
    ref={frameRef}
    title="Published Shopify-compatible theme"
    sandbox="allow-scripts"
    srcDoc={html}
    style={{ height: frameHeight ?? '100vh' }}
    className="block w-full border-0 bg-white"
  />;
}
