import type { PublicStoreData } from '@/api/services/store';
import type { StoreThemeData } from '@/api/services/storeTheme';

/**
 * Last-known store + theme for THIS host, kept in localStorage so a repeat visit paints the real storefront at once
 * (stale-while-revalidate): the layout shows the cached store immediately and refreshes it from the server in the
 * background. Public data only (what the storefront already receives) and never kept for a password-gated store.
 */
export interface BootSnapshot { store: PublicStoreData; theme: StoreThemeData; at: number }

const VERSION = 'v1';
const MAX_AGE_MS = 7 * 24 * 3600 * 1000;
const MAX_BYTES = 400_000;

const keyFor = (host: string) => `solvexo:sf-boot:${VERSION}:${host.toLowerCase()}`;

export function readBootSnapshot(host: string = window.location.hostname): BootSnapshot | null {
  try {
    const raw = localStorage.getItem(keyFor(host));
    if (!raw) return null;
    const snap = JSON.parse(raw) as BootSnapshot;
    if (!snap?.store?.storeId || !snap.theme || typeof snap.at !== 'number') return null;
    if (Date.now() - snap.at > MAX_AGE_MS) return null;
    // A password / coming-soon store is never rendered from the cache (its theme is locked until the visitor unlocks it).
    if (snap.store.privacyMode && snap.store.privacyMode !== 'public') return null;
    return snap;
  } catch {
    return null;
  }
}

export function writeBootSnapshot(store: PublicStoreData, theme: StoreThemeData, host: string = window.location.hostname): void {
  try {
    if (store.privacyMode && store.privacyMode !== 'public') { localStorage.removeItem(keyFor(host)); return; }
    const raw = JSON.stringify({ store, theme, at: Date.now() } satisfies BootSnapshot);
    if (raw.length > MAX_BYTES) { localStorage.removeItem(keyFor(host)); return; }
    localStorage.setItem(keyFor(host), raw);
  } catch {
    /* storage can be full or blocked: the storefront just loads the normal way */
  }
}

export function clearBootSnapshot(host: string = window.location.hostname): void {
  try { localStorage.removeItem(keyFor(host)); } catch { /* ignore */ }
}
