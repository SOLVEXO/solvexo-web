import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { apiGetPublicStoreProducts, type PublicStoreProduct } from '@/api/services/store';
import { apiGetPublicHomePage } from '@/api/services/storePages';
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
  useStorefrontSeo({ description: store.tagline || store.description || undefined, image: store.coverImage || store.logo || undefined });

  useEffect(() => {
    let cancelled = false;
    apiGetPublicHomePage(store.storeId)
      .then(res => { if (!cancelled) setSections(res.data.sections ?? []); })
      .catch(() => { if (!cancelled) setSections([]); });
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

  return (
    <main>
      {!hasCustomHero && <IdentityHero />}
      <div id="shop">
        {sections === null ? null : sections.length > 0 ? <AtelierSectionRenderer sections={sections} /> : <DefaultHomeContent />}
      </div>
    </main>
  );
}

export default AtelierHomePage;
