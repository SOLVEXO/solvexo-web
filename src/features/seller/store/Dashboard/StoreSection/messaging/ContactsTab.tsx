import { useState } from 'react';
import { errorMessage } from '@/api/errorMessage';
import { apiImportConsents, apiOptInContact, apiOptOutContact, type Channel, type ConsentList, type ConsentRow } from '@/api/services/marketingMessaging';
import { useToast } from '@/contexts/ToastContext';
import { Badge, Button, Card, Input, Select, Table } from '@/components/comman/ui';
import { Modal } from '@/components/comman/ui/Modal';
import type { TableColumn } from '@/components/comman/ui/Table';
import { ErrorLine } from '../wholesale/ErrorLine';
import { PAGE_SIZE, shortDate, usePaged } from '../wholesale/wholesaleUtils';

const SOURCE: Record<string, string> = { manual: 'Added by you', storefront: 'Customer, on the store', checkout: 'Checkout', import: 'Imported list', inbound_stop: 'Replied STOP', seller: 'You' };

/** People who agreed (or withdrew) per channel. Nobody is messaged without an explicit opt-in here. */
export function ContactsTab({ storeId, channel }: { storeId: string; channel: Channel }) {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const list = usePaged<ConsentRow>(`/api/messaging/${storeId}/consents`, { channel, status, search });
  const totals = (list.data as unknown as ConsentList | null) ?? null;

  async function optOut(row: ConsentRow) {
    try { await apiOptOutContact(storeId, { channel, phone: row.contactKey }); toast.success('Opted out'); list.reload(); } catch (e) { toast.error(errorMessage(e)); }
  }
  const columns: TableColumn<ConsentRow>[] = [
    { key: 'c', header: 'Contact', render: (r) => <div><div className="font-semibold text-carbon">+{r.contactKey}</div>{r.name && <div className="text-xs text-slate">{r.name}</div>}</div> },
    { key: 's', header: 'Status', render: (r) => (r.status === 'opted_in' ? <Badge color="green" size="sm">Opted in</Badge> : <Badge color="red" size="sm">Opted out</Badge>) },
    { key: 'src', header: 'How', render: (r) => SOURCE[(r.status === 'opted_out' ? r.optOutSource : r.optInSource) ?? ''] ?? '—' },
    { key: 'd', header: 'Since', render: (r) => shortDate(r.status === 'opted_out' ? r.optedOutAt : r.optedInAt) },
    { key: 'a', header: 'Actions', align: 'right', render: (r) => (r.status === 'opted_in' ? <Button size="xs" variant="outline" onClick={() => void optOut(r)}>Opt out</Button> : null) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-[13px] text-slate">Only people listed here as <strong>opted in</strong> for {channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} can receive your marketing messages. Someone who replies STOP is opted out at once and stays out until they opt in again themselves.</p>
      {totals && <p className="m-0 text-[13px] text-carbon">{totals.optedIn.toLocaleString()} opted in · {totals.optedOut.toLocaleString()} opted out</p>}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-64"><Input label="Search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Phone or name" /></div>
        <div className="w-full sm:w-44"><Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All</option><option value="opted_in">Opted in</option><option value="opted_out">Opted out</option></Select></div>
        <div className="flex gap-2 sm:ml-auto"><Button size="sm" variant="outline" onClick={() => setImporting(true)}>Import list</Button><Button size="sm" onClick={() => setAdding(true)}>Add contact</Button></div>
      </div>
      {list.error ? <ErrorLine message={errorMessage(list.error)} onRetry={list.reload} /> : (
        <Table columns={columns} data={list.rows} keyExtractor={(r) => r._id} loading={list.loading}
          pagination={{ page: list.page, total: list.total, perPage: PAGE_SIZE, onChange: list.setPage, label: 'contacts' }}
          emptyState={{ title: 'No contacts yet', description: 'Add people who agreed to hear from you, or let customers opt in from their account page on your store.' }} />
      )}
      {adding && <AddModal storeId={storeId} channel={channel} onClose={() => setAdding(false)} onDone={() => { setAdding(false); list.reload(); }} />}
      {importing && <ImportModal storeId={storeId} channel={channel} onClose={() => setImporting(false)} onDone={() => { setImporting(false); list.reload(); }} />}
    </div>
  );
}

function AddModal({ storeId, channel, onClose, onDone }: { storeId: string; channel: Channel; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [phone, setPhone] = useState(''); const [name, setName] = useState(''); const [agreed, setAgreed] = useState(false); const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try { await apiOptInContact(storeId, { channel, phone, name: name.trim() || undefined }); toast.success('Contact added'); onDone(); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }
  return (
    <Modal title="Add a contact" onClose={onClose} width={440} footer={<><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={busy} disabled={!agreed || !phone.trim()} onClick={() => void save()}>Add</Button></>}>
      <div className="flex flex-col gap-3">
        <Input label="Phone number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0300 1234567 or +92 300 1234567" />
        <Input label="Name (optional)" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
        <label className="flex items-start gap-2 text-[13px] text-carbon"><input type="checkbox" className="mt-0.5" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /> This person agreed to receive marketing messages from my store on this channel.</label>
      </div>
    </Modal>
  );
}

function ImportModal({ storeId, channel, onClose, onDone }: { storeId: string; channel: Channel; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [text, setText] = useState(''); const [agreed, setAgreed] = useState(false); const [busy, setBusy] = useState(false);
  async function run() {
    const rows = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => { const [phone, ...rest] = l.split(/[,;\t]/); return { phone: phone.trim(), name: rest.join(' ').trim() || undefined }; });
    if (rows.length === 0) { toast.error('Paste at least one line'); return; }
    setBusy(true);
    try { const r = await apiImportConsents(storeId, { channel, rows, attested: agreed }); toast.success(`${r.added} added, ${r.invalid} invalid, ${r.keptOptedOut} kept opted out`); onDone(); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }
  return (
    <Modal title="Import a list" onClose={onClose} width={520} footer={<><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={busy} disabled={!agreed || !text.trim()} onClick={() => void run()}>Import</Button></>}>
      <div className="flex flex-col gap-3">
        <Card padding="md"><p className="m-0 text-[13px] text-slate">One person per line: phone, then an optional name (comma separated). People who already replied STOP stay opted out.</p></Card>
        <label className="flex flex-col gap-1 text-[13px] text-carbon">Contacts<textarea rows={8} className="w-full rounded-lg border border-bone px-3 py-2 font-mono text-[13px]" value={text} onChange={(e) => setText(e.target.value)} placeholder={'0300 1234567, Ali\n+92 301 7654321, Sara'} /></label>
        <label className="flex items-start gap-2 text-[13px] text-carbon"><input type="checkbox" className="mt-0.5" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /> I confirm that every person on this list agreed to receive marketing messages from my store on this channel. I can show when and how if asked.</label>
      </div>
    </Modal>
  );
}
