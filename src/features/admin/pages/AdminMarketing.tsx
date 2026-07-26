import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  useCampaigns, useCampaignActions, usePlatformCoupons, usePlatformCouponActions,
} from '@/hooks/admin/useAdminMarketing';
import type { Campaign, CampaignStatus, DiscountType, CampaignSponsorType, PlatformCoupon } from '@/api/services/marketing/adminMarketing';
import { Button, Modal, Input, Textarea, Select, Table, StatusBadge, Badge, Toggle, TabBar, ImageUpload, ActionMenu } from '@/components/comman/ui';
import type { TableColumn, Tab } from '@/components/comman/ui';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { formatDate, formatCurrency } from '@/components/comman/analytics/format';
import { Tag, Percent, Trash2, Plus, Store, Building2, User, Pencil, Play, Square } from 'lucide-react';

// datetime-local inputs need "YYYY-MM-DDTHH:mm" in local time, not the raw ISO string.
function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const TABS: Tab[] = [
  { id: 'campaigns', label: 'Sale Campaigns', icon: <Tag size={14} /> },
  { id: 'coupons', label: 'Platform Coupons', icon: <Percent size={14} /> },
];

// ═══════════════════════════════ Campaigns ═══════════════════════════════════

function CreateCampaignModal({ campaign, onClose, onSaved }: { campaign?: Campaign; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!campaign;
  const { createCampaign, updateCampaign, submitting, error } = useCampaignActions();
  const [name, setName] = useState(campaign?.name ?? '');
  const [description, setDescription] = useState(campaign?.description ?? '');
  const [bannerImage, setBannerImage] = useState(campaign?.bannerImage ?? '');
  const [startDate, setStartDate] = useState(campaign ? toDatetimeLocalValue(campaign.startDate) : '');
  const [endDate, setEndDate] = useState(campaign ? toDatetimeLocalValue(campaign.endDate) : '');
  const [discountType, setDiscountType] = useState<DiscountType | ''>(campaign?.discountType ?? '');
  const [discountValue, setDiscountValue] = useState(campaign?.discountValue != null ? String(campaign.discountValue) : '');
  const [sponsorType, setSponsorType] = useState<CampaignSponsorType>(campaign?.sponsorType ?? 'seller');
  const [order, setOrder] = useState(campaign ? String(campaign.order) : '');
  const [validationError, setValidationError] = useState('');

  async function submit() {
    if (!name.trim() || !startDate || !endDate) { setValidationError('Name, start date, and end date are required.'); return; }
    if (new Date(endDate) <= new Date(startDate)) { setValidationError('End date must be after start date.'); return; }
    if (sponsorType === 'platform' && (!discountType || !discountValue)) {
      setValidationError('A platform-sponsored campaign needs a discount type and value — that\'s what the platform is covering.');
      return;
    }
    setValidationError('');
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      bannerImage: bannerImage || undefined,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      discountType: discountType || undefined,
      discountValue: discountType && discountValue ? Number(discountValue) : undefined,
      sponsorType,
      order: order.trim() ? Number(order) : undefined,
    };
    const ok = isEdit ? await updateCampaign(campaign._id, payload) : await createCampaign(payload);
    if (ok) onSaved();
  }

  return (
    <Modal
      title={isEdit ? 'Edit Sale Campaign' : 'Create Sale Campaign'}
      width={520}
      onClose={onClose}
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} loading={submitting}>{isEdit ? 'Save Changes' : 'Create Campaign'}</Button>
      </>}
    >
      <div className="flex flex-col gap-4">
        <Input label="Campaign Name" placeholder="Summer Sale Weekend" value={name} onChange={(e) => setName(e.target.value)} />
        <Textarea label="Description" rows={3} placeholder="Optional description sellers will see when opting in…" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div>
          <label className="text-[12px] font-medium text-charcoal block mb-1.5">Banner Image (optional)</label>
          <ImageUpload value={bannerImage ? [bannerImage] : []} onChange={(urls) => setBannerImage(urls[0] ?? '')} maxFiles={1} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Start Date" type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="End Date" type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div>
          <Input
            label="Display Order (optional)" type="number" min={0} placeholder="0 = shown first"
            value={order} onChange={(e) => setOrder(e.target.value)}
          />
          <p className="text-[11px] text-slate mt-1">
            Controls which campaign shows first when more than one is active on the deals banner — lower number = shown first. Leave blank to add it to the end of the rotation.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label={sponsorType === 'platform' ? 'Discount (required)' : 'Suggested Discount (optional)'} value={discountType} onChange={(e) => setDiscountType(e.target.value as DiscountType | '')}>
            <option value="">No default discount</option>
            <option value="percentage">Percentage off</option>
            <option value="fixed">Fixed amount off</option>
          </Select>
          <Input label="Discount Value" type="number" min={0} disabled={!discountType} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
        </div>

        <div>
          <label className="text-[12px] font-medium text-charcoal block mb-1.5">Who covers the discount?</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setSponsorType('seller')}
              className="text-left px-3.5 py-3 rounded-lg border transition-colors cursor-pointer"
              style={{
                borderColor: sponsorType === 'seller' ? '#D97757' : '#E8E6DC',
                background: sponsorType === 'seller' ? '#FBECE4' : '#FAF9F5',
              }}
            >
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-charcoal"><User size={13} /> Seller Sponsored</p>
              <p className="text-[11px] text-slate mt-1">Participating sellers give the discount out of their own payout — the platform's cost is $0.</p>
            </button>
            <button
              type="button"
              onClick={() => setSponsorType('platform')}
              className="text-left px-3.5 py-3 rounded-lg border transition-colors cursor-pointer"
              style={{
                borderColor: sponsorType === 'platform' ? '#D97757' : '#E8E6DC',
                background: sponsorType === 'platform' ? '#FBECE4' : '#FAF9F5',
              }}
            >
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-charcoal"><Building2 size={13} /> Platform Sponsored</p>
              <p className="text-[11px] text-slate mt-1">The platform reimburses the discount — sellers keep their full payout, no margin lost by joining.</p>
            </button>
          </div>
        </div>

        {(validationError || error) && <p className="text-[12px] text-error">{validationError || error}</p>}
      </div>
    </Modal>
  );
}

function CampaignsTab() {
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | undefined>(undefined);
  const { data: campaigns, loading, error, refetch } = useCampaigns(statusFilter);
  const { setStatus, updateCampaign, deleteCampaign, submitting, error: actionError } = useCampaignActions();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [deleting, setDeleting] = useState<Campaign | null>(null);
  const [orderDrafts, setOrderDrafts] = useState<Record<string, string>>({});

  async function toggleStatus(c: Campaign, next: CampaignStatus) {
    const ok = await setStatus(c._id, next);
    if (ok) refetch();
  }

  async function saveOrder(c: Campaign, raw: string) {
    const next = Number(raw);
    if (raw.trim() === '' || Number.isNaN(next) || next === c.order) return;
    const ok = await updateCampaign(c._id, { order: next });
    if (ok) {
      refetch();
    } else {
      // Rejected (e.g. position already taken by another campaign) — snap the
      // input back to the real value instead of leaving the invalid number
      // displayed as if it had been saved.
      setOrderDrafts((prev) => ({ ...prev, [c._id]: String(c.order) }));
    }
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
      key: 'order',
      header: 'Banner Order',
      align: 'center',
      render: (c) => (
        <input
          type="number"
          min={0}
          value={orderDrafts[c._id] ?? String(c.order)}
          onChange={(e) => setOrderDrafts((prev) => ({ ...prev, [c._id]: e.target.value }))}
          onBlur={(e) => saveOrder(c, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          disabled={submitting}
          title="Lower number shows first when multiple campaigns are active on the deals banner"
          className="w-14 rounded-md border border-bone px-2 py-1 text-center text-[12px] text-charcoal outline-none focus:border-brand-orange disabled:opacity-50"
        />
      ),
    },
    {
      key: 'discount',
      header: 'Discount',
      render: (c) => c.discountType && c.discountValue
        ? <span className="text-[13px] font-semibold text-charcoal">{c.discountType === 'percentage' ? `${c.discountValue}% off` : formatCurrency(c.discountValue) + ' off'}</span>
        : <span className="text-slate/40">—</span>,
    },
    {
      key: 'sponsor',
      header: 'Sponsored By',
      render: (c) => c.sponsorType === 'platform'
        ? (
          <div>
            <Badge size="sm" color="orange"><Building2 size={10} /> Platform</Badge>
            {c.totalPlatformSubsidyUSD > 0 && <p className="text-[11px] text-slate mt-1">{formatCurrency(c.totalPlatformSubsidyUSD)} spent</p>}
          </div>
        )
        : <Badge size="sm"><User size={10} /> Seller</Badge>,
    },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} size="sm" /> },
    {
      key: 'participating',
      header: 'Stores Joined',
      align: 'center',
      render: (c) => c.sponsorType === 'platform'
        ? <Badge size="sm" color="orange"><Store size={10} /> All stores</Badge>
        : <Badge size="sm"><Store size={10} /> {(c.participatingStoreIds ?? []).length}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (c) => (
        <ActionMenu
          align="right"
          items={[
            { label: 'Edit Campaign', icon: <Pencil size={13} />, onClick: () => setEditing(c) },
            ...(c.status === 'draft' ? [{ label: 'Activate', icon: <Play size={13} />, onClick: () => toggleStatus(c, 'active' as CampaignStatus), disabled: submitting }] : []),
            ...(c.status === 'active' ? [{ label: 'End Campaign', icon: <Square size={13} />, onClick: () => toggleStatus(c, 'ended' as CampaignStatus), disabled: submitting }] : []),
            { label: 'Delete', icon: <Trash2 size={13} />, danger: true, onClick: () => setDeleting(c) },
          ]}
        />
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

      <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
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

      {creating && <CreateCampaignModal onClose={() => setCreating(false)} onSaved={() => { setCreating(false); refetch(); }} />}
      {editing && <CreateCampaignModal campaign={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refetch(); }} />}

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

function CreateCouponModal({ coupon, onClose, onSaved }: { coupon?: PlatformCoupon; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!coupon;
  const { createCoupon, updateCoupon, submitting, error } = usePlatformCouponActions();
  const [code, setCode] = useState(coupon?.code ?? '');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(coupon?.discountType ?? 'percentage');
  const [discountValue, setDiscountValue] = useState(coupon ? String(coupon.discountValue) : '');
  const [minOrderAmount, setMinOrderAmount] = useState(coupon?.minOrderAmount != null ? String(coupon.minOrderAmount) : '');
  const [usageLimit, setUsageLimit] = useState(coupon?.usageLimit != null ? String(coupon.usageLimit) : '');
  const [expiresAt, setExpiresAt] = useState(coupon?.expiresAt ? coupon.expiresAt.slice(0, 10) : '');
  const [validationError, setValidationError] = useState('');

  async function submit() {
    const value = Number(discountValue);
    if (!code.trim() || !discountValue || Number.isNaN(value) || value <= 0) { setValidationError('Code and a valid discount value are required.'); return; }
    if (discountType === 'percentage' && value > 100) { setValidationError('Percentage discount cannot exceed 100.'); return; }
    setValidationError('');
    const commonFields = {
      discountValue: value,
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
    };
    // code/discountType are immutable after creation (UpdatePlatformCouponPayload
    // doesn't accept them) — an edit only ever adjusts the fields below.
    const ok = isEdit
      ? await updateCoupon(coupon._id, commonFields)
      : await createCoupon({ code: code.trim().toUpperCase(), discountType, ...commonFields });
    if (ok) onSaved();
  }

  return (
    <Modal
      title={isEdit ? 'Edit Platform Coupon' : 'Create Platform Coupon'}
      width={480}
      onClose={onClose}
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} loading={submitting}>{isEdit ? 'Save Changes' : 'Create Coupon'}</Button>
      </>}
    >
      <div className="flex flex-col gap-4">
        <Input label="Coupon Code" placeholder="WELCOME10" value={code} disabled={isEdit} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        {isEdit && <p className="text-[11px] text-slate -mt-2.5">Code and discount type can't be changed after creation — delete and create a new coupon instead.</p>}
        <div className="grid grid-cols-2 gap-3">
          <Select label="Discount Type" value={discountType} disabled={isEdit} onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}>
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
  const [editing, setEditing] = useState<PlatformCoupon | null>(null);
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
      align: 'center',
      render: (c) => (
        <ActionMenu
          align="right"
          items={[
            { label: 'Edit', icon: <Pencil size={13} />, onClick: () => setEditing(c) },
            { label: 'Delete', icon: <Trash2 size={13} />, danger: true, onClick: () => setDeleting(c) },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 pt-4">
      {actionError && <div className="bg-error-bg border border-[#FECACA] rounded-lg px-4 py-2.5 text-[12.5px] text-error">{actionError}</div>}
      <div className="flex justify-end">
        <Button size="sm" icon={<Plus size={13} />} onClick={() => setCreating(true)}>New Coupon</Button>
      </div>

      <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
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

      {creating && <CreateCouponModal onClose={() => setCreating(false)} onSaved={() => { setCreating(false); refetch(); }} />}
      {editing && <CreateCouponModal coupon={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refetch(); }} />}

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
