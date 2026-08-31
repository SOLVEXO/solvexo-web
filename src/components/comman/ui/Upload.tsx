import { type ChangeEvent, useState, lazy, Suspense } from 'react';
import { Camera, Plus, Upload, Loader2, X, File as FileIcon, FolderOpen } from 'lucide-react';
import { clsx } from 'clsx';
import { useUpload } from '@/hooks/upload/useUpload';
import type { PrivateUploadData } from '@/api/upload';
import { apiUploadMediaAsset } from '@/api/services/mediaLibrary';

export type { PrivateUploadData };

// Lazy — most `ImageUpload` call sites never pass `storeId`, so the Files
// Library picker (and its own API calls) shouldn't be in every bundle chunk
// that happens to render a plain logo/product-image uploader.
const MediaLibraryPickerModal = lazy(() =>
  import('@/features/seller/store/Dashboard/OnlineStore/builder/MediaLibraryPickerModal').then(m => ({ default: m.MediaLibraryPickerModal })),
);

// ── ImageUpload ───────────────────────────────────────────────────────────────

interface ImageUploadProps {
  value:      string[];
  onChange:   (urls: string[]) => void;
  maxFiles?:  number;
  accept?:    string;
  className?: string;
  /** When set, uploads through this widget are tracked into that store's
   *  Files Library, and a "Browse Library" option lets the seller reuse a
   *  previously-uploaded file instead of uploading a duplicate. Omit for
   *  call sites with no store context (e.g. a buyer review photo) — nothing
   *  changes for them. */
  storeId?: string;
}

export function ImageUpload({
  value, onChange, maxFiles = 1, accept = 'image/png,image/jpeg,image/webp', className, storeId,
}: ImageUploadProps) {
  const { upload, uploading: plainUploading, error } = useUpload('public');
  const [libraryUploading, setLibraryUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const uploading = plainUploading || libraryUploading;

  const addUrl = (url: string) => {
    if (maxFiles === 1) onChange([url]);
    else onChange([...value, url].slice(0, maxFiles));
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (storeId) {
      setLibraryUploading(true);
      apiUploadMediaAsset(storeId, file)
        .then(res => addUrl(res.data.url))
        .catch(() => {})
        .finally(() => setLibraryUploading(false));
    } else {
      upload(file).then(data => addUrl(data.url)).catch(() => {});
    }
  };

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const canAdd = value.length < maxFiles;

  const libraryPicker = storeId && pickerOpen && (
    <Suspense fallback={null}>
      <MediaLibraryPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        storeId={storeId}
        onSelect={url => { addUrl(url); setPickerOpen(false); }}
      />
    </Suspense>
  );

  // ── Single image (logo style) ─────────────────────────────────────────────
  if (maxFiles === 1) {
    const url = value[0] ?? null;
    return (
      <div className={clsx('flex flex-col items-start gap-1.5', className)}>
        <div className="flex items-end gap-2">
          <label className={clsx(
            'size-[72px] rounded-2xl bg-brand-pale-orange border-2 border-dashed border-brand-orange',
            'flex items-center justify-center shrink-0 overflow-hidden',
            uploading ? 'cursor-wait opacity-60' : 'cursor-pointer',
          )}>
            {uploading
              ? <Loader2 size={22} className="text-brand-orange animate-spin" />
              : url
                ? <img loading="lazy" decoding="async" src={url} alt="" className="w-full h-full object-cover" />
                : <Camera size={22} className="text-brand-orange" />}
            <input type="file" accept={accept} className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
        </div>
        {storeId && (
          <button type="button" onClick={() => setPickerOpen(true)} className="text-[11px] font-semibold text-brand-orange bg-transparent border-none cursor-pointer flex items-center gap-1">
            <FolderOpen size={11} /> Browse Library
          </button>
        )}
        {error && <p className="text-[11px] text-error mt-1">{error}</p>}
        {libraryPicker}
      </div>
    );
  }

  // ── Multi image (product images) ──────────────────────────────────────────
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <div className="flex flex-wrap gap-2">
        {value.map((url, i) => (
          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-bone group">
            <img loading="lazy" decoding="async" src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        {canAdd && (
          <label className={clsx(
            'w-16 h-16 rounded-lg border-2 border-dashed border-bone flex items-center justify-center',
            'hover:border-brand-orange hover:bg-brand-pale-orange transition-colors',
            uploading ? 'cursor-wait opacity-60' : 'cursor-pointer',
          )}>
            {uploading
              ? <Loader2 size={16} className="text-brand-orange animate-spin" />
              : <Plus size={18} className="text-slate" />}
            <input type="file" accept={accept} className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
        )}
      </div>
      {storeId && canAdd && (
        <button type="button" onClick={() => setPickerOpen(true)} className="text-[11px] font-semibold text-brand-orange bg-transparent border-none cursor-pointer flex items-center gap-1 self-start">
          <FolderOpen size={11} /> Browse Library
        </button>
      )}
      {error && <p className="text-[11px] text-error w-full">{error}</p>}
      {libraryPicker}
    </div>
  );
}

// ── FileDropSelect ────────────────────────────────────────────────────────────
// Same visual language as FileUpload's dashed drop-zone, but hands back the raw
// `File` instead of uploading it immediately — for forms whose backend needs
// the original file (e.g. server-side dimension validation on the raw buffer),
// not a pre-uploaded URL.

interface FileDropSelectProps {
  value:      File | null;
  onChange:   (file: File | null) => void;
  accept?:    string;
  label?:     string;
  className?: string;
}

export function FileDropSelect({
  value, onChange, accept = 'image/png,image/jpeg,image/webp', label = 'Click to upload image', className,
}: FileDropSelectProps) {
  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (file) onChange(file);
  };

  return (
    <div className={className}>
      {value ? (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg">
          <img loading="lazy" decoding="async" src={URL.createObjectURL(value)} alt="" className="w-10 h-10 rounded-md object-cover shrink-0 border border-bone" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-charcoal truncate">{value.name}</p>
            <p className="text-[11px] text-slate mt-[1px]">{formatSize(value.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="w-6 h-6 rounded-full bg-white border border-bone flex items-center justify-center text-slate hover:text-error hover:border-error transition-colors shrink-0"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <label className={clsx(
          'flex flex-col items-center justify-center gap-2 w-full py-6 rounded-lg border-2 border-dashed border-bone cursor-pointer',
          'hover:border-brand-orange hover:bg-brand-pale-orange transition-colors',
        )}>
          <Upload size={20} className="text-slate" />
          <span className="text-[13px] text-slate">{label}</span>
          <input type="file" accept={accept} className="hidden" onChange={handleFile} />
        </label>
      )}
    </div>
  );
}

// ── FileUpload ────────────────────────────────────────────────────────────────

interface FileUploadProps {
  value:      PrivateUploadData | null;
  onChange:   (data: PrivateUploadData | null) => void;
  accept?:    string;
  label?:     string;
  className?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024)    return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function FileUpload({
  value, onChange, accept, label = 'Click to upload file', className,
}: FileUploadProps) {
  const { upload, uploading, error } = useUpload('private');

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    upload(file)
      .then(data => onChange(data))
      .catch(() => {});
  };

  return (
    <div className={className}>
      {value ? (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg">
          <FileIcon size={18} className="text-success shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-charcoal truncate">{value.fileName}</p>
            <p className="text-[11px] text-slate mt-[1px]">{formatSize(value.fileSize)} · {value.mimeType}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="w-6 h-6 rounded-full bg-white border border-bone flex items-center justify-center text-slate hover:text-error hover:border-error transition-colors shrink-0"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <label className={clsx(
          'flex flex-col items-center justify-center gap-2 w-full py-8 rounded-lg border-2 border-dashed border-bone',
          'hover:border-brand-orange hover:bg-brand-pale-orange transition-colors',
          uploading ? 'cursor-wait opacity-60' : 'cursor-pointer',
        )}>
          {uploading
            ? <Loader2 size={24} className="text-brand-orange animate-spin" />
            : <Upload size={24} className="text-slate" />}
          <span className="text-[13px] text-slate">{uploading ? 'Uploading…' : label}</span>
          <input type="file" accept={accept} className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      )}
      {error && <p className="text-[11px] text-error mt-1">{error}</p>}
    </div>
  );
}
