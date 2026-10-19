import { cloudinarySrcSet, cloudinaryUrl } from '@/utils/cloudinaryImage';

/** Sized, modern-format delivery for an <img>: `src` + `srcSet` + `sizes` (plain `src` for non-Cloudinary URLs). Spread it onto the tag. */
export function imgProps(src: string, widths: number[], sizes: string) {
  const srcSet = cloudinarySrcSet(src, widths);
  if (!srcSet) return { src, decoding: 'async' as const };
  return { src: cloudinaryUrl(src, widths[Math.floor(widths.length / 2)]), srcSet, sizes, decoding: 'async' as const };
}

export const CARD_IMAGE_WIDTHS = [320, 480, 640, 960];
export const CARD_IMAGE_SIZES = '(min-width: 1024px) 25vw, 50vw';
