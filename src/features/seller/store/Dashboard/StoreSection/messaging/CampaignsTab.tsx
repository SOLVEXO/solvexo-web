import { useEffect, useState } from 'react';
import { errorMessage } from '@/api/errorMessage';
import {
  apiCampaignMessages, apiCancelCampaign, apiCreateCampaign, apiDeleteCampaign, apiLaunchCampaign,
  type Campaign, type CampaignStats, type Channel, type MessageRow, type WaTemplate,
} from '@/api/services/marketingMessaging';
import { apiListSegments, type CustomerSegment } from '@/api/services/customerSegments';
import { useToast } from '@/contexts/ToastContext';
import { Badge, Button, Input, Select, StatusBadge, Table } from '@/components/comman/ui';
import { Modal } from '@/components/comman/ui/Modal';
import type { TableColumn } from '@/components/comman/ui/Table';
import { ErrorLine } from '../wholesale/ErrorLine';
import { PAGE_SIZE, shortDate, useApi, usePaged } from '../wholesale/wholesaleUtils';

/** GSM-7 vs unicode parts, same rule as the server (160/153 and 70/67). */
function smsParts(text: string): { parts: number; unicode: boolean } {
  const unicode = /[^\x20-\x7e\n\r]/.test(text);
  const len = [...text].length;
  return unicode ? { parts: len === 0 ? 0 : len <= 70 ? 1 : Math.ceil(len / 67), unicode } : { parts: len === 0 ? 0 : len <= 160 ? 1 : Math.ceil(len / 153), unicode };
}

export function CampaignsTab({ storeId, channel }: { storeId: string; channel: Channel }) {
  const toast = useToast();
  const list = usePaged<Campaign>(`/api/messaging/${storeId}/campaigns`, {});
  const [creating, setCreating] = useState(false);
  const [statsFor, setStatsFor] = useState<Campaign | null>(null);
  const rows = list.rows.filter((c) => c.channel === channel);

  async function act(c: Campaign, kind: 'launch' | 'cancel' | 'delete') {
    try {
      if (kind === 'launch') await apiLaunchCampaign(storeId, c._id); else if (kind === 'cancel') await apiCancelCampaign(storeId, c._id); else await apiDeleteCampaign(storeId, c._id);
      toast.success(kind === 'launch' ? 'Campaign started' : kind === 'cancel' ? 'Campaign canceled' : 'Draft deleted');
      list.reload();
    } catch (e) { toast.error(errorMessage(e)); }
  }
  const columns: TableColumn<Campaign>[] = [
    { key: 'n', header: 'Campaign', render: (c) => <button type="button" className="cursor-pointer border-0 bg-transparent p-0 text-left font-semibold text-carbon underline-offset-2 hover:underline" onClick={() => setStatsFor(c)}>{c.name}</button> },
    { key: 's', header: 'Status', render: (c) => <StatusBadge status={c.status} size="sm" /> },
    { key: 'd', header: 'Started', render: (c) => shortDate(c.startedAt) },
    { key: 'a', header: 'Actions', align: 'right', render: (c) => (
      <div className="flex justify-end gap-2">
        {c.status === 'draft' && <><Button size="xs" onClick={() => void act(c, 'launch')}>Send now</Button><Button size="xs" variant="outline" onClick={() => void act(c, 'delete')}>Delete</Button></>}
        {c.status === 'sending' && <Button size="xs" variant="outline" onClick={() => void act(c, 'cancel')}>Cancel</Button>}
        <Button size="xs" variant="outline" onClick={() => setStatsFor(c)}>Results</Button>
      </div>
    ) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <p className="m-0 flex-1 text-[13px] text-slate">Messages go only to people who opted in for this channel. A large campaign is sent over several days to stay inside the daily limit.</p>
        <Button size="sm" onClick={() => setCreating(true)}>New campaign</Button>
      </div>
      {list.error ? <ErrorLine message={errorMessage(list.error)} onRetry={list.reload} /> : (
        <Table columns={columns} data={rows} keyExtractor={(c) => c._id} loading={list.loading}
          pagination={{ page: list.page, total: list.total, perPage: PAGE_SIZE, onChange: list.setPage, label: 'campaigns' }}
          emptyState={{ title: 'No campaigns yet', description: 'Create a campaign, check it, then send it.' }} />
      )}
      {creating && <NewCampaign storeId={storeId} channel={channel} onClose={() => setCreating(false)} onDone={() => { setCreating(false); list.reload(); }} />}
      {statsFor && <StatsModal storeId={storeId} campaign={statsFor} onClose={() => setStatsFor(null)} />}
    </div>
  );
}

function NewCampaign({ storeId, channel, onClose, onDone }: { storeId: string; channel: Channel; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const templates = useApi<WaTemplate[]>(`/api/messaging/${storeId}/templates`);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [f, setF] = useState({ name: '', templateId: '', segmentId: '', smsText: 'Hi {customer_name}, ', dailyLimit: '' });
  const [params, setParams] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => { let off = false; apiListSegments(storeId).then((r) => { if (!off) setSegments(r.data?.segments ?? []); }).catch(() => undefined); return () => { off = true; }; }, [storeId]);
  const approved = (templates.data ?? []).filter((t) => t.status === 'APPROVED');
  const tpl = approved.find((t) => t._id === f.templateId);
  const ps = tpl ? Array.from({ length: tpl.paramCount }, (_, i) => params[i] ?? (i === 0 ? '{customer_name}' : '')) : [];
  const parts = smsParts(`${f.smsText}\nReply STOP to opt out`);

  async function save(andSend: boolean) {
    setBusy(true);
    try {
      const c = await apiCreateCampaign(storeId, {
        channel, name: f.name.trim(), segmentId: f.segmentId || null, ...(f.dailyLimit ? { dailyLimit: Number(f.dailyLimit) } : {}),
        ...(channel === 'sms' ? { smsText: f.smsText } : { templateId: f.templateId, params: ps }),
      });
      if (andSend) await apiLaunchCampaign(storeId, c._id);
      toast.success(andSend ? 'Campaign started' : 'Saved as a draft');
      onDone();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }
  return (
    <Modal title={channel === 'whatsapp' ? 'New WhatsApp campaign' : 'New SMS campaign'} onClose={onClose} width={560}
      footer={<><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button variant="outline" size="sm" loading={busy} onClick={() => void save(false)}>Save draft</Button><Button size="sm" loading={busy} onClick={() => void save(true)}>Save and send</Button></>}>
      <div className="flex flex-col gap-3">
        <Input label="Campaign name (only you see it)" maxLength={120} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        {channel === 'whatsapp' ? (
          <>
            <Select label="Approved template" value={f.templateId} onChange={(e) => setF({ ...f, templateId: e.target.value })}>
              <option value="">{templates.loading ? 'Loading…' : approved.length ? 'Choose a template' : 'No approved template yet'}</option>
              {approved.map((t) => <option key={t._id} value={t._id}>{t.name} ({t.language})</option>)}
            </Select>
            {tpl && <p className="m-0 rounded-lg bg-surface p-3 text-[13px] text-carbon">{tpl.bodyText}</p>}
            {ps.map((v, i) => <Input key={i} label={`Value for {{${i + 1}}} (use {customer_name} or {store_name})`} value={v} onChange={(e) => setParams(ps.map((x, j) => (j === i ? e.target.value : x)))} />)}
          </>
        ) : (
          <label className="flex flex-col gap-1 text-[13px] text-carbon">Message (use {'{customer_name}'} and {'{store_name}'})
            <textarea rows={4} maxLength={500} className="w-full rounded-lg border border-bone px-3 py-2 text-[13px]" value={f.smsText} onChange={(e) => setF({ ...f, smsText: e.target.value })} />
            <span className="text-xs text-slate">“Reply STOP to opt out” is added to every message. About {parts.parts} SMS part(s) per message{parts.unicode ? ' (unicode: 70 characters per part)' : ''}.</span>
          </label>
        )}
        <Select label="Send to" value={f.segmentId} onChange={(e) => setF({ ...f, segmentId: e.target.value })}>
          <option value="">Everyone who opted in</option>
          {segments.map((s) => <option key={s.id} value={s.id}>Segment: {s.name}</option>)}
        </Select>
        <Input label="Messages per day for this campaign (optional, lower than the account limit)" type="number" min={1} value={f.dailyLimit} onChange={(e) => setF({ ...f, dailyLimit: e.target.value })} />
      </div>
    </Modal>
  );
}

function StatsModal({ storeId, campaign, onClose }: { storeId: string; campaign: Campaign; onClose: () => void }) {
  const stats = useApi<CampaignStats>(`/api/messaging/${storeId}/campaigns/${campaign._id}/stats`);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [log, setLog] = useState<{ key: string; data?: { items: MessageRow[]; total: number }; error?: string } | null>(null);
  const key = `${campaign._id}|${status}|${page}`;
  useEffect(() => {
    let off = false;
    apiCampaignMessages(storeId, campaign._id, { page, ...(status ? { status } : {}) }).then((d) => { if (!off) setLog({ key, data: d }); }).catch((e) => { if (!off) setLog({ key, error: errorMessage(e) }); });
    return () => { off = true; };
  }, [storeId, campaign._id, page, status, key]);
  const cur = log?.key === key ? log : null;
  const s = stats.data;
  const columns: TableColumn<MessageRow>[] = [
    { key: 'c', header: 'Contact', render: (m) => <div><div>+{m.contactKey}</div>{m.customerName && <div className="text-xs text-slate">{m.customerName}</div>}</div> },
    { key: 's', header: 'Status', render: (m) => <div><StatusBadge status={m.status} size="sm" />{m.error && <div className="text-xs text-error">{m.error}</div>}</div> },
    { key: 't', header: 'When', render: (m) => shortDate(m.readAt ?? m.deliveredAt ?? m.sentAt) },
  ];
  return (
    <Modal title={campaign.name} onClose={onClose} width={720}>
      <div className="flex flex-col gap-4">
        {stats.error ? <ErrorLine message={errorMessage(stats.error)} onRetry={stats.reload} /> : !s ? <p className="m-0 text-[13px] text-slate">Loading…</p> : (
          <>
            <dl className="m-0 grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-6">
              {([['Waiting', s.queued], ['Sent', s.sent], ['Delivered', s.delivered], ['Read', s.read], ['Failed', s.failed], ['Skipped', s.skipped]] as [string, number][]).map(([k, v]) => <div key={k}><dt className="text-xs text-slate">{k}</dt><dd className="m-0 text-[16px] font-semibold text-carbon">{v.toLocaleString()}</dd></div>)}
            </dl>
            {s.queued > 0 && campaign.status === 'sending' && <Badge color="yellow" size="sm">{s.queued} message(s) will go out as the daily limit allows</Badge>}
            <p className="m-0 text-xs text-slate">{s.billing.note}</p>
            {s.billing.estimatedParts != null && <p className="m-0 text-xs text-slate">About {s.billing.estimatedParts} SMS part(s) sent so far ({s.billing.partsPerMessage} per message, {s.billing.encoding}).</p>}
            {s.skipped > 0 && <p className="m-0 text-xs text-slate">Skipped = people who are not opted in, opted out meanwhile, or whose campaign was canceled.</p>}
          </>
        )}
        <div className="w-full sm:w-52"><Select label="Show" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">All messages</option><option value="failed">Failed</option><option value="delivered">Delivered</option><option value="read">Read</option><option value="queued">Waiting</option><option value="skipped_no_consent">Skipped: no consent</option><option value="skipped_opted_out">Skipped: opted out</option></Select></div>
        {cur?.error ? <ErrorLine message={cur.error} onRetry={() => setPage((p) => p)} /> : (
          <Table columns={columns} data={cur?.data?.items ?? []} keyExtractor={(m) => m._id} loading={!cur}
            pagination={{ page, total: cur?.data?.total ?? 0, perPage: PAGE_SIZE, onChange: setPage, label: 'messages' }} emptyState={{ title: 'Nothing here', description: 'No messages with this status.' }} />
        )}
      </div>
    </Modal>
  );
}
