import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { Button } from '@/components/comman/ui/Button';
import { ImageUpload, SkeletonBox } from '@/components/comman/ui';
import { apiGetStoreSeo, apiUpdateStoreSeo } from '@/api/services/seo/seller/dashboard.service';

const INPUT = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange';

/** Online Store → Preferences: how the storefront home page appears in browser tabs, Google and when shared. */
export default function OnlineStorePreferences() {
  const { storeId, store } = useStoreWorkspace();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(() => {
    setError('');
    setLoaded(false);
    apiGetStoreSeo(storeId)
      .then(res => {
        setMetaTitle(res.data?.metaTitle ?? '');
        setMetaDescription(res.data?.metaDescription ?? '');
        setOgImage(res.data?.ogImage ?? '');
        setLoaded(true);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load your preferences.'));
  }, [storeId]);
  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await apiUpdateStoreSeo(storeId, { metaTitle: metaTitle.trim(), metaDescription: metaDescription.trim(), ogImage });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your preferences.');
    } finally {
      setSaving(false);
    }
  }

  const titlePreview = metaTitle.trim() || store?.name || 'Your store';
  return (
    <>
      <StorePageHeader title="Preferences" subtitle="How your home page shows up in browser tabs, search results and when someone shares your link." />
      <div className="p-4 md:p-7 max-w-[640px] flex flex-col gap-5">
        {!loaded && !error ? (
          <SkeletonBox height={240} rounded="10px" />
        ) : (
          <>
            <section className="bg-white border border-bone rounded-[10px] p-5 flex flex-col gap-4">
              <h2 className="text-[14px] font-semibold text-charcoal m-0">Home page</h2>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-charcoal">Title</span>
                <input value={metaTitle} onChange={e => { setMetaTitle(e.target.value); setSaved(false); }} maxLength={70} placeholder={store?.name ?? 'Your store name'} className={INPUT} />
                <span className="text-[11px] text-slate">{metaTitle.length}/70 — empty uses your store name.</span>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-charcoal">Description</span>
                <textarea value={metaDescription} onChange={e => { setMetaDescription(e.target.value); setSaved(false); }} maxLength={160} rows={3} className={`${INPUT} resize-none`} />
                <span className="text-[11px] text-slate">{metaDescription.length}/160</span>
              </label>
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-charcoal">Social sharing image</span>
                <ImageUpload value={ogImage ? [ogImage] : []} onChange={urls => { setOgImage(urls[0] ?? ''); setSaved(false); }} maxFiles={1} storeId={storeId} />
                <span className="text-[11px] text-slate">Shown when your link is shared on WhatsApp, Facebook and similar. 1200×630 works best.</span>
              </div>
              <div className="border border-bone rounded-lg p-3 bg-cream" aria-label="Search result preview">
                <p className="m-0 text-[15px] text-[#1a0dab] truncate">{titlePreview}</p>
                <p className="m-0 text-[12px] text-[#006621] truncate">{store?.slug ? `${store.slug}.solvexo.store` : 'your-store.solvexo.store'}</p>
                <p className="m-0 text-[12.5px] text-slate line-clamp-2">{metaDescription.trim() || store?.description || 'Your description appears here.'}</p>
              </div>
              {error && <p className="text-[12px] text-error m-0">{error}</p>}
              {saved && <p className="text-[12px] text-success m-0">Saved.</p>}
              <div><Button onClick={save} loading={saving}>Save preferences</Button></div>
            </section>

            <section className="bg-white border border-bone rounded-[10px] p-5 flex flex-col gap-2">
              <h2 className="text-[14px] font-semibold text-charcoal m-0">More store settings</h2>
              <p className="text-[12.5px] text-slate m-0">Favicon, password protection and visibility live in <Link to="../settings" className="text-brand-orange font-semibold">Settings → General</Link>. Detailed page-by-page search settings are under <Link to="../seo" className="text-brand-orange font-semibold">SEO</Link>.</p>
            </section>
          </>
        )}
      </div>
    </>
  );
}
