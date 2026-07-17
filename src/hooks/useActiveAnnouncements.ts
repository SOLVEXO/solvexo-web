import { useEffect, useState } from 'react';
import { apiGetActiveAnnouncements } from '@/api/services/announcements/announcements';
import type { Announcement } from '@/api/services/announcements/adminAnnouncements';

export function useActiveAnnouncements(audience: 'buyers' | 'sellers') {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    let cancelled = false;
    apiGetActiveAnnouncements(audience)
      .then((res) => { if (!cancelled) setAnnouncements(res.data ?? []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [audience]);

  return announcements;
}
