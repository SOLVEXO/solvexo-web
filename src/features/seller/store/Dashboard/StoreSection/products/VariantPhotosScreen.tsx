import { lazy, Suspense, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { ArrowLeft, Check, FolderOpen, ImagePlus, Loader2, Search } from 'lucide-react';
import { clsx } from 'clsx';
import type { VariantRow } from './variantMatrix';
import { claimedByOthers, groupValue, photoLabels, rowName, sameGroupKeys, setRowImages } from './variantPhotos';
import { checkPhotos, MAX_PRODUCT_PHOTOS, PHOTO_ACCEPT, uploadPhotoFiles } from './productImageUpload';
import { ProductVideoField } from './ProductVideoField';

// Lazy: the Files Library picker (and its API calls) only loads when the seller opens it.
const MediaLibraryPickerModal = lazy(() =>
  import('@/features/seller/store/Dashboard/OnlineStore/builder/MediaLibraryPickerModal').then(m => ({ default: m.MediaLibraryPickerModal })),
);

type Tab = 'linked' | 'all' | 'free';
interface Pending { id: string; src: string }

/**
 * Full "Photos for <variant>" screen inside the Manage Variants dialog (Shopify's variant media, made easy):
 *  - upload photos right here: each shows at once with a spinner and is linked the moment it finishes;
 *  - or choose from the Files Library / from the photos the product already has;
 *  - an optional video for that colour;
 *  - when several variants share a colour (all sizes of Black) everything applies to all of them at once.
 * Every click is applied at once to the form (nothing to save here); "Back to variants" just returns.
 */
export function VariantPhotosScreen({
  rows, onRowsChange, rowKey, optionName, productImages, onProductImagesChange, storeId, onBack,
}: {
  rows: VariantRow[];
  onRowsChange: (next: VariantRow[]) => void;
  rowKey: string;
  optionName: string | null;
  productImages: string[];
  onProductImagesChange?: (next: string[]) => void;
  storeId?: string;
  onBack: () => void;
}) {
  const row = rows.find(r => r.key === rowKey);
  const groupKeys = useMemo(() => (row ? sameGroupKeys(rows, row, optionName) : []), [rows, row, optionName]);
  const groupLabel = row ? (groupValue(row, optionName) ?? rowName(row)) : '';
  const hasGroup = groupKeys.length > 1;
  const [applyToGroup, setApplyToGroup] = useState(true);
  const scope = hasGroup && applyToGroup ? groupKeys : row ? [row.key] : [];

  // The latest values. Uploads finish one by one in the background, so each result must build on what the
  // form holds NOW (the seller may have clicked meanwhile) and on the previous result of the same batch.
  const live = useRef({ rows, productImages, scope });
  useEffect(() => { live.current = { rows, productImages, scope }; });

  const [tab, setTab] = useState<Tab | null>(null);
  const [peek, setPeek] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const linked = useMemo(() => new Set(row?.images ?? []), [row]);
  const others = claimedByOthers(rows, scope);
  const labels = useMemo(() => photoLabels(rows), [rows]);
  const linkedList = productImages.filter(u => linked.has(u));
  const freeList = productImages.filter(u => !linked.has(u) && !others.has(u));
  const activeTab: Tab = tab ?? (linkedList.length > 0 ? 'linked' : 'all');
  const shown = activeTab === 'linked' ? linkedList : activeTab === 'free' ? freeList : productImages;

  if (!row) return null;

  // Apply to the form AND to the ref at once, so the next result of the same batch builds on this one.
  const applyRows = (next: VariantRow[]) => { live.current.rows = next; onRowsChange(next); };
  const applyImages = (next: string[]) => { live.current.productImages = next; onProductImagesChange?.(next); };

  const toggle = (url: string) => {
    const on = linked.has(url);
    applyRows(setRowImages(live.current.rows, live.current.scope, cur => (on ? cur.filter(u => u !== url) : cur.includes(url) ? cur : [...cur, url])));
  };
  const linkMany = (urls: string[]) => applyRows(setRowImages(live.current.rows, live.current.scope, cur => [...cur, ...urls.filter(u => !cur.includes(u))]));
  const unlinkMany = (urls: string[]) => applyRows(setRowImages(live.current.rows, live.current.scope, cur => cur.filter(u => !urls.includes(u))));
  const setVideo = (video: string) => applyRows(live.current.rows.map(r => (live.current.scope.includes(r.key) ? { ...r, video } : r)));

  const onFiles = async (picked: File[]) => {
    if (!storeId || picked.length === 0) return;
    const { files, notes: skipped } = checkPhotos(picked, MAX_PRODUCT_PHOTOS - live.current.productImages.length);
    setNotes(skipped);
    if (files.length === 0) return;
    // Show every photo right away (local preview + spinner); each one is linked as soon as its upload finishes.
    const items: Pending[] = files.map((f, i) => ({ id: `${Date.now()}-${i}`, src: URL.createObjectURL(f) }));
    setPending(p => [...items, ...p]);
    setTab('linked');
    let failed = 0;
    let firstError = '';
    await uploadPhotoFiles(storeId, files, (i, url, error) => {
      setPending(p => p.filter(x => x.id !== items[i].id));
      URL.revokeObjectURL(items[i].src);
      if (url) {
        applyImages([...live.current.productImages, url]);
        linkMany([url]);
      } else {
        failed++;
        if (!firstError) firstError = error;
      }
    });
    if (failed > 0) setNotes(n => [...n, `${failed} ${failed === 1 ? 'photo' : 'photos'} could not be uploaded${firstError ? `: ${firstError}` : '. Please try again.'}`]);
  };

  const onLibraryPicked = (urls: string[]) => {
    setLibraryOpen(false);
    const fresh = urls.filter(u => !live.current.productImages.includes(u));
    if (fresh.length) applyImages([...live.current.productImages, ...fresh]);
    linkMany(urls);
    setTab('linked');
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    void onFiles(Array.from(e.dataTransfer.files ?? []));
  };

  const uploading = pending.length > 0;
  const previewUrl = peek ?? linkedList[0] ?? productImages[0] ?? null;
  const previewLabels = previewUrl ? (labels[previewUrl] ?? []) : [];
  const tabs: { id: Tab; label: string; n: number }[] = [
    { id: 'linked', label: `Linked to ${groupLabel}`, n: linkedList.length },
    { id: 'all', label: 'All photos', n: productImages.length },
    { id: 'free', label: 'Not used yet', n: freeList.length },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-lg border-none bg-brand-orange px-3.5 py-2 text-[13px] font-semibold text-white cursor-pointer">
          <ArrowLeft size={14} /> Done, back to variants
        </button>
        <div className="min-w-0 text-right max-sm:text-left">
          <p className="truncate text-[15px] font-semibold text-charcoal">Photos and video for {groupLabel}</p>
          <p className="text-[12px] text-slate">Shoppers who pick {groupLabel} see these first, then your shared photos.</p>
        </div>
      </div>

      {hasGroup && (
        <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-bone bg-cream/60 px-3 py-2.5 text-[12.5px] text-charcoal">
          <input type="checkbox" className="mt-0.5" aria-label={`Apply to all ${groupLabel} variants`} checked={applyToGroup} onChange={e => setApplyToGroup(e.target.checked)} />
          <span>
            <b>Apply to all {groupKeys.length} {groupLabel} variants</b>
            <span className="block text-[11.5px] text-slate">
              {rows.filter(r => groupKeys.includes(r.key)).map(r => rowName(r)).join(', ')}. Untick to change only {rowName(row)}.
            </span>
          </span>
        </label>
      )}

      {storeId ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={clsx('flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors',
            dragOver ? 'border-brand-orange bg-brand-pale-orange' : 'border-bone bg-white')}
        >
          <ImagePlus size={22} className="text-brand-orange" />
          <p className="text-[13.5px] font-semibold text-charcoal">Add photos for {groupLabel}</p>
          <p className="text-[11.5px] text-slate">Drag and drop, or choose several at once. JPG, PNG or WebP, up to 20 MB each.</p>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
            <button type="button" onClick={() => fileInput.current?.click()}
              className="rounded-lg border-none bg-brand-orange px-4 py-2 text-[13px] font-semibold text-white cursor-pointer">Upload from computer</button>
            <button type="button" onClick={() => setLibraryOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-bone bg-white px-4 py-2 text-[13px] font-semibold text-charcoal cursor-pointer hover:border-brand-orange">
              <FolderOpen size={14} /> Choose from library
            </button>
          </div>
          {uploading && (
            <p role="status" className="mt-1 flex items-center gap-1.5 text-[12px] text-slate">
              <Loader2 size={13} className="animate-spin text-brand-orange" /> Uploading {pending.length} {pending.length === 1 ? 'photo' : 'photos'}… each one is added as soon as it is ready.
            </p>
          )}
          <input ref={fileInput} type="file" accept={PHOTO_ACCEPT} multiple className="hidden"
            onChange={e => { const files = Array.from(e.target.files ?? []); e.target.value = ''; void onFiles(files); }} />
        </div>
      ) : null}
      {notes.length > 0 && <p role="status" className="rounded-lg bg-[#fef2f2] px-3 py-2 text-[12px] text-red-600">{notes.join(' ')}</p>}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="tablist" aria-label="Photo filter" className="flex flex-wrap gap-1.5">
          {tabs.map(t => (
            <button key={t.id} type="button" role="tab" aria-selected={activeTab === t.id} onClick={() => { setTab(t.id); setPeek(null); }}
              className={clsx('rounded-full border px-3 py-1.5 text-[12px] font-semibold cursor-pointer',
                activeTab === t.id ? 'border-brand-orange bg-brand-pale-orange text-brand-orange' : 'border-bone bg-white text-charcoal hover:border-brand-orange')}>
              {t.label} <span className="opacity-70">({t.n})</span>
            </button>
          ))}
        </div>
        {shown.length > 0 && (
          <span className="flex gap-3 text-[12px]">
            <button type="button" onClick={() => linkMany(shown)} className="cursor-pointer border-none bg-transparent p-0 text-slate underline">Select all shown</button>
            <button type="button" onClick={() => unlinkMany(shown)} className="cursor-pointer border-none bg-transparent p-0 text-slate underline">Clear shown</button>
          </span>
        )}
      </div>

      {productImages.length === 0 && !uploading ? (
        <p className="rounded-lg bg-cream px-3 py-6 text-center text-[12.5px] text-slate">
          {storeId ? 'No photos yet. Upload some above or choose them from your library.' : 'Add product photos in the Product Images card first, then link them here.'}
        </p>
      ) : shown.length === 0 && !uploading ? (
        <p className="rounded-lg bg-cream px-3 py-6 text-center text-[12.5px] text-slate">
          {activeTab === 'linked' ? `No photos linked to ${groupLabel} yet. Upload above, or open "All photos" and tap the ones that belong to it.` : 'Nothing here.'}
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid max-h-[52vh] grid-cols-[repeat(auto-fill,minmax(112px,1fr))] content-start gap-2.5 overflow-y-auto pr-1" role="group" aria-label={`Photos for ${groupLabel}`}>
            {activeTab !== 'free' && pending.map(p => (
              <div key={p.id} className="relative aspect-square overflow-hidden rounded-lg border-2 border-brand-orange/40 bg-white" aria-label="Uploading photo">
                <img src={p.src} alt="" className="size-full object-contain opacity-50" />
                <span className="absolute inset-0 flex items-center justify-center"><Loader2 size={22} className="animate-spin text-brand-orange" /></span>
              </div>
            ))}
            {shown.map((src, i) => {
              const on = linked.has(src);
              const elsewhere = (labels[src] ?? []).filter(l => l !== groupLabel);
              return (
                <button key={src + i} type="button" aria-pressed={on} aria-label={`Photo ${productImages.indexOf(src) + 1}${on ? ', linked' : ''}`}
                  onClick={() => { toggle(src); setPeek(src); }} onMouseEnter={() => setPeek(src)} onFocus={() => setPeek(src)}
                  className={clsx('relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2 bg-white p-0',
                    on ? 'border-brand-orange' : 'border-bone hover:border-slate')}>
                  <img src={src} alt="" loading="lazy" className="size-full object-contain" />
                  {on && <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-brand-orange text-white"><Check size={12} strokeWidth={3} /></span>}
                  {elsewhere.length > 0 && (
                    <span className="absolute inset-x-0 bottom-0 truncate bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white">Also: {elsewhere.join(', ')}</span>
                  )}
                </button>
              );
            })}
          </div>
          <aside className="hidden lg:block" aria-label="Photo preview">
            <div className="sticky top-0 flex flex-col gap-2">
              <div className="mx-auto flex aspect-square max-h-[42vh] items-center justify-center overflow-hidden rounded-xl border border-bone bg-white">
                {previewUrl ? <img src={previewUrl} alt="" className="size-full object-contain" /> : <Search size={20} className="text-slate" />}
              </div>
              {previewUrl && (
                <p className="text-[11.5px] text-slate">
                  Photo {productImages.indexOf(previewUrl) + 1} of {productImages.length}.{' '}
                  {previewLabels.length ? <>Linked to <b className="text-charcoal">{previewLabels.join(', ')}</b>.</> : 'Not linked to any variant yet (it shows for everyone after the colour photos).'}
                </p>
              )}
            </div>
          </aside>
        </div>
      )}
      <p className="text-[11.5px] text-slate">
        {linkedList.length} {linkedList.length === 1 ? 'photo is' : 'photos are'} linked to {groupLabel}. Photos not linked to any variant (for example a box or size chart) are shown to every shopper.
      </p>

      <div className="rounded-xl border border-bone bg-white p-4">
        <ProductVideoField
          bare
          title={`Video for ${groupLabel}`}
          hint="Shown when a shopper picks this one. Upload a video (MP4, WebM or MOV, up to 100 MB) or paste a YouTube, Vimeo or any https link. Leave empty to show the product's own video, if any."
          value={{ videoUrl: row.video, videoFirst: false }}
          onChange={v => setVideo(v.videoUrl)}
        />
      </div>

      {storeId && libraryOpen && (
        <Suspense fallback={null}>
          <MediaLibraryPickerModal
            open={libraryOpen}
            onClose={() => setLibraryOpen(false)}
            storeId={storeId}
            onSelect={url => onLibraryPicked([url])}
            maxSelect={Math.max(2, MAX_PRODUCT_PHOTOS - productImages.length)}
            onSelectMany={onLibraryPicked}
          />
        </Suspense>
      )}
    </div>
  );
}
