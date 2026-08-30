import { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, FileJson, FileCode, Folder, Save, CheckCircle2, UploadCloud, AlertCircle, Image as ImageIcon, ExternalLink, Monitor, Tablet, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/contexts/ToastContext';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { SkeletonBox } from '@/components/comman/ui';
import {
  apiListStorePages, apiUpdateStorePageSections, apiPublishStorePage,
  type StorePageData,
} from '@/api/services/storePages';
import {
  apiGetCollectionTemplate, apiUpdateCollectionTemplateSections, apiPublishCollectionTemplate,
  type ResourceTemplateType,
} from '@/api/services/collectionTemplate';
import type { Section } from '@/api/services/storefrontTypes';
import { apiBrowseMediaLibrary, type MediaAsset } from '@/api/services/mediaLibrary';
import { apiGetStoreTheme, type StoreThemeData } from '@/api/services/storeTheme';
import { SECTION_META } from '../builder/sectionRegistry';
import { AtelierLivePreview } from './AtelierLivePreview';
import { atelierTheme as t } from '@/features/storefront-themes/theme-01-atelier/theme.config';
import { getThemeManifest, type ThemeTemplateScopeDef } from '@/features/storefront-themes/themeManifest';
import { getThemeDevFiles } from '@/features/storefront-themes/themeDevFiles';
// See the load-bearing comment on this same import in
// `AtelierThemeSettingsPanel.tsx` — importing `DEFAULT_THEME_ID` from
// `registry.ts` here (not redeclaring the literal) is what guarantees this
// theme's manifest AND dev-files have already registered themselves
// (`theme.manifest.ts` / `theme.devFiles.ts`, both imported as side effects
// by `registry.ts`) before `getThemeManifest`/`getThemeDevFiles` below run.
import { DEFAULT_THEME_ID } from '@/features/storefront-themes/registry';

const DEVICE_WIDTH: Record<'desktop' | 'tablet' | 'mobile', string> = { desktop: '100%', tablet: '768px', mobile: '390px' };

interface FileNode {
  id: string;
  label: string;
  kind: 'json' | 'code' | 'assets' | 'unavailable';
  content?: string;
}

/** Reproduces this theme's real `templates/*.json` file naming from its
 *  manifest's own template-scope list — `home.json` for the `store-page`
 *  scope; `{resourceType}.{templateKey}.json` for a `collection-template`
 *  scope whose backend bucket is `product`/`collection` (real alternate
 *  templates); just `{templateKey}.json` for one whose bucket is the
 *  shared `page` resourceType (search/cart/blog — see `themeManifest.ts`'s
 *  own doc comment on that reuse). This previously WAS a literal,
 *  hand-written `TEMPLATE_FILES` array (one entry per Atelier file name);
 *  now it's derived from `manifest.templates` (see the `templateFiles`
 *  useMemo further down), so a second theme's manifest produces its own
 *  file names here with no new code. */
function templateFileName(d: ThemeTemplateScopeDef): string {
  if (d.resource.kind === 'store-page') return 'home.json';
  const { resourceType, templateKey } = d.resource;
  return resourceType === 'page' ? `${templateKey}.json` : `${resourceType}.${templateKey}.json`;
}

function sectionFileLabel(path: string) {
  return 'sections/' + path.split('/').pop();
}

/** `assets/` — real, per-store data (not static source, so it can't use the
 *  raw-import glob every other read-only file here uses) — the store's
 *  actual uploaded Files Library, fetched live. Genuinely functional: real
 *  thumbnails, real filenames, and a real link into the full Files page for
 *  upload/rename/delete, rather than a decorative "unavailable" folder. */
function AssetsPanel({ storeId }: { storeId: string }) {
  const [assets, setAssets] = useState<MediaAsset[] | null>(null);
  useEffect(() => {
    apiBrowseMediaLibrary(storeId, { limit: 60 }).then(res => setAssets(res.data.items)).catch(() => setAssets([]));
  }, [storeId]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[12.5px] text-slate">Your store's real uploaded files — manage them from the full Files page.</p>
        <Link to={`/store/${storeId}/files`} className="flex items-center gap-1 text-[12px] font-semibold no-underline" style={{ color: '#D97757' }}>
          Open Files <ExternalLink size={12} />
        </Link>
      </div>
      {assets === null ? (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {Array.from({ length: 12 }).map((_, i) => <div key={i} className="aspect-square rounded-lg bg-cream animate-pulse" />)}
        </div>
      ) : assets.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-center px-8">
          <p className="text-[13px] text-slate">No files uploaded yet. Upload images from the Files page or any image field in Customize.</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {assets.map(a => (
            <div key={a._id} className="flex flex-col gap-1" title={a.filename}>
              <div className="aspect-square rounded-lg overflow-hidden border border-bone bg-white flex items-center justify-center">
                {a.resourceType === 'image'
                  ? <img src={a.url} alt={a.altText || a.filename} className="w-full h-full object-cover" loading="lazy" />
                  : <ImageIcon size={18} className="text-slate" />}
              </div>
              <p className="text-[10px] text-slate truncate px-0.5">{a.filename}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Theme 01's own Developer Theme Workspace — `Online Store → Themes →
 *  Atelier → Edit Code`. A real, scoped theme-authoring surface, not a
 *  cosmetic textarea: each `templates/*.json` file IS the same real
 *  `Section[]` draft document the visual Customizer edits (identical
 *  backend, identical validation, identical Save/Publish) — editing it
 *  here and editing it visually are two lenses onto one real document,
 *  never two copies. A change saved here shows up in Customize on next
 *  load, and vice versa, because both read/write the exact same API.
 *
 *  Deliberately does NOT allow arbitrary `.tsx` edits — this stack has no
 *  sandboxed runtime to safely execute merchant-supplied React/TypeScript
 *  (no WebContainer/iframe-bundler), so section source is shown READ-ONLY
 *  for transparency instead of faking a "code editor" that can't actually
 *  deploy what's typed into it. This mirrors Shopify's own split: JSON
 *  templates are real editable data; only the sandboxed-safe layer (there,
 *  Liquid; here, the JSON section/block contract already enforced by
 *  `section-settings.validator.ts` on the backend) is actually authorable.
 *
 *  A `templates/*.json` file shows a real live preview beside the editor —
 *  the same `AtelierLivePreview` component the visual Customizer uses, fed
 *  from a live parse of the text being typed. This is what makes the visual
 *  editor and this developer surface genuinely ONE underlying theme system
 *  rather than two disconnected implementations: same document, same
 *  validation, same rendering, same preview — only the authoring surface
 *  differs. */
export function AtelierEditCodePage() {
  const { storeId, loading: storeLoading } = useStoreWorkspace();
  const toast = useToast();
  const flash = (ok: boolean, text: string) => { if (ok) toast.success(text); else toast.error(text); };

  const [homePage, setHomePage] = useState<StorePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('templates/home.json');
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Live preview for the currently-open templates/*.json file — reuses the
  // exact same `AtelierLivePreview` the visual Customizer uses, per the
  // non-negotiable requirement that the visual editor and developer surface
  // share one real preview implementation rather than growing two that can
  // silently drift apart. Fed from a live parse of `jsonText`, not the
  // last-saved document, so typing here updates the preview the same way
  // typing in Customize's section forms already does.
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [draftTheme, setDraftTheme] = useState<StoreThemeData | null>(null);
  const [previewSections, setPreviewSections] = useState<Section[]>([]);

  // `draftTheme` (fetched below) carries the store's real `themeDefinitionId`
  // once loaded; before that (or if it's ever null) both lookups fall back
  // to `DEFAULT_THEME_ID`, so this never throws waiting on that fetch — same
  // pattern as `AtelierCustomizePage.tsx`/`AtelierThemeSettingsPanel.tsx`.
  const manifest = getThemeManifest(draftTheme?.themeDefinitionId, DEFAULT_THEME_ID);
  const devFiles = getThemeDevFiles(draftTheme?.themeDefinitionId, DEFAULT_THEME_ID);
  const templateFiles: { id: string; label: string; resourceType: ResourceTemplateType | 'home'; templateKey: string }[] = useMemo(
    () => manifest.templates.map(d => {
      const label = templateFileName(d);
      return {
        id: 'templates/' + label,
        label,
        resourceType: d.resource.kind === 'store-page' ? ('home' as const) : d.resource.resourceType,
        templateKey: d.resource.kind === 'store-page' ? '' : d.resource.templateKey,
      };
    }),
    [manifest],
  );

  const selectedTemplate = templateFiles.find(f => f.id === selectedId);

  useEffect(() => {
    apiListStorePages(storeId)
      .then(res => setHomePage(res.data.find(p => p.type === 'home') ?? null))
      .finally(() => setLoading(false));
    apiGetStoreTheme(storeId).then(res => setDraftTheme(res.data)).catch(() => {});
  }, [storeId]);

  // Re-parses on every keystroke, but only ever COMMITS a successful parse
  // to the preview — an in-progress edit that's momentarily invalid JSON
  // (an unclosed brace while typing) just keeps showing the last valid
  // preview instead of blanking out, same "don't punish mid-edit state"
  // principle `handleJsonChange`'s own error display already follows.
  useEffect(() => {
    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed)) setPreviewSections(parsed as Section[]);
    } catch {
      // keep the last valid preview
    }
  }, [jsonText]);

  // Loads whichever template file is selected — Home from `StorePage`,
  // Product/Collection from the `collection-template` module (same backend
  // `apiGetCollectionTemplate` the Customize page's template picker uses,
  // scoped here to each resource's `default` template).
  useEffect(() => {
    if (!selectedTemplate) return;
    setPreviewSections([]);
    if (selectedTemplate.resourceType === 'home') {
      if (homePage) setJsonText(JSON.stringify(homePage.draft?.sections ?? homePage.sections, null, 2));
      return;
    }
    apiGetCollectionTemplate(storeId, selectedTemplate.resourceType, selectedTemplate.templateKey)
      .then(res => setJsonText(JSON.stringify(res.data.draft?.sections ?? res.data.sections, null, 2)))
      .catch(() => setJsonText('[]'));
    setDirty(false);
    setJsonError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, storeId, homePage?._id]);

  const sectionFiles: FileNode[] = useMemo(
    () => Object.entries(devFiles?.sectionSources ?? {}).map(([path, content]) => ({ id: sectionFileLabel(path), label: path.split('/').pop() ?? path, kind: 'code' as const, content })),
    [devFiles],
  );
  const configFile: FileNode | null = useMemo(() => {
    const entry = Object.entries(devFiles?.configSource ?? {})[0];
    return entry ? { id: 'config/' + (entry[0].split('/').pop() ?? 'theme.config.ts'), label: entry[0].split('/').pop() ?? 'theme.config.ts', kind: 'code' as const, content: entry[1] } : null;
  }, [devFiles]);

  const layoutFile: FileNode | null = useMemo(() => {
    const entry = Object.entries(devFiles?.layoutSource ?? {})[0];
    return entry ? { id: 'layout/' + (entry[0].split('/').pop() ?? 'layout.tsx'), label: entry[0].split('/').pop() ?? 'layout.tsx', kind: 'code' as const, content: entry[1] } : null;
  }, [devFiles]);

  const snippetFiles: FileNode[] = useMemo(
    () => Object.entries(devFiles?.snippetSources ?? {}).map(([path, content]) => ({ id: 'snippets/' + path.split('/').pop(), label: path.split('/').pop() ?? path, kind: 'code' as const, content })),
    [devFiles],
  );

  const localeFile: FileNode | null = useMemo(() => {
    const entry = Object.entries(devFiles?.localeSource ?? {})[0];
    return entry ? { id: 'locales/' + (entry[0].split('/').pop() ?? 'locale.json'), label: entry[0].split('/').pop() ?? 'locale.json', kind: 'code' as const, content: entry[1] } : null;
  }, [devFiles]);

  // A real, generated reference — every real section type in the open
  // registry, and exactly which block types it accepts — sourced directly
  // from `sectionRegistry.ts`, so it can never drift out of date the way a
  // hand-written doc would. Not separately "editable" (block TYPES are
  // defined in code, not per-store data) — same read-only-reference status
  // as `sections/`.
  const blocksFile: FileNode = useMemo(() => ({
    id: 'blocks/available-block-types.json',
    label: 'available-block-types.json',
    kind: 'code' as const,
    content: JSON.stringify(
      Object.fromEntries(SECTION_META.map(m => [m.type, { blockLabel: m.blockLabel || null, allowedBlockTypes: m.allowedBlockTypes }])),
      null, 2,
    ),
  }), []);

  const tree: { group: string; items: FileNode[] }[] = useMemo(() => [
    { group: 'templates', items: templateFiles.map(f => ({ id: f.id, label: f.label, kind: 'json' as const })) },
    { group: 'sections', items: sectionFiles },
    { group: 'config', items: configFile ? [configFile] : [] },
    { group: 'assets', items: [{ id: 'assets', label: 'assets/', kind: 'assets' as const }] },
    { group: 'blocks', items: [blocksFile] },
    { group: 'layout', items: layoutFile ? [layoutFile] : [] },
    { group: 'locales', items: localeFile ? [localeFile] : [] },
    { group: 'snippets', items: snippetFiles },
  ], [templateFiles, sectionFiles, configFile, layoutFile, snippetFiles, localeFile, blocksFile]);

  const findFile = useCallback((id: string): FileNode | undefined => tree.flatMap(g => g.items).find(f => f.id === id), [tree]);
  const selected = findFile(selectedId);

  const handleJsonChange = (val: string) => {
    setJsonText(val);
    setDirty(true);
    try { JSON.parse(val); setJsonError(''); } catch (err) { setJsonError(err instanceof Error ? err.message : 'Invalid JSON'); }
  };

  const parsedSections = (): Section[] | null => {
    try { return JSON.parse(jsonText) as Section[]; } catch { return null; }
  };

  const handleSaveDraft = async () => {
    if (!selectedTemplate) return;
    const sections = parsedSections();
    if (!sections) { setJsonError('Fix the JSON before saving.'); return; }
    setSaving(true);
    try {
      if (selectedTemplate.resourceType === 'home') {
        if (!homePage) return;
        const res = await apiUpdateStorePageSections(storeId, homePage._id, sections);
        setHomePage(res.data);
        setJsonText(JSON.stringify(res.data.draft.sections, null, 2));
      } else {
        const res = await apiUpdateCollectionTemplateSections(storeId, sections, selectedTemplate.resourceType, selectedTemplate.templateKey);
        setJsonText(JSON.stringify(res.data.draft.sections, null, 2));
      }
      setDirty(false);
      flash(true, 'Draft saved.');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'The backend rejected this JSON — check section/block shapes.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedTemplate) return;
    setPublishing(true);
    try {
      if (selectedTemplate.resourceType === 'home') {
        if (!homePage) return;
        const res = await apiPublishStorePage(storeId, homePage._id);
        setHomePage(res.data);
      } else {
        await apiPublishCollectionTemplate(storeId, selectedTemplate.resourceType, selectedTemplate.templateKey);
      }
      flash(true, 'Published — your storefront is now live with this draft.');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to publish.');
    } finally {
      setPublishing(false);
    }
  };

  if (storeLoading || loading) {
    return <div className="p-7 flex flex-col gap-4"><SkeletonBox width={240} height={22} rounded="6px" /><SkeletonBox height={500} rounded="16px" /></div>;
  }

  return (
    <div className="bg-[#FAF9F5] min-h-full">
      <StorePageHeader
        title="Edit Code — Atelier"
        subtitle="Developer workspace — each templates/*.json is the same real draft document the Customize page edits, just as raw data."
        actions={
          selected?.kind === 'json' ? (
            <div className="flex items-center gap-2">
              {jsonError ? (
                <span className="flex items-center gap-1 text-[12px] text-error"><AlertCircle size={13} /> Invalid JSON</span>
              ) : dirty ? (
                <span className="text-[12px] text-slate">Unsaved changes</span>
              ) : (
                <span className="flex items-center gap-1 text-[12px] text-success"><CheckCircle2 size={13} /> Saved</span>
              )}
              <button onClick={handleSaveDraft} disabled={saving || !!jsonError} className="flex items-center gap-1.5 px-3.5 py-[8px] rounded-[10px] text-[12.5px] font-semibold border border-bone bg-white text-charcoal cursor-pointer disabled:opacity-60">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save Draft
              </button>
              <button onClick={handlePublish} disabled={publishing} className="flex items-center gap-1.5 px-4 py-[9px] rounded-[10px] text-[13px] font-bold text-white border-none cursor-pointer disabled:opacity-60" style={{ background: '#D97757' }}>
                {publishing ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />} Publish
              </button>
            </div>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-0 px-4 lg:px-7 py-5">
        <div className="flex flex-col gap-4 pr-4 border-r border-bone">
          {tree.map(group => (
            <div key={group.group}>
              <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate mb-1.5 px-1">{group.group}</p>
              <div className="flex flex-col gap-0.5">
                {group.items.length === 0 && <p className="text-[11.5px] text-slate px-2 py-1">—</p>}
                {group.items.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedId(f.id)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] text-left bg-transparent border-none cursor-pointer"
                    style={{ background: selectedId === f.id ? '#F1EDE5' : 'transparent', color: f.kind === 'unavailable' ? '#B0AC9F' : '#2E2C29' }}
                  >
                    {f.kind === 'json' ? <FileJson size={13} /> : f.kind === 'code' ? <FileCode size={13} /> : f.kind === 'assets' ? <ImageIcon size={13} /> : <Folder size={13} />}
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pl-4">
          {!selected ? (
            <div className="flex items-center justify-center h-[500px] text-center px-8">
              <p className="text-[13px] text-slate">Select a file from the tree on the left.</p>
            </div>
          ) : selected.kind === 'assets' ? (
            <AssetsPanel storeId={storeId} />
          ) : selected.kind === 'json' ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2 min-w-0">
                {jsonError && <p className="text-[12px] text-error px-1">{jsonError}</p>}
                <textarea
                  value={jsonText}
                  onChange={e => handleJsonChange(e.target.value)}
                  spellCheck={false}
                  className="w-full rounded-xl border border-bone p-4 font-mono text-[12.5px] leading-relaxed resize-none"
                  style={{ height: 'calc(100vh - 260px)', background: '#1E1B18', color: '#EDE9E1', borderColor: jsonError ? '#B3413A' : undefined }}
                />
              </div>

              <div className="flex flex-col gap-2 min-w-0">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">Live Preview</p>
                  <div className="flex items-center gap-1 border border-bone rounded-lg p-1 bg-white">
                    {(['desktop', 'tablet', 'mobile'] as const).map(d => {
                      const Icon = d === 'desktop' ? Monitor : d === 'tablet' ? Tablet : Smartphone;
                      return (
                        <button key={d} type="button" onClick={() => setDevice(d)} aria-label={d}
                          className="p-1.5 rounded-md border-none cursor-pointer"
                          style={{ background: device === d ? '#F1EDE5' : 'transparent', color: device === d ? '#161412' : '#8C8A82' }}>
                          <Icon size={13} />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="border border-bone rounded-xl bg-white overflow-hidden" style={{ height: 'calc(100vh - 300px)' }}>
                  <div className="h-full overflow-auto flex justify-center bg-[#F1EDE5] p-3">
                    <div style={{ width: DEVICE_WIDTH[device], maxWidth: '100%', background: t.colors.bg, boxShadow: device !== 'desktop' ? '0 0 0 1px #E4DFD3' : undefined, transition: 'width 200ms' }}>
                      <AtelierLivePreview
                        sections={previewSections}
                        showChrome={selectedTemplate?.resourceType === 'home'}
                        draftTheme={draftTheme}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <pre
              className="w-full rounded-xl border border-bone p-4 font-mono text-[11.5px] leading-relaxed overflow-auto"
              style={{ height: 'calc(100vh - 220px)', background: '#1E1B18', color: '#B8B2A6', margin: 0 }}
            >
              {selected.content}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
