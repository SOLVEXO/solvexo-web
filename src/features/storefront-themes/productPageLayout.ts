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

/** Blocks a seller ADDS to the main product (Shopify Dawn): "Buy it now" once,
 *  collapsible tabs and size charts as many times as needed. They carry settings. */
export const PRODUCT_EXTRA_BLOCKS = ['product_buy_now', 'product_collapsible_tab', 'product_size_chart', 'product_text', 'product_pickup'] as const;
export type ProductExtraBlock = (typeof PRODUCT_EXTRA_BLOCKS)[number];
const REPEATABLE = new Set<string>(['product_collapsible_tab', 'product_size_chart', 'product_text']);

export type ProductMainBlock = (typeof PRODUCT_MAIN_BLOCKS)[number] | (typeof PRODUCT_OPTIONAL_BLOCKS)[number];
/** Everything except the gallery, which always owns the left column. */
export type ProductInfoBlock = Exclude<ProductMainBlock, 'product_media'>;

/** One entry of the info column, in order: a fixed block or an added one (with its settings). */
export interface ProductInfoItem {
  type: ProductInfoBlock | ProductExtraBlock;
  settings: Record<string, unknown>;
  key: string;
}

const KNOWN = new Set<string>([...PRODUCT_MAIN_BLOCKS, ...PRODUCT_OPTIONAL_BLOCKS, ...PRODUCT_EXTRA_BLOCKS]);

interface BlockLike { type: string; enabled?: boolean; settings?: Record<string, unknown>; _id?: string }

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
export function resolveProductMainLayout(main?: { blocks?: BlockLike[] } | null): { mediaOn: boolean; infoOrder: ProductInfoBlock[]; infoItems: ProductInfoItem[] } {
  const seen = new Set<string>();
  const ordered: { type: ProductMainBlock | ProductExtraBlock; on: boolean; settings: Record<string, unknown>; key: string }[] = [];
  (main?.blocks ?? []).forEach((b, i) => {
    if (!KNOWN.has(b.type) || (seen.has(b.type) && !REPEATABLE.has(b.type))) return;
    seen.add(b.type);
    ordered.push({ type: b.type as ProductMainBlock, on: b.enabled !== false, settings: b.settings ?? {}, key: b._id ? String(b._id) : `${b.type}-${i}` });
  });
  for (const type of PRODUCT_MAIN_BLOCKS) {
    if (!seen.has(type)) ordered.push({ type, on: true, settings: {}, key: type });
  }
  if (!seen.has('product_rating')) {
    const titleAt = ordered.findIndex(o => o.type === 'product_title');
    ordered.splice(titleAt >= 0 ? titleAt + 1 : 0, 0, { type: 'product_rating', on: true, settings: {}, key: 'product_rating' });
  }
  const visible = ordered.filter(o => o.on && o.type !== 'product_media');
  return {
    mediaOn: ordered.find(o => o.type === 'product_media')?.on ?? true,
    infoOrder: visible.filter(o => !(PRODUCT_EXTRA_BLOCKS as readonly string[]).includes(o.type)).map(o => o.type as ProductInfoBlock),
    infoItems: visible.map(o => ({ type: o.type as ProductInfoItem['type'], settings: o.settings, key: o.key })),
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
