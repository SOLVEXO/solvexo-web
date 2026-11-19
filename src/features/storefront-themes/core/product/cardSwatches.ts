import { isColorOptionName, swatchColor, type SellerSwatch } from './variantOptions';

/** One colour dot (or text chip) on a product card. */
export interface CardSwatch {
  value: string;
  /** What to paint: the seller's chosen colour, else a guess from the name, else null (then the card shows the name as a chip). */
  color: string | null;
  /** The photo of this colour: shown when a shopper hovers the dot. */
  image?: string;
}

/** The colour options of a product for its card, one entry per colour value. ONE implementation for every theme, so a card and the
 *  product page always agree on which colours exist and what they look like. */
export function cardSwatches(product: { variants?: { options?: { name: string; value: string }[]; images?: string[] }[]; optionSwatches?: SellerSwatch[] }): CardSwatch[] {
  const seen = new Map<string, CardSwatch>();
  for (const v of product.variants ?? []) {
    const opt = v.options?.find(o => isColorOptionName(o.name));
    if (!opt?.value || seen.has(opt.value.toLowerCase())) continue;
    seen.set(opt.value.toLowerCase(), { value: opt.value, color: swatchColor(product.optionSwatches, opt.name, opt.value).color, image: v.images?.find(Boolean) });
  }
  return Array.from(seen.values());
}
