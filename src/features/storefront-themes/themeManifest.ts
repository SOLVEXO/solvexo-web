import type { ResourceTemplateType } from '@/api/services/collectionTemplate';
import type { StorefrontColors } from '@/api/services/storeTheme';

/**
 * The Theme Manifest contract — Phase 3 of the theme-agnostic platform work.
 *
 * WHY THIS FILE EXISTS: the merchant Customize/Theme-Settings/Header-Footer/
 * Edit-Code pages (`OnlineStore/themes/Atelier*.tsx`) are today hardcoded to
 * one theme — literal `theme-01-atelier` imports, `Atelier`-prefixed
 * component names, a `TemplateScope` union and `SCOPE_CONFIG` map declared
 * inline inside `AtelierCustomizePage.tsx`, and a theme-settings field list
 * hand-written inside `AtelierThemeSettingsPanel.tsx`. A second theme today
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
 * actually uses (Atelier deliberately exposes a real subset, not every
 * field — see `AtelierThemeSettingsPanel`'s own doc comment), which
 * template scopes it has, and whether it renders the announcement bar.
 */

/** One customizable field in the Theme Settings panel, mapped onto a real
 *  `StorefrontColors` key — never an invented setting with no effect, per
 *  the existing "no dishonest no-op controls" principle. */
export interface ThemeSettingsFieldDef {
  /** A real key on the shared `StorefrontColors` schema (backend-validated,
   *  same document every theme's `StoreTheme.theme`/`.draft.theme` uses). */
  key: keyof StorefrontColors;
  label: string;
  group: 'Colors' | 'Typography' | 'Buttons' | 'Layout & Spacing';
  control:
    | { kind: 'color' }
    | { kind: 'select'; options: { value: string; label: string }[] };
  /** Shown under the field — e.g. Atelier's fixed headline typeface note. */
  helpText?: string;
}

/** One merchant-editable template scope (Home / Product / Collection /
 *  Search / Cart / Blog…). Mirrors `AtelierCustomizePage.tsx`'s own
 *  `TemplateScope`/`SCOPE_CONFIG`, extracted here so a generic Customize
 *  page can build its scope switcher from this list instead of a hardcoded
 *  union type. */
export interface ThemeTemplateScopeDef {
  id: string;
  label: string;
  /** Whether the live preview for this scope renders full site chrome
   *  (navbar/announcement bar/footer) or just the section content in
   *  isolation — Home shows chrome; a product/collection/search/cart/blog
   *  template's OWN page component supplies its own surrounding chrome on
   *  the real storefront, so previewing it standalone (no double chrome)
   *  matches what a buyer actually sees there. */
  showChrome: boolean;
  /** How this scope's `Section[]` document is stored/addressed on the
   *  backend — a real `StorePage` (Home, one per store) or a real
   *  `CollectionTemplate` row (every other scope), reusing the same
   *  `resourceType`/`templateKey` addressing `AtelierCustomizePage.tsx`
   *  already established (search/cart/blog reuse the `page` resourceType
   *  bucket with a distinguishing `templateKey`, since the backend's
   *  `resourceType` enum has no dedicated values for them — see that file's
   *  own doc comment for why). */
  resource:
    | { kind: 'store-page' }
    | { kind: 'collection-template'; resourceType: ResourceTemplateType; templateKey: string; allowAltTemplates: boolean };
}

export interface ThemeManifest {
  /** Matches this theme's `NEW_THEME_REGISTRY` key / `StoreTheme.themeDefinitionId`. */
  id: string;
  name: string;
  /** Whether this theme's chrome renders `Store.announcementBar` (a
   *  site-wide, theme-independent field — see `AtelierLayout.tsx`'s own doc
   *  comment on why it isn't theme-scoped data) at all. A theme can
   *  legitimately opt out if its design has no place for a message strip. */
  supportsAnnouncementBar: boolean;
  templates: ThemeTemplateScopeDef[];
  themeSettingsFields: ThemeSettingsFieldDef[];
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

export function getThemeManifest(themeDefinitionId: string | null | undefined, fallbackId: string): ThemeManifest {
  return (themeDefinitionId && THEME_MANIFESTS[themeDefinitionId]) || THEME_MANIFESTS[fallbackId];
}
