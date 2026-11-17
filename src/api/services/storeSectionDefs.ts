import client from '../client';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

/** The building blocks a seller composes a section from ("Section builder"). Plain data: see the API's `store-section-def.util.ts`. */
export type LayoutNodeType = 'stack' | 'columns' | 'repeat' | 'heading' | 'text' | 'richtext' | 'image' | 'button' | 'video' | 'divider' | 'spacer';

export interface LayoutNode {
  t: LayoutNodeType;
  children?: LayoutNode[];
  // container + element properties (all optional: the server fills defaults)
  gap?: number; align?: string; maxWidth?: number;
  cols?: number; valign?: string;
  label?: string; initial?: number; card?: boolean;
  key?: string; default?: string; size?: string; tag?: string; muted?: boolean;
  ratio?: string; fit?: string; radius?: number; maxHeight?: number;
  link?: string; style?: string; h?: number;
}

export type StoreFieldKind = 'text' | 'textarea' | 'richtext' | 'image' | 'video' | 'link';
export interface StoreFieldDef { key: string; label: string; kind: StoreFieldKind; maxLength?: number; rows?: number }

export interface StoreSectionDef {
  _id: string;
  /** `my.<slug>`: what a page's `theme_section` points at. */
  key: string;
  name: string;
  description: string;
  color: string | null;
  layout: LayoutNode;
  fields: StoreFieldDef[];
  block: { key: 'item'; label: string; fields: StoreFieldDef[]; defaults: Record<string, unknown> } | null;
  defaults: Record<string, unknown>;
  initialBlocks: number;
  updatedAt?: string | null;
  /** Seller list only: how many pages / templates / saved sections use it. */
  usedOn?: number;
}

export interface StoreSectionDefInput {
  name: string;
  description?: string;
  color?: string | null;
  layout: LayoutNode;
}

const sellerPath = (storeId: string) => `/api/store-section-defs/${encodeURIComponent(storeId)}`;

export function apiListStoreSectionDefs(storeId: string) {
  return client.get<never, ApiResponse<StoreSectionDef[]>>(sellerPath(storeId));
}

/** Storefront (no login). */
export function apiListPublicStoreSectionDefs(storeId: string) {
  return client.get<never, ApiResponse<StoreSectionDef[]>>(`/api/public/store-section-defs/${encodeURIComponent(storeId)}`);
}

export function apiCreateStoreSectionDef(storeId: string, input: StoreSectionDefInput) {
  return client.post<never, ApiResponse<StoreSectionDef>>(sellerPath(storeId), input);
}

export function apiUpdateStoreSectionDef(storeId: string, id: string, input: Partial<StoreSectionDefInput>) {
  return client.patch<never, ApiResponse<StoreSectionDef>>(`${sellerPath(storeId)}/${encodeURIComponent(id)}`, input);
}

export function apiDeleteStoreSectionDef(storeId: string, id: string) {
  return client.delete<never, ApiResponse<unknown>>(`${sellerPath(storeId)}/${encodeURIComponent(id)}`);
}
