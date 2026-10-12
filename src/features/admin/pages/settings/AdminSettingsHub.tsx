import { useSearchParams } from 'react-router-dom';
import { User, Settings as SettingsIcon, Percent, Coins, Activity, Bell, Mail } from 'lucide-react';
import { AdminPageHeader } from '@/components/comman/ui/AdminPageHeader';
import { AdminNavMenu } from '@/components/layouts/AdminLayout';
import { TabBar, type Tab } from '@/components/comman/ui/TabBar';
import { useKeepAliveTabs } from '@/hooks/useKeepAliveTabs';
import { AdminSettings } from './AdminSettings';
import { AdminConfig } from '../AdminConfig';
import { AdminCommissionRules } from '../AdminCommissionRules';
import { AdminFxSettings } from '../AdminFxSettings';
import { AdminActivityLog } from '../AdminActivityLog';
import { NotificationsPanel } from '@/components/comman/ui';
import { AdminEmailHealth } from './AdminEmailHealth';

const TABS: Tab[] = [
  { id: 'account',           label: 'My Account',       icon: <User size={13} /> },
  { id: 'platform-config',   label: 'Platform Config',  icon: <SettingsIcon size={13} /> },
  { id: 'commission-rules',  label: 'Commission Rules', icon: <Percent size={13} /> },
  { id: 'fx-settings',       label: 'FX Settings',      icon: <Coins size={13} /> },
  { id: 'notifications',     label: 'Notifications',    icon: <Bell size={13} /> },
  { id: 'email',             label: 'Email',            icon: <Mail size={13} /> },
  { id: 'activity-log',      label: 'Activity Log',     icon: <Activity size={13} /> },
];

export default function AdminSettingsHub() {
  // The bell's "View all" and the email-failure alert link here with ?tab=notifications / ?tab=email.
  const [searchParams] = useSearchParams();
  const requested = searchParams.get('tab');
  const { activeTab, setActiveTab, isVisited, paneClassName } = useKeepAliveTabs(TABS.some(t => t.id === requested) ? (requested as string) : 'account');

  return (
    <>
      <AdminPageHeader title="Settings" subtitle="Your admin account, platform configuration, commission rules, FX rates, and activity log — all in one place." />
      <div className="px-4 sm:px-7 pt-3">
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>
      {isVisited('account')          && <div className={paneClassName('account')}><AdminSettings embedded /></div>}
      {isVisited('platform-config')  && <div className={paneClassName('platform-config')}><AdminConfig embedded /></div>}
      {isVisited('commission-rules') && <div className={paneClassName('commission-rules')}><AdminCommissionRules embedded /></div>}
      {isVisited('fx-settings')      && <div className={paneClassName('fx-settings')}><AdminFxSettings embedded /></div>}
      {isVisited('notifications')    && <div className={paneClassName('notifications') + ' px-4 sm:px-7 py-6'}><NotificationsPanel /></div>}
      {isVisited('email')            && <div className={paneClassName('email')}><AdminEmailHealth /></div>}
      {isVisited('activity-log')     && <div className={paneClassName('activity-log')}><AdminActivityLog embedded /></div>}
      <div className="lg:hidden px-4 pb-6 pt-4">
        <AdminNavMenu excludeItemIds={['settings']} />
      </div>
    </>
  );
}
