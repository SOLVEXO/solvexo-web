import { useEffect, useState } from 'react';
import { Image as ImageIcon, Pause, Play, Plus, Trash2 } from 'lucide-react';
import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { EmptyState, SkeletonBox, Modal, Button, FileDropSelect } from '@/components/comman/ui';
import {
  apiGetStoreBanners, apiCreateStoreBanner, apiCreateStoreBannerFromUrl, apiPauseStoreBanner, apiResumeStoreBanner, apiDeleteStoreBanner,
  STORE_BANNER_TYPES, STORE_BANNER_LINK_TYPES,
  type StoreBanner, type StoreBannerType, type StoreBannerLinkType,
} from '@/api/services/storeBanner';

// ── Extracted out of Marketing.tsx (which used to carry every storefront-
// content tab regardless of whether it was actually a "marketing" feature)
// into its natural home under "Online Store", alongside Themes/Pages/Menus/
// Blog — same relocation this app already did once for Discounts/Gift Cards
// moving into their own `Manage/` pages. No backend/data-model change: same
// `apiGetStoreBanners`/etc calls, same `StoreBanner` shape. ──

const BANNER_TYPE_LABEL: Record<StoreBannerType, string> = {
  hero: 'Hero', promotion: 'Promotion', season: 'Season', collection: 'Collection', video: 'Video',
};

const BANNER_STATUS_STYLE: Record<StoreBanner['status'], { bg: string; color: string; label: string }> = {
  active:    { bg: '#EAF7EF', color: '#1E7A3C', label: 'Active' },
  scheduled: { bg: '#FDF3E7', color: '#9A6A17', label: 'Scheduled' },
  paused:    { bg: '#F0EEE6', color: '#5A5852', label: 'Paused' },
  expired:   { bg: '#FBEAEA', color: '#B3261E', label: 'Expired' },
  draft:     { bg: '#F0EEE6', color: '#5A5852', label: 'Draft' },
};

const emptyBannerForm = {
  type: 'hero' as StoreBannerType,
  ctaLabel: '',
  linkType: 'external' as StoreBannerLinkType,
  linkTarget: '',
  startAt: '',
  endAt: '',
};

const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp';
const VIDEO_ACCEPT = 'video/mp4,video/webm';

// ── Store Banner create modal ──────────────────────────────────────────────────
function StoreBannerFormModal({ storeId, onClose, onSaved }: { storeId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(emptyBannerForm);
  const [file, setFile] = useState<File | null>(null);
  // "Paste a URL" alternative to the file picker below — image types only
  // (a Video banner still needs a real uploaded file, see the type-switch
  // guard below). Default stays the file picker for every banner type.
  const [source, setSource] = useState<'file' | 'url'>('file');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isVideo = form.type === 'video';

  // Switching type away from "Video" would otherwise leave a picked video
  // file sitting in state with no matching UI hint that it needs replacing.
  // Switching TO "Video" forces the source back to file — a video banner
  // can't be created via the URL path (see backend `createFromUrl`).
  function handleTypeChange(type: StoreBannerType) {
    setForm(f => ({ ...f, type }));
    setFile(null);
    if (type === 'video') { setSource('file'); setImageUrl(''); }
  }

  async function submit() {
    if (source === 'url') {
      if (!imageUrl.trim()) { setError('Please paste an image URL.'); return; }
    } else if (!file) {
      setError(isVideo ? 'Please choose a banner video.' : 'Please choose a banner image.');
      return;
    }
    setError('');
    setSaving(true);
    const fields = {
      type: form.type,
      ctaLabel: form.ctaLabel || undefined,
      linkType: form.linkType,
      linkTarget: form.linkTarget || undefined,
      startAt: form.startAt ? new Date(form.startAt).toISOString() : undefined,
      endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
    };
    try {
      if (source === 'url') {
        await apiCreateStoreBannerFromUrl(storeId, fields, imageUrl.trim());
      } else {
        await apiCreateStoreBanner(storeId, fields, file as File);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create store banner.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Add Store Banner"
      onClose={onClose}
      mobileSheet
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Add Banner</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-[12px] font-medium text-charcoal mb-1.5">Type</label>
          <select value={form.type} onChange={e => handleTypeChange(e.target.value as StoreBannerType)}
            className="w-full px-3 py-2 rounded-lg border border-bone text-[13px] bg-white outline-none cursor-pointer transition-colors duration-150 hover:border-slate/40 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10">
            {STORE_BANNER_TYPES.map(t => <option key={t} value={t}>{BANNER_TYPE_LABEL[t]}</option>)}
          </select>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[12px] font-medium text-charcoal">{isVideo ? 'Video' : 'Image'}</label>
            {!isVideo && (
              <div className="flex items-center gap-1 bg-cream rounded-md p-0.5">
                <button type="button" onClick={() => setSource('file')}
                  className={`px-2 py-[3px] rounded text-[11px] font-semibold border-none cursor-pointer ${source === 'file' ? 'bg-white text-charcoal shadow-sm' : 'bg-transparent text-slate'}`}>
                  Upload file
                </button>
                <button type="button" onClick={() => setSource('url')}
                  className={`px-2 py-[3px] rounded text-[11px] font-semibold border-none cursor-pointer ${source === 'url' ? 'bg-white text-charcoal shadow-sm' : 'bg-transparent text-slate'}`}>
                  Paste URL
                </button>
              </div>
            )}
          </div>
          {source === 'file' ? (
            <FileDropSelect value={file} onChange={setFile} accept={isVideo ? VIDEO_ACCEPT : IMAGE_ACCEPT} label={isVideo ? 'Click to upload banner video' : 'Click to upload banner image'} />
          ) : (
            <input
              type="url"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 rounded-lg border border-bone text-[13px] bg-white outline-none transition-colors duration-150 hover:border-slate/40 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10"
            />
          )}
          <p className="mt-1.5 text-[11px] text-slate/70">
            {isVideo
              ? 'MP4 or WebM, up to 50MB. A poster frame is generated for you automatically.'
              : 'Recommended: 2560×720px (minimum 1280px wide) — this renders full-width on every screen size, so anything narrower will look blurry.'}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-medium text-charcoal mb-1.5">Link Type</label>
            <select value={form.linkType} onChange={e => setForm(f => ({ ...f, linkType: e.target.value as StoreBannerLinkType }))}
              className="w-full px-3 py-2 rounded-lg border border-bone text-[13px] bg-white outline-none cursor-pointer transition-colors duration-150 hover:border-slate/40 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10">
              {STORE_BANNER_LINK_TYPES.map(t => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-charcoal mb-1.5">CTA Label (optional)</label>
            <input value={form.ctaLabel} onChange={e => setForm(f => ({ ...f, ctaLabel: e.target.value }))} placeholder="Shop Now"
              className="w-full px-3 py-2 rounded-lg border border-bone text-[13px] outline-none transition-shadow duration-150 focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange/50" />
          </div>
        </div>
        <div>
          <label className="block text-[12px] font-medium text-charcoal mb-1.5">Link Target</label>
          <input value={form.linkTarget} onChange={e => setForm(f => ({ ...f, linkTarget: e.target.value }))}
            placeholder={form.linkType === 'external' ? 'https://…' : 'Product/category/collection id'}
            className="w-full px-3 py-2 rounded-lg border border-bone text-[13px] outline-none transition-shadow duration-150 focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange/50" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-medium text-charcoal mb-1.5">Starts (optional)</label>
            <input type="datetime-local" value={form.startAt} onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-bone text-[13px] outline-none transition-shadow duration-150 focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange/50" />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-charcoal mb-1.5">Ends (optional)</label>
            <input type="datetime-local" value={form.endAt} onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-bone text-[13px] outline-none transition-shadow duration-150 focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange/50" />
          </div>
        </div>
        {error && <p className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function StoreBanners() {
  const { storeId } = useStoreWorkspace();

  const [storeBanners, setStoreBanners] = useState<StoreBanner[]>([]);
  const [storeBannersLoading, setStoreBannersLoading] = useState(true);
  const [storeBannersError, setStoreBannersError] = useState('');
  const [addingBanner, setAddingBanner] = useState(false);
  const [bannerBusyId, setBannerBusyId] = useState<string | null>(null);

  function refetchStoreBanners() {
    if (!storeId) return;
    setStoreBannersLoading(true);
    apiGetStoreBanners(storeId)
      .then(res => setStoreBanners(res.data ?? []))
      .catch(err => setStoreBannersError(err instanceof Error ? err.message : 'Failed to load store banners.'))
      .finally(() => setStoreBannersLoading(false));
  }

  useEffect(() => {
    refetchStoreBanners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  async function toggleBannerPause(b: StoreBanner) {
    setBannerBusyId(b._id);
    try {
      if (b.status === 'paused') await apiResumeStoreBanner(storeId, b._id);
      else await apiPauseStoreBanner(storeId, b._id);
      refetchStoreBanners();
    } catch {
      // best-effort — button just stays as-is on failure
    } finally {
      setBannerBusyId(null);
    }
  }

  async function removeBanner(b: StoreBanner) {
    setBannerBusyId(b._id);
    try {
      await apiDeleteStoreBanner(storeId, b._id);
      setStoreBanners(prev => prev.filter(x => x._id !== b._id));
    } catch {
      // best-effort
    } finally {
      setBannerBusyId(null);
    }
  }

  return (
    <div>
      <StorePageHeader
        title="Store Banners"
        subtitle="Hero, promotion, season, collection, and video banners for your storefront."
        actions={<Button icon={<Plus size={14} />} onClick={() => setAddingBanner(true)}>Add Banner</Button>}
      />

      <div className="p-4 md:p-7 flex flex-col gap-4">
        {storeBannersError && <p className="text-xs text-error">{storeBannersError}</p>}

        {storeBannersLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonBox key={i} height={160} rounded="10px" />)}
          </div>
        ) : storeBanners.length === 0 ? (
          <EmptyState
            icon={<ImageIcon size={28} className="text-brand-orange opacity-55" />}
            title="No store banners yet"
            description="Add a hero banner to make your storefront feel professional."
            action={{ label: 'Add Banner', onClick: () => setAddingBanner(true), icon: <Plus size={14} /> }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...storeBanners].sort((a, b) => b.priority - a.priority || a.order - b.order).map(b => {
              const st = BANNER_STATUS_STYLE[b.status] ?? BANNER_STATUS_STYLE.draft;
              return (
                <div key={b._id} className="bg-white border border-bone rounded-[10px] overflow-hidden flex flex-col transition-colors duration-200 hover:border-brand-orange/25">
                  <div className="aspect-[16/9] bg-cream">
                    <img loading="lazy" decoding="async" src={b.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3 flex flex-col gap-2 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="px-[8px] py-[2px] rounded-[5px] text-[11px] font-semibold" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                      <span className="text-[11px] text-slate">{BANNER_TYPE_LABEL[b.type]}</span>
                    </div>
                    {b.ctaLabel && <p className="text-[12px] text-charcoal font-medium truncate">{b.ctaLabel}</p>}
                    <div className="flex items-center gap-2 mt-auto pt-2">
                      <button onClick={() => toggleBannerPause(b)} disabled={bannerBusyId === b._id}
                        className="flex-1 px-[10px] py-[6px] rounded-[6px] text-[11px] font-medium text-charcoal bg-cream border border-bone cursor-pointer flex items-center justify-center gap-1 outline-none transition-colors duration-150 hover:bg-bone disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-brand-orange/50">
                        {b.status === 'paused' ? <Play size={11} /> : <Pause size={11} />} {b.status === 'paused' ? 'Resume' : 'Pause'}
                      </button>
                      <button onClick={() => removeBanner(b)} disabled={bannerBusyId === b._id}
                        className="px-[10px] py-[6px] rounded-[6px] text-[11px] font-medium text-error bg-error-bg border border-error-border cursor-pointer flex items-center justify-center gap-1 outline-none transition-colors duration-150 hover:bg-error hover:text-white disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-brand-orange/50">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {addingBanner && (
        <StoreBannerFormModal
          storeId={storeId}
          onClose={() => setAddingBanner(false)}
          onSaved={() => { setAddingBanner(false); refetchStoreBanners(); }}
        />
      )}
    </div>
  );
}
