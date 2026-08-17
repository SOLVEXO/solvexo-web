import { useEffect, useState } from 'react';
import { Megaphone, X } from 'lucide-react';
import { useActiveAnnouncements } from '@/hooks/useActiveAnnouncements';
import { getDismissedBannerIds, dismissBanner } from '@/utils/dismissedBanners';

interface AnnouncementBannerProps {
  audience: 'buyers' | 'sellers';
  className?: string;
}

/** Platform-wide announcement bar — shows the latest non-dismissed published
 * announcement targeted at this audience. Dismissal is per-announcement and
 * persisted in localStorage so it won't reappear, but a *new* announcement
 * will. */
export function AnnouncementBanner({ audience, className }: AnnouncementBannerProps) {
  const announcements = useActiveAnnouncements(audience);
  const [dismissedIds, setDismissedIds] = useState<string[]>(getDismissedBannerIds());

  useEffect(() => { setDismissedIds(getDismissedBannerIds()); }, [announcements]);

  const active = announcements.find((a) => !dismissedIds.includes(a._id));
  if (!active) return null;

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 bg-brand-pale-orange border-b border-brand-orange/20 ${className ?? ''}`}>
      <Megaphone size={15} className="text-brand-deep-orange shrink-0" />
      <div className="flex-1 min-w-0 flex items-baseline gap-2 flex-wrap">
        <p className="text-[13px] font-semibold text-brand-deep-orange">{active.title}</p>
        <p className="text-[12.5px] text-brand-deep-orange/80 truncate">{active.message}</p>
      </div>
      <button
        onClick={() => { dismissBanner(active._id); setDismissedIds((d) => [...d, active._id]); }}
        aria-label="Dismiss announcement"
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-transparent border-0 cursor-pointer text-brand-deep-orange/70 hover:bg-white/50"
      >
        <X size={14} />
      </button>
    </div>
  );
}
