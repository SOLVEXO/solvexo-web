import client from '../client';
import { ENDPOINTS } from '../endpoints';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export type AppBlockFieldKind = 'text' | 'textarea' | 'number' | 'boolean' | 'select';

export interface AppBlockFieldOption {
  value: string;
  label: string;
}

export interface AppBlockField {
  key: string;
  label: string;
  kind: AppBlockFieldKind;
  required?: boolean;
  maxLength?: number;
  options?: AppBlockFieldOption[];
}

export interface AppBlockDefinition {
  key: string;
  label: string;
  description: string;
  supportedSectionTypes: string[];
  settingsSchema: AppBlockField[];
  renderKind: string;
}

export interface AppCatalogEntry {
  id: string;
  name: string;
  description: string;
  blocks: AppBlockDefinition[];
  /** Real per-store install state — see `apps.controller.ts`'s `listCatalog`. */
  installed: boolean;
}

export function apiListAppCatalog(storeId: string) {
  return client.get<never, ApiResponse<AppCatalogEntry[]>>(ENDPOINTS.APPS.CATALOG(storeId));
}

export function apiInstallApp(storeId: string, appId: string) {
  return client.post<never, ApiResponse<null>>(ENDPOINTS.APPS.INSTALL(storeId, appId));
}

export function apiUninstallApp(storeId: string, appId: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.APPS.UNINSTALL(storeId, appId));
}

// ── Pure helpers — mirror the backend's `common/store-content/app-block.util.ts`
// by hand (same "kept in sync by hand across the two codebases" convention
// this app already uses for `sectionSettingsTypes.ts`). ───────────────────

const APP_BLOCK_TYPE_PREFIX = 'app:';

export function isAppBlockType(type: string): boolean {
  return typeof type === 'string' && type.startsWith(APP_BLOCK_TYPE_PREFIX);
}

export function buildAppBlockType(appId: string, blockKey: string): string {
  return `${APP_BLOCK_TYPE_PREFIX}${appId}:${blockKey}`;
}

export function parseAppBlockType(type: string): { appId: string; blockKey: string } | null {
  if (!isAppBlockType(type)) return null;
  const rest = type.slice(APP_BLOCK_TYPE_PREFIX.length);
  const sep = rest.indexOf(':');
  if (sep === -1) return null;
  const appId = rest.slice(0, sep);
  const blockKey = rest.slice(sep + 1);
  if (!appId || !blockKey) return null;
  return { appId, blockKey };
}

/** Looks a real block type up against the (already-fetched, real,
 *  per-store) installed-app list — never a static frontend duplicate of
 *  the catalog, so a block only ever appears "findable" here if it's
 *  actually installed for the store the editor is currently open on. */
export function findInstalledAppBlock(installedApps: AppCatalogEntry[], blockType: string): { app: AppCatalogEntry; block: AppBlockDefinition } | null {
  const parsed = parseAppBlockType(blockType);
  if (!parsed) return null;
  const app = installedApps.find(a => a.id === parsed.appId && a.installed);
  if (!app) return null;
  const block = app.blocks.find(b => b.key === parsed.blockKey);
  if (!block) return null;
  return { app, block };
}
