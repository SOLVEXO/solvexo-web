/**
 * Cloudinary responsive-delivery helpers — build per-breakpoint transformed
 * URLs from a stored secure_url so hero banners are served at the resolution
 * each visitor's screen actually needs (mobile/tablet/desktop/retina) instead
 * of one fixed-size image being upscaled (blurry) or over-downloaded (slow)
 * everywhere.
 *
 * Safe no-op for non-Cloudinary URLs — e.g. an admin can paste an arbitrary
 * external image URL via the platform Banner's "create from URL" flow, which
 * has no Cloudinary transformation endpoint to splice into.
 */

const UPLOAD_MARKER = '/upload/';

function isCloudinaryUrl(url: string): boolean {
  return url.includes('res.cloudinary.com') && url.includes(UPLOAD_MARKER);
}

function withTransform(url: string, transform: string): string {
  const idx = url.indexOf(UPLOAD_MARKER);
  if (idx === -1) return url;
  const splicePoint = idx + UPLOAD_MARKER.length;
  return `${url.slice(0, splicePoint)}${transform}/${url.slice(splicePoint)}`;
}

/** Width candidates covering mobile through 4K/retina hero banners. */
export const HERO_SRCSET_WIDTHS = [480, 768, 1024, 1440, 1920, 2560];

/** A single sized + format/quality-optimized delivery URL (the `src` fallback for browsers without `srcset` support). */
export function cloudinaryUrl(url: string, width: number): string {
  if (!isCloudinaryUrl(url)) return url;
  return withTransform(url, `w_${width},c_limit,q_auto,f_auto`);
}

/** `srcset` string across `widths` — `undefined` for non-Cloudinary URLs, in which case the caller should omit `srcSet`/`sizes` entirely and fall back to a plain `src`. */
export function cloudinarySrcSet(url: string, widths: number[] = HERO_SRCSET_WIDTHS): string | undefined {
  if (!isCloudinaryUrl(url)) return undefined;
  return widths.map((w) => `${withTransform(url, `w_${w},c_limit,q_auto,f_auto`)} ${w}w`).join(', ');
}

/** 1x/2x density `srcset` for a `<picture><source>` art-direction variant
 *  (e.g. a dedicated mobile crop) where a fixed viewport-width media query
 *  already scopes when it applies, so density descriptors are simpler and
 *  more correct here than width descriptors (which need a `sizes` attribute
 *  `<source>` doesn't meaningfully use the same way `<img>` does). */
export function cloudinaryDensitySrcSet(url: string, baseWidth: number): string | undefined {
  if (!isCloudinaryUrl(url)) return undefined;
  return `${withTransform(url, `w_${baseWidth},c_limit,q_auto,f_auto`)} 1x, ${withTransform(url, `w_${baseWidth * 2},c_limit,q_auto,f_auto`)} 2x`;
}
