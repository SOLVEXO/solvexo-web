import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { apiGetPublicStoreProducts, type PublicStoreProduct } from '@/api/services/store';
import { apiGetPublicHomePage } from '@/api/services/storePages';
import { apiGetPublicStoreBanners, type StoreBanner, type StoreBannerLinkType } from '@/api/services/storeBanner';
import type { Section } from '@/api/services/storefrontTypes';
import { AtelierSectionRenderer } from '../sections';
import { AtelierButton } from '../components/AtelierButton';
import { AtelierProductCard } from '../components/AtelierProductCard';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { cloudinaryUrl, cloudinarySrcSet } from '@/utils/cloudinaryImage';
import { atelierTheme as t } from '../theme.config';

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="animate-pulse" style={{ aspectRatio: '3/4', background: t.colors.bgAlt }} />
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
 *  field on the model), with an optional CTA button overlaid centrally.
 *  `mobileImageUrl` swaps in below the seller's own upload-time breakpoint
 *  via `<picture>`, matching how the banner form documents that field. */
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
        <div className="absolute inset-0 flex items-center justify-center">
          {link.to ? (
            <Link to={link.to} className="no-underline"><AtelierButton>{banner.ctaLabel}</AtelierButton></Link>
          ) : (
            <a href={link.href} className="no-underline" target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noopener noreferrer' : undefined}>
              <AtelierButton>{banner.ctaLabel}</AtelierButton>
            </a>
          )}
        </div>
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
              style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === active ? t.colors.ink : t.colors.border }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Store-identity hero — reads the store's own name/tagline/logo/cover image
 *  directly (not section content), same as the store-identity banner every
 *  other theme in this app keeps as fixed chrome above its section
 *  composition. */
function IdentityHero() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 items-stretch" style={{ minHeight: '560px' }}>
      <div className="flex flex-col justify-center gap-6 order-2 lg:order-1" style={{ padding: `48px ${t.layout.containerPadX}` }}>
        <StoreHeroText />
      </div>
      <StoreHeroImage />
    </section>
  );
}

function StoreHeroText() {
  const { store } = useStorefront();
  return (
    <>
      <p style={{ fontFamily: t.fonts.body, fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', color: t.colors.accent }}>
        {store.sellerType ?? 'New Collection'}
      </p>
      <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 600, color: t.colors.ink, lineHeight: 1.05, maxWidth: '560px' }}>
        {store.tagline || store.name}
      </h1>
      {store.description && (
        <p style={{ fontFamily: t.fonts.body, fontSize: '15px', color: t.colors.inkMuted, lineHeight: 1.7, maxWidth: '440px' }}>
          {store.description}
        </p>
      )}
      <div>
        <a href="#shop"><AtelierButton>Shop the Collection</AtelierButton></a>
      </div>
    </>
  );
}

function StoreHeroImage() {
  const { store } = useStorefront();
  return (
    <div className="order-1 lg:order-2" style={{ background: t.colors.bgAlt, minHeight: '320px' }}>
      {store.coverImage ? (
        <img
          src={cloudinaryUrl(store.coverImage, 1200)}
          srcSet={cloudinarySrcSet(store.coverImage, [640, 900, 1200, 1600])}
          sizes="(min-width: 1024px) 50vw, 100vw"
          alt={store.name}
          className="w-full h-full object-cover"
          style={{ minHeight: '320px' }}
          loading="eager"
          fetchPriority="high"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center" style={{ minHeight: '320px' }}>
          {store.logo && <img src={store.logo} alt="" className="w-24 h-24 object-contain opacity-60" />}
        </div>
      )}
    </div>
  );
}

/** The default Home layout for a store that hasn't added any real Home
 *  sections yet (via Online Store → Pages → Home) — real store fields + a
 *  real product fetch + a static trust strip, so a brand-new store never
 *  shows a blank page before a seller has touched the section editor. Once
 *  the seller adds/publishes real sections, `AtelierSectionRenderer` takes
 *  over below the identity hero instead of this. */
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
            <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 600, color: t.colors.ink }}>New Arrivals</h2>
          </div>
          {products === null && !error && <ProductGridSkeleton />}
          {error && <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.danger }}>{error}</p>}
          {products !== null && products.length === 0 && (
            <p style={{ fontFamily: t.fonts.body, fontSize: '14px', color: t.colors.inkMuted }}>No products yet — check back soon.</p>
          )}
          {products !== null && products.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {products.map(p => <AtelierProductCard key={p._id} product={p} currency={currency} />)}
            </div>
          )}
        </div>
      </section>

      <section style={{ borderTop: `1px solid ${t.colors.border}`, borderBottom: `1px solid ${t.colors.border}` }}>
        <div className="mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center" style={{ maxWidth: t.layout.maxWidth, padding: `40px ${t.layout.containerPadX}` }}>
          {[
            { title: 'Considered Craft', body: 'Every piece selected for quality that lasts.' },
            { title: 'Secure Checkout', body: 'Your payment details are always protected.' },
            { title: 'Easy Returns', body: 'Not the right fit? We make it simple.' },
          ].map(item => (
            <div key={item.title}>
              <p style={{ fontFamily: t.fonts.display, fontSize: '16px', fontWeight: 600, color: t.colors.ink, marginBottom: '6px' }}>{item.title}</p>
              <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted }}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export function AtelierHomePage() {
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

  // Cross-page "#shop" links (Cart's "Continue Shopping", Footer's "All
  // Products", the navbar's Shop trigger) land here via client-side
  // routing — React Router doesn't auto-scroll to a URL hash the way a
  // full page load does, so this does it manually once content exists.
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
  // Real Store Banners are this theme's second hero source — a merchant who
  // built a custom `hero` section in the Page editor still wins (that's a
  // deliberate content-authoring choice, and stacking two full-bleed heroes
  // was the exact "duplicate hero" bug the `hasCustomHero` check above
  // already exists to avoid), but absent that, real banners now show
  // instead of the bare identity-only default.
  const hasBanners = (banners?.length ?? 0) > 0;

  return (
    <main>
      {hasCustomHero ? null : hasBanners ? <StoreBannerCarousel banners={banners!} /> : <IdentityHero />}
      <div id="shop">
        {sections === null ? null : sections.length > 0 ? <AtelierSectionRenderer sections={sections} /> : <DefaultHomeContent />}
      </div>
    </main>
  );
}

export default AtelierHomePage;
