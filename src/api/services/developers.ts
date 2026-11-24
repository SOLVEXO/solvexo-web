import client, { API_BASE_URL } from '../client';

/** The public OpenAPI description of the Solvexo Admin API (no login needed). */
export const OPENAPI_PATH = '/api/merchant/v1/openapi.json';
export const openApiUrl = () => `${(API_BASE_URL ?? '').replace(/\/+$/, '')}${OPENAPI_PATH}`;

/** Only the parts of OpenAPI 3.1 the developers page reads. */
export interface OpenApiSchema {
  $ref?: string;
  type?: string | string[];
  description?: string;
  enum?: unknown[];
  items?: OpenApiSchema;
  properties?: Record<string, OpenApiSchema>;
  required?: string[];
  oneOf?: OpenApiSchema[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
}
export interface OpenApiParameter { name: string; in: 'query' | 'path' | 'header'; required?: boolean; description?: string; schema?: OpenApiSchema }
export interface OpenApiOperation {
  tags?: string[];
  operationId: string;
  summary?: string;
  description?: string;
  'x-required-scope'?: string;
  parameters?: OpenApiParameter[];
  requestBody?: { content?: Record<string, { schema?: OpenApiSchema }> };
  responses?: Record<string, { description?: string; content?: Record<string, { schema?: OpenApiSchema }> }>;
}
export interface OpenApiSpec {
  openapi: string;
  info: { title: string; version: string; description?: string };
  servers?: { url: string }[];
  tags?: { name: string }[];
  paths: Record<string, Record<string, OpenApiOperation>>;
  webhooks?: Record<string, { post?: OpenApiOperation }>;
  components?: { schemas?: Record<string, OpenApiSchema> };
}

export const apiGetOpenApiSpec = async () => (await client.get(OPENAPI_PATH)) as unknown as OpenApiSpec;
