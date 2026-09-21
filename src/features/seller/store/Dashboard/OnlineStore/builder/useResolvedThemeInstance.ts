import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiListInstalledThemes, type StoreThemeData } from '@/api/services/storeTheme';

/** Real fix for a confirmed P0: Customize/Header-Footer/Edit-Code previously
 *  never read the route's `:themeId` — every `apiGetStoreTheme(storeId)`
 *  call (and every save/publish/discard/version call alongside it) silently
 *  defaulted to whichever installed theme instance is currently ACTIVE,
 *  regardless of which theme's URL the seller was on. Proven live: with
 *  Nova active, visiting the Atelier URL rendered "Customize — Nova".
 *
 *  This resolves the URL's `:themeId` (a code-registry key, e.g.
 *  'theme-02-nova') against this STORE's own installed rows
 *  (`apiListInstalledThemes`, already storeId-scoped/ownership-verified on
 *  the backend) to find that theme's own row `_id` — the real
 *  `installedThemeId` every `apiXxxStoreTheme(...)` function already
 *  accepts as an optional trailing param (backend support pre-existed;
 *  only the frontend never threaded it through). A `:themeId` with no
 *  matching installed row (mistyped, uninstalled, or belonging to a
 *  different store — installed rows are always looked up scoped to THIS
 *  storeId, so a different store's theme id can never match) resolves to
 *  `status: 'not-found'` instead of silently falling back to the active
 *  theme. */
export type ResolvedThemeInstance =
  | { status: 'loading'; installedThemeId: undefined; themeDefinitionId: string | undefined }
  | { status: 'not-found'; installedThemeId: undefined; themeDefinitionId: string | undefined }
  | { status: 'ready'; installedThemeId: string; themeDefinitionId: string };

export function useResolvedThemeInstance(storeId: string): ResolvedThemeInstance {
  const { themeId } = useParams<{ themeId: string }>();
  const [rows, setRows] = useState<StoreThemeData[] | null>(null);

  useEffect(() => {
    setRows(null);
    apiListInstalledThemes(storeId).then(res => setRows(res.data)).catch(() => setRows([]));
  }, [storeId]);

  if (rows === null) return { status: 'loading', installedThemeId: undefined, themeDefinitionId: themeId };
  const match = rows.find(r => r.themeDefinitionId === themeId);
  if (!match || !match.themeDefinitionId) return { status: 'not-found', installedThemeId: undefined, themeDefinitionId: themeId };
  return { status: 'ready', installedThemeId: match._id, themeDefinitionId: match.themeDefinitionId };
}
