import { useState } from 'react';
import { User, Settings as SettingsIcon, Percent, Coins } from 'lucide-react';
import { AdminPageHeader } from '@/components/comman/ui/AdminPageHeader';
import { AdminNavMenu } from '@/components/layouts/AdminLayout';
import { TabBar, type Tab } from '@/components/comman/ui/TabBar';
import { AdminSettings } from './AdminSettings';
import { AdminConfig } from '../AdminConfig';
import { AdminCommissionRules } from '../AdminCommissionRules';
import { AdminFxSettings } from '../AdminFxSettings';

const TABS: Tab[] = [
  { id: 'account',           label: 'My Account',       icon: <User size={13} /> },
  { id: 'platform-config',   label: 'Platform Config',  icon: <SettingsIcon size={13} /> },
  { id: 'commission-rules',  label: 'Commission Rules', icon: <Percent size={13} /> },
  { id: 'fx-settings',       label: 'FX Settings',      icon: <Coins size={13} /> },
];

export default function AdminSettingsHub() {
  const [activeTab, setActiveTab] = useState('account');

  return (
    <>
      <AdminPageHeader title="Settings" subtitle="Your admin account, platform configuration, commission rules, and FX rates — all in one place." />
      <div className="px-4 sm:px-7 pt-3">
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>
      {activeTab === 'account'          && <AdminSettings embedded />}
      {activeTab === 'platform-config'  && <AdminConfig embedded />}
      {activeTab === 'commission-rules' && <AdminCommissionRules embedded />}
      {activeTab === 'fx-settings'      && <AdminFxSettings embedded />}
      <div className="lg:hidden px-4 pb-6 pt-4">
        <AdminNavMenu excludeItemIds={['settings']} />
      </div>
    </>
  );
}
