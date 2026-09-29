import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { TabBar, type Tab } from '@/components/comman/ui/TabBar';
import { useKeepAliveTabs } from '@/hooks/useKeepAliveTabs';
import { useClientOverview } from '@/hooks/admin/useAdminClients';
import { useAdminUserActions } from '@/hooks/admin/useAdminUsers';
import { AdminPageHeader, Button, Modal, StatusBadge, SkeletonBox } from '@/components/comman/ui';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import {
  ArrowLeft, Ban, CheckCircle2, LayoutDashboard, Store, Users, ShoppingCart,
  RefreshCw, DollarSign, Activity as ActivityIcon, Shield,
} from 'lucide-react';
import { OverviewTab } from './clients/OverviewTab';
import { StoresTab } from './clients/StoresTab';
import { CustomersTab } from './clients/CustomersTab';
import { OrdersTab } from './clients/OrdersTab';
import { BillingTab } from './clients/BillingTab';
import { FinanceTab } from './clients/FinanceTab';
import { ActivityTab } from './clients/ActivityTab';
import { ModerationTab } from './clients/ModerationTab';

type ClientTab = 'overview' | 'stores' | 'customers' | 'orders' | 'billing' | 'finance' | 'activity' | 'moderation';

const BASE_TABS: Tab[] = [
  { id: 'overview',   label: 'Overview',     icon: <LayoutDashboard size={14} /> },
  { id: 'stores',     label: 'Stores',       icon: <Store size={14} /> },
  { id: 'customers',  label: 'Customers',    icon: <Users size={14} /> },
  { id: 'orders',     label: 'Orders',       icon: <ShoppingCart size={14} /> },
  { id: 'billing',    label: 'Subscription', icon: <RefreshCw size={14} /> },
  { id: 'finance',    label: 'Finance',      icon: <DollarSign size={14} /> },
  { id: 'activity',   label: 'Activity',     icon: <ActivityIcon size={14} /> },
  { id: 'moderation', label: 'Moderation',   icon: <Shield size={14} /> },
];

function initialsOf(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase() || '—';
}

// ── The Clients workspace's single detail page — one client (a Seller
// document; see the plan's domain-model note — "client" and "seller" are
// the same entity, there is no separate schema), every store they own, and
// everything about their relationship with the platform, in one place.
// Client-level tabs (Overview/Customers/Orders/Finance/Activity/Moderation)
// are cross-store aggregates; store-specific actions (view one store's
// customers, one store's finance detail) drill into the SAME modals the old
// per-store admin pages already used — reused unchanged, never duplicated.
export function AdminClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sellerId = id ?? '';
  usePageTitle('Client');

  const { data: overview, loading, error, refetch } = useClientOverview(sellerId);
  const { suspend, unsuspend, processingId } = useAdminUserActions();
  const [confirmAccount, setConfirmAccount] = useState(false);

  const { activeTab, setActiveTab, isVisited, paneClassName } = useKeepAliveTabs<ClientTab>('overview');

  if (loading && !overview) {
    return (
      <>
        <AdminPageHeader title="Client" />
        <div className="p-6 flex flex-col gap-3">
          <SkeletonBox height={60} rounded="10px" />
          <SkeletonBox height={320} rounded="10px" />
        </div>
      </>
    );
  }

  if (error || !overview) {
    return (
      <>
        <AdminPageHeader title="Client" />
        <div className="p-6"><AnalyticsErrorState message={error || 'Client not found'} onRetry={refetch} /></div>
      </>
    );
  }

  const seller = overview.seller;
  const isSuspended = seller.status === 'suspended';

  async function toggleAccount() {
    const ok = isSuspended ? await unsuspend('seller', sellerId) : await suspend('seller', sellerId);
    if (ok) { setConfirmAccount(false); refetch(); }
  }

  const tabs: Tab[] = BASE_TABS.map((t) =>
    t.id === 'moderation' && overview.openModerationReports > 0
      ? { ...t, count: overview.openModerationReports }
      : t,
  );

  return (
    <>
      <AdminPageHeader
        title={seller.name}
        subtitle={seller.email}
        icon={
          <button
            type="button"
            onClick={() => navigate('/admin/clients')}
            title="Back to Clients"
            aria-label="Back to Clients"
            className="w-full h-full flex items-center justify-center bg-transparent border-0 cursor-pointer text-brand-deep-orange"
          >
            {seller.storeCount === 0 ? <ArrowLeft size={16} /> : <span className="text-[13px] font-bold">{initialsOf(seller.name)}</span>}
          </button>
        }
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={seller.status} size="sm" />
            <Button
              variant={isSuspended ? 'secondary' : 'danger'}
              size="sm"
              icon={isSuspended ? <CheckCircle2 size={13} /> : <Ban size={13} />}
              loading={processingId === sellerId}
              onClick={() => setConfirmAccount(true)}
            >
              {isSuspended ? 'Unsuspend Client' : 'Suspend Client'}
            </Button>
          </div>
        }
      />

      <button
        type="button"
        onClick={() => navigate('/admin/clients')}
        className="mt-3 ml-4 sm:ml-7 text-[12px] font-semibold text-slate hover:text-carbon inline-flex items-center gap-1.5 bg-transparent border-0 cursor-pointer"
      >
        <ArrowLeft size={12} /> Back to Clients
      </button>

      <TabBar tabs={tabs} active={activeTab} onChange={(t) => setActiveTab(t as ClientTab)} className="px-4 sm:px-7 mt-5" />

      <div className="px-4 sm:px-7 py-6">
        {isVisited('overview')   && <div className={paneClassName('overview')}><OverviewTab overview={overview} onGoToTab={(t) => setActiveTab(t as ClientTab)} /></div>}
        {isVisited('stores')     && <div className={paneClassName('stores')}><StoresTab stores={seller.stores} onChanged={refetch} /></div>}
        {isVisited('customers')  && <div className={paneClassName('customers')}><CustomersTab sellerId={sellerId} stores={seller.stores} /></div>}
        {isVisited('orders')     && <div className={paneClassName('orders')}><OrdersTab sellerId={sellerId} /></div>}
        {isVisited('billing')    && <div className={paneClassName('billing')}><BillingTab sellerId={sellerId} /></div>}
        {isVisited('finance')    && <div className={paneClassName('finance')}><FinanceTab sellerId={sellerId} /></div>}
        {isVisited('activity')   && <div className={paneClassName('activity')}><ActivityTab sellerId={sellerId} /></div>}
        {isVisited('moderation') && <div className={paneClassName('moderation')}><ModerationTab sellerId={sellerId} onChanged={refetch} /></div>}
      </div>

      {confirmAccount && (
        <Modal
          mobileSheet
          title={isSuspended ? 'Unsuspend Client' : 'Suspend Client'}
          onClose={() => setConfirmAccount(false)}
          footer={<>
            <Button variant="ghost" onClick={() => setConfirmAccount(false)}>Cancel</Button>
            <Button variant={isSuspended ? 'secondary' : 'danger'} loading={processingId === sellerId} onClick={toggleAccount}>
              {isSuspended ? 'Unsuspend' : 'Suspend'}
            </Button>
          </>}
        >
          <p className="text-[13px] text-charcoal leading-[1.6]">
            {isSuspended
              ? <>Restore "<strong>{seller.name}</strong>"'s account? Every store that was suspended along with it will be restored too.</>
              : <>Suspend "<strong>{seller.name}</strong>"'s account? This suspends <strong>all {seller.stores.length} of their store(s)</strong> along with it, not just one.</>}
          </p>
        </Modal>
      )}
    </>
  );
}
