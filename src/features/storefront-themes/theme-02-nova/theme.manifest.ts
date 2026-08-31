import { registerThemeManifest, type ThemeManifest } from '../themeManifest';

/**
 * Nova's real theme manifest — same `ThemeManifest` contract Atelier's own
 * `theme.manifest.ts` implements (see that file's doc comment, and
 * `themeManifest.ts` itself, for the full rationale). This is the direct
 * reusability proof for that contract: registering this file is the ONLY
 * step that makes Nova's Theme Settings panel and Customize scope switcher
 * appear correctly — zero new code was written in
 * `AtelierThemeSettingsPanel.tsx` or `AtelierCustomizePage.tsx` (both
 * already read generically from `getThemeManifest(...)`) to support it.
 *
 *  - `templates` lists 6 scopes — Home, Product, Collection, Search, Blog
 *    Index, Blog Article — matching the 7 routes this theme actually
 *    implements (see `theme.config.ts`'s README) MINUS Cart, which Nova has
 *    no page for at all; listing a 'cart' scope here would let a merchant
 *    open a Cart customize screen that edits data Nova never renders
 *    (`ThemedRoute` falls back to Atelier's real Cart page instead), which
 *    would be actively misleading rather than just incomplete. Every scope
 *    that IS listed here is fully real and functional.
 *  - `themeSettingsFields` matches the exact same `StorefrontColors` subset
 *    `applyMerchantThemeOverrides` in this theme's own `theme.config.ts`
 *    actually reads — same reasoning as Atelier's manifest: no field is
 *    listed here that this theme's render tree doesn't actually use.
 */
export const novaThemeManifest: ThemeManifest = {
  id: 'theme-02-nova',
  name: 'Nova',
  supportsAnnouncementBar: true,

  templates: [
    { id: 'home', label: 'Home', showChrome: true, resource: { kind: 'store-page' } },
    { id: 'product', label: 'Product', showChrome: false, resource: { kind: 'collection-template', resourceType: 'product', templateKey: 'default', allowAltTemplates: true } },
    { id: 'collection', label: 'Collection', showChrome: false, resource: { kind: 'collection-template', resourceType: 'collection', templateKey: 'default', allowAltTemplates: true } },
    { id: 'search', label: 'Search', showChrome: false, resource: { kind: 'collection-template', resourceType: 'page', templateKey: 'search', allowAltTemplates: false } },
    { id: 'blogIndex', label: 'Blog (Stories) Index', showChrome: false, resource: { kind: 'collection-template', resourceType: 'page', templateKey: 'blog-index', allowAltTemplates: false } },
    { id: 'blogArticle', label: 'Blog Article', showChrome: false, resource: { kind: 'collection-template', resourceType: 'page', templateKey: 'blog-article', allowAltTemplates: false } },
  ],

  themeSettingsFields: [
    { key: 'bgColor', label: 'Background', group: 'Colors', control: { kind: 'color' } },
    { key: 'textColor', label: 'Text', group: 'Colors', control: { kind: 'color' } },
    { key: 'primaryColor', label: 'Accent', group: 'Colors', control: { kind: 'color' } },

    {
      key: 'font', label: 'Body & UI Font', group: 'Typography',
      control: { kind: 'select', options: ['Inter', 'Poppins', 'Roboto', 'Montserrat', 'Playfair Display', 'Fraunces', 'DM Sans', 'Nunito', 'Space Grotesk'].map(f => ({ value: f, label: f })) },
      helpText: "Headline typeface (Space Grotesk) is part of Nova's signature look and stays fixed.",
    },

    {
      key: 'buttonStyle', label: 'Style', group: 'Buttons',
      control: { kind: 'select', options: [{ value: 'solid', label: 'Solid' }, { value: 'outline', label: 'Outline' }, { value: 'soft', label: 'Soft (accent tint)' }] },
    },
    {
      key: 'buttonRadius', label: 'Corner Radius', group: 'Buttons',
      control: { kind: 'select', options: [{ value: 'none', label: 'Sharp' }, { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }, { value: 'full', label: 'Pill' }] },
    },
    {
      key: 'buttonWidth', label: 'Width', group: 'Buttons',
      control: { kind: 'select', options: [{ value: 'auto', label: 'Fits content' }, { value: 'full', label: 'Full width' }] },
    },

    {
      key: 'sectionSpacing', label: 'Section Spacing', group: 'Layout & Spacing',
      control: { kind: 'select', options: [{ value: 'compact', label: 'Compact' }, { value: 'comfortable', label: 'Comfortable' }, { value: 'spacious', label: 'Spacious' }] },
    },
    {
      key: 'containerWidth', label: 'Container Width', group: 'Layout & Spacing',
      control: { kind: 'select', options: [{ value: 'narrow', label: 'Narrow' }, { value: 'standard', label: 'Standard' }, { value: 'wide', label: 'Wide' }] },
    },
  ],
};

registerThemeManifest(novaThemeManifest);
