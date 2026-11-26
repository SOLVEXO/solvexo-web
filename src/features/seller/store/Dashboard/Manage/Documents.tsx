import { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Upload, Trash2, Pencil, Eye, Download, RefreshCw } from 'lucide-react';
import { StorePageHeader } from '@/components/layouts/StoreLayout';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { Button, Select, Modal } from '@/components/comman/ui';
import {
  apiCreateStoreDocument, apiDeleteStoreDocument, apiListStoreDocuments, apiReplaceStoreDocumentFile,
  apiSetStoreDocumentCover, apiUpdateStoreDocument, apiUploadStoreDocument,
  STORE_DOCUMENT_CATEGORIES, storeDocumentCategoryLabel, storeDocumentMeta,
  type StoreDocumentCategory, type StoreDocumentFile,
} from '@/api/services/storeDocuments';

const NO_SHADOWS = 'shadow-none';
const card = `rounded-xl border border-bone bg-white ${NO_SHADOWS}`;
const input = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none';

/** Online Store → Documents: upload a PDF once, then link or show it anywhere. */
export default function DocumentsPage() {
  const { storeId } = useStoreWorkspace();
  const [items, setItems] = useState<StoreDocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [editing, setEditing] = useState<StoreDocumentFile | null>(null);
  function errMessage(e: unknown, fallback: string): string {
  const res = (e as { response?: { data?: { message?: string } } } | null)?.response;
  return res?.data?.message || fallback;
}

const [draft, setDraft] = useState<{ title?: string; category?: StoreDocumentCategory; description?: string; language?: string; active?: boolean }>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const replaceId = useRef<string | null>(null);

  const load = useCallback(() => {
    if (!storeId) return;
    setLoading(true);
    setError('');
    apiListStoreDocuments(storeId, { limit: 100 })
      .then(r => setItems(r.items ?? []))
      .catch(() => setError('Could not load your documents.'))
      .finally(() => setLoading(false));
  }, [storeId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- the loader owns its own loading/error state
  useEffect(() => { load(); }, [load]);

  const upload = async (file: File, replaceIdValue?: string | null) => {
    if (!storeId || !file) return;
    setBusy(true);
    setProgress(0);
    setError('');
    try {
      if (replaceIdValue) {
        await apiReplaceStoreDocumentFile(storeId, replaceIdValue, file);
      } else {
        const uploaded = await apiUploadStoreDocument(storeId, file, setProgress);
        await apiCreateStoreDocument(storeId, {
          title: file.name.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').slice(0, 120) || 'Document',
          publicId: uploaded.publicId,
          fileUrl: uploaded.fileUrl,
          sizeBytes: uploaded.sizeBytes,
        });
      }
      load();
    } catch (e: unknown) {
      setError(errMessage(e, 'The upload failed. Please try again.'));
    } finally {
      setBusy(false);
      setProgress(0);
      if (fileRef.current) fileRef.current.value = '';
      if (replaceRef.current) replaceRef.current.value = '';
      replaceId.current = null;
    }
  };

  const openEdit = (doc: StoreDocumentFile) => {
    setEditing(doc);
    setDraft({ title: doc.title, category: doc.category, description: doc.description ?? '', language: doc.language ?? '', active: doc.status === 'active' });
  };

  const saveEdit = async () => {
    if (!storeId || !editing) return;
    setBusy(true);
    try {
      await apiUpdateStoreDocument(storeId, editing._id, draft);
      setEditing(null);
      load();
    } catch (e: unknown) {
      setError(errMessage(e, 'Could not save the changes.'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (doc: StoreDocumentFile) => {
    if (!storeId) return;
    setBusy(true);
    try {
      await apiDeleteStoreDocument(storeId, doc._id);
      load();
    } catch {
      setError('Could not remove the document.');
    } finally {
      setBusy(false);
    }
  };

  const resetCover = async (doc: StoreDocumentFile) => {
    if (!storeId) return;
    setBusy(true);
    try {
      await apiSetStoreDocumentCover(storeId, doc._id, null);
      load();
    } catch {
      setError('Could not reset the cover.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-4 lg:px-7 pt-5 pb-10 w-full">
      <StorePageHeader
        title="Documents"
        subtitle="Upload a PDF once (a catalogue, a price list, a manual) and use it anywhere — a menu item, a button, a section or a product page. Replace the file once and every place updates itself."
        actions={
          <>
            <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }} />
            <input ref={replaceRef} type="file" accept="application/pdf,.pdf" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f && replaceId.current) upload(f, replaceId.current); }} />
            <Button size="sm" disabled={!storeId || busy} onClick={() => fileRef.current?.click()}>
              <Upload size={14} className="mr-1 inline" /> {busy && progress > 0 ? `Uploading ${progress}%` : 'Add document'}
            </Button>
          </>
        }
      />

      {error && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-[12.5px] text-error">
          <span>{error}</span>
          <button type="button" onClick={load} className="inline-flex items-center gap-1 underline cursor-pointer"><RefreshCw size={13} /> Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))]">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className={`${card} h-[190px] animate-pulse bg-bone/40`} />)}
        </div>
      ) : items.length === 0 ? (
        <div className={`${card} flex flex-col items-center gap-2 px-6 py-12 text-center`}>
          <FileText size={28} className="text-slate" />
          <p className="m-0 text-[14px] font-medium text-ink">No documents yet</p>
          <p className="m-0 max-w-[420px] text-[12.5px] text-slate">Add your first PDF. It gets its own cover from the first page, and you can link it from anywhere in your store.</p>
          <Button size="sm" className="mt-2" disabled={!storeId || busy} onClick={() => fileRef.current?.click()}>Add document</Button>
        </div>
      ) : (
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))]">
          {items.map(doc => (
            <div key={doc._id} className={`${card} flex flex-col overflow-hidden`}>
              <div className="relative flex h-[132px] items-center justify-center bg-bone/50">
                {doc.coverUrl ? (
                  <img src={doc.coverUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <FileText size={26} className="text-slate" />
                )}
                {doc.status === 'hidden' && (
                  <span className="absolute right-2 top-2 rounded bg-white/90 px-1.5 py-0.5 text-[10px] text-slate">Hidden</span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 p-3">
                <p className="m-0 truncate text-[13.5px] font-medium text-ink">{doc.title}</p>
                <p className="m-0 text-[11.5px] text-slate">
                  {storeDocumentCategoryLabel(doc.category)}{storeDocumentMeta(doc) ? ` · ${storeDocumentMeta(doc)}` : ''}
                </p>
                <p className="m-0 mt-1 flex items-center gap-3 text-[11px] text-slate">
                  <span className="inline-flex items-center gap-1"><Eye size={12} /> {doc.viewCount ?? 0}</span>
                  <span className="inline-flex items-center gap-1"><Download size={12} /> {doc.downloadCount ?? 0}</span>
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => openEdit(doc)}><Pencil size={13} className="mr-1 inline" /> Edit</Button>
                  <Button variant="outline" size="sm" disabled={busy} onClick={() => { replaceId.current = doc._id; replaceRef.current?.click(); }}>
                    <RefreshCw size={13} className="mr-1 inline" /> Replace file
                  </Button>
                  {doc.coverUrl && (
                    <button type="button" disabled={busy} onClick={() => resetCover(doc)}
                      className="border-0 bg-transparent p-0 text-[11px] text-slate underline cursor-pointer">Reset cover</button>
                  )}
                  <button type="button" aria-label={`Remove ${doc.title}`} disabled={busy} onClick={() => remove(doc)}
                    className="ml-auto border-0 bg-transparent p-1 text-slate cursor-pointer hover:text-error"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)} title="Edit document" width={520}>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-[12.5px] text-charcoal">
              Name
              <input className={input} maxLength={120} value={draft.title ?? ''} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1 text-[12.5px] text-charcoal">
              Category
              <Select value={draft.category ?? 'catalogue'} onChange={e => setDraft(d => ({ ...d, category: e.target.value as StoreDocumentCategory }))}>
                {STORE_DOCUMENT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </label>
            <label className="flex flex-col gap-1 text-[12.5px] text-charcoal">
              Short description
              <textarea rows={2} maxLength={500} className={input} value={draft.description ?? ''}
                onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1 text-[12.5px] text-charcoal">
              Language (optional)
              <input className={input} maxLength={12} placeholder="en, ur, fr…" value={draft.language ?? ''}
                onChange={e => setDraft(d => ({ ...d, language: e.target.value }))} />
            </label>
            <label className="flex items-center gap-2 text-[12.5px] text-charcoal">
              <input type="checkbox" checked={draft.active !== false} onChange={e => setDraft(d => ({ ...d, active: e.target.checked }))} />
              Show in the store
            </label>
            <div className="mt-1 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
              <Button size="sm" loading={busy} disabled={busy || !(draft.title ?? '').trim()} onClick={saveEdit}>Save</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}