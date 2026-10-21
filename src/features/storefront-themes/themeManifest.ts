import type { ResourceTemplateType } from '@/api/services/collectionTemplate';
import type { StorefrontColors } from '@/api/services/storeTheme';
import type { FieldSchema } from '@/features/seller/store/Dashboard/OnlineStore/builder/SchemaForm';

/**
 * The Theme Manifest contract — Phase 3 of the theme-agnostic platform work.
 *
 * WHY THIS FILE EXISTS: the merchant Customize/Theme-Settings/Header-Footer/
 * Edit-Code pages (`OnlineStore/themes/Maison*.tsx`) are today hardcoded to
 * one theme — literal `theme-03-fashion` imports, `Maison`-prefixed
 * component names, a `TemplateScope` union and `SCOPE_CONFIG` map declared
 * inline inside `ThemeCustomizePage.tsx`, and a theme-settings field list
 * hand-written inside `ThemeSettingsPanel.tsx`. A second theme today
 * would mean copy-pasting all five pages and hand-editing each one — exactly
 * the "the architecture has failed this test" failure mode the reusability
 * requirement rules out.
 *
 * This file is the data contract a theme declares once, so those five pages
 * can (in the next pass — see the note at the bottom) read FROM a manifest
 * instead of hardcoding one theme's specifics. It does not itself change any
 * page's behavior; nothing consumes it yet. That's deliberate: rewiring five
 * already-working, real-merchant-facing pages to read from this generically
 * is a genuine refactor with real regression risk, and this environment has
 * no way to compile or run the app to catch a mistake before it reaches
 * production. Landing the CONTRACT first — as its own inspectable,
 * zero-risk, additive artifact — is what makes that refactor tractable and
 * reviewable as its own next step, instead of one giant unverifiable change.
 *
 * IMPORTANT — what this manifest does NOT need to duplicate: the section
 * *vocabulary* (`SECTION_META` in `OnlineStore/builder/sectionRegistry.ts`)
 * and the block shapes it references are already shared, theme-agnostic
 * platform data (backend-validated by `section-settings.validator.ts`, keyed
 * by `SectionType` from `@/api/services/storefrontTypes`) — every theme is
 * expected to render the SAME section types, not invent its own vocabulary.
 * Likewise header/footer block types (`nav_link`/`footer_column`/
 * `social_link`/`copyright_text`) are already shared `Block` shapes. And the
 * per-theme RENDERING side (`Layout`, one component per `StorefrontRouteKey`)
 * already has a real, working, theme-agnostic contract: `NewThemeImpl` in
 * `registry.ts`. This manifest only covers what's genuinely NOT generic yet:
 * which of the shared `StorefrontColors` fields a theme's render tree
 * actually uses (Maison deliberately exposes a real subset, not every
 * field — see `ThemeSettingsPanel`'s own doc comment), which
 * template scopes it has, and whether it renders the announcement bar.
 */

/** One customizable field in the Theme Settings panel, mapped onto a real
 *  `StorefrontColors` key — never an invented setting with no effect, per
 *  the existing "no dishonest no-op controls" principle. */
export interface ThemeSettingsFieldDef {
  /** A real key on the shared `StorefrontColors` schema (backend-validated,
   *  same document every theme's `StoreTheme.theme`/`.draft.theme` uses). */
  /** A shared `StorefrontColors` key, or `custom.<name>` for a setting only THIS theme defines: it is stored in `StorefrontColors.themeSettings` (no backend change needed) and read in the theme with `customThemeSetting`. */
  key: keyof StorefrontColors | `custom.${string}`;
  label: string;
  group: 'Colors' | 'Typography' | 'Buttons' | 'Layout & Spacing' | 'Images' | 'Product cards' | 'Product page' | 'Effects' | 'Cart';
  control:
    | { kind: 'color'; /** Optional override: shows an "Auto (theme)" state with a Reset, and saves null when reset. */ optional?: { fallback: string } }
    | { kind: 'select'; options: { value: string; label: string }[] };
  /** Shown under the field — e.g. Maison's fixed headline typeface note. */
  helpText?: string;
}

/** Current value of a manifest field: a shared key or a `custom.<name>` theme-declared setting. */
export function readThemeSetting(colors: StorefrontColors, field: Pick<ThemeSettingsFieldDef, 'key'>): unknown {
  return field.key.startsWith('custom.') ? colors.themeSettings?.[field.key.slice(7)] : colors[field.key as keyof StorefrontColors];
}

/** The patch that sets a manifest field (custom fields merge into `themeSettings`; `null` removes one). */
export function themeSettingPatch(colors: StorefrontColors, field: Pick<ThemeSettingsFieldDef, 'key'>, value: string | number | boolean | null): Partial<StorefrontColors> {
  if (!field.key.startsWith('custom.')) return { [field.key]: value } as Partial<StorefrontColors>;
  const next = { ...(colors.themeSettings ?? {}) };
  if (value === null) delete next[field.key.slice(7)]; else next[field.key.slice(7)] = value;
  return { themeSettings: next };
}

/** Read a theme-declared setting inside the theme (string/number/boolean), with the theme's own default. */
export function customThemeSetting<T extends string | number | boolean>(colors: { themeSettings?: Record<string, string | number | boolean> } | null | undefined, name: string, fallback: T): T {
  const v = colors?.themeSettings?.[name];
  return typeof v === typeof fallback ? (v as T) : fallback;
}

/** One merchant-editable template scope (Home / Product / Collection /
 *  Search / Cart / Blog…). Mirrors `ThemeCustomizePage.tsx`'s own
 *  `TemplateScope`/`SCOPE_CONFIG`, extracted here so a generic Customize
 *  page can build its scope switcher from this list instead of a hardcoded
 *  union type. */
/** Phase 5 — which labeled group a scope surfaces under in the Customize
 *  editor's Shopify-style template picker (`ScopePicker.tsx`). Purely a UI
 *  grouping key; doesn't change how a scope is stored/addressed (`resource`
 *  below still owns that). `'pages'`/`'blogs'`/`'articles'` are the three
 *  groups whose scope also carries a `resourcePicker` (see below) letting a
 *  merchant pick WHICH real page/blog/article to work with, instead of
 *  editing one fixed document the way Home/Product/Search/Cart do. */
export type ThemeTemplateScopeGroup = 'home' | 'products' | 'collections' | 'pages' | 'blogs' | 'articles' | 'cart' | 'search' | 'other';

export interface ThemeTemplateScopeDef {
  id: string;
  label: string;
  /** Which group this scope is listed under in the Customize editor's
   *  template picker — see `ThemeTemplateScopeGroup`. */
  group: ThemeTemplateScopeGroup;
  /** Whether the editor preview renders the shared site chrome
   *  (navbar/announcement bar/footer). Public storefront routes render this
   *  shared chrome around their page template, so all page-template previews
   *  that represent a complete storefront page should enable it. */
  showChrome: boolean;
  /** How this scope's `Section[]` document is stored/addressed on the
   *  backend — a real `StorePage` (Home, one per store, or Phase 5: any
   *  real merchant-created custom page, picked via `resourcePicker`) or a
   *  real `CollectionTemplate` row (every other scope), reusing the same
   *  `resourceType`/`templateKey` addressing `ThemeCustomizePage.tsx`
   *  already established (search/cart/blog reuse the `page` resourceType
   *  bucket with a distinguishing `templateKey`, since the backend's
   *  `resourceType` enum has no dedicated values for them — see that file's
   *  own doc comment for why).
   *
   *  `pageType: 'custom'` and `previewPicker` are both Phase 5 additions —
   *  neither changes what document is edited (a custom page IS its own
   *  document, picked by id; a blog/article `previewPicker` only changes
   *  what real data the live preview shows alongside the one shared
   *  Blog-Index/Blog-Article template — see `CoreSectionPreviewContext`). */
  resource:
    | { kind: 'store-page'; pageType: 'home' }
    | { kind: 'store-page'; pageType: 'custom' }
    | { kind: 'collection-template'; resourceType: ResourceTemplateType; templateKey: string; allowAltTemplates: boolean; previewPicker?: 'blog' | 'article' };
}

/** A named, complete look a merchant can apply in one click (a bundle of theme settings). */
export interface ThemeStylePreset {
  id: string;
  name: string;
  description: string;
  settings: Partial<StorefrontColors>;
}

/** Optional header controls a theme chooses to support. The Header settings panel only shows the ones its active theme lists
 *  (like a Shopify theme's own settings schema), so a control never appears for a theme that would ignore it. */
export type HeaderOptionKey =
  | 'logoPosition' | 'menuPosition' | 'menuAlignment' | 'searchBar' | 'searchPosition'
  | 'sticky' | 'transparent' | 'menuStyle' | 'button' | 'topBar' | 'colours';

/** Optional footer controls a theme chooses to support. The Footer settings panel only shows the ones its active theme lists,
 *  so a switch never appears for a theme that would ignore it. A theme with no list shows all of them (older themes keep working). */
export type FooterOptionKey =
  | 'layout' | 'spacing' | 'alignment' | 'newsletterTop' | 'mobileAccordion' | 'colours' | 'backgroundImage'
  | 'headings' | 'socialStyle' | 'socialColour' | 'socialSize' | 'policyLinks' | 'currency' | 'backToTop' | 'logo' | 'defaultColumns';

/** One choice a theme offers for a header option (shown in the Header panel in this order). */
export interface HeaderChoice {
  /** Short slug saved on the store (lowercase letters, digits, - and _). The theme itself interprets it. */
  value: string;
  label: string;
  /** Small note shown under the select while this choice is picked. */
  hint?: string;
}

/** A repeatable item inside a theme-declared section (e.g. one look in a lookbook). Stored as a `theme_block` with `blockKey = <sectionKey>.<key>`. */
export interface ThemeCustomBlockDef {
  key: string;
  label: string;
  fields: FieldSchema[];
  defaults?: Record<string, unknown>;
}

/** A section only this theme has. Stored as a `theme_section` (`settings.sectionKey = key`, the fields flat beside it), so the backend and the editor need no change: declare it here and register a renderer with the theme. `key` must be lowercase and namespaced, e.g. `maison.lookbook`. */
export interface ThemeCustomSectionDef {
  key: string;
  label: string;
  description: string;
  /** Accent colour of the editor card icon. */
  color?: string;
  fields: FieldSchema[];
  defaults?: Record<string, unknown>;
  /** Repeatable items; omit for a section without blocks. */
  block?: ThemeCustomBlockDef;
  /** How many blocks a new section starts with (default 0). */
  initialBlocks?: number;
  /** Ready-made starting points; each is offered as its own card in Add section. */
  presets?: ThemeCustomSectionPreset[];
}

/** A ready-made starting point for a theme-declared section. `blocks` holds the fields of each pre-filled block. */
export interface ThemeCustomSectionPreset {
  id: string;
  name: string;
  description: string;
  settings?: Record<string, unknown>;
  blocks?: Record<string, unknown>[];
}

export interface ThemeManifest {
  /** Matches this theme's `NEW_THEME_REGISTRY` key / `StoreTheme.themeDefinitionId`. */
  id: string;
  name: string;
  /** Whether this theme's chrome renders `Store.announcementBar` (a
   *  site-wide, theme-independent field — see `FashionLayout.tsx`'s own doc
   *  comment on why it isn't theme-scoped data) at all. A theme can
   *  legitimately opt out if its design has no place for a message strip. */
  supportsAnnouncementBar: boolean;
  /** Which optional header layout/search controls this theme renders. Missing = none of them. */
  supportedHeaderOptions?: HeaderOptionKey[];
  /** Which optional footer controls this theme renders. Missing = all of them. */
  supportedFooterOptions?: FooterOptionKey[];
  /** The values this theme offers for options that vary per theme. The first one is the default. */
  headerOptionChoices?: { searchPosition?: HeaderChoice[] };
  /** Sections only this theme offers (shown in Add section, edited with the generic form). */
  customSections?: ThemeCustomSectionDef[];
  templates: ThemeTemplateScopeDef[];
  themeSettingsFields: ThemeSettingsFieldDef[];
  /** Every editable setting at the theme's own default: what "Reset to default" applies. */
  defaultSettings?: Partial<StorefrontColors>;
  /** One-click complete looks; applied as a bundle over the current settings. */
  styles?: ThemeStylePreset[];
}

/** Every real theme's manifest, keyed the same way `NEW_THEME_REGISTRY` is.
 *  A generic Customize/Theme-Settings/Header-Footer/Edit-Code page (Phase 4/
 *  5's work) resolves the active store's `themeDefinitionId` against BOTH
 *  this map (what can be edited, and how) and `NEW_THEME_REGISTRY` (how it
 *  renders) instead of importing one theme's components by name. */
export const THEME_MANIFESTS: Record<string, ThemeManifest> = {};

export function registerThemeManifest(manifest: ThemeManifest) {
  THEME_MANIFESTS[manifest.id] = manifest;
}

/** The theme's own custom sections (empty for an unknown theme). */
export function customSectionsOf(themeDefinitionId: string | null | undefined, fallbackId: string): ThemeCustomSectionDef[] {
  return getThemeManifest(themeDefinitionId, fallbackId)?.customSections ?? [];
}

/** A saved `theme_section`'s definition, found by its `sectionKey` across every registered theme. */
export function findCustomSectionDef(sectionKey: unknown): ThemeCustomSectionDef | undefined {
  if (typeof sectionKey !== 'string') return undefined;
  for (const m of Object.values(THEME_MANIFESTS)) {
    const hit = m.customSections?.find(d => d.key === sectionKey);
    if (hit) return hit;
  }
  return undefined;
}

/** A saved `theme_block`'s definition, found by its `blockKey` (`<sectionKey>.<block key>`). */
export function findCustomBlockDef(blockKey: unknown): ThemeCustomBlockDef | undefined {
  if (typeof blockKey !== 'string') return undefined;
  for (const m of Object.values(THEME_MANIFESTS)) {
    for (const d of m.customSections ?? []) if (d.block && `${d.key}.${d.block.key}` === blockKey) return d.block;
  }
  return undefined;
}

export function getThemeManifest(themeDefinitionId: string | null | undefined, fallbackId: string): ThemeManifest {
  return (themeDefinitionId && THEME_MANIFESTS[themeDefinitionId]) || THEME_MANIFESTS[fallbackId];
}
