import { registerThemeManifest, type ThemeManifest, type ThemeSettingsFieldDef, type ThemeStylePreset } from '../themeManifest';
import { fashionThemeManifest } from '../theme-03-fashion/theme.manifest';
import type { StorefrontColors } from '@/api/services/storeTheme';

const SHOW_HIDE = [{ value: 'show', label: 'Show' }, { value: 'hide', label: 'Hide' }];

/** Every Tech setting at its out-of-the-box value (matches `theme.config.ts`). Colour values come from the design frames. */
const DEFAULTS: Partial<StorefrontColors> = {
  ...fashionThemeManifest.defaultSettings,
  bgColor: '#FFFFFF', textColor: '#020203', primaryColor: '#0156FF', mutedColor: null, borderColor: null, saleColor: null, starColor: null, successColor: null,
  font: 'Poppins', headingFont: null, headingWeight: 'semibold', buttonStyle: 'solid', buttonRadius: 'full', inputRadius: 'small',
  sectionRadius: 'none', imageRadius: 'none', productCardRadius: 'none', cardTag: 'hide', cardStyle: 'flat', cardHover: 'shadow', productImageRatio: 'square',
};

const STYLES: ThemeStylePreset[] = [
  { id: 'light', name: 'Light', description: 'White pages, bright blue buttons and a soft blue panel colour.', settings: { ...DEFAULTS } },
  { id: 'midnight', name: 'Midnight', description: 'Dark navy pages with light text and a sky-blue accent.',
    settings: { ...DEFAULTS, bgColor: '#0B1020', textColor: '#F5F7FF', primaryColor: '#3B82F6', saleColor: '#F87171', borderColor: '#2A3350', cardStyle: 'outlined' } },
  { id: 'graphite', name: 'Graphite', description: 'Neutral white and charcoal with an orange accent.',
    settings: { ...DEFAULTS, bgColor: '#FFFFFF', textColor: '#18181B', primaryColor: '#F97316', buttonRadius: 'small', cardStyle: 'outlined' } },
  { id: 'neon', name: 'Neon', description: 'Near-black pages with a bright cyan accent, for gaming and PC hardware.',
    settings: { ...DEFAULTS, bgColor: '#05060A', textColor: '#E6FBFF', primaryColor: '#22D3EE', saleColor: '#FB7185', borderColor: '#1E293B', buttonRadius: 'small', cardStyle: 'outlined' } },
];

const SECTION_HEADING = { key: 'heading', kind: 'text', label: 'Heading', maxLength: 120 } as const;

// Settings the shared panel lists but Tech does not read (Maison's mega-menu columns, pill hover styles...) are dropped; Tech's own are added.
const DROPPED = new Set(['custom.megaFeatured', 'custom.megaColumns', 'custom.megaHeading', 'custom.megaPhoto', 'cardViewLink', 'colorSwatches', 'quickView', 'productImageHover']);
const inherited = fashionThemeManifest.themeSettingsFields.filter(f => !DROPPED.has(f.key));
const techFields: ThemeSettingsFieldDef[] = [
  { key: 'custom.techDarkColor', label: 'Dark band colour', group: 'Colors', control: { kind: 'color', optional: { fallback: '#020203' } }, helpText: 'The top bar, the footer and the dark feature bands. Auto uses near-black.' },
  { key: 'custom.techTopBar', label: 'Top bar', group: 'Layout & Spacing', control: { kind: 'select', options: SHOW_HIDE }, helpText: 'The slim strip above the header. It shows the text, phone and email you set in the Header settings.' },
  { key: 'custom.techStickyHeader', label: 'Header stays on top', group: 'Layout & Spacing', control: { kind: 'select', options: [{ value: 'on', label: 'Yes (default)' }, { value: 'off', label: 'No' }] }, helpText: 'Keeps the header visible while shoppers scroll.' },
  { key: 'custom.techCardStyle', label: 'Tech card style', group: 'Product cards', control: { kind: 'select', options: [{ value: 'flat', label: 'Flat' }, { value: 'outlined', label: 'Border' }, { value: 'shadow', label: 'Shadow on hover' }] }, helpText: 'How product cards are framed in grids and rows.' },
  { key: 'custom.techMegaFeatured', label: 'Featured photo', group: 'Mega menu', control: { kind: 'select', options: SHOW_HIDE }, helpText: "Shows the menu item's own photo beside its mega menu." },
];

export const techThemeManifest: ThemeManifest = {
  id: 'theme-04-tech',
  name: 'Tech Store',
  supportsAnnouncementBar: true,
  supportedHeaderOptions: ['searchBar', 'sticky', 'button', 'topBar', 'colours', 'menuStyle'],
  supportedFooterOptions: ['spacing', 'newsletterTop', 'mobileAccordion', 'colours', 'headings', 'socialStyle', 'socialColour', 'socialSize', 'policyLinks', 'currency', 'logo', 'defaultColumns'],
  defaultSettings: DEFAULTS,
  styles: STYLES,

  // Sections only Tech has: stored as theme_section, rendered by sections/techSections.tsx. Nothing here is real data: the seller types or uploads every value.
  customSections: [
    {
      key: 'tech.category_tiles', label: 'Category tiles', color: '#0156FF',
      description: 'A row of photo tiles, each linking to a category, collection or page.',
      fields: [SECTION_HEADING],
      defaults: { heading: 'Shop by category' },
      block: { key: 'tile', label: 'Tile', fields: [
        { key: 'imageUrl', kind: 'image', label: 'Photo' },
        { key: 'title', kind: 'text', label: 'Name', required: true, maxLength: 60 },
        { key: 'link', kind: 'link', label: 'Link' },
      ] },
      initialBlocks: 6,
    },
    {
      key: 'tech.deal_banner', label: 'Deal banner', color: '#DC2626',
      description: 'A dark promo band with a headline, text, button and an optional end date for a countdown.',
      fields: [
        SECTION_HEADING,
        { key: 'text', kind: 'textarea', label: 'Text', rows: 3, maxLength: 400 },
        { key: 'imageUrl', kind: 'image', label: 'Photo' },
        { key: 'endsAt', kind: 'text', label: 'Deal ends on', maxLength: 30, hint: 'Optional. Type a date like 2026-12-31. A countdown shows until then and disappears afterwards.' },
        { key: 'buttonLabel', kind: 'text', label: 'Button text', maxLength: 40 },
        { key: 'buttonLink', kind: 'link', label: 'Button link' },
      ],
      defaults: { heading: 'This week only' },
    },
    {
      key: 'tech.brand_strip', label: 'Brand strip', color: '#334155',
      description: 'A row of brand logos you upload (they turn colour on hover).',
      fields: [SECTION_HEADING],
      block: { key: 'brand', label: 'Brand', fields: [
        { key: 'imageUrl', kind: 'image', label: 'Logo', required: true },
        { key: 'title', kind: 'text', label: 'Brand name', maxLength: 60 },
        { key: 'link', kind: 'link', label: 'Link (optional)' },
      ] },
      initialBlocks: 5,
    },
    {
      key: 'tech.feature_strip', label: 'Feature strip', color: '#0F766E',
      description: 'Three or more short promises (support, warranty, savings) on a soft blue band.',
      fields: [],
      block: { key: 'item', label: 'Feature', fields: [
        { key: 'imageUrl', kind: 'image', label: 'Icon or photo (optional)' },
        { key: 'title', kind: 'text', label: 'Title', required: true, maxLength: 50 },
        { key: 'text', kind: 'text', label: 'Short line', maxLength: 140 },
      ] },
      initialBlocks: 3,
      presets: [
        { id: 'three', name: 'Three promises', description: 'Support, account and savings.', blocks: [{ title: 'Product support' }, { title: 'Personal account' }, { title: 'Amazing savings' }] },
      ],
    },
    {
      key: 'tech.spec_highlights', label: 'Spec highlights', color: '#7C3AED',
      description: 'Big numbers on a dark band, such as battery hours or storage. You type every value.',
      fields: [SECTION_HEADING, { key: 'intro', kind: 'textarea', label: 'Intro', rows: 2, maxLength: 300 }],
      defaults: { heading: 'Built for performance' },
      block: { key: 'spec', label: 'Highlight', fields: [
        { key: 'value', kind: 'text', label: 'Big value', required: true, maxLength: 20, hint: 'For example 16GB, 1TB or 12h' },
        { key: 'title', kind: 'text', label: 'Label', maxLength: 50 },
        { key: 'text', kind: 'text', label: 'Detail', maxLength: 120 },
      ] },
      initialBlocks: 4,
    },
    {
      key: 'tech.comparison_table', label: 'Comparison table', color: '#0891B2',
      description: 'A table that compares models. One row per line, columns split with |.',
      fields: [
        SECTION_HEADING,
        { key: 'rows', kind: 'textarea', label: 'Table', rows: 8, maxLength: 3000, hint: 'First line is the header, e.g. Feature | Model A | Model B. Then one row per line.' },
        { key: 'note', kind: 'text', label: 'Note under the table', maxLength: 200 },
      ],
      defaults: { heading: 'Compare models', rows: ['Feature | Model A | Model B', 'Processor | | ', 'Memory | | ', 'Storage | | '].join(String.fromCharCode(10)) },
    },
  ],

  templates: fashionThemeManifest.templates,
  themeSettingsFields: [...inherited, ...techFields],
};

registerThemeManifest(techThemeManifest);
