import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { CircleCheck, CircleX, FileText, MessageCircle, MessageSquarePlus, MessageSquareText, Settings2, Sparkles } from 'lucide-react';
import { Avatar, Badge, Button, EmptyState, MetricCard, Modal, SearchInput, Select, TabBar, Toggle } from '@/components/comman/ui';
import {
  apiMyMessaging, apiSalesOwners, apiWaAssign, apiWaConnection, apiWaConversations, apiWaMyTemplates, apiWaQuickReplies,
  type MessagingLevel, type SalesOwner, type WaConnection, type WaConversation, type WaConversationRow, type WaCounts,
  type WaQuickReply, type WaTemplate, type WaView,
} from '@/api/services/salesOps';
import { StageBadge } from './parts';
import { errMsg, useStableToast } from './sales.utils';
import { isClosing, playChime, readPref, rowTime, shortLeft, useNow, writePref } from './whatsapp.utils';
import { StatusTick, Thread } from './WhatsAppThread';
import { LeadPanel } from './WhatsAppLeadPanel';
import { ConnectionModal, NewChatModal, QuickRepliesModal, TemplatesModal } from './WhatsAppModals';

const ZERO: WaCounts = { all: 0, needsReply: 0, unread: 0, unreadMessages: 0, closing: 0, expired: 0, done: 0 };
const VIEWS: { id: WaView; label: string; count: keyof WaCounts; empty: string }[] = [
  { id: 'all', label: 'All', count: 'all', empty: 'No chats yet.' },
  { id: 'needs_reply', label: 'Needs reply', count: 'needsReply', empty: 'Nothing is waiting for a reply.' },
  { id: 'unread', label: 'Unread', count: 'unread', empty: 'No unread messages.' },
  { id: 'closing', label: 'Closing soon', count: 'closing', empty: 'No chat closes in the next 4 hours.' },
  { id: 'expired', label: 'Template only', count: 'expired', empty: 'No chat is past its 24 hours.' },
  { id: 'done', label: 'Done', count: 'done', empty: 'Nothing is marked done yet.' },
];
const PANEL_PREF = 'sales.whatsapp.leadPanel';
const MUTE_PREF = 'sales.whatsapp.muted';

/** Super Admin → Sales Ops → WhatsApp: Solvexo's own number. The AI drafts, a person sends. */
export function WhatsAppTab({ isManager, onUnread }: { isManager: boolean; onUnread?: (messages: number) => void }) {
  const toast = useStableToast();
  const now = useNow();
  const [params, setParams] = useSearchParams();
  const [conn, setConn] = useState<WaConnection | null>(null);
  const [rows, setRows] = useState<WaConversationRow[] | null>(null);
  const [counts, setCounts] = useState<WaCounts>(ZERO);
  const [view, setView] = useState<WaView>('all');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [owners, setOwners] = useState<SalesOwner[]>([]);
  const [quickReplies, setQuickReplies] = useState<WaQuickReply[]>([]);
  const [waLevel, setWaLevel] = useState<MessagingLevel>('full');
  const [repTemplates, setRepTemplates] = useState<WaTemplate[]>([]);
  const [openLead, setOpenLead] = useState<{ chat: string; leadId: string | null } | null>(null);
  const [leadVersion, setLeadVersion] = useState(0);
  const [panelOpen, setPanelOpen] = useState(() => readPref(PANEL_PREF) !== 'closed');
  const [leadSheet, setLeadSheet] = useState(false);
  const [muted, setMuted] = useState(() => readPref(MUTE_PREF) === '1');
  const [modal, setModal] = useState<'settings' | 'templates' | 'quick' | 'new' | null>(null);
  const selected = params.get('c');

  // Typing in the search box: ask the server once the person pauses.
  useEffect(() => { const t = setTimeout(() => setSearch(q.trim()), 300); return () => clearTimeout(t); }, [q]);

  // Alerts: a short chime when new messages arrive — only after the person has used the page (browsers block sound before that).
  const interacted = useRef(false);
  const lastUnread = useRef<number | null>(null);
  const mutedRef = useRef(muted);
  const unreadRef = useRef(onUnread);
  useEffect(() => { mutedRef.current = muted; unreadRef.current = onUnread; });
  useEffect(() => {
    const mark = () => { interacted.current = true; };
    window.addEventListener('pointerdown', mark);
    window.addEventListener('keydown', mark);
    return () => { window.removeEventListener('pointerdown', mark); window.removeEventListener('keydown', mark); };
  }, []);

  const loadList = useCallback(() => apiWaConversations({ view, q: search, ownerId: ownerId || undefined }).then(r => {
    setRows(r.data);
    const next = r.counts ?? ZERO;
    setCounts(next);
    const before = lastUnread.current;
    if (before !== null && next.unreadMessages > before && interacted.current && !mutedRef.current) playChime();
    lastUnread.current = next.unreadMessages;
    unreadRef.current?.(next.unreadMessages);
  }).catch(e => { setRows(r => r ?? []); toast.error(errMsg(e, 'Could not load WhatsApp chats.')); }), [view, search, ownerId, toast]);
  useEffect(() => { void loadList(); const t = setInterval(() => void loadList(), 10_000); return () => clearInterval(t); }, [loadList]);

  useEffect(() => {
    apiWaQuickReplies().then(r => setQuickReplies(r.data)).catch(() => undefined);
    apiMyMessaging().then(r => setWaLevel(r.data.whatsapp)).catch(() => undefined);
    // What this person may start a chat with (a rep cannot read the connection's full list).
    apiWaMyTemplates().then(r => setRepTemplates(r.data)).catch(() => undefined);
    if (!isManager) return;
    apiWaConnection().then(r => setConn(r.data)).catch(() => undefined);
    apiSalesOwners().then(r => setOwners(r.data)).catch(() => setOwners([]));
  }, [isManager]);

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
  const row = rows?.find(r => r._id === selected);
  const leadId = openLead?.chat === selected ? openLead.leadId : row?.leadId ?? null;
  const showPanel = !!selected && !!leadId && panelOpen;
  const togglePanel = () => { setPanelOpen(o => { writePref(PANEL_PREF, o ? 'closed' : 'open'); return !o; }); };
  const onLoaded = useCallback((c: WaConversation) => {
    setOpenLead({ chat: c._id, leadId: c.lead?._id ?? null });
  }, []);
  const assign = async (adminId: string | null) => {
    if (!selected) return false;
    try {
      await apiWaAssign(selected, adminId);
      toast.success(adminId ? `Chat given to ${owners.find(o => o._id === adminId)?.name ?? 'them'}.` : 'Chat unassigned.');
      setLeadVersion(v => v + 1); void loadList(); return true;
    } catch (e) { toast.error(errMsg(e, 'Could not assign the chat.')); return false; }
  };
  const newChatTemplates = repTemplates.length ? repTemplates : isManager ? conn?.templates ?? [] : [];
  const noChats = !!rows && counts.all === 0 && view === 'all' && !search && !ownerId;

  return (
    <div className="flex flex-col gap-3">
      {/* Header strip: the number's state, today's counters, and actions. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[12.5px]">
          {isManager && conn && conn.connected && (
            <p className={clsx('flex items-center gap-1.5', conn.lastEventAt ? 'text-success' : 'text-warning')}>
              {conn.lastEventAt ? <CircleCheck size={14} /> : <CircleX size={14} />}
              Connected · {conn.verifiedName ?? 'Solvexo'} · {conn.displayNumber}{!conn.lastEventAt && <span> · no messages from Meta yet</span>}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Today">
            {([['needs_reply', 'Needs reply', counts.needsReply], ['unread', 'Unread', counts.unread], ['closing', 'Closing soon', counts.closing]] as const).map(([v, label, n]) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}
                className={clsx('px-2.5 py-1 rounded-full text-[12px] border cursor-pointer', view === v ? 'bg-brand-orange text-white border-brand-orange' : 'bg-white text-charcoal border-bone hover:border-brand-orange/50')}>
                {label} <strong>{n}</strong>
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1.5 text-[12px] text-slate mr-1"><Toggle size="sm" ariaLabel="Sound for new messages" checked={!muted} onChange={on => { setMuted(!on); writePref(MUTE_PREF, on ? '0' : '1'); }} /> Sound</span>
          {waLevel !== 'off' && <Button size="sm" onClick={() => setModal('new')}><MessageSquarePlus size={14} /> New chat</Button>}
          {isManager && conn && <Button size="sm" variant="ghost" onClick={() => setModal('templates')}><FileText size={14} /> Templates</Button>}
          {isManager && <Button size="sm" variant="ghost" aria-label="Edit quick replies" onClick={() => setModal('quick')}><MessageSquareText size={14} /> Quick replies</Button>}
          {isManager && <Button size="sm" variant="ghost" onClick={() => setModal('settings')}><Settings2 size={14} /> Settings</Button>}
        </div>
      </div>
      {isManager && conn && !conn.connected && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning-bg/50 p-3 text-[12.5px]">
          <p><strong>Solvexo’s WhatsApp number isn’t connected yet.</strong> Connect it to receive messages here and reply with AI drafts.</p>
          <Button size="sm" onClick={() => setModal('settings')}>Connect WhatsApp</Button>
        </div>
      )}

      <div className={clsx('grid rounded-xl border border-bone bg-white overflow-hidden min-h-[560px]', showPanel ? 'md:grid-cols-[320px_1fr] lg:grid-cols-[320px_1fr_300px]' : 'md:grid-cols-[320px_1fr]')}>
        {/* A — the chats */}
        <aside className={clsx('border-r border-bone flex flex-col min-w-0', selected && 'hidden md:flex')}>
          <div className="p-3 flex flex-col gap-2 border-b border-bone">
            <SearchInput aria-label="Search chats" placeholder="Name, business or phone" value={q} onChange={setQ} />
            {isManager && (
              <Select aria-label="Whose chats" value={ownerId} onChange={e => setOwnerId(e.target.value)}>
                <option value="">Everyone</option>{owners.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
              </Select>
            )}
          </div>
          <div role="group" aria-label="Chat views">
            <TabBar dense active={view} onChange={id => setView(id as WaView)} tabs={VIEWS.map(v => ({ id: v.id, label: v.label, count: counts[v.count] }))} />
          </div>
          {!rows ? <div className="m-3 h-24 rounded-lg bg-cream animate-pulse" /> : rows.length === 0 ? (
            <p className="p-6 text-center text-[12.5px] text-slate">{search ? `No chats match “${search}”.` : VIEWS.find(v => v.id === view)?.empty}</p>
          ) : (
            <ul className="overflow-y-auto divide-y divide-bone" aria-label="WhatsApp chats">
              {rows.map(c => <ChatRow key={c._id} c={c} now={now} active={selected === c._id} showOwner={isManager} onOpen={() => select(c._id)} />)}
            </ul>
          )}
        </aside>

        {/* B — the conversation */}
        <section className={clsx('flex flex-col min-w-0', !selected && 'hidden md:flex')}>
          {selected ? (
            <Thread key={selected} id={selected} row={row} isManager={isManager} owners={owners} quickReplies={quickReplies} leadPanelOpen={panelOpen}
              onBack={() => select(null)} onChanged={() => void loadList()} onAssign={assign} onToggleLeadPanel={togglePanel} onShowLead={() => setLeadSheet(true)} onLoaded={onLoaded} />
          ) : noChats ? (
            isManager && conn ? <SetupChecklist conn={conn} /> : (
              <EmptyState icon={<MessageCircle size={26} />} title="No chats yet" description="When someone messages Solvexo’s WhatsApp number, the chat appears here with a reply drafted by the AI assistant." />
            )
          ) : <Today counts={counts} />}
        </section>

        {/* C — the lead */}
        {showPanel && leadId && (
          <aside className="hidden lg:flex flex-col border-l border-bone overflow-y-auto min-w-0" aria-label="Lead details">
            <LeadPanel key={leadId} leadId={leadId} isManager={isManager} owners={owners} version={leadVersion} onAssign={assign} onChanged={() => void loadList()} />
          </aside>
        )}
      </div>

      {leadSheet && leadId && (
        <Modal title="Lead" onClose={() => setLeadSheet(false)} width={420}>
          <div className="-mx-5 -my-4"><LeadPanel leadId={leadId} isManager={isManager} owners={owners} version={leadVersion} onAssign={assign} onChanged={() => void loadList()} /></div>
        </Modal>
      )}
      {modal === 'templates' && conn && <TemplatesModal templates={conn.templates ?? []} onClose={() => setModal(null)} onSaved={c => { setConn(c); setModal(null); }} />}
      {modal === 'settings' && conn && <ConnectionModal conn={conn} onClose={() => setModal(null)} onSaved={c => { setConn(c); setModal(null); }} />}
      {modal === 'quick' && <QuickRepliesModal replies={quickReplies} onClose={() => setModal(null)} onSaved={r => { setQuickReplies(r); setModal(null); }} />}
      {modal === 'new' && <NewChatModal templates={newChatTemplates} onClose={() => setModal(null)} onStarted={id => { setModal(null); toast.success('Template sent. The chat is open.'); select(id); void loadList(); }} />}
    </div>
  );
}

function ChatRow({ c, now, active, showOwner, onOpen }: { c: WaConversationRow; now: number; active: boolean; showOwner: boolean; onOpen: () => void }) {
  const snoozed = !!c.snoozedUntil && new Date(c.snoozedUntil).getTime() > now;
  const open = c.windowOpen && (!c.windowClosesAt || new Date(c.windowClosesAt).getTime() > now);
  return (
    <li>
      <button onClick={onOpen} aria-current={active ? 'true' : undefined}
        className={clsx('w-full text-left px-3 py-2.5 flex gap-2.5 border-0 cursor-pointer', active ? 'bg-brand-pale-orange/50' : 'bg-white hover:bg-cream')}>
        <Avatar name={c.name} size={36} />
        <span className="flex-1 min-w-0 flex flex-col gap-0.5">
          <span className="flex items-center gap-2">
            <span className={clsx('flex-1 min-w-0 truncate text-[13px]', c.unread ? 'font-bold text-carbon' : 'font-medium text-charcoal')}>{c.name}</span>
            <span className="text-[11px] text-slate shrink-0">{rowTime(c.lastMessageAt, new Date(now))}</span>
          </span>
          {(c.businessName || c.city) && <span className="truncate text-[11.5px] text-slate">{[c.businessName, c.city].filter(Boolean).join(' · ')}</span>}
          <span className="flex items-center gap-1.5">
            {c.lastDirection === 'out' && <StatusTick status={c.lastStatus} />}
            <span dir="auto" className={clsx('flex-1 min-w-0 truncate text-[12px]', c.unread ? 'text-charcoal' : 'text-slate')}>{c.lastDirection === 'out' ? 'You: ' : ''}{c.lastMessageText ?? ''}</span>
            {c.unread > 0 && <span className="min-w-5 h-5 px-1.5 rounded-full bg-success text-white text-[11px] font-bold flex items-center justify-center" aria-label={`${c.unread} unread`}>{c.unread}</span>}
          </span>
          <span className="flex flex-wrap items-center gap-1 mt-0.5">
            {c.stage && <StageBadge stage={c.stage} />}
            {open && c.windowClosesAt ? <Badge size="sm" color={isClosing(c.windowClosesAt, now) ? 'yellow' : 'green'}>{shortLeft(c.windowClosesAt, now)}</Badge>
              : !open && <Badge size="sm" color="gray">Template only</Badge>}
            {c.hasDraft && <Sparkles size={12} className="text-brand-orange shrink-0" aria-label="AI draft ready" />}
            {snoozed && <Badge size="sm" color="blue">Snoozed</Badge>}
            {showOwner && c.ownerName && <span className="text-[11px] text-slate truncate">{c.ownerName}</span>}
          </span>
        </span>
      </button>
    </li>
  );
}

/** No chat open: today's numbers and three tips. */
function Today({ counts }: { counts: WaCounts }) {
  return (
    <div className="flex-1 flex flex-col justify-center gap-5 p-6">
      <div className="flex flex-wrap gap-3">
        <MetricCard label="Need a reply" value={counts.needsReply} />
        <MetricCard label="Unread" value={counts.unread} />
        <MetricCard label="Closing soon" value={counts.closing} />
      </div>
      <ul className="flex flex-col gap-2 text-[12.5px] text-slate list-disc ml-5">
        <li>Reply inside 24 hours of their last message; after that WhatsApp only allows an approved template.</li>
        <li>The AI drafts a reply to each new message. Read it, edit it if needed, then send.</li>
        <li>Mark a chat done when nothing is left to say, or snooze it to come back later.</li>
      </ul>
    </div>
  );
}

/** No chats at all yet: what still needs setting up. */
function SetupChecklist({ conn }: { conn: WaConnection }) {
  const items: [boolean, string][] = [
    [conn.connected, 'Solvexo’s WhatsApp number is connected'],
    [(conn.templates ?? []).length > 0, 'Approved templates are added'],
    [!!conn.lastEventAt, 'Publish the Meta app so real messages arrive'],
  ];
  return (
    <div className="flex-1 flex flex-col justify-center gap-3 p-6 max-w-[440px] mx-auto">
      <p className="text-[15px] font-semibold text-carbon">Get WhatsApp ready</p>
      <ul className="flex flex-col gap-2 text-[13px]" aria-label="Setup">
        {items.map(([ok, label]) => (
          <li key={label} className="flex items-center gap-2">
            {ok ? <CircleCheck size={16} className="text-success shrink-0" aria-label="Done" /> : <CircleX size={16} className="text-slate shrink-0" aria-label="Not yet" />}
            <span className={ok ? 'text-charcoal' : 'text-slate'}>{label}</span>
          </li>
        ))}
      </ul>
      <p className="text-[12px] text-slate">Connect the number and add templates under Settings and Templates above. Chats appear here as soon as someone writes.</p>
    </div>
  );
}
