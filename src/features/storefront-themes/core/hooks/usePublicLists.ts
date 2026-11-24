import { useEffect, useRef, useState } from 'react';
import { apiGetPublicCollections, type PublicCollectionSummary } from '@/api/services/collections';
import { apiListPublicStorePages, type PublicPageSummary } from '@/api/services/storePages';
import { dropSsr, peekSsr, wantSsr } from '@/utils/ssrData';

/**
 * Loads one public list for a store (the collections or the pages the header, footer and collection tiles show).
 * A server-rendered page carries it under `ssrKey`, so the very first render already has the list (no empty menu, no
 * request); otherwise it loads in an effect as before. The key is the same one the collections page uses, so a page that
 * needs the list twice asks for it once.
 *
 * `initial` is what shows while loading; `onError` (when given) is what a failed load turns into, otherwise a failure keeps `initial`.
 */
function useSeededLoad<T, I extends T | null>(ssrKey: string, load: () => Promise<T>, initial: I, onError?: T): T | I {
  const [seeded] = useState(() => peekSsr<T>(ssrKey));
  const skipFirst = useRef(seeded !== undefined);
  const [value, setValue] = useState<T | I>(seeded !== undefined ? seeded : initial);
  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; });
  // Server collecting pass: ask for the list (no effect runs on the server). A failure is not stored: the browser loads it itself.
  if (seeded === undefined) wantSsr(ssrKey, load);
  useEffect(() => {
    if (skipFirst.current) { skipFirst.current = false; dropSsr(ssrKey); return; }
    let off = false;
    loadRef.current()
      .then(v => { if (!off) setValue(v); })
      .catch(() => { if (!off && onError !== undefined) setValue(onError); });
    return () => { off = true; };
  }, [ssrKey, onError]);
  return value;
}

const NO_ERROR_VALUE = undefined;

/** The store's collections (empty list until loaded; a failure keeps it empty). */
export function usePublicCollections(storeId: string): PublicCollectionSummary[] {
  return useSeededLoad<PublicCollectionSummary[], PublicCollectionSummary[]>(`collections:${storeId}`, () => apiGetPublicCollections(storeId).then(r => r.data ?? []), [], NO_ERROR_VALUE);
}

/** The store's collections, or null while they load and an empty list when they could not be loaded. */
export function usePublicCollectionsOrNull(storeId: string): PublicCollectionSummary[] | null {
  return useSeededLoad<PublicCollectionSummary[], null>(`collections:${storeId}`, () => apiGetPublicCollections(storeId).then(r => r.data ?? []), null, EMPTY_COLLECTIONS);
}
const EMPTY_COLLECTIONS: PublicCollectionSummary[] = [];

/** The store's published pages (empty list until loaded; a failure keeps it empty). */
export function usePublicPages(storeId: string): PublicPageSummary[] {
  return useSeededLoad<PublicPageSummary[], PublicPageSummary[]>(`pages:${storeId}`, () => apiListPublicStorePages(storeId).then(r => r.data ?? []), [], NO_ERROR_VALUE);
}
