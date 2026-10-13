import { useEffect, useState } from 'react';
import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { Button } from '@/components/comman/ui';
import { apiUpdateAnnouncementBar, type StoreAnnouncementBar as StoreAnnouncementBarValue } from '@/api/services/store';
import { AnnouncementForm } from '@/features/seller/store/Dashboard/OnlineStore/themes/AnnouncementForm';
import { DEFAULT_ANNOUNCEMENT } from '@/features/seller/store/Dashboard/OnlineStore/themes/announcementDefaults';

/** Online Store → Announcement Bar. The same form as Themes → Header & Footer → Announcement (one editor, one
 *  save path); it writes straight to the live storefront, subject to the on/off switch and the schedule. */
export default function StoreAnnouncementBar() {
  const { storeId, store, refetch: refetchStore } = useStoreWorkspace();
  const [form, setForm] = useState<StoreAnnouncementBarValue>(DEFAULT_ANNOUNCEMENT);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (store && !loaded) {
      setForm(store.announcementBar ?? DEFAULT_ANNOUNCEMENT);
      setLoaded(true);
    }
  }, [store, loaded]);

  async function save() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await apiUpdateAnnouncementBar(storeId, form);
      setForm(res.data);
      refetchStore();
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save announcement bar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <StorePageHeader
        title="Announcement Bar"
        subtitle={'A bar shown on your storefront — e.g. "Free Shipping" or "Ramadan Sale, 20% Off". Changes go live as soon as you save.'}
      />
      <div className="p-4 md:p-7">
        <div className="bg-white border border-bone rounded-[10px] px-[22px] py-5 flex flex-col gap-3.5 max-w-[560px]">
          <AnnouncementForm value={form} onChange={v => { setForm(v); setSaved(false); }} />
          {error && <p className="text-[12px] text-error">{error}</p>}
          {saved && <p className="text-[12px] text-success">Saved.</p>}
          <div>
            <Button onClick={save} loading={saving}>Save Announcement</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
