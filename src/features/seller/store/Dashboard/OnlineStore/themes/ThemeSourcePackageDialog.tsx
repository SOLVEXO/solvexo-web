import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Code2, Download, FilePlus2, FileCode2, Loader2, MonitorPlay, Pencil, RotateCcw, Save, Trash2, UploadCloud, X } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import {
  apiEditThemePackageFile, apiGetThemePackageRevision, apiListThemePackageRevisions,
  apiRollbackThemePackage, apiUploadThemePackage, apiAddThemePackageFile, apiDeleteThemePackageFile, apiRenameThemePackageFile, apiUnpublishThemePackage, apiExportThemePackage, apiPreviewThemePackage, apiGetThemePackageStructure, apiPublishThemePackage,
  type ThemePackageRevision, type ThemePackageStructure,
} from '@/api/services/storeTheme';
import { ShopifyTemplateEditor } from './ShopifyTemplateEditor';

export function ThemeSourcePackageDialog({ storeId, installedThemeId, onClose }: { storeId: string; installedThemeId: string; onClose: () => void }) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const assetRef = useRef<HTMLInputElement>(null);
  const [revisions, setRevisions] = useState<ThemePackageRevision[]>([]);
  const [selected, setSelected] = useState<ThemePackageRevision | null>(null);
  const [filePath, setFilePath] = useState('');
  const [content, setContent] = useState('');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [structure, setStructure] = useState<ThemePackageStructure | null>(null);
  const [previewPath, setPreviewPath] = useState('/');
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [fileOp, setFileOp] = useState<{ mode: 'new' | 'rename'; value: string } | null>(null);
  const [activePanel, setActivePanel] = useState<'files' | 'structure' | 'editor'>('files');

  const openRevision = useCallback(async (version: number) => {
    setPreviewHtml('');
    const result = await apiGetThemePackageRevision(storeId, installedThemeId, version);
    setSelected(result.data);
    const structureResult = await apiGetThemePackageStructure(storeId, installedThemeId, version);
    setStructure(structureResult.data);
    const firstEditable = result.data.files.find((f) => f.encoding === 'utf8');
    setFilePath(firstEditable?.path ?? '');
    setContent(firstEditable?.content ?? '');
    setDirty(false);
    setError('');
  }, [storeId, installedThemeId]);

  const reload = useCallback(async () => {
    const result = await apiListThemePackageRevisions(storeId, installedThemeId);
    const rows = result.data ?? [];
    setRevisions(rows);
    if (rows.length) await openRevision(rows[0].version);
    else { setSelected(null); setStructure(null); setFilePath(''); setContent(''); }
  }, [storeId, installedThemeId, openRevision]);

  useEffect(() => {
    let cancelled = false;
    apiListThemePackageRevisions(storeId, installedThemeId)
      .then((result) => {
        if (cancelled) return;
        const rows = result.data ?? [];
        setRevisions(rows);
        if (!rows.length) {
          setSelected(null);
          setStructure(null);
          setFilePath('');
          setContent('');
          return;
        }
        return Promise.all([
          apiGetThemePackageRevision(storeId, installedThemeId, rows[0].version),
          apiGetThemePackageStructure(storeId, installedThemeId, rows[0].version),
        ]).then(([revision, packageStructure]) => {
          if (cancelled) return;
          setSelected(revision.data);
          setStructure(packageStructure.data);
          const firstEditable = revision.data.files.find((file) => file.encoding === 'utf8');
          setFilePath(firstEditable?.path ?? '');
          setContent(firstEditable?.content ?? '');
          setDirty(false);
        });
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load theme source history.');
      });
    return () => { cancelled = true; };
  }, [storeId, installedThemeId]);

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
      const result = await apiPreviewThemePackage(storeId, installedThemeId, selected?.version, previewPath.startsWith('/') ? previewPath : `/${previewPath}`, dirty && filePath && selectedFile?.encoding === 'utf8' ? { path: filePath, content } : undefined);
      setPreviewHtml(result.data.html);
    } catch (e) { setError(e instanceof Error ? e.message : 'Theme preview could not be rendered.'); }
    finally { setBusy(false); }
  };

  const publish = async () => {
    if (!selected || !window.confirm(`Publish revision ${selected.version} as this store's live storefront theme? This will activate the imported Liquid theme for buyers.`)) return;
    setBusy(true); setError('');
    try {
      await apiPublishThemePackage(storeId, installedThemeId, selected.version);
      toast.success(`Theme revision ${selected.version} is now published to the storefront.`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Theme could not be published.'); }
    finally { setBusy(false); }
  };

  const runFileOp = async () => {
    if (!fileOp || !fileOp.value.trim()) return;
    if (dirty && !window.confirm('Discard unsaved source edits first?')) return;
    const target = fileOp.value.trim().replace(/^\/+/, '');
    setBusy(true); setError('');
    try {
      if (fileOp.mode === 'new') await apiAddThemePackageFile(storeId, installedThemeId, target, '');
      else await apiRenameThemePackageFile(storeId, installedThemeId, filePath, target);
      toast.success(fileOp.mode === 'new' ? 'File added as a new revision.' : 'File renamed as a new revision.');
      setFileOp(null);
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : 'File change failed.'); }
    finally { setBusy(false); }
  };

  const removeFile = async () => {
    if (!filePath || !window.confirm(`Delete ${filePath}? You can restore it from the previous revision.`)) return;
    setBusy(true); setError('');
    try {
      await apiDeleteThemePackageFile(storeId, installedThemeId, filePath);
      toast.success('File deleted as a new revision.');
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : 'File could not be deleted.'); }
    finally { setBusy(false); }
  };

  const uploadAsset = async (file?: File) => {
    if (!file) return;
    const buf = await file.arrayBuffer();
    let binary = '';
    new Uint8Array(buf).forEach((b) => { binary += String.fromCharCode(b); });
    setBusy(true); setError('');
    try {
      await apiAddThemePackageFile(storeId, installedThemeId, `assets/${file.name}`, btoa(binary), 'base64');
      toast.success('Asset uploaded as a new revision.');
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : 'Asset could not be uploaded.'); }
    finally { setBusy(false); if (assetRef.current) assetRef.current.value = ''; }
  };

  const exportZip = async () => {
    setBusy(true); setError('');
    try {
      const blob = await apiExportThemePackage(storeId, installedThemeId, selected?.version);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `theme-v${selected?.version ?? 'latest'}.zip`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { setError(e instanceof Error ? e.message : 'Theme could not be exported.'); }
    finally { setBusy(false); }
  };

  const unpublish = async () => {
    if (!window.confirm('Switch this store back to its native theme? The Liquid source and all revisions are kept.')) return;
    setBusy(true); setError('');
    try {
      await apiUnpublishThemePackage(storeId, installedThemeId);
      toast.success('Liquid theme unpublished — the storefront uses the native theme again.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not unpublish the theme.'); }
    finally { setBusy(false); }
  };

  const chooseFile = async (path: string): Promise<boolean> => {
    if (!selected) return false;
    if (dirty && !window.confirm('Discard your unsaved source edits and switch files?')) return false;
    const file = selected.files.find((row) => row.path === path);
    if (!file || file.encoding !== 'utf8') { setFilePath(path); setContent('[Binary asset — source editor is text-only.]'); setDirty(false); return true; }
    setFilePath(path); setContent(file.content ?? ''); setDirty(false); setError('');
    return true;
  };
  const selectedFile = selected?.files.find((file) => file.path === filePath);

  return <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-3" role="dialog" aria-modal="true" aria-label="Theme source files">
    <div className="w-full max-w-6xl h-[min(88vh,900px)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-bone">
        <div className="flex items-center gap-2"><Code2 size={18} /><div><h2 className="m-0 text-[16px] font-bold text-charcoal">Theme source files</h2><p className="m-0 mt-1 text-[11px] text-slate">Shopify Liquid theme ZIP import, source edits and revision rollback</p></div></div>
        <div className="flex items-center gap-2">
          <input ref={inputRef} type="file" accept=".zip,application/zip" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
          <input ref={assetRef} type="file" accept="image/*,font/*,.woff,.woff2,.ttf,.otf,.mp4,.webm,.css,.js,.svg" className="hidden" onChange={(e) => uploadAsset(e.target.files?.[0])} />
          <button type="button" onClick={exportZip} disabled={busy || !selected} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-bone bg-white text-[12px] font-semibold cursor-pointer disabled:opacity-50"><Download size={14} /> Export ZIP</button>
          <button type="button" onClick={unpublish} disabled={busy || !selected} title="Stop using this Liquid theme; go back to the native theme" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-bone bg-white text-[12px] font-semibold cursor-pointer disabled:opacity-50">Unpublish</button>
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
          <div className="flex gap-1 mb-3">
            <button type="button" onClick={() => setActivePanel('files')} className="px-2 py-1 rounded-md border-0 text-[11px] font-semibold cursor-pointer" style={{ background: activePanel === 'files' ? '#F1EDE5' : 'transparent' }}>Files</button>
            <button type="button" onClick={() => {
              const firstTemplate = structure?.templates.find((path) => path.endsWith('.json') && !path.startsWith('config/'));
              const currentIsTemplate = structure?.templates.includes(filePath) && filePath.endsWith('.json');
              if (!currentIsTemplate && firstTemplate) void chooseFile(firstTemplate).then((selectedTemplate) => { if (selectedTemplate) setActivePanel('editor'); });
              else setActivePanel('editor');
            }} disabled={!selected || !structure} className="px-2 py-1 rounded-md border-0 text-[11px] font-semibold cursor-pointer disabled:opacity-50" style={{ background: activePanel === 'editor' ? '#F1EDE5' : 'transparent' }}>Template editor</button>
            <button type="button" onClick={() => setActivePanel('structure')} disabled={!selected} className="px-2 py-1 rounded-md border-0 text-[11px] font-semibold cursor-pointer disabled:opacity-50" style={{ background: activePanel === 'structure' ? '#F1EDE5' : 'transparent' }}>Theme structure</button>
          </div>
          {activePanel === 'files' && selected && <div className="mb-2">
            <div className="flex gap-1">
              <button type="button" onClick={() => setFileOp({ mode: 'new', value: 'sections/' })} className="flex items-center gap-1 px-2 py-1 rounded-md border border-bone bg-white text-[11px] font-semibold cursor-pointer"><FilePlus2 size={12} /> New file</button>
              <button type="button" onClick={() => assetRef.current?.click()} className="flex items-center gap-1 px-2 py-1 rounded-md border border-bone bg-white text-[11px] font-semibold cursor-pointer"><UploadCloud size={12} /> Asset</button>
              <button type="button" disabled={!filePath} onClick={() => setFileOp({ mode: 'rename', value: filePath })} aria-label="Rename file" title="Rename selected file" className="p-1.5 rounded-md border border-bone bg-white cursor-pointer disabled:opacity-40"><Pencil size={12} /></button>
              <button type="button" disabled={!filePath} onClick={removeFile} aria-label="Delete file" title="Delete selected file" className="p-1.5 rounded-md border border-bone bg-white cursor-pointer disabled:opacity-40"><Trash2 size={12} /></button>
            </div>
            {fileOp && <form className="mt-2 flex gap-1" onSubmit={(e) => { e.preventDefault(); void runFileOp(); }}>
              <input autoFocus aria-label={fileOp.mode === 'new' ? 'New file path' : 'New file name'} value={fileOp.value} onChange={(e) => setFileOp({ ...fileOp, value: e.target.value })} placeholder="sections/my-section.liquid" className="flex-1 min-w-0 px-2 py-1 rounded-md border border-bone text-[11px]" />
              <button type="submit" className="px-2 py-1 rounded-md bg-charcoal text-white text-[11px] font-semibold border-0 cursor-pointer">{fileOp.mode === 'new' ? 'Add' : 'Rename'}</button>
              <button type="button" onClick={() => setFileOp(null)} className="px-2 py-1 rounded-md border border-bone bg-white text-[11px] cursor-pointer">Cancel</button>
            </form>}
          </div>}
          {activePanel === 'files' ? selected?.files.map((file) => <button key={file.path} type="button" onClick={() => chooseFile(file.path)} className="w-full flex items-center gap-2 text-left p-2 rounded-lg border-0 bg-transparent hover:bg-cream cursor-pointer"><FileCode2 size={13} className="shrink-0" /><span className="truncate text-[11px]">{file.path}</span></button>) : structure && <>
            {activePanel === 'editor' ? null : <>
            <p className="px-2 text-[10px] font-bold uppercase tracking-wide text-slate">Templates</p>
            {structure.templates.map((template) => <p key={template} className="px-2 my-1 text-[11px] text-charcoal">{template}</p>)}
            <p className="px-2 mt-4 text-[10px] font-bold uppercase tracking-wide text-slate">Header and footer groups</p>
            {(structure.sectionGroups ?? []).length
              ? structure.sectionGroups.map((group) => <p key={group} className="px-2 my-1 text-[11px] text-charcoal">{group}</p>)
              : <p className="px-2 my-1 text-[10px] text-slate">No section groups found.</p>}
            <p className="px-2 mt-4 text-[10px] font-bold uppercase tracking-wide text-slate">Sections and blocks</p>
            {structure.components.map((component) => <div key={component.path} className="px-2 py-2 border-b border-bone">
              <p className="m-0 text-[11px] font-semibold text-charcoal">{component.schema.name}</p>
              <p className="m-0 mt-0.5 text-[10px] text-slate">{component.kind} · {component.type}</p>
              {(component.schema.settings ?? []).map((setting) => <p key={setting.id ?? setting.label} className="m-0 mt-1 text-[10px] text-slate">{setting.label ?? setting.id ?? 'Setting'}{setting.type ? ` · ${setting.type}` : ''}</p>)}
              {(component.schema.blocks ?? []).map((block) => <p key={block.type ?? block.name} className="m-0 mt-1 text-[10px] text-slate">Block: {block.name ?? block.type}</p>)}
            </div>)}
            <p className="px-2 mt-4 text-[10px] font-bold uppercase tracking-wide text-slate">Global settings</p>
            {structure.themeSettings.map((group, index) => <p key={`${group.name ?? 'group'}-${index}`} className="px-2 my-1 text-[11px] text-charcoal">{group.name ?? 'Settings group'}</p>)}
            </>}
          </>}
        </aside>
        <main className="p-4 flex flex-col min-w-0 min-h-0">
          {error && <p className="flex items-start gap-2 p-2.5 rounded-lg bg-error-bg text-error text-[12px]"><AlertTriangle size={14} className="shrink-0" />{error}</p>}
          {selected ? <>
            <div className="flex items-center justify-between gap-3 mb-2"><span className="text-[12px] font-semibold truncate">{filePath || 'Choose a file'}</span><div className="flex gap-2 shrink-0">{previewHtml && <button type="button" onClick={() => setPreviewHtml('')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-bone bg-white text-[11px] font-semibold cursor-pointer"><Code2 size={12} /> Edit source</button>}<input aria-label="Preview page path" value={previewPath} onChange={(e) => setPreviewPath(e.target.value)} placeholder="/products/handle" className="w-36 px-2 py-1 rounded-lg border border-bone text-[11px]" /><select aria-label="Preview device" value={device} onChange={(e) => setDevice(e.target.value as 'desktop' | 'tablet' | 'mobile')} className="px-2 py-1 rounded-lg border border-bone bg-white text-[11px]"><option value="desktop">Desktop</option><option value="tablet">Tablet</option><option value="mobile">Mobile</option></select><button type="button" disabled={busy} onClick={preview} title={dirty ? 'Previews your unsaved edit without saving it.' : undefined} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-bone bg-white text-[11px] font-semibold cursor-pointer disabled:opacity-50"><MonitorPlay size={12} /> Preview revision</button><button type="button" disabled={busy || !dirty} onClick={save} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-bone bg-white text-[11px] font-semibold cursor-pointer disabled:opacity-50"><Save size={12} /> Save source</button><button type="button" disabled={busy || selected.version === revisions[0]?.version} onClick={rollback} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-bone bg-white text-[11px] font-semibold cursor-pointer disabled:opacity-50"><RotateCcw size={12} /> Restore revision</button><button type="button" disabled={busy || dirty} onClick={publish} title={dirty ? 'Save source changes before publishing.' : 'Publish this source revision to the live storefront'} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-charcoal text-white text-[11px] font-semibold border-0 cursor-pointer disabled:opacity-50">Publish to storefront</button></div></div>
            {previewHtml ? <div className="flex-1 min-h-0 rounded-xl border border-bone overflow-auto bg-cream flex justify-center"><iframe title={`Theme source revision ${selected.version} preview`} sandbox="allow-scripts" srcDoc={previewHtml} style={{ width: device === 'mobile' ? 390 : device === 'tablet' ? 820 : '100%', maxWidth: '100%' }} className="h-full border-0 bg-white" /></div>
              : activePanel === 'editor' && structure ? <div className="flex-1 min-h-0 rounded-xl border border-bone p-3"><ShopifyTemplateEditor
                storeId={storeId}
                structure={structure}
                files={selected.files}
                selectedPath={filePath}
                currentContent={content}
                dirty={dirty}
                onSelectFile={(path, value) => { setFilePath(path); setContent(value); setDirty(false); }}
                onChange={(value) => { setContent(value); setDirty(true); }}
              /></div>
                : <textarea value={content} disabled={selectedFile?.encoding !== 'utf8'} onChange={(e) => { setContent(e.target.value); setDirty(true); }} spellCheck={false} className="flex-1 min-h-0 w-full resize-none rounded-xl bg-[#1E1B18] text-[#EDE9E1] disabled:text-[#B8B2A6] border border-bone p-4 font-mono text-[12px] leading-relaxed" />}
            <p className="m-0 mt-2 text-[10px] text-slate">Preview uses this store&apos;s product catalog in an isolated frame. Publishing activates the Liquid theme for the store&apos;s public storefront.</p>
          </> : <div className="flex-1 flex items-center justify-center text-center text-[12px] text-slate">Import a Shopify theme ZIP to start a versioned source workspace.</div>}
        </main>
      </div>
      {busy && <div className="absolute inset-0 pointer-events-none flex items-center justify-center"><div className="flex items-center gap-2 rounded-lg bg-white shadow p-3 text-[12px]"><Loader2 size={15} className="animate-spin" /> Saving…</div></div>}
    </div>
  </div>;
}
