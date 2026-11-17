import { useEffect, useMemo, useSyncExternalStore } from 'react';
import type { Section } from '@/api/services/storefrontTypes';
import { apiListPublicSavedSections, type SavedSectionEntry } from '@/api/services/savedSections';
import { hasSavedSectionRefs, resolveSavedSections } from './savedSectionsResolve';

/** One shared copy of each store's library (the same data every section of a page needs), loaded once and refreshed when the
 *  editor changes an entry. */
interface Slot { items: SavedSectionEntry[] | null; loading: boolean; failed: boolean }
const slots = new Map<string, Slot>();
const listeners = new Set<() => void>();
const EMPTY: Slot = { items: null, loading: false, failed: false };

function emit() { listeners.forEach(l => l()); }
function slotOf(storeId: string): Slot { return slots.get(storeId) ?? EMPTY; }

async function load(storeId: string) {
  const cur = slotOf(storeId);
  if (cur.loading) return;
  slots.set(storeId, { ...cur, loading: true });
  emit();
  try {
    const res = await apiListPublicSavedSections(storeId);
    slots.set(storeId, { items: res.data ?? [], loading: false, failed: false });
  } catch {
    // keep what we had; the next page load tries again
    slots.set(storeId, { items: cur.items, loading: false, failed: true });
  }
  emit();
}

/** Call after the library changed (create / edit / delete) so every preview and page re-draws from the new content. */
export function invalidateSavedSections(storeId: string): void {
  slots.set(storeId, { ...slotOf(storeId), loading: false });
  void load(storeId);
}

/** Test helper: forget everything. */
export function resetSavedSectionsCache(): void { slots.clear(); emit(); }

/** The sections with every `saved_section` reference replaced by its library content. A page without references costs nothing
 *  (no request is made). While the library loads, references draw nothing. */
export function useResolvedSavedSections(sections: Section[], storeId: string | undefined): Section[] {
  const needed = !!storeId && hasSavedSectionRefs(sections);
  const slot = useSyncExternalStore(
    cb => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    () => (storeId ? slotOf(storeId) : EMPTY),
  );
  useEffect(() => {
    if (needed && storeId && !slots.has(storeId)) void load(storeId);
  }, [needed, storeId]);
  return useMemo(() => (needed ? resolveSavedSections(sections, slot.items) : sections), [needed, sections, slot.items]);
}
