import { useState } from 'react';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { FileUpload, type PrivateUploadData } from '@/components/comman/ui';

export interface DigitalFileRow {
  url: string;
  name: string;
  size: number | null;
  mimeType: string | null;
  label: string;
  version: string;
  stampPdf: boolean;
}

const inp = 'w-full h-9 px-3 rounded-lg border border-line text-[13px] bg-white';

export const rowFromUpload = (u: PrivateUploadData): DigitalFileRow => ({
  url: u.publicId, name: u.fileName, size: u.fileSize ?? null, mimeType: u.mimeType ?? null, label: '', version: '', stampPdf: false,
});

/** Server file entries (archived ones are hidden, sorted by `position`) -> editor rows. */
export function rowsFromServer(files: any[] | undefined): DigitalFileRow[] {
  return (files ?? [])
    .filter((f) => !f.archived)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((f) => ({ url: f.url, name: f.name, size: f.size ?? null, mimeType: f.mimeType ?? null, label: f.label ?? '', version: f.version ?? '', stampPdf: !!f.stampPdf }));
}

export const filesPayload = (rows: DigitalFileRow[]) =>
  rows.map((r) => ({ url: r.url, name: r.name, size: r.size, mimeType: r.mimeType, label: r.label || null, version: r.version || null, stampPdf: r.stampPdf }));

export function DigitalFilesEditor({ value, onChange }: { value: DigitalFileRow[]; onChange: (v: DigitalFileRow[]) => void }) {
  const [uploadKey, setUploadKey] = useState(0);
  const patch = (i: number, p: Partial<DigitalFileRow>) => onChange(value.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      {value.map((r, i) => (
        <div key={r.url} className="rounded-xl border border-line p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="flex-1 truncate text-[13px] font-medium">{r.name}</span>
            <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="p-1 disabled:opacity-30"><ArrowUp size={14} /></button>
            <button type="button" aria-label="Move down" disabled={i === value.length - 1} onClick={() => move(i, 1)} className="p-1 disabled:opacity-30"><ArrowDown size={14} /></button>
            <button type="button" aria-label={`Remove ${r.name}`} onClick={() => onChange(value.filter((_, j) => j !== i))} className="p-1 text-red-600"><Trash2 size={14} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input aria-label="Label" value={r.label} maxLength={100} onChange={(e) => patch(i, { label: e.target.value })} placeholder="Label (e.g. Source files)" className={inp} />
            <input aria-label="Version" value={r.version} maxLength={30} onChange={(e) => patch(i, { version: e.target.value })} placeholder="Version (e.g. 1.0)" className={inp} />
          </div>
          {r.mimeType === 'application/pdf' && (
            <label className="flex items-center gap-2 text-[12px]">
              <input type="checkbox" checked={r.stampPdf} onChange={(e) => patch(i, { stampPdf: e.target.checked })} /> Stamp buyer name on this PDF
            </label>
          )}
        </div>
      ))}
      <FileUpload
        key={uploadKey}
        value={null}
        onChange={(u: PrivateUploadData | null) => {
          if (!u) return;
          onChange([...value, rowFromUpload(u)]);
          setUploadKey((k) => k + 1);
        }}
        label={value.length ? 'Add another file' : 'Click to upload your digital file'}
      />
    </div>
  );
}

/** Download-limit dropdown (enum values only) + link expiry toggle with days. */
export function DigitalDeliveryFields({
  downloadLimit, linkExpiryDays, onLimit, onExpiry,
}: { downloadLimit: string; linkExpiryDays: string; onLimit: (v: string) => void; onExpiry: (v: string) => void }) {
  const expires = linkExpiryDays !== '';
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <label className="flex flex-col gap-1 text-[12px]">
        Download limit
        <select value={downloadLimit} onChange={(e) => onLimit(e.target.value)} className={inp}>
          <option value="unlimited">Unlimited</option>
          <option value="1">1 download</option>
          <option value="3">3 downloads</option>
          <option value="5">5 downloads</option>
        </select>
      </label>
      <div className="flex flex-col gap-1 text-[12px]">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={expires} onChange={(e) => onExpiry(e.target.checked ? '30' : '')} /> Access expires
        </label>
        {expires && (
          <input aria-label="Days until access expires" type="number" min={1} max={3650} step={1} value={linkExpiryDays} onChange={(e) => onExpiry(e.target.value)} className={inp} />
        )}
      </div>
    </div>
  );
}
