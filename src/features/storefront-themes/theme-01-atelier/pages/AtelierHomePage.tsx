import { useEffect, useState } from 'react';
import { tt } from '@/utils/tStatic';
import { Link, useLocation } from 'react-router-dom';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { apiGetPublicStoreProducts, type PublicStoreProduct } from '@/api/services/store';
import { apiGetPublicHomePage } from '@/api/services/storePages';
import { apiGetPublicStoreBanners, type StoreBanner } from '@/api/services/storeBanner';
import { StoreBannerCarousel } from '../components/AtelierBannerCarousel';
import type { Section } from '@/api/services/storefrontTypes';
import { AtelierSectionRenderer } from '../sections';
import { AtelierButton } from '../components/AtelierButton';
import { AtelierProductCard } from '../components/AtelierProductCard';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
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

/** Store-identity hero — reads the store's own name/tagline/logo/cover image
 *  directly (not section content), same as the store-identity banner every
 *  other theme in this app keeps as fixed chrome above its section
 *  composition. */
function IdentityHero() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 items-stretch" style={{ minHeight: 'min(680px, calc(100vh - 120px))' }}>
      <div className="flex flex-col justify-center gap-5 order-2 lg:order-1" style={{ padding: `clamp(40px, 7vw, 96px) ${t.layout.containerPadX}` }}>
        <StoreHeroText />
      </div>
      <div className="order-1 lg:order-2 p-3 sm:p-5 lg:py-6 lg:pr-6">
        <StoreHeroImage />
      </div>
    </section>
  );
}

function StoreHeroText() {
  const { store } = useStorefront();
  return (
    <>
      <p className="inline-flex w-fit items-center gap-2" style={{ fontFamily: t.fonts.body, fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: t.colors.accent, borderBottom: `1px solid ${t.colors.accent}`, paddingBottom: '8px' }}>
        {store.sellerType?.replaceAll('_', ' ') ?? 'Independent store'}
      </p>
      <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(38px, 5.4vw, 72px)', fontWeight: 600, color: t.colors.ink, lineHeight: 1.02, maxWidth: '620px', letterSpacing: '-0.035em', margin: 0 }}>
        {store.tagline || store.name}
      </h1>
      {store.description && (
        <p style={{ fontFamily: t.fonts.body, fontSize: '15px', color: t.colors.inkMuted, lineHeight: 1.75, maxWidth: '460px', margin: 0 }}>
          {store.description}
        </p>
      )}
      <div className="flex items-center gap-5 pt-2">
        <a href="#shop" className="no-underline"><AtelierButton>{tt('home.explore', "Explore the collection")}</AtelierButton></a>
        <span style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted, letterSpacing: '0.04em' }}>{tt('home.thoughtful', "Thoughtfully selected for you")}</span>
      </div>
    </>
  );
}

function StoreHeroImage() {
  const { store } = useStorefront();
  return (
    <div className="relative h-full overflow-hidden" style={{ background: t.colors.bgAlt, minHeight: '320px', borderRadius: t.imageRadiusPx }}>
      <div className="w-full h-full flex flex-col items-center justify-center gap-5" style={{ minHeight: '320px', background: `linear-gradient(145deg, ${t.colors.bgAlt}, ${t.colors.bg})` }}>
        {store.logo ? <img src={store.logo} alt="" className="w-28 h-28 object-contain opacity-80" /> : <span style={{ fontFamily: t.fonts.display, fontSize: 'clamp(40px, 8vw, 100px)', color: t.colors.accent, opacity: 0.8 }}>{store.name.slice(0, 1).toUpperCase()}</span>}
        <span style={{ fontFamily: t.fonts.body, fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: t.colors.inkMuted }}>{store.name}</span>
      </div>
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
  const [productResult, setProductResult] = useState<{ storeId: string; products?: PublicStoreProduct[]; error?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGetPublicStoreProducts(store.storeId, { limit: 8, sort: 'newest' })
      .then(res => { if (!cancelled) setProductResult({ storeId: store.storeId, products: res.data.products }); })
      .catch(() => { if (!cancelled) setProductResult({ storeId: store.storeId, error: 'Could not load products right now.' }); });
    return () => { cancelled = true; };
  }, [store.storeId]);
  const products = productResult?.storeId === store.storeId ? productResult.products ?? null : null;
  const error = productResult?.storeId === store.storeId ? productResult.error ?? '' : '';

  return (
    <>
      <section style={{ padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}`, background: t.colors.bgAlt }}>
        <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth }}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <p style={{ fontFamily: t.fonts.body, fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: t.colors.accent, marginBottom: '10px' }}>{tt('home.latestEdit', "The latest edit")}</p>
              <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(28px, 3.6vw, 46px)', fontWeight: 600, color: t.colors.ink, letterSpacing: '-0.025em', lineHeight: 1.1, margin: 0 }}>{tt('home.newArrivals', "New arrivals")}</h2>
              <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted, marginTop: '10px' }}>{tt('home.discover', 'Discover the latest from {{name}}.', { name: store.name })}</p>
            </div>
            <Link to="/search" className="no-underline w-fit" style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.ink, borderBottom: `1px solid ${t.colors.ink}`, paddingBottom: '5px' }}>{tt('home.viewAll', "View all products")}</Link>
          </div>
          {products === null && !error && <ProductGridSkeleton />}
          {error && <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.danger }}>{error}</p>}
          {products !== null && products.length === 0 && (
            <p style={{ fontFamily: t.fonts.body, fontSize: '14px', color: t.colors.inkMuted }}>{tt('home.noProducts', "No products yet — check back soon.")}</p>
          )}
          {products !== null && products.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-10">
              {products.map(p => <AtelierProductCard key={p._id} product={p} currency={currency} />)}
            </div>
          )}
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
    image: store.logo || undefined,
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
  // A Hero / Slider section placed on Home replaces the fixed top hero. With no
  // slides of its own it shows the Store Banners at its own position, so it
  // only counts once it has a slide or there are banners to show.
  const hasBanners = (banners?.length ?? 0) > 0;
  const hasCustomHero = sections?.some(
    s => s.type === 'hero' && s.enabled !== false &&
      (hasBanners || s.blocks?.some(b => b.enabled !== false && b.settings?.imageUrl)),
  ) ?? false;
  // Real Store Banners are this theme's second hero source — a merchant who
  // built a custom `hero` section in the Page editor still wins (that's a
  // deliberate content-authoring choice, and stacking two full-bleed heroes
  // was the exact "duplicate hero" bug the `hasCustomHero` check above
  // already exists to avoid), but absent that, real banners now show
  // instead of the bare identity-only default.

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
