import { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  Store, CreditCard, Plug, Users, SlidersHorizontal, Boxes, History,
  Package, Wallet, Globe, ShieldCheck, Bell, Languages, FileText, Scale,
} from 'lucide-react';
import { TokenStorage, type AppRole } from '@/api/services/auth';
import { StorePageHeader, StoreNavMenu, useStoreWorkspace, hasNavPermission } from '@/components/layouts/StoreLayout';
import { SettingsShell, type SettingsNavGroup } from '@/components/comman/settings';
import { useKeepAliveTabs } from '@/hooks/useKeepAliveTabs';
import { apiGetStoreInventory } from '@/api/services/product';
import { apiSellerAnalyticsOverview } from '@/api/services/analytics/analytics';
import { formatMoneyCompact } from '@/utils/currency';

import { StoreProfileTab, ProductTypesTab, PaymentMethodsTab, DomainSettingsTab, PrivacyTab } from './StoreSettings';
import StorePlanBilling from './StorePlanBilling';
import StaffPage from './Staff';
import { MetafieldDefinitionsPage } from './MetafieldDefinitionsPage';
import { MetaobjectTypesPage } from './Metaobjects/MetaobjectTypesPage';
import { ActivityLogTab } from './tabs/ActivityLogTab';
import { NotificationsHub } from './notifications/NotificationsHub';
import { OrderDocumentsSettings } from './orderDocuments/OrderDocumentsSettings';
import { PoliciesSettings } from './policies/PoliciesSettings';
import { StoreIntegrations } from '../Operations/integrations/Integrations';
import { MarketsSettings } from '../Operations/MarketsSettings';

// Old `?tab=` ids (dashboard links, notification bell, bookmarks) → URL slugs.
const LEGACY_TAB_IDS: Record<string, string> = { 'store-profile': 'profile', activity: 'activity-log' };

// The hub's own navigation, grouped for the desktop rail (each group gets an
// eyebrow, each row a one-line hint). Mobile flattens this back into the single
// "Settings" list it always showed, in the same order.
const NAV_GROUPS: SettingsNavGroup[] = [
  {
    label: 'Store',
    items: [
      { id: 'profile',       label: 'Store Profile',  icon: <Store size={13} />,       hint: 'Name, logo, currency, tax' },
      { id: 'product-types', label: 'Product Types',  icon: <Package size={13} />,     hint: 'What this store can sell' },
      { id: 'privacy',       label: 'Privacy',        icon: <ShieldCheck size={13} />, hint: 'Visibility, consent, data requests' },
    ],
  },
  {
    label: 'Payments & billing',
    items: [
      { id: 'payment-methods', label: 'Payment Methods', icon: <Wallet size={13} />,     hint: 'Gateways, cash on delivery, payouts' },
      { id: 'billing',         label: 'Billing',         icon: <CreditCard size={13} />, hint: 'Plan, invoices, usage' },
    ],
  },
  {
    label: 'Markets & domains',
    items: [
      { id: 'domains', label: 'Domains', icon: <Globe size={13} />,     hint: 'Custom domain, white label' },
      { id: 'markets', label: 'Markets', icon: <Languages size={13} />, hint: 'Languages, regions, currencies' },
    ],
  },
  {
    label: 'Customer communications',
    items: [
      { id: 'notifications',   label: 'Notifications',   icon: <Bell size={13} />,     hint: 'Email and in-app alerts' },
      { id: 'policies',        label: 'Policies',        icon: <Scale size={13} />,    hint: 'Refund, shipping, terms' },
      { id: 'order-documents', label: 'Order documents', icon: <FileText size={13} />, hint: 'Invoices, receipts, packing slips' },
    ],
  },
  {
    label: 'Team & content',
    items: [
      { id: 'staff',         label: 'Staff',         icon: <Users size={13} />,             hint: 'Members, roles, invitations' },
      { id: 'custom-fields', label: 'Custom Fields', icon: <SlidersHorizontal size={13} />, hint: 'Metafield definitions' },
      { id: 'content-types', label: 'Content Types', icon: <Boxes size={13} />,             hint: 'Metaobject types' },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'integrations', label: 'Integrations', icon: <Plug size={13} />,    hint: 'Shipping, payments, apps' },
      { id: 'activity-log', label: 'Activity Log', icon: <History size={13} />, hint: 'Who changed what, and when' },
    ],
  },
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
          <div className="relative size-24 rounded-full bg-white/15 ring-4 ring-white/40 flex items-center justify-center overflow-hidden">
            <img
              loading="lazy" decoding="async"
              src={logo} alt={name ?? 'Store'}
              className="max-w-full max-h-full object-contain"
            />
          </div>
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

// Staff permission per tab (any-of); no entry = every role. UX gate only; the backend enforces.
const TAB_PERMS: Record<string, string[]> = {
  profile: ['settings.general.manage'], 'product-types': ['settings.general.manage'],
  'payment-methods': ['settings.payments.manage'], domains: ['settings.domains.manage'], privacy: ['settings.general.manage'],
  markets: ['settings.general.manage'], 'order-documents': ['settings.general.manage'], policies: ['onlinestore.content.manage'],
  billing: ['settings.billing.view', 'settings.billing.manage'], integrations: ['settings.payments.manage', 'settings.shipping.manage'],
  staff: ['staff.manage'], 'custom-fields': ['content.menus.manage', 'content.metaobjects.manage'],
  'content-types': ['content.menus.manage', 'content.metaobjects.manage'], 'activity-log': ['settings.general.manage'],
};

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
  const user = TokenStorage.getUser<{ role?: AppRole; permissions?: string[] }>();
  const GROUPS = NAV_GROUPS
    .map(g => ({ ...g, items: g.items.filter(t => !TAB_PERMS[t.id] || hasNavPermission(user, TAB_PERMS[t.id])) }))
    .filter(g => g.items.length > 0);
  const TAB_IDS = GROUPS.flatMap(g => g.items.map(t => t.id));
  const FIRST_TAB = TAB_IDS[0] ?? 'notifications';
  // Every tab has its own URL: /store/:storeId/settings/:tab. No tab = the
  // mobile menu screen (desktop redirects to /profile). Old `?tab=` links
  // (dashboard, notification bell, bookmarks) are redirected to the path form.
  const { tab: tabParam } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const legacyTab = searchParams.get('tab');
  const legacyId = legacyTab ? (LEGACY_TAB_IDS[legacyTab] ?? legacyTab) : null;
  const validTab = tabParam && TAB_IDS.includes(tabParam) ? tabParam : null;
  const { activeTab, setActiveTab, isVisited, paneClassName, warmOtherTabs } = useKeepAliveTabs(validTab ?? FIRST_TAB);
  useEffect(() => { if (validTab) setActiveTab(validTab); }, [validTab, setActiveTab]);
  // A tab renders nothing until its own data lands, so a first visit normally
  // costs mount + fetch after the click. Warm the remaining panes in the
  // background (mounted, hidden, one every few hundred ms) so switching to any
  // of them shows real content at once. Keyed on the id list, not the array,
  // because `TAB_IDS` is rebuilt every render.
  const tabIdsKey = TAB_IDS.join(',');
  useEffect(() => { warmOtherTabs(tabIdsKey.split(',')); }, [tabIdsKey, warmOtherTabs]);
  useEffect(() => {
    if (!tabParam && !legacyId && window.matchMedia('(min-width: 1024px)').matches) {
      navigate(`/store/${storeId}/settings/${FIRST_TAB}`, { replace: true });
    }
  }, [tabParam, legacyId, storeId, navigate]);
  // Mobile drill-in = a tab is in the URL (back arrow returns to /settings).
  const mobileDrilledIn = !!validTab;

  const openTab = (id: string) => navigate(`/store/${storeId}/settings/${id}`);

  if (legacyId && !tabParam && TAB_IDS.includes(legacyId)) {
    return <Navigate to={`/store/${storeId}/settings/${legacyId}`} replace />;
  }
  if (tabParam && !validTab) return <Navigate to={`/store/${storeId}/settings/${FIRST_TAB}`} replace />;

  return (
    <>
      <StorePageHeader title="Settings" subtitle="Your store's configuration, billing, integrations, and team access — all in one place." />

      {/* `SettingsShell` owns both navigation surfaces from these groups: the
         mobile menu screen (hero + flat rows list + the rest of the dashboard
         nav, since the sidebar isn't shown below `lg:`) and, on desktop, the
         sticky tab rail to the right of the content. Panes mount once, inside
         the shell — the mobile/desktop split is a display toggle, not a
         second render. */}
      <SettingsShell
        groups={GROUPS}
        activeId={activeTab}
        onOpen={openTab}
        drilledIn={mobileDrilledIn}
        onBack={() => navigate(`/store/${storeId}/settings`)}
        mobileHero={<MobileStoreHero storeId={storeId} name={store?.name} logo={store?.logo} status={store?.status} plan={store?.plan} />}
        mobileFooter={<StoreNavMenu storeId={storeId} excludeItemIds={['settings']} />}
      >
        {/* Each tab stays mounted (hidden via CSS) once visited, instead of
            unmounting on switch — a repeat visit is instant, no refetch/skeleton.
            Store Profile/Product Types/Payment Methods/Domains/Privacy/Billing/
            Integrations/Staff bring their own `px-4 lg:px-7 py-...` padding
            (unchanged from their standalone-page layout); the rest never had any
            of their own, so the hub adds it here. */}
        {isVisited('profile')    && <div className={paneClassName('profile')}><StoreProfileTab /></div>}
        {isVisited('product-types')    && <div className={paneClassName('product-types')}><ProductTypesTab /></div>}
        {isVisited('payment-methods')  && <div className={paneClassName('payment-methods')}><PaymentMethodsTab /></div>}
        {isVisited('domains')          && <div className={paneClassName('domains')}><DomainSettingsTab /></div>}
        {isVisited('privacy')          && <div className={paneClassName('privacy')}><PrivacyTab /></div>}
        {isVisited('markets')          && <div className={paneClassName('markets') + ' px-4 lg:px-7 py-6'}><MarketsSettings embedded /></div>}
        {isVisited('notifications') && (
          <div className={paneClassName('notifications') + ' px-4 lg:px-7 py-6'}>
            <NotificationsHub key={storeId} storeId={storeId} canManage={hasNavPermission(user, ['settings.general.manage'])} />
          </div>
        )}
        {isVisited('policies') && (
          <div className={paneClassName('policies') + ' px-4 lg:px-7 py-6'}>
            <PoliciesSettings key={storeId} canManage={hasNavPermission(user, ['onlinestore.content.manage'])} />
          </div>
        )}
        {isVisited('order-documents') && (
          <div className={paneClassName('order-documents') + ' px-4 lg:px-7 py-6'}>
            <OrderDocumentsSettings key={storeId} storeId={storeId} canManage={hasNavPermission(user, ['settings.general.manage'])} />
          </div>
        )}
        {isVisited('billing')       && <div className={paneClassName('billing')}><StorePlanBilling embedded /></div>}
        {isVisited('integrations')  && <div className={paneClassName('integrations')}><StoreIntegrations embedded /></div>}
        {isVisited('staff')         && <div className={paneClassName('staff')}><StaffPage embedded /></div>}
        {isVisited('custom-fields') && <div className={paneClassName('custom-fields') + ' px-4 lg:px-7 py-6'}><MetafieldDefinitionsPage embedded /></div>}
        {isVisited('content-types') && <div className={paneClassName('content-types') + ' px-4 lg:px-7 py-6'}><MetaobjectTypesPage embedded /></div>}
        {isVisited('activity-log')      && <div className={paneClassName('activity-log') + ' px-4 lg:px-7 py-6'}><ActivityLogTab /></div>}
      </SettingsShell>
    </>
  );
}
