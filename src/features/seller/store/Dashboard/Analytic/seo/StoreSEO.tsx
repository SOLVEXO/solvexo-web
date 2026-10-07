import { useEffect, useState } from 'react';
import {
  LayoutDashboard, ClipboardCheck, Package, FolderTree, Store as StoreIcon,
  FileText, ArrowRightLeft, Link2, Eye, Search, LineChart, Sparkles,
} from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { TabBar, type Tab } from '@/components/comman/ui/TabBar';
import { PlanFeatureLock, type PlanFeatureFlag } from '@/components/comman/ui';
import { apiGetStoreEntitlements, type EntitlementsSummary } from '@/api/services/platformPlans';
import { useRouteTabs } from '@/hooks/useRouteTabs';
import { Navigate } from 'react-router-dom';

import { NoTabAccess } from '@/components/comman/ui/NoTabAccess';
import { OverviewTab } from './tabs/OverviewTab';
import { AuditTab } from './tabs/AuditTab';
import { ProductsTab } from './tabs/ProductsTab';
import { CategoriesTab } from './tabs/CategoriesTab';
import { StoreTab } from './tabs/StoreTab';
import { PagesTab } from './tabs/PagesTab';
import { RedirectsTab } from './tabs/RedirectsTab';
import { CanonicalTab } from './tabs/CanonicalTab';
import { PreviewsTab } from './tabs/PreviewsTab';
import { SearchConsoleTab } from './tabs/SearchConsoleTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import { AiSeoTab } from './tabs/AiSeoTab';

const TABS: Tab[] = [
  { id: 'overview',   label: 'Overview',       icon: <LayoutDashboard size={13} /> },
  { id: 'audit',      label: 'SEO Audit',      icon: <ClipboardCheck size={13} /> },
  { id: 'products',   label: 'Product SEO',    icon: <Package size={13} /> },
  { id: 'categories', label: 'Category SEO',   icon: <FolderTree size={13} /> },
  { id: 'store',      label: 'Store SEO',      icon: <StoreIcon size={13} /> },
  { id: 'pages',      label: 'Pages SEO',      icon: <FileText size={13} /> },
  { id: 'redirects',  label: 'Redirects',      icon: <ArrowRightLeft size={13} /> },
  { id: 'canonical',  label: 'Canonical URLs', icon: <Link2 size={13} /> },
  { id: 'previews',   label: 'Previews',       icon: <Eye size={13} /> },
  { id: 'search',     label: 'Search Console', icon: <Search size={13} /> },
  { id: 'analytics',  label: 'Analytics',      icon: <LineChart size={13} /> },
  { id: 'ai',         label: 'AI SEO',         icon: <Sparkles size={13} /> },
];

export function StoreSEO() {
  const { storeId, store } = useStoreWorkspace();
  const SEO_PERM = ['seo.view', 'seo.manage'];
  const { visibleTabs, activeTab, openTab: setActiveTab, isVisited, paneClassName, redirectTo, blocked } = useRouteTabs({
    tabs: TABS, base: 'seo', permissions: Object.fromEntries(TABS.map(t => [t.id, SEO_PERM])),
  });

  // 4 of these 12 tabs are gated by a real PlatformPlan entitlement — locked
  // here BEFORE the seller tries them, instead of only finding out when the
  // backend rejects the request (see EntitlementsService.assertFeatureAllowed
  // call sites in seller-seo-audit/seller-seo-ai/seller-seo-integrations/
  // seller-seo-redirects/seller-seo-canonical controllers).
  const [entitlements, setEntitlements] = useState<EntitlementsSummary | null>(null);
  useEffect(() => {
    if (!storeId) return;
    apiGetStoreEntitlements(storeId).then(res => setEntitlements(res.data)).catch(() => {});
  }, [storeId]);
  const auditFeature = entitlements?.advancedSeoToolsAllowed as PlanFeatureFlag;
  const aiFeature = entitlements?.seoAiSuggestionsAllowed as PlanFeatureFlag;
  const searchConsoleFeature = entitlements?.searchConsoleIntegrationAllowed as PlanFeatureFlag;
  const redirectsFeature = entitlements?.customRedirectsAllowed as PlanFeatureFlag;

  if (redirectTo) return <Navigate to={redirectTo} replace />;
  if (blocked) return <NoTabAccess title="SEO Center" />;

  return (
    <>
      <StorePageHeader
        title="SEO Center"
        subtitle="Optimize your store, products, and pages for search engines."
      />

      <div className="px-4 md:px-7 pt-3">
        <TabBar tabs={visibleTabs} active={activeTab} onChange={setActiveTab} />
      </div>

      {/* Each tab stays mounted (hidden via CSS) once visited, instead of
         unmounting on switch — a repeat visit is instant, no refetch/skeleton. */}
      <div className="px-4 md:px-7 pb-8 pt-5">
        {isVisited('overview') && <div className={paneClassName('overview')}><OverviewTab storeId={storeId} onNavigateTab={setActiveTab} /></div>}
        {isVisited('audit') && (
          <div className={paneClassName('audit')}>
            {auditFeature && !auditFeature.allowed
              ? <PlanFeatureLock label="Advanced SEO Tools" description="Run a full SEO audit with a real health score and a prioritized fix checklist across your whole store." requiredPlan={auditFeature.requiredPlan} />
              : <AuditTab storeId={storeId} />}
          </div>
        )}
        {isVisited('products')   && <div className={paneClassName('products')}><ProductsTab storeId={storeId} storeSlug={store?.slug} /></div>}
        {isVisited('categories') && <div className={paneClassName('categories')}><CategoriesTab storeId={storeId} /></div>}
        {isVisited('store')      && <div className={paneClassName('store')}><StoreTab storeId={storeId} storeSlug={store?.slug} /></div>}
        {isVisited('pages')      && <div className={paneClassName('pages')}><PagesTab storeId={storeId} /></div>}
        {isVisited('redirects') && (
          <div className={paneClassName('redirects')}>
            {redirectsFeature && !redirectsFeature.allowed
              ? <PlanFeatureLock label="Custom Redirects" description="Create custom redirect rules so an old or changed URL always sends visitors (and search engines) to the right page." requiredPlan={redirectsFeature.requiredPlan} />
              : <RedirectsTab storeId={storeId} />}
          </div>
        )}
        {isVisited('canonical') && (
          <div className={paneClassName('canonical')}>
            {redirectsFeature && !redirectsFeature.allowed
              ? <PlanFeatureLock label="Canonical URL Overrides" description="Set a custom canonical URL so search engines index the exact page you want, not a duplicate." requiredPlan={redirectsFeature.requiredPlan} />
              : <CanonicalTab storeId={storeId} />}
          </div>
        )}
        {isVisited('previews')   && <div className={paneClassName('previews')}><PreviewsTab storeId={storeId} storeSlug={store?.slug} /></div>}
        {isVisited('search') && (
          <div className={paneClassName('search')}>
            {searchConsoleFeature && !searchConsoleFeature.allowed
              ? <PlanFeatureLock label="Search Console Integration" description="Connect Google Search Console / Bing Webmaster Tools to see your real search performance data inside Solvexo." requiredPlan={searchConsoleFeature.requiredPlan} />
              : <SearchConsoleTab storeId={storeId} />}
          </div>
        )}
        {isVisited('analytics')  && <div className={paneClassName('analytics')}><AnalyticsTab storeId={storeId} /></div>}
        {isVisited('ai') && (
          <div className={paneClassName('ai')}>
            {aiFeature && !aiFeature.allowed
              ? <PlanFeatureLock label="AI SEO Suggestions" description="Get AI-generated title/description/keyword suggestions for your products and pages." requiredPlan={aiFeature.requiredPlan} />
              : <AiSeoTab storeId={storeId} />}
          </div>
        )}
      </div>
    </>
  );
}
