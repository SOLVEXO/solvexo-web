import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Code2, FileCode2, Loader2, MonitorPlay, RotateCcw, Save, UploadCloud, X } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import {
  apiEditThemePackageFile, apiGetThemePackageRevision, apiListThemePackageRevisions,
  apiRollbackThemePackage, apiUploadThemePackage, apiPreviewThemePackage, type ThemePackageRevision,
} from '@/api/services/storeTheme';

export function ThemeSourcePackageDialog({ storeId, installedThemeId, onClose }: { storeId: string; installedThemeId: string; onClose: () => void }) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [revisions, setRevisions] = useState<ThemePackageRevision[]>([]);
  const [selected, setSelected] = useState<ThemePackageRevision | null>(null);
  const [filePath, setFilePath] = useState('');
  const [content, setContent] = useState('');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');

  const reload = async () => {
    setPreviewHtml('');
    const result = await apiListThemePackageRevisions(storeId, installedThemeId);
    const rows = result.data ?? [];
    setRevisions(rows);
    if (rows.length) await openRevision(rows[0].version);
    else { setSelected(null); setFilePath(''); setContent(''); }
  };

  const openRevision = async (version: number) => {
    setPreviewHtml('');
    const result = await apiGetThemePackageRevision(storeId, installedThemeId, version);
    setSelected(result.data);
    const firstEditable = result.data.files.find((f) => f.encoding === 'utf8');
    setFilePath(firstEditable?.path ?? '');
    setContent(firstEditable?.content ?? '');
    setDirty(false);
    setError('');
  };

  useEffect(() => { reload().catch((e) => setError(e instanceof Error ? e.message : 'Could not load theme source history.')); }, [storeId, installedThemeId]);

  const upload = async (file?: File) => {
    if (!file) return;
    if (dirty && !window.confirm('Discard unsaved source edits and import this ZIP?')) { if (inputRef.current) inputRef.current.value = ''; return; }
    if (!file.name.toLowerCase().endsWith('.zip')) { setError('Choose a .zip Shopify theme package.'); return; }
    setBusy(true); setError('');
    try {
      await apiUploadThemePackage(storeId, installedThemeId, file);
      toast.success('Theme source ZIP saved as a new revision.');
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : 'Theme ZIP could not be uploaded.'); }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = ''; }
  };

  const save = async () => {
    if (!filePath || !dirty) return;
    setBusy(true); setError('');
    try {
      await apiEditThemePackageFile(storeId, installedThemeId, filePath, content);
      toast.success('Theme source saved as a new revision.');
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : 'Theme source could not be saved.'); }
    finally { setBusy(false); }
  };

  const rollback = async () => {
    if (!selected || selected.version === revisions[0]?.version) return;
    if (dirty && !window.confirm('Discard unsaved source edits and restore this revision?')) return;
    setBusy(true); setError('');
    try {
      await apiRollbackThemePackage(storeId, installedThemeId, selected.version);
      toast.success(`Revision ${selected.version} restored as a new source revision.`);
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not restore that revision.'); }
    finally { setBusy(false); }
  };

  const preview = async () => {
    setBusy(true); setError('');
    try {
      const result = await apiPreviewThemePackage(storeId, installedThemeId, selected?.version);
      setPreviewHtml(result.data.html);
    } catch (e) { setError(e instanceof Error ? e.message : 'Theme preview could not be rendered.'); }
    finally { setBusy(false); }
  };

  const chooseFile = async (path: string) => {
    if (!selected) return;
    if (dirty && !window.confirm('Discard your unsaved source edits and switch files?')) return;
    const file = selected.files.find((row) => row.path === path);
    if (!file || file.encoding !== 'utf8') { setFilePath(path); setContent('[Binary asset — source editor is text-only.]'); setDirty(false); return; }
    setFilePath(path); setContent(file.content ?? ''); setDirty(false); setError('');
  };
  const selectedFile = selected?.files.find((file) => file.path === filePath);

  return <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-3" role="dialog" aria-modal="true" aria-label="Theme source files">
    <div className="w-full max-w-6xl h-[min(88vh,900px)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-bone">
        <div className="flex items-center gap-2"><Code2 size={18} /><div><h2 className="m-0 text-[16px] font-bold text-charcoal">Theme source files</h2><p className="m-0 mt-1 text-[11px] text-slate">Shopify Liquid theme ZIP import, source edits and revision rollback</p></div></div>
        <div className="flex items-center gap-2">
          <input ref={inputRef} type="file" accept=".zip,application/zip" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-charcoal text-white text-[12px] font-semibold border-0 cursor-pointer disabled:opacity-50"><UploadCloud size={14} /> Import ZIP</button>
          <button type="button" onClick={() => { if (!dirty || window.confirm('Discard unsaved source edits and close?')) onClose(); }} className="p-2 rounded-lg border border-bone bg-white cursor-pointer" aria-label="Close"><X size={16} /></button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[210px_260px_1fr] flex-1 min-h-0">
        <aside className="border-r border-bone p-3 overflow-y-auto">
          <p className="px-2 text-[10px] font-bold uppercase tracking-wide text-slate">Source revisions</p>
          {revisions.length === 0 ? <p className="px-2 text-[12px] text-slate">No source package imported yet.</p> : revisions.map((row) => <button key={row.version} type="button" onClick={() => openRevision(row.version)} className="w-full text-left p-2 mb-1 rounded-lg border-0 cursor-pointer" style={{ background: selected?.version === row.version ? '#F1EDE5' : 'transparent' }}><span className="block text-[12px] font-semibold">Revision {row.version}</span><span className="block text-[10px] text-slate">{row.changeType}{row.createdAt ? ` · ${new Date(row.createdAt).toLocaleString()}` : ''}</span></button>)}
        </aside>
        <aside className="border-r border-bone p-3 overflow-y-auto">
          <p className="px-2 text-[10px] font-bold uppercase tracking-wide text-slate">Files</p>
          {selected?.files.map((file) => <button key={file.path} type="button" onClick={() => chooseFile(file.path)} className="w-full flex items-center gap-2 text-left p-2 rounded-lg border-0 bg-transparent hover:bg-cream cursor-pointer"><FileCode2 size={13} className="shrink-0" /><span className="truncate text-[11px]">{file.path}</span></button>)}
        </aside>
        <main className="p-4 flex flex-col min-w-0 min-h-0">
          {error && <p className="flex items-start gap-2 p-2.5 rounded-lg bg-error-bg text-error text-[12px]"><AlertTriangle size={14} className="shrink-0" />{error}</p>}
          {selected ? <>
            <div className="flex items-center justify-between gap-3 mb-2"><span className="text-[12px] font-semibold truncate">{filePath || 'Choose a file'}</span><div className="flex gap-2 shrink-0">{previewHtml && <button type="button" onClick={() => setPreviewHtml('')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-bone bg-white text-[11px] font-semibold cursor-pointer"><Code2 size={12} /> Edit source</button>}<button type="button" disabled={busy || dirty} onClick={preview} title={dirty ? 'Save the source edit to preview its new revision.' : undefined} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-bone bg-white text-[11px] font-semibold cursor-pointer disabled:opacity-50"><MonitorPlay size={12} /> Preview revision</button><button type="button" disabled={busy || !dirty} onClick={save} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-bone bg-white text-[11px] font-semibold cursor-pointer disabled:opacity-50"><Save size={12} /> Save source</button><button type="button" disabled={busy || selected.version === revisions[0]?.version} onClick={rollback} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-bone bg-white text-[11px] font-semibold cursor-pointer disabled:opacity-50"><RotateCcw size={12} /> Restore revision</button></div></div>
            {previewHtml ? <div className="flex-1 min-h-0 rounded-xl border border-bone overflow-hidden"><iframe title={`Theme source revision ${selected.version} preview`} sandbox="allow-scripts" srcDoc={previewHtml} className="w-full h-full border-0 bg-white" /></div> : <textarea value={content} disabled={selectedFile?.encoding !== 'utf8'} onChange={(e) => { setContent(e.target.value); setDirty(true); }} spellCheck={false} className="flex-1 min-h-0 w-full resize-none rounded-xl bg-[#1E1B18] text-[#EDE9E1] disabled:text-[#B8B2A6] border border-bone p-4 font-mono text-[12px] leading-relaxed" />}
            <p className="m-0 mt-2 text-[10px] text-slate">Preview renders Liquid sections with sample store data in an isolated frame. This source preview is not the published storefront yet.</p>
          </> : <div className="flex-1 flex items-center justify-center text-center text-[12px] text-slate">Import a Shopify theme ZIP to start a versioned source workspace.</div>}
        </main>
      </div>
      {busy && <div className="absolute inset-0 pointer-events-none flex items-center justify-center"><div className="flex items-center gap-2 rounded-lg bg-white shadow p-3 text-[12px]"><Loader2 size={15} className="animate-spin" /> Saving…</div></div>}
    </div>
  </div>;
}
