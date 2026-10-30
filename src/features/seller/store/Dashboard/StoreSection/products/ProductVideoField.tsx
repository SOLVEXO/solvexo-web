import { useId, useRef, useState, type ChangeEvent } from 'react';
import { Loader2, Play, Upload, X } from 'lucide-react';
import { useUpload } from '@/hooks/upload/useUpload';
import { parseProductVideo } from '@/utils/productVideo';

const MAX_VIDEO_MB = 50;
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export interface ProductVideoValue { videoUrl: string; videoFirst: boolean }

/** Optional product video: upload a file (mp4 / webm / mov) or paste a YouTube / Vimeo link. Shown in the storefront gallery. */
export function ProductVideoField({ value, onChange }: { value: ProductVideoValue; onChange: (v: ProductVideoValue) => void }) {
  const { upload, uploading, error: uploadError, clearError } = useUpload('public');
  const [link, setLink] = useState('');
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const linkId = useId();
  const parsed = parseProductVideo(value.videoUrl);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMessage(''); clearError();
    if (!VIDEO_TYPES.includes(file.type)) { setMessage('Please choose an MP4, WebM or MOV video.'); return; }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) { setMessage(`The video is larger than ${MAX_VIDEO_MB} MB. Compress it or paste a YouTube link instead.`); return; }
    upload(file).then(data => onChange({ ...value, videoUrl: data.url })).catch(() => {});
  };

  const addLink = () => {
    setMessage('');
    const text = link.trim();
    if (!text) return;
    const p = parseProductVideo(text.startsWith('http') ? text : `https://${text}`);
    if (!p || p.kind === 'file') { setMessage('Paste a YouTube or Vimeo link (or upload a video file above).'); return; }
    onChange({ ...value, videoUrl: text.startsWith('http') ? text : `https://${text}` });
    setLink('');
  };

  return (
    <div>
      <p className="text-[12px] text-slate mb-3">
        Optional. Shown in the product gallery next to the photos. Upload a short video (MP4, WebM or MOV, up to {MAX_VIDEO_MB} MB) or paste a YouTube / Vimeo link.
      </p>

      {parsed ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-[120px] h-[88px] rounded-lg overflow-hidden border border-bone bg-black shrink-0">
              {parsed.poster && <img src={parsed.poster} alt="" className="w-full h-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />}
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="size-8 rounded-full bg-black/60 text-white flex items-center justify-center"><Play size={14} fill="currentColor" /></span>
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-charcoal">{parsed.kind === 'file' ? 'Uploaded video' : parsed.kind === 'youtube' ? 'YouTube video' : 'Vimeo video'}</p>
              <p className="text-[11.5px] text-slate truncate">{value.videoUrl}</p>
            </div>
            <button
              type="button"
              onClick={() => onChange({ videoUrl: '', videoFirst: false })}
              className="shrink-0 flex items-center gap-1 px-3 py-[7px] rounded-[9px] text-[12px] font-semibold border border-bone bg-white text-charcoal cursor-pointer"
            >
              <X size={12} /> Remove
            </button>
          </div>
          <label className="flex items-center gap-2 text-[13px] text-charcoal cursor-pointer">
            <input type="checkbox" checked={value.videoFirst} onChange={e => onChange({ ...value, videoFirst: e.target.checked })} />
            Show the video first in the gallery
          </label>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div>
            <input ref={fileRef} type="file" accept={VIDEO_TYPES.join(',')} onChange={handleFile} className="hidden" aria-label="Upload product video" />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-[9px] rounded-[10px] text-[12.5px] font-semibold border border-bone bg-white text-charcoal disabled:opacity-60 cursor-pointer"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? 'Uploading video…' : 'Upload video'}
            </button>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1 min-w-0">
              <label htmlFor={linkId} className="block text-[12px] font-medium text-graphite mb-1">Or paste a YouTube / Vimeo link</label>
              <input
                id={linkId}
                value={link}
                onChange={e => setLink(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }}
                placeholder="https://www.youtube.com/watch?v=…"
                className="w-full px-3 py-[9px] rounded-[10px] border border-bone bg-white text-[13px] text-charcoal outline-none focus:border-brand-orange"
              />
            </div>
            <button type="button" onClick={addLink} className="shrink-0 px-4 py-[9px] rounded-[10px] text-[12.5px] font-semibold border border-bone bg-white text-charcoal cursor-pointer">Add</button>
          </div>
        </div>
      )}

      {(message || uploadError) && <p role="alert" className="mt-2 text-[12px] text-error">{message || uploadError}</p>}
    </div>
  );
}
