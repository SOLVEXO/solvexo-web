import type { LucideIcon } from 'lucide-react';

/**
 * The schema-driven replacement for the old duplicated-by-convention
 * metadata: previously `builder/sectionRegistry.ts` (a hand-maintained
 * `SectionMeta[]` array) and the backend's `section-settings.types.ts` were
 * two independent sources of truth for "what settings does section type X
 * have" — a new field had to be added in both places by hand, and nothing
 * enforced they stayed in sync.
 *
 * Now: each section module declares ONE `SectionSchema` (settings fields,
 * allowed blocks, presets, grouping) alongside its existing
 * `registerSection()` render-function call (see the bottom of
 * `sections/HeroSection.tsx`). The generic `<SchemaForm>` component
 * (`OnlineStore/customize/SchemaForm.tsx`) reads a `FieldSchema[]` and
 * renders the matching control — the Customizer's settings panel never
 * hardcodes a per-type form again. The backend's `section-settings.types.ts`
 * /`section-settings.validator.ts` remain the actual security-enforcement
 * layer (unchanged, still centralized there) — this registry is the
 * merchant-editor-facing contract, not a replacement for server validation.
 */

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'color'
  | 'select'
  | 'number'
  | 'range'
  | 'boolean'
  | 'image'
  | 'link'
  | 'icon'
  | 'productPicker'
  | 'categoryPicker'
  | 'collectionPicker';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldSchema {
  key: string;
  kind: FieldKind;
  label: string;
  helpText?: string;
  default?: unknown;
  /** For `select`/`icon`. */
  options?: FieldOption[];
  /** For `number`/`range`. */
  min?: number;
  max?: number;
  step?: number;
  /** For `text`/`textarea`/`richtext`. */
  maxLength?: number;
  placeholder?: string;
  /** Sub-groups fields within one section/block's settings panel (e.g. "Content" vs "Layout"). Fields with no group render at the top. */
  group?: string;
  /** Conditional visibility — e.g. `featured_products`'s `categoryId` field only makes sense when `source === 'category'`. Evaluated against the section/block's current settings object. */
  showIf?: (values: Record<string, unknown>) => boolean;
  /** For `categoryPicker`/`collectionPicker`/`productPicker` — whether this field stores an array of ids (multi-select) vs a single id string. */
  multiple?: boolean;
}

export interface SectionPreset {
  label: string;
  settings: Record<string, unknown>;
}

export const SECTION_GROUPS = [
  'Banners',
  'Hero',
  'Products',
  'Collections',
  'Content',
  'Media',
  'Social Proof',
  'Marketing',
  'Forms',
  'Navigation',
  'Commerce',
  'Blog',
  'Utility',
] as const;
export type SectionGroup = (typeof SECTION_GROUPS)[number];

export interface SectionSchema {
  type: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  group: SectionGroup;
  settings: FieldSchema[];
  blocks?: { allowedTypes: string[]; max: number; label: string; defaultSettings: Record<string, unknown> };
  presets?: SectionPreset[];
  /** Which resource templates this section may be used on (home page / a Page / a Collection template / a Product template). Drives what the Section Library offers per surface — a `product_catalog` section makes no sense inside a Product template's own surrounding-sections editor, for instance. */
  templateTypes?: Array<'home' | 'page' | 'collection' | 'product'>;
  /** Only offered in this theme definition's own Section Library (see item 7's "theme-specific sections") — omitted for every section shared across all themes. */
  exclusiveToTheme?: string;
  /** Excluded from the general "Add Section" picker — still fully schema'd for when it already exists in a page's sections (e.g. `collection_product_grid`, pre-seeded once and never manually addable). */
  hidden?: boolean;
}

const registry = new Map<string, SectionSchema>();

export function registerSectionSchema(schema: SectionSchema): void {
  if (registry.has(schema.type)) {
    throw new Error(`Section schema for "${schema.type}" is already registered.`);
  }
  registry.set(schema.type, schema);
}

export function getSectionSchema(type: string): SectionSchema | undefined {
  return registry.get(type);
}

export function listSectionSchemas(): SectionSchema[] {
  return Array.from(registry.values());
}

/** Section Library listing for a given surface + active theme — filters out `hidden` sections and any `exclusiveToTheme` section that isn't this theme. */
export function listAvailableSections(templateType: 'home' | 'page' | 'collection' | 'product', activeThemeDefinitionId: string): SectionSchema[] {
  return listSectionSchemas().filter((s) => {
    if (s.hidden) return false;
    if (s.templateTypes && !s.templateTypes.includes(templateType)) return false;
    if (s.exclusiveToTheme && s.exclusiveToTheme !== activeThemeDefinitionId) return false;
    return true;
  });
}
