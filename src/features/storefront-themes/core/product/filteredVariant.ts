import { useSearchParams } from 'react-router-dom';
import { parseBrowseState } from '@/features/storefront/browse/browseState';

type CardVariant = { _id?: string; options?: { name: string; value: string }[]; images?: string[] };

/** Shopify rule (storefront filtering): when a shopper filters a collection by a variant option such as Color, the product shows the
 *  photo of the FIRST variant that matches the filters, and its link opens that variant. Pure part, so it can be tested. */
export function firstMatchingVariant(variants: CardVariant[] | undefined, options: Record<string, string[]>): CardVariant | null {
  const names = Object.keys(options);
  if (!names.length) return null;
  const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
  // a variant matches when, for every filtered option, its value is one of the chosen values (any-of inside one option)
  const hit = (variants ?? []).find(v => names.every(n => {
    const val = v.options?.find(o => same(o.name, n))?.value;
    return !!val && options[n].some(x => same(x, val));
  }));
  return hit ?? null;
}

/** The variant (photo + id) a card should show for the filters in the page address; null when no option filter is on. */
export function useFilteredVariant(variants: CardVariant[] | undefined): { image?: string; variantId?: string } {
  const [sp] = useSearchParams();
  const hit = firstMatchingVariant(variants, parseBrowseState(sp).options);
  return { image: hit?.images?.find(Boolean), variantId: hit?._id };
}
