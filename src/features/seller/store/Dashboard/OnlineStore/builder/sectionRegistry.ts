import { Image, Type, Star, LayoutGrid, LayoutList, Columns, Quote, HelpCircle, Video, Grid3x3, ShieldCheck, Mail, Timer, Boxes, type LucideIcon } from 'lucide-react';
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
    settingsSchema: withHeading([
      { key: 'alignment', kind: 'select', label: 'Text alignment', options: [
        { value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' },
      ] },
    ]),
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
];

export const SECTION_META_BY_TYPE: Record<SectionType, SectionMeta> = Object.fromEntries(SECTION_META.map(m => [m.type, m])) as Record<SectionType, SectionMeta>;

// ── Block settings schemas ──────────────────────────────────────────────────
// Every block type below drives `SchemaForm` in `BlockFields.tsx`, keyed by
// its `type` string — `nav_link`/`footer_column` are the one deliberate
// exception (recursive nested-link-list editors, kept hand-written; see
// `BlockFields.tsx`'s own comment). This is also where the migration closed
// real, previously-disclosed gaps against the backend validator
// (`section-settings.validator.ts`): `heading.level`, `hero_slide.mobileImageUrl`,
// `testimonial.avatarUrl`, and `list.style` were all accepted by the server
// but had no editor field at all before this.
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
    { key: 'mobileImageUrl', kind: 'image', label: 'Mobile image (optional)', hint: 'Shown below 768px instead of the image above — leave blank to reuse it.' },
    { key: 'heading', kind: 'text', label: 'Heading' },
    { key: 'subheading', kind: 'text', label: 'Subheading' },
    { key: 'ctaText', kind: 'text', label: 'Button text' },
    { key: 'ctaLink', kind: 'link', label: 'Button link', showIf: s => !!s.ctaText },
  ],
  heading: [
    { key: 'text', kind: 'text', label: 'Heading text', required: true, maxLength: 150 },
    { key: 'level', kind: 'select', label: 'Size', options: [
      { value: 'h2', label: 'Large (H2)' }, { value: 'h3', label: 'Medium (H3)' }, { value: 'h4', label: 'Small (H4)' },
    ] },
  ],
  // "Dynamic Sources" — dynamicSourceNamespace/Key are optional and, when
  // both are set, bind this paragraph to a real product metafield instead
  // of static `text` (resolved at render time — see `AtelierProductPage.tsx`/
  // `RichTextSection.tsx`). Two flat fields, not one nested object, to match
  // this engine's flat settings model — see the backend type's own doc
  // comment. Only meaningful inside a Product Template's sections; a plain
  // Home-page paragraph has no single "current resource" to bind to, so a
  // seller who fills these in on a Home section just gets an empty paragraph
  // there — not validated against page context, a disclosed v1 limitation.
  paragraph: [
    { key: 'text', kind: 'textarea', label: 'Paragraph text', maxLength: 2000, hint: 'Formatting: **bold**, *italic*, [link text](https://…). Leave blank if binding to a product field below.' },
    { key: 'dynamicSourceNamespace', kind: 'text', label: 'Metafield namespace (optional)', hint: 'On a Product Template only: shows that product’s own custom field instead of the text above.', half: true },
    { key: 'dynamicSourceKey', kind: 'text', label: 'Metafield key (optional)', half: true },
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
};
