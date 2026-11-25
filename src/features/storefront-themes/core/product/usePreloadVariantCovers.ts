import { useEffect, useRef } from 'react';
import { variantGallery } from './variantGallery';

interface PreloadProps { src: string; srcSet?: string; sizes?: string }
interface PreloadVariant { images?: string[] }

/**
 * Shoppers switch colour all the time, and the first photo of the new colour used to download only AFTER the
 * click (a grey box for a moment). This quietly fetches the FIRST photo of every variant once the page is idle,
 * using the exact same src / srcset / sizes the main image will request, so the browser cache answers at once.
 * The rest of a colour's photos load as before (the theme already preloads the current variant's gallery).
 */
export function usePreloadVariantCovers(
  variants: PreloadVariant[] | undefined,
  productImages: string[] | undefined,
  toProps: (src: string) => PreloadProps,
) {
  const toPropsRef = useRef(toProps);
  useEffect(() => { toPropsRef.current = toProps; });

  useEffect(() => {
    if (!variants || variants.length < 2) return;
    const covers = new Set<string>();
    for (const v of variants) {
      const first = variantGallery(v, variants, productImages)[0];
      if (first) covers.add(first);
    }
    if (covers.size === 0) return;
    const run = () => covers.forEach(src => {
      const p = toPropsRef.current(src);
      const img = new Image();
      if (p.sizes) img.sizes = p.sizes;
      if (p.srcSet) img.srcset = p.srcSet;
      img.src = p.src;
    });
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(run, { timeout: 1500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(run, 400);
    return () => window.clearTimeout(id);
  }, [variants, productImages]);
}
