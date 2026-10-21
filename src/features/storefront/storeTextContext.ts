import { createContext, useContext } from 'react';
import type { TextIndex } from '@/utils/storeText';

const EMPTY: TextIndex = new Map();

/** The translated storefront texts of the active language (empty in the default language and in editor previews). */
export const StoreTextCtx = createContext<TextIndex>(EMPTY);

export function useStoreTextIndex(): TextIndex {
  return useContext(StoreTextCtx);
}
