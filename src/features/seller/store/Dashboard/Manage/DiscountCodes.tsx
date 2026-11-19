import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Plus, Tag, Pencil, Power, PowerOff, Trash2, ChevronLeft, ChevronRight, Link2, QrCode } from 'lucide-react';
import { SegmentSelect } from '@/features/seller/store/Dashboard/StoreSection/customer/SegmentSelect';
import { BulkImportButton } from '@/components/comman/bulk-import/BulkImportButton';
import {
  Button, Table, type TableColumn, Modal, Input, Select, Field, Badge,
  ActionMenu, type ActionMenuItem, SearchInput,
} from '@/components/comman/ui';
import { currencySymbol } from '@/utils/currency';
import {
  apiGetCoupons, apiCreateCoupon, apiUpdateCoupon, apiDeleteCoupon,
  type Coupon, type DiscountType, type CreateCouponPayload,
} from '@/api/services/marketing';

// Discount CODES (the buyer types them at checkout) — the "Discount code" method of Shopify's Discounts page. The other method,
// automatic discounts, is on the same page (StoreDiscounts). (They used to live under Marketing → Coupons.)

const PAGE_SIZE = 20;

function couponStatus(c: Coupon): { label: string; color: 'green' | 'gray' | 'yellow' | 'red' } {
  if (!c.isActive) return { label: 'Inactive', color: 'gray' };
  const now = Date.now();
  if (c.startsAt && new Date(c.startsAt).getTime() > now) return { label: 'Scheduled', color: 'yellow' };
  if (c.expiresAt && new Date(c.expiresAt).getTime() < now) return { label: 'Expired', color: 'red' };
  if (c.usageLimit != null && c.usageCount >= c.usageLimit) return { label: 'Used up', color: 'gray' };
  return { label: 'Active', color: 'green' };
}

function randomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no look-alikes (0/O, 1/I)
  const bytes = new Uint32Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
}

type MinRequirement = 'none' | 'amount' | 'quantity';

function CouponFormModal({ storeId, storeCurrency, initial, onClose, onSaved }: {
  storeId: string; storeCurrency: string; initial: Coupon | null; onClose: () => void; onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [code, setCode] = useState(initial?.code ?? '');
  const [discountType, setDiscountType] = useState<DiscountType>(initial?.discountType ?? 'percentage');
  const [value, setValue] = useState(initial ? String(initial.discountValue) : '');
  const [minReq, setMinReq] = useState<MinRequirement>(initial?.minOrderAmount != null ? 'amount' : initial?.minQuantity != null ? 'quantity' : 'none');
  const [minAmount, setMinAmount] = useState(initial?.minOrderAmount != null ? String(initial.minOrderAmount) : '');
  const [minQty, setMinQty] = useState(initial?.minQuantity != null ? String(initial.minQuantity) : '');
  const [segmentId, setSegmentId] = useState<string | null>(initial?.customerSegmentId ?? null);
  const [limitTotal, setLimitTotal] = useState(initial?.usageLimit != null);
  const [usageLimit, setUsageLimit] = useState(initial?.usageLimit != null ? String(initial.usageLimit) : '');
  const [oncePerCustomer, setOncePerCustomer] = useState(initial?.oncePerCustomer === true);
  const [posEnabled, setPosEnabled] = useState(initial?.posEnabled === true);
  const [startDate, setStartDate] = useState(initial?.startsAt ? initial.startsAt.slice(0, 10) : '');
  const [endDate, setEndDate] = useState(initial?.expiresAt ? initial.expiresAt.slice(0, 10) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const validate = (): string | null => {
    if (!code.trim()) return 'Enter a discount code.';
    const v = Number(value);
    if (!value.trim() || !Number.isFinite(v) || v <= 0) return 'Enter a discount value greater than 0.';
    if (discountType === 'percentage' && v > 100) return 'A percentage discount cannot be more than 100.';
    if (minReq === 'amount') {
      const a = Number(minAmount);
      if (!minAmount.trim() || !Number.isFinite(a) || a < 0) return 'Enter the minimum purchase amount.';
    }
    if (minReq === 'quantity') {
      const q = Number(minQty);
      if (!minQty.trim() || !Number.isInteger(q) || q < 1) return 'Minimum quantity must be a whole number, 1 or more.';
    }
    if (limitTotal) {
      const l = Number(usageLimit);
      if (!usageLimit.trim() || !Number.isInteger(l) || l < 1) return 'Usage limit must be a whole number, 1 or more.';
    }
    if (startDate && endDate && endDate < startDate) return 'The end date must be after the start date.';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true);
    setError('');
    // When editing, "not set" must be sent as null so it clears the old value; when creating it is simply left out.
    const blank = isEdit ? null : undefined;
    const payload: CreateCouponPayload = {
      code: code.trim(),
      discountType,
      discountValue: Number(value),
      minOrderAmount: minReq === 'amount' ? Number(minAmount) : blank,
      minQuantity: minReq === 'quantity' ? Number(minQty) : blank,
      usageLimit: limitTotal ? Number(usageLimit) : blank,
      oncePerCustomer,
      posEnabled,
      customerSegmentId: segmentId,
      startsAt: startDate || blank,
      expiresAt: endDate || blank,
    };
    try {
      if (isEdit) await apiUpdateCoupon(storeId, initial!._id, payload);
      else await apiCreateCoupon(storeId, payload);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save the discount code.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Edit discount code' : 'Create discount code'}
      onClose={onClose}
      width={540}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>{isEdit ? 'Save changes' : 'Create discount'}</Button>
        </>
      )}
    >
      {error && (
        <p className="mb-3 text-[12.5px] text-error bg-error-bg border border-error-border rounded-md px-3 py-2">{error}</p>
      )}

      <Field label="Discount code" required hint="Customers enter this at checkout.">
        <div className="flex gap-2">
          <div className="flex-1"><Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. SUMMER20" /></div>
          <Button variant="outline" onClick={() => setCode(randomCode())}>Generate</Button>
        </div>
      </Field>

      <Field label="Discount type" required>
        <Select value={discountType} onChange={e => setDiscountType(e.target.value as DiscountType)}>
          <option value="percentage">Percentage off</option>
          <option value="fixed">Fixed amount off</option>
        </Select>
      </Field>

      <Field label={discountType === 'percentage' ? 'Percentage' : 'Amount'} required>
        <Input
          type="number" min={0} value={value} onChange={e => setValue(e.target.value)}
          leftAddon={discountType === 'percentage' ? '%' : currencySymbol(storeCurrency)}
        />
      </Field>

      <Field label="Minimum purchase requirements">
        <Select value={minReq} onChange={e => setMinReq(e.target.value as MinRequirement)}>
          <option value="none">No minimum requirements</option>
          <option value="amount">Minimum purchase amount</option>
          <option value="quantity">Minimum quantity of items</option>
        </Select>
      </Field>
      {minReq === 'amount' && (
        <Field label="Minimum purchase amount" hint="Shipping and taxes are not counted.">
          <Input type="number" min={0} value={minAmount} onChange={e => setMinAmount(e.target.value)} leftAddon={currencySymbol(storeCurrency)} />
        </Field>
      )}
      {minReq === 'quantity' && (
        <Field label="Minimum quantity of items">
          <Input type="number" min={1} step={1} value={minQty} onChange={e => setMinQty(e.target.value)} />
        </Field>
      )}

      <SegmentSelect storeId={storeId} value={segmentId} onChange={setSegmentId} label="Customer eligibility" />

      <Field label="Maximum discount uses">
        <label className="flex items-center gap-2 text-[13px] text-carbon cursor-pointer mb-2">
          <input type="checkbox" className="accent-brand-orange" checked={limitTotal} onChange={e => setLimitTotal(e.target.checked)} />
          Limit the number of times this discount can be used in total
        </label>
        {limitTotal && (
          <Input type="number" min={1} step={1} value={usageLimit} onChange={e => setUsageLimit(e.target.value)} placeholder="e.g. 100" />
        )}
        <label className="flex items-center gap-2 text-[13px] text-carbon cursor-pointer mt-2">
          <input type="checkbox" className="accent-brand-orange" checked={oncePerCustomer} onChange={e => setOncePerCustomer(e.target.checked)} />
          Limit to one use per customer
        </label>
      </Field>

      <Field label="Sales channels">
        <label className="flex items-center gap-2 text-[13px] text-carbon cursor-pointer">
          <input type="checkbox" className="accent-brand-orange" checked={posEnabled} onChange={e => setPosEnabled(e.target.checked)} />
          Also accept this code at the point of sale (POS)
        </label>
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Start date" hint="Leave blank to start immediately">
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </Field>
        <Field label="End date" hint="Leave blank for no end">
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

/** The "Get a shareable link" popup: the link + a QR code for it. Opening the link applies the code at the customer's next checkout. */
function ShareLinkModal({ coupon, link, onClose }: { coupon: Coupon; link: string; onClose: () => void }) {
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(link, { margin: 1, width: 260, color: { dark: '#141413', light: '#ffffff' } })
      .then(url => { if (alive) setQr(url); })
      .catch(() => { if (alive) setQr(''); });
    return () => { alive = false; };
  }, [link]);

  const copy = () => {
    navigator.clipboard?.writeText(link).then(() => setCopied(true)).catch(() => setCopied(false));
  };

  return (
    <Modal
      title={`Share ${coupon.code}`}
      onClose={onClose}
      width={460}
      footer={<Button variant="primary" onClick={onClose}>Done</Button>}
    >
      <p className="text-[12.5px] text-slate mb-3">
        When a customer opens this link, the discount is applied to their next checkout (or open cart) automatically — no code to type.
      </p>
      <div className="flex gap-2 mb-4">
        <div className="flex-1"><Input readOnly value={link} onFocus={e => e.currentTarget.select()} /></div>
        <Button variant="outline" icon={<Link2 size={14} />} onClick={copy}>{copied ? 'Copied' : 'Copy link'}</Button>
      </div>
      <div className="flex flex-col items-center gap-2">
        {qr
          ? <img src={qr} alt={`QR code for ${coupon.code}`} width={200} height={200} className="border border-bone rounded-lg" />
          : <div className="w-[200px] h-[200px] rounded-lg bg-cream" />}
        {qr && <a href={qr} download={`${coupon.code}-qr.png`} className="text-[12.5px] font-semibold text-brand-orange hover:underline">Download QR code</a>}
      </div>
    </Modal>
  );
}

export function DiscountCodes({ storeId, storeCurrency, storeUrl, createOpen, onCreateClose }: { storeId: string; storeCurrency: string; storeUrl: string | null; createOpen: boolean; onCreateClose: () => void }) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sharing, setSharing] = useState<Coupon | null>(null);

  const load = useCallback(() => {
    if (!storeId) return;
    setLoading(true);
    setLoadError('');
    apiGetCoupons(storeId, { page, limit: PAGE_SIZE, search: search.trim() || undefined })
      .then(res => { setCoupons(res.data.coupons ?? []); setTotal(res.data.pagination?.total ?? 0); })
      .catch(e => setLoadError(e instanceof Error ? e.message : 'Failed to load discount codes.'))
      .finally(() => setLoading(false));
  }, [storeId, page, search]);

  // Typing in the search box waits a moment, and a new search starts from page 1.
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(load, 250);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [load]);

  const toggleActive = async (c: Coupon) => {
    setActionError('');
    try {
      await apiUpdateCoupon(storeId, c._id, { isActive: !c.isActive });
      load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to update the discount code.');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    setActionError('');
    try {
      await apiDeleteCoupon(storeId, confirmDelete._id);
      setConfirmDelete(null);
      load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to delete the discount code.');
    } finally {
      setDeleting(false);
    }
  };

  const columns: TableColumn<Coupon>[] = [
    {
      key: 'code', header: 'Discount code', render: c => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[8px] bg-brand-pale-orange flex items-center justify-center shrink-0">
            <Tag size={14} className="text-brand-orange" />
          </div>
          <div className="min-w-0">
            <p className="font-mono font-semibold text-carbon truncate">{c.code}</p>
            <p className="text-[11.5px] text-slate">
              {c.discountType === 'percentage' ? `${c.discountValue}% off` : `${currencySymbol(storeCurrency)} ${c.discountValue} off`}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'requirements', header: 'Requirements', render: c => {
        const parts: string[] = [];
        if (c.minOrderAmount != null) parts.push(`Min ${currencySymbol(storeCurrency)} ${c.minOrderAmount}`);
        if (c.minQuantity != null) parts.push(`Min ${c.minQuantity} item${c.minQuantity === 1 ? '' : 's'}`);
        if (c.customerSegmentId) parts.push('Segment only');
        if (c.oncePerCustomer) parts.push('One per customer');
        return <span className="text-[12px] text-slate">{parts.length ? parts.join(' · ') : 'None'}</span>;
      },
    },
    { key: 'used', header: 'Used', render: c => <span className="text-[12.5px] text-carbon">{c.usageCount}{c.usageLimit != null ? ` / ${c.usageLimit}` : ''}</span> },
    { key: 'status', header: 'Status', render: c => { const s = couponStatus(c); return <Badge color={s.color}>{s.label}</Badge>; } },
    {
      key: 'dates', header: 'Active dates', render: c => (
        <span className="text-[12px] text-slate whitespace-nowrap">
          {c.startsAt ? new Date(c.startsAt).toLocaleDateString() : 'Immediately'}{' – '}{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'No end date'}
        </span>
      ),
    },
    {
      key: 'actions', header: '', align: 'right', render: c => {
        const items: ActionMenuItem[] = [
          { label: 'Edit', icon: <Pencil size={14} />, onClick: () => { setEditing(c); setModalOpen(true); } },
          c.isActive
            ? { label: 'Deactivate', icon: <PowerOff size={14} />, onClick: () => toggleActive(c) }
            : { label: 'Activate', icon: <Power size={14} />, onClick: () => toggleActive(c) },
          ...(storeUrl ? [{ label: 'Get a shareable link', icon: <QrCode size={14} />, onClick: () => setSharing(c) }] : []),
          { label: 'Delete', icon: <Trash2 size={14} />, danger: true, onClick: () => setConfirmDelete(c) },
        ];
        return <ActionMenu items={items} />;
      },
    },
  ];

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="w-full sm:w-[280px]">
          <SearchInput value={search} onChange={v => { setPage(1); setSearch(v); }} placeholder="Search discount codes" />
        </div>
        <BulkImportButton
          entityLabel="discount codes"
          basePath={`/api/marketing/${storeId}/coupons`}
          onImported={load}
          notes={[
            'A code that already exists in this store is skipped, not duplicated. Codes are saved in UPPER-CASE.',
            'Discount Type is percentage or fixed (percentage max 100). Dates use YYYY-MM-DD.',
          ]}
        />
      </div>

      {(loadError || actionError) && (
        <div className="flex items-center justify-between gap-3 mb-3 bg-error-bg border border-error-border rounded-lg px-4 py-3">
          <p className="text-[12.5px] text-error">{loadError || actionError}</p>
          {loadError && <Button variant="outline" onClick={load}>Retry</Button>}
        </div>
      )}

      <div className="bg-white border border-bone rounded-xl overflow-hidden">
        <Table
          columns={columns}
          data={coupons}
          keyExtractor={c => c._id}
          loading={loading}
          emptyState={{
            icon: <Tag size={28} className="text-slate/50" />,
            title: search.trim() ? 'No discount codes match your search' : 'No discount codes yet',
            description: search.trim()
              ? 'Try a different code.'
              : 'Create a code your customers enter at checkout — a percentage or fixed amount off, with optional minimums and limits.',
            ...(search.trim() ? {} : { action: { label: 'Create discount', icon: <Plus size={14} />, onClick: () => { setEditing(null); setModalOpen(true); } } }),
          }}
        />
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-end gap-2 mt-3 text-[12.5px] text-slate">
          <span>Page {page} of {pages}</span>
          <Button variant="outline" icon={<ChevronLeft size={14} />} disabled={page <= 1 || loading} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
          <Button variant="outline" icon={<ChevronRight size={14} />} disabled={page >= pages || loading} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {/* The page header's "Create discount" button opens a new code (createOpen); the row menu opens an edit. */}
      {(modalOpen || createOpen) && (
        <CouponFormModal
          storeId={storeId}
          storeCurrency={storeCurrency}
          initial={createOpen ? null : editing}
          onClose={() => { if (createOpen) onCreateClose(); else setModalOpen(false); }}
          onSaved={() => { if (createOpen) onCreateClose(); else setModalOpen(false); load(); }}
        />
      )}

      {sharing && storeUrl && (
        <ShareLinkModal coupon={sharing} link={`${storeUrl}/discount/${encodeURIComponent(sharing.code)}`} onClose={() => setSharing(null)} />
      )}

      {confirmDelete && (
        <Modal
          title="Delete discount code?"
          onClose={() => setConfirmDelete(null)}
          footer={(
            <>
              <Button variant="ghost" onClick={() => setConfirmDelete(null)} disabled={deleting}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} loading={deleting}>Delete</Button>
            </>
          )}
        >
          <p className="text-[13px] text-slate">
            <strong>{confirmDelete.code}</strong> will stop working immediately
            {confirmDelete.usageCount > 0 ? ` (it has been used ${confirmDelete.usageCount} time${confirmDelete.usageCount === 1 ? '' : 's'})` : ''}. This can't be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}
