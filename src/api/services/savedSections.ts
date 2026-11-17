import client from '../client';
import type { Block, SectionType } from './storefrontTypes';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

/** One reusable section of the store's library ("saved section"). Pages hold a `saved_section` reference to it. */
export interface SavedSectionEntry {
  _id: string;
  name: string;
  type: SectionType;
  settings: Record<string, unknown>;
  blocks: Block[];
  colorSchemeId: string | null;
  updatedAt?: string | null;
  /** Seller list only: how many pages / templates use it. */
  usedOn?: number;
}

export interface SavedSectionInput {
  name: string;
  type: SectionType;
  settings: Record<string, unknown>;
  blocks: { type: string; settings: Record<string, unknown>; enabled?: boolean }[];
  colorSchemeId?: string | null;
}

const sellerPath = (storeId: string) => `/api/saved-sections/${encodeURIComponent(storeId)}`;

/** Seller: the library with "used on N pages". */
export function apiListSavedSections(storeId: string) {
  return client.get<never, ApiResponse<SavedSectionEntry[]>>(sellerPath(storeId));
}

/** Storefront (no login): what a `saved_section` reference is drawn from. */
export function apiListPublicSavedSections(storeId: string) {
  return client.get<never, ApiResponse<SavedSectionEntry[]>>(`/api/public/saved-sections/${encodeURIComponent(storeId)}`);
}

export function apiCreateSavedSection(storeId: string, input: SavedSectionInput) {
  return client.post<never, ApiResponse<SavedSectionEntry>>(sellerPath(storeId), input);
}

export function apiUpdateSavedSection(storeId: string, id: string, input: Partial<Omit<SavedSectionInput, 'type'>>) {
  return client.patch<never, ApiResponse<SavedSectionEntry>>(`${sellerPath(storeId)}/${encodeURIComponent(id)}`, input);
}

export function apiDeleteSavedSection(storeId: string, id: string) {
  return client.delete<never, ApiResponse<unknown>>(`${sellerPath(storeId)}/${encodeURIComponent(id)}`);
}
