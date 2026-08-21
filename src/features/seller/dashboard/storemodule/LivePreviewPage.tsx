import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Monitor, Tablet, Smartphone, Star, Users, Award, BadgeCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { CoverImage } from '@/components/comman/ui';
import { apiGetStoreById } from '@/api/services/store';
import { apiGetPublicStore, type PublicStoreData } from '@/api/services/store';
import { apiGetStoreThemeDraft, type StoreThemeData } from '@/api/services/storeTheme';
import { apiListStorePages, type StorePageData } from '@/api/services/storePages';
import { StorefrontProvider, resolveStorefrontCfg, resolveStorefrontLink, type StorefrontContextValue } from '@/features/storefront/StorefrontContext';
import { StorefrontNavbar } from '@/features/storefront/StorefrontNavbar';
import { StorefrontFooter } from '@/features/storefront/StorefrontFooter';
import { SectionRenderer } from '@/features/storefront/SectionRenderer';
import { DeviceFrame } from './builder/DeviceFrame';

type Device = 'desktop' | 'tablet' | 'mobile';
const DEVICE_WIDTH: Record<Device, number> = { desktop: 1280, tablet: 768, mobile: 390 };
const DEVICE_ICON: Record<Device, typeof Monitor> = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };

/**
 * Seller-authenticated-only, standalone (no dashboard sidebar) live preview
 * of the seller's REAL, currently-saved draft — the Theme draft (Phase 2:
 * `apiGetStoreThemeDraft`, never the published root fields) and the Home
 * page's currently-saved sections (the seller-only `apiListStorePages`,
 * which returns them regardless of publish status). Renders through the
 * exact same `StorefrontNavbar`/`SectionRenderer`/`StorefrontFooter`
 * components the real public storefront uses — this is what makes it a
 * genuine live preview instead of a second, drifting rendering path. Real
 * product/category/collection data flows in the same way it does on the
 * real storefront, since every section component fetches through the
 * already-public product-read endpoints.
 *
 * Distinct from `ThemePreviewPage` (public, no auth, renders one gallery
 * theme against static demo data) — this route must never be reachable by
 * anyone but the owning seller, since it reflects real unpublished business
 * content, not a themeId off a static list.
 */
export function LivePreviewPage() {
  const { storeId = '' } = useParams<{ storeId: string }>();
  const [device, setDevice] = useState<Device>('desktop');

  const [store, setStore] = useState<PublicStoreData | null>(null);
  const [theme, setTheme] = useState<StoreThemeData | null>(null);
  const [homePage, setHomePage] = useState<StorePageData | null>(null);
  // Set only when a Theme Marketplace "Use Theme" is pending (not yet
  // published) — takes priority over the home page's live `sections` so the
  // seller can actually preview a theme application before committing to it.
  const [pendingHomeSections, setPendingHomeSections] = useState<StorePageData['sections'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([
      apiGetStoreById(storeId).then(res => apiGetPublicStore(res.data.slug)),
      apiGetStoreThemeDraft(storeId),
      apiListStorePages(storeId),
    ])
      .then(([storeRes, draftRes, pagesRes]) => {
        if (cancelled) return;
        setStore(storeRes.data);
        // `apiGetStoreThemeDraft` returns the flat draft shape — reused as a
        // full `StoreThemeData` here since `resolveStorefrontCfg`/the
        // identity banner only ever read `.theme`/`.header`/`.footer`/
        // `.identityBanner`, never `._id`/`.storeId`/`.draft` on it.
        setTheme({
          _id: storeId, storeId,
          theme: draftRes.data.theme, header: draftRes.data.header, footer: draftRes.data.footer,
          identityBanner: draftRes.data.identityBanner, baseThemeId: draftRes.data.baseThemeId,
          draft: draftRes.data, lastPublishedAt: draftRes.data.lastPublishedAt,
        });
        setPendingHomeSections(draftRes.data.pendingHomeSections ?? null);
        setHomePage(pagesRes.data.find(p => p.type === 'home') ?? null);
      })
      .catch(() => { if (!cancelled) setError('Could not load your store for preview.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId]);

  const cfg = useMemo(() => resolveStorefrontCfg(theme), [theme]);
  const contextValue: StorefrontContextValue | null = useMemo(() => {
    if (!store) return null;
    return { store, theme, cfg, resolveLink: resolveStorefrontLink };
  }, [store, theme, cfg]);

  const identityBanner = theme?.identityBanner;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5]"><p className="text-[13px] text-slate">Loading your live preview…</p></div>;
  }
  if (error || !store || !contextValue) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#FAF9F5] p-6">
        <p className="text-[14px] text-slate">{error || 'Store not found.'}</p>
        <Link to={`/store/${storeId}/storebuilder`} className="text-[12.5px] font-semibold text-brand-orange no-underline">Back to Store Builder</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDEBE3] flex flex-col">
      <div className="sticky top-0 z-10 bg-white border-b border-bone px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to={`/store/${storeId}/storebuilder`} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate hover:text-charcoal no-underline shrink-0">
            <ArrowLeft size={14} /> Back to Store Builder
          </Link>
          <span className="w-px h-4 bg-bone shrink-0" />
          <p className="text-[13px] font-semibold text-charcoal truncate">
            {pendingHomeSections ? 'Live Preview — includes your pending theme application' : 'Live Preview — your real, unpublished draft'}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-cream border border-bone rounded-lg p-[3px] shrink-0">
          {(['desktop', 'tablet', 'mobile'] as Device[]).map(d => {
            const Icon = DEVICE_ICON[d];
            return (
              <button
                key={d} type="button" onClick={() => setDevice(d)} aria-label={d} title={d.charAt(0).toUpperCase() + d.slice(1)}
                className={clsx('w-8 h-7 rounded-md flex items-center justify-center border-none cursor-pointer transition-colors',
                  device === d ? 'bg-white text-brand-deep-orange shadow-sm' : 'bg-transparent text-slate hover:text-charcoal')}
              >
                <Icon size={14} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex justify-center py-6 px-4 overflow-x-auto">
        <div
          className={clsx('bg-white shrink-0', device !== 'desktop' && 'rounded-2xl overflow-hidden border border-bone shadow-lg')}
          style={{ width: DEVICE_WIDTH[device], height: 'calc(100vh - 110px)' }}
        >
          <DeviceFrame width={DEVICE_WIDTH[device]}>
            <StorefrontProvider value={contextValue}>
              <div data-store-theme={storeId} style={{ background: cfg.bgColor, color: cfg.textColor, fontFamily: `${cfg.font}, sans-serif` }}>
                {theme?.draft.customCss && <style>{theme.draft.customCss}</style>}
                <StorefrontNavbar />
                <LivePreviewIdentityBanner store={store} identityBanner={identityBanner} />
                {(pendingHomeSections ?? homePage?.sections) && <SectionRenderer sections={pendingHomeSections ?? homePage!.sections} />}
                <StorefrontFooter />
              </div>
            </StorefrontProvider>
          </DeviceFrame>
        </div>
      </div>
    </div>
  );
}

/** A read-only rendering of the real identity banner content/toggles — the
 *  Follow/Message/Loyalty/Membership buttons are shown (so the seller can
 *  confirm layout/visibility) but disabled, since this preview must never
 *  perform a real follow/message/purchase action against a live buyer
 *  account. Not the full `SellerStorefront` component: that one owns a lot
 *  of genuinely transactional logic (loyalty redemption, gift card
 *  purchase, subscription checkout) which has no place in a presentation
 *  preview per the storefront plan's Architectural Boundary. */
function LivePreviewIdentityBanner({ store, identityBanner }: { store: PublicStoreData; identityBanner?: StoreThemeData['identityBanner'] }) {
  const showFollow     = identityBanner?.showFollowButton     !== false;
  const showMessage    = identityBanner?.showMessageButton    !== false;
  const showLoyaltyBtn = identityBanner?.showLoyaltyButton    !== false;
  const showMembership = identityBanner?.showMembershipButton !== false;

  return (
    <div className="relative">
      <CoverImage src={store.coverImage} alt={store.name} className="w-full h-[160px] sm:h-[220px]" />
      <div className="px-4 sm:px-6 lg:px-10 pb-5 -mt-10 relative">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md overflow-hidden shrink-0">
            {store.logo ? <img src={store.logo} alt={store.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-cream flex items-center justify-center text-slate text-xl font-bold">{store.name.charAt(0)}</div>}
          </div>
          <div className="flex-1 min-w-[200px] pb-1">
            <h1 className="text-[20px] font-bold text-white sm:text-charcoal">{store.name}</h1>
            {store.description && <p className="text-[12.5px] text-slate mt-[2px] max-w-xl line-clamp-2">{store.description}</p>}
            <div className="flex flex-wrap items-center gap-3 mt-[6px] text-[11.5px] text-slate">
              <span className="flex items-center gap-1"><Star size={12} className="text-amber-500 fill-amber-500" /> {store.averageRating.toFixed(1)} ({store.reviewCount})</span>
              <span className="flex items-center gap-1"><Users size={12} /> {store.followersCount} followers</span>
              {store.badges.includes('verified') && <span className="flex items-center gap-1 text-blue-600"><BadgeCheck size={12} /> Verified</span>}
              {store.badges.includes('top_seller') && <span className="flex items-center gap-1 text-amber-700"><Award size={12} /> Top Seller</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap pb-1">
            {showFollow && <button disabled className="px-3.5 py-[7px] rounded-full text-[12px] font-semibold border border-bone bg-white text-charcoal cursor-not-allowed opacity-70">Follow</button>}
            {showMessage && <button disabled className="px-3.5 py-[7px] rounded-full text-[12px] font-semibold border border-bone bg-white text-charcoal cursor-not-allowed opacity-70">Message</button>}
            {showLoyaltyBtn && <button disabled className="px-3.5 py-[7px] rounded-full text-[12px] font-semibold border border-bone bg-white text-charcoal cursor-not-allowed opacity-70">Rewards</button>}
            {showMembership && <button disabled className="px-3.5 py-[7px] rounded-full text-[12px] font-semibold border border-bone bg-white text-charcoal cursor-not-allowed opacity-70">Membership</button>}
          </div>
        </div>
        <p className="text-[10.5px] text-slate mt-2 italic">Preview mode — buttons above are shown for layout only and don't perform real actions.</p>
      </div>
    </div>
  );
}
