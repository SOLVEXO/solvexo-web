import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
 * will.
 *
 * Dismissing collapses smoothly (height+opacity, ~260ms — this app's
 * `--duration-normal` token) instead of an abrupt unmount, so whatever sits
 * below it doesn't jump. `initial={false}` on the inner motion.div
 * deliberately skips any entrance transition — a newly-fetched/first-load
 * announcement should just appear, only the dismiss/exit is animated. */
export function AnnouncementBanner({ audience, className }: AnnouncementBannerProps) {
  const announcements = useActiveAnnouncements(audience);
  const [dismissedIds, setDismissedIds] = useState<string[]>(getDismissedBannerIds());

  useEffect(() => { setDismissedIds(getDismissedBannerIds()); }, [announcements]);

  const active = announcements.find((a) => !dismissedIds.includes(a._id));

  return (
    <AnimatePresence initial={false}>
      {active && (
        <motion.div
          key={active._id}
          initial={false}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
          style={{ overflow: 'hidden' }}
        >
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
