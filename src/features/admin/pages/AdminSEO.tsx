import {
  LineChart, Settings, ListChecks, FileText, FolderTree, HelpCircle,
  Map, ArrowRightLeft, Link2, Plug, Radar,
} from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { TabBar, type Tab } from '@/components/comman/ui';
import { useKeepAliveTabs } from '@/hooks/useKeepAliveTabs';

import { AnalyticsTab } from './seo/AnalyticsTab';
import { SettingsTab } from './seo/SettingsTab';
import { RulesTab } from './seo/RulesTab';
import { LandingPagesTab } from './seo/LandingPagesTab';
import { CategoryMetaTab } from './seo/CategoryMetaTab';
import { FaqMetaTab } from './seo/FaqMetaTab';
import { SitemapTab } from './seo/SitemapTab';
import { RedirectsTab } from './seo/RedirectsTab';
import { CanonicalTab } from './seo/CanonicalTab';
import { IntegrationsTab } from './seo/IntegrationsTab';
import { MonitoringTab } from './seo/MonitoringTab';

const TABS: Tab[] = [
  { id: 'analytics',     label: 'Analytics',       icon: <LineChart size={14} /> },
  { id: 'settings',      label: 'Settings',        icon: <Settings size={14} /> },
  { id: 'rules',         label: 'SEO Rules',       icon: <ListChecks size={14} /> },
  { id: 'landing-pages', label: 'Landing Pages',   icon: <FileText size={14} /> },
  { id: 'categories',    label: 'Category Meta',   icon: <FolderTree size={14} /> },
  { id: 'faqs',          label: 'FAQ Meta',        icon: <HelpCircle size={14} /> },
  { id: 'sitemap',       label: 'Sitemap',         icon: <Map size={14} /> },
  { id: 'redirects',     label: 'Redirects',       icon: <ArrowRightLeft size={14} /> },
  { id: 'canonical',     label: 'Canonical URLs',  icon: <Link2 size={14} /> },
  { id: 'integrations',  label: 'Integrations',    icon: <Plug size={14} /> },
  { id: 'monitoring',    label: 'Monitoring',      icon: <Radar size={14} /> },
];

export function AdminSEO() {
  usePageTitle('SEO');
  const { activeTab, setActiveTab, isVisited, paneClassName } = useKeepAliveTabs('analytics');

  return (
    <div className="px-4 sm:px-7 pt-6 pb-8 flex flex-col gap-5">
      <div>
        <h1 className="text-[18px] font-bold text-charcoal mb-[3px]">Platform SEO</h1>
        <p className="text-[12px] text-slate">Marketplace-wide search visibility, structured data, and technical SEO controls.</p>
      </div>

      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {isVisited('analytics')     && <div className={paneClassName('analytics')}><AnalyticsTab /></div>}
      {isVisited('settings')      && <div className={paneClassName('settings')}><SettingsTab /></div>}
      {isVisited('rules')         && <div className={paneClassName('rules')}><RulesTab /></div>}
      {isVisited('landing-pages') && <div className={paneClassName('landing-pages')}><LandingPagesTab /></div>}
      {isVisited('categories')    && <div className={paneClassName('categories')}><CategoryMetaTab /></div>}
      {isVisited('faqs')          && <div className={paneClassName('faqs')}><FaqMetaTab /></div>}
      {isVisited('sitemap')       && <div className={paneClassName('sitemap')}><SitemapTab /></div>}
      {isVisited('redirects')     && <div className={paneClassName('redirects')}><RedirectsTab /></div>}
      {isVisited('canonical')     && <div className={paneClassName('canonical')}><CanonicalTab /></div>}
      {isVisited('integrations')  && <div className={paneClassName('integrations')}><IntegrationsTab /></div>}
      {isVisited('monitoring')    && <div className={paneClassName('monitoring')}><MonitoringTab /></div>}
    </div>
  );
}
