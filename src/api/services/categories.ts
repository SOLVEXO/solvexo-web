import client from '../client';
import { ENDPOINTS } from '../endpoints';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Category {
  _id:           string;
  name:          string;
  slug:          string;
  parentId:      string | null;
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
}

interface CategoryTreeListResponse { success: boolean; message: string; data: CategoryNode[] }
interface CategoryTreeNodeResponse { success: boolean; message: string; data: CategoryNode }
interface CategoryWithChildrenResponse { success: boolean; message: string; data: { category: Category; children: Category[] } }
interface CategoryCreateResponse { success: boolean; message: string; data: Category }

// ── API ───────────────────────────────────────────────────────────────────────

// No id → every root (main) category with its nested children.
// With id → that single category's subtree.
export function apiGetCategoryTree(): Promise<CategoryTreeListResponse>;
export function apiGetCategoryTree(id: string): Promise<CategoryTreeNodeResponse>;
export function apiGetCategoryTree(id?: string) {
  const url = id ? `${ENDPOINTS.CATEGORIES.TREE}?id=${id}` : ENDPOINTS.CATEGORIES.TREE;
  return client.get<never, CategoryTreeListResponse | CategoryTreeNodeResponse>(url);
}

export function apiGetCategoryById(id: string) {
  return client.get<never, CategoryWithChildrenResponse>(ENDPOINTS.CATEGORIES.GET_BY_ID(id));
}

// Main categories (no parentId) are admin-only server-side; sellers may only add subcategories.
export function apiAddCategory(payload: CategoryPayload) {
  return client.post<never, CategoryCreateResponse>(ENDPOINTS.CATEGORIES.ADD, payload);
}
