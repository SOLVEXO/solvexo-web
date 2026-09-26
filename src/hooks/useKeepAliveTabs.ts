import { useCallback, useState } from 'react';

interface KeepAliveTabsApi<T extends string> {
  activeTab: T;
  setActiveTab: (id: T) => void;
  isVisited: (id: T) => boolean;
  isActive: (id: T) => boolean;
  /** className helper for a kept-alive panel wrapper. */
  paneClassName: (id: T) => string;
}

/** Backs every TabBar-driven "hub" page (Analytics/Settings/Inventory/SEO/etc.)
 *  A plain `{activeTab === id && <Panel/>}` render unmounts the previous tab's
 *  component on every switch, so returning to an already-visited tab remounts
 *  it from scratch — its own `useState(loading:true)`/`useEffect` fetch cycle
 *  (and skeleton) reruns every single time, even for data just seen seconds
 *  ago. This tracks which tab ids have ever been active and keeps each one
 *  mounted (hidden via CSS, not unmounted) once visited, so a repeat visit is
 *  instant with no refetch — while a tab never opened still isn't mounted at
 *  all, so switching to it the first time is the only real fetch.
 *
 *  Two overloads so a plain string-literal call (`useKeepAliveTabs('overview')`,
 *  the common case) infers a wide `string` — not a single-literal-only type
 *  that every OTHER tab id would then fail to satisfy — while a call site that
 *  wants its own real union (`useKeepAliveTabs<TabId>('overview')`) still gets
 *  it, explicitly. */
export function useKeepAliveTabs(initialTab: string): KeepAliveTabsApi<string>;
export function useKeepAliveTabs<T extends string>(initialTab: T): KeepAliveTabsApi<T>;
export function useKeepAliveTabs(initialTab: string): KeepAliveTabsApi<string> {
  const [activeTab, setActiveTabState] = useState(initialTab);
  const [visited, setVisited] = useState<Record<string, boolean>>({ [initialTab]: true });

  const setActiveTab = useCallback((id: string) => {
    setActiveTabState(id);
    setVisited((v) => (v[id] ? v : { ...v, [id]: true }));
  }, []);

  const isVisited = useCallback((id: string) => !!visited[id], [visited]);
  const isActive = useCallback((id: string) => activeTab === id, [activeTab]);
  const paneClassName = useCallback((id: string) => (activeTab === id ? '' : 'hidden'), [activeTab]);

  return { activeTab, setActiveTab, isVisited, isActive, paneClassName };
}
