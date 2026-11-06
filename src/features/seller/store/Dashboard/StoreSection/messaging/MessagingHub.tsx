import { useCallback, useState } from 'react';
import { Lock, MessageSquareOff } from 'lucide-react';
import type { StaffPermission } from '@/api/services/staff';
import { errorMessage } from '@/api/errorMessage';
import { can } from '@/hooks/auth/useCan';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { EmptyState, TabBar } from '@/components/comman/ui';
import { ErrorLine } from '../wholesale/ErrorLine';
import { useApi } from '../wholesale/wholesaleUtils';
import { CampaignsTab } from './CampaignsTab';
import { ContactsTab } from './ContactsTab';
import { SmsGatewayTab } from './SmsGatewayTab';
import { TemplatesTab } from './TemplatesTab';

type Channel = 'whatsapp' | 'sms';
const CHANNELS = [{ id: 'whatsapp', label: 'WhatsApp' }, { id: 'sms', label: 'SMS' }];
const WA_TABS = [{ id: 'campaigns', label: 'Campaigns' }, { id: 'contacts', label: 'Contacts' }, { id: 'templates', label: 'Templates' }];
const SMS_TABS = [{ id: 'campaigns', label: 'Campaigns' }, { id: 'contacts', label: 'Contacts' }, { id: 'gateway', label: 'SMS provider' }];

/** WhatsApp and SMS marketing: who agreed, what you send, how it went. Off until the platform enables it. */
export default function MessagingHub() {
  const { storeId } = useStoreWorkspace();
  const allowed = can('marketing.manage' as StaffPermission);
  return (
    <>
      <StorePageHeader title="WhatsApp & SMS" subtitle="Marketing messages to customers who opted in" />
      <div className="flex w-full flex-col gap-4 px-4 pb-8 pt-5 lg:px-7">
        {allowed ? <MessagingBody storeId={storeId} /> : <EmptyState icon={<Lock size={22} />} title="No access" description="Your role cannot manage marketing." />}
      </div>
    </>
  );
}

function MessagingBody({ storeId }: { storeId: string }) {
  const [channel, setChannel] = useState<Channel>('whatsapp');
  const [tab, setTab] = useState('campaigns');
  const changeChannel = useCallback((id: string) => { setChannel(id as Channel); setTab('campaigns'); }, []);
  const changeTab = useCallback((id: string) => setTab(id), []);
  // One cheap request tells us whether the feature is switched on for the platform.
  const probe = useApi<unknown>(`/api/messaging/${storeId}/consents?channel=whatsapp&limit=1`);
  const message = probe.error ? errorMessage(probe.error) : '';
  const notAvailable = /not available yet/i.test(message);

  return (
    <>
        {notAvailable ? <EmptyState icon={<MessageSquareOff size={22} />} title="Not available yet" description="WhatsApp and SMS campaigns are not switched on for the platform yet. We will let you know when they are." />
          : probe.error ? <ErrorLine message={message} onRetry={probe.reload} />
          : (
            <>
              <TabBar tabs={CHANNELS} active={channel} onChange={changeChannel} />
              <TabBar tabs={channel === 'whatsapp' ? WA_TABS : SMS_TABS} active={tab} onChange={changeTab} />
              {tab === 'campaigns' && <CampaignsTab key={channel} storeId={storeId} channel={channel} />}
              {tab === 'contacts' && <ContactsTab key={channel} storeId={storeId} channel={channel} />}
              {tab === 'templates' && channel === 'whatsapp' && <TemplatesTab storeId={storeId} />}
              {tab === 'gateway' && channel === 'sms' && <SmsGatewayTab storeId={storeId} />}
            </>
          )}
    </>
  );
}
