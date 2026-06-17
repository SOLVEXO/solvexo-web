import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { Sparkles } from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────
interface Conversation {
  id: number; name: string; initials: string; time: string;
  subject: string; preview: string; unread: boolean;
}

const CONVERSATIONS: Conversation[] = [
  { id: 1, name: 'Sarah Mitchell', initials: 'SM', time: '2 min ago', subject: 'Re: Grade 5 Math Bundle',   preview: 'Hi! Can I use this for multiple classrooms...', unread: true  },
  { id: 2, name: 'David Reynolds', initials: 'DR', time: '1h ago',    subject: 'Re: Fractions Mastery Kit', preview: 'Thank you so much! The resources are...',        unread: false },
  { id: 3, name: 'Lena Kowalski',  initials: 'LK', time: '3h ago',    subject: 'Re: Ceramic Mug Set',       preview: 'Is there an editable version available?',        unread: true  },
  { id: 4, name: 'Tom Barnes',     initials: 'TB', time: 'Yesterday', subject: 'Re: Ceramic Mug Set',       preview: 'When will the order ship?',                       unread: false },
];

const avatarColors: Record<string, { bg: string; color: string }> = {
  SM: { bg: '#FDECEA', color: '#C0392B' },
  DR: { bg: '#EAF3FB', color: '#2156A8' },
  LK: { bg: '#EAF7EF', color: '#1E7A3C' },
  TB: { bg: '#FFF4E5', color: '#B36200' },
};

const AI_REPLY = "Hi Sarah! Yes, the Google Slides version is fully compatible with Google Classroom. You can assign individual slides as assignments. For the school license, you can upgrade directly from your Orders page. Let me know if you need any help!";

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerMessages() {
  usePageTitle('Messages');
  const [activeId, setActiveId] = useState<number>(1);
  const [reply,    setReply]    = useState('');

  const activeConvo = CONVERSATIONS.find(c => c.id === activeId)!;
  const av = avatarColors[activeConvo.initials] ?? { bg: '#F0EEE6', color: '#5A5852' };

  return (
    <>
      <SellerPageHeader
        title="Messages"
        subtitle="Respond to buyer questions and support requests."
        actions={
          <span className="px-3 py-1 bg-[#FDECEA] rounded-[6px] text-xs font-semibold text-[#C0392B]">
            4 Unread
          </span>
        }
      />

      {/* 2-col layout */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 108px)' }}>

        {/* ── LEFT: Conversation list ── */}
        <div className="w-[300px] shrink-0 border-r border-[#E8E6DC] flex flex-col bg-white">

          {/* Search */}
          <div className="px-[14px] py-3 border-b border-[#E8E6DC]">
            <input
              type="text"
              placeholder="Search..."
              className="w-full text-[13px] text-[#4A4945] px-3 py-2 rounded-lg border border-[#E8E6DC] bg-white outline-none box-border"
            />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {CONVERSATIONS.map(convo => {
              const cav = avatarColors[convo.initials] ?? { bg: '#F0EEE6', color: '#5A5852' };
              const isActive = convo.id === activeId;
              return (
                <div
                  key={convo.id}
                  onClick={() => setActiveId(convo.id)}
                  className="relative px-4 py-[14px] border-b border-[#F0EEE6] cursor-pointer transition-[background] duration-[120ms]"
                  style={{ background: isActive ? '#FBECE4' : 'transparent' }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#FAF9F5'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Active left bar */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand-orange rounded-r-[3px]" />
                  )}

                  <div className="flex items-start gap-[10px]">
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0"
                      style={{ background: cav.bg, color: cav.color }}
                    >
                      {convo.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[13px] font-bold text-[#141413] overflow-hidden text-ellipsis whitespace-nowrap">{convo.name}</span>
                        <span className="text-[11px] text-[#8C8A82] shrink-0 ml-2">{convo.time}</span>
                      </div>
                      <p className="text-xs text-[#8C8A82] mb-0.5">{convo.subject}</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-[#4A4945] overflow-hidden text-ellipsis whitespace-nowrap flex-1">{convo.preview}</p>
                        {convo.unread && (
                          <div className="w-2 h-2 rounded-full bg-brand-orange shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: Chat panel ── */}
        <div className="flex-1 flex flex-col bg-[#FAF9F5] min-w-0">

          {/* Top bar */}
          <div className="bg-white border-b border-[#E8E6DC] px-5 py-3 flex items-center gap-3 shrink-0">
            <div
              className="w-[38px] h-[38px] rounded-full text-xs font-bold flex items-center justify-center shrink-0"
              style={{ background: av.bg, color: av.color }}
            >
              {activeConvo.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-[#141413] leading-[1.3]">{activeConvo.name}</p>
              <p className="text-xs text-[#8C8A82]">{activeConvo.subject}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-[5px] bg-white border border-[#E8E6DC] rounded-[7px] text-xs text-[#4A4945] cursor-pointer">Order History</button>
              <button className="px-3 py-[5px] bg-white border border-[#E8E6DC] rounded-[7px] text-xs text-[#4A4945] cursor-pointer">Block</button>
            </div>
          </div>

          {/* Message area */}
          <div className="flex-1 overflow-y-auto flex flex-col">

            {/* AI Suggested Reply */}
            <div className="bg-[#FBECE4] rounded-xl mx-5 mt-4 mb-3 px-4 py-[14px]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-[#B95A3A] mb-2 flex items-center gap-[5px]">
                    <Sparkles size={12} /> AI Suggested Reply
                  </p>
                  <p className="text-[13px] text-[#4A4945] leading-[1.6]">{AI_REPLY}</p>
                </div>
                <button
                  onClick={() => setReply(AI_REPLY)}
                  className="text-[13px] font-medium text-brand-orange cursor-pointer bg-transparent border-none whitespace-nowrap shrink-0"
                >
                  Use Reply
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="px-5 pb-4 flex flex-col gap-[14px]">

              {/* Buyer message (left) */}
              <div className="flex flex-col items-start max-w-[480px]">
                <div className="bg-[#FBECE4] rounded-xl px-4 py-3">
                  <p className="text-[13px] text-[#4A4945] leading-[1.6]">
                    Hi! I just purchased the Grade 5 Math Bundle. Can I use this for multiple classrooms at my school?
                  </p>
                </div>
                <span className="text-[11px] text-[#8C8A82] mt-1 ml-1">2:14 PM</span>
              </div>

              {/* Seller message (right) */}
              <div className="flex flex-col items-end ml-auto max-w-[480px]">
                <div className="bg-[#141413] rounded-xl px-4 py-3">
                  <p className="text-[13px] text-white leading-[1.6]">
                    Hi Sarah! Great question. The standard license covers a single classroom. For multiple classrooms, I'd recommend the School License which gives access for up to 30 teachers — it's $149. Would that work for you?
                  </p>
                </div>
                <span className="text-[11px] text-[#8C8A82] mt-1 mr-1">2:16 PM</span>
              </div>
            </div>
          </div>

          {/* Reply input */}
          <div className="border-t border-[#E8E6DC] px-5 py-[14px] flex gap-3 bg-white shrink-0">
            <textarea
              placeholder="Type your reply..."
              rows={3}
              value={reply}
              onChange={e => setReply(e.target.value)}
              className="flex-1 border border-[#E8E6DC] rounded-[10px] px-[14px] py-[10px] text-[13px] text-[#4A4945] resize-none outline-none bg-white leading-[1.5]"
            />
            <div className="flex flex-col justify-end">
              <button className="px-5 py-[9px] bg-brand-orange border-none rounded-lg text-[13px] font-semibold text-white cursor-pointer">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
