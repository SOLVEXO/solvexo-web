import { useState } from 'react';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';
import type { SellerStore } from '@/api/services/users/adminUsers';
import { useAdminStoreActions } from '@/hooks/admin/useAdminUsers';
import { StoreCustomersModal } from '../AdminUsers';
import {
  apiResolveCommissionRate, apiGetSellerCommissionOverride, apiSetSellerCommissionOverride,
  apiRemoveSellerCommissionOverride, type ResolvedCommissionRate, type CommissionRule,
} from '@/api/services/commissionRules';
import { Button, Modal, StatusBadge, ActionMenu, Badge, SkeletonBox } from '@/components/comman/ui';
import type { ActionMenuItem } from '@/components/comman/ui';
import { Store as StoreIcon, Eye, Ban, CheckCircle2, Percent } from 'lucide-react';

interface StoresTabProps {
  stores: SellerStore[];
  onChanged: () => void;
}

const RATE_SOURCE_LABEL: Record<ResolvedCommissionRate['source'], string> = {
  seller_override: 'Store override',
  platform_plan: 'From plan',
  global_default: 'Global default',
  hardcoded_fallback: 'Fallback',
};

// ── One store's effective commission rate + the admin's own override on
// top of it — a store-level setting (a client's stores can each have a
// different rate), so this lives here, not the client-level Finance tab.
// Reuses the exact same commission-rules endpoints the global Commission
// Rules page already uses, just entered from this store's own context. ────
interface CommissionData { resolved: ResolvedCommissionRate; override: CommissionRule | null }

function CommissionModal({ store, onClose }: { store: SellerStore; onClose: () => void }) {
  const { data, loading, error, refetch } = useAnalyticsQuery(
    async (p: { storeId: string }): Promise<{ data: CommissionData }> => {
      const [resolved, override] = await Promise.all([
        apiResolveCommissionRate(p.storeId),
        apiGetSellerCommissionOverride(p.storeId),
      ]);
      return { data: { resolved, override } };
    },
    { storeId: store.id },
  );

  const [rateInput, setRateInput] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  // Adjust state during render (not an effect) — resets rateInput's default
  // exactly once per fresh load (comparing against the last-synced object),
  // not on every keystroke or re-render. Same pattern as AdminLayout.tsx's
  // trialCardState.
  const [syncedData, setSyncedData] = useState<CommissionData | null>(null);
  if (data && data !== syncedData) {
    setSyncedData(data);
    setRateInput(data.override ? String((data.override.rate * 100).toFixed(2)) : String((data.resolved.rate * 100).toFixed(2)));
  }

  async function submitOverride() {
    const pct = Number(rateInput);
    if (isNaN(pct) || pct < 0 || pct > 100) { setActionError('Enter a rate between 0 and 100.'); return; }
    setSubmitting(true);
    setActionError('');
    try {
      await apiSetSellerCommissionOverride(store.id, pct / 100, notes || undefined);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to set override.');
    } finally {
      setSubmitting(false);
    }
  }

  async function removeOverride() {
    setSubmitting(true);
    setActionError('');
    try {
      await apiRemoveSellerCommissionOverride(store.id);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to remove override.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      mobileSheet
      title={`Commission Rate — ${store.name}`}
      onClose={onClose}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Close</Button>
        {data?.override && <Button variant="danger" loading={submitting} onClick={removeOverride}>Remove Override</Button>}
        <Button variant="primary" loading={submitting} onClick={submitOverride}>{data?.override ? 'Update Override' : 'Set Override'}</Button>
      </>}
    >
      {error ? (
        <p className="text-[12.5px] text-error">{error}</p>
      ) : loading || !data ? (
        <SkeletonBox height={100} rounded="10px" />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[22px] font-bold text-carbon">{(data.resolved.rate * 100).toFixed(2)}%</span>
            <Badge size="sm" color={data.resolved.source === 'seller_override' ? 'orange' : 'gray'}>
              {RATE_SOURCE_LABEL[data.resolved.source]}
            </Badge>
          </div>
          <p className="text-[11.5px] text-slate">
            {data.override ? 'This store has its own commission rate, overriding the plan/global rate.' : 'This store follows the plan/global rate — set an override to charge it differently.'}
          </p>
          <div>
            <label htmlFor="commission-rate" className="block text-[11.5px] font-medium text-charcoal mb-1.5">Override rate (%)</label>
            <input
              id="commission-rate"
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-bone text-[13px] text-charcoal outline-none bg-white"
            />
          </div>
          <div>
            <label htmlFor="commission-notes" className="block text-[11.5px] font-medium text-charcoal mb-1.5">Notes <span className="text-slate font-normal">(optional, logged for audit)</span></label>
            <textarea
              id="commission-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-bone text-[13px] text-charcoal outline-none bg-white resize-y"
            />
          </div>
          {actionError && <p className="text-[12px] text-error">{actionError}</p>}
        </div>
      )}
    </Modal>
  );
}

// ── This client's stores — suspend/unsuspend one store independent of the
// account (existing action, same as the old Users & Sellers page), and
// "View customers" drills into the SAME per-store customers modal that
// page used — reused unchanged, not a second implementation. ───────────────
export function StoresTab({ stores, onChanged }: StoresTabProps) {
  const { suspendStore, unsuspendStore, processingId } = useAdminStoreActions();
  const [confirmStore, setConfirmStore] = useState<SellerStore | null>(null);
  const [customersFor, setCustomersFor] = useState<SellerStore | null>(null);
  const [commissionFor, setCommissionFor] = useState<SellerStore | null>(null);

  async function toggleStore() {
    if (!confirmStore) return;
    const ok = confirmStore.status === 'suspended' ? await unsuspendStore(confirmStore.id) : await suspendStore(confirmStore.id);
    if (ok) { setConfirmStore(null); onChanged(); }
  }

  if (stores.length === 0) {
    return <p className="text-[12.5px] text-slate italic">This client hasn't created a store yet.</p>;
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {stores.map((store) => {
          const items: ActionMenuItem[] = [
            { label: 'View customers', icon: <Eye size={13} />, onClick: () => setCustomersFor(store) },
            { label: 'Commission rate', icon: <Percent size={13} />, onClick: () => setCommissionFor(store) },
            store.status === 'suspended'
              ? { label: 'Unsuspend this store', icon: <CheckCircle2 size={13} />, onClick: () => setConfirmStore(store) }
              : { label: 'Suspend this store', icon: <Ban size={13} />, danger: true, disabled: store.status !== 'active', onClick: () => setConfirmStore(store) },
          ];
          return (
            <div key={store.id} className="flex items-center gap-3 bg-white border border-bone rounded-[10px] px-4 py-3">
              <StoreIcon size={16} className="text-slate shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-charcoal truncate">{store.name}</p>
                <p className="text-[11.5px] text-slate capitalize">/{store.slug} · {store.plan} plan</p>
              </div>
              <StatusBadge status={store.status} size="sm" />
              <ActionMenu items={items} ariaLabel={`Actions for ${store.name}`} />
            </div>
          );
        })}
      </div>

      {confirmStore && (
        <Modal
          mobileSheet
          title={confirmStore.status === 'suspended' ? 'Unsuspend Store' : 'Suspend Store'}
          onClose={() => setConfirmStore(null)}
          footer={<>
            <Button variant="ghost" onClick={() => setConfirmStore(null)}>Cancel</Button>
            <Button
              variant={confirmStore.status === 'suspended' ? 'secondary' : 'danger'}
              loading={processingId === confirmStore.id}
              onClick={toggleStore}
            >
              {confirmStore.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
            </Button>
          </>}
        >
          <p className="text-[13px] text-charcoal leading-[1.6]">
            {confirmStore.status === 'suspended'
              ? <>Restore "<strong>{confirmStore.name}</strong>"? It goes back live for buyers.</>
              : <>Suspend only "<strong>{confirmStore.name}</strong>"? The client's account and their other store(s) are left untouched.</>}
          </p>
        </Modal>
      )}

      {customersFor && <StoreCustomersModal store={customersFor} onClose={() => setCustomersFor(null)} />}
      {commissionFor && <CommissionModal store={commissionFor} onClose={() => setCommissionFor(null)} />}
    </>
  );
}
