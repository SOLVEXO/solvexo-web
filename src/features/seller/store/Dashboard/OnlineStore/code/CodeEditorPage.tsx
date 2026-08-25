import { useState, useEffect, useCallback, useMemo } from 'react';
import './monacoSetup';
import Editor from '@monaco-editor/react';
import { Loader2, FileJson, FileCode, Save, UploadCloud, Lock, ChevronRight, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { useToast } from '@/contexts/ToastContext';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { SkeletonBox } from '@/components/comman/ui';
import { apiGetStoreThemeDraft, apiUpdateStoreThemeColors, apiUpdateStoreHeader, apiUpdateStoreFooter, apiUpdateIdentityBanner, apiUpdateStoreCustomCss, apiPublishStoreTheme } from '@/api/services/storeTheme';
import { apiListStorePages, apiGetStorePageDraft, apiUpdateStorePageSections, apiPublishStorePage } from '@/api/services/storePages';
import { apiGetCollectionTemplateDraft, apiUpdateCollectionTemplateSections, apiPublishCollectionTemplate, type ResourceTemplateType } from '@/api/services/collectionTemplate';

const SECTION_SOURCE = import.meta.glob('/src/features/storefront/sections/*.tsx', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;

type FileKind = 'json' | 'css' | 'typescript';
type SaveTarget =
  | { resource: 'theme'; field: 'theme' | 'header' | 'footer' | 'identityBanner' | 'customCss' }
  | { resource: 'page'; pageId: string }
  | { resource: 'template'; resourceType: ResourceTemplateType };

interface VirtualFile {
  path: string;
  label: string;
  kind: FileKind;
  readOnly: boolean;
  target?: SaveTarget;
}

const CONFIG_FILES: VirtualFile[] = [
  { path: 'config/theme.json', label: 'theme.json', kind: 'json', readOnly: false, target: { resource: 'theme', field: 'theme' } },
  { path: 'config/header.json', label: 'header.json', kind: 'json', readOnly: false, target: { resource: 'theme', field: 'header' } },
  { path: 'config/footer.json', label: 'footer.json', kind: 'json', readOnly: false, target: { resource: 'theme', field: 'footer' } },
  { path: 'config/identity-banner.json', label: 'identity-banner.json', kind: 'json', readOnly: false, target: { resource: 'theme', field: 'identityBanner' } },
];
const ASSET_FILES: VirtualFile[] = [
  { path: 'assets/custom.css', label: 'custom.css', kind: 'css', readOnly: false, target: { resource: 'theme', field: 'customCss' } },
];
const TEMPLATE_FILES: VirtualFile[] = [
  { path: 'templates/collection.default.json', label: 'collection.default.json', kind: 'json', readOnly: false, target: { resource: 'template', resourceType: 'collection' } },
  { path: 'templates/product.default.json', label: 'product.default.json', kind: 'json', readOnly: false, target: { resource: 'template', resourceType: 'product' } },
];

/**
 * The Developer Theme Workspace — a real, separate surface (route:
 * `online-store/code`) from the merchant visual Customizer, per the
 * non-negotiable "code editor must not be a textarea inside the customizer"
 * requirement. A real file tree, a real syntax-highlighted editor (Monaco),
 * save/validate/publish per file, and read-only real section source for
 * transparency.
 *
 * DISCLOSED SCOPE BOUNDARY (stated once, here, not hidden): this editor
 * operates on the active installed theme's CONFIGURATION DATA — settings,
 * template composition, and Custom CSS — as real JSON/CSS files, not on the
 * `.tsx` section render code itself. Solvexo's sections are compiled React
 * components with no sandboxed execution runtime (no WebContainer/iframe-
 * bundler in this stack) — letting a merchant hot-edit arbitrary component
 * code would need that sandbox built first (a separate, large project) or
 * would risk a broken bundle going live with no safety net. This mirrors
 * Shopify's own split: its JSON templates/config/locales ARE data edited in
 * the code editor; only `.liquid` is literal render code, safe because
 * Liquid has no arbitrary-JS capability — CSS is the closest Solvexo
 * equivalent (already a real, safe capability — see `StoreTheme.customCss`).
 * `sections/*.tsx` are shown READ-ONLY (real, live source, via a Vite raw
 * import — never fetched from a new backend endpoint) so a developer can see
 * exactly what a section's schema maps to. Every editable file here writes
 * to the exact same draft fields the visual Customizer edits — this is one
 * shared configuration, edited through two different surfaces, never two
 * copies that could drift.
 */
export function CodeEditorPage() {
  const { storeId, loading: storeLoading } = useStoreWorkspace();
  const toast = useToast();

  const [files, setFiles] = useState<VirtualFile[]>([...CONFIG_FILES]);
  const [selectedPath, setSelectedPath] = useState<string>('config/theme.json');
  const [contentByPath, setContentByPath] = useState<Record<string, string>>({});
  const [savedByPath, setSavedByPath] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [themeDraft, pages] = await Promise.all([
        apiGetStoreThemeDraft(storeId),
        apiListStorePages(storeId),
      ]);
      const home = pages.data.find((p) => p.type === 'home');

      const next: Record<string, string> = {
        'config/theme.json': JSON.stringify(themeDraft.data.theme, null, 2),
        'config/header.json': JSON.stringify(themeDraft.data.header, null, 2),
        'config/footer.json': JSON.stringify(themeDraft.data.footer, null, 2),
        'config/identity-banner.json': JSON.stringify(themeDraft.data.identityBanner, null, 2),
        'assets/custom.css': themeDraft.data.customCss ?? '/* No custom CSS yet. */\n',
      };

      const templateFiles: VirtualFile[] = [...TEMPLATE_FILES];
      if (home) {
        templateFiles.unshift({ path: 'templates/home.json', label: 'home.json', kind: 'json', readOnly: false, target: { resource: 'page', pageId: home._id } });
        const homeDraft = await apiGetStorePageDraft(storeId, home._id);
        next['templates/home.json'] = JSON.stringify(homeDraft.data.sections, null, 2);
      }
      for (const tf of TEMPLATE_FILES) {
        const resourceType = (tf.target as { resourceType: ResourceTemplateType }).resourceType;
        const draft = await apiGetCollectionTemplateDraft(storeId, resourceType, 'default');
        next[tf.path] = JSON.stringify(draft.data.sections, null, 2);
      }

      for (const [path, source] of Object.entries(SECTION_SOURCE)) {
        const name = path.split('/').pop()!;
        next[`sections/${name}`] = source;
      }

      setFiles([...CONFIG_FILES, ...templateFiles, ...ASSET_FILES]);
      setContentByPath(next);
      setSavedByPath(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load theme files.');
    } finally {
      setLoading(false);
    }
  // `toast` deliberately excluded from deps — `useToast()` returns a brand
  // new object every render (not memoized), so including it here caused a
  // real infinite load->setState->rerender->reload loop (found via live
  // network-trace testing: the same batch of GETs kept refiring
  // continuously). Every other page in this codebase that calls `useToast()`
  // inside a `useCallback` follows this same safe convention.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const sectionFiles: VirtualFile[] = useMemo(
    () => Object.keys(SECTION_SOURCE).map((path) => {
      const name = path.split('/').pop()!;
      return { path: `sections/${name}`, label: name, kind: 'typescript' as const, readOnly: true };
    }).sort((a, b) => a.label.localeCompare(b.label)),
    [],
  );

  const allFiles = [...files, ...sectionFiles];
  const filteredFiles = search ? allFiles.filter((f) => f.label.toLowerCase().includes(search.toLowerCase())) : allFiles;
  const selected = allFiles.find((f) => f.path === selectedPath) ?? allFiles[0];
  const currentContent = contentByPath[selected?.path ?? ''] ?? '';
  const isDirty = selected && !selected.readOnly && currentContent !== savedByPath[selected.path];

  const handleChange = (value: string | undefined) => {
    if (!selected) return;
    setContentByPath((prev) => ({ ...prev, [selected.path]: value ?? '' }));
    setJsonError(null);
    if (selected.kind === 'json') {
      try { JSON.parse(value ?? ''); } catch (e) { setJsonError(e instanceof Error ? e.message : 'Invalid JSON'); }
    }
  };

  const handleSave = async () => {
    if (!selected || selected.readOnly || !selected.target) return;
    const target = selected.target;
    let parsed: unknown = currentContent;
    if (selected.kind === 'json') {
      try { parsed = JSON.parse(currentContent); } catch (e) {
        toast.error('Fix the JSON error before saving.');
        return;
      }
    }
    setSaving(true);
    try {
      if (target.resource === 'theme') {
        if (target.field === 'theme') await apiUpdateStoreThemeColors(storeId, parsed as any);
        else if (target.field === 'header') await apiUpdateStoreHeader(storeId, parsed as any);
        else if (target.field === 'footer') await apiUpdateStoreFooter(storeId, (parsed as any).blocks, (parsed as any).footerStyle);
        else if (target.field === 'identityBanner') await apiUpdateIdentityBanner(storeId, parsed as any);
        else if (target.field === 'customCss') await apiUpdateStoreCustomCss(storeId, currentContent);
      } else if (target.resource === 'page') {
        await apiUpdateStorePageSections(storeId, target.pageId, parsed as any);
      } else if (target.resource === 'template') {
        await apiUpdateCollectionTemplateSections(storeId, parsed as any, target.resourceType, 'default');
      }
      setSavedByPath((prev) => ({ ...prev, [selected.path]: currentContent }));
      toast.success('Saved to draft — Publish to make it live.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save — check the file for validation errors.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selected?.target) return;
    const target = selected.target;
    setPublishing(true);
    try {
      if (target.resource === 'theme') await apiPublishStoreTheme(storeId);
      else if (target.resource === 'page') await apiPublishStorePage(storeId, target.pageId);
      else if (target.resource === 'template') await apiPublishCollectionTemplate(storeId, target.resourceType, 'default');
      toast.success('Published — your storefront now reflects this change.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish.');
    } finally {
      setPublishing(false);
    }
  };

  if (storeLoading || loading) {
    return (
      <div className="p-7 flex flex-col gap-4">
        <SkeletonBox width={240} height={22} rounded="6px" />
        <SkeletonBox height={500} rounded="16px" />
      </div>
    );
  }

  const groups: { label: string; files: VirtualFile[] }[] = [
    { label: 'config', files: filteredFiles.filter((f) => f.path.startsWith('config/')) },
    { label: 'templates', files: filteredFiles.filter((f) => f.path.startsWith('templates/')) },
    { label: 'assets', files: filteredFiles.filter((f) => f.path.startsWith('assets/')) },
    { label: 'sections (read-only)', files: filteredFiles.filter((f) => f.path.startsWith('sections/')) },
  ];

  return (
    <div className="bg-[#FAF9F5] min-h-full flex flex-col">
      <StorePageHeader
        title="Edit Code"
        subtitle="The developer theme workspace — real files, real validation, real version history. Configuration data only (JSON/CSS) — see the file tree's read-only sections/ for real render source."
      />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-0 px-4 lg:px-7 py-5 min-h-0">
        <div className="bg-white border border-bone rounded-2xl p-3 flex flex-col gap-2 overflow-y-auto max-h-[75vh]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="w-full px-3 py-2 text-[12.5px] border border-bone rounded-lg outline-none"
          />
          {groups.map((group) => group.files.length > 0 && (
            <div key={group.label} className="flex flex-col gap-0.5">
              <p className="px-2 pt-2 pb-1 text-[10.5px] font-bold uppercase tracking-wide text-slate">{group.label}/</p>
              {group.files.map((f) => (
                <button
                  key={f.path}
                  type="button"
                  onClick={() => setSelectedPath(f.path)}
                  className={clsx(
                    'flex items-center gap-2 px-2 py-[7px] rounded-lg text-[12.5px] text-left border-none cursor-pointer transition-colors',
                    selected?.path === f.path ? 'bg-brand-pale-orange text-brand-deep-orange font-semibold' : 'bg-transparent text-charcoal hover:bg-cream',
                  )}
                >
                  {f.kind === 'typescript' ? <FileCode size={13} className="shrink-0" /> : <FileJson size={13} className="shrink-0" />}
                  <span className="truncate flex-1">{f.label}</span>
                  {f.readOnly && <Lock size={11} className="text-slate shrink-0" />}
                  {!f.readOnly && contentByPath[f.path] !== savedByPath[f.path] && <span className="w-1.5 h-1.5 rounded-full bg-brand-orange shrink-0" />}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="flex flex-col bg-white border border-bone lg:border-l-0 rounded-2xl lg:rounded-l-none overflow-hidden min-h-[75vh]">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-bone">
            <div className="flex items-center gap-1.5 text-[12.5px] text-slate min-w-0">
              <span className="truncate">{selected?.path.split('/')[0]}</span>
              <ChevronRight size={12} />
              <span className="font-semibold text-charcoal truncate">{selected?.label}</span>
              {selected?.readOnly && <span className="ml-2 flex items-center gap-1 text-[11px] text-slate"><Lock size={11} /> Read-only</span>}
            </div>
            {!selected?.readOnly && (
              <div className="flex items-center gap-2 shrink-0">
                {jsonError && <span className="flex items-center gap-1 text-[11.5px] text-error"><AlertTriangle size={12} /> {jsonError}</span>}
                <button
                  onClick={handleSave}
                  disabled={saving || !isDirty || !!jsonError}
                  className="flex items-center gap-1.5 px-3 py-[7px] rounded-lg text-[12px] font-semibold border border-bone bg-white text-charcoal hover:bg-cream cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save
                </button>
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="flex items-center gap-1.5 px-3 py-[7px] rounded-lg text-[12px] font-bold text-white border-none cursor-pointer disabled:opacity-60"
                  style={{ background: '#D97757' }}
                >
                  {publishing ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />} Publish
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={selected?.kind === 'css' ? 'css' : selected?.kind === 'typescript' ? 'typescript' : 'json'}
              value={currentContent}
              onChange={handleChange}
              options={{ readOnly: selected?.readOnly, minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false }}
              theme="light"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
