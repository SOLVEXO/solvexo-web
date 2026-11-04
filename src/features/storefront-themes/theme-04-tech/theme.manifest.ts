import { registerThemeManifest, type ThemeManifest, type ThemeSettingsFieldDef, type ThemeStylePreset } from '../themeManifest';
import { baseManifest } from './manifestBase';
import type { StorefrontColors } from '@/api/services/storeTheme';

const SHOW_HIDE = [{ value: 'show', label: 'Show' }, { value: 'hide', label: 'Hide' }];

/** Every Tech setting at its out-of-the-box value (matches `theme.config.ts`). Colour values come from the design frames. */
const DEFAULTS: Partial<StorefrontColors> = {
  ...baseManifest.defaultSettings,
  bgColor: '#FFFFFF', textColor: '#020203', primaryColor: '#0156FF', mutedColor: null, borderColor: null, saleColor: null, starColor: null, successColor: null,
  font: 'Poppins', headingFont: null, headingWeight: 'semibold', buttonStyle: 'solid',
  cardTag: 'hide', cardStyle: 'flat', cardHover: 'shadow', productImageRatio: 'square',
};

const STYLES: ThemeStylePreset[] = [
  { id: 'light', name: 'Light Tech', description: 'White pages, bright blue pill buttons, soft blue panels (the design).',
    settings: { ...DEFAULTS, bgColor: '#FFFFFF', textColor: '#020203', primaryColor: '#0156FF', themeSettings: { techShape: 'tech', techCardStyle: 'flat', techDarkColor: '#020203' } } },
  { id: 'midnight', name: 'Midnight', description: 'Dark navy pages with light text and a sky-blue accent.',
    settings: { ...DEFAULTS, bgColor: '#0B1020', textColor: '#F5F7FF', primaryColor: '#3B82F6', saleColor: '#F87171', borderColor: '#2A3350', cardStyle: 'outlined', themeSettings: { techShape: 'tech', techCardStyle: 'outlined', techDarkColor: '#060912' } } },
  { id: 'graphite', name: 'Graphite', description: 'Neutral white and charcoal with an orange accent and rounded corners.',
    settings: { ...DEFAULTS, bgColor: '#FFFFFF', textColor: '#18181B', primaryColor: '#F97316', cardStyle: 'outlined', themeSettings: { techShape: 'rounded', techCardStyle: 'outlined', techDarkColor: '#18181B' } } },
  { id: 'neon', name: 'Neon', description: 'Near-black pages with a bright cyan accent, for gaming and PC hardware.',
    settings: { ...DEFAULTS, bgColor: '#05060A', textColor: '#E6FBFF', primaryColor: '#22D3EE', saleColor: '#FB7185', borderColor: '#1E293B', cardStyle: 'outlined', themeSettings: { techShape: 'square', techCardStyle: 'outlined', techDarkColor: '#000000' } } },
  { id: 'minimal', name: 'Minimal', description: 'Black and white, square corners, no frames: quiet and fast.',
    settings: { ...DEFAULTS, bgColor: '#FFFFFF', textColor: '#111111', primaryColor: '#111111', headingWeight: 'medium', cardStyle: 'flat', themeSettings: { techShape: 'square', techCardStyle: 'flat', techDarkColor: '#111111' } } },
  { id: 'bold', name: 'Bold', description: 'High contrast, heavy uppercase headings and a punchy red accent.',
    settings: { ...DEFAULTS, bgColor: '#FFFFFF', textColor: '#0A0A0A', primaryColor: '#E11D48', saleColor: '#E11D48', font: 'Montserrat', headingFont: 'Montserrat', headingWeight: 'bold', headingCase: 'uppercase', headingTracking: 'tight', buttonCase: 'uppercase', buttonSize: 'lg', cardStyle: 'outlined', themeSettings: { techShape: 'square', techCardStyle: 'outlined', techDarkColor: '#0A0A0A' } } },
  { id: 'ocean', name: 'Ocean', description: 'Light pages with a teal accent and soft pill shapes.',
    settings: { ...DEFAULTS, bgColor: '#FFFFFF', textColor: '#0F172A', primaryColor: '#0E7490', cardStyle: 'flat', themeSettings: { techShape: 'pill', techCardStyle: 'shadow', techDarkColor: '#0B2530' } } },
  { id: 'sunset', name: 'Sunset', description: 'Warm cream pages, a deep orange accent and generous rounding.',
    settings: { ...DEFAULTS, bgColor: '#FFF8F1', textColor: '#2B1B12', primaryColor: '#C2410C', saleColor: '#B91C1C', font: 'Nunito', headingFont: 'Fraunces', cardStyle: 'flat', themeSettings: { techShape: 'rounded', techCardStyle: 'shadow', techDarkColor: '#2B1B12' } } },
];
const SECTION_HEADING = { key: 'heading', kind: 'text', label: 'Heading', maxLength: 120 } as const;

// Settings the shared panel lists but Tech does not read (Maison's mega-menu columns, pill hover styles...) are dropped; Tech's own are added.
const DROPPED = new Set(['buttonRadius', 'inputRadius', 'productCardRadius', 'imageRadius', 'sectionRadius', 'custom.megaFeatured', 'custom.megaColumns', 'custom.megaHeading', 'custom.megaPhoto', 'cardViewLink', 'colorSwatches', 'quickView', 'productImageHover']);
const inherited = baseManifest.themeSettingsFields.filter(f => !DROPPED.has(f.key));
const techFields: ThemeSettingsFieldDef[] = [
  { key: 'custom.techFilterLayout', label: 'Filters on product lists', group: 'Layout & Spacing', control: { kind: 'select', options: [{ value: 'sidebar', label: 'Sidebar (default)' }, { value: 'drawer', label: 'Slide-in panel only' }] }, helpText: 'A filter sidebar beside the products, or just a Filter button that opens a panel. Phones always use the panel.' },
  { key: 'custom.techProductTabs', label: 'Description sections', group: 'Product page', control: { kind: 'select', options: [{ value: 'tabs', label: 'Tabs (default)' }, { value: 'accordion', label: 'Open and close sections' }] }, helpText: 'How the description, specs and extra product tabs are shown when there is more than one.' },
  { key: 'custom.techCartUpsell', label: 'Suggestions in the mini cart', group: 'Cart', control: { kind: 'select', options: [{ value: 'show', label: 'Show (default)' }, { value: 'hide', label: 'Hide' }] }, helpText: 'Shows up to two of your best-selling products that are not in the cart yet, with an Add button.' },
  { key: 'custom.techGallery', label: 'Product thumbnails', group: 'Product page', control: { kind: 'select', options: [{ value: 'bottom', label: 'Below the photo (default)' }, { value: 'left', label: 'In a column beside the photo' }] }, helpText: 'Where the small product photos sit on large screens.' },
  { key: 'custom.techCheckoutSummary', label: 'Order summary position', group: 'Layout & Spacing', control: { kind: 'select', options: [{ value: 'right', label: 'Right of the steps (default)' }, { value: 'left', label: 'Left of the steps' }] }, helpText: 'Where the order summary sits at checkout on large screens. Only the position changes.' },
  { key: 'custom.techCompare', label: 'Compare products', group: 'Product cards', control: { kind: 'select', options: [{ value: 'show', label: 'Show (default)' }, { value: 'hide', label: 'Hide' }] }, helpText: 'A compare button on product cards. Shoppers can compare up to four products; only fields your products really have are listed.' },
  { key: 'custom.techHeader', label: 'Header layout', group: 'Layout & Spacing', control: { kind: 'select', options: [{ value: 'standard', label: 'Standard (logo, menu, icons)' }, { value: 'compact', label: 'Compact (slimmer)' }, { value: 'centered', label: 'Centered logo, menu below' }, { value: 'search-first', label: 'Search first (wide search bar)' }] }, helpText: 'How the header is arranged on large screens. Phones always get the menu button and search icon.' },
  { key: 'custom.techTopHours', label: 'Top bar: opening hours', group: 'Layout & Spacing', control: { kind: 'text', maxLength: 80, placeholder: 'Mon-Fri 9:00 AM - 5:30 PM' }, helpText: 'Shown at the left of the top bar on larger screens. Leave empty to hide it. Nothing is made up.' },
  { key: 'custom.techTopShowroom', label: 'Top bar: showroom line', group: 'Layout & Spacing', control: { kind: 'text', maxLength: 80, placeholder: 'Visit our showroom at ...' }, helpText: 'Added after the top bar text in the middle. Leave empty to hide it.' },
  { key: 'custom.techFooterColumns', label: 'Footer columns', group: 'Layout & Spacing', control: { kind: 'select', options: [{ value: 'auto', label: 'As many as fit (default)' }, { value: '2', label: '2 columns' }, { value: '3', label: '3 columns' }, { value: '4', label: '4 columns' }] }, helpText: 'How many columns the footer links are laid out in on large screens. Phones always show 1 or 2.' },
  { key: 'custom.techFooterTone', label: 'Footer colours', group: 'Colors', control: { kind: 'select', options: [{ value: 'dark', label: 'Dark band (default)' }, { value: 'light', label: 'Light (soft panel colour)' }] }, helpText: 'A dark footer band or a light one. Footer colours you set in Header & Footer win over this.' },
  { key: 'custom.techShape', label: 'Shape', group: 'Buttons', control: { kind: 'select', options: [{ value: 'tech', label: 'Tech (pill buttons, square-ish fields)' }, { value: 'pill', label: 'Pill (soft, rounded everywhere)' }, { value: 'rounded', label: 'Rounded' }, { value: 'square', label: 'Square' }] }, helpText: 'The corners of buttons, form fields, product cards, images and badges, all together.' },
  { key: 'custom.techWarning', label: 'Low-stock & notice colour', group: 'Colors', control: { kind: 'color', optional: { fallback: '#B45309' } }, helpText: 'Only N left, pre-order and similar heads-up text. Errors use the Sale & alert colour.' },
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
      key: 'tech.hero', label: 'Hero slider', color: '#0156FF',
      description: 'A dark split banner: text on one side, a product photo on the other, with arrows, dots and optional autoplay.',
      fields: [
        { key: 'heading', kind: 'text', label: 'Section name (screen readers)', maxLength: 80 },
        { key: 'height', kind: 'select', label: 'Height', options: [{ value: 'compact', label: 'Compact' }, { value: 'standard', label: 'Standard' }, { value: 'tall', label: 'Tall' }] },
        { key: 'autoplay', kind: 'checkbox', label: 'Change slides automatically', defaultOff: true, hint: 'Stops when the visitor prefers reduced motion.' },
      ],
      defaults: { height: 'standard' },
      block: { key: 'slide', label: 'Slide', fields: [
        { key: 'imageUrl', kind: 'image', label: 'Product photo' },
        { key: 'imageAlt', kind: 'text', label: 'Photo description', maxLength: 120 },
        { key: 'eyebrow', kind: 'text', label: 'Small label', maxLength: 40 },
        { key: 'heading', kind: 'text', label: 'Headline', required: true, maxLength: 90 },
        { key: 'text', kind: 'textarea', label: 'Text', rows: 3, maxLength: 240 },
        { key: 'buttonLabel', kind: 'text', label: 'Button text', maxLength: 30 },
        { key: 'link', kind: 'link', label: 'Button link' },
      ] },
      initialBlocks: 1,
      presets: [
        { id: 'single', name: 'Single banner', description: 'One big offer.', settings: { height: 'standard' }, blocks: [{ eyebrow: 'New arrival', heading: 'Your headline goes here', text: 'A short line about the product or offer.', buttonLabel: 'Shop now' }] },
        { id: 'launch', name: 'Three-slide launch', description: 'Three slides with autoplay.', settings: { height: 'tall', autoplay: true }, blocks: [{ eyebrow: 'New', heading: 'First slide', buttonLabel: 'Shop now' }, { eyebrow: 'Best seller', heading: 'Second slide', buttonLabel: 'See more' }, { eyebrow: 'On sale', heading: 'Third slide', buttonLabel: 'View deals' }] },
      ],
    },
    {
      key: 'tech.bento_grid', label: 'Bento banner grid', color: '#7C3AED',
      description: 'Photo tiles of different sizes (wide, tall, large) in one tidy grid.',
      fields: [SECTION_HEADING],
      block: { key: 'tile', label: 'Tile', fields: [
        { key: 'imageUrl', kind: 'image', label: 'Photo' },
        { key: 'title', kind: 'text', label: 'Title', maxLength: 60 },
        { key: 'text', kind: 'text', label: 'Short line', maxLength: 120 },
        { key: 'size', kind: 'select', label: 'Size', options: [{ value: 'normal', label: 'Normal' }, { value: 'wide', label: 'Wide' }, { value: 'tall', label: 'Tall' }, { value: 'large', label: 'Large' }] },
        { key: 'link', kind: 'link', label: 'Link' },
      ] },
      initialBlocks: 4,
      presets: [
        { id: 'four', name: 'Four tiles', description: 'One large tile and three normal ones.', blocks: [{ title: 'Featured', size: 'large' }, { title: 'Tile two' }, { title: 'Tile three' }, { title: 'Tile four', size: 'wide' }] },
        { id: 'six', name: 'Six tiles', description: 'A busier grid for many categories.', blocks: [{ title: 'Laptops', size: 'wide' }, { title: 'Desktops', size: 'tall' }, { title: 'Monitors' }, { title: 'Accessories' }, { title: 'Networking' }, { title: 'Components', size: 'wide' }] },
      ],
    },
    {
      key: 'tech.image_grid', label: 'Image grid', color: '#DB2777',
      description: 'An Instagram-style grid of photos you choose, with optional captions and links. It is not a live feed.',
      fields: [SECTION_HEADING, { key: 'columns', kind: 'select', label: 'Columns on desktop', numeric: true, options: [{ value: '3', label: '3' }, { value: '4', label: '4' }, { value: '5', label: '5' }, { value: '6', label: '6' }] }],
      defaults: { heading: 'Follow us for news and offers', columns: 6 },
      block: { key: 'photo', label: 'Photo', fields: [
        { key: 'imageUrl', kind: 'image', label: 'Photo', required: true },
        { key: 'caption', kind: 'text', label: 'Caption', maxLength: 140 },
        { key: 'link', kind: 'link', label: 'Link (optional)' },
      ] },
      initialBlocks: 6,
      presets: [
        { id: 'six', name: 'Six photos', description: 'One row of six.', settings: { columns: 6 }, blocks: Array.from({ length: 6 }, () => ({})) },
        { id: 'twelve', name: 'Twelve photos', description: 'Two rows of six.', settings: { columns: 6 }, blocks: Array.from({ length: 12 }, () => ({})) },
      ],
    },
    {
      key: 'tech.showroom', label: 'Showroom card', color: '#B45309',
      description: 'Address, opening hours, phone and email on one card. Every line is typed by you; empty lines are not shown.',
      fields: [
        { key: 'heading', kind: 'text', label: 'Heading', maxLength: 80 },
        { key: 'address', kind: 'textarea', label: 'Address', rows: 3, maxLength: 240 },
        { key: 'hours', kind: 'textarea', label: 'Opening hours', rows: 4, maxLength: 300, hint: 'One line per day or range.' },
        { key: 'phone', kind: 'text', label: 'Phone', maxLength: 40 },
        { key: 'email', kind: 'text', label: 'Email', maxLength: 120 },
        { key: 'mapLink', kind: 'url', label: 'Map link (https)' },
        { key: 'note', kind: 'text', label: 'Short note', maxLength: 160 },
      ],
      defaults: { heading: 'Visit our showroom' },
      presets: [{ id: 'card', name: 'Showroom card', description: 'Heading with address, hours and contact.', settings: { heading: 'Visit our showroom' } }],
    },
    {
      key: 'tech.featured_tabs', label: 'Products with tabs', color: '#0F766E',
      description: 'A product row with one tab per collection you choose (a tab with no collection shows the newest products).',
      fields: [SECTION_HEADING, { key: 'limit', kind: 'number', label: 'Products per tab', min: 2, max: 10 }],
      defaults: { heading: 'Our products', limit: 5 },
      block: { key: 'tab', label: 'Tab', fields: [
        { key: 'label', kind: 'text', label: 'Tab name', required: true, maxLength: 30 },
        { key: 'collectionId', kind: 'collectionPicker', label: 'Collection' },
      ] },
      initialBlocks: 3,
      presets: [
        { id: 'three', name: 'Three tabs', description: 'New, best sellers and on sale.', blocks: [{ label: 'New' }, { label: 'Best sellers' }, { label: 'On sale' }] },
        { id: 'five', name: 'Five tabs', description: 'One tab per product family.', settings: { limit: 5 }, blocks: [{ label: 'Laptops' }, { label: 'Desktops' }, { label: 'Monitors' }, { label: 'Parts' }, { label: 'Accessories' }] },
      ],
    },
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
      presets: [{ id: 'six', name: 'Six categories', description: 'A row of six category tiles.', blocks: [{ title: 'Laptops' }, { title: 'Desktops' }, { title: 'Monitors' }, { title: 'Accessories' }, { title: 'Networking' }, { title: 'Components' }] }],
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
      presets: [{ id: 'weekly', name: 'Weekly deal', description: 'A dark band with a headline and button.', settings: { heading: 'This week only', text: 'A short line about your best offer.', buttonLabel: 'Shop now' } }],
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
      presets: [{ id: 'six', name: 'Six brands', description: 'A row of six logos.', blocks: Array.from({ length: 6 }, (_, i) => ({ title: 'Brand ' + (i + 1) })) }],
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
      presets: [{ id: 'four', name: 'Four highlights', description: 'Four big numbers.', blocks: [{ value: '16GB', title: 'Memory' }, { value: '1TB', title: 'Storage' }, { value: '3 yrs', title: 'Warranty' }, { value: '24/7', title: 'Support' }] }],
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
      presets: [{ id: 'two', name: 'Two models', description: 'A feature table for two models.', settings: { heading: 'Compare models', rows: ['Feature | Model A | Model B', 'Processor | | ', 'Memory | | ', 'Storage | | ', 'Warranty | | '].join(String.fromCharCode(10)) } }],
    },
  ],

  templates: baseManifest.templates,
  themeSettingsFields: [...inherited, ...techFields],
};

registerThemeManifest(techThemeManifest);
