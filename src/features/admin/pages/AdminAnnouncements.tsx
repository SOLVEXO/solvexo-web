import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';

// ── Data ──────────────────────────────────────────────────────────────────────
interface Announcement {
  id: number; title: string; body: string;
  audience: string; status: 'Published' | 'Draft' | 'Scheduled'; date: string;
}

const ANNOUNCEMENTS: Announcement[] = [
  { id: 1, title: 'Platform Maintenance — May 18, 2025',  body: 'We will be performing scheduled maintenance on May 18 from 2:00 AM – 4:00 AM UTC. Some services may be temporarily unavailable.', audience: 'All Users',    status: 'Published', date: 'May 15, 2025' },
  { id: 2, title: 'New Seller Feature: AI Studio Launch', body: 'We are excited to introduce AI Studio — a suite of AI-powered tools to help you write better listings, optimize prices and build worksheets.', audience: 'Sellers Only', status: 'Published', date: 'May 10, 2025' },
  { id: 3, title: 'Summer Sale Promotion — June 2025',    body: "Get ready for the Solvexo Summer Sale! Sellers can opt-in to participate and receive featured placement on the marketplace homepage.", audience: 'Sellers Only', status: 'Draft',     date: 'May 18, 2025' },
  { id: 4, title: 'Updated Seller Terms of Service',      body: 'Our seller terms of service have been updated. Please review the changes before June 1, 2025.', audience: 'All Users',    status: 'Scheduled', date: 'Jun 1, 2025'  },
];

const statusStyle: Record<string, { bg: string; color: string }> = {
  Published: { bg: '#E3F4EA', color: '#1E7A3C' },
  Draft:     { bg: '#F0EEE6', color: '#5A5852' },
  Scheduled: { bg: '#EAF0FB', color: '#2156A8' },
};

const poppins   = "'Poppins', sans-serif";
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid #E8E6DC', borderRadius: 8, outline: 'none', fontFamily: poppins, color: '#2C2A28', background: '#fff', boxSizing: 'border-box' as const };
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: '#4A4945', marginBottom: 5, display: 'block', fontFamily: poppins };

// ── Component ─────────────────────────────────────────────────────────────────
export function AdminAnnouncements() {
  usePageTitle('Announcements');
  const [announcements, setAnnouncements] = useState<Announcement[]>(ANNOUNCEMENTS);
  const [title,    setTitle]    = useState('');
  const [body,     setBody]     = useState('');
  const [audience, setAudience] = useState('All Users');

  const createEntry = (status: 'Published' | 'Draft') => {
    if (!title) return;
    setAnnouncements(prev => [{
      id: Date.now(), title, body, audience, status,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }, ...prev]);
    setTitle(''); setBody('');
  };

  const remove = (id: number) => setAnnouncements(prev => prev.filter(a => a.id !== id));

  return (
    <div style={{ padding: '24px 28px 32px', display: 'flex', flexDirection: 'column', gap: 20, fontFamily: poppins }}>

      {/* ── Header ── */}
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#141413', marginBottom: 3 }}>Announcements</h1>
        <p style={{ fontSize: 12, color: '#8C8A82' }}>Broadcast platform-wide messages to users and sellers.</p>
      </div>

      {/* ── Create form ── */}
      <div style={{ ...cardStyle, padding: '20px 22px' }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#141413', marginBottom: 18 }}>Create Announcement</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input placeholder="Announcement title…" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Message</label>
            <textarea rows={4} placeholder="Write your announcement message here…" value={body} onChange={e => setBody(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
          </div>
          <div style={{ maxWidth: 260 }}>
            <label style={labelStyle}>Audience</label>
            <select value={audience} onChange={e => setAudience(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option>All Users</option>
              <option>Sellers Only</option>
              <option>Buyers Only</option>
              <option>Admins Only</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => createEntry('Published')} style={{ padding: '9px 20px', background: '#D97757', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: poppins }}>
              Publish Now
            </button>
            <button onClick={() => createEntry('Draft')} style={{ padding: '9px 18px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 13, fontWeight: 500, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>
              Save as Draft
            </button>
          </div>
        </div>
      </div>

      {/* ── Announcements list ── */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 10px' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#141413' }}>All Announcements</p>
        </div>
        <div>
          {announcements.map((ann, i) => {
            const ss = statusStyle[ann.status] ?? { bg: '#F0EEE6', color: '#5A5852' };
            return (
              <div
                key={ann.id}
                style={{ padding: '14px 20px', borderBottom: i < announcements.length - 1 ? '1px solid #F0EEE6' : 'none', transition: 'background 0.12s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#141413', fontFamily: poppins }}>{ann.title}</p>
                      <span style={{ padding: '2px 9px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: ss.bg, color: ss.color, flexShrink: 0 }}>{ann.status}</span>
                      <span style={{ padding: '2px 9px', borderRadius: 5, fontSize: 11, fontWeight: 500, background: '#F0EEE6', color: '#5A5852', flexShrink: 0 }}>{ann.audience}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#8C8A82', lineHeight: 1.5, marginBottom: 4, fontFamily: poppins }}>{ann.body}</p>
                    <p style={{ fontSize: 11, color: '#B0AEA8', fontFamily: poppins }}>{ann.date}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <button style={{ fontSize: 12, color: '#8C8A82', background: 'none', border: 'none', cursor: 'pointer', fontFamily: poppins }}>Edit</button>
                    <button onClick={() => remove(ann.id)} style={{ fontSize: 12, color: '#C13030', background: 'none', border: 'none', cursor: 'pointer', fontFamily: poppins }}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}