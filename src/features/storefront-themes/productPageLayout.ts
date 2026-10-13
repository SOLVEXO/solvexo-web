import { CORE_SECTION_TYPES, type Section } from '@/api/services/storefrontTypes';

/** The 7 blocks a `product_main` section always carries, in the seeded order
 *  (mirrors `PRODUCT_MAIN_BLOCK_TYPES` in the API's `core-sections.util.ts`). */
export const PRODUCT_MAIN_BLOCKS = [
  'product_media',
  'product_title',
  'product_price',
  'product_variant_picker',
  'product_quantity',
  'product_buy_buttons',
  'product_description',
] as const;
/** Extra blocks a seller can switch on (the rating was always shown, the rest start off). */
export const PRODUCT_OPTIONAL_BLOCKS = ['product_rating', 'product_sku', 'product_wishlist', 'product_share', 'product_specs'] as const;

export type ProductMainBlock = (typeof PRODUCT_MAIN_BLOCKS)[number] | (typeof PRODUCT_OPTIONAL_BLOCKS)[number];
/** Everything except the gallery, which always owns the left column. */
export type ProductInfoBlock = Exclude<ProductMainBlock, 'product_media'>;

const KNOWN = new Set<string>([...PRODUCT_MAIN_BLOCKS, ...PRODUCT_OPTIONAL_BLOCKS]);

interface BlockLike { type: string; enabled?: boolean }

/**
 * What the product page renders, from the seller's `product_main` section:
 * which blocks are on and in what order. The gallery is its own column, so
 * only the order of the info-column blocks matters.
 *
 * A template with no `product_main` yet (older stores), or a required block
 * missing from it, resolves to "on" at its default position — identical to the
 * page before blocks could be reordered. Optional blocks that are absent stay
 * off, except the rating, which always showed under the title and so keeps doing so.
 */
export function resolveProductMainLayout(main?: { blocks?: BlockLike[] } | null): { mediaOn: boolean; infoOrder: ProductInfoBlock[] } {
  const seen = new Set<string>();
  const ordered: { type: ProductMainBlock; on: boolean }[] = [];
  for (const b of main?.blocks ?? []) {
    if (!KNOWN.has(b.type) || seen.has(b.type)) continue;
    seen.add(b.type);
    ordered.push({ type: b.type as ProductMainBlock, on: b.enabled !== false });
  }
  for (const type of PRODUCT_MAIN_BLOCKS) {
    if (!seen.has(type)) ordered.push({ type, on: true });
  }
  if (!seen.has('product_rating')) {
    const titleAt = ordered.findIndex(o => o.type === 'product_title');
    ordered.splice(titleAt >= 0 ? titleAt + 1 : 0, 0, { type: 'product_rating', on: true });
  }
  return {
    mediaOn: ordered.find(o => o.type === 'product_media')?.on ?? true,
    infoOrder: ordered.filter(o => o.on && o.type !== 'product_media').map(o => o.type as ProductInfoBlock),
  };
}

/**
 * Splits a product template's sections around its locked `product_main`:
 * sections the seller placed ABOVE it render above the buy box, the rest
 * below the reviews. The core sections themselves never reach the section
 * renderer (the page already draws them). With no `product_main` in the
 * template every section stays below, as before.
 */
export function splitProductTemplateSections(sections: Section[]): { before: Section[]; after: Section[] } {
  const isCore = (s: Section) => CORE_SECTION_TYPES.includes(s.type);
  const mainIdx = sections.findIndex(s => s.type === 'product_main');
  if (mainIdx < 0) return { before: [], after: sections.filter(s => !isCore(s)) };
  return {
    before: sections.slice(0, mainIdx).filter(s => !isCore(s)),
    after: sections.slice(mainIdx + 1).filter(s => !isCore(s)),
  };
}
