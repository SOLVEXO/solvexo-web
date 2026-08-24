import { useState, useCallback, useEffect, useRef } from 'react';
import { Image as ImageIcon, Upload, Search, Trash2, Loader2, AlertTriangle, Video } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { SkeletonBox, EmptyState, Modal } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import {
  apiBrowseMediaLibrary, apiUploadMediaAsset, apiUpdateMediaAsset, apiDeleteMediaAsset, apiGetMediaAssetUsage,
  type MediaAsset, type MediaAssetUsage,
} from '@/api/services/mediaLibrary';

function formatSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function AssetDetailModal({ asset, storeId, onClose, onSaved, onDeleted }: {
  asset: MediaAsset; storeId: string; onClose: () => void; onSaved: (a: MediaAsset) => void; onDeleted: (id: string) => void;
}) {
  const toast = useToast();
  const [altText, setAltText] = useState(asset.altText);
  const [tagsInput, setTagsInput] = useState(asset.tags.join(', '));
  const [saving, setSaving] = useState(false);
  const [checkingUsage, setCheckingUsage] = useState(false);
  const [usage, setUsage] = useState<MediaAssetUsage[] | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const res = await apiUpdateMediaAsset(storeId, asset._id, { altText, tags });
      onSaved(res.data);
      toast.success('File details updated.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update file.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = async () => {
    setCheckingUsage(true);
    try {
      const res = await apiGetMediaAssetUsage(storeId, asset._id);
      setUsage(res.data);
    } catch {
      setUsage([]);
    } finally {
      setCheckingUsage(false);
      setConfirmingDelete(true);
    }
  };

  const handleConfirmDelete = async (force: boolean) => {
    setDeleting(true);
    try {
      await apiDeleteMediaAsset(storeId, asset._id, force);
      onDeleted(asset._id);
      toast.success('File deleted.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete file.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal title={asset.filename || 'File details'} width={520} onClose={onClose} mobileSheet>
      <div className="flex flex-col gap-4">
        <div className="rounded-lg overflow-hidden border border-bone bg-cream max-h-[280px] flex items-center justify-center">
          {asset.resourceType === 'video'
            ? <video src={asset.url} controls className="max-h-[280px] max-w-full" />
            : <img src={asset.url} alt={asset.altText} className="max-h-[280px] max-w-full object-contain" />}
        </div>
        <p className="text-[11px] text-slate">
          {asset.width && asset.height ? `${asset.width}×${asset.height} · ` : ''}{formatSize(asset.sizeBytes)}{asset.mimeType ? ` · ${asset.mimeType}` : ''}
        </p>

        <div>
          <label className="text-[12px] font-medium text-charcoal block mb-1.5">Alt text</label>
          <input value={altText} onChange={e => setAltText(e.target.value)} placeholder="Describe this image for accessibility and SEO"
            className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white" />
        </div>
        <div>
          <label className="text-[12px] font-medium text-charcoal block mb-1.5">Tags (comma-separated)</label>
          <input value={tagsInput} onChange={e => setTagsInput(e.target.value)}
            className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white" />
        </div>

        {confirmingDelete && (
          <div className="rounded-lg border border-error-border bg-error-bg p-3 flex flex-col gap-2">
            {usage && usage.length > 0 ? (
              <>
                <p className="text-[12.5px] font-semibold text-error flex items-center gap-1.5"><AlertTriangle size={13} /> This file is still in use:</p>
                <ul className="text-[12px] text-error list-disc pl-4">
                  {usage.map((u, i) => <li key={i}>{u.label}</li>)}
                </ul>
                <div className="flex gap-2 mt-1">
                  <Button variant="danger" size="sm" loading={deleting} onClick={() => handleConfirmDelete(true)}>Delete anyway</Button>
                  <Button variant="outline" size="sm" onClick={() => setConfirmingDelete(false)}>Cancel</Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-[12.5px] text-error">Delete this file permanently? This cannot be undone.</p>
                <div className="flex gap-2">
                  <Button variant="danger" size="sm" loading={deleting} onClick={() => handleConfirmDelete(false)}>Delete</Button>
                  <Button variant="outline" size="sm" onClick={() => setConfirmingDelete(false)}>Cancel</Button>
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-bone">
          <button type="button" onClick={handleDeleteClick} disabled={checkingUsage || confirmingDelete}
            className="text-[12.5px] font-semibold text-error bg-transparent border-none cursor-pointer flex items-center gap-1.5">
            {checkingUsage ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Delete
          </button>
          <Button size="sm" loading={saving} onClick={handleSave}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}

// The seller-facing Files Library — real cross-content asset browsing,
// search, alt text/tag management, and safe deletion (checked live against
// Product/Category/Collection/Store/Banner/Page/Theme references before
// removing anything). Populated automatically by every `ImageUpload` call
// site that was given this store's `storeId`, plus direct uploads here.
export default function FilesLibrary() {
  const { storeId } = useStoreWorkspace();
  const toast = useToast();
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'image' | 'video' | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiBrowseMediaLibrary(storeId, { search: search || undefined, type: typeFilter, limit: 100 })
      .then(res => { setItems(res.data.items); setTotal(res.data.total); })
      .finally(() => setLoading(false));
  }, [storeId, search, typeFilter]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const handleUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    Promise.allSettled(Array.from(files).map(f => apiUploadMediaAsset(storeId, f)))
      .then(results => {
        const failed = results.filter(r => r.status === 'rejected').length;
        if (failed > 0) toast.error(`${failed} file${failed > 1 ? 's' : ''} failed to upload.`);
        else toast.success('Files uploaded.');
        load();
      })
      .finally(() => setUploading(false));
  };

  return (
    <>
      <StorePageHeader
        title="Files"
        subtitle={`${total} file${total !== 1 ? 's' : ''} — reusable across your Theme, products, pages, and banners.`}
        actions={
          <Button icon={uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading…' : 'Upload files'}
          </Button>
        }
      />
      <input ref={fileRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={e => { handleUpload(e.target.files); e.target.value = ''; }} />

      <div className="px-4 lg:px-7 pt-5 pb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-[320px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files…"
              className="w-full pl-9 pr-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white" />
          </div>
          <div className="flex gap-1">
            {(['all', 'image', 'video'] as const).map(t => (
              <button key={t} type="button" onClick={() => setTypeFilter(t === 'all' ? undefined : t)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border cursor-pointer ${((t === 'all' && !typeFilter) || t === typeFilter) ? 'border-brand-orange bg-brand-pale-orange text-brand-deep-orange' : 'border-bone bg-white text-slate'}`}>
                {t === 'all' ? 'All' : t === 'image' ? 'Images' : 'Videos'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => <SkeletonBox key={i} height={120} rounded="10px" />)}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<ImageIcon size={28} className="text-brand-orange opacity-55" />}
            title={search ? 'No matches' : 'No files yet'}
            description={search ? 'Try a different search term.' : 'Upload images and videos here to reuse them across your Theme, products, and pages.'}
            action={search ? undefined : { label: 'Upload files', onClick: () => fileRef.current?.click(), icon: <Upload size={14} /> }}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {items.map(item => (
              <button key={item._id} type="button" onClick={() => setSelected(item)}
                className="group relative aspect-square rounded-lg overflow-hidden border border-bone hover:border-brand-orange transition-colors bg-cream text-left">
                {item.resourceType === 'video' ? (
                  <div className="w-full h-full flex items-center justify-center"><Video size={24} className="text-slate" /></div>
                ) : (
                  <img src={item.url} alt={item.altText} className="w-full h-full object-cover" loading="lazy" />
                )}
                <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] px-2 py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.filename || 'Untitled'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <AssetDetailModal
          asset={selected}
          storeId={storeId}
          onClose={() => setSelected(null)}
          onSaved={a => { setItems(prev => prev.map(i => i._id === a._id ? a : i)); setSelected(null); }}
          onDeleted={id => { setItems(prev => prev.filter(i => i._id !== id)); setTotal(t => Math.max(0, t - 1)); setSelected(null); }}
        />
      )}
    </>
  );
}
