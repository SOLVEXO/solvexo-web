import { useMemo } from 'react';
import { clsx } from 'clsx';
import type { PublicStoreData } from '@/api/services/store';
import type { StoreThemeData } from '@/api/services/storeTheme';
import type { Section } from '@/api/services/storefrontTypes';
import type { ThemeDefinition } from '@/api/services/themeCatalog';
import { StorefrontProvider, resolveStorefrontCfg, type StorefrontContextValue, type StorefrontCfg } from '@/features/storefront/StorefrontContext';
import { StorefrontNavbar } from '@/features/storefront/StorefrontNavbar';
import { StorefrontFooter } from '@/features/storefront/StorefrontFooter';
import { HeroSection } from '@/features/storefront/sections/HeroSection';
import { RichTextSection } from '@/features/storefront/sections/RichTextSection';
import { ImageWithTextSection } from '@/features/storefront/sections/ImageWithTextSection';
import { TestimonialsSection } from '@/features/storefront/sections/TestimonialsSection';
import { FaqSection } from '@/features/storefront/sections/FaqSection';
import { VideoSection } from '@/features/storefront/sections/VideoSection';
import { FeaturedCategoryGridSection } from '@/features/storefront/sections/FeaturedCategoryGridSection';
import { TrustBadgesSection } from '@/features/storefront/sections/TrustBadgesSection';
import { NewsletterSection } from '@/features/storefront/sections/NewsletterSection';
import { FeatureListSection } from '@/features/storefront/sections/FeatureListSection';
import { SpecTableSection } from '@/features/storefront/sections/SpecTableSection';
import { MenuListSection } from '@/features/storefront/sections/MenuListSection';
import { TeamGridSection } from '@/features/storefront/sections/TeamGridSection';
import { LocationInfoSection } from '@/features/storefront/sections/LocationInfoSection';
import { StatsCounterSection } from '@/features/storefront/sections/StatsCounterSection';
import { GalleryGridSection } from '@/features/storefront/sections/GalleryGridSection';
import { ProductCardShell, ProductCardImage } from '@/features/storefront/ProductCard';
import { THEME_DEMO_CONTENT, DEFAULT_DEMO_CONTENT, type DemoProduct } from './ThemeDemoData';

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

// The one substitution the demo renderer makes: `featured_products`/
// `product_catalog` sections fetch a REAL store's products when rendered by
// the real `SectionRenderer` — meaningless (and network-noisy) for a
// no-real-store demo preview, so they render this synthetic grid instead.
// Every other section type renders through the exact real component
// `SectionRenderer.tsx` uses, since none of them need a live store's data.
function DemoProductGrid({ heading, products, cfg }: { heading?: string; products: DemoProduct[]; cfg: StorefrontCfg }) {
  return (
    <div className="px-4 sm:px-6 lg:px-10" style={{ paddingTop: 32 * cfg.sectionSpacingScale, paddingBottom: 32 * cfg.sectionSpacingScale }}>
      {heading && (
        <h2 className="font-bold mb-4" style={{ color: cfg.textColor, fontSize: Math.round(22 * cfg.typeScaleFactor) }}>{heading}</h2>
      )}
      <div className={clsx('grid grid-cols-2 sm:grid-cols-3', cfg.productGridDensity === 'relaxed' ? 'gap-5' : 'gap-3')}>
        {products.map(p => <DemoProductCard key={p.name} product={p} cfg={cfg} />)}
      </div>
    </div>
  );
}

function renderDemoSection(section: Section, key: string | number, demo: typeof DEFAULT_DEMO_CONTENT, cfg: StorefrontCfg) {
  if (section.enabled === false) return null;
  const blocks = section.blocks.filter(b => b.enabled !== false);
  switch (section.type) {
    case 'featured_products':
    case 'product_catalog':
      return <DemoProductGrid key={key} heading={section.settings.heading} products={demo.products} cfg={cfg} />;
    case 'hero':
      return <HeroSection key={key} settings={section.settings} blocks={blocks.map(b => b.settings) as any} />;
    case 'rich_text':
      return <RichTextSection key={key} settings={section.settings} blocks={blocks.map(b => ({ type: b.type, settings: b.settings })) as any} />;
    case 'image_with_text':
      return <ImageWithTextSection key={key} settings={section.settings} blocks={blocks.map(b => b.settings) as any} />;
    case 'testimonials':
      return <TestimonialsSection key={key} settings={section.settings} blocks={blocks.map(b => b.settings) as any} />;
    case 'faq':
      return <FaqSection key={key} settings={section.settings} blocks={blocks.map(b => b.settings) as any} />;
    case 'video':
      return <VideoSection key={key} settings={section.settings as any} />;
    case 'featured_category_grid':
      return <FeaturedCategoryGridSection key={key} settings={section.settings as any} />;
    case 'trust_badges':
      return <TrustBadgesSection key={key} settings={section.settings} blocks={blocks.map(b => b.settings) as any} />;
    case 'newsletter':
      return <NewsletterSection key={key} settings={section.settings as any} />;
    case 'feature_list':
      return <FeatureListSection key={key} settings={section.settings} blocks={blocks.map(b => b.settings) as any} />;
    case 'spec_table':
      return <SpecTableSection key={key} settings={section.settings} blocks={blocks.map(b => b.settings) as any} />;
    case 'menu_list':
      return <MenuListSection key={key} settings={section.settings} blocks={blocks.map(b => b.settings) as any} />;
    case 'team_grid':
      return <TeamGridSection key={key} settings={section.settings} blocks={blocks.map(b => b.settings) as any} />;
    case 'location_info':
      return <LocationInfoSection key={key} settings={section.settings as any} />;
    case 'stats_counter':
      return <StatsCounterSection key={key} settings={section.settings} blocks={blocks.map(b => b.settings) as any} />;
    case 'gallery_grid':
      return <GalleryGridSection key={key} settings={section.settings} blocks={blocks.map(b => b.settings) as any} />;
    default:
      return null;
  }
}

export function buildDemoStorefrontData(theme: ThemeDefinition): { store: PublicStoreData; themeData: StoreThemeData } {
  const demo = THEME_DEMO_CONTENT[theme.slug] ?? DEFAULT_DEMO_CONTENT;
  const store: PublicStoreData = {
    storeId: `demo-${theme._id}`, sellerId: 'demo', name: demo.storeName, slug: 'demo',
    logo: null, coverImage: null, description: null, tagline: null, contactEmail: null, contactPhone: null, categoryId: null,
    followersCount: 0, averageRating: 0, reviewCount: 0, builderConfig: null,
    baseCurrency: 'USD', sellerType: null, badges: [],
    createdAt: new Date().toISOString(), activeCampaign: null, announcementBar: null,
  };
  const header = { logoSource: 'store' as const, customLogoUrl: null, blocks: [
    { type: 'nav_link', settings: { label: 'Shop', linkType: 'home' } },
    { type: 'nav_link', settings: { label: 'New In', linkType: 'home' } },
    { type: 'nav_link', settings: { label: 'About', linkType: 'home' } },
  ], navAlignment: 'left' as const, headerStyle: theme.header.headerStyle };
  const footer = { blocks: DEMO_FOOTER_BLOCKS, footerStyle: theme.footer.footerStyle };
  const identityBanner = theme.identityBanner ?? {
    showFollowButton: true, showMessageButton: true, showLoyaltyButton: true, showMembershipButton: true,
    layout: 'standard' as const, showBadges: true, showFollowerCount: true, showProductCount: true, showRating: true, descriptionMaxLines: null,
  };
  const themeData: StoreThemeData = {
    _id: `demo-${theme._id}`, storeId: `demo-${theme._id}`,
    theme: theme.theme, header, footer, identityBanner, baseThemeId: theme._id,
    // A static demo doc has no real draft/publish concept — mirrors the live
    // fields so it satisfies the shape without implying anything's actually
    // unpublished (nothing here is ever read via `.draft`).
    draft: { theme: theme.theme, header, footer, identityBanner, baseThemeId: theme._id, pendingHomeSections: null, customCss: null },
    lastPublishedAt: null,
  };
  return { store, themeData };
}

/** A real, fully rendered demo storefront for one catalog theme — renders
 *  the theme's own `homePageSections` (its real, authored section
 *  composition — what makes a theme structurally distinct, not just a
 *  recolor) through the SAME section components the real storefront uses,
 *  substituting only product-fetching sections with a small synthetic demo
 *  grid (see `renderDemoSection`). Falls back to a generic hero + product
 *  grid + testimonials composition for a theme with no sections defined yet
 *  (e.g. mid-authoring in the admin). Used two ways: `compact` (the Theme
 *  Gallery card, scaled down, first couple of sections only — see
 *  `ThemeStorefrontPreview.tsx`) and full-size (`ThemePreviewPage`, every
 *  section, real Desktop/Mobile toggle). */
export function ThemeDemoStorefront({ theme, compact = false }: { theme: ThemeDefinition; compact?: boolean }) {
  const demo = THEME_DEMO_CONTENT[theme.slug] ?? DEFAULT_DEMO_CONTENT;

  const { store, themeData } = useMemo(() => buildDemoStorefrontData(theme), [theme]);
  const cfg = useMemo(() => resolveStorefrontCfg(themeData), [themeData]);
  const contextValue: StorefrontContextValue = useMemo(() => ({
    store, theme: themeData, cfg, resolveLink: () => ({}),
  }), [store, themeData, cfg]);

  const fallbackSections: Section[] = useMemo(() => [
    { type: 'hero', settings: { heightPreset: compact ? 'medium' : 'large' }, blocks: [
      { type: 'hero_slide', settings: { imageUrl: demo.heroImage, heading: demo.heroHeadline, subheading: demo.heroSubheading, ctaText: demo.heroCta } } as any,
    ], enabled: true },
    { type: 'product_catalog', settings: { heading: 'Our Products' }, blocks: [], enabled: true },
    { type: 'testimonials', settings: { heading: 'What customers say' }, blocks: [
      { type: 'testimonial', settings: demo.testimonial } as any,
    ], enabled: true },
  ], [demo]);

  const sections = theme.homePageSections && theme.homePageSections.length > 0 ? theme.homePageSections : fallbackSections;
  const visible = compact ? sections.slice(0, 2) : sections;

  return (
    <StorefrontProvider value={contextValue}>
      <div style={{ background: cfg.bgColor, fontFamily: `${cfg.font}, sans-serif` }}>
        <StorefrontNavbar />
        {visible.map((section, i) => renderDemoSection(section, section._id ?? i, demo, cfg))}
        {!compact && <StorefrontFooter />}
      </div>
    </StorefrontProvider>
  );
}
