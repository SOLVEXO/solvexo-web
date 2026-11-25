import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { Plus, Send, Trash2 } from 'lucide-react';
import { Badge, Button, CopyIconButton, Input, Modal, RadioButton, SearchInput, Select, Textarea } from '@/components/comman/ui';
import {
  apiListLeads, apiWaConnect, apiWaDisconnect, apiWaSaveQuickReplies, apiWaSaveTemplates, apiWaStart,
  MESSAGE_REASONS, MESSAGE_REASON_LABELS, type MessageReason, type SalesLead, type WaConnection, type WaQuickReply, type WaTemplate,
} from '@/api/services/salesOps';
import { StageBadge } from './parts';
import { errMsg, relDay, useStableToast } from './sales.utils';
import { firstName } from './whatsapp.utils';

export function ConnectionModal({ conn, onClose, onSaved }: { conn: WaConnection; onClose: () => void; onSaved: (c: WaConnection) => void }) {
  const toast = useStableToast();
  const [f, setF] = useState({ phoneNumberId: conn.phoneNumberId ?? '', accessToken: '', wabaId: conn.wabaId ?? '' });
  const [busy, setBusy] = useState<'save' | 'disconnect' | null>(null);
  const [error, setError] = useState('');
  const save = async () => {
    setBusy('save'); setError('');
    try {
      const r = await apiWaConnect({ phoneNumberId: f.phoneNumberId.trim(), ...(f.accessToken.trim() ? { accessToken: f.accessToken.trim() } : {}), wabaId: f.wabaId.trim() || null });
      toast.success(`Connected ${r.data.displayNumber ?? ''}.`); onSaved(r.data);
    } catch (e) { setError(errMsg(e, 'Could not connect.')); }
    setBusy(null);
  };
  return (
    <Modal title="Solvexo’s WhatsApp number" onClose={onClose} width={620}
      footer={<div className="flex justify-between gap-2 w-full">
        {conn.connected ? <Button variant="ghost" loading={busy === 'disconnect'} onClick={async () => { setBusy('disconnect'); try { onSaved((await apiWaDisconnect()).data); toast.success('Disconnected.'); } catch (e) { setError(errMsg(e, 'Could not disconnect.')); } setBusy(null); }}>Disconnect</Button> : <span />}
        <div className="flex gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={busy === 'save'} disabled={!f.phoneNumberId.trim() || (!conn.connected && !f.accessToken.trim())} onClick={save}>{conn.connected ? 'Save' : 'Connect'}</Button></div>
      </div>}>
      <div className="flex flex-col gap-3 text-[13px]">
        {conn.connected && (
          <p className="flex items-center gap-2"><Badge color="green" size="sm">Connected</Badge>{conn.verifiedName} · {conn.displayNumber}{conn.lastEventAt ? <span className="text-slate text-[12px]">· last message from Meta {relDay(conn.lastEventAt)}</span> : <span className="text-warning text-[12px]">· no messages from Meta yet</span>}</p>
        )}
        <ol className="list-decimal ml-5 text-[12.5px] text-slate flex flex-col gap-1">
          <li>In Meta Business Suite, add Solvexo’s number to the same WhatsApp app the store integrations use, and create a System User with a <strong>permanent token</strong> (whatsapp_business_messaging and whatsapp_business_management).</li>
          <li>Copy the number’s <strong>Phone number ID</strong> and the token below. Solvexo checks them with Meta and subscribes the app to the number’s messages.</li>
          <li>The app’s webhook should already point to this address (it is shared with store WhatsApp):</li>
        </ol>
        <div className="flex items-center gap-2 rounded-lg border border-bone bg-cream/60 px-3 py-2"><code className="flex-1 break-all text-[12px]">{conn.webhookUrl}</code><CopyIconButton value={conn.webhookUrl} title="Copy webhook URL" size={14} /></div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Phone number ID" inputMode="numeric" value={f.phoneNumberId} onChange={e => setF({ ...f, phoneNumberId: e.target.value.replace(/\D/g, '') })} />
          <Input label="WhatsApp Business Account ID (optional)" inputMode="numeric" placeholder="Found automatically if empty" value={f.wabaId} onChange={e => setF({ ...f, wabaId: e.target.value.replace(/\D/g, '') })} />
          <div className="sm:col-span-2"><Input label={conn.connected ? `Access token (saved: ${conn.tokenHint ?? '—'})` : 'Permanent access token'} type="password" autoComplete="off" placeholder={conn.connected ? 'Leave empty to keep it' : 'EAAG…'} value={f.accessToken} onChange={e => setF({ ...f, accessToken: e.target.value })} /></div>
        </div>
        <p className="text-[11.5px] text-slate">Replies are always sent by a person; the AI only drafts them. Turn drafts on or off in the AI agent tab. Approved templates (to restart a chat after 24 hours) are set under Templates.</p>
        {error && <p role="alert" className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}

/** The approved Meta templates reps can pick from. Solvexo checks each one with Meta when saved. */
export function TemplatesModal({ templates, onClose, onSaved }: { templates: WaTemplate[]; onClose: () => void; onSaved: (c: WaConnection) => void }) {
  const toast = useStableToast();
  const [rows, setRows] = useState(() => (templates.length ? templates : [{ label: '', name: '', lang: 'en', body: null, reason: 'follow_up' as MessageReason }]).map(t => ({ label: t.label, name: t.name, lang: t.lang, body: t.body, reason: (t.reason ?? 'follow_up') as MessageReason })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (i: number, patch: Partial<(typeof rows)[number]>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch, body: null } : r)));
  const save = async () => {
    setBusy(true); setError('');
    try {
      const list = rows.filter(r => r.name.trim()).map(r => ({ label: r.label.trim(), name: r.name.trim(), lang: r.lang.trim(), reason: r.reason }));
      const res = await apiWaSaveTemplates(list);
      toast.success(list.length ? 'Templates saved.' : 'Templates removed.'); onSaved(res.data);
    } catch (e) { setError(errMsg(e, 'Could not save the templates.')); }
    setBusy(false);
  };
  return (
    <Modal title="WhatsApp templates" onClose={onClose} width={780}
      footer={<div className="flex justify-end gap-2 w-full"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={busy} onClick={save}>Save</Button></div>}>
      <div className="flex flex-col gap-3 text-[13px]">
        <p className="text-[12.5px] text-slate">After 24 hours without a message from the person, WhatsApp only allows an approved template. Create them in WhatsApp Manager → Message templates, then list them here. Solvexo checks each one with Meta and shows reps its text. A template can use {'{{1}}'} for the person’s first name, and nothing else.</p>
        {rows.length > 0 && (
          <div aria-hidden className="grid grid-cols-[1fr_1fr_72px_140px_auto] gap-2 px-2.5 -mb-1.5 text-[12px] font-medium text-charcoal">
            <span>Shown to reps as</span><span>Template name in Meta</span><span>Language</span><span>Reason</span><span className="w-[13px]" />
          </div>
        )}
        {rows.map((r, i) => (
          <div key={i} className="rounded-lg border border-bone p-2.5">
            <div className="grid grid-cols-[1fr_1fr_72px_140px_auto] items-center gap-2">
              <Input aria-label={`Template ${i + 1} label`} placeholder="e.g. Follow-up (English)" value={r.label} onChange={e => set(i, { label: e.target.value })} />
              <Input aria-label={`Template ${i + 1} name`} placeholder="sales_follow_up" value={r.name} onChange={e => set(i, { name: e.target.value.trim() })} />
              <Input aria-label={`Template ${i + 1} language`} placeholder="en" value={r.lang} onChange={e => set(i, { lang: e.target.value.trim() })} />
              <Select aria-label={`Template ${i + 1} reason`} value={r.reason} onChange={e => setRows(rows.map((x, j) => (j === i ? { ...x, reason: e.target.value as MessageReason } : x)))}>
                {MESSAGE_REASONS.map(m => <option key={m} value={m}>{MESSAGE_REASON_LABELS[m]}</option>)}
              </Select>
              <button aria-label={`Remove template ${i + 1}`} onClick={() => setRows(rows.filter((_, j) => j !== i))} className="self-center bg-transparent border-0 text-slate hover:text-error cursor-pointer"><Trash2 size={13} /></button>
            </div>
            {r.body && <p dir="auto" className="mt-1.5 text-[12px] text-slate whitespace-pre-line">{r.body}</p>}
          </div>
        ))}
        {rows.length < 20 && <Button size="xs" variant="ghost" onClick={() => setRows([...rows, { label: '', name: '', lang: 'en', body: null, reason: 'follow_up' }])}><Plus size={12} /> Add a template</Button>}
        <p className="text-[11.5px] text-slate">Language is the code Meta shows for that version: en, en_US, en_GB or ur. The first template is the one used when there is only one choice.</p>
        {error && <p role="alert" className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}

/** Reason chips, then the templates for that reason, then the text the person will get ({{1}} = their first name). */
function TemplateChoice({ templates, name, value, onChange }: { templates: WaTemplate[]; name: string; value: string; onChange: (key: string) => void }) {
  const reasons = MESSAGE_REASONS.filter(r => templates.some(t => (t.reason ?? 'follow_up') === r));
  const [reason, setReason] = useState<MessageReason>(() => (templates.find(t => t.key === value)?.reason ?? reasons[0] ?? 'follow_up'));
  const shown = templates.filter(t => (t.reason ?? 'follow_up') === reason);
  const chosen = templates.find(t => t.key === value);
  const pickReason = (r: MessageReason) => { setReason(r); onChange(templates.find(t => (t.reason ?? 'follow_up') === r)?.key ?? ''); };
  return (
    <>
      {reasons.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-3" role="group" aria-label="Reason">
          {reasons.map(r => (
            <button key={r} type="button" aria-pressed={reason === r} onClick={() => pickReason(r)}
              className={clsx('px-2.5 py-1 rounded-full text-[12px] border cursor-pointer', reason === r ? 'bg-brand-orange text-white border-brand-orange' : 'bg-white text-charcoal border-bone hover:border-brand-orange/50')}>
              {MESSAGE_REASON_LABELS[r]}
            </button>
          ))}
        </div>
      )}
      <RadioButton name="wa-template" layout="col" value={value} onChange={onChange}
        options={shown.map(t => ({ value: t.key, label: `${t.label} · ${t.lang}` }))} />
      {chosen && (
        <div className="mt-3 rounded-lg bg-[#d9fdd3] px-3 py-2 text-[13px]">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate mb-1">They will get</p>
          <p dir="auto" className="whitespace-pre-line break-words text-charcoal">{chosen.body ? chosen.body.replace(/\{\{\s*1\s*\}\}/g, name) : `Template ${chosen.name} (its text is shown in WhatsApp Manager)`}</p>
        </div>
      )}
    </>
  );
}

const firstKey = (templates: WaTemplate[]) => {
  const reason = MESSAGE_REASONS.find(r => templates.some(t => (t.reason ?? 'follow_up') === r));
  return templates.find(t => (t.reason ?? 'follow_up') === reason)?.key ?? '';
};

/** Pick which approved template to send in this chat; each shows the text the person will receive. */
export function TemplatePicker({ templates, name, busy, onClose, onSend }: { templates: WaTemplate[]; name: string; busy: boolean; onClose: () => void; onSend: (key: string) => void }) {
  const [key, setKey] = useState(() => firstKey(templates));
  return (
    <Modal title="Send a template" onClose={onClose} width={560}
      footer={<div className="flex justify-end gap-2 w-full"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={busy} disabled={!key} onClick={() => onSend(key)}><Send size={14} /> Send</Button></div>}>
      {templates.length ? <TemplateChoice templates={templates} name={name} value={key} onChange={setKey} />
        : <p className="text-[13px] text-slate">No approved templates are available to you. Ask a manager.</p>}
    </Modal>
  );
}

/** Start a chat: with a lead from the pipeline, or a new number (a lead is created for it). WhatsApp needs an approved template to open it. */
export function NewChatModal({ templates, onClose, onStarted }: { templates: WaTemplate[]; onClose: () => void; onStarted: (conversationId: string) => void }) {
  const [who, setWho] = useState<'lead' | 'number'>('lead');
  const [q, setQ] = useState('');
  const [found, setFound] = useState<SalesLead[] | null>(null);
  const [lead, setLead] = useState<SalesLead | null>(null);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [key, setKey] = useState(() => firstKey(templates));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (who !== 'lead' || q.trim().length < 2) return;
    let live = true;
    const t = setTimeout(() => {
      apiListLeads({ q: q.trim(), limit: 8 }).then(r => { if (live) setFound(r.data.items); }).catch(() => { if (live) setFound([]); });
    }, 300);
    return () => { live = false; clearTimeout(t); };
  }, [q, who]);

  const ready = !!key && (who === 'lead' ? !!lead : phone.replace(/\D/g, '').length >= 7 && !!name.trim());
  const send = async () => {
    setBusy(true); setError('');
    try {
      const r = await apiWaStart(who === 'lead' && lead ? { leadId: lead._id, templateKey: key } : { phone: phone.trim(), name: name.trim(), templateKey: key });
      onStarted(r.data.conversationId);
    } catch (e) { setError(errMsg(e, 'Could not start the chat.')); setBusy(false); }
  };

  return (
    <Modal title="New WhatsApp chat" onClose={onClose} width={560}
      footer={<div className="flex justify-end gap-2 w-full"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={busy} disabled={!ready} onClick={send}><Send size={14} /> Send</Button></div>}>
      <div className="flex flex-col gap-3 text-[13px]">
        <RadioButton name="wa-new-chat" layout="row" value={who} onChange={v => { setWho(v as 'lead' | 'number'); setError(''); }}
          options={[{ value: 'lead', label: 'A lead' }, { value: 'number', label: 'A new number' }]} />
        {who === 'lead' ? (
          <div className="flex flex-col gap-2">
            <SearchInput aria-label="Find a lead" placeholder="Name, business, phone or email" value={q} onChange={v => { setQ(v); setLead(null); if (v.trim().length < 2) setFound(null); }} />
            {lead ? (
              <p className="flex items-center gap-2 rounded-lg border border-brand-orange/40 bg-brand-pale-orange/30 px-3 py-2">
                <span className="flex-1 min-w-0 truncate"><strong className="text-charcoal">{lead.name}</strong>{lead.phone ? <span className="text-slate"> · {lead.phone}</span> : null}</span>
                <Button size="xs" variant="ghost" onClick={() => setLead(null)}>Change</Button>
              </p>
            ) : found && (found.length ? (
              <ul className="flex flex-col divide-y divide-bone rounded-lg border border-bone" aria-label="Leads found">
                {found.map(l => (
                  <li key={l._id}>
                    <button type="button" onClick={() => setLead(l)} className="w-full text-left px-3 py-2 flex items-center gap-2 bg-white hover:bg-cream border-0 cursor-pointer">
                      <span className="flex-1 min-w-0"><span className="block truncate font-medium text-charcoal">{l.name}</span><span className="block truncate text-[12px] text-slate">{[l.businessName, l.phone ?? 'No phone'].filter(Boolean).join(' · ')}</span></span>
                      <StageBadge stage={l.stage} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p className="text-[12px] text-slate">No leads match “{q.trim()}”. Try a new number instead.</p>)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="WhatsApp number" inputMode="tel" placeholder="0300 1234567" value={phone} onChange={e => setPhone(e.target.value)} />
            <Input label="Name" placeholder="Who is it?" value={name} onChange={e => setName(e.target.value)} />
            <p className="sm:col-span-2 text-[11.5px] text-slate">A new lead is added for this number, unless one already has it.</p>
          </div>
        )}
        <div className="pt-3 border-t border-bone">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate mb-2">Template</p>
          {templates.length ? <TemplateChoice templates={templates} name={firstName(who === 'lead' ? lead?.name : name)} value={key} onChange={setKey} />
            : <p className="text-[12.5px] text-slate">No approved templates are available to you. Ask a manager.</p>}
        </div>
        {error && <p role="alert" className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}

/** Managers: the short saved answers reps insert into a reply. */
export function QuickRepliesModal({ replies, onClose, onSaved }: { replies: WaQuickReply[]; onClose: () => void; onSaved: (r: WaQuickReply[]) => void }) {
  const toast = useStableToast();
  const [rows, setRows] = useState<{ id?: string; title: string; text: string }[]>(() => (replies.length ? replies : [{ title: '', text: '' }]));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (i: number, patch: Partial<(typeof rows)[number]>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const save = async () => {
    setBusy(true); setError('');
    try {
      const list = rows.filter(r => r.title.trim() || r.text.trim()).map(r => ({ ...(r.id ? { id: r.id } : {}), title: r.title.trim(), text: r.text.trim() }));
      const res = await apiWaSaveQuickReplies(list);
      toast.success('Quick replies saved.'); onSaved(res.data);
    } catch (e) { setError(errMsg(e, 'Could not save the quick replies.')); }
    setBusy(false);
  };
  return (
    <Modal title="Quick replies" onClose={onClose} width={620}
      footer={<div className="flex justify-end gap-2 w-full"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={busy} onClick={save}>Save</Button></div>}>
      <div className="flex flex-col gap-3 text-[13px]">
        <p className="text-[12.5px] text-slate">Short answers your team sends often. Reps pick one under the reply box; it is added to what they are writing, and they can edit it before sending.</p>
        {rows.map((r, i) => (
          <div key={r.id ?? `new-${i}`} className="rounded-lg border border-bone p-2.5 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="flex-1"><Input aria-label={`Quick reply ${i + 1} title`} placeholder="e.g. Prices" maxLength={60} value={r.title} onChange={e => set(i, { title: e.target.value })} /></div>
              <button aria-label={`Remove quick reply ${i + 1}`} onClick={() => setRows(rows.filter((_, j) => j !== i))} className="bg-transparent border-0 text-slate hover:text-error cursor-pointer"><Trash2 size={13} /></button>
            </div>
            <Textarea aria-label={`Quick reply ${i + 1} text`} rows={2} dir="auto" placeholder="The message" maxLength={1000} value={r.text} onChange={e => set(i, { text: e.target.value })} />
          </div>
        ))}
        {rows.length < 50 && <Button size="xs" variant="ghost" onClick={() => setRows([...rows, { title: '', text: '' }])}><Plus size={12} /> Add a quick reply</Button>}
        {error && <p role="alert" className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}
