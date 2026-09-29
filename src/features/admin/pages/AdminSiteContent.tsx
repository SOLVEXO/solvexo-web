import { Megaphone, HelpCircle, Quote, MessageCircle } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { TabBar, type Tab } from '@/components/comman/ui';
import { AdminAnnouncements } from './AdminAnnouncements';
import { AdminFaqs } from './AdminFaqs';
import { AdminTestimonials } from './AdminTestimonials';
import { AdminContactMessages } from './AdminContactMessages';
import { useKeepAliveTabs } from '@/hooks/useKeepAliveTabs';

// ── Site Content — consolidates 4 previously-separate top-level admin pages
// (Announcements, FAQs, Testimonials, Contact Messages) into one nav entry.
// All 4 manage the SAME kind of thing — Solvexo's own public marketing site
// content — not seller-facing store tooling, so they never needed 4 separate
// sidebar slots. Each page component below is completely untouched apart
// from accepting one extra `tabs` slot — same file, same exports, same
// backend calls — only how it's reached changed, from its own route to a
// tab here. `tabs` (this hub's shared TabBar) is rendered BY each child,
// right under its own sticky header and above its own content — same
// title-then-tabs vertical order as AdminAnalytics/AdminSEO — instead of
// this parent stacking a second, redundant title above the tabs itself.
type ContentTab = 'announcements' | 'faqs' | 'testimonials' | 'contact';

const TABS: Tab[] = [
  { id: 'announcements', label: 'Announcements',    icon: <Megaphone size={14} />     },
  { id: 'faqs',           label: 'FAQs',             icon: <HelpCircle size={14} />    },
  { id: 'testimonials',   label: 'Testimonials',     icon: <Quote size={14} />         },
  { id: 'contact',        label: 'Contact Messages', icon: <MessageCircle size={14} /> },
];

export function AdminSiteContent() {
  usePageTitle('Site Content');
  const { activeTab: tab, setActiveTab: setTab, isVisited, paneClassName } = useKeepAliveTabs<ContentTab>('announcements');

  const tabBar = <TabBar tabs={TABS} active={tab} onChange={(id) => setTab(id as ContentTab)} className="px-4 sm:px-7 mt-5" />;

  return (
    <div>
      {isVisited('announcements') && <div className={paneClassName('announcements')}><AdminAnnouncements tabs={tabBar} /></div>}
      {isVisited('faqs') && <div className={paneClassName('faqs')}><AdminFaqs tabs={tabBar} /></div>}
      {isVisited('testimonials') && <div className={paneClassName('testimonials')}><AdminTestimonials tabs={tabBar} /></div>}
      {isVisited('contact') && <div className={paneClassName('contact')}><AdminContactMessages tabs={tabBar} /></div>}
    </div>
  );
}
