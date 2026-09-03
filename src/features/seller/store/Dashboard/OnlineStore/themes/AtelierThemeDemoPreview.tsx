import { useParams } from 'react-router-dom';
import { StorefrontProvider, resolveStorefrontCfg, resolveStorefrontLink, type StorefrontContextValue } from '@/features/storefront/StorefrontContext';
import type { PublicStoreData } from '@/api/services/store';
import { getThemeDemoPreview, type ThemeDemoPreviewData } from '@/features/storefront-themes/themeDemoPreview';
import '@/features/storefront-themes/theme-01-atelier/atelier.css';
import '@/features/storefront-themes/theme-02-nova/nova.css';

/** Shared by `ThemeDemoPreview` (full page) and `ThemeThumbnail` (Theme
 *  Library card) below — both need the exact same isolated demo storefront
 *  context, so this is the one place that's built rather than each keeping
 *  its own separate copy. */
function buildDemoContextValue(demoStore: ThemeDemoPreviewData['demoStore']): StorefrontContextValue {
  const demoStoreData: PublicStoreData = {
    storeId: 'demo', sellerId: 'demo', name: demoStore.name, slug: 'demo',
    logo: null, coverImage: null, description: demoStore.description, tagline: demoStore.tagline,
    contactEmail: null, contactPhone: null, categoryId: null, followersCount: 0, averageRating: 0, reviewCount: 0,
    builderConfig: null, baseCurrency: 'USD', enabledCurrencies: null, sellerType: null, badges: [], createdAt: new Date().toISOString(),
    activeCampaign: null, announcementBar: null, privacyMode: 'public', faviconUrl: null,
  };
  return {
    store: demoStoreData,
    theme: null,
    cfg: resolveStorefrontCfg(null),
    resolveLink: resolveStorefrontLink,
  };
}

/** `Online Store → Themes → Preview` (route: `online-store/themes/:themeId/preview`)
 *  — a genuinely isolated, THEME-AGNOSTIC Theme Library preview. No real
 *  store/product/category/cart data, no API calls at all — every registered
 *  theme supplies its own static demo content via `themeDemoPreview.ts` (see
 *  that file's doc comment for the real bug this replaces: rendering a
 *  candidate theme against another theme's REAL saved section data used to
 *  silently drop any section type the candidate hadn't implemented, so a
 *  preview could look genuinely incomplete rather than representative).
 *  Every theme's own demo content only ever uses section types that theme
 *  itself actually renders, so this always looks like a complete, finished
 *  theme — for ANY registered theme id, with zero per-theme code here.
 *
 *  (This file is still named after Atelier for historical reasons — it was
 *  Atelier-only before this generalization — but its exports are genuinely
 *  generic now; a filename rename was left for a later pass rather than
 *  risk an extra file-move in the same change.) */
export function ThemeDemoPreview() {
  const { themeId = '' } = useParams<{ themeId: string }>();
  const preview = getThemeDemoPreview(themeId);

  if (!preview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] px-6 text-center">
        <p className="text-[14px] text-slate">This theme doesn't have a preview available.</p>
      </div>
    );
  }

  const { demoStore, demoSections, SectionRenderer, theme: t } = preview;
  const contextValue = buildDemoContextValue(demoStore);

  return (
    <StorefrontProvider value={contextValue}>
      <div style={{ background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body, minHeight: '100vh' }}>
        <header style={{ borderBottom: `1px solid ${t.colors.border}`, background: t.colors.bg }}>
          <div className="mx-auto flex items-center justify-between" style={{ maxWidth: t.layout.maxWidth, padding: `18px ${t.layout.containerPadX}` }}>
            <span style={{ fontFamily: t.fonts.display, fontSize: '22px', fontWeight: 600, color: t.colors.ink }}>{demoStore.name}</span>
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
              Preview Mode
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
            © {new Date().getFullYear()} {demoStore.name} — {preview.name} theme preview (demo content, not a real store).
          </p>
        </footer>
      </div>
    </StorefrontProvider>
  );
}

/** A small, live, non-interactive rendering of a theme's real demo homepage —
 *  the Theme Library card's visual thumbnail. Answers a real, fair
 *  complaint: every mainstream theme picker (WordPress, Shopify) shows what
 *  a theme actually LOOKS like right on its card — this one used to show
 *  only a text description, forcing a seller to open a separate preview
 *  just to see the design. Deliberately live-rendered through the theme's
 *  own real `SectionRenderer` rather than a static screenshot image — it
 *  can never go stale as a theme's demo content evolves, and reuses the
 *  exact same registry `ThemeDemoPreview` already reads, so there is
 *  nothing new to keep in sync. */
export function ThemeThumbnail({ themeId, className }: { themeId: string; className?: string }) {
  const preview = getThemeDemoPreview(themeId);

  if (!preview) {
    return <div className={className} style={{ aspectRatio: '4 / 3', background: '#F1EDE5' }} />;
  }

  const { demoStore, demoSections, SectionRenderer, theme: t } = preview;
  const contextValue = buildDemoContextValue(demoStore);

  return (
    <div className={className} style={{ position: 'relative', overflow: 'hidden', aspectRatio: '4 / 3', background: t.colors.bg }}>
      <StorefrontProvider value={contextValue}>
        {/* Responsive "zoom and clip" thumbnail: the inner box is sized as a
           PERCENTAGE of this container's own computed width (400%) and
           scaled down by the exact reciprocal (0.25) — percentage widths
           resolve against the parent's real width at every breakpoint, so
           the two cancel out proportionally and this looks identical
           whether the card is 260px or 420px wide, with no per-breakpoint
           tuning needed. */}
        <div
          aria-hidden="true"
          style={{
            width: '400%',
            transform: 'scale(0.25)',
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
          }}
        >
          <SectionRenderer sections={demoSections} />
        </div>
      </StorefrontProvider>
    </div>
  );
}
