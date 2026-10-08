import type { CSSProperties } from 'react';

/** Where the important part of an image sits — used as CSS `object-position` when the image has to be cropped. */
export const FOCAL_POINTS = ['top left', 'top', 'top right', 'left', 'center', 'right', 'bottom left', 'bottom', 'bottom right'] as const;
export type FocalPoint = typeof FOCAL_POINTS[number];

export function focalOf(value: unknown): FocalPoint {
  return FOCAL_POINTS.includes(value as FocalPoint) ? (value as FocalPoint) : 'center';
}

/** Seller's image-ratio choice (Shopify's "Image ratio"): `default` keeps the section's own built-in ratio,
 *  `adapt` shows the whole image at its natural size — nothing is cropped. */
export type ImageRatio = 'default' | 'adapt' | 'portrait' | 'square' | 'landscape';

const RATIO_CSS: Record<'portrait' | 'square' | 'landscape', string> = { portrait: '3 / 4', square: '1 / 1', landscape: '4 / 3' };

/** Styles for an image box + its <img>. `fallbackRatio` is the section's built-in ratio (e.g. '4 / 3'). */
export function imageFit(ratio: unknown, fallbackRatio: string, focal?: unknown): { box: CSSProperties; img: CSSProperties } {
  if (ratio === 'adapt') {
    return { box: {}, img: { display: 'block', width: '100%', height: 'auto' } };
  }
  const aspectRatio = ratio === 'portrait' || ratio === 'square' || ratio === 'landscape' ? RATIO_CSS[ratio] : fallbackRatio;
  return {
    box: { aspectRatio },
    img: { display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: focalOf(focal) },
  };
}

/** Theme setting "Product Image Ratio" → the product card's image box (`auto` = adapt to each image). */
export const PRODUCT_CARD_RATIO: Record<string, string> = { square: '1 / 1', portrait: '3 / 4', landscape: '4 / 3', adapt: 'auto' };

export type HeightPreset = 'small' | 'medium' | 'large' | 'adapt';

/** Phones are anything up to this width (px). */
export const MOBILE_MAX = 767;

/** Resolves the mobile height setting: absent / `same` follows the desktop one. */
export function mobileHeightOf(desktop: HeightPreset | undefined, mobile: string | undefined): HeightPreset | undefined {
  return mobile === 'small' || mobile === 'medium' || mobile === 'large' || mobile === 'adapt' ? mobile : desktop;
}
