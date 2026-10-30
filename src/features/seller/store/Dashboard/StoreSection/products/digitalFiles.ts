import type { PrivateUploadData } from '@/components/comman/ui';

export interface DigitalFileRow {
  url: string;
  name: string;
  size: number | null;
  mimeType: string | null;
  label: string;
  version: string;
  stampPdf: boolean;
}

export const rowFromUpload = (u: PrivateUploadData): DigitalFileRow => ({
  url: u.publicId, name: u.fileName, size: u.fileSize ?? null, mimeType: u.mimeType ?? null, label: '', version: '', stampPdf: false,
});

interface ServerFile { url: string; name: string; size?: number | null; mimeType?: string | null; label?: string | null; version?: string | null; stampPdf?: boolean; archived?: boolean; position?: number }

/** Server file entries (archived ones are hidden, sorted by `position`) -> editor rows. */
export function rowsFromServer(files: ServerFile[] | undefined): DigitalFileRow[] {
  return (files ?? [])
    .filter((f) => !f.archived)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((f) => ({ url: f.url, name: f.name, size: f.size ?? null, mimeType: f.mimeType ?? null, label: f.label ?? '', version: f.version ?? '', stampPdf: !!f.stampPdf }));
}

export const filesPayload = (rows: DigitalFileRow[]) =>
  rows.map((r) => ({ url: r.url, name: r.name, size: r.size, mimeType: r.mimeType, label: r.label || null, version: r.version || null, stampPdf: r.stampPdf }));
