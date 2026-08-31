import { registerThemeDevFiles } from '../themeDevFiles';

/**
 * Atelier's real dev-files registration — see `themeDevFiles.ts` for why
 * this file exists (Vite's `import.meta.glob` requires a static string
 * literal path, so each theme owns its own literal glob calls rather than
 * one shared, parameterized one).
 *
 * These are the exact same `import.meta.glob(...)` calls that used to live
 * directly inside `OnlineStore/themes/AtelierEditCodePage.tsx` — moved here
 * verbatim (only the relative paths changed, and only because this file
 * lives closer to its targets: `./sections/*.tsx` instead of the five-
 * levels-up `../../../../../storefront-themes/theme-01-atelier/sections/*.tsx`
 * that file needed). Nothing about what's exposed, or why, has changed —
 * see each block's own comment, preserved from the original.
 */

// Real, read-only source transparency — the actual `.tsx` a JSON section
// entry renders through. Vite's raw-import glob, same mechanism the old
// (now-removed) developer workspace used for this exact purpose: a
// developer can see precisely what a `type` in a template's JSON maps to,
// without this workspace granting arbitrary code execution.
const SECTION_SOURCES = import.meta.glob('./sections/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const CONFIG_SOURCE = import.meta.glob('./theme.config.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
// `layout/` — Atelier's real site-wide chrome wrapper (header/footer/
// announcement-bar composition), the direct equivalent of Shopify's
// `layout/theme.liquid`. `snippets/` — the theme's genuinely reusable small
// components, the direct equivalent of Shopify snippet includes. Both real
// read-only source, same transparency mechanism as `sections/` above — not
// decorative placeholders.
const LAYOUT_SOURCE = import.meta.glob('./layout/AtelierLayout.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const SNIPPET_SOURCES = import.meta.glob([
  './components/AtelierButton.tsx',
  './components/AtelierProductCard.tsx',
  './components/atelierFormStyles.ts',
], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
// `locales/` — a real, versioned file of the theme's actual user-facing
// microcopy (sourced from the live components, not invented) — genuinely
// real content, deliberately scoped to read-only reference rather than a
// full translation/override system (multi-language storefront content is
// explicitly out of scope for this pass — see the theme system audit).
const LOCALE_SOURCE = import.meta.glob('./locales/en.default.json', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

registerThemeDevFiles({
  id: 'theme-01-atelier',
  sectionSources: SECTION_SOURCES,
  configSource: CONFIG_SOURCE,
  layoutSource: LAYOUT_SOURCE,
  snippetSources: SNIPPET_SOURCES,
  localeSource: LOCALE_SOURCE,
});
