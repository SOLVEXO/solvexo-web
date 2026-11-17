import { useEffect, useSyncExternalStore } from 'react';
import { apiListPublicStoreSectionDefs, type StoreSectionDef } from '@/api/services/storeSectionDefs';
import { setStoreCustomSections } from '../themeManifest';
import { storeDefToThemeDef } from './storeDefToThemeDef';

/** One shared copy of each store's own (Section builder) section designs: the storefront draws `my.*` sections from it and the
 *  theme editor builds their forms from it. Loaded once, refreshed when the builder saves. */
interface Slot { items: StoreSectionDef[] | null; loading: boolean }
const slots = new Map<string, Slot>();
const listeners = new Set<() => void>();
const EMPTY: Slot = { items: null, loading: false };

function emit() { listeners.forEach(l => l()); }
function slotOf(storeId: string): Slot { return slots.get(storeId) ?? EMPTY; }

async function load(storeId: string) {
  const cur = slotOf(storeId);
  if (cur.loading) return;
  slots.set(storeId, { ...cur, loading: true });
  emit();
  try {
    const res = await apiListPublicStoreSectionDefs(storeId);
    const items = res.data ?? [];
    // the editor looks sections up by key (`findCustomSectionDef`): keep that registry in step
    setStoreCustomSections(items.map(storeDefToThemeDef));
    slots.set(storeId, { items, loading: false });
  } catch {
    slots.set(storeId, { items: cur.items, loading: false });
  }
  emit();
}

/** Call after the builder created / changed / deleted a design so previews and pages re-draw from the new layout. */
export function invalidateStoreSectionDefs(storeId: string): void {
  slots.set(storeId, { ...slotOf(storeId), loading: false });
  void load(storeId);
}

/** Test helper. */
export function resetStoreSectionDefsCache(): void { slots.clear(); setStoreCustomSections([]); emit(); }

/** The store's section designs (null while loading / on a store that has none yet is `[]`). Only fetches when `enabled`. */
export function useStoreSectionDefs(storeId: string | undefined, enabled = true): StoreSectionDef[] | null {
  const slot = useSyncExternalStore(
    cb => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    () => (storeId ? slotOf(storeId) : EMPTY),
  );
  useEffect(() => {
    if (enabled && storeId && !slots.has(storeId)) void load(storeId);
  }, [enabled, storeId]);
  return slot.items;
}
