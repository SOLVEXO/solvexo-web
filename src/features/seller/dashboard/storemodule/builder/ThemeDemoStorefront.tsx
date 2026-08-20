import { useMemo } from 'react';
import { clsx } from 'clsx';
import type { PublicStoreData } from '@/api/services/store';
import type { StoreThemeData } from '@/api/services/storeTheme';
import { StorefrontProvider, resolveStorefrontCfg, type StorefrontContextValue, type StorefrontCfg } from '@/features/storefront/StorefrontContext';
import { StorefrontNavbar } from '@/features/storefront/StorefrontNavbar';
import { StorefrontFooter } from '@/features/storefront/StorefrontFooter';
import { HeroSection } from '@/features/storefront/sections/HeroSection';
import { TestimonialsSection } from '@/features/storefront/sections/TestimonialsSection';
import { ProductCardShell, ProductCardImage } from '@/features/storefront/ProductCard';
import type { ThemeDefinition } from './themes';
import { THEME_DEMO_CONTENT, type DemoProduct } from './ThemeDemoData';

// Generic, theme-agnostic demo footer content — real enough that every
// theme's footerStyle (columns vs. minimal) has something real to compose,
// without needing per-theme footer copy (the content itself doesn't need to
// vary by theme, only its chrome does).
const DEMO_FOOTER_BLOCKS = [
  { type: 'footer_column', settings: { heading: 'Shop', links: [
    { label: 'All Products', linkType: 'home' },
    { label: 'New Arrivals', linkType: 'home' },
    { label: 'Best Sellers', linkType: 'home' },
  ] } },
  { type: 'footer_column', settings: { heading: 'Support', links: [
    { label: 'Contact Us', linkType: 'home' },
    { label: 'Shipping & Returns', linkType: 'home' },
    { label: 'FAQ', linkType: 'home' },
  ] } },
  { type: 'social_link', settings: { platform: 'instagram', url: '#' } },
  { type: 'social_link', settings: { platform: 'facebook', url: '#' } },
  { type: 'copyright_text', settings: { text: '' } }, // falls back to "© {year} {store.name}"
];

function DemoProductCard({ product, cfg }: { product: DemoProduct; cfg: StorefrontCfg }) {
  return (
    <ProductCardShell className="text-left">
      <ProductCardImage>
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
        {product.badge && (
          <div className="absolute top-[8px] left-[8px]">
            <span className="px-[7px] py-[3px] rounded-[4px] text-[11px] font-bold text-white leading-none" style={{ background: cfg.primaryColor }}>{product.badge}</span>
          </div>
        )}
      </ProductCardImage>
      <div className="px-3 pt-[10px] pb-3">
        <p className="font-bold text-[15px] mb-[5px] leading-[1.3]" style={{ color: cfg.textColor }}>{product.name}</p>
        <p className="font-bold text-[16px]" style={{ color: cfg.textColor }}>${product.price}</p>
      </div>
    </ProductCardShell>
  );
}

export function buildDemoStorefrontData(theme: ThemeDefinition): { store: PublicStoreData; themeData: StoreThemeData } {
  const demo = THEME_DEMO_CONTENT[theme.id];
  const store: PublicStoreData = {
    storeId: `demo-${theme.id}`, sellerId: 'demo', name: demo.storeName, slug: 'demo',
    logo: null, coverImage: null, description: null, tagline: null, contactEmail: null, contactPhone: null, categoryId: null,
    followersCount: 0, averageRating: 0, reviewCount: 0, builderConfig: null,
    baseCurrency: 'USD', sellerType: null, badges: [],
    createdAt: new Date().toISOString(), activeCampaign: null, announcementBar: null,
  };
  const header = { logoSource: 'store' as const, customLogoUrl: null, blocks: [
    { type: 'nav_link', settings: { label: 'Shop', linkType: 'home' } },
    { type: 'nav_link', settings: { label: 'New In', linkType: 'home' } },
    { type: 'nav_link', settings: { label: 'About', linkType: 'home' } },
  ], navAlignment: 'left' as const, headerStyle: theme.headerStyle };
  const footer = { blocks: DEMO_FOOTER_BLOCKS, footerStyle: theme.footerStyle };
  const identityBanner = {
    showFollowButton: true, showMessageButton: true, showLoyaltyButton: true, showMembershipButton: true,
    layout: 'standard' as const, showBadges: true, showFollowerCount: true, showProductCount: true, showRating: true, descriptionMaxLines: null,
  };
  const themeData: StoreThemeData = {
    _id: `demo-${theme.id}`, storeId: `demo-${theme.id}`,
    theme: theme.colors, header, footer, identityBanner, baseThemeId: theme.id,
    // A static demo doc has no real draft/publish concept — mirrors the live
    // fields so it satisfies the shape without implying anything's actually
    // unpublished (nothing here is ever read via `.draft`).
    draft: { theme: theme.colors, header, footer, identityBanner, baseThemeId: theme.id },
    lastPublishedAt: null,
  };
  return { store, themeData };
}

/** A real, fully rendered demo storefront for one theme — the SAME
 *  `StorefrontNavbar`/`HeroSection`/`TestimonialsSection`/`StorefrontFooter`/
 *  product-card primitives the real storefront uses, fed a small local demo
 *  dataset (`ThemeDemoData.ts`) instead of a live API call. Used two ways:
 *  `compact` (the Theme Gallery card, scaled down, header+hero+products
 *  only — see `ThemeStorefrontPreview.tsx`) and full-size (`ThemePreviewPage`,
 *  every section including testimonials/footer, real Desktop/Mobile toggle)
 *  — this is the ONE place either consumer's content/markup lives, so the
 *  two can never quietly drift apart. */
export function ThemeDemoStorefront({ theme, compact = false }: { theme: ThemeDefinition; compact?: boolean }) {
  const demo = THEME_DEMO_CONTENT[theme.id];

  const { store, themeData } = useMemo(() => buildDemoStorefrontData(theme), [theme]);
  const cfg = useMemo(() => resolveStorefrontCfg(themeData), [themeData]);
  const contextValue: StorefrontContextValue = useMemo(() => ({
    store, theme: themeData, cfg, resolveLink: () => ({}),
  }), [store, themeData, cfg]);

  const heroSlide = useMemo(() => ({
    imageUrl: demo.heroImage, heading: demo.heroHeadline, subheading: demo.heroSubheading, ctaText: demo.heroCta,
  }), [demo]);

  const testimonialBlock = useMemo(() => ({
    quote: demo.testimonial.quote, authorName: demo.testimonial.authorName,
    authorRole: demo.testimonial.authorRole, rating: demo.testimonial.rating,
  }), [demo]);

  return (
    <StorefrontProvider value={contextValue}>
      <div style={{ background: cfg.bgColor, fontFamily: `${cfg.font}, sans-serif` }}>
        <StorefrontNavbar />
        <HeroSection settings={{ heightPreset: compact ? 'medium' : 'large' }} blocks={[heroSlide]} />
        <div className="px-4 sm:px-6 lg:px-10" style={{ paddingTop: 32 * cfg.sectionSpacingScale, paddingBottom: 32 * cfg.sectionSpacingScale }}>
          <h2 className="font-bold mb-4" style={{ color: cfg.textColor, fontSize: Math.round(22 * cfg.typeScaleFactor) }}>Our Products</h2>
          <div className={clsx('grid grid-cols-2 sm:grid-cols-3', cfg.productGridDensity === 'relaxed' ? 'gap-5' : 'gap-3')}>
            {demo.products.map(p => <DemoProductCard key={p.name} product={p} cfg={cfg} />)}
          </div>
        </div>
        {!compact && (
          <>
            <TestimonialsSection settings={{ heading: 'What customers say' }} blocks={[testimonialBlock]} />
            <StorefrontFooter />
          </>
        )}
      </div>
    </StorefrontProvider>
  );
}
