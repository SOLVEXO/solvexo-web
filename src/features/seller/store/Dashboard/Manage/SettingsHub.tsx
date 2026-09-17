import { useState } from 'react';
import {
  Store, CreditCard, Plug, Users, SlidersHorizontal, Boxes, History,
} from 'lucide-react';
import { StorePageHeader, StoreNavMenu, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { TabBar, type Tab } from '@/components/comman/ui/TabBar';

import StoreSettings from './StoreSettings';
import StorePlanBilling from './StorePlanBilling';
import StaffPage from './Staff';
import { MetafieldDefinitionsPage } from './MetafieldDefinitionsPage';
import { MetaobjectTypesPage } from './Metaobjects/MetaobjectTypesPage';
import { ActivityLogTab } from './tabs/ActivityLogTab';
import { StoreIntegrations } from '../Operations/integrations/Integrations';

const TABS: Tab[] = [
  { id: 'general',      label: 'General',      icon: <Store size={13} /> },
  { id: 'billing',      label: 'Billing',      icon: <CreditCard size={13} /> },
  { id: 'integrations', label: 'Integrations', icon: <Plug size={13} /> },
  { id: 'staff',        label: 'Staff',        icon: <Users size={13} /> },
  { id: 'custom-fields', label: 'Custom Fields', icon: <SlidersHorizontal size={13} /> },
  { id: 'content-types', label: 'Content Types', icon: <Boxes size={13} /> },
  { id: 'activity',     label: 'Activity Log', icon: <History size={13} /> },
];

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
  const { storeId } = useStoreWorkspace();
  const [activeTab, setActiveTab] = useState('general');

  return (
    <>
      <StorePageHeader title="Settings" subtitle="Your store's configuration, billing, integrations, and team access — all in one place." />

      <div className="px-4 md:px-7 pt-3">
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      {/* General/Billing/Integrations/Staff already bring their own
         `px-4 lg:px-7 py-...` padding internally (unchanged from their
         standalone-page layout) — Custom Fields/Content Types/Activity Log
         never had any of their own (their standalone routes relied on the
         page-level wrapper for it), so those three get it added here
         instead, matching each component's own pre-existing behavior. */}
      {activeTab === 'general'       && <StoreSettings />}
      {activeTab === 'billing'       && <StorePlanBilling embedded />}
      {activeTab === 'integrations'  && <StoreIntegrations embedded />}
      {activeTab === 'staff'         && <StaffPage embedded />}
      {activeTab === 'custom-fields' && <div className="px-4 lg:px-7 py-6"><MetafieldDefinitionsPage embedded /></div>}
      {activeTab === 'content-types' && <div className="px-4 lg:px-7 py-6"><MetaobjectTypesPage embedded /></div>}
      {activeTab === 'activity'      && <div className="px-4 lg:px-7 py-6"><ActivityLogTab /></div>}

      {/* Mobile-only — the app's real "jump to any other section" gateway,
         since the sidebar isn't shown below `lg:`. See the doc comment above. */}
      <div className="lg:hidden px-4 pb-6">
        <StoreNavMenu storeId={storeId} excludeItemIds={['settings']} />
      </div>
    </>
  );
}
