import { useState } from 'react';
import { Card } from '@/components/comman/ui/Card';
import { Button } from '@/components/comman/ui/Button';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { SeoMetaForm, type SeoMetaFormValue } from '@/components/comman/seo';
import { useStoreSeo, useUpdateStoreSeo } from '@/hooks/seller/seo/useSeoDashboard';
import { apiUpdateStoreRobotsTxt } from '@/api/services/store';

interface StoreTabProps {
  storeId: string;
  storeSlug?: string;
}

const DEFAULT_ROBOTS_TXT = 'User-agent: *\nAllow: /\nDisallow: /account\nDisallow: /cart\nDisallow: /checkout\n';

export function StoreTab({ storeId, storeSlug }: StoreTabProps) {
  const { data, loading, error, refetch } = useStoreSeo(storeId);
  const { updateStoreSeo, submitting, error: saveError } = useUpdateStoreSeo();
  const [form, setForm] = useState<SeoMetaFormValue>({});
  const [initialized, setInitialized] = useState(false);
  const [robotsTxt, setRobotsTxt] = useState('');
  const [robotsInitialized, setRobotsInitialized] = useState(false);
  const [savingRobots, setSavingRobots] = useState(false);
  const [robotsMsg, setRobotsMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (data && !initialized) {
    setForm(data);
    setInitialized(true);
  }
  if (data && !robotsInitialized) {
    setRobotsTxt(data.robotsTxtOverride ?? '');
    setRobotsInitialized(true);
  }

  if (error) return <AnalyticsErrorState message={error} onRetry={refetch} />;

  const handleSave = async () => {
    const ok = await updateStoreSeo(storeId, form);
    if (ok) refetch();
  };

  const handleSaveRobots = async () => {
    setSavingRobots(true); setRobotsMsg(null);
    try {
      await apiUpdateStoreRobotsTxt(storeId, robotsTxt.trim() || null);
      refetch();
      setRobotsMsg({ ok: true, text: 'robots.txt saved.' });
    } catch (err) {
      setRobotsMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to save robots.txt.' });
    } finally {
      setSavingRobots(false);
    }
  };

  const handleResetRobots = () => setRobotsTxt('');

  return (
    <div className="flex flex-col gap-5 max-w-[640px]">
      <Card>
        <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
          <p className="text-[15px] font-bold text-carbon">Store-level SEO</p>
          <Button variant="primary" size="sm" loading={submitting} onClick={handleSave}>Save Changes</Button>
        </div>
        {saveError && <p className="text-[12px] text-error mb-3">{saveError}</p>}
        <SeoMetaForm
          value={form}
          onChange={patch => setForm(f => ({ ...f, ...patch }))}
          loading={loading}
          previewUrl={storeSlug ? `https://solvexo.store/${storeSlug}` : undefined}
        />
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
          <p className="text-[15px] font-bold text-carbon">robots.txt</p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleResetRobots} disabled={!robotsTxt}>Reset to default</Button>
            <Button variant="primary" size="sm" loading={savingRobots} onClick={handleSaveRobots}>Save</Button>
          </div>
        </div>
        <p className="text-[12px] text-slate mb-3">
          Controls which parts of your storefront search engines are allowed to crawl. Leave blank to use the default below.
        </p>
        {robotsMsg && <p className={`text-[12px] mb-2 ${robotsMsg.ok ? 'text-success' : 'text-error'}`}>{robotsMsg.text}</p>}
        <textarea
          value={robotsTxt}
          onChange={e => setRobotsTxt(e.target.value)}
          placeholder={DEFAULT_ROBOTS_TXT}
          rows={8}
          spellCheck={false}
          className="w-full px-3 py-2.5 rounded-lg text-[12.5px] font-mono border border-bone bg-bone text-charcoal outline-none box-border resize-y"
        />
      </Card>
    </div>
  );
}
