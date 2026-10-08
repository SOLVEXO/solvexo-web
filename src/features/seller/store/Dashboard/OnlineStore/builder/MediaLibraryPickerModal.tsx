import { useState, useEffect, useRef } from 'react';
import { Search, Check, ImageIcon, Loader2, Upload, Video } from 'lucide-react';
import { Modal } from '@/components/comman/ui/Modal';
import { Button } from '@/components/comman/ui/Button';
import { SkeletonBox, PasteImageUrl } from '@/components/comman/ui';
import { apiBrowseMediaLibrary, apiUploadMediaAsset, apiUploadMediaAssetFromUrl, type MediaAsset } from '@/api/services/mediaLibrary';

/** The Files Library's "choose existing" picker — opened from `ImageUpload`
 *  wherever a `storeId` is in scope. Reuses the same upload endpoint the
 *  library itself is populated by, so uploading from inside the picker
 *  behaves identically to uploading from the standalone Files Library page. */
export function MediaLibraryPickerModal({
  open, onClose, storeId, onSelect, mediaType = 'image', maxSelect, onSelectMany,
}: {
  open: boolean;
  onClose: () => void;
  storeId: string;
  /** Single-pick mode (default): called with the one chosen file. */
  onSelect: (url: string) => void;
  mediaType?: 'image' | 'video';
  /** Multi-pick mode: set `maxSelect` > 1 AND `onSelectMany` — tiles toggle, and an
   *  "Add N" button hands back every chosen URL, in the order they were picked. */
  maxSelect?: number;
  onSelectMany?: (urls: string[]) => void;
}) {
  const multi = !!onSelectMany && (maxSelect ?? 1) > 1;
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (url: string) => {
    setError('');
    setSelected(prev => {
      if (prev.includes(url)) return prev.filter(u => u !== url);
      if (prev.length >= (maxSelect ?? 1)) { setError(`You can choose up to ${maxSelect} images.`); return prev; }
      return [...prev, url];
    });
  };
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = (search?: string) => {
    setLoading(true);
    setError('');
    apiBrowseMediaLibrary(storeId, { search, type: mediaType, limit: 60 })
      .then(res => setItems(res.data.items))
      .catch(() => setError('Failed to load your Files Library.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!open) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, storeId, mediaType]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => load(query || undefined), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleUpload = (fileList: FileList | null) => {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;
    if (files.some(f => (mediaType === 'video' ? !f.type.startsWith('video/') : !f.type.startsWith('image/')))) {
      setError(`Choose a ${mediaType} file.`);
      return;
    }
    setError('');
    if (!multi) {
      setUploading(true);
      apiUploadMediaAsset(storeId, files[0])
        .then(res => onSelect(res.data.url))
        .catch(() => setError('Upload failed.'))
        .finally(() => setUploading(false));
      return;
    }
    // Multi mode: uploaded files join the selection (and the grid) instead of closing the picker.
    const room = (maxSelect ?? 1) - selected.length;
    const batch = files.slice(0, Math.max(0, room));
    if (batch.length < files.length) setError(`You can choose up to ${maxSelect} images — extra files were skipped.`);
    if (batch.length === 0) return;
    setUploading(true);
    Promise.allSettled(batch.map(f => apiUploadMediaAsset(storeId, f)))
      .then(results => {
        const assets = results.flatMap(r => (r.status === 'fulfilled' ? [r.value.data] : []));
        if (assets.length < results.length) setError(`${results.length - assets.length} upload(s) failed.`);
        if (assets.length > 0) load(query || undefined); // new files show up in the grid, already selected
        setSelected(prev => [...prev, ...assets.map(a => a.url)].slice(0, maxSelect));
      })
      .finally(() => setUploading(false));
  };

  if (!open) return null;

  return (
    <Modal title={`Choose ${mediaType} from Files Library`} width={640} onClose={onClose} mobileSheet>
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search files…"
              className="w-full pl-9 pr-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white transition-colors duration-150 focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange/50"
            />
          </div>
          <Button variant="outline" size="sm" icon={uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading…' : 'Upload new'}
          </Button>
          <input ref={fileRef} type="file" accept={mediaType === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/png,image/jpeg,image/webp'} multiple={multi} className="hidden" onChange={e => { handleUpload(e.target.files); e.target.value = ''; }} />
        </div>
        {mediaType === 'image' && <PasteImageUrl upload={url => apiUploadMediaAssetFromUrl(storeId, url).then(res => res.data)} onUploaded={url => (multi ? setSelected(prev => (prev.length < (maxSelect ?? 1) ? [...prev, url] : prev)) : onSelect(url))} />}

        {error && <p className="text-[12px] text-error">{error}</p>}

        <div className="max-h-[420px] overflow-y-auto grid grid-cols-4 gap-2">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonBox key={i} height={90} rounded="8px" />)
          ) : items.length === 0 ? (
            <div className="col-span-4 flex flex-col items-center gap-2 py-10 text-slate">
              {mediaType === 'video' ? <Video size={22} /> : <ImageIcon size={22} />}
              <p className="text-[12.5px]">{query ? 'No matches.' : `Your Files Library has no ${mediaType}s yet — upload one.`}</p>
            </div>
          ) : (
            items.map(item => {
              const order = selected.indexOf(item.url);
              const isSelected = multi && order >= 0;
              return (
                <button
                  key={item._id} type="button" onClick={() => (multi ? toggle(item.url) : onSelect(item.url))}
                  aria-pressed={multi ? isSelected : undefined}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors group ${isSelected ? 'border-brand-orange' : 'border-bone hover:border-brand-orange'}`}
                  title={item.filename || item.altText}
                >
                  {mediaType === 'video'
                    ? <video src={item.url} aria-label={item.filename || 'Store video'} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                    : <img src={item.url} alt={item.altText} className="w-full h-full object-cover" loading="lazy" />}
                  {isSelected ? (
                    <span className="absolute top-1 right-1 size-5 rounded-full bg-brand-orange text-white text-[11px] font-bold flex items-center justify-center">{order + 1}</span>
                  ) : (
                    <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Check size={18} className="text-white" />
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
        {multi && (
          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-[12px] text-slate">{selected.length} of {maxSelect} selected</span>
            <Button size="sm" disabled={selected.length === 0 || uploading} onClick={() => onSelectMany?.(selected)}>
              {selected.length > 0 ? `Add ${selected.length} ${selected.length === 1 ? 'image' : 'images'}` : 'Add images'}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
