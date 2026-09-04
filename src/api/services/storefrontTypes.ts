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
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

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
