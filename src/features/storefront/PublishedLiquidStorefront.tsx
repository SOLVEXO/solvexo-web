import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { apiGetPublishedLiquidThemeHtml, apiGetRecommendationsFragment, apiGetVariantProductId } from '@/api/services/liquidTheme';
import { apiSubscribeNewsletter } from '@/api/services/newsletter';
import { apiGetPublicStoreProducts } from '@/api/services/store';
import { useCartContext } from '@/contexts/CartContext';
import { useStorefront } from './StorefrontContext';
import { resolveLiquidStorefrontPath } from './liquidStorefrontRouting';
import { findChangeTarget, parseAddPayload, parseUpdatePayload, toShopifyCartJson } from './liquidCartAjax';
import { toShopifySearchJson } from './liquidStoreAjax';

export function PublishedLiquidStorefront({ storeId }: { storeId: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const { store } = useStorefront();
  const { cart, addToCart, setQty, removeItem, clearCart } = useCartContext();
  // Mirrors `cart` for code that needs the value AFTER an awaited mutation settles — a plain closure over
  // `cart` would still see the pre-mutation value, since React only updates it on the next render.
  const cartRef = useRef(cart);
  const cartWaiters = useRef<Array<() => void>>([]);
  useEffect(() => {
    cartRef.current = cart;
    const waiters = cartWaiters.current;
    cartWaiters.current = [];
    waiters.forEach((resolve) => resolve());
  }, [cart]);
  /** Resolves once `cart` has re-rendered at least once more (a mutation's `setCart` landed), or after a timeout. */
  const waitForCartUpdate = () => new Promise<void>((resolve) => {
    cartWaiters.current.push(resolve);
    setTimeout(resolve, 1500);
  });
  // Variant id -> product id, resolved once per variant (Solvexo's cart needs both; a theme's own AJAX calls
  // usually carry only the variant id, the same way Shopify's `/cart/add.js` does).
  const variantProductIds = useRef(new Map<string, string>());
  const resolveProductId = async (variantId: string): Promise<string | null> => {
    const known = cartRef.current?.items.find((item) => item.productVariantId === variantId)?.productId;
    if (known) return known;
    if (variantProductIds.current.has(variantId)) return variantProductIds.current.get(variantId)!;
    try {
      const result = await apiGetVariantProductId(variantId, storeId);
      const productId = result?.data?.product?._id ?? result?.data?.variant?.productId ?? null;
      if (productId) variantProductIds.current.set(variantId, productId);
      return productId;
    } catch { return null; }
  };
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
      // A theme's own predictive-search dropdown calling fetch('/search/suggest.json?q=...').
      if (event.data.type === 'solvexo:store-ajax' && typeof event.data.id === 'string' && event.data.action === 'predictive-search') {
        const { id, query } = event.data as { id: string; query?: { q?: string; limit?: string } };
        const reply = (status: number, body: unknown) => frameRef.current?.contentWindow?.postMessage({ type: 'solvexo:store-ajax-reply', id, status, body }, '*');
        const term = String(query?.q ?? '').trim().slice(0, 200);
        if (!term) { reply(200, toShopifySearchJson([], store?.baseCurrency ?? 'USD')); return; }
        const limit = Math.min(10, Math.max(1, Number(query?.limit) || 4));
        void apiGetPublicStoreProducts(storeId, { search: term, limit })
          .then((result) => reply(200, toShopifySearchJson(result.data.products, store?.baseCurrency ?? 'USD')))
          .catch(() => reply(200, toShopifySearchJson([], store?.baseCurrency ?? 'USD')));
      }
      // A theme's own "you may also like" widget calling fetch('/recommendations/products.json?section_id=&product_id=&limit=').
      if (event.data.type === 'solvexo:store-ajax' && typeof event.data.id === 'string' && event.data.action === 'recommendations') {
        const { id, query } = event.data as { id: string; query?: { section_id?: string; product_id?: string; limit?: string } };
        const reply = (status: number, html: string) => frameRef.current?.contentWindow?.postMessage({ type: 'solvexo:store-ajax-reply', id, status, html }, '*');
        const sectionId = String(query?.section_id ?? '');
        const productId = String(query?.product_id ?? '');
        if (!sectionId || !productId) { reply(200, ''); return; }
        void apiGetRecommendationsFragment(storeId, route, sectionId, productId, Number(query?.limit) || 4)
          .then((html) => reply(200, html))
          .catch(() => reply(200, ''));
      }
      // A theme's own JS calling fetch('/cart/add.js' | '/cart/change.js' | '/cart/update.js' | '/cart/clear.js' | '/cart.js')
      // — the sandboxed iframe can't reach the network (no connect-src), so its bridge script turns those calls into this
      // request/reply round trip instead, answered from the SAME cart the rest of the storefront uses.
      if (event.data.type === 'solvexo:cart-ajax' && typeof event.data.id === 'string' && typeof event.data.action === 'string') {
        const { id, action, payload } = event.data as { id: string; action: string; payload: unknown };
        const reply = (status: number, body: unknown) => frameRef.current?.contentWindow?.postMessage({ type: 'solvexo:cart-ajax-reply', id, status, body }, '*');
        void (async () => {
          try {
            if (action === 'get') { reply(200, toShopifyCartJson(cartRef.current)); return; }
            if (action === 'clear') { await clearCart({ silent: true }); await waitForCartUpdate(); reply(200, toShopifyCartJson(cartRef.current)); return; }
            if (action === 'add') {
              const lines = parseAddPayload(payload as Parameters<typeof parseAddPayload>[0]);
              if (!lines.length) { reply(422, { status: 422, message: 'Nothing to add', description: 'No valid variant/quantity was given.' }); return; }
              for (const line of lines) {
                const productId = await resolveProductId(line.variantId);
                if (!productId) { reply(422, { status: 422, message: 'Not found', description: `Variant ${line.variantId} could not be found.` }); return; }
                const ok = await addToCart(productId, line.variantId, undefined, line.quantity);
                if (!ok) { reply(422, { status: 422, message: 'Could not add to cart', description: 'This item could not be added to the cart.' }); return; }
              }
              await waitForCartUpdate();
              reply(200, toShopifyCartJson(cartRef.current));
              return;
            }
            if (action === 'change') {
              const target = findChangeTarget(cartRef.current, payload as Parameters<typeof findChangeTarget>[1]);
              const quantity = Number((payload as { quantity?: unknown })?.quantity);
              if (!target || !Number.isInteger(quantity) || quantity < 0 || quantity > 999) { reply(404, { status: 404, message: 'Not found', description: 'That cart line does not exist.' }); return; }
              const ok = quantity === 0 ? await removeItem(target.productId, target.productVariantId) : await setQty(target.productId, target.productVariantId, quantity);
              if (!ok) { reply(422, { status: 422, message: 'Could not update cart' }); return; }
              await waitForCartUpdate();
              reply(200, toShopifyCartJson(cartRef.current));
              return;
            }
            if (action === 'update') {
              const lines = parseUpdatePayload(cartRef.current, payload as Parameters<typeof parseUpdatePayload>[1]);
              for (const line of lines) {
                const ok = line.quantity === 0 ? await removeItem(line.item.productId, line.item.productVariantId) : await setQty(line.item.productId, line.item.productVariantId, line.quantity);
                if (!ok) { reply(422, { status: 422, message: 'Could not update cart' }); return; }
              }
              await waitForCartUpdate();
              reply(200, toShopifyCartJson(cartRef.current));
              return;
            }
            reply(404, { status: 404, message: 'Unknown cart action' });
          } catch (reason) {
            reply(500, { status: 500, message: reason instanceof Error ? reason.message : 'Cart request failed' });
          }
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
  }, [addToCart, cart, clearCart, removeItem, setQty, storeId, store]);

  if (loading) return <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-slate"><Loader2 size={18} className="animate-spin" /> Loading published theme…</div>;
  if (error) return <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
    <p role="alert" className="m-0 text-sm text-error">{error}</p>
    <button type="button" onClick={() => setRetry((current) => current + 1)} className="flex items-center gap-2 rounded-lg border border-bone bg-white px-3 py-2 text-sm font-semibold"><RefreshCw size={14} /> Retry</button>
  </div>;
  return <iframe
    ref={frameRef}
    title="Store theme"
    sandbox="allow-scripts"
    srcDoc={html}
    style={{ height: frameHeight ?? '100vh' }}
    className="block w-full border-0 bg-white"
  />;
}
