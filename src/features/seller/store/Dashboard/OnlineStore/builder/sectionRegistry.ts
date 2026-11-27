import { Bookmark, ListChecks, Users, Hash, Image, Type, Star, LayoutGrid, LayoutList, Columns, Quote, HelpCircle, Video, Grid3x3, ShieldCheck, Mail, Timer, Boxes, ShoppingBag, Search, ShoppingCart, Receipt, Newspaper, FileText, Columns3, Images, ArrowLeftRight, Code, MapPin, Mail as MailIcon, Minus, Rows3, LayoutDashboard, Package, PanelTop, History, type LucideIcon } from 'lucide-react';
import type { SectionType } from '@/api/services/storefrontTypes';
import type { FieldSchema } from './SchemaForm';
import { FEATURE_ICON_OPTIONS } from '@/features/storefront-themes/featureIcons';
import { COLLECTION_ICON_OPTIONS } from '@/features/storefront-themes/collectionIcons';
import { legacyContactFields } from '@/features/storefront-themes/core/forms/contactFormFields';

export interface SectionMeta {
  type:               SectionType;
  label:              string;
  description:        string;
  Icon:               LucideIcon;
  color:              string; // icon chip background/foreground accent, one per type for quick visual recognition
  defaultSettings:    Record<string, any>;
  allowedBlockTypes:  string[];
  blockLabel:         string;
  defaultBlockSettings: Record<string, any>;
  /** Excluded from `AddSectionModal`'s general picker — still has full metadata (icon/label/settings form) for when it already exists in a `Section[]` array. Used by `collection_product_grid`, which is pre-seeded once into the singleton Collection Template and never manually addable. */
  hidden?: boolean;
  /** Core/locked section (Phase 4, see `CORE_SECTION_TYPES`) — `PageSectionsEditor` renders it without a Remove/Duplicate/Hide/Drag control, and never offers it as an addable block-donor either (implies `hidden: true`, which every entry below still sets explicitly for clarity). */
  locked?: boolean;
  /** Blocks a seller may ADD to this (otherwise locked) section, e.g. Main Product's
   *  Buy it now / Collapsible tab / Size chart. These stay removable and duplicable. */
  addableBlockTypes?: string[];
  /** Drives `SchemaForm` — this section's own settings form. Replaces what used to be a hand-written `{type === '…' && …}` branch in `SectionFields.tsx`; see that file's own comment for why this exists. */
  settingsSchema: FieldSchema[];
}

// Every section type except these three gets a generic, always-first
// "Heading (optional)" field — matches the old hand-written behavior
// (`SectionFields.tsx` used to gate this with the same three-way exclusion
// inline). hero/trust_badges/collection_product_grid render their own
// heading (or none) entirely from their blocks/identity chrome instead.
const HEADING_FIELD: FieldSchema = { key: 'heading', kind: 'text', label: 'Heading (optional)' };
function withHeading(fields: FieldSchema[]): FieldSchema[] { return [HEADING_FIELD, ...fields]; }

/** Card options inside one product section (Shopify: they sit in the section, not only in theme settings). "Theme setting" = follow Customize > Product cards. */
const INHERIT_SHOW_HIDE = [{ value: 'inherit', label: 'Theme setting' }, { value: 'show', label: 'Show' }, { value: 'hide', label: 'Hide' }];
function cardLookFields(): FieldSchema[] {
  return [
    { key: 'cardImageFit', kind: 'select', label: 'Card image', hint: '"Show the whole image" never crops a product photo.', options: [{ value: 'inherit', label: 'Theme setting' }, { value: 'fill', label: 'Fill the box (edges may be cropped)' }, { value: 'whole', label: 'Show the whole image' }] },
    { key: 'cardButton', kind: 'select', label: 'Add to cart button', half: true, options: INHERIT_SHOW_HIDE },
    { key: 'cardViewLink', kind: 'select', label: 'Arrow link', half: true, options: INHERIT_SHOW_HIDE },
    { key: 'cardWishlist', kind: 'select', label: 'Wishlist heart', half: true, options: INHERIT_SHOW_HIDE },
    { key: 'cardRating', kind: 'select', label: 'Star rating', half: true, options: INHERIT_SHOW_HIDE },
  ];
}

/** The small label above a heading. Shows ONLY what the seller types here; blank = no label (themes add no words of their own). */
function eyebrowFields(): FieldSchema[] {
  return [
    { key: 'eyebrow', kind: 'text', label: 'Small label above the heading (optional)', maxLength: 60, placeholder: 'e.g. New this season', hint: 'Leave blank to show no label.' },
  ];
}

// Shared by `product_catalog` and `collection_product_grid` — identical sort/columns controls on both product-grid section types.
const SORT_COLUMNS_FIELDS: FieldSchema[] = [
  { key: 'defaultSort', kind: 'select', label: 'Default sort', options: [
    { value: 'newest', label: 'Newest' }, { value: 'price_asc', label: 'Price: Low–High' },
    { value: 'price_desc', label: 'Price: High–Low' }, { value: 'best_rated', label: 'Best Rated' }, { value: 'best_selling', label: 'Best Selling' },
  ] },
  { key: 'columns', kind: 'number', label: 'Columns', min: 1, max: 8, hint: 'Any number from 1 to 8. Phones always show fewer.' },
];

// Shopify's "Image ratio": the section's own built-in crop, the whole image uncropped, or a fixed ratio.
const IMAGE_RATIO_OPTIONS = [
  { value: 'default', label: 'Default' }, { value: 'adapt', label: 'Adapt to image' },
  { value: 'portrait', label: 'Portrait (3:4)' }, { value: 'square', label: 'Square (1:1)' }, { value: 'landscape', label: 'Landscape (4:3)' },
];

export const SECTION_META: SectionMeta[] = [
  {
    type: 'hero', label: 'Hero / Slider', description: 'Full-width image slides with a headline and call-to-action button.',
    Icon: Image, color: '#D97757',
    defaultSettings: { heightPreset: 'medium', autoplay: true, autoplaySeconds: 5, showArrows: false, showPauseButton: false, pagination: 'dots', transition: 'slide' },
    allowedBlockTypes: ['hero_slide'], blockLabel: 'Slide',
    defaultBlockSettings: { imageUrl: '', heading: '', subheading: '', ctaText: '', ctaLink: { linkType: 'home' }, focalPoint: 'center' },
    settingsSchema: [
      { key: 'heightPreset', kind: 'select', label: 'Slide height', hint: '"Adapt to image" shows each image whole — nothing is cropped.', options: [
        { value: 'adapt', label: 'Adapt to image' }, { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }, { value: 'custom', label: 'Custom (my own height)' },
      ] },
      { key: 'customHeight', kind: 'number', label: 'Custom height (px)', min: 150, max: 1400, placeholder: 'e.g. 600', showIf: s => s.heightPreset === 'custom', hint: 'Any height from 150 to 1400 px.' },
      { key: 'imageFit', kind: 'select', label: 'Image fit', showIf: s => s.heightPreset !== 'adapt', hint: '"Show the whole image" never crops the picture; the space around it is filled with a soft blur of the same picture.', options: [
        { value: 'fill', label: 'Fill the slide (edges may be cropped)' }, { value: 'whole', label: 'Show the whole image' },
      ] },
      { key: 'maxWidth', kind: 'number', label: 'Max width (px)', min: 320, max: 2400, placeholder: 'Theme width', hint: 'Optional. Leave empty to use the theme\'s page width.' },
      { key: 'mobileHeightPreset', kind: 'select', label: 'Slide height on mobile', options: [
        { value: 'same', label: 'Same as desktop' }, { value: 'adapt', label: 'Adapt to image' },
        { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }, { value: 'custom', label: 'Custom (my own height)' },
      ] },
      { key: 'mobileCustomHeight', kind: 'number', label: 'Custom height on mobile (px)', min: 150, max: 1400, placeholder: 'e.g. 400', showIf: s => s.mobileHeightPreset === 'custom' },
      { key: 'mobileTextLayout', kind: 'select', label: 'Text on mobile', hint: 'Overlay themes only . "Below image" moves the text out from over the picture.', options: [
        { value: 'overlay', label: 'Over the image' }, { value: 'below', label: 'Below the image' },
      ] },
      { key: 'transition', kind: 'select', label: 'Slide transition', options: [
        { value: 'slide', label: 'Slide' }, { value: 'fade', label: 'Fade' },
      ] },
      { key: 'autoplay', kind: 'checkbox', label: 'Auto-rotate slides' },
      { key: 'autoplaySeconds', kind: 'number', label: 'Change slides every (seconds)', min: 3, max: 10, step: 1, showIf: s => s.autoplay !== false },
      { key: 'showArrows', kind: 'checkbox', label: 'Show navigation arrows', defaultOff: true },
      { key: 'showPauseButton', kind: 'checkbox', label: 'Show pause / play button', defaultOff: true, showIf: s => s.autoplay !== false },
      { key: 'arrowStyle', kind: 'select', label: 'Arrow style', showIf: s => s.showArrows === true, options: [
        { value: 'circle', label: 'Round' }, { value: 'square', label: 'Square' }, { value: 'plain', label: 'Plain (no background)' },
      ] },
      { key: 'arrowsOnPhone', kind: 'checkbox', label: 'Show arrows on phones', defaultOff: true, showIf: s => s.showArrows === true },
      { key: 'pagination', kind: 'select', label: 'Pagination', options: [
        { value: 'dots', label: 'Dots' }, { value: 'counter', label: 'Counter (1 / 3)' }, { value: 'none', label: 'None' },
      ] },
      { key: 'paginationPosition', kind: 'select', label: 'Pagination position', showIf: s => s.pagination !== 'none', options: [
        { value: 'auto', label: 'Theme default' }, { value: 'left', label: 'Left' }, { value: 'center', label: 'Centre' }, { value: 'right', label: 'Right' },
      ] },
      { key: 'pauseOnHover', kind: 'checkbox', label: 'Pause when the mouse is over it', showIf: s => s.autoplay !== false },
    ],
  },
  {
    type: 'rich_text', label: 'Rich Text', description: 'Paragraphs, headings, images, quotes and lists.',
    Icon: Type, color: '#6366F1',
    defaultSettings: { heading: '', alignment: 'left' },
    allowedBlockTypes: ['heading', 'paragraph', 'image', 'quote', 'list', 'divider'], blockLabel: 'Block',
    defaultBlockSettings: { text: '' },
    // Deliberately NOT `withHeading(...)` here — this section's own
    // `heading` setting is the one place (alongside `paragraph`/`heading`
    // blocks below) Phase 9 wires a Dynamic Sources picker onto; every
    // OTHER section using `withHeading` stays exactly as it was, since
    // ripping a picker onto every section's heading at once would be a far
    // bigger, uncontrolled change than this phase's scope.
    settingsSchema: [
      HEADING_FIELD,
      { key: 'dynamicSourceKey', kind: 'metafieldKeyPicker', label: 'Or bind heading to a custom field (optional)', pairsWith: 'heading' },
      { key: 'alignment', kind: 'select', label: 'Text alignment', options: [
        { value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' },
      ] },
    ],
  },
  {
    type: 'featured_products', label: 'Featured Products', description: 'A curated strip of products — pinned, best sellers, trending, new arrivals, a category, or hand-picked.',
    Icon: Star, color: '#F59E0B',
    defaultSettings: { heading: 'Featured', source: 'newArrivals', limit: 8, columns: 4 },
    allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {},
    settingsSchema: withHeading([
      { key: 'source', kind: 'select', label: 'Source', clears: ['categoryId', 'collectionId'], options: [
        { value: 'pinned', label: 'Store pins (older list)' }, { value: 'bestsellers', label: 'Best Sellers' },
        { value: 'newArrivals', label: 'New Arrivals' }, { value: 'trending', label: 'Trending' },
        { value: 'onSale', label: 'On Sale' }, { value: 'category', label: 'A specific category' },
        { value: 'collection', label: 'A collection' }, { value: 'manual', label: 'Hand-picked products' },
        { value: 'rules', label: 'Products that match rules' },
      ] },
      { key: 'categoryId', kind: 'categoryPicker', label: 'Category', showIf: s => s.source === 'category' || s.source === 'rules', hint: 'Pick one. Until you do, this section stays hidden on your store. With rules: only products of this category.' },
      { key: 'collectionId', kind: 'collectionPicker', label: 'Collection', showIf: s => s.source === 'collection' || s.source === 'rules', hint: 'Pick one. Until you do, this section stays hidden on your store. With rules: only products of this collection.' },
      { key: 'ruleTags', kind: 'valueList', listSource: 'tags', label: 'Tags', showIf: s => s.source === 'rules' },
      { key: 'ruleVendors', kind: 'valueList', listSource: 'vendors', label: 'Brand / vendor', showIf: s => s.source === 'rules' },
      { key: 'rulePriceMin', kind: 'number', label: 'Lowest price', min: 0, max: 1000000000, step: 1, half: true, showIf: s => s.source === 'rules', hint: 'In your store currency.' },
      { key: 'rulePriceMax', kind: 'number', label: 'Highest price', min: 0, max: 1000000000, step: 1, half: true, showIf: s => s.source === 'rules' },
      { key: 'ruleType', kind: 'select', label: 'Kind of product', half: true, showIf: s => s.source === 'rules', options: [{ value: 'all', label: 'All' }, { value: 'physical', label: 'Physical only' }, { value: 'digital', label: 'Digital only' }] },
      { key: 'ruleStock', kind: 'select', label: 'Stock', half: true, showIf: s => s.source === 'rules', options: [{ value: 'any', label: 'Any' }, { value: 'in_stock', label: 'In stock only' }] },
      { key: 'ruleOnSale', kind: 'checkbox', label: 'Only products on sale', defaultOff: true, showIf: s => s.source === 'rules' },
      { key: 'ruleSort', kind: 'select', label: 'Order', showIf: s => s.source === 'rules', options: [
        { value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }, { value: 'best_selling', label: 'Best selling' }, { value: 'trending', label: 'Trending' },
        { value: 'best_rated', label: 'Best rated' }, { value: 'price_asc', label: 'Price: low to high' }, { value: 'price_desc', label: 'Price: high to low' },
        { value: 'title_asc', label: 'Name: A to Z' }, { value: 'title_desc', label: 'Name: Z to A' },
      ] },
      { key: 'rulesPreview', kind: 'productRulesPreview', label: 'Matching products', showIf: s => s.source === 'rules' },
      // Real product picker, not a raw comma-separated ID paste field — the
      // last surviving one of those in the whole builder, closed here.
      { key: 'productIds', kind: 'productMultiPicker', label: 'Products', showIf: s => s.source === 'manual' || s.source === 'pinned',
        hint: 'Shown in this order. Until you pick products, this section stays hidden on your store.' },
      { key: 'limit', kind: 'number', label: 'How many to show', min: 1, max: 24 },
      { key: 'hideSoldOut', kind: 'checkbox', label: 'Hide sold-out products', defaultOff: true, hint: 'Leaves out products that can not be bought right now.', showIf: s => s.source !== 'rules' },
      { key: 'columns', kind: 'number', label: 'Columns', min: 1, max: 8, hint: 'Any number from 1 to 8. Phones always show fewer.' },
      ...cardLookFields(),
      ...eyebrowFields(),
      { key: 'showViewAll', kind: 'checkbox', label: 'Show "View all" button', hint: 'The link at the top right of the section.' },
      { key: 'viewAllLabel', kind: 'text', label: '"View all" text', maxLength: 30, placeholder: 'View all', half: true, showIf: s => s.showViewAll !== false },
      { key: 'viewAllLink', kind: 'link', label: '"View all" link', hint: 'Blank = this section\'s own collection, or all products.', showIf: s => s.showViewAll !== false },
    ]),
  },
  {
    type: 'product_catalog', label: 'Product Catalog', description: 'The full, paginated browse grid with tag filters and sorting.',
    Icon: LayoutGrid, color: '#0EA5E9',
    defaultSettings: { heading: 'Our Products', defaultSort: 'newest', columns: 3, showFilters: true },
    allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {},
    settingsSchema: withHeading(SORT_COLUMNS_FIELDS.concat([
      { key: 'categoryId', kind: 'categoryPicker', label: 'Filter by category', clears: ['collectionId'] },
      { key: 'collectionId', kind: 'collectionPicker', label: 'Filter by collection', clears: ['categoryId'] },
      { key: 'showFilters', kind: 'checkbox', label: 'Show tag filters' },
      // Blank shows nothing (the catalog never had a label, so existing stores look the same).
      { key: 'eyebrow', kind: 'text', label: 'Small label above the heading', maxLength: 60, placeholder: 'e.g. SUMMER COLLECTION', hint: 'Optional. Leave blank to show no label.' },
    ])),
  },
  {
    type: 'image_with_text', label: 'Image with Text', description: 'An image next to a heading, body copy and an optional button.',
    Icon: Columns, color: '#14B8A6',
    defaultSettings: {},
    allowedBlockTypes: ['image_text_pair'], blockLabel: 'Pair',
    defaultBlockSettings: { imageUrl: '', heading: '', body: '', ctaText: '', imagePosition: 'left' },
    settingsSchema: withHeading([]),
  },
  {
    type: 'testimonials', label: 'Testimonials', description: 'Customer quotes with a name, role, and star rating — as a grid or a rotating carousel.',
    Icon: Quote, color: '#A855F7',
    defaultSettings: { heading: 'What buyers say', layout: 'grid', columns: 3, textAlign: 'center', imagePosition: 'top', autoplay: true, autoplaySeconds: 5, showArrows: true, pagination: 'dots', transition: 'slide' },
    allowedBlockTypes: ['testimonial'], blockLabel: 'Testimonial',
    defaultBlockSettings: { quote: '', authorName: '', rating: 5 },
    settingsSchema: withHeading([
      { key: 'layout', kind: 'select', label: 'Layout', options: [
        { value: 'grid', label: 'Grid (static cards)' }, { value: 'carousel', label: 'Carousel (rotating slides)' },
      ] },
      { key: 'columns', kind: 'number', label: 'Columns', min: 1, max: 8, showIf: s => s.layout !== 'carousel', hint: 'Any number from 1 to 8. Phones always show fewer.' },
      { key: 'textAlign', kind: 'select', label: 'Text alignment', half: true, options: [
        { value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' },
      ] },
      { key: 'imagePosition', kind: 'select', label: 'Photo position', half: true, options: [
        { value: 'top', label: 'Top' }, { value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }, { value: 'bottom', label: 'Bottom' }, { value: 'none', label: 'No photo' },
      ] },
      { key: 'autoplay', kind: 'checkbox', label: 'Auto-rotate slides', showIf: s => s.layout === 'carousel' },
      { key: 'autoplaySeconds', kind: 'number', label: 'Change slides every (seconds)', min: 3, max: 10, step: 1, half: true, showIf: s => s.layout === 'carousel' && s.autoplay !== false },
      { key: 'showArrows', kind: 'checkbox', label: 'Show navigation arrows', half: true, showIf: s => s.layout === 'carousel' },
      { key: 'pagination', kind: 'select', label: 'Pagination', showIf: s => s.layout === 'carousel', options: [
        { value: 'dots', label: 'Dots' }, { value: 'none', label: 'None' },
      ] },
      { key: 'transition', kind: 'select', label: 'Slide transition', showIf: s => s.layout === 'carousel', options: [
        { value: 'slide', label: 'Slide' }, { value: 'fade', label: 'Fade' },
      ] },
    ]),
  },
  {
    type: 'faq', label: 'FAQ', description: 'A list of collapsible question/answer pairs.',
    Icon: HelpCircle, color: '#EC4899',
    defaultSettings: { heading: 'Frequently Asked Questions' },
    allowedBlockTypes: ['faq_item'], blockLabel: 'Question',
    defaultBlockSettings: { question: '', answer: '' },
    settingsSchema: withHeading([
      { key: 'source', kind: 'select', label: 'Questions', options: [
        { value: 'blocks', label: 'Added here (blocks below)' },
        { value: 'store', label: 'My store FAQs (Online Store → FAQs)' },
      ], hint: 'Store FAQs keep this section and your /faqs page in sync.' },
      ...eyebrowFields(),
    ]),
  },
  {
    type: 'video', label: 'Video', description: 'A video link (YouTube, Vimeo, any .mp4 link) or an uploaded video file.',
    Icon: Video, color: '#EF4444',
    defaultSettings: { heading: '', videoUrl: '', videoFileUrl: '', aspectRatio: '16:9' },
    allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {},
    settingsSchema: withHeading([
      { key: 'videoUrl', kind: 'url', label: 'Video URL', hint: 'Any video link (YouTube, Vimeo, or a direct .mp4 link) — or upload a file below', placeholder: 'https://…', showIf: s => !s.videoFileUrl },
      { key: 'videoFileUrl', kind: 'video', label: 'Upload video file', hint: 'MP4 / WebM / MOV, up to 100MB. Replaces the link above.' },
      { key: 'aspectRatio', kind: 'select', label: 'Aspect ratio', options: [
        { value: '16:9', label: '16:9' }, { value: '4:3', label: '4:3' }, { value: '1:1', label: '1:1' },
      ] },
    ]),
  },
  {
    type: 'documents_grid', label: 'Documents', description: 'Your Documents library as cards — cover, name, View and Download. New uploads appear here on their own.',
    Icon: FileText, color: '#7C3AED',
    defaultSettings: { heading: 'Downloads', category: '', columns: 3, showDescription: false },
    allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {},
    settingsSchema: withHeading([
      { key: 'category', kind: 'select', label: 'Category', hint: 'Leave empty to show every document.', options: [
        { value: '', label: 'All documents' },
        { value: 'catalogue', label: 'Catalogue' },
        { value: 'brochure', label: 'Brochure' },
        { value: 'price_list', label: 'Price list' },
        { value: 'manual', label: 'Manual' },
        { value: 'certificate', label: 'Certificate' },
        { value: 'other', label: 'Other' },
      ] },
      { key: 'columns', kind: 'select', label: 'Columns', options: [
        { value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' },
      ] },
      { key: 'showDescription', kind: 'checkbox', label: 'Show the short description' },
    ]),
  },
  {
    type: 'featured_category_grid', label: 'Category Grid', description: 'Tiles linking to your subcategories — a "shop by category" grid.',
    Icon: Grid3x3, color: '#0891B2',
    defaultSettings: { heading: 'Shop by Category', categoryIds: [], columns: 4 },
    allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {},
    settingsSchema: withHeading([
      { key: 'categoryIds', kind: 'categoryMultiPicker', label: 'Categories', hint: 'Tiles are shown in the order chosen.', max: 12 },
      { key: 'columns', kind: 'number', label: 'Columns', min: 1, max: 8, hint: 'Any number from 1 to 8. Phones always show fewer.' },
      { key: 'tileStyle', kind: 'select', label: 'Tile style', options: [{ value: 'card', label: 'Small card (image beside name)' }, { value: 'simple', label: 'Large image with name below' }] },
      { key: 'imageRatio', kind: 'select', label: 'Image shape (large tiles)', options: [{ value: 'default', label: 'Default' }, { value: 'portrait', label: 'Portrait' }, { value: 'square', label: 'Square' }, { value: 'landscape', label: 'Landscape' }], showIf: s => s.tileStyle === 'simple' },
      { key: 'textAlign', kind: 'select', label: 'Name alignment (large tiles)', options: [{ value: 'center', label: 'Center' }, { value: 'left', label: 'Left' }], showIf: s => s.tileStyle === 'simple' },
      { key: 'showArrows', kind: 'checkbox', label: 'Show scroll arrows' },
      { key: 'showCount', kind: 'checkbox', label: 'Show the number of products under each category' },
      ...eyebrowFields(),
    ]),
  },
  {
    type: 'trust_badges', label: 'Trust Badges', description: 'A row of reassurance badges — shipping, returns, secure payment, support.',
    Icon: ShieldCheck, color: '#059669',
    defaultSettings: {},
    allowedBlockTypes: ['trust_badge_item'], blockLabel: 'Badge',
    defaultBlockSettings: { icon: 'truck', text: '' },
    settingsSchema: [], // no section-level settings at all — content is entirely the badge blocks
  },
  {
    type: 'blog_posts', label: 'Latest Blog Posts', description: 'Your latest blog posts — a card grid linking to each article.',
    Icon: Newspaper, color: '#DC2626',
    defaultSettings: { heading: 'From the journal', limit: 3 },
    allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {},
    settingsSchema: withHeading([
      { key: 'limit', kind: 'select', label: 'Number of posts', numeric: true, options: [
        { value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }, { value: '6', label: '6' }, { value: '9', label: '9' }, { value: '12', label: '12' },
      ] },
      { key: 'imageRatio', kind: 'select', label: 'Image ratio', hint: 'Default is 4:3.', options: IMAGE_RATIO_OPTIONS },
      { key: 'viewAllLabel', kind: 'text', label: '"View all" link text', maxLength: 30, placeholder: 'View all' },
    ]),
  },
  {
    type: 'newsletter', label: 'Newsletter', description: 'An email signup — subscribes to your store\'s newsletter.',
    Icon: Mail, color: '#7C3AED',
    defaultSettings: { heading: 'Stay in the loop', subtext: '' },
    allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {},
    settingsSchema: withHeading([
      { key: 'subtext', kind: 'text', label: 'Subtext (optional)' },
      { key: 'placeholder', kind: 'text', label: 'Email box placeholder', maxLength: 60, placeholder: 'Your email', half: true },
      { key: 'buttonLabel', kind: 'text', label: 'Button label', maxLength: 30, placeholder: 'Subscribe', half: true },
      { key: 'successMessage', kind: 'text', label: 'Message after signing up', maxLength: 160, placeholder: "Thank you — you're subscribed." },
      ...eyebrowFields(),
    ]),
  },
  {
    type: 'metaobject_list', label: 'Metaobject List', description: 'Lists real entries of one of your custom content types — e.g. every Team Member or Size Guide row.',
    Icon: Boxes, color: '#4F46E5',
    defaultSettings: { heading: '', metaobjectType: '' },
    allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {},
    settingsSchema: withHeading([
      { key: 'metaobjectType', kind: 'metaobjectTypePicker', label: 'Content type', required: true, hint: 'One of your store\'s own custom content types — see Custom Fields → Content Types.' },
    ]),
  },
  {
    type: 'collection_product_grid', label: 'Collection Product Grid', description: 'The paginated product grid for whichever collection a buyer is currently browsing.',
    Icon: LayoutList, color: '#0EA5E9',
    defaultSettings: { defaultSort: 'newest', columns: 3, showFilters: true },
    allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {},
    hidden: true,
    settingsSchema: [...SORT_COLUMNS_FIELDS, { key: 'showFilters', kind: 'checkbox', label: 'Show tag filters' }],
  },
  {
    type: 'category_product_grid', label: 'Category Product Grid', description: 'The product grid for whichever category a buyer is currently browsing.',
    Icon: LayoutList, color: '#0EA5E9',
    defaultSettings: { defaultSort: 'newest', columns: 4, showFilters: true },
    allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {},
    hidden: true,
    settingsSchema: [...SORT_COLUMNS_FIELDS, { key: 'showFilters', kind: 'checkbox', label: 'Show tag filters' }],
  },
  {
    type: 'drop_countdown', label: 'Drop Countdown', description: 'A live countdown to a launch/drop date, with an optional call-to-action button.',
    Icon: Timer, color: '#DC2626',
    defaultSettings: { heading: 'New Drop', subheading: 'Coming soon', targetDate: '', ctaText: '', ctaLink: { linkType: 'home' } },
    allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {},
    settingsSchema: withHeading([
      { key: 'subheading', kind: 'text', label: 'Subheading (optional)' },
      { key: 'targetDate', kind: 'datetime', label: 'Target date & time', required: true, hint: 'The countdown runs live until this moment.' },
      { key: 'ctaText', kind: 'text', label: 'Button text (optional)' },
      { key: 'ctaLink', kind: 'link', label: 'Button link', showIf: s => !!s.ctaText },
      { key: 'endedText', kind: 'text', label: 'Text when the countdown ends', maxLength: 60, placeholder: 'Dropped!' },
      { key: 'daysLabel', kind: 'text', label: 'Word under the days', maxLength: 16, placeholder: 'Days', half: true },
      { key: 'hoursLabel', kind: 'text', label: 'Word under the hours', maxLength: 16, placeholder: 'Hrs', half: true },
      { key: 'minutesLabel', kind: 'text', label: 'Word under the minutes', maxLength: 16, placeholder: 'Min', half: true },
      { key: 'secondsLabel', kind: 'text', label: 'Word under the seconds', maxLength: 16, placeholder: 'Sec', half: true },
    ]),
  },
  // ── Shopify-parity section library ───────────────────────────────────────
  {
    type: 'multicolumn', label: 'Multicolumn', description: 'Columns of image, heading, text and a button — features, benefits, categories, steps.',
    Icon: Columns3, color: '#0D9488',
    defaultSettings: { heading: '', columns: 3, textAlign: 'left' },
    allowedBlockTypes: ['multicolumn_column'], blockLabel: 'Column',
    defaultBlockSettings: { imageUrl: '', heading: '', body: '', ctaText: '' },
    settingsSchema: withHeading([
      { key: 'columns', kind: 'number', label: 'Columns per row', min: 1, max: 8, hint: 'Any number from 1 to 8. Phones always show fewer.' },
      { key: 'textAlign', kind: 'select', label: 'Text alignment', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] },
      { key: 'imageRatio', kind: 'select', label: 'Image ratio', options: IMAGE_RATIO_OPTIONS },
    ]),
  },
  {
    type: 'promo_cards', label: 'Promo Cards', description: 'Free-form cards — an image with a text panel, a background image, any size, any colours. Deals, offers, categories, features: you decide the look.',
    Icon: LayoutDashboard, color: '#EA580C',
    defaultSettings: { heading: '', columns: 2, layout: 'image-left', cardHeight: 380, imageWidth: 50, gap: 20, contentAlign: 'left', contentPosition: 'spread', headingSize: 28, bodySize: 15 },
    allowedBlockTypes: ['promo_card'], blockLabel: 'Card',
    defaultBlockSettings: { imageUrl: '', eyebrow: '', heading: 'Your heading', body: '', ctaText: 'Shop now', ctaStyle: 'solid' },
    settingsSchema: withHeading([
      { key: 'columns', kind: 'number', label: 'Columns', min: 1, max: 12, half: true, hint: 'Any number from 1 to 12. A card can take more than one column (set on the card).' },
      { key: 'gap', kind: 'number', label: 'Space between cards (px)', min: 0, max: 200, half: true },
      { key: 'layout', kind: 'select', label: 'Card layout', options: [
        { value: 'image-left', label: 'Image on the left, text beside it' }, { value: 'image-right', label: 'Image on the right, text beside it' },
        { value: 'image-top', label: 'Image on top, text below' }, { value: 'image-bottom', label: 'Text on top, image below' },
        { value: 'overlay', label: 'Image as the background, text over it' },
      ], hint: 'Each card can override this.' },
      { key: 'cardHeight', kind: 'number', label: 'Card height (px)', min: 0, max: 2000, half: true, hint: '0 = fit the content.' },
      { key: 'imageWidth', kind: 'number', label: 'Image share (%)', min: 10, max: 90, half: true, hint: 'For the side-by-side layouts.' },
      { key: 'radius', kind: 'number', label: 'Corner roundness (px)', min: 0, max: 200, half: true, hint: 'Empty = the theme\'s own.' },
      { key: 'padding', kind: 'number', label: 'Space inside the text (px)', min: 0, max: 200, half: true, hint: 'Empty = automatic.' },
      { key: 'headingSize', kind: 'number', label: 'Heading size (px)', min: 10, max: 160, half: true },
      { key: 'bodySize', kind: 'number', label: 'Text size (px)', min: 9, max: 48, half: true },
      { key: 'contentAlign', kind: 'select', label: 'Text alignment', half: true, options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }] },
      { key: 'contentPosition', kind: 'select', label: 'Text position', half: true, options: [
        { value: 'top', label: 'Top' }, { value: 'center', label: 'Middle' }, { value: 'bottom', label: 'Bottom' }, { value: 'spread', label: 'Text on top, buttons at the bottom' },
      ] },
    ]),
  },
  {
    type: 'image_mosaic', label: 'Image Mosaic', description: 'A free grid of images — you choose how many, how many per row, which are bigger, and where each one links.',
    Icon: LayoutDashboard, color: '#0891B2',
    defaultSettings: { heading: '', columns: 4, mobileColumns: 2, gap: 8, rowHeight: 200, hover: 'zoom', fit: 'cover' },
    allowedBlockTypes: ['mosaic_image'], blockLabel: 'Image',
    defaultBlockSettings: { imageUrl: '', colSpan: 1, rowSpan: 1 },
    settingsSchema: withHeading([
      { key: 'columns', kind: 'number', label: 'Images per row (columns)', min: 1, max: 12, half: true, hint: 'Any number from 1 to 12.' },
      { key: 'mobileColumns', kind: 'number', label: 'Columns on phones', min: 1, max: 6, half: true },
      { key: 'rowHeight', kind: 'number', label: 'Height of one row (px)', min: 40, max: 1200, half: true, hint: 'A tall image takes several rows (set on the image).' },
      { key: 'gap', kind: 'number', label: 'Space between images (px)', min: 0, max: 100, half: true },
      { key: 'radius', kind: 'number', label: 'Image corners (px)', min: 0, max: 200, half: true, hint: 'Empty = the theme\'s own.' },
      { key: 'fit', kind: 'select', label: 'Image fit', half: true, options: [{ value: 'cover', label: 'Fill the space (crop)' }, { value: 'contain', label: 'Show the whole image' }] },
      { key: 'hover', kind: 'select', label: 'On hover', options: [{ value: 'zoom', label: 'Zoom in slowly' }, { value: 'dim', label: 'Darken a little' }, { value: 'none', label: 'Nothing' }] },
      { key: 'fullWidth', kind: 'checkbox', label: 'Edge to edge (full screen width)', defaultOff: true },
    ]),
  },
  {
    type: 'collection_columns', label: 'Collection Columns', description: 'Side-by-side columns, each listing a collection\'s (or any source\'s) products as compact rows — photo, name, price. You control every size and colour.',
    Icon: Columns3, color: '#B45309',
    defaultSettings: { heading: '', columns: 4, gap: 32, showHeadingLine: true, showImage: true, imagePosition: 'left', imageSize: 100, imageGap: 16, titleLines: 3, showOldPrice: true },
    allowedBlockTypes: ['collection_column'], blockLabel: 'Column',
    defaultBlockSettings: { source: 'collection', heading: 'Column heading', limit: 3 },
    settingsSchema: withHeading([
      { key: 'columns', kind: 'number', label: 'Columns', min: 1, max: 8, half: true, hint: 'Phones show fewer.' },
      { key: 'gap', kind: 'number', label: 'Space between columns (px)', min: 0, max: 200, half: true },
      { key: 'rowGap', kind: 'number', label: 'Space between rows (px)', min: 0, max: 120, half: true },
      { key: 'align', kind: 'select', label: 'Text alignment', half: true, options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centre' }, { value: 'right', label: 'Right' }] },
      { key: 'headingSize', kind: 'number', label: 'Column heading size (px)', min: 10, max: 120, half: true },
      { key: 'headingColor', kind: 'color', label: 'Heading colour', half: true },
      { key: 'showHeadingLine', kind: 'checkbox', label: 'Line under each heading' },
      { key: 'lineWidth', kind: 'number', label: 'Line thickness (px)', min: 0, max: 8, half: true, showIf: s => s.showHeadingLine !== false },
      { key: 'lineColor', kind: 'color', label: 'Line colour', half: true, showIf: s => s.showHeadingLine !== false },
      { key: 'headingGap', kind: 'number', label: 'Space under heading (px)', min: 0, max: 80, half: true },
      { key: 'showImage', kind: 'checkbox', label: 'Show product photos' },
      { key: 'imagePosition', kind: 'select', label: 'Photo position', half: true, showIf: s => s.showImage !== false, options: [{ value: 'left', label: 'Left of the text' }, { value: 'right', label: 'Right of the text' }, { value: 'top', label: 'Above the text' }] },
      { key: 'imageSize', kind: 'number', label: 'Photo size (px)', min: 24, max: 320, half: true, showIf: s => s.showImage !== false },
      { key: 'imageRadius', kind: 'number', label: 'Photo corners (px)', min: 0, max: 200, half: true, showIf: s => s.showImage !== false },
      { key: 'imageGap', kind: 'number', label: 'Space photo ↔ text (px)', min: 0, max: 60, half: true, showIf: s => s.showImage !== false },
      { key: 'titleSize', kind: 'number', label: 'Product name size (px)', min: 9, max: 48, half: true },
      { key: 'titleLines', kind: 'number', label: 'Name: max lines', min: 1, max: 6, half: true },
      { key: 'titleColor', kind: 'color', label: 'Name colour', half: true },
      { key: 'priceSize', kind: 'number', label: 'Price size (px)', min: 9, max: 48, half: true },
      { key: 'priceColor', kind: 'color', label: 'Price colour', half: true },
      { key: 'showOldPrice', kind: 'checkbox', label: 'Show the old (crossed) price' },
      { key: 'oldPriceColor', kind: 'color', label: 'Old price colour', showIf: s => s.showOldPrice !== false },
      { key: 'showBadge', kind: 'checkbox', label: 'Show a "-20%" badge on sale items', defaultOff: true },
      { key: 'badgeBg', kind: 'color', label: 'Badge colour', half: true, showIf: s => s.showBadge === true },
      { key: 'badgeText', kind: 'color', label: 'Badge text colour', half: true, showIf: s => s.showBadge === true },
      { key: 'rowDivider', kind: 'checkbox', label: 'Line between rows', defaultOff: true },
      { key: 'dividerColor', kind: 'color', label: 'Row line colour', showIf: s => s.rowDivider === true },
      { key: 'rowPadding', kind: 'number', label: 'Space inside each row (px)', min: 0, max: 80, half: true },
      { key: 'rowRadius', kind: 'number', label: 'Row corners (px)', min: 0, max: 200, half: true },
      { key: 'rowBg', kind: 'color', label: 'Row background' },
      { key: 'columnBg', kind: 'color', label: 'Column background', half: true },
      { key: 'columnPadding', kind: 'number', label: 'Space inside column (px)', min: 0, max: 120, half: true },
      { key: 'columnRadius', kind: 'number', label: 'Column corners (px)', min: 0, max: 200, half: true },
      { key: 'columnBorder', kind: 'checkbox', label: 'Border around each column', defaultOff: true },
      { key: 'showViewAll', kind: 'checkbox', label: 'Show a "View all" link under each column', defaultOff: true },
      { key: 'viewAllText', kind: 'text', label: 'Link text', maxLength: 40, half: true, showIf: s => s.showViewAll === true },
      { key: 'viewAllColor', kind: 'color', label: 'Link colour', half: true, showIf: s => s.showViewAll === true },
    ]),
  },
  {
    type: 'logo_list', label: 'Logo List', description: 'A row of brand, press or partner logos.',
    Icon: Images, color: '#6B7280',
    defaultSettings: { heading: '', logoHeight: 48, grayscale: true },
    allowedBlockTypes: ['logo_item'], blockLabel: 'Logo',
    defaultBlockSettings: { imageUrl: '', alt: '' },
    settingsSchema: withHeading([
      { key: 'logoHeight', kind: 'number', label: 'Logo height (px)', min: 24, max: 120, step: 4 },
      { key: 'grayscale', kind: 'checkbox', label: 'Show logos in grayscale' },
    ]),
  },
  {
    type: 'marquee', label: 'Marquee', description: 'A continuously scrolling strip of short messages — offers, shipping info, announcements.',
    Icon: ArrowLeftRight, color: '#E11D48',
    defaultSettings: { speed: 'medium', direction: 'left', pauseOnHover: true },
    allowedBlockTypes: ['marquee_item'], blockLabel: 'Message',
    defaultBlockSettings: { text: '' },
    settingsSchema: [
      { key: 'speed', kind: 'select', label: 'Speed', options: [{ value: 'slow', label: 'Slow' }, { value: 'medium', label: 'Medium' }, { value: 'fast', label: 'Fast' }] },
      { key: 'direction', kind: 'select', label: 'Direction', options: [{ value: 'left', label: 'Right to left' }, { value: 'right', label: 'Left to right' }] },
      { key: 'fontSizePx', kind: 'number', label: 'Text size (px)', min: 8, max: 300, step: 1, hint: 'Your own size in pixels. Leave empty for the theme default.' },
      { key: 'pauseOnHover', kind: 'checkbox', label: 'Pause on hover' },
    ],
  },
  {
    type: 'custom_html', label: 'Custom HTML', description: 'Your own HTML and inline styles. Scripts, iframes, forms and event handlers are removed for safety.',
    Icon: Code, color: '#475569',
    defaultSettings: { html: '' },
    allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {},
    settingsSchema: [
      { key: 'html', kind: 'textarea', label: 'HTML', maxLength: 20000, hint: 'Allowed: headings, text, images, links, lists, tables, inline style. Not allowed: <script>, <iframe>, <form>, on… handlers, javascript: links.' },
    ],
  },
  {
    type: 'collection_list', label: 'Collection List', description: 'Tiles for your collections — a "shop by collection" grid linking to each collection page.',
    Icon: LayoutGrid, color: '#0EA5E9',
    defaultSettings: { heading: 'Shop by collection', columns: 3, limit: 6, imageRatio: 'default', showDescription: false },
    // Add tiles to pick collections by hand (and rename, re-describe, add an icon/image or a button). With no tiles it lists your collections automatically.
    allowedBlockTypes: ['collection_item'], blockLabel: 'Tile',
    defaultBlockSettings: { title: '', description: '', ctaText: '' },
    settingsSchema: withHeading([
      { key: 'columns', kind: 'number', label: 'Columns', min: 1, max: 8, hint: 'Any number from 1 to 8. Phones always show fewer.' },
      { key: 'limit', kind: 'number', label: 'How many collections', min: 1, max: 24, step: 1, hint: 'Only for the automatic list. Once you add tiles, exactly your tiles are shown.' },
      { key: 'cardStyle', kind: 'select', label: 'Card around each tile', options: [{ value: 'none', label: 'No card' }, { value: 'bordered', label: 'Thin border' }, { value: 'filled', label: 'Filled background' }] },
      { key: 'buttonStyle', kind: 'select', label: 'Tile button look', options: [{ value: 'solid', label: 'Solid' }, { value: 'outline', label: 'Outline' }, { value: 'link', label: 'Text link' }] },
      { key: 'imageRatio', kind: 'select', label: 'Image ratio', options: [{ value: 'default', label: 'Default' }, { value: 'adapt', label: 'Adapt to image' }, { value: 'portrait', label: 'Portrait' }, { value: 'square', label: 'Square' }, { value: 'landscape', label: 'Landscape' }] },
      { key: 'showDescription', kind: 'checkbox', label: 'Show each collection\'s description', defaultOff: true },
      { key: 'tileStyle', kind: 'select', label: 'Tile style', options: [{ value: 'card', label: 'Image with arrow button' }, { value: 'simple', label: 'Image with name below' }] },
      { key: 'textAlign', kind: 'select', label: 'Name alignment', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] },
      { key: 'layout', kind: 'select', label: 'Layout', options: [{ value: 'grid', label: 'Grid' }, { value: 'carousel', label: 'Scrolling row with arrows' }] },
      { key: 'eyebrow', kind: 'text', label: 'Small text above the heading (optional)', maxLength: 60 },
      { key: 'clickAction', kind: 'select', label: 'When a customer clicks a tile', options: [{ value: 'link', label: 'Open the collection page' }, { value: 'show_products', label: 'Show its products below, with "Add all to cart"' }], hint: 'The second choice builds a "complete set" picker: pick a grade/class tile, see only its products and add them all in one click. Each tile must have a collection chosen.' },
      { key: 'showSubtotal', kind: 'checkbox', label: 'Show the total price of the shown products' },
      { key: 'addAllLabel', kind: 'text', label: 'Add-all button text (optional)', maxLength: 60, hint: 'Empty = "Add all N to cart".' },
      { key: 'productColumns', kind: 'number', label: 'Product columns (shown products)', min: 1, max: 8, step: 1 },
    ]),
  },
  {
    type: 'divider', label: 'Divider', description: 'A line or empty space between sections.',
    Icon: Minus, color: '#8C8A82',
    defaultSettings: { style: 'line', height: 32 },
    allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {},
    settingsSchema: [
      { key: 'style', kind: 'select', label: 'Style', options: [{ value: 'line', label: 'Line' }, { value: 'space', label: 'Empty space' }] },
      { key: 'height', kind: 'number', label: 'Height (px)', min: 0, max: 160, step: 4 },
    ],
  },
  {
    type: 'multirow', label: 'Multirow', description: 'Rows of image + text, alternating sides — great for features or a brand story.',
    Icon: Rows3, color: '#0D9488',
    defaultSettings: { heading: '', imageRatio: 'default', alternate: true },
    allowedBlockTypes: ['multirow_row'], blockLabel: 'Row',
    defaultBlockSettings: { heading: 'Row heading', body: '' },
    settingsSchema: withHeading([
      { key: 'imageRatio', kind: 'select', label: 'Image ratio', options: IMAGE_RATIO_OPTIONS },
      { key: 'alternate', kind: 'checkbox', label: 'Alternate image side on each row' },
    ]),
  },
  {
    type: 'collage', label: 'Collage', description: 'One large tile next to smaller ones (up to 5 images), each with an optional link.',
    Icon: LayoutDashboard, color: '#9333EA',
    defaultSettings: { heading: '', layout: 'left' },
    allowedBlockTypes: ['collage_item'], blockLabel: 'Tile',
    defaultBlockSettings: { heading: '' },
    settingsSchema: withHeading([
      { key: 'layout', kind: 'select', label: 'Large tile', options: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }] },
    ]),
  },
  {
    type: 'featured_product', label: 'Featured Product', description: 'One product shown large, with its price and a button to its page.',
    Icon: Package, color: '#F59E0B',
    defaultSettings: { heading: 'Featured', productIds: [] },
    allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {},
    settingsSchema: [
      { key: 'productIds', kind: 'productMultiPicker', label: 'Product', hint: 'Pick one product (only the first is shown).' },
      { key: 'heading', kind: 'text', label: 'Small label above the name', maxLength: 60 },
      { key: 'buttonLabel', kind: 'text', label: 'Button text', maxLength: 30, placeholder: 'View product' },
    ],
  },
  {
    type: 'collection_banner', label: 'Collection Banner', description: 'A collection\'s title, description and image. On the Collection template it shows the collection being viewed.',
    Icon: PanelTop, color: '#0EA5E9',
    defaultSettings: { showImage: true, showDescription: true },
    allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {},
    settingsSchema: [
      { key: 'collectionId', kind: 'collectionPicker', label: 'Collection', hint: 'Leave empty on the Collection template to use the collection being viewed.' },
      { key: 'showImage', kind: 'checkbox', label: 'Show the collection image' },
      { key: 'showDescription', kind: 'checkbox', label: 'Show the description' },
    ],
  },
  {
    type: 'recently_viewed', label: 'Recently Viewed', description: 'Products this shopper looked at recently (remembered in their own browser).',
    Icon: History, color: '#E11D48',
    defaultSettings: { heading: 'Recently viewed', limit: 4, columns: 4 },
    allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {},
    settingsSchema: withHeading([
      { key: 'limit', kind: 'number', label: 'How many products', min: 2, max: 12, step: 1 },
      { key: 'columns', kind: 'number', label: 'Columns', min: 1, max: 8, hint: 'Any number from 1 to 8. Phones always show fewer.' },
    ]),
  },
  {
    type: 'contact_form', label: 'Form', description: 'Any form you design: contact, quote, sign-up, survey, application. Answers arrive under Online Store → Contact Messages (and by email).',
    Icon: MailIcon, color: '#0D9488',
    defaultSettings: {
      heading: 'Send us a message', intro: '', buttonLabel: 'Send message', successMessage: 'Thanks — we got your message and will reply soon.',
      // The seller edits this list (add, remove, reorder, required...); it starts as the classic Name / Email / Phone / Message form.
      fields: legacyContactFields({}),
    },
    allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {},
    settingsSchema: withHeading([
      { key: 'intro', kind: 'textarea', label: 'Text above the form', rows: 2, maxLength: 300 },
      { key: 'buttonLabel', kind: 'text', label: 'Button label', maxLength: 30 },
      { key: 'successMessage', kind: 'text', label: 'Message shown after sending', maxLength: 200 },
      { key: 'fields', kind: 'formFields', label: 'Form fields', hint: 'Choose what visitors fill in. Add any field you need (name, phone, order number, a dropdown...). Answers arrive in Contact Messages.' },
      { key: 'formName', kind: 'text', label: 'Form name', maxLength: 60, placeholder: 'e.g. Wholesale request', hint: 'Shown in your Contact Messages so answers of different forms can be told apart.' },
      { key: 'display', kind: 'select', label: 'Show the form', options: [{ value: 'inline', label: 'On the page' }, { value: 'popup', label: 'In a pop-up opened by a button' }], hint: 'Pop-up: only a button shows on the page and the form opens above it.' },
      { key: 'popupButtonLabel', kind: 'text', label: 'Button text', maxLength: 40, placeholder: 'e.g. Request a quote', showIf: s => s.display === 'popup' },
      { key: 'successAction', kind: 'select', label: 'After sending', options: [{ value: 'message', label: 'Show the thank-you message' }, { value: 'redirect', label: 'Send the visitor to another page' }] },
      { key: 'redirectUrl', kind: 'text', label: 'Send the visitor to', maxLength: 300, placeholder: 'https://… or /pages/thank-you', hint: 'An https:// link or a page on your store, starting with /.', showIf: s => s.successAction === 'redirect' },
      { key: 'notifyEmails', kind: 'text', label: 'Email every answer to', maxLength: 600, placeholder: 'you@shop.com, team@shop.com', hint: 'Up to 5 addresses, separated by commas. Every new message is also in Contact Messages.' },
      { key: 'autoReplyEnabled', kind: 'checkbox', label: 'Send the visitor an automatic reply', defaultOff: true },
      { key: 'autoReplySubject', kind: 'text', label: 'Reply subject', maxLength: 120, placeholder: 'We got your message', showIf: s => s.autoReplyEnabled === true },
      { key: 'autoReplyBody', kind: 'textarea', label: 'Reply text', rows: 5, maxLength: 2000, placeholder: 'Hi {{name}},\n\nThanks for contacting {{store}}. We received your message and will get back to you soon.', hint: 'Plain text. You can use {{name}}, {{store}} and {{form}}. Needs an Email field. Each address gets at most one automatic reply a day.', showIf: s => s.autoReplyEnabled === true },
    ]),
  },
  {
    type: 'related_products', label: 'Product Recommendations', description: 'Products shown with the one being viewed — related (same category), complementary (you pick them per product), or a fixed list. Place it on your Product template.',
    Icon: ShoppingBag, color: '#E11D48',
    defaultSettings: { heading: 'You may also like', source: 'related', columns: 4, limit: 4 },
    allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {},
    settingsSchema: withHeading([
      { key: 'source', kind: 'select', label: 'Show', clears: ['categoryId', 'collectionId'],
        hint: 'Related and Complementary only appear on a product page. For Complementary, pick the products on each product\'s edit page → "Complementary products"; a product with none shows nothing here.',
        options: [
          { value: 'related', label: 'Related products (same category, automatic)' },
          { value: 'complementary', label: 'Complementary products (I pick them per product)' },
          { value: 'category', label: 'A specific category' },
          { value: 'collection', label: 'A collection' },
          { value: 'manual', label: 'Hand-picked products (same on every product page)' },
        ] },
      { key: 'categoryId', kind: 'categoryPicker', label: 'Category', showIf: s => s.source === 'category' },
      { key: 'collectionId', kind: 'collectionPicker', label: 'Collection', showIf: s => s.source === 'collection' },
      { key: 'productIds', kind: 'productMultiPicker', label: 'Products', showIf: s => s.source === 'manual', hint: 'Shown in this order, up to 24.' },
      { key: 'columns', kind: 'number', label: 'Columns', min: 1, max: 8, hint: 'Any number from 1 to 8. Phones always show fewer.' },
      { key: 'limit', kind: 'number', label: 'How many products', min: 2, max: 12, step: 1 },
      ...cardLookFields(),
    ]),
  },
  {
    type: 'gallery_grid', label: 'Image Gallery', description: 'A grid of photos — lookbook, behind the scenes, customer photos. Each photo can link somewhere.',
    Icon: Images, color: '#A855F7',
    defaultSettings: { heading: '', columns: 3, imageRatio: 'square' },
    allowedBlockTypes: ['gallery_image'], blockLabel: 'Photo',
    defaultBlockSettings: { imageUrl: '', alt: '' },
    settingsSchema: withHeading([
      { key: 'columns', kind: 'number', label: 'Photos per row', min: 1, max: 8, hint: 'Any number from 1 to 8. Phones always show fewer.' },
      { key: 'imageRatio', kind: 'select', label: 'Image ratio', options: [{ value: 'default', label: 'Default' }, { value: 'adapt', label: 'Adapt to image' }, { value: 'portrait', label: 'Portrait' }, { value: 'square', label: 'Square' }, { value: 'landscape', label: 'Landscape' }] },
    ]),
  },
  {
    type: 'layout_grid', label: 'Free Layout (columns)', description: 'Build any layout: pick the number of columns, then drop headings, text, buttons, photos and spacers into the column you want.',
    Icon: Images, color: '#0EA5E9',
    defaultSettings: { columns: 2, template: 'equal', gap: 24, verticalAlign: 'center', stackOnMobile: true },
    allowedBlockTypes: ['layout_item'], blockLabel: 'Item',
    defaultBlockSettings: { kind: 'text', column: 1, text: 'Write something here' },
    settingsSchema: [
      { key: 'columns', kind: 'number', label: 'Columns', min: 1, max: 6, hint: '1 to 6 columns.' },
      { key: 'template', kind: 'select', label: 'Column widths', options: [{ value: 'equal', label: 'Equal' }, { value: '1-2', label: 'Narrow + wide' }, { value: '2-1', label: 'Wide + narrow' }, { value: '1-2-1', label: 'Narrow + wide + narrow' }, { value: '1-3', label: 'Small + very wide' }, { value: '3-1', label: 'Very wide + small' }, { value: '2-1-1', label: 'Wide + 2 narrow' }, { value: '1-1-2', label: '2 narrow + wide' }] },
      { key: 'gap', kind: 'number', label: 'Space between columns (px)', min: 0, max: 120 },
      { key: 'verticalAlign', kind: 'select', label: 'Vertical alignment', options: [{ value: 'start', label: 'Top' }, { value: 'center', label: 'Middle' }, { value: 'end', label: 'Bottom' }, { value: 'stretch', label: 'Stretch' }] },
      { key: 'stackOnMobile', kind: 'checkbox', label: 'Stack columns on phones' },
      { key: 'maxWidth', kind: 'number', label: 'Max width (px, blank = full)', min: 320, max: 2400 },
    ],
  },
  {
    type: 'feature_list', label: 'Feature List', description: 'An icon, a short title and a line of text for each reason to shop with you — delivery, returns, quality.',
    Icon: ListChecks, color: '#0891B2',
    defaultSettings: { heading: '', columns: 3, textAlign: 'left' },
    allowedBlockTypes: ['feature_item'], blockLabel: 'Feature',
    defaultBlockSettings: { icon: 'check', title: '', description: '' },
    settingsSchema: withHeading([
      { key: 'columns', kind: 'number', label: 'Features per row', min: 1, max: 8, hint: 'Any number from 1 to 8. Phones always show fewer.' },
      { key: 'textAlign', kind: 'select', label: 'Text alignment', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] },
    ]),
  },
  {
    type: 'team_grid', label: 'Team', description: 'Photo, name, role and a short bio for each person behind the brand.',
    Icon: Users, color: '#DB2777',
    defaultSettings: { heading: 'Meet the team', columns: 3, textAlign: 'center' },
    allowedBlockTypes: ['team_member'], blockLabel: 'Person',
    defaultBlockSettings: { name: '', role: '', bio: '', imageUrl: '' },
    settingsSchema: withHeading([
      { key: 'columns', kind: 'number', label: 'People per row', min: 1, max: 8, hint: 'Any number from 1 to 8. Phones always show fewer.' },
      { key: 'textAlign', kind: 'select', label: 'Text alignment', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] },
    ]),
  },
  {
    type: 'stats_counter', label: 'Stats Counter', description: 'Big numbers that count up on scroll — customers, orders, years in business.',
    Icon: Hash, color: '#CA8A04',
    defaultSettings: { heading: '' },
    allowedBlockTypes: ['stat_item'], blockLabel: 'Number',
    defaultBlockSettings: { value: '', label: '' },
    settingsSchema: withHeading([]),
  },
  {
    type: 'store_locations', label: 'Store Locations', description: 'Your shops or pickup points: address, phone, opening hours and a "Get directions" link.',
    Icon: MapPin, color: '#16A34A',
    defaultSettings: { heading: 'Visit us' },
    allowedBlockTypes: ['location_item'], blockLabel: 'Location',
    defaultBlockSettings: { name: '', address: '', phone: '', email: '', hours: '', mapUrl: '' },
    settingsSchema: withHeading([]),
  },
  {
    type: 'image_banner', label: 'Image Banner', description: 'A full-width image with a heading, text and button on top.',
    Icon: Image, color: '#F97316',
    defaultSettings: { imageUrl: '', heading: '', subheading: '', ctaText: '', ctaLink: { linkType: 'home' }, heightPreset: 'medium', contentAlign: 'center', contentPosition: 'middle', contentWidth: 'normal', overlayOpacity: 30 },
    allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {},
    settingsSchema: [
      { key: 'imageUrl', kind: 'image', label: 'Image' },
      { key: 'focalPoint', kind: 'focalPoint', label: 'Image focal point', hint: 'The part of the image that must stay visible when it is cropped.' },
      { key: 'imageLinkOn', kind: 'checkbox', label: 'Make the whole image a link', defaultOff: true },
      { key: 'imageLink', kind: 'link', label: 'Image link', showIf: s => s.imageLinkOn === true },
      { key: 'imageOnly', kind: 'checkbox', label: 'Show the image only (no text, button or dark layer)', defaultOff: true, hint: 'Use this when your picture already has its own words and button. Nothing is drawn on top of it and the dark layer is removed. Tip: turn on "Make the whole image a link" so shoppers can click it.' },
      { key: 'heading', kind: 'text', label: 'Heading', showIf: s => s.imageOnly !== true },
      { key: 'subheading', kind: 'text', label: 'Text', showIf: s => s.imageOnly !== true },
      { key: 'ctaText', kind: 'text', label: 'Button text', showIf: s => s.imageOnly !== true },
      { key: 'ctaLink', kind: 'link', label: 'Button link', showIf: s => s.imageOnly !== true && !!s.ctaText },
      { key: 'heightPreset', kind: 'select', label: 'Banner height', options: [
        { value: 'adapt', label: 'Adapt to image' }, { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }, { value: 'custom', label: 'Custom (my own height)' },
      ] },
      { key: 'customHeight', kind: 'number', label: 'Custom height (px)', min: 150, max: 1400, placeholder: 'e.g. 420', showIf: s => s.heightPreset === 'custom', hint: 'Any height from 150 to 1400 px.' },
      { key: 'mobileHeightPreset', kind: 'select', label: 'Banner height on mobile', showIf: s => s.heightPreset !== 'adapt', options: [
        { value: 'same', label: 'Same as desktop' }, { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }, { value: 'custom', label: 'Custom (my own height)' },
      ] },
      { key: 'mobileCustomHeight', kind: 'number', label: 'Custom height on mobile (px)', min: 150, max: 1400, placeholder: 'e.g. 300', showIf: s => s.mobileHeightPreset === 'custom' },
      { key: 'contentAlign', kind: 'select', label: 'Text alignment', half: true, showIf: s => s.imageOnly !== true, options: [
        { value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' },
      ] },
      { key: 'contentPosition', kind: 'select', label: 'Text position', half: true, showIf: s => s.imageOnly !== true, options: [
        { value: 'top', label: 'Top' }, { value: 'middle', label: 'Middle' }, { value: 'bottom', label: 'Bottom' },
      ] },
      { key: 'contentWidth', kind: 'select', label: 'Text width', showIf: s => s.imageOnly !== true, hint: 'How wide the text block may get. Narrow keeps the words in a slim column.', options: [
        { value: 'narrow', label: 'Narrow' }, { value: 'normal', label: 'Normal' }, { value: 'wide', label: 'Wide' },
      ] },
      { key: 'overlayOpacity', kind: 'number', label: 'Image overlay opacity (%)', min: 0, max: 80, step: 5, showIf: s => s.imageOnly !== true },
      { key: 'textColor', kind: 'color', label: 'Text colour', showIf: s => s.imageOnly !== true },
    ],
  },
  // ── Core/locked sections (Phase 4) — always pre-seeded, never manually
  // addable (`hidden: true`) and never removable once present (`locked: true`).
  // See `CORE_SECTION_TYPES` in `storefrontTypes.ts` for the full story. ────
  {
    type: 'product_main', label: 'Main Product', description: 'The product\'s core content — media, title, price, variant picker, quantity and buy buttons. Always shown on this product\'s page; hide or reorder individual items below.',
    Icon: ShoppingBag, color: '#D97757',
    defaultSettings: {}, allowedBlockTypes: ['product_media', 'product_title', 'product_price', 'product_variant_picker', 'product_quantity', 'product_buy_buttons', 'product_description'], blockLabel: 'Item',
    defaultBlockSettings: {}, hidden: true, locked: true,
    addableBlockTypes: ['product_buy_now', 'product_collapsible_tab', 'product_size_chart', 'product_text', 'product_pickup', 'product_trust_badges', 'product_questions', 'product_frequently_bought'],
    settingsSchema: [],
  },
  {
    type: 'search_results', label: 'Search Results', description: 'The live product grid shown for whatever a buyer searches. Always present on the Search page.',
    Icon: Search, color: '#0EA5E9',
    defaultSettings: {}, allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {}, hidden: true, locked: true,
    settingsSchema: [],
  },
  {
    type: 'cart_items', label: 'Cart Contents', description: 'The buyer\'s cart line items. Always present on the Cart page.',
    Icon: ShoppingCart, color: '#059669',
    defaultSettings: {}, allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {}, hidden: true, locked: true,
    settingsSchema: [],
  },
  {
    type: 'cart_summary', label: 'Cart Summary', description: 'Subtotal, shipping and the checkout button. Always present on the Cart page.',
    Icon: Receipt, color: '#7C3AED',
    defaultSettings: {}, allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {}, hidden: true, locked: true,
    settingsSchema: [],
  },
  {
    type: 'blog_post_list', label: 'Blog Posts', description: 'The list of your published blog posts. Always present on the Blog index page.',
    Icon: Newspaper, color: '#DC2626',
    defaultSettings: {}, allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {}, hidden: true, locked: true,
    settingsSchema: [],
  },
  {
    type: 'article_content', label: 'Article Content', description: 'The article\'s title and body. Always present on a Blog Article page.',
    Icon: FileText, color: '#4F46E5',
    defaultSettings: {}, allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {}, hidden: true, locked: true,
    settingsSchema: [],
  },
  {
    type: 'saved_section', label: 'Saved section', description: 'A section you built once and reuse. Changing it changes every page that uses it.',
    Icon: Bookmark, color: '#0D9488',
    defaultSettings: {}, allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {}, hidden: true,
    settingsSchema: [],
  },
  {
    type: 'page_content', label: 'Main content', description: 'The form or list this page is built around (sign in, orders, checkout ...). Always present; add sections above or below it.',
    Icon: FileText, color: '#475569',
    defaultSettings: {}, allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {}, hidden: true, locked: true,
    settingsSchema: [],
  },
];

export const SECTION_META_BY_TYPE: Record<SectionType, SectionMeta> = Object.fromEntries(SECTION_META.map(m => [m.type, m])) as Record<SectionType, SectionMeta>;

export const FOOTER_WIDTH_OPTIONS = [
  { value: 'auto', label: 'Automatic (share the row)' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'third', label: 'One third' },
  { value: 'half', label: 'Half' },
  { value: 'full', label: 'Full width' },
];

// ── Block settings schemas ──────────────────────────────────────────────────
// Every block type below drives `SchemaForm` in `BlockFields.tsx`, keyed by
// its `type` string — `nav_link`/`footer_column` are the one deliberate
// exception (recursive nested-link-list editors, kept hand-written; see
// `BlockFields.tsx`'s own comment). This is also where the migration closed
// real, previously-disclosed gaps against the backend validator
// (`section-settings.validator.ts`): `heading.level`, `testimonial.avatarUrl`,
// and `list.style` were all accepted by the server but had no editor field
// at all before this.
//
// Deliberately NOT carried forward from the old hand-written `BlockFields.tsx`:
// `feature_item`, `menu_item`, `team_member`, `stat_item`, `gallery_image` —
// none of these are referenced by any `allowedBlockTypes` above (verified by
// grep), and the backend validator has no matching case for any of them
// either (it has `lookbook_item`/`gallery_item`/`farm_story_step`/
// `craft_process_step`/`spec_row` instead, for the 5 section types that have
// no theme renderer yet — see the comment on those types in
// `storefrontTypes.ts`). They were dead, unreachable editor code left over
// from the deleted legacy 12-theme engine; not migrated.
export const BLOCK_SCHEMAS: Record<string, FieldSchema[]> = {
  multirow_row: [
    { key: 'imageUrl', kind: 'image', label: 'Image' },
    { key: 'imageLinkOn', kind: 'checkbox', label: 'Make the whole image a link', defaultOff: true },
    { key: 'imageLink', kind: 'link', label: 'Image link', showIf: s => s.imageLinkOn === true },
    { key: 'heading', kind: 'text', label: 'Heading', maxLength: 120 },
    { key: 'body', kind: 'richtext', label: 'Text', rows: 8, hint: 'Press Enter for a new paragraph. Use the toolbar for headings, bold, lists and links.' },
    { key: 'ctaText', kind: 'text', label: 'Button text', maxLength: 40 },
    { key: 'ctaLink', kind: 'link', label: 'Button link', showIf: s => !!s.ctaText },
    { key: 'focalPoint', kind: 'focalPoint', label: 'Image focal point' },
  ],
  collage_item: [
    { key: 'imageUrl', kind: 'image', label: 'Image', required: true },
    { key: 'heading', kind: 'text', label: 'Caption', maxLength: 80 },
    { key: 'link', kind: 'link', label: 'Link (optional)' },
  ],
  // ── Main Product blocks with settings ──
  product_variant_picker: [
    { key: 'pickerStyle', kind: 'select', label: 'Style', options: [
      { value: 'pills', label: 'Buttons (pills)' }, { value: 'dropdown', label: 'Dropdown' },
      { value: 'swatches', label: 'Colour swatches' }, { value: 'images', label: 'Picture tiles' },
    ], hint: 'Swatches suit colour options (Red, Navy Blue, #ff0000...); picture tiles need every value to have a variant photo. Other options, such as Size, keep buttons.' },
    { key: 'swatchShape', kind: 'select', label: 'Swatch shape', half: true, showIf: s => s.pickerStyle === 'swatches' || s.pickerStyle === 'images', options: [{ value: 'circle', label: 'Round' }, { value: 'square', label: 'Rounded square' }] },
    { key: 'swatchSize', kind: 'select', label: 'Swatch size', half: true, showIf: s => s.pickerStyle === 'swatches' || s.pickerStyle === 'images', options: [{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }] },
  ],
  product_buy_now: [
    { key: 'label', kind: 'text', label: 'Button text', maxLength: 40, placeholder: 'Buy it now', hint: 'Adds the item and goes straight to checkout. Shown only when Buy buttons are on.' },
  ],
  product_specs: [
    { key: 'showAsTab', kind: 'checkbox', label: 'Show as a tab next to Description', defaultOff: true },
    { key: 'title', kind: 'text', label: 'Tab name', maxLength: 40, placeholder: 'Additional information', showIf: s => s.showAsTab === true },
  ],
  product_collapsible_tab: [
    { key: 'title', kind: 'text', label: 'Heading', required: true, maxLength: 80, placeholder: 'Materials & care' },
    { key: 'content', kind: 'textarea', label: 'Content', rows: 5, maxLength: 5000 },
    { key: 'openByDefault', kind: 'checkbox', label: 'Open by default', defaultOff: true },
    { key: 'showAsTab', kind: 'checkbox', label: 'Show as a tab next to Description', defaultOff: true, hint: 'Shows this on every product as a tab beside Description (e.g. Delivery policy, Shipping and Return).' },
  ],
  product_share: [
    { key: 'customLinks', kind: 'shareNetworks', label: 'Share networks', hint: 'Choose which networks the Share popup offers, or add any other site. Copy link is always there, and phones also get their own share menu.' },
  ],
  product_pickup: [
    { key: 'heading', kind: 'text', label: 'Heading', maxLength: 60, placeholder: 'Pickup', hint: 'Shown when you have an active Local pickup option in Shipping and the item is in stock. The place, address and instructions come from that pickup option.' },
  ],
  product_text: [
    { key: 'text', kind: 'textarea', label: 'Text', rows: 3, maxLength: 1000, hint: 'A short note under the buy box, e.g. "Free returns within 14 days". Add the block again for more lines.' },
    { key: 'size', kind: 'select', label: 'Text size', options: [
      { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' },
    ] },
  ],
  product_size_chart: [
    { key: 'label', kind: 'text', label: 'Link text', maxLength: 40, placeholder: 'Size chart' },
    { key: 'title', kind: 'text', label: 'Popup heading', maxLength: 80 },
    { key: 'imageUrl', kind: 'image', label: 'Chart image' },
    { key: 'content', kind: 'textarea', label: 'Chart text', rows: 5, maxLength: 5000, hint: 'Add an image, text, or both.' },
  ],
  social_link: [
    { key: 'platform', kind: 'select', label: 'Platform', half: true, options:
      ['facebook', 'instagram', 'x', 'tiktok', 'youtube', 'linkedin', 'whatsapp'].map(p => ({ value: p, label: p })) },
    { key: 'url', kind: 'text', label: 'Link or WhatsApp number', half: true, placeholder: 'https://… or @username or +92 300 1234567', hint: 'Paste your page link, or just your @username. For WhatsApp type your number. A social icon with no link is not shown on your store.' },
  ],
  copyright_text: [
    { key: 'text', kind: 'text', label: 'Copyright text', hint: "Leave blank to show a default © line with your store name." },
  ],
  footer_text: [
    { key: 'width', kind: 'select', label: 'Column width', options: FOOTER_WIDTH_OPTIONS },
    { key: 'heading', kind: 'text', label: 'Heading', maxLength: 60, placeholder: 'About us' },
    { key: 'text', kind: 'textarea', label: 'Text', rows: 4, maxLength: 600 },
  ],
  footer_brand: [
    { key: 'width', kind: 'select', label: 'Column width', options: FOOTER_WIDTH_OPTIONS },
    { key: 'text', kind: 'textarea', label: 'About text', rows: 3, maxLength: 600, hint: 'Shown under your logo. The logo itself is set in Footer settings below.' },
    { key: 'showTagline', kind: 'checkbox', label: 'Show store tagline' },
    { key: 'showSocial', kind: 'checkbox', label: 'Show social icons', hint: 'Add Social link blocks to choose which icons appear.' },
  ],
  footer_newsletter: [
    { key: 'width', kind: 'select', label: 'Column width', options: FOOTER_WIDTH_OPTIONS },
    { key: 'heading', kind: 'text', label: 'Heading', maxLength: 60, placeholder: 'Stay in the loop' },
    { key: 'text', kind: 'textarea', label: 'Text', rows: 2, maxLength: 160 },
  ],
  footer_image: [
    { key: 'width', kind: 'select', label: 'Column width', options: FOOTER_WIDTH_OPTIONS },
    { key: 'imageUrl', kind: 'image', label: 'Image', required: true },
    { key: 'heading', kind: 'text', label: 'Heading', maxLength: 60 },
    { key: 'alt', kind: 'text', label: 'Image description (alt text)', maxLength: 120 },
    { key: 'link', kind: 'link', label: 'Image link', hint: 'Where customers go when they click the image. Home page by default.' },
    { key: 'imageWidth', kind: 'number', label: 'Width (px)', min: 40, max: 400, step: 10 },
  ],
  footer_contact: [
    { key: 'width', kind: 'select', label: 'Column width', options: FOOTER_WIDTH_OPTIONS },
    { key: 'heading', kind: 'text', label: 'Column title', placeholder: 'Contact', maxLength: 60 },
    { key: 'email', kind: 'text', label: 'Email', placeholder: 'hello@yourstore.com', maxLength: 120, half: true },
    { key: 'phone', kind: 'text', label: 'Phone', placeholder: '+92 300 1234567', maxLength: 40, half: true },
    { key: 'address', kind: 'textarea', label: 'Address', rows: 3, maxLength: 240 },
    { key: 'hours', kind: 'textarea', label: 'Opening hours', rows: 2, maxLength: 160, placeholder: 'Mon–Sat, 10am–8pm' },
  ],
  hero_slide: [
    { key: 'imageUrl', kind: 'image', label: 'Image', required: true },
    { key: 'focalPoint', kind: 'focalPoint', label: 'Image focal point', hint: 'The part of the image that must stay visible when it is cropped (small screens, fixed heights).' },
    { key: 'imageOnly', kind: 'checkbox', label: 'Show the image only (no text, button or dark layer)', defaultOff: true, hint: 'Use this when your picture already has its own words and button. Nothing is drawn on top of it and the dark layer is removed. Tip: turn on "Make the whole slide a link" so shoppers can click it.' },
    { key: 'heading', kind: 'text', label: 'Heading', showIf: s => s.imageOnly !== true },
    { key: 'subheading', kind: 'text', label: 'Subheading', showIf: s => s.imageOnly !== true },
    { key: 'slideLinkOn', kind: 'checkbox', label: 'Make the whole slide a link', defaultOff: true },
    { key: 'slideLink', kind: 'link', label: 'Slide link', showIf: s => s.slideLinkOn === true },
    { key: 'ctaText', kind: 'text', label: 'Button text', hint: 'Leave empty for no button.', showIf: s => s.imageOnly !== true },
    { key: 'ctaLink', kind: 'link', label: 'Button link', showIf: s => s.imageOnly !== true && !!s.ctaText },
    // Alignment + text colour work in both themes. Overlay only exists where text sits ON the image (another theme); Maison's split layout ignores it.
    { key: 'contentAlign', kind: 'select', label: 'Text alignment', half: true, showIf: s => s.imageOnly !== true, options: [
      { value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' },
    ] },
    { key: 'contentPosition', kind: 'select', label: 'Text position', half: true, showIf: s => s.imageOnly !== true, options: [
      { value: 'top', label: 'Top' }, { value: 'middle', label: 'Middle' }, { value: 'bottom', label: 'Bottom' },
    ] },
    { key: 'contentWidth', kind: 'select', label: 'Text width', showIf: s => s.imageOnly !== true, hint: 'How wide the text block may get. Narrow keeps the words in a slim column.', options: [
      { value: 'narrow', label: 'Narrow' }, { value: 'normal', label: 'Normal' }, { value: 'wide', label: 'Wide' },
    ] },
    { key: 'overlayOpacity', kind: 'number', label: 'Image overlay opacity (%)', half: true, showIf: s => s.imageOnly !== true, min: 0, max: 80, step: 5, hint: 'Darkens the image behind the text. Only themes that put text over the image use it . Blank = theme default.' },
    { key: 'textColor', kind: 'color', label: 'Text colour', showIf: s => s.imageOnly !== true },
  ],
  // "Dynamic Sources" — dynamicSourceKey, when set, binds this block's
  // `text` to one of the store's own real custom fields instead of a
  // static value (namespace is always 'custom' — resolved at render time,
  // see `FashionContentBlocks.tsx`). A real
  // dropdown of the store's own definitions, not two raw text inputs a
  // seller had to type exact-match by hand (silently no-op'd on any typo —
  // found during the Catalog audit; Phase 9 also closed the "silent no-op"
  // half server-side — see `MetafieldsService.assertDynamicSourceBindingsValid`).
  // `MetafieldKeyPickerField` resolves which resource type's fields to
  // offer from the real editing context (Product/Collection Template, a
  // custom Page, Blog Article Template) — a scope with no single real
  // resource (Home, Search, Cart, Blog Index) shows an explanatory disabled
  // state instead of an empty/misleading picker.
  heading: [
    { key: 'text', kind: 'text', label: 'Heading text', maxLength: 150, hint: 'Leave blank if binding to a custom field below.' },
    { key: 'dynamicSourceKey', kind: 'metafieldKeyPicker', label: 'Or bind to a custom field (optional)', pairsWith: 'text' },
    { key: 'level', kind: 'select', label: 'Size', options: [
      { value: 'h2', label: 'Large (H2)' }, { value: 'h3', label: 'Medium (H3)' }, { value: 'h4', label: 'Small (H4)' },
    ] },
  ],
  paragraph: [
    { key: 'text', kind: 'richtext', label: 'Paragraph text', rows: 8, hint: 'Press Enter for a new paragraph. Use the toolbar for headings, bold, lists and links. Leave blank if binding to a custom field below.' },
    { key: 'dynamicSourceKey', kind: 'metafieldKeyPicker', label: 'Or bind to a custom field (optional)', pairsWith: 'text' },
  ],
  image: [
    { key: 'imageUrl', kind: 'image', label: 'Image' },
    { key: 'alt', kind: 'text', label: 'Alt text', hint: 'Describes the image for screen readers and search engines.' },
    { key: 'caption', kind: 'text', label: 'Caption (optional)' },
  ],
  quote: [
    { key: 'text', kind: 'textarea', label: 'Quote', required: true, maxLength: 500 },
    { key: 'author', kind: 'text', label: 'Author (optional)' },
  ],
  list: [
    { key: 'items', kind: 'itemList', label: 'Items', max: 20 },
    { key: 'style', kind: 'select', label: 'Style', options: [
      { value: 'bullet', label: 'Bullet' }, { value: 'numbered', label: 'Numbered' },
    ] },
  ],
  divider: [],
  collection_item: [
    { key: 'collectionId', kind: 'collectionPicker', label: 'Collection', hint: 'Its name, description, image and link are used unless you type your own below.' },
    { key: 'title', kind: 'text', label: 'Title (optional)', maxLength: 120, hint: 'Leave empty to use the collection name.' },
    { key: 'description', kind: 'textarea', label: 'Description (optional)', maxLength: 400, rows: 3, hint: 'Leave empty to use the collection description (if "Show description" is on).' },
    { key: 'icon', kind: 'select', label: 'Icon (optional)', options: COLLECTION_ICON_OPTIONS, hint: 'Shown above the title. Ignored when an image is set.' },
    { key: 'imageUrl', kind: 'image', label: 'Image (optional)', hint: 'Leave empty to use the collection image.' },
    { key: 'ctaText', kind: 'text', label: 'Button text (optional)', maxLength: 40, placeholder: 'Shop now →' },
    { key: 'ctaLink', kind: 'link', label: 'Button link', showIf: s => !!s.ctaText, hint: 'Leave on the default to open the collection.' },
  ],
  multicolumn_column: [
    { key: 'imageUrl', kind: 'image', label: 'Image' },
    { key: 'imageLinkOn', kind: 'checkbox', label: 'Make the whole image a link', defaultOff: true },
    { key: 'imageLink', kind: 'link', label: 'Image link', showIf: s => s.imageLinkOn === true },
    { key: 'heading', kind: 'text', label: 'Heading', maxLength: 120 },
    { key: 'body', kind: 'richtext', label: 'Text', rows: 6, hint: 'Press Enter for a new paragraph. Use the toolbar for headings, bold, lists and links.' },
    { key: 'ctaText', kind: 'text', label: 'Button text' },
    { key: 'ctaLink', kind: 'link', label: 'Button link', showIf: s => !!s.ctaText },
  ],
  mosaic_image: [
    { key: 'imageUrl', kind: 'image', label: 'Image', required: true },
    { key: 'link', kind: 'link', label: 'Where it goes when clicked', hint: 'Optional: a page, product, collection or your own link.' },
    { key: 'colSpan', kind: 'number', label: 'Columns this image takes', min: 1, max: 12, half: true, hint: '1 = one cell, 2 = twice as wide…' },
    { key: 'rowSpan', kind: 'number', label: 'Rows this image takes', min: 1, max: 12, half: true, hint: '2 = twice as tall…' },
    { key: 'caption', kind: 'text', label: 'Text on the image (optional)', maxLength: 100 },
    { key: 'alt', kind: 'text', label: 'Image description (for accessibility)', maxLength: 150 },
    { key: 'focalPoint', kind: 'focalPoint', label: 'Image focal point' },
  ],
  collection_column: [
    { key: 'heading', kind: 'text', label: 'Column heading', maxLength: 80, placeholder: 'Household Range' },
    { key: 'source', kind: 'select', label: 'Which products', clears: ['categoryId', 'collectionId'], options: [
      { value: 'collection', label: 'A collection' }, { value: 'category', label: 'A category' }, { value: 'bestsellers', label: 'Best sellers' },
      { value: 'newArrivals', label: 'New arrivals' }, { value: 'trending', label: 'Trending' }, { value: 'onSale', label: 'On sale' }, { value: 'manual', label: 'Hand-picked products' },
    ] },
    { key: 'collectionId', kind: 'collectionPicker', label: 'Collection', showIf: s => s.source === 'collection' },
    { key: 'categoryId', kind: 'categoryPicker', label: 'Category', showIf: s => s.source === 'category' },
    { key: 'productIds', kind: 'productMultiPicker', label: 'Products', showIf: s => s.source === 'manual' },
    { key: 'limit', kind: 'number', label: 'How many products', min: 1, max: 24, half: true },
    { key: 'hideSoldOut', kind: 'checkbox', label: 'Hide sold-out products', defaultOff: true },
    { key: 'headingLinkOn', kind: 'checkbox', label: 'Make the heading a link to that page', defaultOff: true },
    { key: 'viewAllText', kind: 'text', label: 'This column\'s "View all" text', maxLength: 40 },
    { key: 'headingColor', kind: 'color', label: 'This column\'s heading colour', half: true },
    { key: 'bgColor', kind: 'color', label: 'This column\'s background', half: true },
  ],
  promo_card: [
    { key: 'imageUrl', kind: 'image', label: 'Image' },
    { key: 'imageLinkOn', kind: 'checkbox', label: 'Make the whole image a link', defaultOff: true },
    { key: 'imageLink', kind: 'link', label: 'Image link', showIf: s => s.imageLinkOn === true },
    { key: 'imageFit', kind: 'select', label: 'Image fit', half: true, options: [{ value: 'cover', label: 'Fill the space (crop)' }, { value: 'contain', label: 'Show the whole image' }] },
    { key: 'focalPoint', kind: 'focalPoint', label: 'Image focal point', showIf: s => s.imageFit !== 'contain' },
    { key: 'eyebrow', kind: 'text', label: 'Small label above', maxLength: 60, placeholder: 'Aqua Mesh' },
    { key: 'heading', kind: 'text', label: 'Heading', maxLength: 120 },
    { key: 'body', kind: 'textarea', label: 'Text', rows: 4, maxLength: 600, hint: 'Formatting: **bold**, *italic*, [link text](https://…)' },
    { key: 'ctaText', kind: 'text', label: 'Button 1 text', maxLength: 40, half: true },
    { key: 'ctaStyle', kind: 'select', label: 'Button 1 style', half: true, showIf: s => !!s.ctaText, options: [{ value: 'solid', label: 'Filled' }, { value: 'outline', label: 'Outline' }, { value: 'link', label: 'Text link' }] },
    { key: 'ctaLink', kind: 'link', label: 'Button 1 link', showIf: s => !!s.ctaText },
    { key: 'cta2Text', kind: 'text', label: 'Button 2 text (optional)', maxLength: 40, half: true },
    { key: 'cta2Style', kind: 'select', label: 'Button 2 style', half: true, showIf: s => !!s.cta2Text, options: [{ value: 'solid', label: 'Filled' }, { value: 'outline', label: 'Outline' }, { value: 'link', label: 'Text link' }] },
    { key: 'cta2Link', kind: 'link', label: 'Button 2 link', showIf: s => !!s.cta2Text },
    { key: 'layout', kind: 'select', label: 'Layout of this card', options: [
      { value: '', label: 'Same as the section' }, { value: 'image-left', label: 'Image on the left' }, { value: 'image-right', label: 'Image on the right' },
      { value: 'image-top', label: 'Image on top' }, { value: 'image-bottom', label: 'Image below' }, { value: 'overlay', label: 'Image as the background' },
    ] },
    { key: 'colSpan', kind: 'number', label: 'Columns this card takes', min: 1, max: 12, half: true, hint: 'Make one card wider than the others.' },
    { key: 'cardHeight', kind: 'number', label: 'This card\'s height (px)', min: 0, max: 2000, half: true, hint: 'Empty = the section\'s.' },
    { key: 'bgColor', kind: 'color', label: 'Card background', half: true, hint: 'Empty = the theme\'s colour.' },
    { key: 'textColor', kind: 'color', label: 'Text colour', half: true },
    { key: 'buttonBg', kind: 'color', label: 'Button colour', half: true },
    { key: 'buttonText', kind: 'color', label: 'Button text colour', half: true },
    { key: 'overlayOpacity', kind: 'number', label: 'Darken the image (%)', min: 0, max: 100, showIf: s => s.layout === 'overlay', hint: 'Only for "Image as the background".' },
  ],
  feature_item: [
    { key: 'icon', kind: 'select', label: 'Icon', options: FEATURE_ICON_OPTIONS },
    { key: 'title', kind: 'text', label: 'Title', required: true, maxLength: 80, placeholder: 'Free delivery' },
    { key: 'description', kind: 'textarea', label: 'Text', required: true, maxLength: 300, rows: 3, hint: 'Formatting: **bold**, *italic*, [link text](https://…)' },
  ],
  team_member: [
    { key: 'imageUrl', kind: 'image', label: 'Photo (optional)', hint: 'Without a photo the person\'s initials are shown.' },
    { key: 'name', kind: 'text', label: 'Name', required: true, maxLength: 80 },
    { key: 'role', kind: 'text', label: 'Role', required: true, maxLength: 80, placeholder: 'Founder' },
    { key: 'bio', kind: 'textarea', label: 'Short bio', maxLength: 300, rows: 3 },
  ],
  stat_item: [
    { key: 'value', kind: 'text', label: 'Number', required: true, maxLength: 20, placeholder: '10k+', hint: 'Digits count up when shown, e.g. 10k+, 4.8, 1,200.' },
    { key: 'label', kind: 'text', label: 'Label', required: true, maxLength: 60, placeholder: 'Happy customers' },
  ],
  gallery_image: [
    { key: 'imageUrl', kind: 'image', label: 'Photo', required: true },
    { key: 'alt', kind: 'text', label: 'Alt text', maxLength: 150, hint: 'Describe the photo for screen readers.' },
    { key: 'caption', kind: 'text', label: 'Text below the photo (optional)', maxLength: 200 },
    { key: 'link', kind: 'link', label: 'Link (optional)' },
  ],
  layout_item: [
    { key: 'kind', kind: 'select', label: 'Item type', options: [{ value: 'heading', label: 'Heading' }, { value: 'text', label: 'Text' }, { value: 'button', label: 'Button' }, { value: 'image', label: 'Image' }, { value: 'spacer', label: 'Empty space' }, { value: 'divider', label: 'Divider line' }] },
    { key: 'column', kind: 'number', label: 'Which column (1, 2, 3...)', min: 1, max: 8 },
    { key: 'text', kind: 'textarea', label: 'Text (heading / text)', rows: 4, maxLength: 5000 },
    { key: 'headingTag', kind: 'select', label: 'Heading level', options: [{ value: 'h2', label: 'H2' }, { value: 'h1', label: 'H1' }, { value: 'h3', label: 'H3' }, { value: 'h4', label: 'H4' }] },
    { key: 'imageUrl', kind: 'image', label: 'Photo (image)' },
    { key: 'alt', kind: 'text', label: 'Alt text', maxLength: 150 },
    { key: 'buttonLabel', kind: 'text', label: 'Button label', maxLength: 40 },
    { key: 'buttonStyle', kind: 'select', label: 'Button style', options: [{ value: 'solid', label: 'Solid' }, { value: 'outline', label: 'Outline' }, { value: 'link', label: 'Text link' }] },
    { key: 'link', kind: 'link', label: 'Link (button / image)' },
    { key: 'height', kind: 'number', label: 'Height (px, empty space)', min: 0, max: 600 },
  ],
  location_item: [
    { key: 'name', kind: 'text', label: 'Name', required: true, maxLength: 80, placeholder: 'Main branch' },
    { key: 'address', kind: 'textarea', label: 'Address', rows: 3, maxLength: 240 },
    { key: 'phone', kind: 'text', label: 'Phone', maxLength: 40, half: true },
    { key: 'email', kind: 'text', label: 'Email', maxLength: 120, half: true },
    { key: 'hours', kind: 'textarea', label: 'Opening hours', rows: 2, maxLength: 160, placeholder: 'Mon–Sat, 10am–8pm' },
    { key: 'mapUrl', kind: 'url', label: 'Directions link', placeholder: 'https://maps.google.com/…', hint: 'A Google / Apple Maps link.' },
    { key: 'directionsLabel', kind: 'text', label: 'Directions link text', maxLength: 40, placeholder: 'Get directions →', showIf: s => !!s.mapUrl },
  ],
  logo_item: [
    { key: 'imageUrl', kind: 'image', label: 'Logo', required: true },
    { key: 'alt', kind: 'text', label: 'Alt text', hint: 'The brand name, for screen readers.' },
    { key: 'link', kind: 'link', label: 'Link (optional)' },
  ],
  marquee_item: [
    { key: 'text', kind: 'text', label: 'Message', required: true, maxLength: 120 },
    { key: 'link', kind: 'link', label: 'Link (optional)' },
  ],
  image_text_pair: [
    { key: 'imageUrl', kind: 'image', label: 'Image', required: true },
    { key: 'imageLinkOn', kind: 'checkbox', label: 'Make the whole image a link', defaultOff: true },
    { key: 'imageLink', kind: 'link', label: 'Image link', showIf: s => s.imageLinkOn === true },
    ...eyebrowFields(),
    { key: 'heading', kind: 'text', label: 'Heading' },
    { key: 'body', kind: 'richtext', label: 'Body', rows: 6, hint: 'Press Enter for a new paragraph. Use the toolbar for headings, bold, lists and links.' },
    { key: 'ctaText', kind: 'text', label: 'Button text' },
    { key: 'ctaLink', kind: 'link', label: 'Button link', showIf: s => !!s.ctaText },
    { key: 'imagePosition', kind: 'select', label: 'Image position', options: [
      { value: 'left', label: 'Left' }, { value: 'right', label: 'Right' },
    ] },
    { key: 'imageRatio', kind: 'select', label: 'Image ratio', options: IMAGE_RATIO_OPTIONS },
    { key: 'focalPoint', kind: 'focalPoint', label: 'Image focal point', showIf: s => s.imageRatio !== 'adapt', hint: 'The part of the image that stays visible when it is cropped.' },
  ],
  testimonial: [
    { key: 'title', kind: 'text', label: 'Title (optional)', maxLength: 120, hint: 'A short headline shown above the quote.' },
    { key: 'quote', kind: 'textarea', label: 'Quote', maxLength: 500, required: true },
    { key: 'description', kind: 'textarea', label: 'Description (optional)', maxLength: 1000, rows: 3, hint: 'A longer text shown below the quote.' },
    { key: 'authorName', kind: 'text', label: 'Author name', half: true, required: true, maxLength: 100 },
    { key: 'authorRole', kind: 'text', label: 'Author role', half: true, maxLength: 100 },
    { key: 'subtitle', kind: 'text', label: 'Subtitle (optional)', maxLength: 120, hint: 'A short tagline shown under the author name.' },
    { key: 'avatarUrl', kind: 'image', label: 'Photo (optional)', hint: 'Shown where the "Photo position" setting places it.' },
    { key: 'rating', kind: 'number', label: 'Rating (1-5)', min: 1, max: 5 },
  ],
  faq_item: [
    { key: 'question', kind: 'text', label: 'Question', required: true, maxLength: 200 },
    { key: 'answer', kind: 'textarea', label: 'Answer', required: true, maxLength: 2000 },
  ],
  trust_badge_item: [
    { key: 'icon', kind: 'select', label: 'Icon', half: true, options: [
      { value: 'truck', label: 'Shipping' }, { value: 'shield', label: 'Buyer Protection' },
      { value: 'refresh', label: 'Easy Returns' }, { value: 'headset', label: 'Support' }, { value: 'lock', label: 'Secure Payment' },
    ] },
    { key: 'text', kind: 'text', label: 'Text', half: true, required: true, maxLength: 80 },
  ],
  // product_main's 7 fixed blocks — no settings, purely enable/disable +
  // reorder of an already-real, already-rendered piece of the product page.
  product_media: [
    { key: 'layout', kind: 'select', label: 'Photo layout', options: [
      { value: 'thumbs_left', label: 'Big photo, thumbnails beside it (default)' }, { value: 'thumbs_bottom', label: 'Big photo, thumbnails below' },
      { value: 'grid', label: 'All photos in a grid (2 columns)' }, { value: 'stacked', label: 'All photos stacked, one under another' },
    ], hint: 'Grid and stacked show every photo big. A product with a video keeps the big-photo layout so the video is not lost.' },
    { key: 'aspect', kind: 'select', label: 'Photo shape', options: [
      { value: 'portrait', label: 'Portrait (4:5)' }, { value: 'square', label: 'Square' }, { value: 'landscape', label: 'Landscape (4:3)' }, { value: 'natural', label: 'Natural (as uploaded)' },
    ] },
    { key: 'zoom', kind: 'checkbox', label: 'Click a photo to zoom', hint: 'On by default.' },
  ],
  product_trust_badges: [],
  product_questions: [
    { key: 'heading', kind: 'text', label: 'Heading', maxLength: 60, placeholder: 'Questions & answers' },
    { key: 'showForm', kind: 'checkbox', label: 'Let shoppers ask questions', hint: 'A new question waits in Customers > Product questions until you answer it. Only answered questions show on the page.' },
  ],
  product_frequently_bought: [
    { key: 'heading', kind: 'text', label: 'Heading', maxLength: 60, placeholder: 'Frequently bought together' },
    { key: 'maxItems', kind: 'number', label: 'Items next to this product', min: 1, max: 3, hint: 'Taken from the "Complete the look" / related products you set on the product, then automatic picks.' },
    { key: 'buttonLabel', kind: 'text', label: 'Button text', maxLength: 30, placeholder: 'Add selected to cart' },
  ],
  product_title: [],
  product_price: [],
  product_quantity: [],
  product_buy_buttons: [
    { key: 'addToCartLabel', kind: 'text', label: '"Add to cart" text', maxLength: 30, placeholder: 'Add to Cart', half: true },
    { key: 'soldOutLabel', kind: 'text', label: '"Sold out" text', maxLength: 30, placeholder: 'Sold out', half: true },
    { key: 'preorderLabel', kind: 'text', label: '"Pre-order" text', maxLength: 30, placeholder: 'Pre-order', half: true },
  ],
  product_description: [
    { key: 'heading', kind: 'text', label: 'Heading', maxLength: 40, placeholder: 'Description' },
  ],
};
