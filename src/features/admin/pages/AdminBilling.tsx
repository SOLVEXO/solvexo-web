import { RefreshCw, Layers } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useKeepAliveTabs } from '@/hooks/useKeepAliveTabs';
import { TabBar, type Tab } from '@/components/comman/ui/TabBar';
import { AdminPageHeader } from '@/components/comman/ui';
import { AdminSubscriptions } from './AdminSubscriptions';
import { AdminPlatformPlans } from './AdminPlatformPlans';

const TABS: Tab[] = [
  { id: 'subscriptions', label: 'Subscriptions', icon: <RefreshCw size={14} /> },
  { id: 'platform-plans', label: 'Platform Plans', icon: <Layers size={14} /> },
];

// ── Billing — one page for both revenue streams that used to live at
// separate URLs and confused admins by sounding alike:
//   - Subscriptions  = a STORE'S OWN BUYERS subscribing to that store's
//     recurring-purchase product (Solvexo takes a commission cut). This is
//     the SELLER'S CUSTOMER data, so its Payment Failures/Detail views never
//     expose that customer's name/email, and it has no admin refund action —
//     see AdminSubscriptions.tsx's own comments and the backend's
//     SubscriptionsController doc comment.
//   - Platform Plans = SELLERS paying Solvexo itself for platform access
//     (Basic/Pro/Enterprise SaaS tiers). This is Solvexo's OWN money, so its
//     admin refund action stays untouched.
// Both original page components are reused unchanged (via their own
// `embedded` prop, same "disconnect, don't delete" convention as
// AdminClients.tsx reusing AdminModeration), not duplicated. ─────────────
export function AdminBilling() {
  usePageTitle('Billing');
  const { activeTab, setActiveTab, isVisited, paneClassName } = useKeepAliveTabs<'subscriptions' | 'platform-plans'>('subscriptions');

  return (
    <>
      <AdminPageHeader title="Billing" subtitle="Seller-to-customer subscriptions and seller-to-Solvexo platform plans." />
      <TabBar tabs={TABS} active={activeTab} onChange={(t) => setActiveTab(t as 'subscriptions' | 'platform-plans')} className="px-4 sm:px-7 mt-5" />

      {isVisited('subscriptions') && (
        <div className={paneClassName('subscriptions')}>
          <AdminSubscriptions embedded />
        </div>
      )}

      {isVisited('platform-plans') && (
        <div className={paneClassName('platform-plans')}>
          <AdminPlatformPlans embedded />
        </div>
      )}
    </>
  );
}
