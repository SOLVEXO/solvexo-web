import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, Bell, Mail, Palette } from 'lucide-react';
import { Button, Card, NotificationsPanel, SkeletonBox } from '@/components/comman/ui';
import { TabBar, type Tab } from '@/components/comman/ui/TabBar';
import { useKeepAliveTabs } from '@/hooks/useKeepAliveTabs';
import type { CustomerEmailSetting } from '@/api/services/storeNotifications';
import { CustomerEmailsList } from './CustomerEmailsList';
import { EmailEditorHost } from './EmailEditorHost';
import { LookAndSender } from './LookAndSender';
import { useCustomerEmailSettings } from './useCustomerEmailSettings';

/** This section is flat — no card/button glow or drop shadows anywhere (focus rings are untouched). */
const NO_SHADOWS = '[&_.surface-panel]:!shadow-none [&_.surface-panel:hover]:!shadow-none [&_button]:!shadow-none [&_button:hover]:!shadow-none';

const VIEWS: Tab[] = [
  { id: 'emails', label: 'Customer emails', icon: <Mail size={13} /> },
  { id: 'look', label: 'Look & sender', icon: <Palette size={13} /> },
  { id: 'alerts', label: 'My alerts', icon: <Bell size={13} /> },
];

interface Props {
  storeId: string;
  /** Needs `settings.general.manage`. Without it only the person's own alerts are shown. */
  canManage: boolean;
}

/**
 * Settings → Notifications. Three panes instead of one endless page:
 *  - Customer emails: every email the store sends to customers (switch + click a row to edit it)
 *  - Look & sender: sender name, reply-to, logo/colour/footer, extra new-order recipients
 *  - My alerts: the signed-in person's own notification preferences and history
 */
export function NotificationsHub({ storeId, canManage }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('view');
  const initial = canManage && VIEWS.some(v => v.id === requested) ? (requested as string) : canManage ? 'emails' : 'alerts';
  const { activeTab, setActiveTab, isVisited, paneClassName } = useKeepAliveTabs(initial);
  const data = useCustomerEmailSettings(canManage ? storeId : '');
  const [editing, setEditing] = useState<CustomerEmailSetting | null>(null);

  const changeView = (id: string) => {
    setActiveTab(id);
    const next = new URLSearchParams(searchParams);
    next.set('view', id);
    setSearchParams(next, { replace: true });
  };

  if (!canManage) {
    return (
      <div className={NO_SHADOWS}>
        <NotificationsPanel />
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-5 w-full ${NO_SHADOWS}`}>
      <div>
        <h2 className="text-[18px] font-bold text-carbon">Notifications</h2>
        <p className="text-[12.5px] text-slate mt-0.5">Choose which emails your customers get, how they look, and which alerts you receive.</p>
      </div>

      <TabBar tabs={VIEWS} active={activeTab} onChange={changeView} dense />

      {isVisited('emails') && (
        <div className={`${paneClassName('emails')} w-full`}>
          <CustomerEmailsList
            storeId={storeId}
            settings={data.settings}
            loading={data.loading}
            loadError={data.loadError}
            rowError={data.rowError}
            onRetry={data.reload}
            onToggle={data.toggleEmail}
            onOpen={setEditing}
          />
        </div>
      )}

      {isVisited('look') && (
        <div className={paneClassName('look')}>
          {data.loading && !data.settings ? (
            <Card padding="none">
              <div className="p-5 flex flex-col gap-3" aria-busy="true" aria-label="Loading">
                <SkeletonBox width={220} height={12} /><SkeletonBox width="100%" height={36} rounded="8px" /><SkeletonBox width="100%" height={36} rounded="8px" />
              </div>
            </Card>
          ) : data.loadError || !data.settings ? (
            <Card padding="none">
              <div className="p-5 flex items-center justify-between gap-4">
                <p role="alert" className="flex items-center gap-1.5 text-[12.5px] text-error"><AlertCircle size={14} /> {data.loadError || 'Could not load.'}</p>
                <Button size="sm" variant="outline" onClick={data.reload}>Retry</Button>
              </div>
            </Card>
          ) : (
            <LookAndSender settings={data.settings} onSave={data.saveLook} />
          )}
        </div>
      )}

      {isVisited('alerts') && (
        <div className={`${paneClassName('alerts')} w-full`}>
          <NotificationsPanel />
        </div>
      )}

      {editing && (
        <EmailEditorHost
          storeId={storeId}
          // always edit the latest saved version of this email, never a stale copy
          email={data.settings?.events.find(e => e.key === editing.key) ?? editing}
          eventTranslations={data.settings?.eventTranslations}
          defaultTranslations={data.settings?.defaultTranslations}
          onClose={() => setEditing(null)}
          onSave={data.saveEmail}
          onSaveTranslation={data.saveTranslation}
        />
      )}
    </div>
  );
}
