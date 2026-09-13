import { useEffect, useState } from 'react';
import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { Button } from '@/components/comman/ui';
import { apiUpdateAnnouncementBar, type StoreAnnouncementType } from '@/api/services/store';

// ── Extracted out of Marketing.tsx — same relocation as StoreBanners.tsx
// (see its doc comment). Same `apiUpdateAnnouncementBar` call, same shape. ──

const ANNOUNCEMENT_TYPES: StoreAnnouncementType[] = ['info', 'sale', 'coupon', 'warning', 'shipping', 'holiday'];
const INPUT_CLS = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border transition-shadow duration-150 focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange/50';

export default function StoreAnnouncementBar() {
  const { store, storeId } = useStoreWorkspace();

  const [announcement, setAnnouncement] = useState({
    message: '', type: 'info' as StoreAnnouncementType, ctaLabel: '', ctaLink: '', isActive: false, startAt: '', endAt: '',
  });
  const [announcementSaving, setAnnouncementSaving] = useState(false);
  const [announcementError, setAnnouncementError] = useState('');
  const [announcementSaved, setAnnouncementSaved] = useState(false);

  useEffect(() => {
    if (!store?.announcementBar) return;
    const bar = store.announcementBar;
    setAnnouncement({
      message: bar.message ?? '',
      type: bar.type ?? 'info',
      ctaLabel: bar.ctaLabel ?? '',
      ctaLink: bar.ctaLink ?? '',
      isActive: bar.isActive ?? false,
      startAt: bar.startAt ? bar.startAt.slice(0, 16) : '',
      endAt: bar.endAt ? bar.endAt.slice(0, 16) : '',
    });
  }, [store?.announcementBar]);

  async function saveAnnouncement() {
    setAnnouncementSaving(true);
    setAnnouncementError('');
    setAnnouncementSaved(false);
    try {
      await apiUpdateAnnouncementBar(storeId, {
        message: announcement.message || null,
        type: announcement.type,
        ctaLabel: announcement.ctaLabel || null,
        ctaLink: announcement.ctaLink || null,
        isActive: announcement.isActive,
        startAt: announcement.startAt ? new Date(announcement.startAt).toISOString() : null,
        endAt: announcement.endAt ? new Date(announcement.endAt).toISOString() : null,
      });
      setAnnouncementSaved(true);
    } catch (err) {
      setAnnouncementError(err instanceof Error ? err.message : 'Failed to save announcement bar.');
    } finally {
      setAnnouncementSaving(false);
    }
  }

  return (
    <div>
      <StorePageHeader
        title="Announcement Bar"
        subtitle={'A dismissible bar shown at the top of your storefront — e.g. "Free Shipping" or "Ramadan Sale, 20% Off".'}
      />

      <div className="p-4 md:p-7">
        <div className="bg-white border border-bone rounded-[10px] px-[22px] py-5 flex flex-col gap-3.5 max-w-[560px]">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-charcoal">Active</span>
            <input type="checkbox" checked={announcement.isActive} onChange={e => setAnnouncement(f => ({ ...f, isActive: e.target.checked }))} className="cursor-pointer" />
          </div>
          <div>
            <label className="text-xs font-medium text-graphite mb-[5px] block">Message</label>
            <input value={announcement.message} onChange={e => setAnnouncement(f => ({ ...f, message: e.target.value }))} placeholder="e.g. Free shipping on all orders this week!"
              className={INPUT_CLS} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-medium text-graphite mb-[5px] block">Type</label>
              <select value={announcement.type} onChange={e => setAnnouncement(f => ({ ...f, type: e.target.value as StoreAnnouncementType }))} className={`${INPUT_CLS} cursor-pointer`}>
                {ANNOUNCEMENT_TYPES.map(t => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-graphite mb-[5px] block">CTA Label (optional)</label>
              <input value={announcement.ctaLabel} onChange={e => setAnnouncement(f => ({ ...f, ctaLabel: e.target.value }))} placeholder="Shop Now" className={INPUT_CLS} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-graphite mb-[5px] block">CTA Link (optional)</label>
            <input value={announcement.ctaLink} onChange={e => setAnnouncement(f => ({ ...f, ctaLink: e.target.value }))} placeholder="https://…" className={INPUT_CLS} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-medium text-graphite mb-[5px] block">Starts (optional)</label>
              <input type="datetime-local" value={announcement.startAt} onChange={e => setAnnouncement(f => ({ ...f, startAt: e.target.value }))} className={INPUT_CLS} />
            </div>
            <div>
              <label className="text-xs font-medium text-graphite mb-[5px] block">Ends (optional)</label>
              <input type="datetime-local" value={announcement.endAt} onChange={e => setAnnouncement(f => ({ ...f, endAt: e.target.value }))} className={INPUT_CLS} />
            </div>
          </div>
          {announcementError && <p className="text-[12px] text-error">{announcementError}</p>}
          {announcementSaved && <p className="text-[12px] text-success">Saved.</p>}
          <div>
            <Button onClick={saveAnnouncement} loading={announcementSaving}>Save Announcement</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
