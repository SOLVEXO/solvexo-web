# Storefront theme contract

A theme is a folder under `storefront-themes/theme-NN-name/`. Maison (`theme-03-fashion`) is the reference.
The theme owns UI and styling only. Logic, data and money live in `core/` and the existing APIs/contexts.

## Files a theme provides
- `theme.config.ts` — defaults + `applyMerchantThemeOverrides(colors)` (the only place the live singleton is written).
- `theme.manifest.ts` — `registerThemeManifest(...)`: template scopes the seller edits and `themeSettingsFields`.
- `layout/`, `pages/` (one component per `StorefrontRouteKey`), `sections/` (renderers), `components/`, `ui/`.
- `theme.preview.ts`, `theme.demoPreview.ts`, `theme.devFiles.ts` — editor preview, Theme Library demo, Edit Code files.
- One entry in `registry.ts` (`NEW_THEME_REGISTRY`): Layout, pages, GatePage, display, installDefaults.

## Settings the seller can change
- Fields in `themeSettingsFields` map to the shared `StorefrontColors` keys (colours, fonts, buttons, spacing, cards...).
- A setting only this theme needs: use `key: 'custom.<name>'`. It is stored in `StorefrontColors.themeSettings`
  by the backend without any schema/DTO change (60 keys max, simple names, string/number/boolean values).
  Read it in the theme with `customThemeSetting(colors, '<name>', defaultValue)`.

## Sections
- Which section types a theme offers = the renderers it registers (`registerXSection(type, render)`).
  The editor lists exactly those; the backend accepts every platform section type unless
  `THEME_SECTION_TYPES` (`solvexo-api/src/common/store-content/theme-section-capabilities.ts`) narrows the theme.
- A theme can reuse the shared renderers (`moreSections.tsx`, `sharedSections.tsx`) with its own tokens.
- A section only this theme has: declare it in the manifest `customSections` (key like `maison.lookbook`, fields as editor `FieldSchema[]`, optional repeatable `block`) and map the key to a component in the theme (`sections/ThemeSections.tsx` in Maison). It is stored as `theme_section` (+ `theme_block`), so the backend and the editor need no change. Limits: <=60 fields, text <=5000 chars, 20 blocks per section, 20 KB per section.
- A new platform-wide section TYPE (shared by many themes) still needs backend `SECTION_TYPES` + validator and web `storefrontTypes` + `sectionRegistry`.

## Rules
- No fake products, payment, auth, backend or database code inside a theme.
- Prices always go through the currency context. Every state: loading, empty, error with retry.
- Customer-facing text should use the `tt()`/`useTranslation('storefront')` helpers where one exists.
