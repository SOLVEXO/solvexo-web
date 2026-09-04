import client from '../client';
import { ENDPOINTS } from '../endpoints';
import { type MetafieldType } from './metafields';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export interface MetaobjectFieldDefinition {
  key: string;
  name: string;
  type: MetafieldType;
  required: boolean;
}

export interface MetaobjectDefinition {
  _id: string;
  storeId: string;
  type: string;
  name: string;
  description: string | null;
  fieldDefinitions: MetaobjectFieldDefinition[];
  createdAt: string;
  updatedAt: string;
}

/** `listDefinitions` annotates each with its real entry count — see
 *  `MetaobjectsService.listDefinitions`. */
export interface MetaobjectDefinitionSummary extends MetaobjectDefinition {
  entryCount: number;
}

/** Minimal shape the public definitions list returns — a storefront section
 *  editor's "which type?" picker only ever needs `type`/`name`, never the
 *  full field schema. */
export interface PublicMetaobjectDefinition {
  _id: string;
  type: string;
  name: string;
}

export interface MetaobjectFieldValue {
  key: string;
  value: string;
}

export interface MetaobjectEntry {
  _id: string;
  storeId: string;
  definitionId: string;
  type: string;
  displayName: string;
  fields: MetaobjectFieldValue[];
  createdAt: string;
  updatedAt: string;
}

export function apiListMetaobjectDefinitions(storeId: string) {
  return client.get<never, ApiResponse<MetaobjectDefinitionSummary[]>>(ENDPOINTS.METAOBJECTS.DEFINITIONS(storeId));
}

export function apiGetMetaobjectDefinition(storeId: string, definitionId: string) {
  return client.get<never, ApiResponse<MetaobjectDefinition>>(ENDPOINTS.METAOBJECTS.DEFINITION(storeId, definitionId));
}

export function apiCreateMetaobjectDefinition(storeId: string, payload: {
  type: string; name: string; description?: string; fieldDefinitions: MetaobjectFieldDefinition[];
}) {
  return client.post<never, ApiResponse<MetaobjectDefinition>>(ENDPOINTS.METAOBJECTS.DEFINITIONS(storeId), payload);
}

export function apiUpdateMetaobjectDefinition(storeId: string, definitionId: string, payload: {
  name?: string; description?: string; fieldDefinitions?: MetaobjectFieldDefinition[];
}) {
  return client.patch<never, ApiResponse<MetaobjectDefinition>>(ENDPOINTS.METAOBJECTS.DEFINITION(storeId, definitionId), payload);
}

export function apiDeleteMetaobjectDefinition(storeId: string, definitionId: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.METAOBJECTS.DEFINITION(storeId, definitionId));
}

export function apiListMetaobjectEntries(storeId: string, definitionId: string) {
  return client.get<never, ApiResponse<MetaobjectEntry[]>>(ENDPOINTS.METAOBJECTS.ENTRIES(storeId, definitionId));
}

export function apiCreateMetaobjectEntry(storeId: string, definitionId: string, payload: { displayName: string; fields: MetaobjectFieldValue[] }) {
  return client.post<never, ApiResponse<MetaobjectEntry>>(ENDPOINTS.METAOBJECTS.ENTRIES(storeId, definitionId), payload);
}

export function apiUpdateMetaobjectEntry(storeId: string, entryId: string, payload: { displayName: string; fields: MetaobjectFieldValue[] }) {
  return client.patch<never, ApiResponse<MetaobjectEntry>>(ENDPOINTS.METAOBJECTS.ENTRY(storeId, entryId), payload);
}

export function apiDeleteMetaobjectEntry(storeId: string, entryId: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.METAOBJECTS.ENTRY(storeId, entryId));
}

/** Public — the storefront section editor's "which metaobject type?" picker. */
export function apiGetPublicMetaobjectDefinitions(storeId: string) {
  return client.get<never, ApiResponse<PublicMetaobjectDefinition[]>>(ENDPOINTS.METAOBJECTS.PUBLIC_DEFINITIONS(storeId));
}

/** Public — every entry of one type, for a `metaobject_list` section to render. */
export function apiGetPublicMetaobjectEntriesByType(storeId: string, type: string) {
  return client.get<never, ApiResponse<MetaobjectEntry[]>>(ENDPOINTS.METAOBJECTS.PUBLIC_ENTRIES_BY_TYPE(storeId, type));
}

export function apiGetPublicMetaobjectEntry(storeId: string, entryId: string) {
  return client.get<never, ApiResponse<MetaobjectEntry>>(ENDPOINTS.METAOBJECTS.PUBLIC_ENTRY(storeId, entryId));
}
