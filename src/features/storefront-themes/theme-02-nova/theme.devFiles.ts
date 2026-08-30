import { registerThemeDevFiles } from '../themeDevFiles';

/**
 * Nova's real dev-files registration — same `ThemeDevFiles` contract
 * Atelier's own `theme.devFiles.ts` implements (see that file, and
 * `themeDevFiles.ts` itself, for the full Vite `import.meta.glob`
 * static-literal-path rationale). Registering this file is what makes
 * Nova's real source show up in the Edit Code developer workspace with
 * zero new code in `AtelierEditCodePage.tsx` (it already resolves the
 * active store's theme id against `THEME_DEV_FILES` generically).
 */

const SECTION_SOURCES = import.meta.glob('./sections/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const CONFIG_SOURCE = import.meta.glob('./theme.config.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const LAYOUT_SOURCE = import.meta.glob('./layout/NovaLayout.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const SNIPPET_SOURCES = import.meta.glob([
  './components/NovaButton.tsx',
  './components/NovaProductCard.tsx',
  './components/novaFormStyles.ts',
], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

// Nova has no `locales/en.default.json` file of its own yet (disclosed
// limitation — this theme's own microcopy hasn't been separately versioned
// out to a locale file the way Atelier's has). Per `ThemeDevFiles`'
// own contract ("a theme with no such file registers `{}`"), this is a
// real, honest empty registration rather than a glob over a path that
// doesn't exist.
const LOCALE_SOURCE: Record<string, string> = {};

registerThemeDevFiles({
  id: 'theme-02-nova',
  sectionSources: SECTION_SOURCES,
  configSource: CONFIG_SOURCE,
  layoutSource: LAYOUT_SOURCE,
  snippetSources: SNIPPET_SOURCES,
  localeSource: LOCALE_SOURCE,
});
