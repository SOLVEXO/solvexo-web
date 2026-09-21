import { Image, Type, Star, LayoutGrid, LayoutList, Columns, Quote, HelpCircle, Video, Grid3x3, ShieldCheck, Mail, Timer, Boxes, ShoppingBag, Search, ShoppingCart, Receipt, Newspaper, FileText, type LucideIcon } from 'lucide-react';
import type { SectionType } from '@/api/services/storefrontTypes';
import type { FieldSchema } from './SchemaForm';

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

// Shared by `product_catalog` and `collection_product_grid` — identical sort/columns controls on both product-grid section types.
const SORT_COLUMNS_FIELDS: FieldSchema[] = [
  { key: 'defaultSort', kind: 'select', label: 'Default sort', options: [
    { value: 'newest', label: 'Newest' }, { value: 'price_asc', label: 'Price: Low–High' },
    { value: 'price_desc', label: 'Price: High–Low' }, { value: 'best_rated', label: 'Best Rated' },
  ] },
  { key: 'columns', kind: 'select', label: 'Columns', numeric: true, options: [
    { value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' },
  ] },
];

export const SECTION_META: SectionMeta[] = [
  {
    type: 'hero', label: 'Hero / Slider', description: 'Full-width image slides with a headline and call-to-action button.',
    Icon: Image, color: '#D97757',
    defaultSettings: { heightPreset: 'medium' },
    allowedBlockTypes: ['hero_slide'], blockLabel: 'Slide',
    defaultBlockSettings: { imageUrl: '', heading: '', subheading: '', ctaText: '', ctaLink: { linkType: 'home' } },
    settingsSchema: [
      { key: 'heightPreset', kind: 'select', label: 'Height', options: [
        { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' },
      ] },
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
    defaultSettings: { heading: 'Featured', source: 'pinned', limit: 8 },
    allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {},
    settingsSchema: withHeading([
      { key: 'source', kind: 'select', label: 'Source', clears: ['categoryId', 'collectionId'], options: [
        { value: 'pinned', label: 'Pinned / Featured' }, { value: 'bestsellers', label: 'Best Sellers' },
        { value: 'newArrivals', label: 'New Arrivals' }, { value: 'trending', label: 'Trending' },
        { value: 'onSale', label: 'On Sale' }, { value: 'category', label: 'A specific category' },
        { value: 'collection', label: 'A collection' }, { value: 'manual', label: 'Hand-picked products' },
      ] },
      { key: 'categoryId', kind: 'categoryPicker', label: 'Category', showIf: s => s.source === 'category' },
      { key: 'collectionId', kind: 'collectionPicker', label: 'Collection', showIf: s => s.source === 'collection' },
      // Real product picker, not a raw comma-separated ID paste field — the
      // last surviving one of those in the whole builder, closed here.
      { key: 'productIds', kind: 'productMultiPicker', label: 'Products', showIf: s => s.source === 'manual' },
      { key: 'limit', kind: 'number', label: 'How many to show', min: 1, max: 24 },
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
    type: 'testimonials', label: 'Testimonials', description: 'Customer quotes with a name, role, and star rating.',
    Icon: Quote, color: '#A855F7',
    defaultSettings: { heading: 'What buyers say' },
    allowedBlockTypes: ['testimonial'], blockLabel: 'Testimonial',
    defaultBlockSettings: { quote: '', authorName: '', rating: 5 },
    settingsSchema: withHeading([]), // content lives entirely in blocks — matches the backend validator, which validates no section-level settings for this type either
  },
  {
    type: 'faq', label: 'FAQ', description: 'A list of collapsible question/answer pairs.',
    Icon: HelpCircle, color: '#EC4899',
    defaultSettings: { heading: 'Frequently Asked Questions' },
    allowedBlockTypes: ['faq_item'], blockLabel: 'Question',
    defaultBlockSettings: { question: '', answer: '' },
    settingsSchema: withHeading([]),
  },
  {
    type: 'video', label: 'Video', description: 'A YouTube or Vimeo embed.',
    Icon: Video, color: '#EF4444',
    defaultSettings: { heading: '', videoUrl: '', aspectRatio: '16:9' },
    allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {},
    settingsSchema: withHeading([
      { key: 'videoUrl', kind: 'url', label: 'Video URL', required: true, hint: 'YouTube or Vimeo link', placeholder: 'https://youtube.com/watch?v=…' },
      { key: 'aspectRatio', kind: 'select', label: 'Aspect ratio', options: [
        { value: '16:9', label: '16:9' }, { value: '4:3', label: '4:3' }, { value: '1:1', label: '1:1' },
      ] },
    ]),
  },
  {
    type: 'featured_category_grid', label: 'Category Grid', description: 'Tiles linking to your subcategories — a "shop by category" grid.',
    Icon: Grid3x3, color: '#0891B2',
    defaultSettings: { heading: 'Shop by Category', categoryIds: [] },
    allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {},
    settingsSchema: withHeading([
      { key: 'categoryIds', kind: 'categoryMultiPicker', label: 'Categories', hint: 'Tiles are shown in the order chosen.', max: 12 },
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
    type: 'newsletter', label: 'Newsletter', description: 'An email signup — subscribes to your store\'s newsletter.',
    Icon: Mail, color: '#7C3AED',
    defaultSettings: { heading: 'Stay in the loop', subtext: '' },
    allowedBlockTypes: [], blockLabel: '',
    defaultBlockSettings: {},
    settingsSchema: withHeading([
      { key: 'subtext', kind: 'text', label: 'Subtext (optional)' },
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
    ]),
  },
  // ── Core/locked sections (Phase 4) — always pre-seeded, never manually
  // addable (`hidden: true`) and never removable once present (`locked: true`).
  // See `CORE_SECTION_TYPES` in `storefrontTypes.ts` for the full story. ────
  {
    type: 'product_main', label: 'Main Product', description: 'The product\'s core content — media, title, price, variant picker, quantity and buy buttons. Always shown on this product\'s page; hide or reorder individual items below.',
    Icon: ShoppingBag, color: '#D97757',
    defaultSettings: {}, allowedBlockTypes: ['product_media', 'product_title', 'product_price', 'product_variant_picker', 'product_quantity', 'product_buy_buttons', 'product_description'], blockLabel: 'Item',
    defaultBlockSettings: {}, hidden: true, locked: true,
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
];

export const SECTION_META_BY_TYPE: Record<SectionType, SectionMeta> = Object.fromEntries(SECTION_META.map(m => [m.type, m])) as Record<SectionType, SectionMeta>;

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
  social_link: [
    { key: 'platform', kind: 'select', label: 'Platform', half: true, options:
      ['facebook', 'instagram', 'x', 'tiktok', 'youtube', 'linkedin', 'whatsapp'].map(p => ({ value: p, label: p })) },
    { key: 'url', kind: 'url', label: 'Profile URL', half: true, placeholder: 'https://…' },
  ],
  copyright_text: [
    { key: 'text', kind: 'text', label: 'Copyright text', hint: "Leave blank to show a default © line with your store name." },
  ],
  hero_slide: [
    { key: 'imageUrl', kind: 'image', label: 'Image', required: true },
    { key: 'heading', kind: 'text', label: 'Heading' },
    { key: 'subheading', kind: 'text', label: 'Subheading' },
    { key: 'ctaText', kind: 'text', label: 'Button text' },
    { key: 'ctaLink', kind: 'link', label: 'Button link', showIf: s => !!s.ctaText },
  ],
  // "Dynamic Sources" — dynamicSourceKey, when set, binds this block's
  // `text` to one of the store's own real custom fields instead of a
  // static value (namespace is always 'custom' — resolved at render time,
  // see `AtelierContentBlocks.tsx`/`NovaContentBlocks.tsx`). A real
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
    { key: 'text', kind: 'textarea', label: 'Paragraph text', maxLength: 2000, hint: 'Formatting: **bold**, *italic*, [link text](https://…). Leave blank if binding to a custom field below.' },
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
  image_text_pair: [
    { key: 'imageUrl', kind: 'image', label: 'Image', required: true },
    { key: 'heading', kind: 'text', label: 'Heading' },
    { key: 'body', kind: 'textarea', label: 'Body', maxLength: 1000, hint: 'Formatting: **bold**, *italic*, [link text](https://…)' },
    { key: 'ctaText', kind: 'text', label: 'Button text' },
    { key: 'ctaLink', kind: 'link', label: 'Button link', showIf: s => !!s.ctaText },
    { key: 'imagePosition', kind: 'select', label: 'Image position', options: [
      { value: 'left', label: 'Left' }, { value: 'right', label: 'Right' },
    ] },
  ],
  testimonial: [
    { key: 'quote', kind: 'textarea', label: 'Quote', maxLength: 500 },
    { key: 'authorName', kind: 'text', label: 'Author name', half: true, required: true },
    { key: 'authorRole', kind: 'text', label: 'Author role', half: true },
    { key: 'avatarUrl', kind: 'image', label: 'Avatar (optional)' },
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
  product_media: [],
  product_title: [],
  product_price: [],
  product_variant_picker: [],
  product_quantity: [],
  product_buy_buttons: [],
  product_description: [],
};
