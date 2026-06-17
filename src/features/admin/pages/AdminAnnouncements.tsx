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
    <div className="px-7 pt-6 pb-8 flex flex-col gap-5">

      {/* ── Header ── */}
      <div>
        <h1 className="text-[18px] font-bold text-charcoal mb-[3px]">Announcements</h1>
        <p className="text-[12px] text-slate">Broadcast platform-wide messages to users and sellers.</p>
      </div>

      {/* ── Create form ── */}
      <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-[22px] py-5">
        <p className="text-[14px] font-bold text-charcoal mb-[18px]">Create Announcement</p>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[12px] font-medium text-[#4A4945] mb-[5px] block">Title</label>
            <input placeholder="Announcement title…" value={title} onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none text-[#2C2A28] bg-white box-border" />
          </div>
          <div>
            <label className="text-[12px] font-medium text-[#4A4945] mb-[5px] block">Message</label>
            <textarea rows={4} placeholder="Write your announcement message here…" value={body} onChange={e => setBody(e.target.value)}
              className="w-full px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none text-[#2C2A28] bg-white box-border resize-y leading-[1.6]" />
          </div>
          <div className="max-w-[260px]">
            <label className="text-[12px] font-medium text-[#4A4945] mb-[5px] block">Audience</label>
            <select value={audience} onChange={e => setAudience(e.target.value)}
              className="w-full px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none text-[#2C2A28] bg-white box-border cursor-pointer">
              <option>All Users</option>
              <option>Sellers Only</option>
              <option>Buyers Only</option>
              <option>Admins Only</option>
            </select>
          </div>
          <div className="flex gap-[10px]">
            <button onClick={() => createEntry('Published')}
              className="px-5 py-[9px] bg-brand-orange border-none rounded-lg text-[13px] font-semibold text-white cursor-pointer">
              Publish Now
            </button>
            <button onClick={() => createEntry('Draft')}
              className="px-[18px] py-[9px] bg-white border border-bone rounded-lg text-[13px] font-medium text-[#4A4945] cursor-pointer">
              Save as Draft
            </button>
          </div>
        </div>
      </div>

      {/* ── Announcements list ── */}
      <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 pt-4 pb-[10px]">
          <p className="text-[14px] font-bold text-charcoal">All Announcements</p>
        </div>
        <div>
          {announcements.map((ann, i) => {
            const ss = statusStyle[ann.status] ?? { bg: '#F0EEE6', color: '#5A5852' };
            return (
              <div
                key={ann.id}
                className="px-5 py-[14px] transition-colors duration-[120ms]"
                style={{ borderBottom: i < announcements.length - 1 ? '1px solid #F0EEE6' : 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-[5px]">
                      <p className="text-[13px] font-semibold text-charcoal">{ann.title}</p>
                      <span className="px-[9px] py-[2px] rounded-[5px] text-[11px] font-semibold flex-shrink-0"
                        style={{ background: ss.bg, color: ss.color }}>{ann.status}</span>
                      <span className="px-[9px] py-[2px] rounded-[5px] text-[11px] font-medium bg-[#F0EEE6] text-[#5A5852] flex-shrink-0">{ann.audience}</span>
                    </div>
                    <p className="text-[12px] text-slate leading-[1.5] mb-1">{ann.body}</p>
                    <p className="text-[11px] text-[#B0AEA8]">{ann.date}</p>
                  </div>
                  <div className="flex items-center gap-[10px] flex-shrink-0">
                    <button className="text-[12px] text-slate bg-transparent border-none cursor-pointer">Edit</button>
                    <button onClick={() => remove(ann.id)} className="text-[12px] text-[#C13030] bg-transparent border-none cursor-pointer">Delete</button>
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
