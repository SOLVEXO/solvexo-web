import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { apiGetPublicStoreProducts, type PublicStoreProduct } from '@/api/services/store';
import { apiGetPublicHomePage } from '@/api/services/storePages';
import { apiGetPublicStoreBanners, type StoreBanner, type StoreBannerLinkType } from '@/api/services/storeBanner';
import type { Section } from '@/api/services/storefrontTypes';
import { NovaSectionRenderer } from '../sections';
import { NovaButton } from '../components/NovaButton';
import { NovaProductCard } from '../components/NovaProductCard';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { cloudinaryUrl, cloudinarySrcSet } from '@/utils/cloudinaryImage';
import { novaTheme as t } from '../theme.config';

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="animate-pulse" style={{ aspectRatio: '1/1', background: t.colors.bgAlt, borderRadius: t.radius.md }} />
          <div className="animate-pulse h-3 w-3/4" style={{ background: t.colors.bgAlt }} />
          <div className="animate-pulse h-3 w-1/3" style={{ background: t.colors.bgAlt }} />
        </div>
      ))}
    </div>
  );
}

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
 *  `HeroSlide`'s image overlay). `mobileImageUrl` swaps in below the
 *  seller's own upload-time breakpoint via `<picture>`. */
function BannerSlide({ banner }: { banner: StoreBanner }) {
  const [errored, setErrored] = useState(false);
  const link = resolveBannerLink(banner);
  const isExternal = !!link.href;

  return (
    <section className="relative w-full overflow-hidden" style={{ minHeight: '320px', maxHeight: '640px', background: t.colors.bgAlt }}>
      {!errored && (
        <picture>
          {banner.mobileImageUrl && (
            <source media="(max-width: 640px)" srcSet={cloudinarySrcSet(banner.mobileImageUrl, [480, 640, 960])} />
          )}
          <img
            src={cloudinaryUrl(banner.imageUrl, 1600)}
            srcSet={cloudinarySrcSet(banner.imageUrl, [768, 1200, 1600, 2560])}
            sizes="100vw"
            alt={banner.ctaLabel ?? ''}
            onError={() => setErrored(true)}
            className="w-full h-full object-cover"
            style={{ display: 'block', minHeight: '320px', maxHeight: '640px' }}
            loading="eager"
            fetchPriority="high"
          />
        </picture>
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
function StoreBannerCarousel({ banners }: { banners: StoreBanner[] }) {
  const [active, setActive] = useState(0);
  if (banners.length === 0) return null;
  const banner = banners[Math.min(active, banners.length - 1)];

  return (
    <div className="relative">
      <BannerSlide banner={banner} />
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

/** Store-identity hero — same real store fields Atelier's `IdentityHero`
 *  reads, Nova's own bold full-bleed-image presentation. */
function IdentityHero() {
  const { store } = useStorefront();
  return (
    <section className="relative flex items-center" style={{ minHeight: '580px', background: t.colors.bgAlt }}>
      {store.coverImage && (
        <img
          src={cloudinaryUrl(store.coverImage, 1600)}
          srcSet={cloudinarySrcSet(store.coverImage, [640, 900, 1200, 1600])}
          sizes="100vw"
          alt={store.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
      )}
      {store.coverImage && (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(20,18,31,0.6) 0%, rgba(20,18,31,0.05) 65%)' }} />
      )}
      <div className="relative flex flex-col gap-6" style={{ padding: `48px ${t.layout.containerPadX}`, maxWidth: '620px' }}>
        <p style={{ fontFamily: t.fonts.body, fontSize: '12.5px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: store.coverImage ? '#C9C3FF' : t.colors.accent }}>
          {store.sellerType ?? 'New Drop'}
        </p>
        <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(38px, 5.5vw, 62px)', fontWeight: 700, color: store.coverImage ? '#FFFFFF' : t.colors.ink, lineHeight: 1.03 }}>
          {store.tagline || store.name}
        </h1>
        {store.description && (
          <p style={{ fontFamily: t.fonts.body, fontSize: '15.5px', color: store.coverImage ? '#E4E1FF' : t.colors.inkMuted, lineHeight: 1.7, maxWidth: '460px' }}>
            {store.description}
          </p>
        )}
        <div>
          <a href="#shop"><NovaButton>Shop Now</NovaButton></a>
        </div>
      </div>
    </section>
  );
}

/** Default Home layout for a store with no real Home sections yet — same
 *  role as `AtelierHomePage`'s `DefaultHomeContent`: once the seller
 *  publishes real sections, `NovaSectionRenderer` takes over instead. */
function DefaultHomeContent() {
  const { store } = useStorefront();
  const { currency } = useCurrencyPreference();
  const [products, setProducts] = useState<PublicStoreProduct[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setProducts(null);
    setError('');
    apiGetPublicStoreProducts(store.storeId, { limit: 8, sort: 'newest' })
      .then(res => { if (!cancelled) setProducts(res.data.products); })
      .catch(() => { if (!cancelled) setError('Could not load products right now.'); });
    return () => { cancelled = true; };
  }, [store.storeId]);

  return (
    <>
      <section style={{ padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}` }}>
        <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth }}>
          <div className="flex items-end justify-between mb-10">
            <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 700, color: t.colors.ink }}>New Arrivals</h2>
          </div>
          {products === null && !error && <ProductGridSkeleton />}
          {error && <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.danger }}>{error}</p>}
          {products !== null && products.length === 0 && (
            <p style={{ fontFamily: t.fonts.body, fontSize: '14px', color: t.colors.inkMuted }}>No products yet — check back soon.</p>
          )}
          {products !== null && products.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {products.map(p => <NovaProductCard key={p._id} product={p} currency={currency} />)}
            </div>
          )}
        </div>
      </section>

      <section style={{ background: t.colors.bgAlt }}>
        <div className="mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center" style={{ maxWidth: t.layout.maxWidth, padding: `40px ${t.layout.containerPadX}` }}>
          {[
            { title: 'Fast Shipping', body: 'Every order moves quick, tracked start to finish.' },
            { title: 'Secure Checkout', body: 'Your payment details are always protected.' },
            { title: 'Easy Returns', body: 'Not the right fit? We make it simple.' },
          ].map(item => (
            <div key={item.title}>
              <p style={{ fontFamily: t.fonts.display, fontSize: '16px', fontWeight: 700, color: t.colors.ink, marginBottom: '6px' }}>{item.title}</p>
              <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted }}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export function NovaHomePage() {
  const { store } = useStorefront();
  const { hash } = useLocation();
  const [sections, setSections] = useState<Section[] | null>(null);
  const [banners, setBanners] = useState<StoreBanner[] | null>(null);
  useStorefrontSeo({
    entityType: 'store',
    entityId: store.storeId,
    description: store.tagline || store.description || undefined,
    image: store.coverImage || store.logo || undefined,
  });

  useEffect(() => {
    let cancelled = false;
    apiGetPublicHomePage(store.storeId)
      .then(res => { if (!cancelled) setSections(res.data.sections ?? []); })
      .catch(() => { if (!cancelled) setSections([]); });
    return () => { cancelled = true; };
  }, [store.storeId]);

  useEffect(() => {
    let cancelled = false;
    apiGetPublicStoreBanners(store.storeId)
      .then(res => { if (!cancelled) setBanners(res.data); })
      .catch(() => { if (!cancelled) setBanners([]); });
    return () => { cancelled = true; };
  }, [store.storeId]);

  // Cross-page "#shop" links land here via client-side routing — same
  // manual scroll-to-hash handling as `AtelierHomePage`.
  useEffect(() => {
    if (hash !== '#shop') return;
    const el = document.getElementById('shop');
    el?.scrollIntoView({ behavior: 'smooth' });
  }, [hash, sections]);

  // Once the seller adds their own `hero`-type Section to Home (Online
  // Store → Pages → Home), it's meant to REPLACE this fixed identity hero,
  // not stack below it — rendering both was the exact cause of a real
  // "duplicate hero" bug found in QA. Stays showing during the initial
  // load (`sections === null`) since we don't yet know either way.
  const hasCustomHero = sections?.some(s => s.type === 'hero') ?? false;
  // Real Store Banners are this theme's second hero source — same priority
  // as `AtelierHomePage`: a merchant-built custom hero section still wins
  // (never stack two full-bleed heroes), otherwise real banners now show
  // instead of the bare identity-only default.
  const hasBanners = (banners?.length ?? 0) > 0;

  return (
    <main>
      {hasCustomHero ? null : hasBanners ? <StoreBannerCarousel banners={banners!} /> : <IdentityHero />}
      <div id="shop">
        {sections === null ? null : sections.length > 0 ? <NovaSectionRenderer sections={sections} /> : <DefaultHomeContent />}
      </div>
    </main>
  );
}

export default NovaHomePage;
