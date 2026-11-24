import { useEffect, useSyncExternalStore } from 'react';
import { apiGetPublicSearchConfig, type BrowseConfig } from '@/api/services/searchConfig';
import { useStorefront } from '@/features/storefront/StorefrontContext';

/** One shared copy per store of the seller's filter / sort / counts choices. Until it loads (or if it fails) the
 *  storefront shows everything exactly as before. */
const cache = new Map<string, BrowseConfig>();
const started = new Set<string>();
const listeners = new Set<() => void>();

function load(storeId: string) {
  if (started.has(storeId)) return;
  started.add(storeId);
  apiGetPublicSearchConfig(storeId)
    .then(res => { if (res && Array.isArray(res.filters)) { cache.set(storeId, res); listeners.forEach(l => l()); } })
    .catch(() => { started.delete(storeId); });
}

export function resetBrowseConfigCache() { cache.clear(); started.clear(); listeners.forEach(l => l()); }

export interface BrowseSettings { filters?: BrowseConfig['filters']; sorts?: BrowseConfig['sorts']; showCounts: boolean }
const NONE: BrowseSettings = { showCounts: true };

export function useBrowseConfig(): BrowseSettings {
  const { store } = useStorefront();
  const storeId = store?.storeId;
  const cfg = useSyncExternalStore(cb => { listeners.add(cb); return () => { listeners.delete(cb); }; }, () => (storeId ? cache.get(storeId) : undefined), () => (storeId ? cache.get(storeId) : undefined));
  useEffect(() => { if (storeId) load(storeId); }, [storeId]);
  return cfg ? { filters: cfg.filters, sorts: cfg.sorts, showCounts: cfg.showCounts !== false } : NONE;
}
