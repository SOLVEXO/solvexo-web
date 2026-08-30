import { StorefrontProvider, resolveStorefrontCfg, resolveStorefrontLink, type StorefrontContextValue } from '@/features/storefront/StorefrontContext';
import type { PublicStoreData } from '@/api/services/store';
import { AtelierSectionRenderer } from '@/features/storefront-themes/theme-01-atelier/sections';
import { ATELIER_DEMO_STORE, ATELIER_DEMO_SECTIONS } from '@/features/storefront-themes/theme-01-atelier/demo/atelierDemoData';
import { AtelierButton } from '@/features/storefront-themes/theme-01-atelier/components/AtelierButton';
import { atelierTheme as t } from '@/features/storefront-themes/theme-01-atelier/theme.config';
import '@/features/storefront-themes/theme-01-atelier/atelier.css';

const DEMO_STORE: PublicStoreData = {
  storeId: 'demo', sellerId: 'demo', name: ATELIER_DEMO_STORE.name, slug: 'demo',
  logo: null, coverImage: null, description: ATELIER_DEMO_STORE.description, tagline: ATELIER_DEMO_STORE.tagline,
  contactEmail: null, contactPhone: null, categoryId: null, followersCount: 0, averageRating: 0, reviewCount: 0,
  builderConfig: null, baseCurrency: 'USD', enabledCurrencies: null, sellerType: null, badges: [], createdAt: new Date().toISOString(),
  activeCampaign: null, announcementBar: null,
};

/** `Online Store → Themes → Atelier → Preview` — a genuinely isolated
 *  Theme Library preview. No real store/product/category/cart data, no API
 *  calls at all (`DEMO_STORE`/`ATELIER_DEMO_SECTIONS` are fully static) —
 *  this is intentional, not a shortcut: a theme preview must render for a
 *  seller BEFORE they've installed anything real. Uses the exact same real
 *  `AtelierSectionRenderer` the live storefront and the Customize preview
 *  both use, so what's shown here is genuinely representative, not a
 *  screenshot or a separately-maintained mockup. The header/footer here are
 *  a lightweight demo-only chrome (not `AtelierNavbar`/`AtelierFooter`,
 *  which fetch real store-scoped categories/collections/nav content) — same
 *  design tokens, since real storefront chrome has nothing meaningful to
 *  show without a real store behind it. */
export function AtelierThemeDemoPreview() {
  const contextValue: StorefrontContextValue = {
    store: DEMO_STORE,
    theme: null,
    cfg: resolveStorefrontCfg(null),
    resolveLink: resolveStorefrontLink,
  };

  return (
    <StorefrontProvider value={contextValue}>
      <div style={{ background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body, minHeight: '100vh' }}>
        <header style={{ borderBottom: `1px solid ${t.colors.border}`, background: t.colors.bg }}>
          <div className="mx-auto flex items-center justify-between" style={{ maxWidth: t.layout.maxWidth, padding: `18px ${t.layout.containerPadX}` }}>
            <span style={{ fontFamily: t.fonts.display, fontSize: '22px', fontWeight: 600, color: t.colors.ink }}>{DEMO_STORE.name}</span>
            <AtelierButton variant="outline" style={{ pointerEvents: 'none' }}>Preview Mode</AtelierButton>
          </div>
        </header>

        <main>
          <AtelierSectionRenderer sections={ATELIER_DEMO_SECTIONS} />
        </main>

        <footer style={{ background: t.colors.ink, color: '#EDE9E1', marginTop: '0' }}>
          <p className="mx-auto text-center" style={{ maxWidth: t.layout.maxWidth, padding: `24px ${t.layout.containerPadX}`, fontFamily: t.fonts.body, fontSize: '12px', color: '#8A8477' }}>
            © {new Date().getFullYear()} {DEMO_STORE.name} — Atelier theme preview (demo content, not a real store).
          </p>
        </footer>
      </div>
    </StorefrontProvider>
  );
}
