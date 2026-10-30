import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Settings as SettingsIcon, Percent, Coins, Activity, Bell, Mail, Users, MonitorSmartphone, Landmark, ShieldCheck } from 'lucide-react';
import { AdminPageHeader } from '@/components/comman/ui/AdminPageHeader';
import { AdminNavMenu } from '@/components/layouts/AdminLayout';
import { SettingsShell, type SettingsNavGroup } from '@/components/comman/settings';
import { useKeepAliveTabs } from '@/hooks/useKeepAliveTabs';
import { AdminSettings } from './AdminSettings';
import { AdminConfig } from '../AdminConfig';
import { AdminCommissionRules } from '../AdminCommissionRules';
import { AdminFxSettings } from '../AdminFxSettings';
import { AdminActivityLog } from '../AdminActivityLog';
import { NotificationsPanel } from '@/components/comman/ui';
import { AdminEmailHealth } from './AdminEmailHealth';
import { AdminTeam } from './AdminTeam';
import { AdminSessions } from './AdminSessions';
import { AdminTwoFactor } from './AdminTwoFactor';
import { AdminPlatformTax } from './AdminPlatformTax';
import { AdminDigital } from './AdminDigital';
import { can } from '@/hooks/auth/useCan';
import { ErrorBoundary } from '@/components/comman/ErrorBoundary';

// Grouped for the desktop tab rail (eyebrow + one-line hint per row); mobile
// flattens it back into the single "Settings" list the panel already showed.
const NAV_GROUPS: SettingsNavGroup[] = [
  {
    label: 'Account',
    items: [
      { id: 'account',        label: 'My Account', icon: <User size={13} />,             hint: 'Your profile and password' },
      { id: 'two-factor',     label: 'Two-factor sign-in', icon: <ShieldCheck size={13} />, hint: 'Authenticator app codes' },
      { id: 'sessions',       label: 'Sessions',   icon: <MonitorSmartphone size={13} />, hint: 'Devices signed in' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { id: 'platform-config', label: 'Platform Config', icon: <SettingsIcon size={13} />, hint: 'Maintenance, AI, limits' },
      { id: 'digital', label: 'Digital delivery', icon: <ShieldCheck size={13} />, hint: 'Abuse and piracy controls' },
    ],
  },
  {
    label: 'Money',
    items: [
      { id: 'commission-rules', label: 'Commission Rules', icon: <Percent size={13} />, hint: 'Platform fee per category' },
      { id: 'fx-settings',      label: 'FX Settings',      icon: <Coins size={13} />,   hint: 'Currency rates and overrides' },
      { id: 'tax',              label: 'Tax',              icon: <Landmark size={13} />, hint: 'Platform tax rules' },
    ],
  },
  {
    label: 'Messaging',
    items: [
      { id: 'notifications', label: 'Notifications', icon: <Bell size={13} />, hint: 'Alerts sent from the panel' },
      { id: 'email',         label: 'Email',         icon: <Mail size={13} />, hint: 'Delivery health and failures' },
    ],
  },
  {
    label: 'Access & audit',
    items: [
      { id: 'team',         label: 'Team',         icon: <Users size={13} />,   hint: 'Admins, roles, approvals' },
      { id: 'activity-log', label: 'Activity Log', icon: <Activity size={13} />, hint: 'Who did what, and when' },
    ],
  },
];
// A team admin only gets the tabs their role allows (the owner / Super Admin gets all). Account, Two-factor, Notifications and Sessions are always open.
const TAB_PERMISSION: Record<string, string> = {
  'platform-config': 'config.manage', digital: 'config.manage', email: 'config.manage', 'commission-rules': 'commission.manage', 'fx-settings': 'commission.manage', tax: 'billing.manage',
  'activity-log': 'activity.view', team: 'team.manage',
};
const GROUPS = NAV_GROUPS
  .map(g => ({ ...g, items: g.items.filter(t => !TAB_PERMISSION[t.id] || can(TAB_PERMISSION[t.id])) }))
  .filter(g => g.items.length > 0);
const TAB_IDS = GROUPS.flatMap(g => g.items.map(t => t.id));

export default function AdminSettingsHub() {
  // The bell's "View all" and the email-failure alert link here with ?tab=notifications / ?tab=email.
  // That same param is what makes a tab "open", so the mobile drill-in (list →
  // one section → back) and deep links are the same mechanism.
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('tab');
  const openTabId = requested && TAB_IDS.includes(requested) ? requested : null;
  const { activeTab, setActiveTab, isVisited, paneClassName, warmOtherTabs } = useKeepAliveTabs(openTabId ?? 'account');
  useEffect(() => { if (openTabId) setActiveTab(openTabId); }, [openTabId, setActiveTab]);
  // Mount the not-yet-opened panes in the background so the first visit to any
  // of them shows real content instead of waiting on its own fetch.
  useEffect(() => { warmOtherTabs(TAB_IDS); }, [warmOtherTabs]);

  const openTab = (id: string) => setSearchParams(prev => {
    const next = new URLSearchParams(prev);
    next.set('tab', id);
    return next;
  }, { replace: true });
  const closeTab = () => setSearchParams(prev => {
    const next = new URLSearchParams(prev);
    next.delete('tab');
    return next;
  }, { replace: true });

  return (
    <>
      <AdminPageHeader title="Settings" subtitle="Your admin account, platform configuration, commission rules, FX rates, and activity log — all in one place." />
      {/* Same shell as the seller store hub: mobile gets the rows menu and a
         back bar, desktop gets the section on the left with the tab rail
         sticky on the right. `AdminNavMenu` stays the mobile-only jump-off
         into the rest of the panel. */}
      <SettingsShell
        groups={GROUPS}
        activeId={activeTab}
        onOpen={openTab}
        drilledIn={!!openTabId}
        onBack={closeTab}
        mobileFooter={<AdminNavMenu excludeItemIds={['settings']} />}
      >
        {isVisited('account')          && <div className={paneClassName('account')}><ErrorBoundary section="My Account"><AdminSettings embedded /></ErrorBoundary></div>}
        {isVisited('platform-config')  && <div className={paneClassName('platform-config')}><ErrorBoundary section="Platform Config"><AdminConfig embedded /></ErrorBoundary></div>}
        {isVisited('digital')          && <div className={paneClassName('digital')}><ErrorBoundary section="Digital delivery"><AdminDigital /></ErrorBoundary></div>}
        {isVisited('commission-rules') && <div className={paneClassName('commission-rules')}><ErrorBoundary section="Commission Rules"><AdminCommissionRules embedded /></ErrorBoundary></div>}
        {isVisited('fx-settings')      && <div className={paneClassName('fx-settings')}><ErrorBoundary section="FX Settings"><AdminFxSettings embedded /></ErrorBoundary></div>}
        {isVisited('tax')              && <div className={paneClassName('tax')}><ErrorBoundary section="Tax"><AdminPlatformTax /></ErrorBoundary></div>}
        {isVisited('notifications')    && <div className={paneClassName('notifications') + ' px-4 sm:px-7 py-6'}><ErrorBoundary section="Notifications"><NotificationsPanel /></ErrorBoundary></div>}
        {isVisited('email')            && <div className={paneClassName('email')}><ErrorBoundary section="Email"><AdminEmailHealth /></ErrorBoundary></div>}
        {isVisited('activity-log')     && <div className={paneClassName('activity-log')}><ErrorBoundary section="Activity Log"><AdminActivityLog embedded /></ErrorBoundary></div>}
        {isVisited('team')             && <div className={paneClassName('team')}><ErrorBoundary section="Team"><AdminTeam /></ErrorBoundary></div>}
        {isVisited('sessions')         && <div className={paneClassName('sessions')}><ErrorBoundary section="Sessions"><AdminSessions /></ErrorBoundary></div>}
        {isVisited('two-factor')       && <div className={paneClassName('two-factor')}><ErrorBoundary section="Two-factor sign-in"><AdminTwoFactor /></ErrorBoundary></div>}
      </SettingsShell>
    </>
  );
}
