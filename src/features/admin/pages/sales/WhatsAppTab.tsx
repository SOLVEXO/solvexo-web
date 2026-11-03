import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { Check, CheckCheck, Clock, MessageCircle, RefreshCw, Send, Settings2, Sparkles, TriangleAlert, X } from 'lucide-react';
import { Badge, Button, CopyIconButton, EmptyState, Input, Modal, Textarea } from '@/components/comman/ui';
import {
  apiWaConnect, apiWaConnection, apiWaConversation, apiWaConversations, apiWaDisconnect, apiWaDiscardDraft, apiWaRedraft, apiWaSend, apiWaSendTemplate,
  type WaConnection, type WaConversation, type WaConversationRow, type WaMessage,
} from '@/api/services/salesOps';
import { StageBadge } from './parts';
import { errMsg, relDay, useStableToast } from './sales.utils';

const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

function StatusTick({ m }: { m: WaMessage }) {
  if (m.direction === 'in') return null;
  if (m.status === 'failed') return <span className="text-error" title={m.error ?? 'Not delivered'}><TriangleAlert size={12} /></span>;
  if (m.status === 'read') return <CheckCheck size={13} className="text-info" aria-label="Read" />;
  if (m.status === 'delivered') return <CheckCheck size={13} className="text-slate" aria-label="Delivered" />;
  return <Check size={13} className="text-slate" aria-label="Sent" />;
}

/** Super Admin → Sales Ops → WhatsApp: Solvexo's own number. The AI drafts, a person sends. */
export function WhatsAppTab({ isManager }: { isManager: boolean }) {
  const toast = useStableToast();
  const [params, setParams] = useSearchParams();
  const [conn, setConn] = useState<WaConnection | null>(null);
  const [rows, setRows] = useState<WaConversationRow[] | null>(null);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const selected = params.get('c');

  const loadList = useCallback(() => apiWaConversations({ unread: onlyUnread }).then(r => setRows(r.data)).catch(e => { setRows([]); toast.error(errMsg(e, 'Could not load WhatsApp chats.')); }), [onlyUnread, toast]);
  useEffect(() => { void loadList(); const t = setInterval(() => void loadList(), 20_000); return () => clearInterval(t); }, [loadList]);
  useEffect(() => { if (isManager) apiWaConnection().then(r => setConn(r.data)).catch(() => undefined); }, [isManager]);

  // Opened from a notification or a lead page: ?lead=<leadId> picks that lead's chat.
  const leadParam = params.get('lead');
  useEffect(() => {
    if (!leadParam) return;
    apiWaConversations({ leadId: leadParam }).then(r => {
      const next = new URLSearchParams(params); next.delete('lead');
      if (r.data[0]) next.set('c', r.data[0]._id);
      setParams(next, { replace: true });
    }).catch(() => undefined);
  }, [leadParam, params, setParams]);

  const select = (id: string | null) => { const next = new URLSearchParams(params); if (id) next.set('c', id); else next.delete('c'); setParams(next, { replace: true }); };

  return (
    <div className="flex flex-col gap-3">
      {isManager && conn && !conn.connected && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning-bg/50 p-3 text-[12.5px]">
          <p><strong>Solvexo’s WhatsApp number isn’t connected yet.</strong> Connect it to receive messages here and reply with AI drafts.</p>
          <Button size="sm" onClick={() => setSettingsOpen(true)}>Connect WhatsApp</Button>
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-[12.5px] text-slate cursor-pointer"><input type="checkbox" className="accent-brand-orange" checked={onlyUnread} onChange={e => setOnlyUnread(e.target.checked)} /> Unread only</label>
        <div className="flex items-center gap-2">
          {conn?.connected && <span className="text-[12px] text-slate">{conn.verifiedName ?? 'Solvexo'} · {conn.displayNumber}</span>}
          {isManager && <Button size="sm" variant="ghost" onClick={() => setSettingsOpen(true)}><Settings2 size={14} /> Settings</Button>}
        </div>
      </div>

      <div className="grid md:grid-cols-[320px_1fr] rounded-xl border border-bone bg-white overflow-hidden min-h-[520px]">
        <aside className={clsx('border-r border-bone flex flex-col', selected && 'hidden md:flex')}>
          {!rows ? <div className="m-3 h-24 rounded-lg bg-cream animate-pulse" /> : rows.length === 0 ? (
            <div className="p-6"><EmptyState icon={<MessageCircle size={26} />} title="No chats yet" description="When someone messages Solvexo’s WhatsApp number, the chat appears here with a reply drafted by the AI assistant." /></div>
          ) : (
            <ul className="overflow-y-auto divide-y divide-bone" aria-label="WhatsApp chats">
              {rows.map(c => (
                <li key={c._id}>
                  <button onClick={() => select(c._id)} aria-current={selected === c._id}
                    className={clsx('w-full text-left px-3 py-2.5 flex flex-col gap-0.5 border-0 cursor-pointer', selected === c._id ? 'bg-brand-pale-orange/50' : 'bg-white hover:bg-cream')}>
                    <span className="flex items-center gap-2">
                      <span className={clsx('flex-1 min-w-0 truncate text-[13px]', c.unread ? 'font-bold text-carbon' : 'font-medium text-charcoal')}>{c.name}</span>
                      <span className="text-[11px] text-slate shrink-0">{c.lastMessageAt ? relDay(c.lastMessageAt) : ''}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span dir="auto" className="flex-1 min-w-0 truncate text-[12px] text-slate">{c.lastMessageText ?? ''}</span>
                      {c.hasDraft && <Sparkles size={12} className="text-brand-orange shrink-0" aria-label="AI draft ready" />}
                      {c.unread > 0 && <span className="min-w-5 h-5 px-1.5 rounded-full bg-success text-white text-[11px] font-bold flex items-center justify-center">{c.unread}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
        <section className={clsx('flex flex-col min-w-0', !selected && 'hidden md:flex')}>
          {selected ? <Thread key={selected} id={selected} onBack={() => select(null)} onChanged={() => void loadList()} /> : (
            <div className="flex-1 flex items-center justify-center text-[13px] text-slate p-6 text-center">Choose a chat. The AI assistant drafts a reply to each new message; you read it, edit it if needed, and send.</div>
          )}
        </section>
      </div>

      {settingsOpen && conn && <ConnectionModal conn={conn} onClose={() => setSettingsOpen(false)} onSaved={c => { setConn(c); setSettingsOpen(false); }} />}
    </div>
  );
}

function Thread({ id, onBack, onChanged }: { id: string; onBack: () => void; onChanged: () => void }) {
  const toast = useStableToast();
  const [c, setC] = useState<WaConversation | null>(null);
  const [text, setText] = useState('');
  const [fromDraft, setFromDraft] = useState(false);
  const [busy, setBusy] = useState<'send' | 'template' | 'redraft' | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // The parent re-creates onChanged on every render; keep the latest in a ref so loading doesn't re-run because of it.
  const changedRef = useRef(onChanged);
  useEffect(() => { changedRef.current = onChanged; });
  const load = useCallback(() => apiWaConversation(id).then(r => { setC(r.data); changedRef.current(); }).catch(e => toast.error(errMsg(e, 'Could not open the chat.'))), [id, toast]);
  useEffect(() => { void load(); const t = setInterval(() => void apiWaConversation(id).then(r => setC(r.data)).catch(() => undefined), 15_000); return () => clearInterval(t); }, [id, load]);
  useEffect(() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; }, [c?.messages.length]);

  if (!c) return <div className="m-4 h-40 rounded-lg bg-cream animate-pulse" />;
  const run = async (kind: 'send' | 'template' | 'redraft', fn: () => Promise<{ data: WaConversation }>, ok: string) => {
    setBusy(kind);
    try { setC((await fn()).data); changedRef.current(); if (ok) toast.success(ok); if (kind === 'send') { setText(''); setFromDraft(false); } }
    catch (e) { toast.error(errMsg(e, 'Could not send.')); }
    setBusy(null);
  };

  return (
    <>
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-bone">
        <button onClick={onBack} className="md:hidden bg-transparent border-0 text-slate cursor-pointer" aria-label="Back to chats"><X size={18} /></button>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-charcoal truncate">{c.lead?.name ?? c.profileName ?? `+${c.waId}`}</p>
          <p className="text-[11.5px] text-slate">+{c.waId}{c.lead?.businessName ? ` · ${c.lead.businessName}` : ''}{c.lead?.city ? ` · ${c.lead.city}` : ''}</p>
        </div>
        {c.lead && <><StageBadge stage={c.lead.stage} /><Link to={`/admin/sales/leads/${c.lead._id}`} className="text-[12px] font-medium text-brand-orange hover:underline">Open lead</Link></>}
      </header>

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 bg-[#efeae2]/60" aria-live="polite">
        {c.messages.map(m => (
          <div key={m._id} className={clsx('max-w-[78%] rounded-lg px-3 py-1.5 text-[13px] shadow-sm', m.direction === 'in' ? 'self-start bg-white' : 'self-end bg-[#d9fdd3]')}>
            <p dir="auto" className="whitespace-pre-line break-words text-charcoal">{m.text}</p>
            <p className="flex items-center justify-end gap-1 text-[10.5px] text-slate mt-0.5">
              {m.fromAiDraft && <span title="Sent from the AI draft"><Sparkles size={10} className="text-brand-orange" /></span>}
              {time(m.at)} <StatusTick m={m} />
            </p>
            {m.status === 'failed' && m.error && <p className="text-[11px] text-error">{m.error}</p>}
          </div>
        ))}
      </div>

      {c.aiDraft && c.windowOpen && (
        <div className="mx-3 mt-2 rounded-lg border border-brand-orange/40 bg-brand-pale-orange/30 p-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep-orange flex items-center gap-1"><Sparkles size={11} /> AI draft</p>
          <p dir="auto" className="text-[13px] text-charcoal whitespace-pre-line mt-1">{c.aiDraft.text}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Button size="xs" onClick={() => { setText(c.aiDraft!.text); setFromDraft(true); }}>Use draft</Button>
            <Button size="xs" variant="ghost" loading={busy === 'redraft'} onClick={() => void run('redraft', () => apiWaRedraft(c._id), '')}><RefreshCw size={12} /> Rewrite</Button>
            <Button size="xs" variant="ghost" onClick={() => void run('redraft', () => apiWaDiscardDraft(c._id), '')}>Discard</Button>
          </div>
        </div>
      )}

      {c.windowOpen ? (
        <form className="flex items-end gap-2 p-3 border-t border-bone mt-2" onSubmit={e => { e.preventDefault(); if (text.trim()) void run('send', () => apiWaSend(c._id, text.trim(), fromDraft), ''); }}>
          <Textarea aria-label="Reply" rows={2} dir="auto" placeholder="Write a reply…" value={text} maxLength={4000}
            onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (text.trim()) void run('send', () => apiWaSend(c._id, text.trim(), fromDraft), ''); } }} />
          <Button type="submit" aria-label="Send reply" loading={busy === 'send'} disabled={!text.trim()}><Send size={15} /></Button>
        </form>
      ) : (
        <div className="p-3 border-t border-bone mt-2 text-[12.5px] text-charcoal flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5"><Clock size={14} className="text-slate" /> More than 24 hours since they last wrote. WhatsApp only allows your approved template now.</p>
          {c.template ? <Button size="sm" loading={busy === 'template'} onClick={() => void run('template', () => apiWaSendTemplate(c._id), 'Template sent.')}>Send template “{c.template.name}”</Button>
            : <span className="text-slate">Ask a manager to set the template in WhatsApp settings.</span>}
        </div>
      )}
      {c.windowOpen && c.windowClosesAt && <p className="px-3 pb-2 text-[11px] text-slate">You can reply freely until {new Date(c.windowClosesAt).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}.</p>}
    </>
  );
}

function ConnectionModal({ conn, onClose, onSaved }: { conn: WaConnection; onClose: () => void; onSaved: (c: WaConnection) => void }) {
  const toast = useStableToast();
  const [f, setF] = useState({ phoneNumberId: conn.phoneNumberId ?? '', accessToken: '', templateName: conn.templateName ?? '', templateLang: conn.templateLang || 'en', templateUsesName: conn.templateUsesName });
  const [busy, setBusy] = useState<'save' | 'disconnect' | null>(null);
  const [error, setError] = useState('');
  const save = async () => {
    setBusy('save'); setError('');
    try {
      const r = await apiWaConnect({ phoneNumberId: f.phoneNumberId.trim(), ...(f.accessToken.trim() ? { accessToken: f.accessToken.trim() } : {}), templateName: f.templateName.trim() || null, templateLang: f.templateLang.trim() || 'en', templateUsesName: f.templateUsesName });
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
          <Input label={conn.connected ? `Access token (saved: ${conn.tokenHint ?? '—'})` : 'Permanent access token'} type="password" autoComplete="off" placeholder={conn.connected ? 'Leave empty to keep it' : 'EAAG…'} value={f.accessToken} onChange={e => setF({ ...f, accessToken: e.target.value })} />
          <Input label="Approved template name (optional)" placeholder="e.g. sales_follow_up" value={f.templateName} onChange={e => setF({ ...f, templateName: e.target.value })} />
          <Input label="Template language code" placeholder="en, ur, en_US" value={f.templateLang} onChange={e => setF({ ...f, templateLang: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-[12.5px] cursor-pointer"><input type="checkbox" className="accent-brand-orange" checked={f.templateUsesName} onChange={e => setF({ ...f, templateUsesName: e.target.checked })} /> The template’s text has {'{{1}}'} for the person’s first name</label>
        <p className="text-[11.5px] text-slate">The template is used to restart a chat after 24 hours without a reply from the person (WhatsApp’s rule). Replies are always sent by a person; the AI only drafts them. Turn drafts on or off in the AI agent tab.</p>
        {error && <p role="alert" className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}
