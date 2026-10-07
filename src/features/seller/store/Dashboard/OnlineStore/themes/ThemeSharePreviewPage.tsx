import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { StorefrontProvider, resolveStorefrontCfg, resolveStorefrontLink, type StorefrontContextValue } from '@/features/storefront/StorefrontContext';
import type { PublicStoreData } from '@/api/services/store';
import { getThemeDemoPreview } from '@/features/storefront-themes/themeDemoPreview';
import { getThemePreviewComponents } from '@/features/storefront-themes/themePreviewComponents';
import { DEFAULT_THEME_ID } from '@/features/storefront-themes/registry';
import { resolveStorefrontLink } from '@/features/storefront/StorefrontContext';
import { apiGetPreviewByToken, type PreviewByTokenData } from '@/api/services/storeTheme';
import '@/features/storefront-themes/theme-01-atelier/atelier.css';
import '@/features/storefront-themes/theme-02-nova/nova.css';

/**
 * The PUBLIC (no-auth) half of "Share Preview" — real, shareable "see this
 * before it's live" link (route: `/theme-preview/:storeId/:token`). See
 * `PreviewToken`'s backend schema comment for the disclosed scope boundary:
 * this shows the seller's REAL draft colors/fonts/buttons/header/footer —
 * applied onto that theme's own demo content via the exact same
 * `applyMerchantThemeOverrides` mechanism every other merchant-customization
 * surface in this app already uses — not the seller's real live product
 * catalog. A future page could extend this to real sections/products; not
 * built this pass (would need a second parallel token-gated public data
 * path for `store-pages`/products, judged disproportionate for a first
 * version of this feature).
 */
export function ThemeSharePreviewPage() {
  const { storeId = '', token = '' } = useParams<{ storeId: string; token: string }>();
  const [data, setData] = useState<PreviewByTokenData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGetPreviewByToken(storeId, token)
      .then(res => setData(res.data))
      .catch(err => setError(err instanceof Error ? err.message : 'This preview link is invalid or has expired.'));
  }, [storeId, token]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] px-6 text-center">
        <p className="text-[14px] text-slate">{error}</p>
      </div>
    );
  }
  if (!data) {
    return <div className="min-h-screen bg-[#FAF9F5]" />;
  }

  const themeId = data.themeDefinitionId ?? DEFAULT_THEME_ID;
  const preview = getThemeDemoPreview(themeId);
  const { applyMerchantThemeOverrides } = getThemePreviewComponents(themeId, DEFAULT_THEME_ID);

  if (!preview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] px-6 text-center">
        <p className="text-[14px] text-slate">This theme doesn't have a preview available.</p>
      </div>
    );
  }

  // The one place this page mutates the theme singleton — same real
  // mechanism the Customize page's live preview and the public storefront
  // both already use, applied here with the seller's DRAFT colors instead
  // of either static defaults or live-published ones.
  applyMerchantThemeOverrides(data.theme);

  const { demoStore, demoSections, SectionRenderer, theme: t } = preview;
  const contextValue: StorefrontContextValue = {
    store: {
      storeId: 'preview', sellerId: 'preview', name: demoStore.name, slug: 'preview',
      logo: null, coverImage: null, description: demoStore.description, tagline: demoStore.tagline,
      contactEmail: null, contactPhone: null, categoryId: null, followersCount: 0, averageRating: 0, reviewCount: 0,
      builderConfig: null, baseCurrency: 'USD', enabledCurrencies: null, sellerType: null, badges: [], createdAt: new Date().toISOString(),
      activeCampaign: null, announcementBar: null, privacyMode: 'public', faviconUrl: null,
      cookieBannerEnabled: false, cookieBannerMessage: null, cookieBannerPosition: 'bottom_bar', cookieBannerColorMode: 'dark', showDoNotSellLink: false, guestCheckoutEnabled: false,
      primaryDomain: null, canonicalHost: null,
    } as PublicStoreData,
    theme: null,
    cfg: resolveStorefrontCfg(null),
    resolveLink: resolveStorefrontLink,
  };

  return (
    <StorefrontProvider value={contextValue}>
      <div style={{ background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body, minHeight: '100vh' }}>
        <header style={{ borderBottom: `1px solid ${t.colors.border}`, background: t.colors.bg }}>
          <div className="mx-auto flex items-center justify-between gap-6" style={{ maxWidth: t.layout.maxWidth, padding: `18px ${t.layout.containerPadX}` }}>
            <span style={{ fontFamily: t.fonts.display, fontSize: '22px', fontWeight: 600, color: t.colors.ink }}>{demoStore.name}</span>
            <nav aria-label="Store navigation" className="flex items-center gap-5">
              {(data.header?.blocks ?? []).filter(block => block.type === 'nav_link' && block.enabled !== false).map(block => {
                const target = resolveStorefrontLink(block.settings);
                return (
                  <div key={block._id ?? block.settings.label} className="relative group">
                    <a href={target.to ?? target.href ?? '/'} className="no-underline" style={{ color: t.colors.ink, fontFamily: t.fonts.body, fontSize: '13px', fontWeight: 600 }}>
                      {block.settings.label}
                    </a>
                    {(block.settings.children ?? []).length > 0 && <div className="absolute left-0 top-full z-30 hidden min-w-[180px] flex-col gap-3 border p-4 group-hover:flex group-focus-within:flex" style={{ background: t.colors.bg, borderColor: t.colors.border }}>
                      {block.settings.children.map((child: { id: string; label: string; linkType: string; pageSlug?: string; url?: string; categoryId?: string; collectionId?: string; productId?: string }) => {
                        const childTarget = resolveStorefrontLink(child);
                        return <a key={child.id} href={childTarget.to ?? childTarget.href ?? '/'} className="no-underline" style={{ color: t.colors.ink, fontFamily: t.fonts.body, fontSize: '12px' }}>{child.label}</a>;
                      })}
                    </div>}
                  </div>
                );
              })}
            </nav>
            <span
              style={{
                border: `1px solid ${t.colors.border}`,
                color: t.colors.ink,
                fontFamily: t.fonts.body,
                fontSize: '12px',
                fontWeight: 600,
                padding: '9px 18px',
                borderRadius: t.buttonRadiusPx,
              }}
            >
              Draft Preview — not live
            </span>
          </div>
        </header>

        <main>
          <SectionRenderer sections={demoSections} />
        </main>

        <footer style={{ background: t.colors.ink, color: t.colors.bg, marginTop: 0 }}>
          <p
            className="mx-auto text-center"
            style={{ maxWidth: t.layout.maxWidth, padding: `24px ${t.layout.containerPadX}`, fontFamily: t.fonts.body, fontSize: '12px', opacity: 0.6 }}
          >
            © {new Date().getFullYear()} {demoStore.name} — draft preview (sample content, real branding).
          </p>
        </footer>
      </div>
    </StorefrontProvider>
  );
}
