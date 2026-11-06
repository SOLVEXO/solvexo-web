import { useState } from 'react';
import { errorMessage } from '@/api/errorMessage';
import { apiDeleteTemplate, apiSubmitTemplate, apiSyncTemplates, type WaTemplate } from '@/api/services/marketingMessaging';
import { useToast } from '@/contexts/ToastContext';
import { Badge, Button, Input, StatusBadge, Table } from '@/components/comman/ui';
import { Modal } from '@/components/comman/ui/Modal';
import type { TableColumn } from '@/components/comman/ui/Table';
import { ErrorLine } from '../wholesale/ErrorLine';
import { useApi } from '../wholesale/wholesaleUtils';

/** WhatsApp only sends marketing messages that use a template WhatsApp (Meta) has approved. */
export function TemplatesTab({ storeId }: { storeId: string }) {
  const toast = useToast();
  const list = useApi<WaTemplate[]>(`/api/messaging/${storeId}/templates`);
  const [creating, setCreating] = useState(false);
  const [syncing, setSyncing] = useState(false);

  async function sync() {
    setSyncing(true);
    try { const r = await apiSyncTemplates(storeId); toast.success(`${r.synced} template(s) refreshed from WhatsApp`); list.reload(); } catch (e) { toast.error(errorMessage(e)); } finally { setSyncing(false); }
  }
  async function remove(t: WaTemplate) {
    try { await apiDeleteTemplate(storeId, t._id); toast.success('Template deleted'); list.reload(); } catch (e) { toast.error(errorMessage(e)); }
  }
  const columns: TableColumn<WaTemplate>[] = [
    { key: 'n', header: 'Template', render: (t) => <div><div className="font-semibold text-carbon">{t.name} <span className="font-normal text-slate">({t.language})</span></div><div className="line-clamp-2 text-xs text-slate">{t.bodyText}</div></div> },
    { key: 'c', header: 'Type', render: (t) => <Badge color="gray" size="sm">{t.category.toLowerCase()}</Badge> },
    { key: 's', header: 'Status', render: (t) => <div><StatusBadge status={t.status.toLowerCase()} size="sm" />{t.rejectedReason && <div className="text-xs text-error">{t.rejectedReason}</div>}</div> },
    { key: 'a', header: 'Actions', align: 'right', render: (t) => <Button size="xs" variant="outline" onClick={() => void remove(t)}>Delete</Button> },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="m-0 flex-1 text-[13px] text-slate">Write a message once, WhatsApp reviews it, then you can send it to your opted-in contacts. Review usually takes minutes to a day. Press <strong>Refresh status</strong> to see the result.</p>
        <Button size="sm" variant="outline" loading={syncing} onClick={() => void sync()}>Refresh status</Button>
        <Button size="sm" onClick={() => setCreating(true)}>New template</Button>
      </div>
      {list.error ? <ErrorLine message={errorMessage(list.error)} onRetry={list.reload} /> : (
        <Table columns={columns} data={list.data ?? []} keyExtractor={(t) => t._id} loading={list.loading}
          emptyState={{ title: 'No templates yet', description: 'Create a marketing template, or connect WhatsApp and refresh to load the ones you already have.' }} />
      )}
      {creating && <NewTemplate storeId={storeId} onClose={() => setCreating(false)} onDone={() => { setCreating(false); list.reload(); }} />}
    </div>
  );
}

function NewTemplate({ storeId, onClose, onDone }: { storeId: string; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [name, setName] = useState(''); const [language, setLanguage] = useState('en_US'); const [body, setBody] = useState('Hi {{1}}, '); const [busy, setBusy] = useState(false);
  const count = new Set([...body.matchAll(/{{\s*(\d+)\s*}}/g)].map((m) => m[1])).size;
  const [examples, setExamples] = useState<string[]>([]);
  const ex = Array.from({ length: count }, (_, i) => examples[i] ?? '');
  async function submit() {
    setBusy(true);
    try { await apiSubmitTemplate(storeId, { name: name.trim(), language, bodyText: body.trim(), examples: ex }); toast.success('Sent to WhatsApp for review'); onDone(); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }
  return (
    <Modal title="New marketing template" onClose={onClose} width={560} footer={<><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={busy} onClick={() => void submit()}>Send for review</Button></>}>
      <div className="flex flex-col gap-3">
        <Input label="Name (lowercase letters, numbers, underscores)" value={name} onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))} placeholder="eid_sale_2026" />
        <Input label="Language code" value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="en_US, ur, en_GB" />
        <label className="flex flex-col gap-1 text-[13px] text-carbon">Message (use {'{{1}}'}, {'{{2}}'} for details that change, e.g. the name)<textarea rows={5} maxLength={1024} className="w-full rounded-lg border border-bone px-3 py-2 text-[13px]" value={body} onChange={(e) => setBody(e.target.value)} /></label>
        {ex.map((v, i) => <Input key={i} label={`Example for {{${i + 1}}}`} value={v} onChange={(e) => setExamples(ex.map((x, j) => (j === i ? e.target.value : x)))} placeholder={i === 0 ? 'Ali' : 'Friday'} />)}
        <p className="m-0 text-xs text-slate">Marketing messages must be useful and not misleading. WhatsApp can reject a template; the reason is shown in the list.</p>
      </div>
    </Modal>
  );
}
