import { useCallback, useEffect, useRef, useState } from 'react';

interface KeepAliveTabsApi<T extends string> {
  activeTab: T;
  setActiveTab: (id: T) => void;
  isVisited: (id: T) => boolean;
  isActive: (id: T) => boolean;
  /** className helper for a kept-alive panel wrapper. */
  paneClassName: (id: T) => string;
  /** Mount a tab's panel without making it active (it stays hidden). */
  visit: (id: T) => void;
  /** Start the one-time background warm-up over these tab ids. See `useKeepAliveTabs`. */
  warmOtherTabs: (ids: T[]) => void;
}

/** Let the opened pane finish its own requests before background work starts. */
const WARM_START_MS = 1200;
/** One pane per step, so panes never queue each other's first fetch. */
const WARM_SPACING_MS = 500;

/** Backs every TabBar-driven "hub" page (Analytics/Settings/Inventory/SEO/etc.)
 *  A plain `{activeTab === id && <Panel/>}` render unmounts the previous tab's
 *  component on every switch, so returning to an already-visited tab remounts
 *  it from scratch — its own `useState(loading:true)`/`useEffect` fetch cycle
 *  (and skeleton) reruns every single time, even for data just seen seconds
 *  ago. This tracks which tab ids have ever been active and keeps each one
 *  mounted (hidden via CSS, not unmounted) once visited, so a repeat visit is
 *  instant with no refetch.
 *
 *  A hub tab renders nothing until its own data has arrived, so without help the
 *  FIRST visit pays the whole mount-plus-fetch cost after the click and the pane
 *  sits blank while that runs. `warmOtherTabs(ids)` avoids that: it walks the
 *  list once after the page settles, mounting each remaining pane hidden so its
 *  data is already on screen-time by the time it is opened. The walk is spaced
 *  (and effect-driven, so a StrictMode remount re-arms it rather than stranding
 *  it) to keep the shared per-origin socket pool free for the pane actually
 *  visible.
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

  const visitedRef = useRef(visited);
  useEffect(() => { visitedRef.current = visited; }, [visited]);

  const setActiveTab = useCallback((id: string) => {
    setActiveTabState(id);
    setVisited((v) => (v[id] ? v : { ...v, [id]: true }));
  }, []);

  const visit = useCallback((id: string) => {
    setVisited((v) => (v[id] ? v : { ...v, [id]: true }));
  }, []);

  const isVisited = useCallback((id: string) => !!visited[id], [visited]);
  const isActive = useCallback((id: string) => activeTab === id, [activeTab]);
  const paneClassName = useCallback((id: string) => (activeTab === id ? '' : 'hidden'), [activeTab]);

  const [warmIds, setWarmIds] = useState<string[] | null>(null);
  const [warmIndex, setWarmIndex] = useState(0);

  const warmOtherTabs = useCallback((ids: string[]) => {
    // One pass only; a hub calls this from an effect that can re-run.
    setWarmIds(prev => prev ?? ids);
  }, []);

  useEffect(() => {
    if (!warmIds) return;
    const id = warmIds[warmIndex];
    if (id === undefined) return;
    if (!visitedRef.current[id]) visit(id);
    const wait = warmIndex === 0 ? WARM_START_MS : WARM_SPACING_MS;
    const timer = window.setTimeout(() => setWarmIndex(i => i + 1), wait);
    return () => window.clearTimeout(timer);
  }, [warmIds, warmIndex, visit]);

  return { activeTab, setActiveTab, visit, isVisited, isActive, paneClassName, warmOtherTabs };
}
