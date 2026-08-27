import { useStorefront } from '@/features/storefront/StorefrontContext';
import { NEW_THEME_REGISTRY, DEFAULT_THEME_ID, type StorefrontRouteKey } from './registry';

/** Dispatches a storefront route to whichever independent theme is active
 *  on this store. The legacy 12-theme shared-engine rendering path has been
 *  removed (see `_legacy-theme-backup/` for the archived code) — every
 *  store now renders through a real `NEW_THEME_REGISTRY` entry, falling
 *  back to `DEFAULT_THEME_ID` (Atelier) for a store whose `themeDefinitionId`
 *  doesn't match any registered theme (e.g. one still pointed at an old,
 *  now-deleted theme id) rather than crashing. */
export function ThemedRoute({ routeKey }: { routeKey: StorefrontRouteKey }) {
  const { theme } = useStorefront();
  const themeId = theme?.themeDefinitionId;
  const impl = (themeId && NEW_THEME_REGISTRY[themeId]) || NEW_THEME_REGISTRY[DEFAULT_THEME_ID];
  // Every registered theme is expected to implement all 14 keys (see
  // `registry.ts`) — this only guards against a future theme that's
  // mid-build and hasn't reached this route yet, rather than a runtime crash.
  const Page = impl.pages[routeKey] ?? NEW_THEME_REGISTRY[DEFAULT_THEME_ID].pages[routeKey];
  if (!Page) return null;
  return <Page />;
}
