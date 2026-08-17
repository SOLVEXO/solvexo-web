import { useState, type CSSProperties, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { cloudinaryUrl, cloudinarySrcSet } from '@/utils/cloudinaryImage';

interface CoverImageProps {
  /** Store cover photo URL. Falsy → the fallback gradient is shown instead. */
  src?:        string | null;
  alt?:        string;
  /** Sizing/rounding for the wrapper (e.g. `h-[220px]`, `rounded-2xl`). */
  className?:  string;
  /** Extra classes merged onto the `<img>` itself (e.g. a hover zoom). */
  imgClassName?: string;
  /** `eager` for above-the-fold heroes (LCP), `lazy` (default) for cards/tabs further down the page. */
  loading?:    'lazy' | 'eager';
  /** Dark gradient layered over the image so overlaid text/controls stay readable. */
  overlay?:    boolean;
  overlayClassName?: string;
  /** Shown in place of the image when there's no cover photo. */
  fallbackClassName?: string;
  fallbackStyle?: CSSProperties;
  /** Replaces the `src`/fallback image entirely (e.g. a rotating `BannerCarousel`)
   *  while keeping the overlay/children layering identical — used by the
   *  storefront hero when a store has its own `StoreBanner`s. */
  backgroundOverride?: ReactNode;
  /** `sizes` attribute for the responsive Cloudinary `srcset` — defaults to
   *  `100vw` (correct for full-bleed heroes); narrower contexts like store
   *  cards should pass their actual rendered width. */
  sizes?: string;
  /** Content layered above the image/overlay (logo, name, badges, actions…). */
  children?:   ReactNode;
}

/**
 * Store cover-photo primitive shared by every place a store's cover image is
 * rendered (storefront hero, store dashboard hero, store cards, seller-info
 * banners…) so the crop/fade/placeholder/fallback behavior stays identical
 * everywhere instead of being re-implemented per component.
 */
export function CoverImage({
  src, alt = '', className, imgClassName,
  loading = 'lazy', overlay = false, overlayClassName,
  fallbackClassName, fallbackStyle, backgroundOverride, sizes = '100vw', children,
}: CoverImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={clsx('relative overflow-hidden', className)}>
      {backgroundOverride ? (
        backgroundOverride
      ) : src ? (
        <>
          {!loaded && <div className="absolute inset-0 animate-pulse bg-[#edebe2]" />}
          <img
            src={cloudinaryUrl(src, 1920)}
            srcSet={cloudinarySrcSet(src)}
            sizes={sizes}
            alt={alt}
            loading={loading}
            fetchPriority={loading === 'eager' ? 'high' : undefined}
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={clsx(
              'absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500',
              loaded ? 'opacity-100' : 'opacity-0',
              imgClassName,
            )}
          />
        </>
      ) : (
        <div
          className={clsx('absolute inset-0', fallbackClassName ?? 'bg-gradient-to-br from-brand-pale-orange to-[#fde8da]')}
          style={fallbackStyle}
        >
          {/* A flat gradient with nothing else in it reads as "nothing loaded"
             rather than an intentional empty state — same subtle dot-grid
             texture already used on the seller WorkspaceHero, so "no cover
             photo yet" still looks designed instead of blank. */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, var(--color-carbon) 1px, transparent 0)', backgroundSize: '18px 18px' }}
          />
        </div>
      )}

      {overlay && (src || backgroundOverride) && (
        <div className={clsx('absolute inset-0', overlayClassName ?? 'bg-gradient-to-t from-black/55 via-black/10 to-transparent')} />
      )}

      {children && <div className="relative">{children}</div>}
    </div>
  );
}
