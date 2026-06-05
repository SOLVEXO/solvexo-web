import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Input, Textarea, Select } from '@/components/ui/Input';

interface Announcement {
  id:       number;
  title:    string;
  body:     string;
  audience: string;
  status:   'Published' | 'Draft' | 'Scheduled';
  date:     string;
}

const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 1,
    title:    'Platform Maintenance — May 18, 2025',
    body:     'We will be performing scheduled maintenance on May 18 from 2:00 AM – 4:00 AM UTC. Some services may be temporarily unavailable.',
    audience: 'All Users',
    status:   'Published',
    date:     'May 15, 2025',
  },
  {
    id: 2,
    title:    'New Seller Feature: AI Studio Launch',
    body:     'We are excited to introduce AI Studio — a suite of AI-powered tools to help you write better listings, optimize prices and build worksheets.',
    audience: 'Sellers Only',
    status:   'Published',
    date:     'May 10, 2025',
  },
  {
    id: 3,
    title:    'Summer Sale Promotion — June 2025',
    body:     'Get ready for the Solvexo Summer Sale! Sellers can opt-in to participate and receive featured placement on the marketplace homepage.',
    audience: 'Sellers Only',
    status:   'Draft',
    date:     'May 18, 2025',
  },
  {
    id: 4,
    title:    'Updated Seller Terms of Service',
    body:     'Our seller terms of service have been updated. Please review the changes before June 1, 2025.',
    audience: 'All Users',
    status:   'Scheduled',
    date:     'Jun 1, 2025',
  },
];

const STATUS_COLORS: Record<string, 'green' | 'gray' | 'blue'> = {
  Published: 'green',
  Draft:     'gray',
  Scheduled: 'blue',
};

export function AdminAnnouncements() {
  usePageTitle('Announcements');
  const [announcements, setAnnouncements] = useState<Announcement[]>(ANNOUNCEMENTS);
  const [title,    setTitle]    = useState('');
  const [body,     setBody]     = useState('');
  const [audience, setAudience] = useState('All Users');

  const publish = () => {
    if (!title || !body) return;
    const next: Announcement = {
      id:       Date.now(),
      title,
      body,
      audience,
      status:   'Published',
      date:     new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    setAnnouncements(prev => [next, ...prev]);
    setTitle(''); setBody('');
  };

  const saveDraft = () => {
    if (!title) return;
    const next: Announcement = {
      id:       Date.now(),
      title,
      body,
      audience,
      status:   'Draft',
      date:     new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    setAnnouncements(prev => [next, ...prev]);
    setTitle(''); setBody('');
  };

  const remove = (id: number) =>
    setAnnouncements(prev => prev.filter(a => a.id !== id));

  return (
    <div className="p-7 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-[18px] font-bold text-carbon">Announcements</h1>
        <p className="text-[12px] text-slate mt-0.5">Broadcast platform-wide messages to users and sellers.</p>
      </div>

      {/* Create form */}
      <Card>
        <p className="text-[14px] font-bold text-carbon mb-4">Create Announcement</p>
        <div className="flex flex-col gap-4">
          <Input
            label="Title"
            placeholder="Announcement title…"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <Textarea
            label="Message"
            placeholder="Write your announcement message here…"
            rows={4}
            value={body}
            onChange={e => setBody(e.target.value)}
          />
          <div style={{ maxWidth: 260 }}>
            <Select label="Audience" value={audience} onChange={e => setAudience(e.target.value)}>
              <option>All Users</option>
              <option>Sellers Only</option>
              <option>Buyers Only</option>
              <option>Admins Only</option>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary"   size="md" onClick={publish}>Publish Now</Button>
            <Button variant="secondary" size="md" onClick={saveDraft}>Save as Draft</Button>
          </div>
        </div>
      </Card>

      {/* Announcements list */}
      <Card padding="none">
        <div className="px-5 pt-5 pb-3">
          <p className="text-[14px] font-bold text-carbon">All Announcements</p>
        </div>
        <div>
          {announcements.map((ann, i) => (
            <div
              key={ann.id}
              className={`px-5 py-4 ${i < announcements.length - 1 ? 'border-b border-bone' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[13px] font-semibold text-carbon">{ann.title}</p>
                    <Badge color={STATUS_COLORS[ann.status]}>{ann.status}</Badge>
                    <Badge color="gray">{ann.audience}</Badge>
                  </div>
                  <p className="text-[12px] text-slate mb-1">{ann.body}</p>
                  <p className="text-[11px]" style={{ color: '#B0AEA8' }}>{ann.date}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button className="text-[12px] text-slate hover:text-carbon cursor-pointer">Edit</button>
                  <button
                    onClick={() => remove(ann.id)}
                    className="text-[12px] cursor-pointer hover:underline"
                    style={{ color: '#C13030' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
