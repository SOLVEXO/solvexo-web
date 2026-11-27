import api from '../client';

/** One file the seller uploaded once and can link or show anywhere. Mirrors `DocumentFile` in the API. */
export type StoreDocumentCategory = 'catalogue' | 'brochure' | 'price_list' | 'manual' | 'certificate' | 'other';

export interface StoreDocumentFile {
  _id: string;
  storeId: string;
  title: string;
  category: StoreDocumentCategory;
  description?: string;
  fileUrl: string;
  coverUrl?: string | null;
  sizeBytes?: number | null;
  pages?: number | null;
  language?: string;
  status: 'active' | 'hidden';
  viewCount?: number;
  downloadCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const STORE_DOCUMENT_CATEGORIES: { value: StoreDocumentCategory; label: string }[] = [
  { value: 'catalogue', label: 'Catalogue' },
  { value: 'brochure', label: 'Brochure' },
  { value: 'price_list', label: 'Price list' },
  { value: 'manual', label: 'Manual' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'other', label: 'Other' },
];

export function storeDocumentCategoryLabel(category: string): string {
  return STORE_DOCUMENT_CATEGORIES.find(c => c.value === category)?.label ?? 'Document';
}

/** "4.2 MB, 11 pages" — what the customer sees on a document card. */
export function storeDocumentMeta(doc: { sizeBytes?: number | null; pages?: number | null }): string {
  const parts: string[] = [];
  const mb = (doc.sizeBytes ?? 0) / (1024 * 1024);
  if (doc.sizeBytes) parts.push(mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round((doc.sizeBytes ?? 0) / 1024))} KB`);
  if (doc.pages) parts.push(`${doc.pages} ${doc.pages === 1 ? 'page' : 'pages'}`);
  return parts.join(' · ');
}

const BASE = (storeId: string) => `/api/store-documents/${storeId}`;

export async function apiListStoreDocuments(storeId: string, params: { page?: number; limit?: number; search?: string; category?: string; status?: string } = {}) {
  const res = await api.get(BASE(storeId), { params });
  return res.data as { items: StoreDocumentFile[]; total: number; page: number; limit: number };
}

export async function apiListPublicStoreDocuments(storeId: string, category?: string) {
  const res = await api.get(`/api/public/store-documents/${storeId}`, { params: category ? { category } : {} });
  return (res.data?.items ?? []) as StoreDocumentFile[];
}

export async function apiUploadStoreDocument(storeId: string, file: File, onProgress?: (percent: number) => void) {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post(`${BASE(storeId)}/upload`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e: any) => onProgress?.(e.total ? Math.round((e.loaded / e.total) * 100) : 0),
  });
  return res.data as { publicId: string; fileUrl: string; resourceType: string; sizeBytes: number };
}

export async function apiCreateStoreDocument(storeId: string, body: Partial<StoreDocumentFile> & { publicId: string; title: string }) {
  const res = await api.post(BASE(storeId), body);
  return res.data as StoreDocumentFile;
}

export async function apiUpdateStoreDocument(storeId: string, id: string, body: Partial<StoreDocumentFile>) {
  const res = await api.patch(`${BASE(storeId)}/${id}`, body);
  return res.data as StoreDocumentFile;
}

export async function apiReplaceStoreDocumentFile(storeId: string, id: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post(`${BASE(storeId)}/${id}/replace-file`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data as StoreDocumentFile;
}

export async function apiSetStoreDocumentCover(storeId: string, id: string, cover?: { publicId: string; url?: string } | null) {
  const res = await api.put(`${BASE(storeId)}/${id}/cover`, cover ?? {});
  return res.data as StoreDocumentFile;
}

export async function apiDeleteStoreDocument(storeId: string, id: string) {
  await api.delete(`${BASE(storeId)}/${id}`);
}

/** The public file URLs — `view` opens the PDF, `download` really downloads it. */
export function storeDocumentViewUrl(id: string) {
  return `/api/documents/${id}/view`;
}

export function storeDocumentDownloadUrl(id: string) {
  return `/api/documents/${id}/download`;
}