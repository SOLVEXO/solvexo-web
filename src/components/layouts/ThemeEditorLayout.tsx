import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { StoreWorkspaceProvider, resolveStoreAccessRedirect } from './StoreLayout';

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
  const { storeId: routeStoreId } = useParams<{ storeId: string }>();

  const accessRedirect = resolveStoreAccessRedirect(routeStoreId, currentPath);
  if (accessRedirect) return <Navigate to={accessRedirect} replace />;

  return (
    <StoreWorkspaceProvider>
      {/* `overflow-y-auto` (not `-hidden`) — matches the scroll behavior
         `StoreLayout`'s own content area previously provided. Each editor
         page's left-hand section list relies on PAGE scroll (it has no
         height/overflow of its own); only the live-preview/JSON panels are
         separately height-constrained with their own internal scroll. */}
      <div data-lenis-prevent className="h-screen w-screen overflow-y-auto bg-[#FAF9F5]">
        <Outlet />
      </div>
    </StoreWorkspaceProvider>
  );
}
