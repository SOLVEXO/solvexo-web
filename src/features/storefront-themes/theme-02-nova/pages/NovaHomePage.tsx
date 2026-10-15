import { useEffect, useState } from 'react';
import { tt } from '@/utils/tStatic';
import { Link, useLocation } from 'react-router-dom';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { apiGetPublicStoreProducts, type PublicStoreProduct } from '@/api/services/store';
import { apiGetPublicHomePage } from '@/api/services/storePages';
import { apiGetPublicStoreBanners, type StoreBanner } from '@/api/services/storeBanner';
import { StoreBannerCarousel } from '../components/NovaBannerCarousel';
import type { Section } from '@/api/services/storefrontTypes';
import { NovaSectionRenderer } from '../sections';
import { NovaButton } from '../components/NovaButton';
import { NovaProductCard } from '../components/NovaProductCard';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
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

/** Store-identity hero — same real store fields Atelier's `IdentityHero`
 *  reads, Nova's own bold full-bleed-image presentation. */
function IdentityHero() {
  const { store } = useStorefront();
  return (
    <section className="relative flex items-center overflow-hidden" style={{ minHeight: 'min(700px, calc(100vh - 120px))', background: t.colors.bgAlt }}>
      <div aria-hidden="true" className="absolute right-[-8vw] top-[-20%] h-[80vw] w-[80vw] max-h-[760px] max-w-[760px] rounded-full opacity-20" style={{ background: `radial-gradient(circle, ${t.colors.accent}, transparent 68%)` }} />
      <div className="relative flex flex-col gap-5" style={{ padding: `clamp(40px, 8vw, 112px) ${t.layout.containerPadX}`, maxWidth: '760px' }}>
        <p style={{ fontFamily: t.fonts.body, fontSize: '12.5px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.colors.accent }}>
          {store.sellerType?.replaceAll('_', ' ') ?? 'Independent store'}
        </p>
        <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(42px, 6.4vw, 84px)', fontWeight: 700, color: t.colors.ink, lineHeight: 0.99, letterSpacing: '-0.055em', margin: 0 }}>
          {store.tagline || store.name}
        </h1>
        {store.description && (
          <p style={{ fontFamily: t.fonts.body, fontSize: '15.5px', color: t.colors.inkMuted, lineHeight: 1.7, maxWidth: '500px', margin: 0 }}>
            {store.description}
          </p>
        )}
        <div className="flex items-center gap-4 pt-2">
          <a href="#shop" className="no-underline"><NovaButton>{tt('home.shopLatest', "Shop the latest")}</NovaButton></a>
          <span style={{ fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 600, color: t.colors.inkMuted }}>{tt('home.findFavorite', "Find your next favorite")}</span>
        </div>
      </div>
      {store.logo && <img src={store.logo} alt="" className="absolute right-[8%] top-1/2 hidden h-40 w-40 -translate-y-1/2 object-contain opacity-70 lg:block" />}
    </section>
  );
}

/** Default Home layout for a store with no real Home sections yet — same
 *  role as `AtelierHomePage`'s `DefaultHomeContent`: once the seller
 *  publishes real sections, `NovaSectionRenderer` takes over instead. */
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
      <section style={{ padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}`, background: t.colors.bg }}>
        <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth }}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <p className="inline-flex items-center gap-2" style={{ fontFamily: t.fonts.body, fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.colors.accent, marginBottom: '10px' }}>
                <span style={{ width: '18px', height: '2px', background: t.colors.accent }} /> Fresh on the store
              </p>
              <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(30px, 4vw, 50px)', fontWeight: 700, color: t.colors.ink, letterSpacing: '-0.045em', lineHeight: 1, margin: 0 }}>{tt('home.justDropped', "Just dropped")}</h2>
              <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted, marginTop: '12px' }}>The newest finds from {store.name}.</p>
            </div>
            <Link to="/search" className="no-underline w-fit" style={{ fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 700, color: t.colors.accent, borderBottom: `2px solid ${t.colors.accent}`, paddingBottom: '5px' }}>{tt('home.exploreAll', "Explore all products")}</Link>
          </div>
          {products === null && !error && <ProductGridSkeleton />}
          {error && <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.danger }}>{error}</p>}
          {products !== null && products.length === 0 && (
            <p style={{ fontFamily: t.fonts.body, fontSize: '14px', color: t.colors.inkMuted }}>{tt('home.noProducts', "No products yet — check back soon.")}</p>
          )}
          {products !== null && products.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-10">
              {products.map(p => <NovaProductCard key={p._id} product={p} currency={currency} />)}
            </div>
          )}
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
  // A Hero / Slider section placed on Home replaces the fixed top hero. With no
  // slides of its own it shows the Store Banners at its own position, so it
  // only counts once it has a slide or there are banners to show.
  const hasBanners = (banners?.length ?? 0) > 0;
  const hasCustomHero = sections?.some(
    s => s.type === 'hero' && s.enabled !== false &&
      (hasBanners || s.blocks?.some(b => b.enabled !== false && b.settings?.imageUrl)),
  ) ?? false;
  // Real Store Banners are this theme's second hero source — same priority
  // as `AtelierHomePage`: a merchant-built custom hero section still wins
  // (never stack two full-bleed heroes), otherwise real banners now show
  // instead of the bare identity-only default.

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
