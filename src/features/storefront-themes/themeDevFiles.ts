/**
 * The Theme Dev Files contract — Phase 5 of the theme-agnostic platform
 * work, sibling to `themeManifest.ts` (Phase 3/4).
 *
 * WHY THIS FILE EXISTS: `OnlineStore/themes/AtelierEditCodePage.tsx` (the
 * seller-facing "Edit Code" developer workspace) used five module-level
 * `import.meta.glob(...)` calls with Atelier's literal file paths baked in,
 * to show real, read-only theme source (sections/layout/snippets/locales)
 * for transparency. That's a hard Vite constraint, not a design choice this
 * refactor can route around: `import.meta.glob`'s path argument MUST be a
 * static string literal (or literal array) — Vite scans it at build time to
 * know which files to bundle, so it cannot be a runtime-computed path like
 * `` `../${themeId}/sections/*.tsx` ``. A second theme's files can never be
 * reached by parameterizing one glob call.
 *
 * The fix is the same pattern `themeManifest.ts` already established for a
 * different Vite/bundler constraint (dynamic Tailwind classes): each theme
 * owns ONE small file with its own literal `import.meta.glob(...)` calls
 * (see `theme-01-atelier/theme.devFiles.ts`), and registers the result here
 * under its `id` — exactly like `registerThemeManifest`. The page that
 * consumes this (`AtelierEditCodePage.tsx`) then resolves the ACTIVE
 * store's theme id against this registry instead of importing one theme's
 * glob results by name, so a second theme's dev files show up there with
 * zero new code in that page.
 */

/** One theme's real, read-only developer-workspace source — raw file
 *  contents keyed by their resolved glob path (the same shape
 *  `import.meta.glob(..., { query: '?raw', import: 'default', eager: true })`
 *  produces), so a consuming page can iterate them the same way regardless
 *  of which theme they came from. */
export interface ThemeDevFiles {
  /** Matches this theme's `NEW_THEME_REGISTRY` key / `ThemeManifest.id`. */
  id: string;
  /** Every section component's raw source, e.g. one entry per file under
   *  the theme's `sections/` folder. */
  sectionSources: Record<string, string>;
  /** The theme's own `theme.config.ts` (colors/tokens/etc.) — at most one
   *  entry; a theme with no such file registers `{}`. */
  configSource: Record<string, string>;
  /** The theme's site-wide chrome wrapper (header/footer/announcement-bar
   *  composition) — Shopify's `layout/theme.liquid` equivalent. */
  layoutSource: Record<string, string>;
  /** The theme's genuinely reusable small components — Shopify snippet
   *  includes' equivalent. A theme can register as many or as few as it
   *  considers worth surfacing here; this is a curated transparency view,
   *  not every internal helper file. */
  snippetSources: Record<string, string>;
  /** The theme's real, versioned user-facing microcopy file, if it has one. */
  localeSource: Record<string, string>;
}

export const THEME_DEV_FILES: Record<string, ThemeDevFiles> = {};

export function registerThemeDevFiles(devFiles: ThemeDevFiles) {
  THEME_DEV_FILES[devFiles.id] = devFiles;
}

export function getThemeDevFiles(themeDefinitionId: string | null | undefined, fallbackId: string): ThemeDevFiles | undefined {
  return (themeDefinitionId && THEME_DEV_FILES[themeDefinitionId]) || THEME_DEV_FILES[fallbackId];
}
