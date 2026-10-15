// API calls for imported ("Liquid") themes: ZIP upload/import, source file editing, preview, publish, rollback, published render.
// Native section/block theme calls (StoreTheme*, header/footer/colors) stay in './storeTheme'.
import client from '../client';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ThemePackageRevision {
  version: number;
  changeType: 'upload' | 'file_edit' | 'rollback';
  restoredFromVersion: number | null;
  createdAt?: string;
  files: Array<{ path: string; size: number; sha256: string; encoding?: 'utf8' | 'base64'; content?: string }>;
  /** Result of the import-time check: which pages render, plus notes about features Solvexo does not provide. */
  compatibility?: ThemeCompatibility | null;
}

export interface ThemeCompatibility {
  checkedAt: string;
  ok: boolean;
  pages: Array<{ label: string; path: string; ok: boolean; message?: string }>;
  notes: string[];
}

export interface ThemeImportJob {
  jobId: string;
  status: 'processing' | 'ready' | 'failed';
  stage: 'reading' | 'checking' | 'saving' | 'compatibility' | 'done' | 'failed' | string;
  error?: string | null;
  version?: number | null;
}

export interface ThemePackageStructure {
  version: number;
  components: Array<{
    kind: 'section' | 'block';
    type: string;
    path: string;
    schema: ThemePackageComponentSchema;
  }>;
  templates: string[];
  sectionGroups: string[];
  themeSettings: Array<{ name?: string; settings?: Array<{ id?: string; type?: string; label?: string; [key: string]: unknown }>; [key: string]: unknown }>;
}

export interface ThemePackageComponentSchema {
  name: string;
  settings?: Array<{ id?: string; type?: string; label?: string; [key: string]: unknown }>;
  blocks?: Array<{ type?: string; name?: string; limit?: number; settings?: Array<{ id?: string; type?: string; label?: string; [key: string]: unknown }>; [key: string]: unknown }>;
  presets?: Array<{ name?: string; [key: string]: unknown }>;
  limit?: number;
  max_blocks?: number;
  enabled_on?: { templates?: string[]; [key: string]: unknown };
  disabled_on?: { templates?: string[]; [key: string]: unknown };
  [key: string]: unknown;
}

const themePackagePath = (storeId: string, installedThemeId: string) =>
  `/api/store-theme/${storeId}/installed/${installedThemeId}/package`;

export function apiListThemePackageRevisions(storeId: string, installedThemeId: string) {
  return client.get<never, ApiResponse<ThemePackageRevision[]>>(themePackagePath(storeId, installedThemeId));
}

/** Theme ZIP import/preview/export/publish parse and re-write many files; the default 15 s is too short. */
const THEME_PACKAGE_TIMEOUT = 180_000;

export function apiUploadThemePackage(storeId: string, installedThemeId: string, file: File) {
  const body = new FormData();
  body.append('file', file);
  return client.post<never, ApiResponse<{ version: number }>>(themePackagePath(storeId, installedThemeId), body, { timeout: THEME_PACKAGE_TIMEOUT });
}

/** Largest theme ZIP the server accepts. */
export const MAX_THEME_ZIP_BYTES = 20 * 1024 * 1024;
const THEME_CHUNK_BYTES = 1024 * 1024;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
/** Worth retrying: the connection dropped, timed out, was throttled or the server hiccuped (not a 4xx rejection). */
const isRetryableUploadError = (e: unknown) => /timeout|network|failed to fetch|too many|429|50\d|temporar/i.test(e instanceof Error ? e.message : '');

/**
 * Uploads a theme ZIP in 1 MB pieces (3 at a time, each retried with backoff), then asks the server to assemble it and start the
 * background import. A flaky or slow connection only repeats the piece that failed instead of the whole file.
 */
export async function apiUploadThemeInChunks(storeId: string, installedThemeId: string, file: File, onProgress?: (sentBytes: number, totalBytes: number) => void) {
  const base = themePackagePath(storeId, installedThemeId);
  const uploadId = crypto.randomUUID();
  const total = Math.max(1, Math.ceil(file.size / THEME_CHUNK_BYTES));
  let sent = 0;
  let next = 0;
  const sendPiece = async (index: number) => {
    const piece = file.slice(index * THEME_CHUNK_BYTES, (index + 1) * THEME_CHUNK_BYTES);
    for (let attempt = 0; ; attempt++) {
      try {
        const body = new FormData();
        body.append('uploadId', uploadId);
        body.append('index', String(index));
        body.append('total', String(total));
        body.append('chunk', piece, 'chunk');
        await client.post(`${base}/upload/chunk`, body, { timeout: 60_000 });
        return;
      } catch (e) {
        if (attempt >= 5 || !isRetryableUploadError(e)) throw e;
        await sleep(700 * 2 ** attempt);
      }
    }
  };
  const worker = async () => {
    while (next < total) {
      const index = next++;
      await sendPiece(index);
      sent += Math.min(THEME_CHUNK_BYTES, file.size - index * THEME_CHUNK_BYTES);
      onProgress?.(sent, file.size);
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  return client.post<never, ApiResponse<ThemeImportJob>>(`${base}/upload/complete`, { uploadId, total, fileName: file.name }, { timeout: THEME_PACKAGE_TIMEOUT });
}

/** Starts a background import and returns at once; poll apiGetThemeImportJob until it is ready or failed. */
export function apiStartThemeImport(storeId: string, installedThemeId: string, file: File, onProgress?: (percent: number) => void) {
  const body = new FormData();
  body.append('file', file);
  return client.post<never, ApiResponse<ThemeImportJob>>(`${themePackagePath(storeId, installedThemeId)}/import`, body, {
    timeout: THEME_PACKAGE_TIMEOUT,
    onUploadProgress: (event) => { if (onProgress && event.total) onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100))); },
  });
}

export function apiGetThemeImportJob(storeId: string, installedThemeId: string, jobId: string) {
  return client.get<never, ApiResponse<ThemeImportJob>>(`${themePackagePath(storeId, installedThemeId)}/import/${jobId}`);
}

/** Text of one source file (the revision itself no longer carries file contents). */
export function apiGetThemePackageFile(storeId: string, installedThemeId: string, version: number, path: string) {
  return client.get<never, ApiResponse<{ path: string; encoding: 'utf8' | 'base64'; size: number; content: string }>>(
    `${themePackagePath(storeId, installedThemeId)}/${version}/file`, { params: { path } },
  );
}

export function apiPreviewThemePackage(storeId: string, installedThemeId: string, version?: number, path = '/', draft?: { path: string; content: string }) {
  return client.post<never, ApiResponse<{ version: number; html: string }>>(`${themePackagePath(storeId, installedThemeId)}/preview`, { version, path, draft }, { timeout: THEME_PACKAGE_TIMEOUT });
}

export function apiGetThemePackageRevision(storeId: string, installedThemeId: string, version: number) {
  return client.get<never, ApiResponse<ThemePackageRevision>>( `${themePackagePath(storeId, installedThemeId)}/${version}`);
}

export function apiGetThemePackageStructure(storeId: string, installedThemeId: string, version: number) {
  return client.get<never, ApiResponse<ThemePackageStructure>>(`${themePackagePath(storeId, installedThemeId)}/${version}/structure`);
}

export function apiEditThemePackageFile(storeId: string, installedThemeId: string, path: string, content: string) {
  return client.patch<never, ApiResponse<{ version: number }>>(`${themePackagePath(storeId, installedThemeId)}/file`, { path, content });
}

export function apiAddThemePackageFile(storeId: string, installedThemeId: string, path: string, content = '', encoding: 'utf8' | 'base64' = 'utf8') {
  return client.post<never, ApiResponse<{ version: number }>>(`${themePackagePath(storeId, installedThemeId)}/file`, { path, content, encoding });
}

export function apiDeleteThemePackageFile(storeId: string, installedThemeId: string, path: string) {
  return client.delete<never, ApiResponse<{ version: number }>>(`${themePackagePath(storeId, installedThemeId)}/file`, { data: { path } });
}

export function apiRenameThemePackageFile(storeId: string, installedThemeId: string, from: string, to: string) {
  return client.post<never, ApiResponse<{ version: number }>>(`${themePackagePath(storeId, installedThemeId)}/file/rename`, { from, to });
}

export function apiUnpublishThemePackage(storeId: string, installedThemeId: string) {
  return client.post<never, ApiResponse<{ installedThemeId: string; version: null }>>(`${themePackagePath(storeId, installedThemeId)}/unpublish`);
}

/** Downloads a revision as a standard Shopify theme ZIP (the axios interceptor unwraps `res.data`, so this resolves to the Blob). */
export function apiExportThemePackage(storeId: string, installedThemeId: string, version?: number) {
  return client.get<never, Blob>(`${themePackagePath(storeId, installedThemeId)}/export/zip`, { params: version === undefined ? undefined : { version }, responseType: 'blob', timeout: THEME_PACKAGE_TIMEOUT });
}

export function apiRollbackThemePackage(storeId: string, installedThemeId: string, version: number) {
  return client.post<never, ApiResponse<{ version: number }>>(`${themePackagePath(storeId, installedThemeId)}/${version}/rollback`, undefined, { timeout: THEME_PACKAGE_TIMEOUT });
}

export function apiPublishThemePackage(storeId: string, installedThemeId: string, version: number) {
  return client.post<never, ApiResponse<{ installedThemeId: string; version: number; status: string }>>(`${themePackagePath(storeId, installedThemeId)}/${version}/publish`, undefined, { timeout: THEME_PACKAGE_TIMEOUT });
}

export function apiGetPublishedLiquidThemeHtml(
  storeId: string,
  path: string,
  cartItems: { productId: string; productVariantId: string; quantity: number }[] = [],
) {
  return client.post<never, ApiResponse<{ html: string; version: number }>>(
    `/api/public/store-theme/${encodeURIComponent(storeId)}/source/render?path=${encodeURIComponent(path)}`,
    { cartItems },
  );
}

/**
 * A theme's own JavaScript (cart drawers, quick-add) often knows only a variant id, not its product id — but
 * Solvexo's cart needs both. `GET api/products/getVariantById/:variantId` is public and unauthenticated.
 */
export function apiGetVariantProductId(variantId: string, storeId: string) {
  return client.get<never, { success: boolean; data: { product?: { _id?: string }; variant?: { productId?: string } } | null }>(
    `/api/products/getVariantById/${encodeURIComponent(variantId)}`,
    { params: { storeId } },
  );
}

/** The theme's own re-rendered "you may also like" section (HTML, not JSON — see the backend comment). */
export function apiGetRecommendationsFragment(storeId: string, path: string, sectionId: string, productId: string, limit: number) {
  return client.get<never, string>(`/api/public/store-theme/${encodeURIComponent(storeId)}/source/recommendations`, {
    params: { path, sectionId, productId, limit }, responseType: 'text',
  });
}
