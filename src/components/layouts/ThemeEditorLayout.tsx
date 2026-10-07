import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useBlocker, useLocation, useParams } from 'react-router-dom';
import { StoreWorkspaceProvider, resolveStoreAccessRedirect } from './StoreLayout';
import { ThemeEditorUnsavedProvider } from './ThemeEditorUnsavedContext';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';

/**
 * Dedicated, distraction-free fullscreen shell for the theme editor
 * (Customize / Header & Footer / Edit Code) — deliberately NOT nested under
 * `StoreLayout`, so none of its dashboard chrome (sidebar, notification
 * bell, store switcher, announcement/billing banners, bottom nav) renders
 * around the editor. This mirrors the exact same reasoning already applied
 * to the Theme Library's own preview route (`ThemeDemoPreview`, registered
 * as a sibling of `StoreLayout` in `router/index.tsx` for the identical
 * "why is my dashboard showing inside this" reason) — Phase 2 of the Online
 * Store rebuild extends that same treatment to the real editor pages, which
 * previously rendered inside the full dashboard shell despite needing to
 * feel like a separate, professional editor product.
 *
 * Still resolves the exact same `useStoreWorkspace()` context every other
 * store page gets — via the SAME `StoreWorkspaceProvider` `StoreLayout`
 * itself uses (imported, not duplicated) — so none of the three editor
 * pages need any change to how they fetch `storeId`/`store`. Access control
 * is the same rule too (`resolveStoreAccessRedirect`, extracted out of
 * `StoreLayout` for this exact reuse).
 *
 * Each editor page renders its own slim top bar (see `EditorTopBar.tsx`) —
 * this shell only provides the full-viewport frame and the workspace
 * context; it intentionally renders no chrome of its own.
 */
export function ThemeEditorLayout() {
  const { pathname: currentPath } = useLocation();
  const { storeId: routeStoreId, themeId: routeThemeId } = useParams<{ storeId: string; themeId: string }>();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const reportUnsavedChanges = useCallback((dirty: boolean) => setHasUnsavedChanges(dirty), []);
  const blocker = useBlocker(hasUnsavedChanges);
  const blockerRef = useRef(blocker);
  blockerRef.current = blocker;


  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [hasUnsavedChanges]);

  const accessRedirect = resolveStoreAccessRedirect(routeStoreId, currentPath);
  if (accessRedirect) return <Navigate to={accessRedirect} replace />;

  return (
    <StoreWorkspaceProvider>
      <ThemeEditorUnsavedProvider value={reportUnsavedChanges}>
      {/* `overflow-y-auto` (not `-hidden`) — matches the scroll behavior
         `StoreLayout`'s own content area previously provided. Each editor
         page's left-hand section list relies on PAGE scroll (it has no
         height/overflow of its own); only the live-preview/JSON panels are
         separately height-constrained with their own internal scroll. */}
      <div data-lenis-prevent className="h-screen w-screen overflow-y-auto bg-[#FAF9F5]">
        {/* Keyed by store + theme so switching either remounts the editor page:
           no stale doc/selection/draft state from the previous store/theme can
           be saved over the new one. */}
        <Outlet key={`${routeStoreId}:${routeThemeId}`} />
      </div>
      {blocker.state === 'blocked' && (
        <UnsavedChangesDialog
          message="You have unsaved theme changes. Leave this editor and discard them?"
          confirmLabel="Leave and discard"
          onConfirm={() => blockerRef.current.proceed?.()}
          onCancel={() => blockerRef.current.reset?.()}
        />
      )}
      </ThemeEditorUnsavedProvider>
    </StoreWorkspaceProvider>
  );
}
