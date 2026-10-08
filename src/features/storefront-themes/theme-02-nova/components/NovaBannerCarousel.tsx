import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicStoreBanners, type StoreBanner, type StoreBannerLinkType } from '@/api/services/storeBanner';
import { cloudinaryUrl, cloudinarySrcSet } from '@/utils/cloudinaryImage';
import { NovaButton } from './NovaButton';
import { novaTheme as t } from '../theme.config';

/** Resolves a `StoreBanner`'s `linkType`/`linkTarget` (a seller-typed
 *  product/category/collection id, or a raw external URL — see
 *  `Marketing.tsx`'s banner form) to a real client-side route or href, the
 *  same id-or-slug-tolerant routes `/product/:slug`, `/category/:slugOrId`
 *  and `/collections/:slugOrId` already accept. */
function resolveBannerLink(banner: StoreBanner): { to?: string; href?: string } {
  if (!banner.linkTarget) return {};
  const target = banner.linkTarget;
  const byType: Record<StoreBannerLinkType, () => { to?: string; href?: string }> = {
    product: () => ({ to: `/product/${target}` }),
    category: () => ({ to: `/category/${target}` }),
    collection: () => ({ to: `/collections/${target}` }),
    external: () => ({ href: target }),
  };
  return byType[banner.linkType]?.() ?? {};
}

/** One real seller-uploaded promo/hero/season/collection banner (Marketing →
 *  Store Banners) — the banner IS the image (no separate heading/subheading
 *  field on the model), with an optional CTA button overlaid centrally over
 *  a subtle bottom gradient (Nova's own darker-glass convention, same as
 *  `HeroSlide`'s image overlay). One image, `object-cover`-cropped at every
 *  breakpoint — no separate mobile crop upload. */
function BannerSlide({ banner, adapt }: { banner: StoreBanner; adapt: boolean }) {
  const [errored, setErrored] = useState(false);
  const link = resolveBannerLink(banner);
  const isExternal = !!link.href;
  // See AtelierHomePage's identical `BannerSlide` for the full rationale —
  // both themes share the same `StoreBanner` shape and video/poster contract.
  const isVideoBanner = banner.type === 'video' && !!banner.videoUrl;
  // "Adapt to image" (Hero height setting): the whole banner image at its own proportions, nothing cropped.
  const adaptImage = adapt && !isVideoBanner;
  const sizeStyle = adaptImage
    ? { display: 'block', width: '100%', height: 'auto' } as const
    : { display: 'block', minHeight: '320px', maxHeight: '640px' } as const;

  return (
    <section className="relative w-full overflow-hidden" style={adaptImage ? { background: t.colors.bgAlt } : { minHeight: '320px', maxHeight: '640px', background: t.colors.bgAlt }}>
      {isVideoBanner ? (
        <video
          src={banner.videoUrl!}
          poster={cloudinaryUrl(banner.imageUrl, 1600)}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          style={{ display: 'block', minHeight: '320px', maxHeight: '640px' }}
        />
      ) : !errored && (
        <img
          src={cloudinaryUrl(banner.imageUrl, 1600)}
          srcSet={cloudinarySrcSet(banner.imageUrl, [768, 1200, 1600, 2560])}
          sizes="100vw"
          alt={banner.ctaLabel ?? ''}
          onError={() => setErrored(true)}
          className={adaptImage ? undefined : 'w-full h-full object-cover'}
          style={sizeStyle}
          loading="eager"
          fetchPriority="high"
        />
      )}
      {banner.ctaLabel && (link.to || link.href) && (
        <>
          {!errored && <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(20,18,31,0) 55%, rgba(20,18,31,0.45) 100%)' }} />}
          <div className="absolute inset-0 flex items-center justify-center">
            {link.to ? (
              <Link to={link.to} className="no-underline"><NovaButton>{banner.ctaLabel}</NovaButton></Link>
            ) : (
              <a href={link.href} className="no-underline" target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noopener noreferrer' : undefined}>
                <NovaButton>{banner.ctaLabel}</NovaButton>
              </a>
            )}
          </div>
        </>
      )}
    </section>
  );
}

/** Real Store Banners as the storefront's promotional hero — this is the
 *  seller-facing "Marketing → Store Banners" feature actually reaching a
 *  buyer for the first time (previously created/scheduled correctly but
 *  never rendered anywhere on the live storefront). Same manual dot-carousel
 *  UX as the theme-editor `HeroSection`, kept as its own component since the
 *  underlying data shape (`StoreBanner` vs. section `Block`) is unrelated. */
export function StoreBannerCarousel({ banners, adapt = false }: { banners: StoreBanner[]; adapt?: boolean }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  // Auto-advance every 5s (pauses on hover/touch; skipped for reduced-motion users).
  useEffect(() => {
    if (banners.length < 2 || paused) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setActive(a => (a + 1) % banners.length), 5000);
    return () => window.clearInterval(id);
  }, [banners.length, paused]);
  if (banners.length === 0) return null;
  const banner = banners[Math.min(active, banners.length - 1)];

  return (
    <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={() => setPaused(true)}>
      <BannerSlide banner={banner} adapt={adapt} />
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((b, i) => (
            <button
              key={b._id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Slide ${i + 1}`}
              className="cursor-pointer border-0 p-0"
              style={{ width: '22px', height: '5px', borderRadius: '9999px', background: i === active ? t.colors.accent : 'rgba(255,255,255,0.5)' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}


/** The Hero / Slider section's fallback when it has no slides of its own: it
 *  shows the store's Store Banners (Marketing → Banners) right here, at the
 *  section's position on the page. One place (Online Store → Pages) controls
 *  where the hero sits; the Banners page controls what's in it. */
export function StoreBannersHero({ adapt = false }: { adapt?: boolean }) {
  const { store } = useStorefront();
  const [banners, setBanners] = useState<StoreBanner[]>([]);
  useEffect(() => {
    let cancelled = false;
    apiGetPublicStoreBanners(store.storeId)
      .then(res => { if (!cancelled) setBanners(res.data); })
      .catch(() => { if (!cancelled) setBanners([]); });
    return () => { cancelled = true; };
  }, [store.storeId]);
  return <StoreBannerCarousel banners={banners} adapt={adapt} />;
}
