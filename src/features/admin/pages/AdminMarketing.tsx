import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  useCampaigns, useCampaignActions, usePlatformCoupons, usePlatformCouponActions,
} from '@/hooks/admin/useAdminMarketing';
import type { Campaign, CampaignStatus, DiscountType, PlatformCoupon } from '@/api/services/marketing/adminMarketing';
import { Button, Modal, Input, Textarea, Select, Table, StatusBadge, Badge, Toggle, TabBar } from '@/components/comman/ui';
import type { TableColumn, Tab } from '@/components/comman/ui';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { formatDate, formatCurrency } from '@/components/comman/analytics/format';
import { Tag, Percent, Trash2, Plus, Store } from 'lucide-react';

const TABS: Tab[] = [
  { id: 'campaigns', label: 'Sale Campaigns', icon: <Tag size={14} /> },
  { id: 'coupons', label: 'Platform Coupons', icon: <Percent size={14} /> },
];

// ═══════════════════════════════ Campaigns ═══════════════════════════════════

function CreateCampaignModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { createCampaign, submitting, error } = useCampaignActions();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType | ''>('');
  const [discountValue, setDiscountValue] = useState('');
  const [validationError, setValidationError] = useState('');

  async function submit() {
    if (!name.trim() || !startDate || !endDate) { setValidationError('Name, start date, and end date are required.'); return; }
    if (new Date(endDate) <= new Date(startDate)) { setValidationError('End date must be after start date.'); return; }
    setValidationError('');
    const ok = await createCampaign({
      name: name.trim(),
      description: description.trim() || undefined,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      discountType: discountType || undefined,
      discountValue: discountType && discountValue ? Number(discountValue) : undefined,
    });
    if (ok) onCreated();
  }

  return (
    <Modal
      title="Create Sale Campaign"
      width={520}
      onClose={onClose}
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} loading={submitting}>Create Campaign</Button>
      </>}
    >
      <div className="flex flex-col gap-4">
        <Input label="Campaign Name" placeholder="Summer Sale Weekend" value={name} onChange={(e) => setName(e.target.value)} />
        <Textarea label="Description" rows={3} placeholder="Optional description sellers will see when opting in…" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Start Date" type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="End Date" type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label="Suggested Discount (optional)" value={discountType} onChange={(e) => setDiscountType(e.target.value as DiscountType | '')}>
            <option value="">No default discount</option>
            <option value="percentage">Percentage off</option>
            <option value="fixed">Fixed amount off</option>
          </Select>
          <Input label="Discount Value" type="number" min={0} disabled={!discountType} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
        </div>
        {(validationError || error) && <p className="text-[12px] text-error">{validationError || error}</p>}
      </div>
    </Modal>
  );
}

function CampaignsTab() {
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | undefined>(undefined);
  const { data: campaigns, loading, error, refetch } = useCampaigns(statusFilter);
  const { setStatus, deleteCampaign, submitting, error: actionError } = useCampaignActions();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Campaign | null>(null);

  async function toggleStatus(c: Campaign, next: CampaignStatus) {
    const ok = await setStatus(c._id, next);
    if (ok) refetch();
  }

  async function handleDelete() {
    if (!deleting) return;
    const ok = await deleteCampaign(deleting._id);
    if (ok) { setDeleting(null); refetch(); }
  }

  const columns: TableColumn<Campaign>[] = [
    {
      key: 'name',
      header: 'Campaign',
      render: (c) => (
        <div className="max-w-[260px]">
          <p className="text-[13px] font-semibold text-charcoal">{c.name}</p>
          {c.description && <p className="text-[12px] text-slate truncate">{c.description}</p>}
        </div>
      ),
    },
    { key: 'dates', header: 'Dates', render: (c) => <span className="text-[12px] text-slate whitespace-nowrap">{formatDate(c.startDate)} – {formatDate(c.endDate)}</span> },
    {
      key: 'discount',
      header: 'Discount',
      render: (c) => c.discountType && c.discountValue
        ? <span className="text-[13px] font-semibold text-charcoal">{c.discountType === 'percentage' ? `${c.discountValue}% off` : formatCurrency(c.discountValue) + ' off'}</span>
        : <span className="text-slate/40">—</span>,
    },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} size="sm" /> },
    {
      key: 'participating',
      header: 'Stores Joined',
      align: 'center',
      render: (c) => <Badge size="sm"><Store size={10} /> {c.participatingStoreIds.length}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (c) => (
        <div className="flex items-center gap-2">
          {c.status === 'draft' && (
            <button onClick={() => toggleStatus(c, 'active')} disabled={submitting} className="text-[12px] font-medium text-success bg-transparent border-none cursor-pointer disabled:opacity-40">Activate</button>
          )}
          {c.status === 'active' && (
            <button onClick={() => toggleStatus(c, 'ended')} disabled={submitting} className="text-[12px] font-medium text-slate bg-transparent border-none cursor-pointer disabled:opacity-40">End</button>
          )}
          <span className="text-bone text-[13px]">|</span>
          <button onClick={() => setDeleting(c)} className="text-[12px] font-medium text-error bg-transparent border-none cursor-pointer">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 pt-4">
      {actionError && <div className="bg-error-bg border border-[#FECACA] rounded-lg px-4 py-2.5 text-[12.5px] text-error">{actionError}</div>}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {(['', 'draft', 'active', 'ended'] as const).map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setStatusFilter(s || undefined)}
              className={`px-3 py-[6px] rounded-lg text-[12px] font-medium border cursor-pointer transition-colors duration-150 ${
                (statusFilter ?? '') === s ? 'bg-brand-pale-orange border-brand-orange/30 text-brand-deep-orange' : 'bg-white border-bone text-slate hover:bg-cream'
              }`}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </button>
          ))}
        </div>
        <Button size="sm" icon={<Plus size={13} />} onClick={() => setCreating(true)}>New Campaign</Button>
      </div>

      <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
        {error ? (
          <div className="p-5"><AnalyticsErrorState message={error} onRetry={refetch} /></div>
        ) : (
          <Table
            columns={columns}
            data={campaigns ?? []}
            keyExtractor={(c) => c._id}
            loading={loading}
            emptyState={{ icon: <Tag size={28} className="text-slate/50" />, title: 'No sale campaigns yet', description: 'Create a platform-wide sale event for sellers to opt their stores into.', action: { label: 'New Campaign', onClick: () => setCreating(true), icon: <Plus size={14} /> } }}
          />
        )}
      </div>

      {creating && <CreateCampaignModal onClose={() => setCreating(false)} onCreated={() => { setCreating(false); refetch(); }} />}

      {deleting && (
        <Modal
          title="Delete Campaign"
          onClose={() => setDeleting(null)}
          footer={<>
            <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={submitting}>Delete Campaign</Button>
          </>}
        >
          <p className="text-[13px] text-charcoal leading-[1.6]">Delete "<strong>{deleting.name}</strong>"? This cannot be undone.</p>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════ Platform Coupons ═════════════════════════════

function CreateCouponModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { createCoupon, submitting, error } = usePlatformCouponActions();
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [validationError, setValidationError] = useState('');

  async function submit() {
    const value = Number(discountValue);
    if (!code.trim() || !discountValue || Number.isNaN(value) || value <= 0) { setValidationError('Code and a valid discount value are required.'); return; }
    if (discountType === 'percentage' && value > 100) { setValidationError('Percentage discount cannot exceed 100.'); return; }
    setValidationError('');
    const ok = await createCoupon({
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: value,
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
    });
    if (ok) onCreated();
  }

  return (
    <Modal
      title="Create Platform Coupon"
      width={480}
      onClose={onClose}
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} loading={submitting}>Create Coupon</Button>
      </>}
    >
      <div className="flex flex-col gap-4">
        <Input label="Coupon Code" placeholder="WELCOME10" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Discount Type" value={discountType} onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed amount</option>
          </Select>
          <Input label="Discount Value" type="number" min={0} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Min Order Amount" type="number" min={0} placeholder="Optional" value={minOrderAmount} onChange={(e) => setMinOrderAmount(e.target.value)} />
          <Input label="Usage Limit" type="number" min={1} placeholder="Unlimited" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} />
        </div>
        <Input label="Expires At" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        {(validationError || error) && <p className="text-[12px] text-error">{validationError || error}</p>}
      </div>
    </Modal>
  );
}

function CouponsTab() {
  const { data: coupons, loading, error, refetch } = usePlatformCoupons();
  const { updateCoupon, deleteCoupon, submitting, error: actionError } = usePlatformCouponActions();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<PlatformCoupon | null>(null);

  async function toggleActive(coupon: PlatformCoupon) {
    const ok = await updateCoupon(coupon._id, { isActive: !coupon.isActive });
    if (ok) refetch();
  }

  async function handleDelete() {
    if (!deleting) return;
    const ok = await deleteCoupon(deleting._id);
    if (ok) { setDeleting(null); refetch(); }
  }

  const columns: TableColumn<PlatformCoupon>[] = [
    { key: 'code', header: 'Code', render: (c) => <span className="text-[13px] font-bold text-brand-deep-orange">{c.code}</span> },
    {
      key: 'discount',
      header: 'Discount',
      render: (c) => <span className="text-[13px] font-semibold text-charcoal">{c.discountType === 'percentage' ? `${c.discountValue}% off` : formatCurrency(c.discountValue) + ' off'}</span>,
    },
    { key: 'minOrderAmount', header: 'Min Order', render: (c) => <span className="text-[13px] text-graphite">{c.minOrderAmount != null ? formatCurrency(c.minOrderAmount) : '—'}</span> },
    { key: 'usage', header: 'Usage', render: (c) => <span className="text-[13px] text-graphite">{c.usageCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</span> },
    { key: 'expiresAt', header: 'Expires', render: (c) => <span className="text-[13px] text-slate whitespace-nowrap">{c.expiresAt ? formatDate(c.expiresAt) : 'Never'}</span> },
    { key: 'isActive', header: 'Active', render: (c) => <Toggle checked={c.isActive} onChange={() => toggleActive(c)} disabled={submitting} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (c) => (
        <button onClick={() => setDeleting(c)} className="text-[12px] font-medium text-error bg-transparent border-none cursor-pointer flex items-center gap-1">
          <Trash2 size={11} /> Delete
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 pt-4">
      {actionError && <div className="bg-error-bg border border-[#FECACA] rounded-lg px-4 py-2.5 text-[12.5px] text-error">{actionError}</div>}
      <div className="flex justify-end">
        <Button size="sm" icon={<Plus size={13} />} onClick={() => setCreating(true)}>New Coupon</Button>
      </div>

      <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
        {error ? (
          <div className="p-5"><AnalyticsErrorState message={error} onRetry={refetch} /></div>
        ) : (
          <Table
            columns={columns}
            data={coupons ?? []}
            keyExtractor={(c) => c._id}
            loading={loading}
            emptyState={{ icon: <Percent size={28} className="text-slate/50" />, title: 'No platform coupons yet', description: 'Create a platform-wide code like WELCOME10 that works across any store.', action: { label: 'New Coupon', onClick: () => setCreating(true), icon: <Plus size={14} /> } }}
          />
        )}
      </div>

      {creating && <CreateCouponModal onClose={() => setCreating(false)} onCreated={() => { setCreating(false); refetch(); }} />}

      {deleting && (
        <Modal
          title="Delete Coupon"
          onClose={() => setDeleting(null)}
          footer={<>
            <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={submitting}>Delete Coupon</Button>
          </>}
        >
          <p className="text-[13px] text-charcoal leading-[1.6]">Delete coupon "<strong>{deleting.code}</strong>"? This cannot be undone.</p>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════ Page ════════════════════════════════════════

export function AdminMarketing() {
  usePageTitle('Marketing');
  const [tab, setTab] = useState('campaigns');

  return (
    <div className="px-4 sm:px-7 pt-6 pb-8 flex flex-col gap-5">
      <div>
        <h1 className="text-[18px] font-bold text-charcoal mb-[3px]">Marketing</h1>
        <p className="text-[12px] text-slate">Platform-wide sale campaigns and coupon codes, separate from each seller's own store coupons.</p>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'campaigns' ? <CampaignsTab /> : <CouponsTab />}
    </div>
  );
}
