import { useEffect, useState, type FormEvent } from 'react';
import { apiGetAutomationPublicConfig, apiRequestBackInStock } from '@/api/services/marketingAutomations';

// One lookup per store per page load — the setting rarely changes and every
// product page on the store needs the same answer.
const configCache = new Map<string, Promise<boolean>>();

function backInStockEnabled(storeId: string): Promise<boolean> {
  let pending = configCache.get(storeId);
  if (!pending) {
    pending = apiGetAutomationPublicConfig(storeId)
      .then(res => !!res.data?.backInStockEnabled)
      .catch(() => false);
    configCache.set(storeId, pending);
  }
  return pending;
}

export type BackInStockStatus = 'idle' | 'loading' | 'done' | 'available' | 'error';

/** State + submit for a theme's "Notify me when available" form — each theme
 *  renders its own markup. `enabled` is false until the store's setting is
 *  known, and whenever the variant is in stock. Resets on variant change. */
export function useBackInStock(storeId: string | undefined, productId: string | undefined, variantId: string | undefined, outOfStock: boolean) {
  const [enabled, setEnabled] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<BackInStockStatus>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    backInStockEnabled(storeId).then(v => { if (!cancelled) setEnabled(v); });
    return () => { cancelled = true; };
  }, [storeId]);

  // Picking another variant starts the form over (adjusted during render,
  // not in an effect).
  const [forVariant, setForVariant] = useState(variantId);
  if (forVariant !== variantId) {
    setForVariant(variantId);
    setStatus('idle');
    setMessage('');
  }

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!storeId || !productId || !variantId || !email.trim() || status === 'loading') return;
    setStatus('loading');
    setMessage('');
    try {
      const res = await apiRequestBackInStock({ storeId, productId, variantId, email: email.trim() });
      if (res.data?.inStock) {
        setStatus('available');
        setMessage(res.message || 'Good news — this item is in stock right now. Refresh the page to buy it.');
      } else {
        setStatus('done');
        setMessage(`We'll email you at ${email.trim()} when it's back in stock.`);
      }
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error && err.message ? err.message : 'Something went wrong — please try again.');
    }
  };

  return {
    show: enabled && outOfStock && !!variantId && !!productId,
    email, setEmail, status, message, submit,
  };
}
