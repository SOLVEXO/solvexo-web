import { registerThemeManifest, type ThemeManifest } from '../themeManifest';

/**
 * Atelier's real theme manifest — the first (and, until Theme B exists, only)
 * implementation of the `ThemeManifest` contract (see `themeManifest.ts` for
 * why this file exists and what it deliberately does NOT need to declare).
 *
 * Every field below is transcribed from this theme's actual, currently-live
 * editor code — not invented or aspirational:
 *  - `templates` matches `AtelierCustomizePage.tsx`'s own `TemplateScope`
 *    union and `SCOPE_CONFIG` map exactly (including the `page` resourceType
 *    bucket reuse for search/cart/blog — see that file's doc comment).
 *  - `themeSettingsFields` matches every field `AtelierThemeSettingsPanel.tsx`
 *    actually renders a control for, in the same three groups, with the same
 *    select options — this theme deliberately exposes only the
 *    `StorefrontColors` fields its own render tree reads (documented on that
 *    panel), so this manifest reflects that real subset rather than the
 *    full schema.
 */
export const atelierThemeManifest: ThemeManifest = {
  id: 'theme-01-atelier',
  name: 'Atelier',
  supportsAnnouncementBar: true,

  templates: [
    { id: 'home', label: 'Home', showChrome: true, resource: { kind: 'store-page' } },
    { id: 'product', label: 'Product', showChrome: false, resource: { kind: 'collection-template', resourceType: 'product', templateKey: 'default', allowAltTemplates: true } },
    { id: 'collection', label: 'Collection', showChrome: false, resource: { kind: 'collection-template', resourceType: 'collection', templateKey: 'default', allowAltTemplates: true } },
    { id: 'search', label: 'Search', showChrome: false, resource: { kind: 'collection-template', resourceType: 'page', templateKey: 'search', allowAltTemplates: false } },
    { id: 'cart', label: 'Cart', showChrome: false, resource: { kind: 'collection-template', resourceType: 'page', templateKey: 'cart', allowAltTemplates: false } },
    { id: 'blogIndex', label: 'Blog (Journal) Index', showChrome: false, resource: { kind: 'collection-template', resourceType: 'page', templateKey: 'blog-index', allowAltTemplates: false } },
    { id: 'blogArticle', label: 'Blog Article', showChrome: false, resource: { kind: 'collection-template', resourceType: 'page', templateKey: 'blog-article', allowAltTemplates: false } },
  ],

  themeSettingsFields: [
    { key: 'bgColor', label: 'Background', group: 'Colors', control: { kind: 'color' } },
    { key: 'textColor', label: 'Text', group: 'Colors', control: { kind: 'color' } },
    { key: 'primaryColor', label: 'Accent', group: 'Colors', control: { kind: 'color' } },

    {
      key: 'font', label: 'Body & UI Font', group: 'Typography',
      control: { kind: 'select', options: ['Inter', 'Poppins', 'Roboto', 'Montserrat', 'Playfair Display', 'Fraunces', 'DM Sans', 'Nunito', 'Space Grotesk'].map(f => ({ value: f, label: f })) },
      helpText: "Headline typeface (Fraunces) is part of Atelier's signature look and stays fixed.",
    },

    {
      key: 'buttonStyle', label: 'Style', group: 'Buttons',
      control: { kind: 'select', options: [{ value: 'solid', label: 'Solid' }, { value: 'outline', label: 'Outline' }, { value: 'soft', label: 'Soft (accent fill)' }] },
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

registerThemeManifest(atelierThemeManifest);
