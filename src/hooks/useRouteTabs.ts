import { useCallback, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { Tab } from '@/components/comman/ui/TabBar';
import { useStoreWorkspace, hasNavPermission } from '@/components/layouts/StoreLayout';
import { TokenStorage } from '@/api/services/auth';
import { useKeepAliveTabs } from '@/hooks/useKeepAliveTabs';

interface Options {
  tabs: Tab[];
  /** Staff permission(s) per tab id (any-of). A tab with no entry is open to every role. */
  permissions?: Record<string, string | string[]>;
  /** Path segment after /store/:storeId/, e.g. 'seo' => /store/:id/seo/:tab */
  base: string;
  /** Old `?tab=` ids that were renamed. */
  legacyIds?: Record<string, string>;
  /** Pin the tab regardless of the URL param (for legacy standalone routes). */
  forcedTab?: string;
}

/** URL-driven tabs for a hub page (`<base>/:tab?`), same pattern as SettingsHub, plus a per-tab staff
 *  permission check that also applies to direct URLs. UX only — the backend 403s are the real boundary.
 *  Render `redirectTo` as <Navigate replace> when non-null; render the "no access" state when `blocked`. */
export function useRouteTabs({ tabs, permissions = {}, base, legacyIds = {}, forcedTab }: Options) {
  const { storeId } = useStoreWorkspace();
  const navigate = useNavigate();
  const { tab: tabParam } = useParams<{ tab?: string }>();
  const [searchParams] = useSearchParams();
  const user = TokenStorage.getUser<{ role?: 'admin' | 'seller' | 'staff' | 'user'; permissions?: string[] }>();

  const visibleTabs = tabs.filter(t => !permissions[t.id] || hasNavPermission(user as never, permissions[t.id]));
  const allowed = (id?: string | null) => !!id && visibleTabs.some(t => t.id === id);
  const first = visibleTabs[0]?.id ?? null;
  const url = (id: string) => `/store/${storeId}/${base}/${id}`;

  const legacy = searchParams.get('tab');
  const legacyId = legacy ? (legacyIds[legacy] ?? legacy) : null;
  const requested = forcedTab ?? tabParam ?? legacyId;
  const activeId = allowed(requested) ? (requested as string) : first;

  const { activeTab, setActiveTab, isVisited, paneClassName } = useKeepAliveTabs(activeId ?? 'none');
  useEffect(() => { if (activeId) setActiveTab(activeId); }, [activeId, setActiveTab]);

  // Redirect when the URL is not the canonical `<base>/<allowed tab>` (no tab, legacy ?tab=, unknown or forbidden tab).
  const redirectTo = !first || forcedTab ? null
    : (tabParam && tabParam === activeId && !legacy) ? null
    : url(activeId as string);

  const openTab = useCallback((id: string) => {
    if (forcedTab) { navigate(url(id)); return; }
    navigate(url(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, storeId, base, forcedTab]);

  return { visibleTabs, activeTab: activeId ?? activeTab, openTab, isVisited, paneClassName, redirectTo, blocked: !first };
}
