type GalleryVariant = { images?: string[] };

/** Shopify rule: a photo can be linked to one or many variants. The gallery of the chosen variant shows ITS photos first,
 *  then the photos no variant claims (shared by every variant). Photos linked only to other variants stay hidden.
 *  A variant with no photos of its own (and every older product) shows the whole product gallery, as before. */
export function variantGallery(variant: GalleryVariant | null | undefined, variants: GalleryVariant[] | undefined, productImages: string[] | undefined): string[] {
  const all = (productImages ?? []).filter(Boolean);
  const own = (variant?.images ?? []).filter(Boolean);
  if (!own.length) return all;
  const claimed = new Set<string>();
  for (const v of variants ?? []) for (const i of v.images ?? []) if (i) claimed.add(i);
  const ownSet = new Set(own);
  // own photos in the order the seller arranged the product gallery, any photo missing from the gallery list goes last
  const ordered = [...all.filter(i => ownSet.has(i)), ...own.filter(i => !all.includes(i))];
  const shared = all.filter(i => !claimed.has(i));
  return [...ordered, ...shared];
}
