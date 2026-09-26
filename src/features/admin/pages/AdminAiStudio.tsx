import { LayoutDashboard, ListChecks, Wallet, Receipt, Sparkles } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { TabBar, AdminPageHeader, type Tab } from '@/components/comman/ui';
import { useKeepAliveTabs } from '@/hooks/useKeepAliveTabs';

import { OverviewTab } from './ai-studio/OverviewTab';
import { GenerationsTab } from './ai-studio/GenerationsTab';
import { WalletsTab } from './ai-studio/WalletsTab';
import { TransactionsTab } from './ai-studio/TransactionsTab';
import { PlatformGenerateTab } from './ai-studio/PlatformGenerateTab';

const TABS: Tab[] = [
  { id: 'overview',     label: 'Overview',           icon: <LayoutDashboard size={14} /> },
  { id: 'generations',  label: 'Generations',        icon: <ListChecks size={14} /> },
  { id: 'wallets',      label: 'Wallets',            icon: <Wallet size={14} /> },
  { id: 'transactions', label: 'Transactions',       icon: <Receipt size={14} /> },
  { id: 'generate',     label: 'Generate for Solvexo', icon: <Sparkles size={14} /> },
];

export function AdminAiStudio() {
  usePageTitle('AI Studio');
  const { activeTab, setActiveTab, isVisited, paneClassName } = useKeepAliveTabs('overview');

  return (
    <div>
      <AdminPageHeader title="AI Studio" subtitle="Cross-store AI usage oversight, credit wallets, and Solvexo's own AI-generated content." />

      <div className="px-4 sm:px-7 pt-6 pb-8 flex flex-col gap-5">
      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {isVisited('overview')     && <div className={paneClassName('overview')}><OverviewTab /></div>}
      {isVisited('generations')  && <div className={paneClassName('generations')}><GenerationsTab /></div>}
      {isVisited('wallets')      && <div className={paneClassName('wallets')}><WalletsTab /></div>}
      {isVisited('transactions') && <div className={paneClassName('transactions')}><TransactionsTab /></div>}
      {isVisited('generate')     && <div className={paneClassName('generate')}><PlatformGenerateTab /></div>}
      </div>
    </div>
  );
}
