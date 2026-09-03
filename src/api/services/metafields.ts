import client from '../client';
import { ENDPOINTS } from '../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

// A deliberately-scoped subset of Shopify's metafield type system — see the
// backend schema's own comment (`metafields/schemas/metafield-definition.schema.ts`)
// for why these 9 and not the full ~113.
export const METAFIELD_TYPES = [
  'single_line_text_field', 'multi_line_text_field', 'number_integer', 'number_decimal',
  'boolean', 'date', 'url', 'color', 'json',
] as const;
export type MetafieldType = (typeof METAFIELD_TYPES)[number];

export const METAFIELD_OWNER_RESOURCES = ['product', 'category', 'collection', 'page'] as const;
export type MetafieldOwnerResource = (typeof METAFIELD_OWNER_RESOURCES)[number];

export const METAFIELD_TYPE_LABELS: Record<MetafieldType, string> = {
  single_line_text_field: 'Single line text',
  multi_line_text_field: 'Multi-line text',
  number_integer: 'Integer',
  number_decimal: 'Decimal',
  boolean: 'True/False',
  date: 'Date',
  url: 'URL',
  color: 'Color',
  json: 'JSON',
};

export interface MetafieldDefinition {
  _id: string;
  storeId: string;
  ownerResource: MetafieldOwnerResource;
  namespace: string;
  key: string;
  name: string;
  description: string | null;
  type: MetafieldType;
  required: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MetafieldValueEntry {
  definitionId: string;
  namespace: string;
  key: string;
  name: string;
  type: MetafieldType;
  required: boolean;
  value: string;
}

export function apiListMetafieldDefinitions(storeId: string, ownerResource?: MetafieldOwnerResource) {
  return client.get<never, ApiResponse<MetafieldDefinition[]>>(ENDPOINTS.METAFIELDS.DEFINITIONS(storeId), {
    params: ownerResource ? { ownerResource } : undefined,
  });
}

export function apiCreateMetafieldDefinition(storeId: string, payload: {
  ownerResource: MetafieldOwnerResource; key: string; name: string; description?: string; type: MetafieldType; required?: boolean;
}) {
  return client.post<never, ApiResponse<MetafieldDefinition>>(ENDPOINTS.METAFIELDS.DEFINITIONS(storeId), payload);
}

export function apiUpdateMetafieldDefinition(storeId: string, definitionId: string, payload: { name?: string; description?: string; required?: boolean }) {
  return client.patch<never, ApiResponse<MetafieldDefinition>>(ENDPOINTS.METAFIELDS.DEFINITION(storeId, definitionId), payload);
}

export function apiDeleteMetafieldDefinition(storeId: string, definitionId: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.METAFIELDS.DEFINITION(storeId, definitionId));
}

export function apiGetMetafieldValues(storeId: string, ownerResource: MetafieldOwnerResource, ownerId: string) {
  return client.get<never, ApiResponse<MetafieldValueEntry[]>>(ENDPOINTS.METAFIELDS.VALUES(storeId, ownerResource, ownerId));
}

export function apiSetMetafieldValues(storeId: string, ownerResource: MetafieldOwnerResource, ownerId: string, values: { namespace: string; key: string; value: string }[]) {
  return client.put<never, ApiResponse<MetafieldValueEntry[]>>(ENDPOINTS.METAFIELDS.VALUES(storeId, ownerResource, ownerId), { values });
}
