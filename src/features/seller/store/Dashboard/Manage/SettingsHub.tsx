import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Store, CreditCard, Plug, Users, SlidersHorizontal, Boxes, History,
  Package, Wallet, Globe, ShieldCheck, ChevronLeft, ChevronRight, Bell,
} from 'lucide-react';
import { StorePageHeader, StoreNavMenu, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { TabBar, type Tab } from '@/components/comman/ui/TabBar';
import { NotificationsPanel } from '@/components/comman/ui';
import { apiGetStoreInventory } from '@/api/services/product';
import { apiSellerAnalyticsOverview } from '@/api/services/analytics/analytics';
import { formatMoneyCompact } from '@/utils/currency';

import { StoreProfileTab, ProductTypesTab, PaymentMethodsTab, DomainSettingsTab, PrivacyTab } from './StoreSettings';
import StorePlanBilling from './StorePlanBilling';
import StaffPage from './Staff';
import { MetafieldDefinitionsPage } from './MetafieldDefinitionsPage';
import { MetaobjectTypesPage } from './Metaobjects/MetaobjectTypesPage';
import { ActivityLogTab } from './tabs/ActivityLogTab';
import { StoreIntegrations } from '../Operations/integrations/Integrations';

const TABS: Tab[] = [
  { id: 'store-profile', label: 'Store Profile',    icon: <Store size={13} /> },
  { id: 'product-types', label: 'Product Types',    icon: <Package size={13} /> },
  { id: 'payment-methods', label: 'Payment Methods', icon: <Wallet size={13} /> },
  { id: 'domains',       label: 'Domains',           icon: <Globe size={13} /> },
  { id: 'privacy',       label: 'Privacy',           icon: <ShieldCheck size={13} /> },
  { id: 'notifications', label: 'Notifications',     icon: <Bell size={13} /> },
  { id: 'billing',      label: 'Billing',      icon: <CreditCard size={13} /> },
  { id: 'integrations', label: 'Integrations', icon: <Plug size={13} /> },
  { id: 'staff',        label: 'Staff',        icon: <Users size={13} /> },
  { id: 'custom-fields', label: 'Custom Fields', icon: <SlidersHorizontal size={13} /> },
  { id: 'content-types', label: 'Content Types', icon: <Boxes size={13} /> },
  { id: 'activity',     label: 'Activity Log', icon: <History size={13} /> },
];

// ── Mobile-only store hero — same gradient hero + stats-strip pattern as
// SellerSettings.tsx's own `MobileSellerHero` ("Account" screen), just fed
// this STORE's own identity/plan/status instead of the seller's cross-store
// summary. Products/Orders/Revenue are the exact same real 30-day numbers
// the Dashboard shows — fetched independently here (self-contained, same
// convention as SetupGuideCard/RecentActivityCard's own self-fetching) since
// this hub has no access to the Dashboard's own metrics hook.
function MobileStoreHero({ storeId, name, logo, status, plan }: {
  storeId: string; name?: string; logo?: string | null; status?: string; plan?: string | null;
}) {
  const [stats, setStats] = useState<{ totalProducts: number; totalOrders: number; totalRevenue: number; currency: string | null } | null>(null);

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    Promise.all([
      apiGetStoreInventory(storeId, 1, 1),
      apiSellerAnalyticsOverview({ storeId, range: '30d' }),
    ])
      .then(([inventoryRes, overviewRes]) => {
        if (cancelled) return;
        setStats({
          totalProducts: inventoryRes.data.stats.totalProducts,
          totalOrders: overviewRes.data.totalOrders,
          totalRevenue: overviewRes.data.totalRevenue,
          currency: null,
        });
      })
      .catch(() => { if (!cancelled) setStats({ totalProducts: 0, totalOrders: 0, totalRevenue: 0, currency: null }); });
    return () => { cancelled = true; };
  }, [storeId]);

  const isLive = status === 'active';
  const statusLabel = isLive ? 'Store Live' : status === 'pending' ? 'Pending Review' : status === 'suspended' ? 'Suspended' : 'Not Live';
  const planLabel = plan ? `${plan.charAt(0).toUpperCase()}${plan.slice(1)} Plan` : 'Free Plan';

  return (
    <div className="lg:hidden -mx-4 -mt-3">
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-orange via-[#d98a6f] to-[#f0b8a0] px-6 pt-8 pb-12 flex flex-col items-center text-center">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '22px 22px' }}
        />
        {logo ? (
          <img
            loading="lazy" decoding="async"
            src={logo} alt={name ?? 'Store'}
            className="relative size-24 rounded-full object-cover ring-4 ring-white/40"
          />
        ) : (
          <div className="relative size-24 rounded-full bg-white/15 ring-4 ring-white/40 flex items-center justify-center text-white text-[26px] font-bold">
            {name ? name.slice(0, 2).toUpperCase() : 'ST'}
          </div>
        )}
        <p className="relative text-[19px] font-bold text-white mt-3 leading-tight">{name ?? 'Your Store'}</p>
        <div className="relative flex items-center gap-1.5 mt-3">
          <span className="inline-flex items-center gap-1 px-4 py-[6px] rounded-full bg-white/20 text-[11px] font-semibold text-white">
            <span className={`size-[6px] rounded-full ${isLive ? 'bg-white' : 'bg-white/50'}`} />
            {statusLabel}
          </span>
          <span className="inline-flex px-3 py-[6px] rounded-full bg-white/20 text-[11px] font-semibold text-white">
            {planLabel}
          </span>
        </div>
      </div>

      <div className="relative -mt-6 mx-4 rounded-t-[24px] bg-white px-2 pt-5 pb-4 flex items-center">
        <div className="flex-1 flex flex-col items-center gap-[2px]">
          <span className="text-[19px] font-bold text-brand-orange leading-none">{stats ? stats.totalProducts.toLocaleString() : '—'}</span>
          <span className="text-[11px] text-slate">Products</span>
        </div>
        <div className="w-px h-9 bg-bone" />
        <div className="flex-1 flex flex-col items-center gap-[2px]">
          <span className="text-[19px] font-bold text-brand-orange leading-none">{stats ? stats.totalOrders.toLocaleString() : '—'}</span>
          <span className="text-[11px] text-slate">Orders</span>
        </div>
        <div className="w-px h-9 bg-bone" />
        <div className="flex-1 flex flex-col items-center gap-[2px]">
          <span className="text-[19px] font-bold text-brand-orange leading-none">
            {stats ? formatMoneyCompact(stats.totalRevenue, stats.currency) : '—'}
          </span>
          <span className="text-[11px] text-slate">Revenue</span>
        </div>
      </div>
    </div>
  );
}

/** Single tabbed "Settings" hub — same Inventory-Hub-style consolidation
 *  (`InventoryHub.tsx`) of what used to be 6 separate top-level pages/routes
 *  (Store Settings, Billing, Integrations, Staff, Custom Fields, Content
 *  Types) plus Store Settings' own former "Activity Log" sub-tab, now
 *  promoted to a hub-level tab of its own. Each tab reuses its original
 *  component as-is (via an `embedded` prop that skips its own duplicate
 *  `StorePageHeader`, and — for Store Settings/Custom Fields/Content Types,
 *  whose header carried an action button — relocates that button inline
 *  into the tab body instead) — no logic was rebuilt, only the page shell.
 *  The old standalone routes (`/settings`, `/plan-billing`, `/integrations`,
 *  `/staff`, `/metafields`, `/metaobjects`) are still reachable by direct
 *  URL (this project's established "disconnect, don't delete" convention)
 *  — only the sidebar NAV was consolidated down to this one "Settings"
 *  entry. `Metaobjects`' own detail/session route (`/metaobjects/:id`)
 *  stays its own separate route, exactly like Purchase Orders' list→detail
 *  split already works — row-click there still navigates to that real URL.
 *  "Mobile App" deliberately does NOT live here — it's a sales-channel
 *  concept (native app/POS access), not store configuration, so it got its
 *  own separate nav entry instead of being folded into Settings.
 *
 *  A real, easy-to-miss regression this consolidation could have caused:
 *  the sidebar is desktop-only (`hidden lg:flex`, StoreLayout.tsx), so on
 *  mobile the bottom nav's "More" tab pointed straight at `/settings` as
 *  its one gateway into every OTHER section of the dashboard (Orders,
 *  Products, Marketing, etc. — see `StoreNavMenu`'s own doc comment). The
 *  old raw `StoreSettings.tsx` carried that `StoreNavMenu` render itself;
 *  now that `/settings` shows this hub instead, that gateway has to live
 *  here — excluding `'settings'` itself, same as before, since a mobile
 *  visitor is already looking at Settings' own tabs directly above it. */
export default function SettingsHub() {
  const { store, storeId } = useStoreWorkspace();
  // Deep-link support (`?tab=activity`, `?tab=billing`, …) — e.g. the
  // Dashboard's "View activity"/"View plan" links land on the right tab
  // instead of always opening on General. One-way only (reading the initial
  // value); switching tabs afterward doesn't rewrite the URL, same as
  // SellerSettings' own `?tab=` handling elsewhere in this app.
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    requestedTab && TABS.some(t => t.id === requestedTab) ? requestedTab : 'store-profile',
  );
  // Mobile-only drill-in state — mirrors SellerSettings.tsx's own
  // `mobileDrilledIn` pattern (the buyer AccountLayout's back-arrow drill-in,
  // done via local state since this hub has no per-tab routes). A mobile
  // visitor lands on a clean menu (this hub's own tabs + every other store
  // section) instead of straight into the Store Profile form — the real
  // regression this restores. Desktop ignores this entirely; the TabBar +
  // content are always shown there regardless.
  const [mobileDrilledIn, setMobileDrilledIn] = useState(
    !!(requestedTab && TABS.some(t => t.id === requestedTab)),
  );
  const activeTabLabel = TABS.find(t => t.id === activeTab)?.label ?? 'Settings';

  const openTab = (id: string) => { setActiveTab(id); setMobileDrilledIn(true); };

  return (
    <>
      <StorePageHeader title="Settings" subtitle="Your store's configuration, billing, integrations, and team access — all in one place." />

      {/* Mobile-only menu — this hub's own 11 tabs, styled the same
         icon-badge/chevron rows as StoreNavMenu below, plus every OTHER
         store section right underneath (Orders/Catalog/Online Store/etc.) —
         together the one real "jump to anything" home for a narrow
         viewport, since the sidebar isn't shown below `lg:`. Hidden once a
         section is opened (mobileDrilledIn) and always hidden on desktop. */}
      {!mobileDrilledIn && (
        <div className="lg:hidden px-4 pt-3 pb-6 flex flex-col gap-4">
          <MobileStoreHero storeId={storeId} name={store?.name} logo={store?.logo} status={store?.status} plan={store?.plan} />
          <div className="bg-white border border-bone rounded-2xl overflow-hidden">
            <div className="px-5 pt-4 pb-2">
              <p className="text-[10.5px] font-bold text-slate uppercase tracking-[0.06em]">Settings</p>
            </div>
            <div className="divide-y divide-[#f3f2ec]">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => openTab(tab.id)}
                  className="w-full flex items-center gap-3 px-5 py-[13px] bg-transparent border-0 cursor-pointer text-left hover:bg-cream transition-colors"
                >
                  <div className="w-8 h-8 rounded-[9px] bg-brand-pale-orange flex items-center justify-center shrink-0 text-brand-orange">
                    {tab.icon}
                  </div>
                  <span className="flex-1 text-[13px] font-medium text-charcoal">{tab.label}</span>
                  <ChevronRight size={15} className="text-slate shrink-0" />
                </button>
              ))}
            </div>
          </div>
          <StoreNavMenu storeId={storeId} excludeItemIds={['settings']} />
        </div>
      )}

      {/* Mobile-only back bar — shown only once a section is open, replacing
         the horizontal TabBar (which stays desktop-only below) so a mobile
         visitor is always looking at one focused screen at a time. */}
      {mobileDrilledIn && (
        <div className="lg:hidden flex items-center gap-2 px-4 pt-3 pb-1">
          <button
            onClick={() => setMobileDrilledIn(false)}
            aria-label="Back to settings menu"
            className="size-8 -ml-1 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer text-charcoal hover:bg-cream transition-colors"
          >
            <ChevronLeft size={19} />
          </button>
          <p className="text-[15px] font-bold text-carbon">{activeTabLabel}</p>
        </div>
      )}

      <div className="hidden lg:block px-4 md:px-7 pt-3">
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      {/* Store Profile/Product Types/Payment Methods/Domains/Privacy/Billing/
         Integrations/Staff already bring their own `px-4 lg:px-7 py-...`
         padding internally (unchanged from their standalone-page layout) —
         Custom Fields/Content Types/Activity Log never had any of their own
         (their standalone routes relied on the page-level wrapper for it),
         so those three get it added here instead, matching each component's
         own pre-existing behavior. Hidden on mobile until a section is
         opened (mobileDrilledIn) — always shown on desktop. */}
      <div className={mobileDrilledIn ? '' : 'hidden lg:block'}>
        {activeTab === 'store-profile'    && <StoreProfileTab />}
        {activeTab === 'product-types'    && <ProductTypesTab />}
        {activeTab === 'payment-methods'  && <PaymentMethodsTab />}
        {activeTab === 'domains'          && <DomainSettingsTab />}
        {activeTab === 'privacy'          && <PrivacyTab />}
        {activeTab === 'notifications' && <div className="px-4 lg:px-7 py-6"><NotificationsPanel /></div>}
        {activeTab === 'billing'       && <StorePlanBilling embedded />}
        {activeTab === 'integrations'  && <StoreIntegrations embedded />}
        {activeTab === 'staff'         && <StaffPage embedded />}
        {activeTab === 'custom-fields' && <div className="px-4 lg:px-7 py-6"><MetafieldDefinitionsPage embedded /></div>}
        {activeTab === 'content-types' && <div className="px-4 lg:px-7 py-6"><MetaobjectTypesPage embedded /></div>}
        {activeTab === 'activity'      && <div className="px-4 lg:px-7 py-6"><ActivityLogTab /></div>}
      </div>
    </>
  );
}
