import { useState } from 'react';
import {
  LayoutDashboard, ClipboardCheck, Package, FolderTree, Store as StoreIcon,
  FileText, ArrowRightLeft, Link2, Eye, Search, LineChart, Sparkles,
} from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { TabBar, type Tab } from '@/components/comman/ui/TabBar';

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
  usePageTitle('SEO');
  const { storeId, store } = useStoreWorkspace();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <>
      <SellerPageHeader
        title="SEO Center"
        subtitle="Optimize your store, products, and pages for search engines."
      />

      <div className="px-4 md:px-7 pt-3">
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      <div className="px-4 md:px-7 pb-8 pt-5">
        {activeTab === 'overview'   && <OverviewTab storeId={storeId} onNavigateTab={setActiveTab} />}
        {activeTab === 'audit'      && <AuditTab storeId={storeId} />}
        {activeTab === 'products'   && <ProductsTab storeId={storeId} storeSlug={store?.slug} />}
        {activeTab === 'categories' && <CategoriesTab storeId={storeId} />}
        {activeTab === 'store'      && <StoreTab storeId={storeId} storeSlug={store?.slug} />}
        {activeTab === 'pages'      && <PagesTab storeId={storeId} />}
        {activeTab === 'redirects'  && <RedirectsTab storeId={storeId} />}
        {activeTab === 'canonical'  && <CanonicalTab storeId={storeId} />}
        {activeTab === 'previews'   && <PreviewsTab storeId={storeId} storeSlug={store?.slug} />}
        {activeTab === 'search'     && <SearchConsoleTab storeId={storeId} />}
        {activeTab === 'analytics'  && <AnalyticsTab storeId={storeId} />}
        {activeTab === 'ai'         && <AiSeoTab storeId={storeId} />}
      </div>
    </>
  );
}
