import { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, FileJson, FileCode, Folder, Save, CheckCircle2, UploadCloud, AlertCircle, AlertTriangle, Image as ImageIcon, ExternalLink, Monitor, Tablet, Smartphone, History, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/contexts/ToastContext';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { SkeletonBox } from '@/components/comman/ui';
import { EditorTopBar, PreviewButton } from '../builder/EditorTopBar';
import {
  apiListStorePages, apiUpdateStorePageSections, apiPublishStorePage,
  apiRevertStorePageDraft, apiListStorePageVersions, apiRestoreStorePageVersion,
  type StorePageData,
} from '@/api/services/storePages';
import {
  apiGetCollectionTemplate, apiUpdateCollectionTemplateSections, apiPublishCollectionTemplate,
  apiRevertCollectionTemplateDraft, apiListCollectionTemplateVersions, apiRestoreCollectionTemplateVersion,
  type ResourceTemplateType,
} from '@/api/services/collectionTemplate';
import type { Section } from '@/api/services/storefrontTypes';
import { apiBrowseMediaLibrary, type MediaAsset } from '@/api/services/mediaLibrary';
import { apiGetStoreTheme, type StoreThemeData } from '@/api/services/storeTheme';
import { useResolvedThemeInstance } from '../builder/useResolvedThemeInstance';
import { SECTION_META } from '../builder/sectionRegistry';
import { validateSectionsJson } from '../builder/validateSectionsJson';
import { VersionHistoryModal, type VersionRow } from '../builder/VersionHistoryModal';
import { AtelierLivePreview } from './AtelierLivePreview';
import { getThemePreviewComponents } from '@/features/storefront-themes/themePreviewComponents';
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

  // Same P0 fix as `AtelierCustomizePage.tsx` — resolves the URL's
  // `:themeId` to this theme's own installed row (only affects the one
  // `apiGetStoreTheme` call below, which drives the manifest/dev-files/
  // preview colors — the templates/*.json files themselves are real
  // `StorePage`/`CollectionTemplate` documents, shared across themes,
  // unaffected by which theme instance is selected).
  const themeInstance = useResolvedThemeInstance(storeId);
  const installedThemeId = themeInstance.status === 'ready' ? themeInstance.installedThemeId : undefined;

  const [homePage, setHomePage] = useState<StorePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('templates/home.json');
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  // Phase 10 — a persistent (not just a toast) record of the last
  // Save/Publish rejection, so a seller who dismisses or misses the toast
  // still has a clear reason on screen. Cleared on the next successful
  // attempt or file switch.
  const [saveError, setSaveError] = useState('');
  const [discarding, setDiscarding] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);

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
    () => manifest.templates
      // Phase 5's 'pages' scope (`resource.kind:'store-page', pageType:
      // 'custom'`) picks among MANY real documents, not one fixed file —
      // Edit Code's JSON-file model is inherently one-file-per-scope, so
      // there's no single "pages.json" to show here. `home.json` (the
      // OTHER store-page scope) already covers the one real single-document
      // page this view can meaningfully represent; a custom page is still
      // fully editable via Customize's own picker or the Pages screen.
      .filter(d => !(d.resource.kind === 'store-page' && d.resource.pageType === 'custom'))
      .map(d => {
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

  // Phase 10 — structural pre-validation (section/block types, settings
  // shape, dynamic-source pairing) run on every keystroke, same "don't
  // wait for a round trip to the server to tell you something's wrong"
  // reasoning as the JSON-syntax check below. Skipped while `jsonText`
  // isn't even valid JSON yet — the syntax error alone is enough in that
  // case, and there's nothing structural to check on unparseable text.
  const { errors: structuralErrors, notices: structuralNotices } = useMemo(() => {
    if (jsonError) return { errors: [] as string[], notices: [] as string[] };
    try {
      return validateSectionsJson(JSON.parse(jsonText));
    } catch {
      return { errors: [] as string[], notices: [] as string[] };
    }
  }, [jsonText, jsonError]);

  useEffect(() => {
    apiListStorePages(storeId)
      .then(res => setHomePage(res.data.find(p => p.type === 'home') ?? null))
      .finally(() => setLoading(false));
  }, [storeId]);

  useEffect(() => {
    if (themeInstance.status !== 'ready') return;
    apiGetStoreTheme(storeId, themeInstance.installedThemeId).then(res => setDraftTheme(res.data)).catch(() => {});
  }, [storeId, themeInstance.status, installedThemeId]);

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
    // Real, previously-latent bug found while adding this phase's own
    // validation states: these resets used to sit AFTER the `home` branch's
    // early `return`, so switching TO home.json never cleared a stale
    // "Unsaved changes"/"Invalid JSON" state left over from whichever file
    // was open before it — the top bar kept showing the PREVIOUS file's
    // status even though `jsonText` had already been replaced with home's
    // own real content. Now runs unconditionally, for every file switch.
    setDirty(false);
    setJsonError('');
    setSaveError('');
    if (selectedTemplate.resourceType === 'home') {
      if (homePage) setJsonText(JSON.stringify(homePage.draft?.sections ?? homePage.sections, null, 2));
      return;
    }
    apiGetCollectionTemplate(storeId, selectedTemplate.resourceType, selectedTemplate.templateKey)
      .then(res => setJsonText(JSON.stringify(res.data.draft?.sections ?? res.data.sections, null, 2)))
      .catch(() => setJsonText('[]'));
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
    setSaveError('');
    try { JSON.parse(val); setJsonError(''); } catch (err) { setJsonError(err instanceof Error ? err.message : 'Invalid JSON'); }
  };

  /** `null` for anything that isn't genuinely a JSON array — a valid-but-
   *  wrong-shape parse (e.g. a plain object, or a JSON string) used to be
   *  cast straight through with no check at all, real gap found while
   *  building this phase's validation pass. */
  const parsedSections = (): Section[] | null => {
    try {
      const parsed = JSON.parse(jsonText);
      return Array.isArray(parsed) ? (parsed as Section[]) : null;
    } catch {
      return null;
    }
  };

  // Phase 10 — Save is blocked on a real error (nothing invalid can ever
  // reach the draft this way). Publish additionally requires the file to
  // already be saved — the one real guard against "Publish silently
  // republishes a stale draft while a seller's current unsaved edits sit
  // ignored in the editor," since Publish promotes whatever the draft
  // already holds, not the textarea's current contents.
  const saveBlockingReason = jsonError
    ? 'Fix the JSON syntax error before saving.'
    : structuralErrors.length > 0
      ? `Fix ${structuralErrors.length} validation ${structuralErrors.length === 1 ? 'issue' : 'issues'} before saving.`
      : '';
  const publishBlockingReason = saveBlockingReason
    ? saveBlockingReason.replace('before saving.', 'before saving or publishing.')
    : dirty
      ? 'Save your changes before publishing.'
      : '';

  const handleSaveDraft = async () => {
    if (!selectedTemplate) return;
    if (saveBlockingReason) return;
    const sections = parsedSections();
    if (!sections) { setJsonError('Must be a JSON array of sections.'); return; }
    setSaving(true);
    setSaveError('');
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
      const message = err instanceof Error ? err.message : 'The backend rejected this JSON — check section/block shapes.';
      setSaveError(message);
      flash(false, message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedTemplate) return;
    if (publishBlockingReason) return;
    setPublishing(true);
    setSaveError('');
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
      const message = err instanceof Error ? err.message : 'Failed to publish.';
      setSaveError(message);
      flash(false, message);
    } finally {
      setPublishing(false);
    }
  };

  // Phase 10 — Discard/Version History, previously entirely missing from
  // this workspace despite being standard in the visual Customize editor
  // (req: "keep Preview, Save Draft, Publish, Discard and Version History
  // behavior consistent"). Same branch-by-resourceType pattern as Save/
  // Publish above, and the same real backend endpoints Customize already
  // uses — no parallel revert/version mechanism invented here.
  const handleDiscard = async () => {
    if (!selectedTemplate) return;
    setDiscarding(true);
    setSaveError('');
    try {
      if (selectedTemplate.resourceType === 'home') {
        if (!homePage) return;
        const res = await apiRevertStorePageDraft(storeId, homePage._id);
        setHomePage(res.data);
        setJsonText(JSON.stringify(res.data.draft.sections, null, 2));
      } else {
        const res = await apiRevertCollectionTemplateDraft(storeId, selectedTemplate.resourceType, selectedTemplate.templateKey);
        setJsonText(JSON.stringify(res.data.draft.sections, null, 2));
      }
      setDirty(false);
      setJsonError('');
      flash(true, 'Draft discarded — reverted to your published version.');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to discard draft.');
    } finally {
      setDiscarding(false);
    }
  };

  const openVersions = () => {
    if (!selectedTemplate) return;
    setVersionsOpen(true);
    setVersionsLoading(true);
    const req = selectedTemplate.resourceType === 'home'
      ? (homePage ? apiListStorePageVersions(storeId, homePage._id) : Promise.resolve({ data: [] as VersionRow[] }))
      : apiListCollectionTemplateVersions(storeId, selectedTemplate.resourceType, selectedTemplate.templateKey);
    req.then(res => setVersions(res.data)).catch(() => setVersions([])).finally(() => setVersionsLoading(false));
  };

  const restoreVersion = async (versionId: string) => {
    if (!selectedTemplate) return;
    setRestoringVersionId(versionId);
    setSaveError('');
    try {
      if (selectedTemplate.resourceType === 'home') {
        if (!homePage) return;
        const res = await apiRestoreStorePageVersion(storeId, homePage._id, versionId);
        setHomePage(res.data);
        setJsonText(JSON.stringify(res.data.draft.sections, null, 2));
      } else {
        const res = await apiRestoreCollectionTemplateVersion(storeId, versionId, selectedTemplate.resourceType, selectedTemplate.templateKey);
        setJsonText(JSON.stringify(res.data.draft.sections, null, 2));
      }
      setDirty(false);
      setJsonError('');
      setVersionsOpen(false);
      flash(true, 'Version restored to your draft — review it, then Publish.');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to restore version.');
    } finally {
      setRestoringVersionId(null);
    }
  };

  if (storeLoading || themeInstance.status === 'loading' || loading) {
    return <div className="p-7 flex flex-col gap-4"><SkeletonBox width={240} height={22} rounded="6px" /><SkeletonBox height={500} rounded="16px" /></div>;
  }

  // Safe rejection for an invalid/uninstalled/cross-store theme id — never
  // silently falls back to editing whichever theme happens to be active.
  if (themeInstance.status === 'not-found') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-center py-24 px-6">
        <p className="text-[14px] font-bold text-charcoal">This theme isn't installed on this store.</p>
        <Link to={`/store/${storeId}/online-store/themes`} className="text-[13px] font-semibold no-underline" style={{ color: '#D97757' }}>
          Back to Themes
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF9F5] min-h-full">
      <EditorTopBar
        exitTo={`/store/${storeId}/online-store/themes`}
        title={`Edit Code — ${manifest.name}`}
        subtitle="Developer workspace — each templates/*.json is the same real draft document the Customize page edits, just as raw data."
      >
        <PreviewButton storeId={storeId} installedThemeId={installedThemeId} />
        {selected?.kind === 'json' && (
          <div className="flex items-center gap-2">
            {/* Device toggle moved here from the Live Preview panel's own
               mini-header (Phase 2 consistency with Customize/Header&Footer's
               top bar) — same `device`/`setDevice` state, no behavior change. */}
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
            {jsonError ? (
              <span className="flex items-center gap-1 text-[12px] text-error"><AlertCircle size={13} /> Invalid JSON</span>
            ) : structuralErrors.length > 0 ? (
              <span className="flex items-center gap-1 text-[12px] text-error"><AlertTriangle size={13} /> {structuralErrors.length} validation {structuralErrors.length === 1 ? 'issue' : 'issues'}</span>
            ) : dirty ? (
              <span className="text-[12px] text-slate">Unsaved changes</span>
            ) : (
              <span className="flex items-center gap-1 text-[12px] text-success"><CheckCircle2 size={13} /> Saved</span>
            )}
            <button onClick={openVersions} title="Version History" className="shrink-0 p-2 rounded-lg border border-bone bg-white text-charcoal cursor-pointer"><History size={15} /></button>
            <button onClick={handleDiscard} disabled={discarding} title="Discard Draft — revert to the published version" className="flex items-center gap-1.5 px-3.5 py-[8px] rounded-[10px] text-[12.5px] font-semibold border border-bone bg-white text-charcoal cursor-pointer disabled:opacity-60">
              {discarding ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Discard Draft
            </button>
            <button onClick={handleSaveDraft} disabled={saving || !!saveBlockingReason} title={saveBlockingReason || undefined} className="flex items-center gap-1.5 px-3.5 py-[8px] rounded-[10px] text-[12.5px] font-semibold border border-bone bg-white text-charcoal cursor-pointer disabled:opacity-60">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save Draft
            </button>
            <button onClick={handlePublish} disabled={publishing || !!publishBlockingReason} title={publishBlockingReason || undefined} className="flex items-center gap-1.5 px-4 py-[9px] rounded-[10px] text-[13px] font-bold text-white border-none cursor-pointer disabled:opacity-60" style={{ background: '#D97757' }}>
              {publishing ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />} Publish
            </button>
          </div>
        )}
      </EditorTopBar>

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
            // `xl:grid-cols-2` splits the column ~50/50, capping the Live
            // Preview at ~530px regardless of device — so "tablet" (768px)
            // and "desktop" (100%) both clamped to that same 530px, looking
            // identical. Stacking to one full-width column for tablet/mobile
            // (unchanged for desktop) gives the preview its full ~1160px
            // content width to actually show a real, distinct 768px/390px
            // box — same `device` state, no new logic.
            <div className="flex flex-col gap-3">
              {saveError && (
                <p className="flex items-start gap-2 text-[12.5px] font-semibold text-error bg-error-bg rounded-lg px-3 py-2.5">
                  <AlertTriangle size={14} className="shrink-0 mt-[1px]" /> {saveError}
                </p>
              )}
              <div className={device === 'desktop' ? 'grid grid-cols-1 xl:grid-cols-2 gap-4' : 'flex flex-col gap-4'}>
              <div className="flex flex-col gap-2 min-w-0">
                {jsonError ? (
                  <p className="text-[12px] text-error px-1">{jsonError}</p>
                ) : structuralErrors.length > 0 ? (
                  <div className="flex flex-col gap-1 bg-error-bg rounded-lg px-3 py-2.5 max-h-[140px] overflow-y-auto">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-error">{structuralErrors.length} validation {structuralErrors.length === 1 ? 'issue' : 'issues'}</p>
                    {structuralErrors.map((e, i) => <p key={i} className="text-[12px] text-error">{e}</p>)}
                  </div>
                ) : null}
                {structuralNotices.length > 0 && (
                  <div className="flex flex-col gap-1 bg-cream rounded-lg px-3 py-2.5 max-h-[100px] overflow-y-auto">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate">{structuralNotices.length} {structuralNotices.length === 1 ? 'notice' : 'notices'} — won't block saving</p>
                    {structuralNotices.map((n, i) => <p key={i} className="text-[12px] text-slate">{n}</p>)}
                  </div>
                )}
                <textarea
                  value={jsonText}
                  onChange={e => handleJsonChange(e.target.value)}
                  spellCheck={false}
                  className="w-full rounded-xl border border-bone p-4 font-mono text-[12.5px] leading-relaxed resize-none"
                  style={{ height: 'calc(100vh - 260px)', background: '#1E1B18', color: '#EDE9E1', borderColor: jsonError || structuralErrors.length > 0 ? '#B3413A' : undefined }}
                />
              </div>

              <div className="flex flex-col gap-2 min-w-0">
                {/* Device toggle now lives in the top bar (see `EditorTopBar`
                   usage above) — kept out of this mini-header to avoid two
                   controls for the same `device` state. */}
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate px-1">Live Preview</p>
                <div className="border border-bone rounded-xl bg-white overflow-hidden" style={{ height: 'calc(100vh - 300px)' }}>
                  <div className="h-full overflow-auto flex justify-center bg-[#F1EDE5] p-3">
                    <div style={{ width: DEVICE_WIDTH[device], maxWidth: '100%', background: getThemePreviewComponents(draftTheme?.themeDefinitionId, DEFAULT_THEME_ID).theme.colors.bg, boxShadow: device !== 'desktop' ? '0 0 0 1px #E4DFD3' : undefined, transition: 'width 200ms' }}>
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

      <VersionHistoryModal
        title={`${selectedTemplate?.label ?? 'Template'} — Version History`}
        open={versionsOpen}
        loading={versionsLoading}
        versions={versions}
        restoringId={restoringVersionId}
        onClose={() => setVersionsOpen(false)}
        onRestore={restoreVersion}
      />
    </div>
  );
}
