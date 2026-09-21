// Shared shapes for the sections+blocks storefront builder — mirrors the
// backend's `common/store-content/section-settings.types.ts`. `settings`
// stays a loose `Record<string, any>` here too (not a per-type union) since
// each theme's own section-render registry (e.g.
// `storefront-themes/theme-01-atelier/sections/atelierSectionRenderer.tsx`)
// owns the component map, not the type system — adding a new type touches
// one registry entry, not a big discriminated-union refactor.

export interface Block {
  _id?:      string;
  type:      string;
  settings:  Record<string, any>;
  /** Missing/undefined behaves exactly like `true` — see SectionRenderer.tsx. */
  enabled?:  boolean;
}

export const SECTION_TYPES = [
  'hero',
  'rich_text',
  'featured_products',
  'product_catalog',
  'image_with_text',
  'testimonials',
  'faq',
  'video',
  'featured_category_grid',
  'trust_badges',
  'newsletter',
  // Lists real entries of a seller-defined Metaobject type (see
  // `api/services/metaobjects.ts`) — `settings.metaobjectType` names which
  // one, resolved against the store's own live entries at render time.
  'metaobject_list',
  // Contextual — always renders whichever collection is currently being
  // browsed. Only ever appears inside the singleton Collection Template, not
  // the general Pages/Home "Add Section" picker (see `sectionRegistry.ts`).
  'collection_product_grid',
  // Real, backend-validated (`section-settings.validator.ts`) section types
  // that predate any theme actually implementing them — added here as each
  // theme adopts one. `drop_countdown` is Atelier's first (see
  // `DropCountdownSection.tsx`); the rest are added only once a real theme
  // implements them, to keep this list an honest reflection of what's
  // actually usable, not a speculative wishlist.
  'editorial_lookbook',
  'farm_story',
  'drop_countdown',
  'craft_process',
  'tech_specs_compare',
  'soft_gallery',
  // Core/locked sections (Phase 4) — always pre-seeded into their owning
  // Product/Search/Cart/Blog-Index/Blog-Article template, never removable
  // via the section editor (see `CORE_SECTION_TYPES` below and the backend's
  // matching doc comment on `SECTION_TYPES`). The real, always-correct
  // commerce/listing markup they represent stays exactly where it already
  // was — each theme's own page component — these types are only ever
  // rendered for real by the Customize editor's own live preview, as a
  // representative placeholder.
  'product_main',
  'search_results',
  'cart_items',
  'cart_summary',
  'blog_post_list',
  'article_content',
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

/** Phase 5 (unified Pages/Blog/Article discovery in Customize) — real data
 *  for whichever real Blog/Article a merchant picked in the Customize
 *  editor's resource picker, fed into `blog_post_list`/`article_content`'s
 *  render functions (see each theme's `CoreSections.tsx`) so the editor's
 *  live preview shows THAT real blog's name/recent posts or THAT real
 *  article's title/excerpt instead of the generic "Sample…" placeholder.
 *  Never reaches the real storefront — those pages already render their
 *  own real content directly (see `AtelierBlogIndexPage`/`AtelierBlogPostPage`
 *  and their Nova counterparts), this is editor-preview-only context. */
export interface CoreSectionPreviewContext {
  blogName?: string;
  recentPostTitles?: string[];
  articleTitle?: string;
  articleExcerpt?: string;
}

/** Every core/locked section type — see the comment above. Shared by the
 *  Customize editor (`PageSectionsEditor`/`sectionRegistry`, which hide the
 *  Remove/Duplicate/Hide/Drag controls for these) and each theme's own
 *  storefront pages (`AtelierProductPage` etc., which filter these OUT of
 *  what they hand to the generic section renderer, since their own fixed
 *  markup already renders the real thing — rendering both would duplicate
 *  it on the live storefront). */
export const CORE_SECTION_TYPES: readonly SectionType[] = [
  'product_main',
  'search_results',
  'cart_items',
  'cart_summary',
  'blog_post_list',
  'article_content',
];

export interface Section {
  _id?:      string;
  type:      SectionType;
  settings:  Record<string, any>;
  blocks:    Block[];
  /** Missing/undefined behaves exactly like `true` — see SectionRenderer.tsx. */
  enabled?:  boolean;
  /** References a saved `ColorScheme.id` (see `StorefrontColors.colorSchemes`
   *  in `api/services/storeTheme.ts`) — null/undefined means "use the
   *  theme's own colors" (default, byte-identical to before this field
   *  existed). See `resolveSectionColors()`. */
  colorSchemeId?: string | null;
}
