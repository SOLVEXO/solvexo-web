import { useMemo, useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  useAdminUsersStats, useAdminUsersList, useAdminUserActions,
  useAdminSellerDetail, useAdminStoreActions,
  useStoreCustomers, useStoreCustomerActions,
} from '@/hooks/admin/useAdminUsers';
import type { SellerRow, SellerStore, StoreCustomer } from '@/api/services/users/adminUsers';
import {
  Table, StatusBadge, Badge, Button, Modal, SkeletonBox, SearchInput,
  FilterDropdown, MetricCard, AdminPageHeader, ActionMenu,
} from '@/components/comman/ui';
import type { TableColumn, ActionMenuItem } from '@/components/comman/ui';
import type { BadgeColor } from '@/types';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { formatDate, formatNumber } from '@/components/comman/analytics/format';
import { Users2, Ban, CheckCircle2, Eye, ShieldOff, ShieldCheck, Store as StoreIcon } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending', label: 'Pending' },
];

const SEGMENT_COLOR: Record<StoreCustomer['segment'], BadgeColor> = {
  new: 'blue', returning: 'gray', vip: 'orange', at_risk: 'yellow',
};
const SEGMENT_LABEL: Record<StoreCustomer['segment'], string> = {
  new: 'New', returning: 'Returning', vip: 'VIP', at_risk: 'At Risk',
};

function initialsOf(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase() || '—';
}

// ── A store's own customers (buyers) — opened from inside SellerDetailModal ──
function StoreCustomersModal({ store, onClose }: { store: SellerStore; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const query = useMemo(() => ({ search: search || undefined, page, limit: 10 }), [search, page]);
  const { data, loading, error, refetch } = useStoreCustomers(store.id, query);
  const { block, unblock, processingId, error: actionError } = useStoreCustomerActions();
  const { suspend: banAccount, processingId: banProcessingId } = useAdminUserActions();

  const [banTarget, setBanTarget] = useState<StoreCustomer | null>(null);

  async function toggleBlock(customer: StoreCustomer) {
    const ok = customer.isBlocked ? await unblock(store.id, customer._id) : await block(store.id, customer._id);
    if (ok) refetch();
  }

  async function confirmBan() {
    if (!banTarget) return;
    const ok = await banAccount('buyer', banTarget._id);
    if (ok) { setBanTarget(null); refetch(); }
  }

  const columns: TableColumn<StoreCustomer>[] = [
    {
      key: 'name',
      header: 'Customer',
      render: (c) => (
        <div>
          <p className="text-[12.5px] font-semibold text-charcoal">{c.name}</p>
          <p className="text-[11px] text-slate">{c.email}</p>
        </div>
      ),
    },
    { key: 'segment', header: 'Segment', render: (c) => <Badge size="sm" color={SEGMENT_COLOR[c.segment]}>{SEGMENT_LABEL[c.segment]}</Badge> },
    { key: 'orderCount', header: 'Orders', render: (c) => <span className="text-[13px] text-graphite">{c.orderCount}</span> },
    { key: 'lastOrderAt', header: 'Last Order', render: (c) => <span className="text-[13px] text-slate">{c.lastOrderAt ? formatDate(c.lastOrderAt) : '—'}</span> },
    {
      key: 'status',
      header: 'This Store',
      render: (c) => c.isBlocked
        ? <Badge size="sm" color="red">Blocked here</Badge>
        : <Badge size="sm" color="green">Active</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (c) => {
        const items: ActionMenuItem[] = [
          c.isBlocked
            ? { label: 'Unblock from this store', icon: <ShieldCheck size={13} />, onClick: () => toggleBlock(c) }
            : { label: 'Block from this store', icon: <ShieldOff size={13} />, danger: true, onClick: () => toggleBlock(c) },
          { label: 'Ban from whole platform', icon: <Ban size={13} />, danger: true, onClick: () => setBanTarget(c) },
        ];
        return <ActionMenu items={items} ariaLabel={`Actions for ${c.name}`} />;
      },
    },
  ];

  return (
    <>
      <Modal mobileSheet title={`Customers — ${store.name}`} onClose={onClose} width={680}>
        <div className="flex flex-col gap-3">
          {actionError && <p className="text-[12px] text-error">{actionError}</p>}
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name or email…" className="max-w-[280px]" />
          {error ? (
            <AnalyticsErrorState message={error} onRetry={refetch} />
          ) : (
            <Table
              columns={columns}
              data={data?.customers ?? []}
              keyExtractor={(c) => c._id}
              loading={loading || processingId !== null}
              emptyState={{ icon: <Users2 size={28} className="text-slate/50" />, title: 'No customers yet', description: 'Nobody has ordered from this store yet.' }}
              pagination={{ page, total: data?.pagination.total ?? 0, perPage: 10, onChange: setPage, label: 'customers' }}
            />
          )}
        </div>
      </Modal>

      {banTarget && (
        <Modal
          mobileSheet
          title="Ban From Whole Platform"
          onClose={() => setBanTarget(null)}
          footer={<>
            <Button variant="ghost" onClick={() => setBanTarget(null)}>Cancel</Button>
            <Button variant="danger" icon={<Ban size={13} />} loading={banProcessingId === banTarget._id} onClick={confirmBan}>
              Ban Account
            </Button>
          </>}
        >
          <p className="text-[13px] text-charcoal leading-[1.6]">
            Suspend "<strong>{banTarget.name}</strong>"'s account across the <strong>entire platform</strong> — not just this store?
            They will be immediately blocked from every store, not only {store.name}.
          </p>
        </Modal>
      )}
    </>
  );
}

// ── A seller's account + the stores they own ──────────────────────────────────
function SellerDetailModal({ sellerId, onClose, onChanged }: { sellerId: string; onClose: () => void; onChanged: () => void }) {
  const { data: seller, loading, error, refetch } = useAdminSellerDetail(sellerId);
  const { suspend, unsuspend, processingId: accountProcessingId } = useAdminUserActions();
  const { suspendStore, unsuspendStore, processingId: storeProcessingId } = useAdminStoreActions();

  const [confirmAccount, setConfirmAccount] = useState(false);
  const [confirmStore, setConfirmStore] = useState<SellerStore | null>(null);
  const [customersFor, setCustomersFor] = useState<SellerStore | null>(null);

  const isSuspended = seller?.status === 'suspended';

  async function toggleAccount() {
    if (!seller) return;
    const ok = isSuspended ? await unsuspend('seller', seller.id) : await suspend('seller', seller.id);
    if (ok) { setConfirmAccount(false); refetch(); onChanged(); }
  }

  async function toggleStore() {
    if (!confirmStore) return;
    const ok = confirmStore.status === 'suspended'
      ? await unsuspendStore(confirmStore.id)
      : await suspendStore(confirmStore.id);
    if (ok) { setConfirmStore(null); refetch(); }
  }

  return (
    <>
      <Modal
        mobileSheet
        title="Seller Account"
        onClose={onClose}
        width={560}
        footer={seller ? (
          <>
            <Button variant="ghost" onClick={onClose}>Close</Button>
            <Button
              variant={isSuspended ? 'secondary' : 'danger'}
              icon={isSuspended ? <CheckCircle2 size={13} /> : <Ban size={13} />}
              loading={accountProcessingId === seller.id}
              onClick={() => setConfirmAccount(true)}
            >
              {isSuspended ? 'Unsuspend Seller' : 'Suspend Seller (all stores)'}
            </Button>
          </>
        ) : undefined}
      >
        {loading && !seller ? (
          <div className="flex flex-col gap-3">
            <SkeletonBox height={60} rounded="10px" />
            <SkeletonBox height={120} rounded="10px" />
          </div>
        ) : error ? (
          <AnalyticsErrorState message={error} onRetry={refetch} />
        ) : seller ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-pale-orange text-brand-deep-orange text-[13px] font-bold flex items-center justify-center shrink-0">
                {initialsOf(seller.name)}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-charcoal">{seller.name}</p>
                <p className="text-[12px] text-slate">{seller.email}</p>
              </div>
              <div className="ml-auto"><StatusBadge status={seller.status} size="sm" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <div><p className="text-[11px] text-slate mb-0.5">Stores Owned</p><span className="text-charcoal font-semibold">{seller.stores.length}</span></div>
              <div><p className="text-[11px] text-slate mb-0.5">Joined</p><span className="text-charcoal">{formatDate(seller.createdAt)}</span></div>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-slate uppercase tracking-[0.05em] mb-2">Stores</p>
              {seller.stores.length === 0 ? (
                <p className="text-[12.5px] text-slate italic">This seller hasn't created a store yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {seller.stores.map((store) => {
                    const items: ActionMenuItem[] = [
                      { label: 'View customers', icon: <Eye size={13} />, onClick: () => setCustomersFor(store) },
                      store.status === 'suspended'
                        ? { label: 'Unsuspend this store', icon: <CheckCircle2 size={13} />, onClick: () => setConfirmStore(store) }
                        : { label: 'Suspend this store', icon: <Ban size={13} />, danger: true, disabled: store.status !== 'active', onClick: () => setConfirmStore(store) },
                    ];
                    return (
                      <div key={store.id} className="flex items-center gap-3 border border-bone rounded-[10px] px-3 py-2.5">
                        <StoreIcon size={15} className="text-slate shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[12.5px] font-semibold text-charcoal truncate">{store.name}</p>
                          <p className="text-[11px] text-slate capitalize">{store.plan} plan</p>
                        </div>
                        <StatusBadge status={store.status} size="sm" />
                        <ActionMenu items={items} ariaLabel={`Actions for ${store.name}`} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {confirmAccount && seller && (
        <Modal
          mobileSheet
          title={isSuspended ? 'Unsuspend Seller' : 'Suspend Seller'}
          onClose={() => setConfirmAccount(false)}
          footer={<>
            <Button variant="ghost" onClick={() => setConfirmAccount(false)}>Cancel</Button>
            <Button variant={isSuspended ? 'secondary' : 'danger'} loading={accountProcessingId === seller.id} onClick={toggleAccount}>
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

      {confirmStore && (
        <Modal
          mobileSheet
          title={confirmStore.status === 'suspended' ? 'Unsuspend Store' : 'Suspend Store'}
          onClose={() => setConfirmStore(null)}
          footer={<>
            <Button variant="ghost" onClick={() => setConfirmStore(null)}>Cancel</Button>
            <Button
              variant={confirmStore.status === 'suspended' ? 'secondary' : 'danger'}
              loading={storeProcessingId === confirmStore.id}
              onClick={toggleStore}
            >
              {confirmStore.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
            </Button>
          </>}
        >
          <p className="text-[13px] text-charcoal leading-[1.6]">
            {confirmStore.status === 'suspended'
              ? <>Restore "<strong>{confirmStore.name}</strong>"? It goes back live for buyers.</>
              : <>Suspend only "<strong>{confirmStore.name}</strong>"? The seller's account and their other store(s) are left untouched.</>}
          </p>
        </Modal>
      )}

      {customersFor && <StoreCustomersModal store={customersFor} onClose={() => setCustomersFor(null)} />}
    </>
  );
}

export function AdminUsers() {
  usePageTitle('Users & Sellers');
  const { data: stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useAdminUsersStats();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const query = useMemo(
    () => ({
      search: search || undefined,
      status: statusFilter || undefined,
      page,
      limit: 10,
    }),
    [search, statusFilter, page],
  );

  const { data, loading, error, refetch } = useAdminUsersList(query);

  const [viewingId, setViewingId] = useState<string | null>(null);

  function refreshAll() { refetchStats(); refetch(); }

  const columns: TableColumn<SellerRow>[] = [
    {
      key: 'name',
      header: 'Seller',
      render: (u) => (
        <div className="flex items-center gap-[10px]">
          <div className="w-7 h-7 rounded-full bg-brand-pale-orange text-brand-deep-orange text-[9px] font-bold flex items-center justify-center shrink-0">
            {initialsOf(u.name)}
          </div>
          <div>
            <p className="text-[12px] font-semibold text-charcoal">{u.name}</p>
            <p className="text-[11px] text-slate">{u.id.slice(-8)}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', header: 'Email', render: (u) => <span className="text-[13px] text-graphite">{u.email}</span> },
    {
      key: 'storeCount',
      header: 'Stores',
      render: (u) => (
        <span className="inline-flex items-center gap-1.5 text-[13px] text-graphite">
          <StoreIcon size={13} className="text-slate" />
          {u.storeCount} {u.storeCount === 1 ? 'store' : 'stores'}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.status} size="sm" /> },
    { key: 'createdAt', header: 'Joined', render: (u) => <span className="text-[13px] text-slate whitespace-nowrap">{formatDate(u.createdAt)}</span> },
    {
      key: 'actions',
      header: 'Actions',
      render: (u) => (
        <ActionMenu
          ariaLabel={`Actions for ${u.name}`}
          items={[{ label: 'View', icon: <Eye size={13} />, onClick: () => setViewingId(u.id) }]}
        />
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader title="Users & Sellers" subtitle="Manage seller accounts and their stores." />
      <div className="px-4 sm:px-7 pt-6 pb-8 flex flex-col gap-5">

        {statsError ? (
          <AnalyticsErrorState message={statsError} onRetry={refetchStats} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {statsLoading && !stats ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonBox key={i} height={92} rounded="10px" />)
            ) : stats ? (
              <>
                <MetricCard label="Total Buyer Accounts" value={formatNumber(stats.totalBuyers)} />
                <MetricCard label="Active Seller Accounts" value={formatNumber(stats.activeSellerAccounts)} />
                <MetricCard label="Suspended" value={formatNumber(stats.suspended)} sub="Under review" />
              </>
            ) : null}
          </div>
        )}

        <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
          <div className="flex items-center gap-[10px] px-5 py-[14px] border-b border-bone flex-wrap">
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name or email…" className="flex-1 max-w-[280px]" />
            <FilterDropdown placeholder="All Statuses" options={STATUS_OPTIONS} value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} />
          </div>

          {error ? (
            <div className="p-5"><AnalyticsErrorState message={error} onRetry={refetch} /></div>
          ) : (
            <Table
              columns={columns}
              data={data?.items ?? []}
              keyExtractor={(u) => u.id}
              loading={loading}
              emptyState={{ icon: <Users2 size={28} className="text-slate/50" />, title: 'No sellers match your filters', description: 'Try adjusting your search or clearing filters.' }}
              pagination={{ page, total: data?.total ?? 0, perPage: 10, onChange: setPage, label: 'sellers' }}
            />
          )}
        </div>

        {viewingId && (
          <SellerDetailModal
            sellerId={viewingId}
            onClose={() => setViewingId(null)}
            onChanged={refreshAll}
          />
        )}
      </div>
    </>
  );
}
