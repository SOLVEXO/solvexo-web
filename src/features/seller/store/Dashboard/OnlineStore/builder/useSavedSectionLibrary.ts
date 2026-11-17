import { useCallback } from 'react';
import {
  apiCreateSavedSection, apiDeleteSavedSection, apiListSavedSections, apiUpdateSavedSection,
  type SavedSectionEntry, type SavedSectionInput,
} from '@/api/services/savedSections';
import { invalidateSavedSections } from '@/features/storefront-themes/useSavedSections';
import { useKeyedLoad } from '@/components/comman/dashboard/useKeyedLoad';

/** The store's saved sections as the seller sees them (with "used on N pages"). Every change also refreshes the copy the live
 *  preview draws from, so an edit shows in the preview at once. */
export function useSavedSectionLibrary(storeId: string) {
  const { data, error, loading, retry } = useKeyedLoad(() => apiListSavedSections(storeId).then(r => r.data), storeId, !!storeId);

  const create = useCallback(async (input: SavedSectionInput): Promise<SavedSectionEntry> => {
    const res = await apiCreateSavedSection(storeId, input);
    invalidateSavedSections(storeId);
    retry();
    return res.data;
  }, [storeId, retry]);

  const update = useCallback(async (id: string, patch: Partial<Omit<SavedSectionInput, 'type'>>): Promise<SavedSectionEntry> => {
    const res = await apiUpdateSavedSection(storeId, id, patch);
    invalidateSavedSections(storeId);
    retry();
    return res.data;
  }, [storeId, retry]);

  const remove = useCallback(async (id: string) => {
    await apiDeleteSavedSection(storeId, id);
    invalidateSavedSections(storeId);
    retry();
  }, [storeId, retry]);

  return { items: data ?? [], loaded: data !== null, loading, error, reload: retry, create, update, remove };
}

export type SavedSectionLibrary = ReturnType<typeof useSavedSectionLibrary>;
