import { useState, useEffect, useRef } from 'react';
import { Search, Check, ImageIcon, Loader2, Upload } from 'lucide-react';
import { Modal } from '@/components/comman/ui/Modal';
import { Button } from '@/components/comman/ui/Button';
import { SkeletonBox } from '@/components/comman/ui';
import { apiBrowseMediaLibrary, apiUploadMediaAsset, type MediaAsset } from '@/api/services/mediaLibrary';

/** The Files Library's "choose existing" picker — opened from `ImageUpload`
 *  wherever a `storeId` is in scope. Reuses the same upload endpoint the
 *  library itself is populated by, so uploading from inside the picker
 *  behaves identically to uploading from the standalone Files Library page. */
export function MediaLibraryPickerModal({
  open, onClose, storeId, onSelect,
}: {
  open: boolean;
  onClose: () => void;
  storeId: string;
  onSelect: (url: string) => void;
}) {
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = (search?: string) => {
    setLoading(true);
    setError('');
    apiBrowseMediaLibrary(storeId, { search, type: 'image', limit: 60 })
      .then(res => setItems(res.data.items))
      .catch(() => setError('Failed to load your Files Library.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!open) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, storeId]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => load(query || undefined), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleUpload = (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    apiUploadMediaAsset(storeId, file)
      .then(res => onSelect(res.data.url))
      .catch(() => setError('Upload failed.'))
      .finally(() => setUploading(false));
  };

  if (!open) return null;

  return (
    <Modal title="Choose from Files Library" width={640} onClose={onClose} mobileSheet>
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
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => { handleUpload(e.target.files?.[0]); e.target.value = ''; }} />
        </div>

        {error && <p className="text-[12px] text-error">{error}</p>}

        <div className="max-h-[420px] overflow-y-auto grid grid-cols-4 gap-2">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonBox key={i} height={90} rounded="8px" />)
          ) : items.length === 0 ? (
            <div className="col-span-4 flex flex-col items-center gap-2 py-10 text-slate">
              <ImageIcon size={22} />
              <p className="text-[12.5px]">{query ? 'No matches.' : 'Your Files Library is empty — upload your first image.'}</p>
            </div>
          ) : (
            items.map(item => (
              <button
                key={item._id} type="button" onClick={() => onSelect(item.url)}
                className="relative aspect-square rounded-lg overflow-hidden border border-bone hover:border-brand-orange transition-colors group"
                title={item.filename || item.altText}
              >
                <img src={item.url} alt={item.altText} className="w-full h-full object-cover" loading="lazy" />
                <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Check size={18} className="text-white" />
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
