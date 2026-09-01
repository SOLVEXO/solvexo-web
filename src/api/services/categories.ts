import client from '../client';
import { ENDPOINTS } from '../endpoints';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Category {
  _id:           string;
  name:          string;
  slug:          string;
  parentId:      string | null;
  /** null = legacy/global/admin taxonomy. A real value = privately owned by that one store. */
  storeId:       string | null;
  image:         string | null;
  description:   string | null;
  sortOrder:     number;
  status:        string;
  isDelete:      boolean;
  createdBy:     string | null;
  createdByRole: 'admin' | 'seller' | null;
  createdAt:     string;
  updatedAt:     string;
}

export interface CategoryNode extends Category {
  children: CategoryNode[];
  /** Active products in this category plus all of its descendants — attached server-side. */
  productCount?: number;
}

export interface CategoryPayload {
  name:        string;
  parentId?:   string;
  image?:      string;
  description?: string;
  sortOrder?:  number;
  /** Present → creates a category owned by this one store, at the seller's
   *  own discretion (both main categories and subcategories allowed, no
   *  admin gate). Omitted → the legacy global/admin taxonomy. */
  storeId?:    string;
}

export interface UpdateCategoryPayload {
  name?:        string;
  description?: string;
  image?:       string;
  isActive?:    boolean;
}

interface CategoryTreeListResponse { success: boolean; message: string; data: CategoryNode[] }
interface CategoryTreeNodeResponse { success: boolean; message: string; data: CategoryNode }
interface CategoryWithChildrenResponse { success: boolean; message: string; data: { category: Category; children: Category[] } }
interface CategoryCreateResponse { success: boolean; message: string; data: Category }

// ── API ───────────────────────────────────────────────────────────────────────

// No id → every legacy/global root (main) category with its nested children
// (Marketplace browse, admin curation). With id → that single category's
// subtree, regardless of scope.
export function apiGetCategoryTree(): Promise<CategoryTreeListResponse>;
export function apiGetCategoryTree(id: string): Promise<CategoryTreeNodeResponse>;
export function apiGetCategoryTree(id?: string) {
  const url = id ? `${ENDPOINTS.CATEGORIES.TREE}?id=${id}` : ENDPOINTS.CATEGORIES.TREE;
  return client.get<never, CategoryTreeListResponse | CategoryTreeNodeResponse>(url);
}

/** A store's own private category tree — every root category that store has
 *  created, each with its own nested children. Entirely separate from the
 *  legacy global tree above; never mixes with another store's categories. */
export function apiGetStoreCategoryTree(storeId: string) {
  return client.get<never, CategoryTreeListResponse>(`${ENDPOINTS.CATEGORIES.TREE}?storeId=${storeId}`);
}

export function apiGetCategoryById(id: string) {
  return client.get<never, CategoryWithChildrenResponse>(ENDPOINTS.CATEGORIES.GET_BY_ID(id));
}

// Legacy global taxonomy: main categories (no parentId) are admin-only
// server-side, sellers may only add subcategories. Pass `storeId` in the
// payload instead to create a category the seller owns for that one store —
// then both main categories and subcategories are allowed freely.
export function apiAddCategory(payload: CategoryPayload) {
  return client.post<never, CategoryCreateResponse>(ENDPOINTS.CATEGORIES.ADD, payload);
}

// Store-owned categories only — the legacy/global admin taxonomy has no
// rename/delete path. `storeId` is sent as a query param to match the
// backend route (`PUT/DELETE api/categories/category/:id?storeId=...`).
export function apiUpdateCategory(id: string, storeId: string, payload: UpdateCategoryPayload) {
  return client.put<never, CategoryCreateResponse>(`${ENDPOINTS.CATEGORIES.UPDATE(id)}?storeId=${storeId}`, payload);
}

export function apiDeleteCategory(id: string, storeId: string) {
  return client.delete<never, { success: boolean; message: string }>(`${ENDPOINTS.CATEGORIES.DELETE(id)}?storeId=${storeId}`);
}
