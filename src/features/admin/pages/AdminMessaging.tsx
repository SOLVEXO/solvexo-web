import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { X, Loader2, MessageSquare, Flag, Paperclip } from 'lucide-react';
import { useAdminConversations, useAdminReports } from '@/hooks/messaging/useAdminMessaging';
import { useMessages } from '@/hooks/messaging/useMessages';
import type { ReportStatus, TargetType } from '@/api/commerce/messaging';

type MainTab = 'conversations' | 'reports';

function fmt(iso?: string) { return iso ? new Date(iso).toLocaleString() : '—'; }

// ── Conversation detail drawer (read-only thread view) ─────────────────────────
function ConversationDrawer({ conversationId, onClose }: { conversationId: string; onClose: () => void }) {
  const { messages, loading } = useMessages(conversationId);
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-[420px] max-w-[92vw] h-full bg-white shadow-2xl flex flex-col">
        <div className="px-5 py-4 border-b border-bone flex items-center justify-between shrink-0">
          <p className="text-[14px] font-bold text-charcoal">Conversation · {conversationId.slice(-6).toUpperCase()}</p>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-bone border-none cursor-pointer">
            <X size={13} className="text-charcoal" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex justify-center pt-8"><Loader2 size={18} className="animate-spin text-brand-orange" /></div>
          ) : messages.length === 0 ? (
            <p className="text-[13px] text-slate text-center pt-8">No messages in this conversation.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map(m => (
                <div key={m._id} className="border border-bone rounded-[9px] px-3 py-[10px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-slate uppercase">{m.senderRole} · {m.senderId.slice(-6)}</span>
                    <span className="text-[10px] text-slate">{fmt(m.createdAt)}</span>
                  </div>
                  {m.type === 'text' && <p className="text-[13px] text-charcoal">{m.text}</p>}
                  {m.type === 'product_share' && (
                    <p className="text-[13px] text-charcoal">Shared product: {m.productShare?.title ?? `#${m.productShare?.productId}`}{m.productShare?.price != null && ` — $${m.productShare.price}`}</p>
                  )}
                  {(m.type === 'image' || m.type === 'file' || m.type === 'video') && m.attachments?.map(a => (
                    <a key={a.url} href={a.url} target="_blank" rel="noreferrer" className="text-[13px] text-brand-orange underline flex items-center gap-1">
                      <Paperclip size={11} /> {a.fileName}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Conversations tab ────────────────────────────────────────────────────────
function ConversationsPanel() {
  const [filters, setFilters] = useState<{ storeId: string; buyerId: string; sellerId: string; isArchived: string }>({
    storeId: '', buyerId: '', sellerId: '', isArchived: '',
  });
  const { conversations, loading, error, refetch } = useAdminConversations({
    storeId:    filters.storeId  || undefined,
    buyerId:    filters.buyerId  || undefined,
    sellerId:   filters.sellerId || undefined,
    isArchived: filters.isArchived === '' ? undefined : filters.isArchived === 'true',
  });
  const [viewingId, setViewingId] = useState<string | null>(null);

  return (
    <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-5 py-[14px] border-b border-bone flex gap-[10px] items-center flex-wrap">
        <input placeholder="Store ID"  value={filters.storeId}  onChange={e => setFilters(f => ({ ...f, storeId: e.target.value }))}  className="px-3 py-2 rounded-lg border border-bone text-[13px] bg-white outline-none w-[160px]" />
        <input placeholder="Buyer ID"  value={filters.buyerId}  onChange={e => setFilters(f => ({ ...f, buyerId: e.target.value }))}  className="px-3 py-2 rounded-lg border border-bone text-[13px] bg-white outline-none w-[160px]" />
        <input placeholder="Seller ID" value={filters.sellerId} onChange={e => setFilters(f => ({ ...f, sellerId: e.target.value }))} className="px-3 py-2 rounded-lg border border-bone text-[13px] bg-white outline-none w-[160px]" />
        <select value={filters.isArchived} onChange={e => setFilters(f => ({ ...f, isArchived: e.target.value }))}
          className="px-3 py-2 rounded-lg border border-bone text-[13px] bg-white outline-none cursor-pointer">
          <option value="">All statuses</option>
          <option value="false">Active</option>
          <option value="true">Archived</option>
        </select>
        <button onClick={refetch} className="px-3 py-2 rounded-lg border border-bone text-[13px] bg-cream cursor-pointer">Apply</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Conversation','Store','Buyer','Seller','Status','Updated',''].map(h => (
                <th key={h} className="text-left px-4 py-[10px] text-[11px] font-semibold text-slate uppercase tracking-[0.05em] border-b border-bone bg-[#FAF9F5] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center"><Loader2 size={18} className="animate-spin text-brand-orange inline" /></td></tr>
            ) : error ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-[13px] text-error">{error}</td></tr>
            ) : conversations.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-[13px] text-slate">No conversations found.</td></tr>
            ) : conversations.map(c => (
              <tr key={c._id} className="border-b border-[#F0EEE6]">
                <td className="px-4 py-3 text-[13px] font-bold text-[#B95A3A] whitespace-nowrap">{c._id.slice(-8).toUpperCase()}</td>
                <td className="px-4 py-3 text-[13px] text-[#4A4945] whitespace-nowrap">{c.storeId?.slice(-8) ?? '—'}</td>
                <td className="px-4 py-3 text-[13px] text-[#4A4945] whitespace-nowrap">{c.buyerId?.slice(-8) ?? '—'}</td>
                <td className="px-4 py-3 text-[13px] text-[#4A4945] whitespace-nowrap">{c.sellerId?.slice(-8) ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="px-[10px] py-[3px] rounded-[5px] text-[11px] font-semibold"
                    style={{ background: c.isArchived ? '#F0EEE6' : '#EAF7EF', color: c.isArchived ? '#5A5852' : '#1E7A3C' }}>
                    {c.isArchived ? 'Archived' : 'Active'}
                  </span>
                </td>
                <td className="px-4 py-3 text-[13px] text-slate whitespace-nowrap">{fmt(c.updatedAt)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => setViewingId(c._id)} className="px-[10px] py-1 rounded-[6px] text-[11px] font-medium text-white border-none cursor-pointer bg-[#1A72C2] flex items-center gap-1">
                    <MessageSquare size={11} /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewingId && <ConversationDrawer conversationId={viewingId} onClose={() => setViewingId(null)} />}
    </div>
  );
}

// ── Reports tab ───────────────────────────────────────────────────────────────
const STATUS_OPTS: (ReportStatus | '')[] = ['', 'pending', 'reviewed', 'resolved'];
const TARGET_OPTS:  (TargetType  | '')[] = ['', 'user', 'message', 'conversation'];

function ReportsPanel() {
  const [status,     setStatus]     = useState<ReportStatus | ''>('');
  const [targetType, setTargetType] = useState<TargetType | ''>('');
  const [page, setPage] = useState(1);
  const { reports, loading, error } = useAdminReports({
    status:     status || undefined,
    targetType: targetType || undefined,
    page, limit: 30,
  });

  return (
    <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-5 py-[14px] border-b border-bone flex gap-[10px] items-center flex-wrap">
        <select value={status} onChange={e => { setStatus(e.target.value as ReportStatus | ''); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-bone text-[13px] bg-white outline-none cursor-pointer">
          {STATUS_OPTS.map(o => <option key={o} value={o}>{o ? o[0].toUpperCase() + o.slice(1) : 'All Statuses'}</option>)}
        </select>
        <select value={targetType} onChange={e => { setTargetType(e.target.value as TargetType | ''); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-bone text-[13px] bg-white outline-none cursor-pointer">
          {TARGET_OPTS.map(o => <option key={o} value={o}>{o ? o[0].toUpperCase() + o.slice(1) : 'All Types'}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Report','Type','Target','Reporter','Reason','Status','Created'].map(h => (
                <th key={h} className="text-left px-4 py-[10px] text-[11px] font-semibold text-slate uppercase tracking-[0.05em] border-b border-bone bg-[#FAF9F5] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center"><Loader2 size={18} className="animate-spin text-brand-orange inline" /></td></tr>
            ) : error ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-[13px] text-error">{error}</td></tr>
            ) : reports.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-[13px] text-slate">No reports found.</td></tr>
            ) : reports.map(r => (
              <tr key={r._id} className="border-b border-[#F0EEE6]">
                <td className="px-4 py-3 text-[13px] font-bold text-[#B95A3A] whitespace-nowrap flex items-center gap-1"><Flag size={11} /> {r._id.slice(-8).toUpperCase()}</td>
                <td className="px-4 py-3 text-[13px] text-[#4A4945] capitalize whitespace-nowrap">{r.targetType}</td>
                <td className="px-4 py-3 text-[13px] text-[#4A4945] whitespace-nowrap">{r.targetId.slice(-8)}</td>
                <td className="px-4 py-3 text-[13px] text-[#4A4945] whitespace-nowrap">{r.reporterId?.slice(-8) ?? '—'}</td>
                <td className="px-4 py-3 text-[13px] text-[#4A4945] max-w-[220px] truncate">{r.reason}{r.details ? ` — ${r.details}` : ''}</td>
                <td className="px-4 py-3">
                  <span className="px-[10px] py-[3px] rounded-[5px] text-[11px] font-semibold"
                    style={{
                      background: r.status === 'pending' ? '#FFF4DC' : r.status === 'reviewed' ? '#EAF3FB' : '#EAF7EF',
                      color:      r.status === 'pending' ? '#B36200' : r.status === 'reviewed' ? '#2156A8' : '#1E7A3C',
                    }}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[13px] text-slate whitespace-nowrap">{fmt(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-bone flex items-center justify-end gap-2">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          className="px-3 py-[6px] rounded-lg border border-bone text-[12px] bg-white cursor-pointer disabled:opacity-50">Prev</button>
        <span className="text-[12px] text-slate">Page {page}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={reports.length < 30}
          className="px-3 py-[6px] rounded-lg border border-bone text-[12px] bg-white cursor-pointer disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function AdminMessaging() {
  usePageTitle('Messaging');
  const [tab, setTab] = useState<MainTab>('conversations');

  return (
    <div>
      <div className="bg-white border-b border-bone px-7 py-[14px] sticky top-0 z-10">
        <h1 className="text-[18px] font-bold text-charcoal leading-[1.3]">Messaging</h1>
        <p className="text-[12px] text-slate mt-[2px]">Oversee buyer–seller conversations and moderation reports.</p>
      </div>

      <div className="px-7 pt-5 pb-8 flex flex-col gap-5">
        <div className="flex gap-2">
          {(['conversations', 'reports'] as MainTab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-[8px] rounded-lg text-[13px] font-semibold border cursor-pointer capitalize"
              style={{
                background: tab === t ? '#FBECE4' : '#fff',
                color:      tab === t ? '#B95A3A' : '#4A4945',
                borderColor: tab === t ? '#D97757' : 'var(--color-bone, #E8E6DC)',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'conversations' ? <ConversationsPanel /> : <ReportsPanel />}
      </div>
    </div>
  );
}
