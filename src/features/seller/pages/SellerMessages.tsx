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

const poppins = "'Poppins', sans-serif";

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
          <span style={{ padding: '4px 12px', background: '#FDECEA', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#C0392B', fontFamily: poppins }}>
            4 Unread
          </span>
        }
      />

      {/* 2-col layout */}
      <div style={{ display: 'flex', flex: 1, height: 'calc(100vh - 108px)', overflow: 'hidden', fontFamily: poppins }}>

        {/* ── LEFT: Conversation list ── */}
        <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid #E8E6DC', display: 'flex', flexDirection: 'column', background: '#fff' }}>

          {/* Search */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #E8E6DC' }}>
            <input
              type="text"
              placeholder="Search..."
              style={{
                width: '100%', fontSize: 13, color: '#4A4945', padding: '8px 12px',
                borderRadius: 8, border: '1px solid #E8E6DC', background: '#fff',
                outline: 'none', fontFamily: poppins, boxSizing: 'border-box',
              }}
            />
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {CONVERSATIONS.map(convo => {
              const cav = avatarColors[convo.initials] ?? { bg: '#F0EEE6', color: '#5A5852' };
              const isActive = convo.id === activeId;
              return (
                <div
                  key={convo.id}
                  onClick={() => setActiveId(convo.id)}
                  style={{
                    position: 'relative', padding: '14px 16px',
                    borderBottom: '1px solid #F0EEE6', cursor: 'pointer',
                    background: isActive ? '#FBECE4' : 'transparent',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#FAF9F5'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Active left bar */}
                  {isActive && (
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#D97757', borderRadius: '0 3px 3px 0' }} />
                  )}

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    {/* Avatar */}
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: cav.bg, color: cav.color, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {convo.initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#141413', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{convo.name}</span>
                        <span style={{ fontSize: 11, color: '#8C8A82', flexShrink: 0, marginLeft: 8 }}>{convo.time}</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#8C8A82', marginBottom: 2 }}>{convo.subject}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <p style={{ fontSize: 12, color: '#4A4945', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{convo.preview}</p>
                        {convo.unread && (
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D97757', flexShrink: 0 }} />
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#FAF9F5', minWidth: 0 }}>

          {/* Top bar */}
          <div style={{ background: '#fff', borderBottom: '1px solid #E8E6DC', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: av.bg, color: av.color, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {activeConvo.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#141413', lineHeight: 1.3 }}>{activeConvo.name}</p>
              <p style={{ fontSize: 12, color: '#8C8A82' }}>{activeConvo.subject}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button style={{ padding: '5px 12px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 7, fontSize: 12, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>Order History</button>
              <button style={{ padding: '5px 12px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 7, fontSize: 12, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>Block</button>
            </div>
          </div>

          {/* Message area */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

            {/* AI Suggested Reply */}
            <div style={{ background: '#FBECE4', borderRadius: 12, margin: '16px 20px 12px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#B95A3A', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Sparkles size={12} /> AI Suggested Reply
                  </p>
                  <p style={{ fontSize: 13, color: '#4A4945', lineHeight: 1.6 }}>{AI_REPLY}</p>
                </div>
                <button
                  onClick={() => setReply(AI_REPLY)}
                  style={{ fontSize: 13, fontWeight: 500, color: '#D97757', cursor: 'pointer', background: 'none', border: 'none', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: poppins }}
                >
                  Use Reply
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Buyer message (left) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: 480 }}>
                <div style={{ background: '#FBECE4', borderRadius: 12, padding: '12px 16px' }}>
                  <p style={{ fontSize: 13, color: '#4A4945', lineHeight: 1.6 }}>
                    Hi! I just purchased the Grade 5 Math Bundle. Can I use this for multiple classrooms at my school?
                  </p>
                </div>
                <span style={{ fontSize: 11, color: '#8C8A82', marginTop: 4, marginLeft: 4 }}>2:14 PM</span>
              </div>

              {/* Seller message (right) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: 'auto', maxWidth: 480 }}>
                <div style={{ background: '#141413', borderRadius: 12, padding: '12px 16px' }}>
                  <p style={{ fontSize: 13, color: '#fff', lineHeight: 1.6 }}>
                    Hi Sarah! Great question. The standard license covers a single classroom. For multiple classrooms, I'd recommend the School License which gives access for up to 30 teachers — it's $149. Would that work for you?
                  </p>
                </div>
                <span style={{ fontSize: 11, color: '#8C8A82', marginTop: 4, marginRight: 4 }}>2:16 PM</span>
              </div>
            </div>
          </div>

          {/* Reply input */}
          <div style={{ borderTop: '1px solid #E8E6DC', padding: '14px 20px', display: 'flex', gap: 12, background: '#fff', flexShrink: 0 }}>
            <textarea
              placeholder="Type your reply..."
              rows={3}
              value={reply}
              onChange={e => setReply(e.target.value)}
              style={{
                flex: 1, border: '1px solid #E8E6DC', borderRadius: 10,
                padding: '10px 14px', fontSize: 13, color: '#4A4945',
                resize: 'none', outline: 'none', fontFamily: poppins,
                background: '#fff', lineHeight: 1.5,
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <button style={{ padding: '9px 20px', background: '#D97757', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: poppins }}>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}