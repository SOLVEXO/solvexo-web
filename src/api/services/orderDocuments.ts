import client from '../client';
import { ENDPOINTS } from '../endpoints';
import { DEFAULT_DOCUMENT_SETTINGS, type OrderDocumentSettings, type OrderDocumentStore } from '@/utils/orderDocuments';

interface ApiResponse<T> { success: boolean; data: T }

export interface OrderDocumentsPayload {
  settings: OrderDocumentSettings;
  /** What a document falls back to when a field is left empty. */
  store: OrderDocumentStore;
}

export function apiGetOrderDocuments(storeId: string) {
  return client.get<never, ApiResponse<OrderDocumentsPayload>>(ENDPOINTS.ORDER_DOCUMENTS.SETTINGS(storeId));
}

export function apiUpdateOrderDocuments(storeId: string, patch: Partial<OrderDocumentSettings>) {
  return client.patch<never, ApiResponse<OrderDocumentsPayload>>(ENDPOINTS.ORDER_DOCUMENTS.SETTINGS(storeId), patch);
}

const cache = new Map<string, OrderDocumentsPayload>();

/** Settings already loaded for this store in this session (lets a print click open its window synchronously). */
export function cachedOrderDocuments(storeId: string): OrderDocumentsPayload | null {
  return cache.get(storeId) ?? null;
}

/** Loads (and remembers) a store's document settings; a failed load falls back to the built-in look so printing still works. */
export async function loadOrderDocuments(storeId: string, fallbackStore: OrderDocumentStore): Promise<OrderDocumentsPayload> {
  try {
    const res = await apiGetOrderDocuments(storeId);
    cache.set(storeId, res.data);
    return res.data;
  } catch {
    return { settings: DEFAULT_DOCUMENT_SETTINGS, store: fallbackStore };
  }
}

/** Saves a change and refreshes the remembered copy. */
export async function saveOrderDocuments(storeId: string, patch: Partial<OrderDocumentSettings>): Promise<OrderDocumentsPayload> {
  const res = await apiUpdateOrderDocuments(storeId, patch);
  cache.set(storeId, res.data);
  return res.data;
}
