import { useState } from 'react';
import { Megaphone, HelpCircle, Quote, MessageCircle, type LucideIcon } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { AdminPageHeader } from '@/components/comman/ui/AdminPageHeader';
import { AdminAnnouncements } from './AdminAnnouncements';
import { AdminFaqs } from './AdminFaqs';
import { AdminTestimonials } from './AdminTestimonials';
import { AdminContactMessages } from './AdminContactMessages';

// ── Site Content — consolidates 4 previously-separate top-level admin pages
// (Announcements, FAQs, Testimonials, Contact Messages) into one nav entry.
// All 4 manage the SAME kind of thing — Solvexo's own public marketing site
// content — not seller-facing store tooling, so they never needed 4 separate
// sidebar slots. Each page component below is completely untouched (same
// file, same exports, same backend calls) — only how it's reached changed,
// from its own route to a tab here. Each still renders its own inline
// header/stats strip when active, which doubles as this tab's sub-header.
type ContentTab = 'announcements' | 'faqs' | 'testimonials' | 'contact';

const TABS: { id: ContentTab; label: string; Icon: LucideIcon }[] = [
  { id: 'announcements', label: 'Announcements',    Icon: Megaphone     },
  { id: 'faqs',           label: 'FAQs',              Icon: HelpCircle    },
  { id: 'testimonials',   label: 'Testimonials',      Icon: Quote         },
  { id: 'contact',        label: 'Contact Messages',  Icon: MessageCircle },
];

export function AdminSiteContent() {
  usePageTitle('Site Content');
  const [tab, setTab] = useState<ContentTab>('announcements');

  return (
    <div>
      <AdminPageHeader title="Site Content" subtitle="Solvexo's own public site — announcements, FAQs, testimonials, and the contact inbox." />

      <div className="px-4 sm:px-7 pt-2">
        <div className="border-b border-bone overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-0.5 w-max">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 shrink-0 whitespace-nowrap px-3 sm:px-4 py-2.5 text-[13px] font-medium cursor-pointer border-none bg-transparent -mb-px transition-colors duration-150 hover:text-brand-orange rounded-t-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50"
                style={{ borderBottom: `2px solid ${tab === t.id ? '#D97757' : 'transparent'}`, color: tab === t.id ? '#D97757' : '#8C8A82' }}
              >
                <t.Icon size={14} className="shrink-0" /> {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === 'announcements' && <AdminAnnouncements />}
      {tab === 'faqs' && <AdminFaqs />}
      {tab === 'testimonials' && <AdminTestimonials />}
      {tab === 'contact' && <AdminContactMessages />}
    </div>
  );
}
