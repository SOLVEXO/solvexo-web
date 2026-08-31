import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Plus, Gift, Ban } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import {
  apiGetGiftCardSettings, apiUpdateGiftCardSettings, apiIssueGiftCard, apiListGiftCards, apiDisableGiftCard,
  type GiftCardSettings, type GiftCard, type IssueManualGiftCardPayload,
} from '@/api/services/giftCards';
import { currencySymbol, fmt2 } from '@/utils/currency';
import {
  Button, Card, Table, type TableColumn, Modal, Input, Select, Field, Badge,
  TagInput, Toggle, SearchInput, CopyIconButton,
} from '@/components/comman/ui';

// ── Store-scoped, balance-based credit — backend (GiftCardsService/schemas)
// and this frontend api client (giftCards.ts) already existed and were
// already wired into checkout (buyer purchase-intent flow), but had no
// seller-facing management surface anywhere in the dashboard. Same "built
// but unreachable" gap this session already found and fixed once for the
// theme live-preview panel. ──

function statusColor(status: GiftCard['status']): 'green' | 'gray' | 'red' {
  if (status === 'active') return 'green';
  if (status === 'expired') return 'red';
  return 'gray';
}

// ── Storefront settings card ──────────────────────────────────────────────────
function GiftCardSettingsCard({ storeId, storeCurrency }: { storeId: string; storeCurrency: string }) {
  const [settings, setSettings] = useState<GiftCardSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [purchaseEnabled, setPurchaseEnabled] = useState(false);
  const [denominations, setDenominations] = useState<number[]>([10, 25, 50, 100]);
  const [neverExpires, setNeverExpires] = useState(true);
  const [expiryMonths, setExpiryMonths] = useState(12);

  useEffect(() => {
    if (!storeId) return;
    apiGetGiftCardSettings(storeId)
      .then(res => {
        const s = res.data;
        setSettings(s);
        setPurchaseEnabled(s.purchaseEnabled);
        setDenominations(s.denominations);
        setNeverExpires(s.neverExpires);
        setExpiryMonths(s.expiryMonths);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [storeId]);

  const isDirty = !!settings && (
    purchaseEnabled !== settings.purchaseEnabled ||
    JSON.stringify(denominations) !== JSON.stringify(settings.denominations) ||
    neverExpires !== settings.neverExpires ||
    expiryMonths !== settings.expiryMonths
  );

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await apiUpdateGiftCardSettings(storeId, { purchaseEnabled, denominations, neverExpires, expiryMonths });
      setSettings(res.data);
      setSaveMsg({ ok: true, text: 'Gift card settings saved.' });
    } catch (e) {
      setSaveMsg({ ok: false, text: e instanceof Error ? e.message : 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Card className="mb-5 h-[180px] animate-pulse" />;
  }

  return (
    <Card className="mb-5">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <p className="text-[14px] font-bold text-carbon">Storefront gift card sales</p>
          <p className="text-[12px] text-slate mt-0.5">Let customers buy a gift card directly from your store.</p>
        </div>
        <Toggle checked={purchaseEnabled} onChange={setPurchaseEnabled} ariaLabel="Allow gift card purchases on storefront" />
      </div>

      <Field label={`Denominations (${currencySymbol(storeCurrency)})`} hint="Preset amounts customers can choose from">
        <TagInput
          tags={denominations.map(String)}
          onChange={vals => setDenominations(vals.map(Number).filter(n => !isNaN(n) && n > 0))}
          placeholder="Add amount, press Enter"
        />
      </Field>

      <div className="flex items-center justify-between mb-[14px]">
        <span className="text-[13px] font-medium text-charcoal">Gift cards never expire</span>
        <Toggle checked={neverExpires} onChange={setNeverExpires} ariaLabel="Gift cards never expire" />
      </div>

      {!neverExpires && (
        <Field label="Expires after (months)">
          <Input type="number" min={1} value={expiryMonths} onChange={e => setExpiryMonths(Number(e.target.value))} />
        </Field>
      )}

      {saveMsg && (
        <p className={clsx('text-[12.5px] mb-3', saveMsg.ok ? 'text-success' : 'text-error')}>{saveMsg.text}</p>
      )}

      <Button variant="primary" onClick={handleSave} disabled={!isDirty || saving} loading={saving}>Save settings</Button>
    </Card>
  );
}

// ── Issue manual gift card ────────────────────────────────────────────────────
function IssueGiftCardModal({
  storeId, storeCurrency, onClose, onIssued,
}: { storeId: string; storeCurrency: string; onClose: () => void; onIssued: () => void }) {
  const [value, setValue] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleIssue = async () => {
    const amt = Number(value);
    if (!amt || amt <= 0) { setError('Enter a value greater than 0.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload: IssueManualGiftCardPayload = { value: amt };
      if (recipientEmail.trim()) payload.recipientEmail = recipientEmail.trim();
      if (recipientName.trim()) payload.recipientName = recipientName.trim();
      if (message.trim()) payload.message = message.trim();
      await apiIssueGiftCard(storeId, payload);
      onIssued();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to issue gift card.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Issue gift card"
      onClose={onClose}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleIssue} loading={saving}>Issue gift card</Button>
        </>
      )}
    >
      {error && (
        <p className="mb-3 text-[12.5px] text-error bg-error-bg border border-error-border rounded-md px-3 py-2">{error}</p>
      )}
      <p className="text-[12px] text-slate mb-3">
        Issue a gift card directly, with no purchase — useful for refunds, goodwill credit, or giveaways.
      </p>
      <Field label="Value" required>
        <Input type="number" min={1} value={value} onChange={e => setValue(e.target.value)} leftAddon={currencySymbol(storeCurrency)} />
      </Field>
      <Field label="Recipient email" hint="Optional">
        <Input type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} placeholder="customer@email.com" />
      </Field>
      <Field label="Recipient name" hint="Optional">
        <Input value={recipientName} onChange={e => setRecipientName(e.target.value)} />
      </Field>
      <Field label="Message" hint="Optional">
        <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="A short note for the recipient" />
      </Field>
    </Modal>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function StoreGiftCards() {
  const { storeId, store } = useStoreWorkspace();
  const storeCurrency = store?.baseCurrency ?? 'USD';

  const [cards, setCards] = useState<GiftCard[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [code, setCode] = useState('');
  const [debouncedCode, setDebouncedCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [issueOpen, setIssueOpen] = useState(false);

  // Debounce the free-text code search before it drives a fetch.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedCode(code), 350);
    return () => clearTimeout(t);
  }, [code]);

  // A new search term or status filter always restarts at page 1.
  useEffect(() => { setPage(1); }, [debouncedCode, status]);

  const load = () => {
    if (!storeId) return;
    setLoading(true);
    apiListGiftCards(storeId, { page, limit: 10, status: status || undefined, code: debouncedCode || undefined })
      .then(res => { setCards(res.data.items); setTotal(res.data.total); })
      .catch(() => { setCards([]); setTotal(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [storeId, page, status, debouncedCode]);

  const handleDisable = async (gc: GiftCard) => {
    try {
      await apiDisableGiftCard(storeId, gc._id);
      load();
    } catch {
      // The row simply stays unchanged — the seller can retry.
    }
  };

  const columns: TableColumn<GiftCard>[] = [
    {
      key: 'code', header: 'Code', render: gc => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-semibold text-carbon">{gc.code}</span>
          <CopyIconButton value={gc.code} title="Copy code" size={12} className="text-slate hover:text-carbon" />
        </div>
      ),
    },
    {
      key: 'balance', header: 'Balance', render: gc => (
        <span>
          {currencySymbol(gc.currency)}{fmt2(gc.balance)}{' '}
          <span className="text-slate">/ {currencySymbol(gc.currency)}{fmt2(gc.initialValue)}</span>
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: gc => <Badge color={statusColor(gc.status)}>{gc.status.charAt(0).toUpperCase() + gc.status.slice(1)}</Badge> },
    { key: 'issuedBy', header: 'Issued', render: gc => (gc.issuedBy === 'purchase' ? 'Purchased' : 'Manual') },
    { key: 'recipient', header: 'Recipient', render: gc => gc.recipientName || gc.recipientEmail || '—' },
    { key: 'expiresAt', header: 'Expires', render: gc => (gc.expiresAt ? new Date(gc.expiresAt).toLocaleDateString() : 'Never') },
    {
      key: 'actions', header: '', align: 'right', render: gc => (
        gc.status === 'active'
          ? <Button variant="outline" size="xs" icon={<Ban size={12} />} onClick={() => handleDisable(gc)}>Disable</Button>
          : null
      ),
    },
  ];

  return (
    <div>
      <StorePageHeader
        title="Gift Cards"
        subtitle="Issue store credit and manage gift card sales"
        actions={(
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setIssueOpen(true)}>Issue gift card</Button>
        )}
      />

      <div className="p-4 md:p-7">
        <GiftCardSettingsCard storeId={storeId} storeCurrency={storeCurrency} />

        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <SearchInput value={code} onChange={setCode} placeholder="Search by code…" className="flex-1" />
          <div className="sm:w-[180px]">
            <Select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
              <option value="expired">Expired</option>
            </Select>
          </div>
        </div>

        <div className="bg-white border border-bone rounded-xl overflow-hidden">
          <Table
            columns={columns}
            data={cards}
            keyExtractor={gc => gc._id}
            loading={loading}
            pagination={{ page, total, perPage: 10, onChange: setPage, label: 'gift cards' }}
            emptyState={{
              icon: <Gift size={28} className="text-slate/50" />,
              title: 'No gift cards yet',
              description: 'Issue a gift card manually, or enable storefront sales above so customers can buy one.',
              action: { label: 'Issue gift card', icon: <Plus size={14} />, onClick: () => setIssueOpen(true) },
            }}
          />
        </div>
      </div>

      {issueOpen && (
        <IssueGiftCardModal
          storeId={storeId}
          storeCurrency={storeCurrency}
          onClose={() => setIssueOpen(false)}
          onIssued={() => { setIssueOpen(false); load(); }}
        />
      )}
    </div>
  );
}
