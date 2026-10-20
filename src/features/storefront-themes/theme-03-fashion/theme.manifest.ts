import { registerThemeManifest, type ThemeManifest, type ThemeStylePreset } from '../themeManifest';
import type { StorefrontColors } from '@/api/services/storeTheme';

const RADIUS = [{ value: 'none', label: 'Square' }, { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }, { value: 'full', label: 'Pill' }];
const SHOW_HIDE = [{ value: 'show', label: 'Show' }, { value: 'hide', label: 'Hide' }];
const fonts = (list: string[]) => list.map(f => ({ value: f, label: f }));

/** Every Maison setting at its out-of-the-box value (matches `theme.config.ts`'s defaults). */
const DEFAULTS: Partial<StorefrontColors> = {
  bgColor: '#FFFFFF', textColor: '#09090B', primaryColor: '#09090B', mutedColor: null, borderColor: null, saleColor: null,
  font: 'Inter', headingFont: null, headingWeight: 'medium', headingCase: 'none', headingTracking: 'auto',
  buttonStyle: 'solid', buttonRadius: 'full', buttonWidth: 'auto', buttonCase: 'normal', inputRadius: 'medium',
  sectionSpacing: 'comfortable', containerWidth: 'standard', sectionRadius: 'large',
  imageRadius: 'large', productCardRadius: 'large', productImageRatio: 'square', productImageHover: 'zoom',
  saleBadge: 'show', quickView: 'show', colorSwatches: 'show', soldOutBadge: 'show', cardStyle: 'theme',
  cardRating: 'show', cardTag: 'show', cardButton: 'show', badgeStyle: 'pill', cartType: 'drawer',
  headingScale: 'medium', headingLineHeight: 'auto', headingColor: null, bodyScale: 'medium', linkUnderline: 'auto', linkColor: null, buttonTextColor: null, priceColor: null, starColor: null, successColor: null, cardBgColor: null,
  buttonSize: 'md', buttonHover: 'fade', buttonShadow: 'none', pagePadding: 'standard', gridGap: 'standard', cardHover: 'shadow', cardTextAlign: 'left',
  showBreadcrumbs: 'show', showVendor: 'show', showStockStatus: 'show', showReviews: 'show', stickyBuyBar: 'show', animations: 'on', focusRing: 'auto',
  bodyWeight: 'regular', sectionDividers: 'none', selection: 'auto', cardWishlist: 'show', cardViewLink: 'show', saleBadgeText: 'percent', showDelivery: 'show',
};

const STYLES: ThemeStylePreset[] = [
  { id: 'classic', name: 'Classic', description: 'Clean white, soft rounded shapes, pill buttons.', settings: { ...DEFAULTS } },
  { id: 'noir', name: 'Noir', description: 'Dark and luxurious: serif headings in capitals, sharp edges.',
    settings: { ...DEFAULTS, bgColor: '#0B0B0C', textColor: '#F4F4F5', primaryColor: '#F4F4F5', saleColor: '#F87171', headingFont: 'Playfair Display', headingWeight: 'regular', headingCase: 'uppercase', headingTracking: 'wide', buttonRadius: 'small', inputRadius: 'small', sectionRadius: 'small', imageRadius: 'small', productCardRadius: 'small', cardStyle: 'outlined', badgeStyle: 'square', productImageRatio: 'portrait', cardHover: 'lift', buttonHover: 'lift', selection: 'accent', sectionDividers: 'line', linkUnderline: 'always', focusRing: 'accent' } },
  { id: 'editorial', name: 'Editorial', description: 'Warm paper tones, serif headings, square magazine look.',
    settings: { ...DEFAULTS, bgColor: '#FAF7F2', textColor: '#1C1917', primaryColor: '#1C1917', font: 'DM Sans', headingFont: 'Fraunces', headingWeight: 'regular', buttonStyle: 'outline', buttonRadius: 'none', inputRadius: 'none', sectionRadius: 'none', imageRadius: 'none', productCardRadius: 'none', cardStyle: 'flat', productImageRatio: 'portrait', productImageHover: 'second-image', badgeStyle: 'square', cardButton: 'hide', sectionSpacing: 'spacious', cardTextAlign: 'center', cardHover: 'none', bodyScale: 'large', gridGap: 'airy', buttonSize: 'lg', headingLineHeight: 'tight', sectionDividers: 'line' } },
  { id: 'soft', name: 'Soft', description: 'Gentle peach palette, friendly rounded type, airy spacing.',
    settings: { ...DEFAULTS, bgColor: '#FFF7F2', textColor: '#3D2B2B', primaryColor: '#E07A5F', font: 'Nunito', headingFont: 'Fraunces', headingWeight: 'semibold', buttonStyle: 'soft', cardStyle: 'elevated', sectionSpacing: 'spacious', saleColor: '#C2410C', buttonShadow: 'soft', cardHover: 'lift', headingScale: 'large', cardTextAlign: 'center', gridGap: 'airy', saleBadgeText: 'label', cardViewLink: 'hide' } },
  { id: 'bold', name: 'Bold', description: 'High contrast, heavy uppercase headings, punchy red accent.',
    settings: { ...DEFAULTS, bgColor: '#FFFFFF', textColor: '#111111', primaryColor: '#E11D48', saleColor: '#E11D48', font: 'Space Grotesk', headingFont: 'Space Grotesk', headingWeight: 'bold', headingCase: 'uppercase', headingTracking: 'tight', buttonRadius: 'small', buttonCase: 'uppercase', inputRadius: 'small', sectionRadius: 'small', imageRadius: 'small', productCardRadius: 'small', cardStyle: 'outlined', badgeStyle: 'square', sectionSpacing: 'compact', containerWidth: 'wide', headingScale: 'xlarge', buttonSize: 'lg', buttonHover: 'grow', headingLineHeight: 'tight', bodyWeight: 'medium', cardWishlist: 'hide', animations: 'off' } },
];

/** Maison (fashion): the scopes the seller can edit in Customize and the theme settings this theme actually reads. */
export const fashionThemeManifest: ThemeManifest = {
  id: 'theme-03-fashion',
  name: 'Maison',
  supportsAnnouncementBar: true,
  headerOptionChoices: {
    searchPosition: [
      { value: 'icons', label: 'Next to the icons' },
      { value: 'row', label: 'In the logo row, between the logo and the icons', hint: 'The menu moves to its own row below. Needs the logo on the left; otherwise the box shows on its own row.' },
      { value: 'center', label: 'Centered, on its own row' },
    ],
  },
  supportedHeaderOptions: ['logoPosition', 'menuPosition', 'menuAlignment', 'searchBar', 'searchPosition', 'sticky', 'transparent', 'menuStyle', 'button', 'topBar', 'colours'],
  defaultSettings: DEFAULTS,
  styles: STYLES,

  // Sections only Maison has: stored as theme_section, rendered by sections/ThemeSections.tsx.
  customSections: [
    {
      key: 'maison.lookbook', label: 'Lookbook', color: '#BE185D',
      description: 'Editorial photo grid of looks or outfits, each with a title, caption and optional link.',
      fields: [
        { key: 'heading', kind: 'text', label: 'Heading', maxLength: 120 },
        { key: 'eyebrow', kind: 'text', label: 'Small label above the heading', maxLength: 60 },
        { key: 'intro', kind: 'textarea', label: 'Intro text', rows: 3, maxLength: 600 },
        { key: 'columns', kind: 'select', label: 'Columns on desktop', numeric: true, options: [{ value: '2', label: '2' }, { value: '3', label: '3' }] },
        { key: 'imageRatio', kind: 'select', label: 'Image ratio', options: [{ value: 'default', label: 'Portrait (default)' }, { value: 'square', label: 'Square' }, { value: 'landscape', label: 'Landscape' }, { value: 'adapt', label: 'Adapt to image' }] },
      ],
      defaults: { heading: 'The lookbook', columns: 3 },
      block: {
        key: 'look', label: 'Look',
        fields: [
          { key: 'imageUrl', kind: 'image', label: 'Photo', required: true },
          { key: 'title', kind: 'text', label: 'Title', maxLength: 80 },
          { key: 'caption', kind: 'text', label: 'Caption', maxLength: 160 },
          { key: 'link', kind: 'link', label: 'Link (optional)' },
        ],
      },
      initialBlocks: 3,
      presets: [
        { id: 'two-up', name: 'Two-up editorial', description: 'Two large looks side by side, for a campaign or a seasonal edit.', settings: { heading: 'The edit', columns: 2 }, blocks: [{ title: 'Look 1' }, { title: 'Look 2' }] },
        { id: 'six-grid', name: 'Six-look grid', description: 'Three columns of six looks: a full lookbook page.', settings: { heading: 'Lookbook', columns: 3 }, blocks: Array.from({ length: 6 }, (_, i) => ({ title: `Look ${i + 1}` })) },
      ],
    },
    {
      key: 'maison.size_guide', label: 'Size guide', color: '#0F766E',
      description: 'A size chart table with a cm / inch switch. One size per line, columns split with |.',
      fields: [
        { key: 'heading', kind: 'text', label: 'Heading', maxLength: 120 },
        { key: 'rows', kind: 'textarea', label: 'Size table', rows: 8, maxLength: 3000, hint: 'First line is the header, e.g. Size | Chest | Waist | Hips. Then one size per line.' },
        { key: 'defaultUnit', kind: 'select', label: 'Start in', options: [{ value: 'cm', label: 'Centimetres' }, { value: 'in', label: 'Inches' }] },
        { key: 'showUnitToggle', kind: 'checkbox', label: 'Let shoppers switch cm / inch' },
        { key: 'note', kind: 'text', label: 'Note under the table', maxLength: 200 },
      ],
      presets: [
        { id: 'tops', name: 'Tops and dresses', description: 'Chest, waist and hips from XS to XL.', settings: { rows: ['Size | Chest | Waist | Hips', 'XS | 80 | 62 | 86', 'S | 86 | 70 | 92', 'M | 94 | 78 | 100', 'L | 102 | 86 | 108', 'XL | 110 | 94 | 116'].join(String.fromCharCode(10)) } },
        { id: 'bottoms', name: 'Trousers and jeans', description: 'Waist, hips and inseam by size.', settings: { heading: 'Trousers size guide', rows: ['Size | Waist | Hips | Inseam', '28 | 71 | 92 | 76', '30 | 76 | 97 | 78', '32 | 81 | 102 | 80', '34 | 86 | 107 | 81'].join(String.fromCharCode(10)) } },
      ],
      defaults: { heading: 'Size guide', defaultUnit: 'cm', showUnitToggle: true, rows: ['Size | Chest | Waist | Hips', 'S | 86 | 70 | 92', 'M | 94 | 78 | 100', 'L | 102 | 86 | 108'].join(String.fromCharCode(10)) },
    },
  ],

  templates: [
    { id: 'home', label: 'Home', group: 'home', showChrome: true, resource: { kind: 'store-page', pageType: 'home' } },
    { id: 'product', label: 'Product', group: 'products', showChrome: true, resource: { kind: 'collection-template', resourceType: 'product', templateKey: 'default', allowAltTemplates: true } },
    { id: 'collection', label: 'Collection', group: 'collections', showChrome: true, resource: { kind: 'collection-template', resourceType: 'collection', templateKey: 'default', allowAltTemplates: true } },
    { id: 'pages', label: 'Pages', group: 'pages', showChrome: true, resource: { kind: 'store-page', pageType: 'custom' } },
    { id: 'search', label: 'Search', group: 'search', showChrome: true, resource: { kind: 'collection-template', resourceType: 'page', templateKey: 'search', allowAltTemplates: false } },
    { id: 'cart', label: 'Cart', group: 'cart', showChrome: true, resource: { kind: 'collection-template', resourceType: 'page', templateKey: 'cart', allowAltTemplates: false } },
    { id: 'blogIndex', label: 'Blog index', group: 'blogs', showChrome: true, resource: { kind: 'collection-template', resourceType: 'page', templateKey: 'blog-index', allowAltTemplates: false, previewPicker: 'blog' } },
    { id: 'blogArticle', label: 'Blog article', group: 'articles', showChrome: true, resource: { kind: 'collection-template', resourceType: 'page', templateKey: 'blog-article', allowAltTemplates: false, previewPicker: 'article' } },
    { id: 'account', label: 'Customer account', group: 'other', showChrome: true, resource: { kind: 'collection-template', resourceType: 'page', templateKey: 'account', allowAltTemplates: false } },
    { id: 'notFound', label: '404 page', group: 'other', showChrome: true, resource: { kind: 'collection-template', resourceType: 'page', templateKey: 'not-found', allowAltTemplates: false } },
    { id: 'password', label: 'Password page', group: 'other', showChrome: false, resource: { kind: 'collection-template', resourceType: 'page', templateKey: 'password', allowAltTemplates: false } },
  ],

  themeSettingsFields: [
    { key: 'bgColor', label: 'Background', group: 'Colors', control: { kind: 'color' }, helpText: 'Page background colour.' },
    { key: 'textColor', label: 'Text', group: 'Colors', control: { kind: 'color' }, helpText: 'Main text and headings.' },
    { key: 'primaryColor', label: 'Buttons & accent', group: 'Colors', control: { kind: 'color' }, helpText: 'Buttons, links and accents.' },
    { key: 'mutedColor', label: 'Secondary text', group: 'Colors', control: { kind: 'color', optional: { fallback: '#71717A' } }, helpText: 'Descriptions, captions and hints. Auto picks a tone that suits your colours.' },
    { key: 'borderColor', label: 'Borders & dividers', group: 'Colors', control: { kind: 'color', optional: { fallback: '#E4E4E7' } }, helpText: 'Lines around cards and between sections. Auto picks a soft tone.' },
    { key: 'saleColor', label: 'Sale & alert', group: 'Colors', control: { kind: 'color', optional: { fallback: '#DC2626' } }, helpText: 'Sale prices, low-stock and error text.' },

    { key: 'font', label: 'Body & UI font', group: 'Typography', control: { kind: 'select', options: fonts(['Inter', 'Poppins', 'Roboto', 'Montserrat', 'DM Sans', 'Nunito', 'Space Grotesk', 'Playfair Display', 'Fraunces']) }, helpText: 'Sets body and interface text. Use Heading font for headlines.' },
    { key: 'headingFont', label: 'Heading font', group: 'Typography', control: { kind: 'select', options: [{ value: '', label: 'Theme default' }, ...fonts(['Inter', 'Poppins', 'Roboto', 'Montserrat', 'DM Sans', 'Space Grotesk', 'Playfair Display', 'Fraunces', 'Lora']) ] } ,helpText: 'Used for headlines. Theme default uses your body font.' },

    { key: 'headingWeight', label: 'Heading weight', group: 'Typography', control: { kind: 'select', options: [{ value: 'regular', label: 'Regular' }, { value: 'medium', label: 'Medium (default)' }, { value: 'semibold', label: 'Semibold' }, { value: 'bold', label: 'Bold' }] }, helpText: 'How bold headlines look.' },
    { key: 'headingCase', label: 'Heading case', group: 'Typography', control: { kind: 'select', options: [{ value: 'none', label: 'As typed' }, { value: 'uppercase', label: 'UPPERCASE' }] }, helpText: 'Show headlines in capitals.' },
    { key: 'headingTracking', label: 'Heading letter spacing', group: 'Typography', control: { kind: 'select', options: [{ value: 'auto', label: 'Theme default' }, { value: 'tight', label: 'Tight' }, { value: 'normal', label: 'Normal' }, { value: 'wide', label: 'Wide' }] }, helpText: 'Space between the letters of headlines.' },
    { key: 'buttonCase', label: 'Button text', group: 'Buttons', control: { kind: 'select', options: [{ value: 'normal', label: 'As typed' }, { value: 'uppercase', label: 'UPPERCASE' }] }, helpText: 'Show button labels in capitals.' },
    { key: 'sectionRadius', label: 'Hero & footer corners', group: 'Layout & Spacing', control: { kind: 'select', options: [{ value: 'none', label: 'Square' }, { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large (default)' }] }, helpText: 'Corner roundness of the hero image and the footer panel.' },
    { key: 'buttonStyle', label: 'Style', group: 'Buttons', control: { kind: 'select', options: [{ value: 'solid', label: 'Solid' }, { value: 'outline', label: 'Outline' }, { value: 'soft', label: 'Soft (accent tint)' }] }, helpText: 'Filled, outlined or tinted buttons.' },
    { key: 'buttonRadius', label: 'Corner radius', group: 'Buttons', control: { kind: 'select', options: RADIUS.map(o => (o.value === 'full' ? { ...o, label: 'Pill (default)' } : o)) }, helpText: 'How rounded button corners are.' },
    { key: 'buttonWidth', label: 'Width', group: 'Buttons', control: { kind: 'select', options: [{ value: 'auto', label: 'Fits content' }, { value: 'full', label: 'Full width' }] }, helpText: 'Buttons hug their text or stretch across.' },

    { key: 'sectionSpacing', label: 'Section spacing', group: 'Layout & Spacing', control: { kind: 'select', options: [{ value: 'compact', label: 'Compact' }, { value: 'comfortable', label: 'Comfortable' }, { value: 'spacious', label: 'Spacious' }] }, helpText: 'Space above and below each section.' },
    { key: 'containerWidth', label: 'Container width', group: 'Layout & Spacing', control: { kind: 'select', options: [{ value: 'narrow', label: 'Narrow' }, { value: 'standard', label: 'Standard' }, { value: 'wide', label: 'Wide' }] }, helpText: 'How wide the page content gets on big screens.' },

    { key: 'imageRadius', label: 'Image corners', group: 'Images', control: { kind: 'select', options: RADIUS }, helpText: 'Corners of pictures inside sections.' },
    { key: 'productCardRadius', label: 'Product card corners', group: 'Images', control: { kind: 'select', options: RADIUS }, helpText: 'Corners of product cards in grids.' },
    { key: 'productImageRatio', label: 'Product image ratio', group: 'Images', control: { kind: 'select', options: [{ value: 'adapt', label: 'Adapt to image' }, { value: 'square', label: 'Square' }, { value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }] }, helpText: 'Shape of product photos in grids.' },
    { key: 'productImageHover', label: 'Product image hover', group: 'Images', control: { kind: 'select', options: [{ value: 'none', label: 'None' }, { value: 'zoom', label: 'Zoom' }, { value: 'second-image', label: 'Show second image' }] }, helpText: 'What happens when a shopper hovers a product photo.' },

    { key: 'saleBadge', label: 'Sale badge', group: 'Product cards', control: { kind: 'select', options: SHOW_HIDE }, helpText: 'Show a percentage badge on discounted products.' },
    { key: 'quickView', label: 'Quick view button', group: 'Product cards', control: { kind: 'select', options: SHOW_HIDE }, helpText: 'Lets shoppers pick options and add to cart from a pop-up on the product grid.' },
    { key: 'colorSwatches', label: 'Colour swatches', group: 'Product cards', control: { kind: 'select', options: SHOW_HIDE }, helpText: 'Shows the available colours on product cards; hovering one previews its photo.' },
    { key: 'soldOutBadge', label: 'Sold out badge', group: 'Product cards', control: { kind: 'select', options: SHOW_HIDE }, helpText: 'Show a Sold out badge on unavailable products.' },
    { key: 'cardRating', label: 'Star rating', group: 'Product cards', control: { kind: 'select', options: SHOW_HIDE }, helpText: 'Show stars on product cards.' },
    { key: 'cardTag', label: 'Category label', group: 'Product cards', control: { kind: 'select', options: SHOW_HIDE }, helpText: 'Show the category label on product cards.' },
    { key: 'cardButton', label: 'Add to cart button', group: 'Product cards', control: { kind: 'select', options: SHOW_HIDE }, helpText: 'Hide it for a cleaner, image-led grid.' },
    { key: 'badgeStyle', label: 'Badge shape', group: 'Product cards', control: { kind: 'select', options: [{ value: 'pill', label: 'Pill' }, { value: 'square', label: 'Square' }] }, helpText: 'Shape of Sale and Sold out badges.' },
    { key: 'inputRadius', label: 'Form field corners', group: 'Buttons', control: { kind: 'select', options: RADIUS }, helpText: 'Corners of form fields (checkout, login, search).' },
    { key: 'cardStyle', label: 'Card style', group: 'Product cards', control: { kind: 'select', options: [{ value: 'theme', label: 'Theme default' }, { value: 'flat', label: 'Flat' }, { value: 'outlined', label: 'Border' }, { value: 'elevated', label: 'Shadow' }] }, helpText: 'Border, shadow or flat product cards.' },

    { key: 'headingScale', label: 'Heading size', group: 'Typography', control: { kind: 'select', options: [{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium (default)' }, { value: 'large', label: 'Large' }, { value: 'xlarge', label: 'Extra large' }] }, helpText: 'Scales every headline on the page.' },
    { key: 'headingLineHeight', label: 'Heading line spacing', group: 'Typography', control: { kind: 'select', options: [{ value: 'auto', label: 'Theme default' }, { value: 'tight', label: 'Tight' }, { value: 'normal', label: 'Normal' }, { value: 'loose', label: 'Loose' }] }, helpText: 'Space between the lines of a multi-line headline.' },
    { key: 'headingColor', label: 'Heading colour', group: 'Colors', control: { kind: 'color', optional: { fallback: '#09090B' } }, helpText: 'Headlines (text on photos keeps its own colour). Auto uses your text colour.' },
    { key: 'bodyScale', label: 'Body text size', group: 'Typography', control: { kind: 'select', options: [{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium (default)' }, { value: 'large', label: 'Large' }] }, helpText: 'Scales paragraph text.' },
    { key: 'linkUnderline', label: 'Text links', group: 'Typography', control: { kind: 'select', options: [{ value: 'auto', label: 'Theme default' }, { value: 'always', label: 'Always underlined' }, { value: 'never', label: 'Never underlined' }] }, helpText: 'Links inside paragraphs and lists.' },
    { key: 'linkColor', label: 'Link colour', group: 'Colors', control: { kind: 'color', optional: { fallback: '#09090B' } }, helpText: 'Links inside paragraphs and lists. Auto uses your text colour.' },
    { key: 'buttonTextColor', label: 'Button text colour', group: 'Colors', control: { kind: 'color', optional: { fallback: '#FFFFFF' } }, helpText: 'Text on filled buttons. Auto picks black or white for contrast.' },
    { key: 'priceColor', label: 'Price colour', group: 'Colors', control: { kind: 'color', optional: { fallback: '#09090B' } }, helpText: 'Product prices. Sale prices use the Sale & alert colour.' },
    { key: 'starColor', label: 'Star rating colour', group: 'Colors', control: { kind: 'color', optional: { fallback: '#FB923C' } }, helpText: 'Rating stars on products and reviews.' },
    { key: 'successColor', label: 'In-stock colour', group: 'Colors', control: { kind: 'color', optional: { fallback: '#16A34A' } }, helpText: 'In-stock and success messages.' },
    { key: 'cardBgColor', label: 'Product card background', group: 'Colors', control: { kind: 'color', optional: { fallback: '#FFFFFF' } }, helpText: 'Background of product cards. Auto uses your page background.' },
    { key: 'buttonSize', label: 'Button size', group: 'Buttons', control: { kind: 'select', options: [{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium (default)' }, { value: 'lg', label: 'Large' }] }, helpText: 'Height of buttons.' },
    { key: 'buttonHover', label: 'Button hover effect', group: 'Buttons', control: { kind: 'select', options: [{ value: 'fade', label: 'Fade (default)' }, { value: 'lift', label: 'Lift up' }, { value: 'grow', label: 'Grow' }] }, helpText: 'What buttons do when a shopper points at them.' },
    { key: 'buttonShadow', label: 'Button shadow', group: 'Buttons', control: { kind: 'select', options: [{ value: 'none', label: 'None (default)' }, { value: 'soft', label: 'Soft shadow' }] }, helpText: 'A soft shadow under buttons.' },
    { key: 'pagePadding', label: 'Page side margins', group: 'Layout & Spacing', control: { kind: 'select', options: [{ value: 'narrow', label: 'Narrow' }, { value: 'standard', label: 'Standard (default)' }, { value: 'wide', label: 'Wide' }] }, helpText: 'Space between the page content and the screen edges.' },
    { key: 'gridGap', label: 'Product grid spacing', group: 'Layout & Spacing', control: { kind: 'select', options: [{ value: 'tight', label: 'Tight' }, { value: 'standard', label: 'Standard (default)' }, { value: 'airy', label: 'Airy' }] }, helpText: 'Space between products in a grid.' },
    { key: 'cardHover', label: 'Product card hover', group: 'Product cards', control: { kind: 'select', options: [{ value: 'shadow', label: 'Shadow (default)' }, { value: 'lift', label: 'Lift up' }, { value: 'none', label: 'None' }] }, helpText: 'What a product card does when pointed at.' },
    { key: 'cardTextAlign', label: 'Product card text', group: 'Product cards', control: { kind: 'select', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centred' }] }, helpText: 'Alignment of the name, price and rating.' },
    { key: 'showBreadcrumbs', label: 'Breadcrumbs', group: 'Product page', control: { kind: 'select', options: [{ value: 'show', label: 'Show' }, { value: 'hide', label: 'Hide' }] }, helpText: 'The Home / Shop / Product trail above the product.' },
    { key: 'showVendor', label: 'Brand name', group: 'Product page', control: { kind: 'select', options: [{ value: 'show', label: 'Show' }, { value: 'hide', label: 'Hide' }] }, helpText: 'The brand or vendor above the product title.' },
    { key: 'showStockStatus', label: 'Stock status text', group: 'Product page', control: { kind: 'select', options: [{ value: 'show', label: 'Show' }, { value: 'hide', label: 'Hide' }] }, helpText: 'In stock, Only 3 left, Sold out.' },
    { key: 'showReviews', label: 'Customer reviews section', group: 'Product page', control: { kind: 'select', options: [{ value: 'show', label: 'Show' }, { value: 'hide', label: 'Hide' }] }, helpText: 'The reviews block under the product.' },
    { key: 'stickyBuyBar', label: 'Sticky buy bar (phones)', group: 'Product page', control: { kind: 'select', options: [{ value: 'show', label: 'Show' }, { value: 'hide', label: 'Hide' }] }, helpText: 'A bar with the price and Add to cart pinned to the bottom of the screen on phones.' },
    { key: 'animations', label: 'Entrance animations', group: 'Effects', control: { kind: 'select', options: [{ value: 'on', label: 'On (default)' }, { value: 'off', label: 'Off' }] }, helpText: 'Turn off the fade-in motion when sections appear.' },
    { key: 'focusRing', label: 'Keyboard focus outline', group: 'Effects', control: { kind: 'select', options: [{ value: 'auto', label: 'Theme default' }, { value: 'accent', label: 'Accent colour' }, { value: 'ink', label: 'Text colour' }] }, helpText: 'The outline shown around the item selected with the keyboard.' },
    { key: 'bodyWeight', label: 'Body text weight', group: 'Typography', control: { kind: 'select', options: [{ value: 'regular', label: 'Regular (default)' }, { value: 'medium', label: 'Medium' }] }, helpText: 'Thickness of paragraph text.' },
    { key: 'sectionDividers', label: 'Lines between sections', group: 'Layout & Spacing', control: { kind: 'select', options: [{ value: 'none', label: 'None (default)' }, { value: 'line', label: 'Thin line' }] }, helpText: 'A hairline between stacked sections on a page.' },
    { key: 'cardWishlist', label: 'Wishlist heart on cards', group: 'Product cards', control: { kind: 'select', options: [{ value: 'show', label: 'Show' }, { value: 'hide', label: 'Hide' }] }, helpText: 'The heart button on product photos.' },
    { key: 'cardViewLink', label: 'Arrow link on cards', group: 'Product cards', control: { kind: 'select', options: [{ value: 'show', label: 'Show' }, { value: 'hide', label: 'Hide' }] }, helpText: 'The small arrow button next to Add to cart.' },
    { key: 'saleBadgeText', label: 'Sale badge text', group: 'Product cards', control: { kind: 'select', options: [{ value: 'percent', label: 'Percent off (-20%)' }, { value: 'label', label: 'The word Sale' }] }, helpText: 'What the badge on discounted products says.' },
    { key: 'selection', label: 'Text selection colour', group: 'Effects', control: { kind: 'select', options: [{ value: 'auto', label: 'Browser default' }, { value: 'accent', label: 'Accent colour' }] }, helpText: 'The highlight colour when a shopper selects text.' },
    { key: 'showDelivery', label: 'Delivery estimate', group: 'Product page', control: { kind: 'select', options: [{ value: 'show', label: 'Show' }, { value: 'hide', label: 'Hide' }] }, helpText: 'Arrival dates and shipping cost from your shipping rates. Nothing is shown if your rates have no delivery days.' },
    { key: 'cartType', label: 'Cart type', group: 'Cart', control: { kind: 'select', options: [{ value: 'drawer', label: 'Drawer (slides in)' }, { value: 'page', label: 'Cart page' }] }, helpText: 'What happens after a shopper adds a product.' },
  ],
};

registerThemeManifest(fashionThemeManifest);
