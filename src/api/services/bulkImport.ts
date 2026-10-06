import client from '../client';

/**
 * Shared bulk-import API (see backend `common/bulk-import`). Every module that
 * supports "download a template → fill it → upload it" exposes the same two
 * routes next to each other:
 *   GET  <base>/import-template  → { data: { filename, csv, columns[] } }
 *   POST <base>/import           → multipart `file`, → { message, data: BulkImportData }
 * so this service only needs the base path.
 */

export interface BulkTemplateColumn {
  key: string;
  required: boolean;
  description: string;
  example: string;
}

export interface BulkTemplate {
  filename: string;
  csv: string;
  columns: BulkTemplateColumn[];
}

export interface BulkRowFailure {
  row: number;
  error: string;
  values: Record<string, string>;
}

export interface BulkImportData {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  failedCount: number;
  failed: BulkRowFailure[];
  skippedRows: { row: number; note: string }[];
  columns: string[];
}

export function apiGetImportTemplate(basePath: string) {
  return client.get<never, { success: boolean; data: BulkTemplate }>(`${basePath}/import-template`);
}

export function apiRunBulkImport(basePath: string, file: File, extraFields?: Record<string, string>) {
  const formData = new FormData();
  formData.append('file', file);
  if (extraFields) for (const [k, v] of Object.entries(extraFields)) formData.append(k, v);
  return client.post<never, { success: boolean; message: string; data: BulkImportData }>(
    `${basePath}/import`,
    formData,
    // Rows are saved one by one server-side, so this can outlast the default 15 s.
    { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 300_000 },
  );
}
