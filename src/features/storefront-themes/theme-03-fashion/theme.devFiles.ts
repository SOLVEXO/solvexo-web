import { registerThemeDevFiles } from '../themeDevFiles';

// Vite needs literal glob paths AND literal options, so each theme lists its own files for the read-only "Edit code" workspace.
registerThemeDevFiles({
  id: 'theme-03-fashion',
  sectionSources: import.meta.glob('./sections/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>,
  configSource: import.meta.glob('./theme.config.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>,
  layoutSource: import.meta.glob('./layout/FashionLayout.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>,
  snippetSources: import.meta.glob(['./components/FashionButton.tsx', './components/FashionProductCard.tsx', './fashion.css'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>,
  localeSource: {},
});
