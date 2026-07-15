import { useState } from 'react';
import { LayoutDashboard, ListChecks, Wallet, Receipt, Sparkles } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { TabBar, type Tab } from '@/components/comman/ui';

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
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="px-7 pt-6 pb-8 flex flex-col gap-5">
      <div>
        <h1 className="text-[18px] font-bold text-charcoal mb-[3px]">AI Studio</h1>
        <p className="text-[12px] text-slate">Cross-store AI usage oversight, credit wallets, and Solvexo's own AI-generated content.</p>
      </div>

      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview'     && <OverviewTab />}
      {activeTab === 'generations'  && <GenerationsTab />}
      {activeTab === 'wallets'      && <WalletsTab />}
      {activeTab === 'transactions' && <TransactionsTab />}
      {activeTab === 'generate'     && <PlatformGenerateTab />}
    </div>
  );
}
