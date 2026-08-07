// Shared shapes for the sections+blocks storefront builder — mirrors the
// backend's `common/schemas/{block,section}.schema.ts`. `settings` stays a
// loose `Record<string, any>` here too (not a per-type union) since the
// section/block registry lives in `SectionRenderer.tsx`'s component map, not
// in the type system — adding a new type touches one map entry, not a big
// discriminated-union refactor.

export interface Block {
  _id?:      string;
  type:      string;
  settings:  Record<string, any>;
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
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

export interface Section {
  _id?:      string;
  type:      SectionType;
  settings:  Record<string, any>;
  blocks:    Block[];
}
