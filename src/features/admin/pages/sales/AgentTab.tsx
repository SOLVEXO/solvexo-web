import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { Bot, Send, TriangleAlert } from 'lucide-react';
import { Badge, Button, Input, Textarea, Toggle } from '@/components/comman/ui';
import {
  apiAgentChats, apiAgentConfig, apiPreviewAgent, apiSaveAgentConfig,
  type AgentConfig, type AgentPreview, type ChatMessage, type ChatTranscript,
} from '@/api/services/salesOps';
import { errMsg, relDay, useStableToast } from './sales.utils';

/** Super Admin → Sales Ops → AI agent: switch the assistant on, tell it what it may say, test it, read its chats. */
export function AgentTab() {
  const toast = useStableToast();
  const [cfg, setCfg] = useState<AgentConfig | null>(null);
  const [draft, setDraft] = useState<AgentConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [chats, setChats] = useState<ChatTranscript[] | null>(null);

  useEffect(() => {
    apiAgentConfig().then(r => { setCfg(r.data); setDraft({ ...r.data, aiKnowledge: r.data.aiKnowledge ?? r.data.defaultKnowledge }); }).catch(e => toast.error(errMsg(e, 'Could not load the AI agent.')));
    apiAgentChats().then(r => setChats(r.data)).catch(() => setChats([]));
  }, [toast]);

  if (!cfg || !draft) return <div className="h-48 rounded-xl bg-cream animate-pulse" />;

  const save = async (patch: Partial<AgentConfig> = {}) => {
    setSaving(true);
    const next = { ...draft, ...patch };
    try {
      const r = await apiSaveAgentConfig({
        aiEnabled: next.aiEnabled, aiFirstReply: next.aiFirstReply, aiChat: next.aiChat, aiAgentName: next.aiAgentName,
        aiGreeting: next.aiGreeting?.trim() || null, aiKnowledge: next.aiKnowledge?.trim() || null, aiRules: next.aiRules?.trim() || null,
        aiSignOff: next.aiSignOff?.trim() || null, aiReplyTo: next.aiReplyTo?.trim() || null, aiChatDailyLimit: next.aiChatDailyLimit,
      });
      setCfg(r.data); setDraft({ ...r.data, aiKnowledge: r.data.aiKnowledge ?? r.data.defaultKnowledge }); setDirty(false);
      toast.success('Saved.');
    } catch (e) { toast.error(errMsg(e, 'Could not save.')); }
    setSaving(false);
  };
  const set = <K extends keyof AgentConfig>(k: K, v: AgentConfig[K]) => { setDirty(true); setDraft(d => (d ? { ...d, [k]: v } : d)); };

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-5 items-start">
      <div className="flex flex-col gap-4">
        {!cfg.connected && (
          <div className="flex gap-3 rounded-xl border border-warning/40 bg-warning-bg/50 p-3 text-[12.5px] text-charcoal" role="status">
            <TriangleAlert size={16} className="text-warning shrink-0 mt-0.5" />
            <p><strong>The AI is not connected yet.</strong> Your developer needs to set <code>AI_PROVIDER=claude</code> and <code>ANTHROPIC_API_KEY</code> on the server (the same setting AI Studio uses). Until then the assistant stays off, so it can never send made-up answers.</p>
          </div>
        )}

        <section className="rounded-xl border border-bone bg-white p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[14px] font-semibold text-charcoal flex items-center gap-2"><Bot size={16} className="text-brand-orange" /> AI sales assistant <Badge color={cfg.aiEnabled ? 'green' : 'gray'} size="sm">{cfg.aiEnabled ? 'On' : 'Off'}</Badge></p>
              <p className="text-[12px] text-slate">Master switch. When off, nothing below runs.</p>
            </div>
            <Toggle ariaLabel="AI sales assistant on" checked={cfg.aiEnabled} disabled={saving || !cfg.connected} onChange={v => void save({ aiEnabled: v })} />
          </div>
          <div className="flex items-start justify-between gap-3 border-t border-bone pt-3">
            <div>
              <p className="text-[13px] font-medium text-charcoal">Automatic first reply</p>
              <p className="text-[12px] text-slate">New demo requests and Contact Us leads get a personal email within minutes, in their language. A WhatsApp version is saved on the lead as a draft for your team to send.</p>
            </div>
            <Toggle ariaLabel="Automatic first reply" checked={cfg.aiFirstReply} disabled={saving} onChange={v => void save({ aiFirstReply: v })} />
          </div>
          <div className="flex items-start justify-between gap-3 border-t border-bone pt-3">
            <div>
              <p className="text-[13px] font-medium text-charcoal">Website chat</p>
              <p className="text-[12px] text-slate">A chat button on solvexo.store. The assistant answers questions and books demos into the pipeline. {cfg.chatsToday} chat{cfg.chatsToday === 1 ? '' : 's'} today.</p>
            </div>
            <Toggle ariaLabel="Website chat" checked={cfg.aiChat} disabled={saving} onChange={v => void save({ aiChat: v })} />
          </div>
        </section>

        <section className="rounded-xl border border-bone bg-white p-4 flex flex-col gap-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate">What the assistant may say</p>
          <Textarea label="Facts about Solvexo" rows={10} value={draft.aiKnowledge ?? ''} onChange={e => set('aiKnowledge', e.target.value)} />
          <p className="text-[11.5px] text-slate -mt-2">The assistant only says what is written here, plus the live prices from your plans. If something isn’t here, it says a person will confirm. Keep it accurate.</p>
          <Textarea label="Team rules (optional)" rows={3} placeholder="e.g. Don’t compare us with other platforms. Mention the Ramadan offer only if asked." value={draft.aiRules ?? ''} onChange={e => set('aiRules', e.target.value)} />
          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="Assistant’s name" value={draft.aiAgentName} onChange={e => set('aiAgentName', e.target.value)} />
            <Input label="Daily chat limit" inputMode="numeric" value={String(draft.aiChatDailyLimit)} onChange={e => set('aiChatDailyLimit', Number(e.target.value.replace(/\D/g, '')) || 1)} />
            <div className="sm:col-span-2"><Input label="Chat greeting (optional)" placeholder={`Hi! I’m ${draft.aiAgentName}, Solvexo’s AI assistant…`} value={draft.aiGreeting ?? ''} onChange={e => set('aiGreeting', e.target.value)} /></div>
            <Input label="Email sign-off (optional)" placeholder={`${draft.aiAgentName}, Solvexo's AI assistant`} value={draft.aiSignOff ?? ''} onChange={e => set('aiSignOff', e.target.value)} />
            <Input label="Replies go to (optional)" type="email" placeholder="The lead owner’s email" value={draft.aiReplyTo ?? ''} onChange={e => set('aiReplyTo', e.target.value)} />
          </div>
          <div className="flex justify-end"><Button loading={saving} disabled={!dirty} onClick={() => void save()}>Save</Button></div>
        </section>

        <section className="rounded-xl border border-bone bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate mb-2">Recent website chats</p>
          {!chats ? <div className="h-20 rounded-lg bg-cream animate-pulse" /> : chats.length === 0 ? <p className="text-[12.5px] text-slate">No chats yet.</p> : (
            <ul className="divide-y divide-bone">
              {chats.map(c => <ChatRow key={c._id} c={c} />)}
            </ul>
          )}
        </section>
      </div>

      <TestBox connected={cfg.connected} agentName={cfg.aiAgentName} />
    </div>
  );
}

function ChatRow({ c }: { c: ChatTranscript }) {
  const [open, setOpen] = useState(false);
  const visitor = c.details?.name || 'Visitor';
  return (
    <li className="py-2 text-[13px]">
      <button onClick={() => setOpen(o => !o)} aria-expanded={open} className="w-full text-left flex items-center gap-2 bg-transparent border-0 p-0 cursor-pointer">
        <span className="font-medium text-charcoal truncate">{visitor}</span>
        <span className="text-slate text-[12px] truncate flex-1">{c.summary ?? `${c.messages.length} messages`}</span>
        {c.status === 'handed_over' && <Badge color="yellow" size="sm">Wants a person</Badge>}
        {c.leadId && <Badge color="green" size="sm">Lead</Badge>}
        <span className="text-[11.5px] text-slate shrink-0">{relDay(c.updatedAt)}</span>
      </button>
      {open && <div className="mt-2"><Transcript messages={c.messages} />{c.leadId && <Link to={`/admin/sales/leads/${c.leadId}`} className="inline-block mt-1 text-[12px] font-medium text-brand-orange hover:underline">Open lead</Link>}</div>}
    </li>
  );
}

export function Transcript({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-cream/60 border border-bone p-2 max-h-80 overflow-y-auto">
      {messages.map((m, i) => (
        <p key={i} dir="auto" className={clsx('max-w-[85%] rounded-xl px-2.5 py-1.5 text-[12.5px] whitespace-pre-line', m.role === 'agent' ? 'self-start bg-white border border-bone' : 'self-end bg-brand-pale-orange text-charcoal')}>{m.text}</p>
      ))}
    </div>
  );
}

function TestBox({ connected, agentName }: { connected: boolean; agentName: string }) {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [last, setLast] = useState<AgentPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const send = async () => {
    const m = text.trim();
    if (!m) return;
    setBusy(true); setError('');
    try {
      const r = await apiPreviewAgent(m, history);
      setHistory(h => [...h, { role: 'visitor', text: m }, { role: 'agent', text: r.data.reply }]);
      setLast(r.data); setText('');
    } catch (e) { setError(errMsg(e, 'Could not get an answer.')); }
    setBusy(false);
  };

  return (
    <section className="rounded-xl border border-bone bg-white p-4 flex flex-col gap-3 lg:sticky lg:top-20">
      <div>
        <p className="text-[13px] font-semibold text-charcoal">Test {agentName}</p>
        <p className="text-[12px] text-slate">Chat as a visitor would. Nothing is saved and no lead is created. Works even while the assistant is off. Save your changes first.</p>
      </div>
      {history.length > 0 && <Transcript messages={history} />}
      {last && (
        <p className="text-[11.5px] text-slate">
          Language: {last.language ?? '—'}{last.wantsDemo ? ' · wants a demo' : ''}{last.wantsHuman ? ' · wants a person' : ''}
          {Object.entries(last.details).filter(([, v]) => v).length > 0 && <> · knows: {Object.entries(last.details).filter(([, v]) => v).map(([k, v]) => `${k} ${v}`).join(', ')}</>}
        </p>
      )}
      <div className="flex gap-2 items-end">
        <Textarea aria-label="Test message" rows={2} dir="auto" placeholder="e.g. Kya COD available hai? Price kitni hai?" value={text} onChange={e => setText(e.target.value)} disabled={!connected} />
        <Button aria-label="Send test message" loading={busy} disabled={!connected || !text.trim()} onClick={send}><Send size={14} /></Button>
      </div>
      {history.length > 0 && <Button size="xs" variant="ghost" onClick={() => { setHistory([]); setLast(null); }}>Start over</Button>}
      {error && <p role="alert" className="text-[12px] text-error">{error}</p>}
    </section>
  );
}
