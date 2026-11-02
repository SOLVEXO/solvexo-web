import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { MessageCircle, Send, X, Bot } from 'lucide-react';
import { apiChatConfig, apiChatSend, apiChatStart, type ChatMessage } from '@/api/services/salesOps';
import { campaignTags } from '@/utils/campaignTags';
import { getPartnerCode } from '@/utils/sellerAcquisitionAttribution';

const KEY = 'solvexo:salesChat';
const QUICK = ['How much does it cost?', 'Do you support Cash on Delivery?', 'Book a free demo'];

interface Saved { token: string; agentName: string; messages: ChatMessage[] }
const load = (): Saved | null => { try { return JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as Saved | null; } catch { return null; } };
const save = (s: Saved | null) => { try { if (s) sessionStorage.setItem(KEY, JSON.stringify(s)); else sessionStorage.removeItem(KEY); } catch { /* storage blocked */ } };

/**
 * The AI sales assistant on solvexo.store's public pages. Hidden unless Super Admin has switched the chat on and
 * a real AI is connected. The conversation lives for the browser tab (sessionStorage) so it survives page changes.
 */
export function SalesChatWidget() {
  const { search, pathname } = useLocation();
  const [enabled, setEnabled] = useState(false);
  const [agentName, setAgentName] = useState('Sana');
  const [open, setOpen] = useState(false);
  const [chat, setChat] = useState<Saved | null>(load);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;
    apiChatConfig().then(r => { if (!cancelled) { setEnabled(r.data.enabled); setAgentName(r.data.agentName); } }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);
  useEffect(() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; }, [chat?.messages.length, busy, open]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  if (!enabled && !chat) return null;

  const start = async (): Promise<Saved | null> => {
    if (chat) return chat;
    try {
      const r = await apiChatStart({ page: pathname, ...campaignTags(search), partnerCode: getPartnerCode() ?? undefined });
      const s: Saved = { token: r.data.token, agentName: r.data.agentName, messages: [{ role: 'agent', text: r.data.greeting }] };
      setChat(s); save(s); return s;
    } catch (e) { setError(e instanceof Error ? e.message : 'Chat is not available right now.'); return null; }
  };

  const openChat = async () => { setOpen(true); setError(''); await start(); };

  const send = async (message: string) => {
    const m = message.trim();
    if (!m || busy) return;
    const s = await start();
    if (!s) return;
    const withVisitor: Saved = { ...s, messages: [...s.messages, { role: 'visitor', text: m }] };
    setChat(withVisitor); save(withVisitor); setText(''); setBusy(true); setError('');
    try {
      const r = await apiChatSend(s.token, m);
      const next: Saved = { ...withVisitor, messages: [...withVisitor.messages, { role: 'agent', text: r.data.reply }] };
      setChat(next); save(next);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not send.';
      if (/ended|start a new/i.test(msg)) { save(null); setChat(null); }
      setError(msg);
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed z-40 right-4 bottom-[calc(16px+env(safe-area-inset-bottom))] sm:right-6 sm:bottom-6 print:hidden">
      {open ? (
        <section role="dialog" aria-label={`Chat with ${agentName}`} className="w-[calc(100vw-32px)] sm:w-[380px] h-[min(560px,calc(100dvh-100px))] bg-white rounded-2xl shadow-2xl border border-bone flex flex-col overflow-hidden">
          <header className="flex items-center gap-3 px-4 py-3 bg-carbon text-white">
            <span className="size-9 rounded-full bg-brand-orange flex items-center justify-center"><Bot size={18} /></span>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold">{agentName}</p>
              <p className="text-[11.5px] text-white/70">Solvexo’s AI assistant · English / اردو</p>
            </div>
            <button aria-label="Close chat" onClick={() => setOpen(false)} className="size-8 rounded-full flex items-center justify-center bg-transparent border-0 text-white/80 hover:bg-white/10 cursor-pointer"><X size={18} /></button>
          </header>
          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2 bg-cream/60" aria-live="polite">
            {(chat?.messages ?? []).map((m, i) => (
              <p key={i} dir="auto" className={clsx('max-w-[85%] rounded-2xl px-3 py-2 text-[13.5px] leading-[1.5] whitespace-pre-line break-words',
                m.role === 'agent' ? 'self-start bg-white border border-bone text-charcoal rounded-bl-md' : 'self-end bg-brand-orange text-white rounded-br-md')}>
                {m.text}
              </p>
            ))}
            {busy && <p className="self-start bg-white border border-bone rounded-2xl px-3 py-2 text-[13px] text-slate" aria-label={`${agentName} is typing`}><span className="animate-pulse">●●●</span></p>}
            {chat && chat.messages.length <= 1 && !busy && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {QUICK.map(q => <button key={q} onClick={() => void send(q)} className="rounded-full border border-brand-orange/40 bg-white px-3 py-1 text-[12.5px] text-brand-deep-orange cursor-pointer hover:bg-brand-pale-orange/50">{q}</button>)}
              </div>
            )}
          </div>
          {error && <p role="alert" className="px-4 py-1.5 text-[12px] text-error bg-error-bg">{error}</p>}
          <form className="flex items-end gap-2 p-3 border-t border-bone" onSubmit={e => { e.preventDefault(); void send(text); }}>
            <textarea ref={inputRef} rows={1} dir="auto" aria-label="Your message" maxLength={1000} value={text} placeholder="Type your question…"
              onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(text); } }}
              className="flex-1 resize-none max-h-28 rounded-xl border border-bone px-3 py-2 text-[16px] sm:text-[13.5px] outline-none focus:border-brand-orange" />
            <button type="submit" aria-label="Send" disabled={!text.trim() || busy} className="size-10 rounded-xl bg-brand-orange text-white flex items-center justify-center border-0 cursor-pointer disabled:opacity-40"><Send size={16} /></button>
          </form>
          <p className="px-4 pb-2 text-[10.5px] text-slate">An AI assistant. A person from the team follows up on demos. Don’t share passwords or card details.</p>
        </section>
      ) : (
        <button onClick={() => void openChat()} aria-label={`Chat with ${agentName}, Solvexo’s AI assistant`}
          className="flex items-center gap-2 rounded-full bg-brand-orange text-white pl-3 pr-4 py-3 shadow-xl border-0 cursor-pointer hover:bg-brand-deep-orange">
          <MessageCircle size={20} /><span className="text-[13.5px] font-semibold hidden sm:inline">Questions? Chat with us</span>
        </button>
      )}
    </div>
  );
}
