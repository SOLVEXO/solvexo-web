import { Navigate } from 'react-router-dom';
import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { NoTabAccess } from '@/components/comman/ui/NoTabAccess';
import { TabBar } from '@/components/comman/ui';
import { useRouteTabs } from '@/hooks/useRouteTabs';
import { storeUrlFor } from '@/features/seller/store/Dashboard/Operations/marketing/emailDesign';
import { GrowthOverview } from './GrowthOverview';
import { GrowthCampaigns } from './GrowthCampaigns';
import { GrowthAttribution } from './GrowthAttribution';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'attribution', label: 'Attribution' },
];

// The reports come from the analytics API (analytics.view); saved campaigns are managed with marketing.manage.
const PERMS: Record<string, string[]> = {
  overview: ['analytics.view'],
  campaigns: ['marketing.manage', 'analytics.view'],
  attribution: ['analytics.view'],
};

/** Shopify's Growth section: Overview, Campaigns and Attribution for the online store. */
export function StoreGrowth() {
  const { store, storeId } = useStoreWorkspace();
  const { visibleTabs, activeTab, openTab, redirectTo, blocked } = useRouteTabs({ tabs: TABS, base: 'growth', permissions: PERMS });

  if (redirectTo) return <Navigate to={redirectTo} replace />;
  if (blocked) return <NoTabAccess title="Growth" />;

  return (
    <>
      <StorePageHeader title="Growth" subtitle="See what your marketing brings in: visits, orders and sales by channel and campaign." />
      <div className="px-4 lg:px-7 pt-3 pb-8 flex flex-col gap-5">
        <TabBar tabs={visibleTabs} active={activeTab} onChange={openTab} />
        {activeTab === 'overview' && <GrowthOverview storeId={storeId} />}
        {activeTab === 'campaigns' && <GrowthCampaigns storeId={storeId} storeUrl={storeUrlFor(store as never)} />}
        {activeTab === 'attribution' && <GrowthAttribution storeId={storeId} />}
      </div>
    </>
  );
}
