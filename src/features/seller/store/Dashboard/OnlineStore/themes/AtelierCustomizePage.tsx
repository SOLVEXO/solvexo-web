import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, RotateCcw, Undo2, Redo2, History, Monitor, Tablet, Smartphone, Plus } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { SkeletonBox } from '@/components/comman/ui';
import {
  apiListStorePages, apiUpdateStorePageSections, apiPublishStorePage, apiRevertStorePageDraft,
  apiListStorePageVersions, apiRestoreStorePageVersion,
  type StorePageData,
} from '@/api/services/storePages';
import {
  apiListResourceTemplates, apiCreateResourceTemplate, apiGetCollectionTemplate,
  apiUpdateCollectionTemplateSections, apiPublishCollectionTemplate, apiRevertCollectionTemplateDraft,
  apiListCollectionTemplateVersions, apiRestoreCollectionTemplateVersion,
  type CollectionTemplateData, type ResourceTemplateType,
} from '@/api/services/collectionTemplate';
import type { Section } from '@/api/services/storefrontTypes';
import type { VersionRow } from '../builder/VersionHistoryModal';
import { PageSectionsEditor } from '../builder/PageSectionsEditor';
import { VersionHistoryModal } from '../builder/VersionHistoryModal';
import { useEditorState } from '../builder/editor/useEditorState';
import { useUndoRedoShortcuts } from '../builder/editor/useUndoRedoShortcuts';
import { AtelierLivePreview } from './AtelierLivePreview';
import { AtelierThemeSettingsPanel } from './AtelierThemeSettingsPanel';
import { apiGetStoreTheme, type StoreThemeData } from '@/api/services/storeTheme';
import { atelierTheme as t } from '@/features/storefront-themes/theme-01-atelier/theme.config';
import { getThemeManifest, type ThemeTemplateScopeDef } from '@/features/storefront-themes/themeManifest';
// See the load-bearing comment on this same import in
// `AtelierThemeSettingsPanel.tsx` — importing `DEFAULT_THEME_ID` from
// `registry.ts` here (not redeclaring the literal) is what guarantees this
// theme's manifest has already registered itself before `getThemeManifest`
// below is called.
import { DEFAULT_THEME_ID } from '@/features/storefront-themes/registry';

const DEVICE_WIDTH: Record<'desktop' | 'tablet' | 'mobile', string> = { desktop: '100%', tablet: '768px', mobile: '390px' };

/** Every real customization surface for the active theme. `'theme'` is a
 *  fixed sentinel scope (not part of any theme's manifest) for the
 *  Schema-Driven Theme Settings screen (colors/fonts/buttons/spacing — a
 *  `StoreTheme` document, not a `Section[]` template) — it renders
 *  `AtelierThemeSettingsPanel` instead of the section editor below and owns
 *  its own draft/undo-redo/save/publish/version-history toolbar, since it's
 *  editing a fundamentally different resource. Every other scope comes from
 *  `manifest.templates` (see `themeManifest.ts` — a `store-page` resource
 *  is one real `StorePage` like Home; a `collection-template` resource is a
 *  real `CollectionTemplate` row, optionally with real alternate templates
 *  via `templateKey`). This page no longer hardcodes which scopes exist or
 *  how each is addressed on the backend — that's Phase 4 of the theme-
 *  agnostic architecture: a second theme's manifest drives this same page
 *  with no new code here. */
type ResourceConfig = { resourceType: ResourceTemplateType; templateKey: string; allowAltTemplates: boolean };

function SaveButton({ onClick, saving, label }: { onClick: () => void; saving: boolean; label: string }) {
  return (
    <button
      onClick={onClick} disabled={saving}
      className="flex items-center gap-1.5 px-5 py-[9px] rounded-[10px] text-[13px] font-bold text-white border-none cursor-pointer transition-opacity disabled:opacity-60"
      style={{ background: t.colors.accent }}
    >
      {saving ? <Loader2 size={13} className="animate-spin" /> : null} {label}
    </button>
  );
}

/** Theme 01's own Merchant Visual Customizer — `Online Store → Themes →
 *  Atelier → Customize`. Covers every real Atelier template (Home, Product,
 *  Collection, Search, Cart, Blog Index, Blog Article), including real
 *  alternate templates for Product/Collection. Reuses the exact same real
 *  section/block editor (`PageSectionsEditor`) and draft/publish/version-
 *  history engine the Pages tool already uses — no parallel editor built. */
export function AtelierCustomizePage() {
  const { storeId, loading: storeLoading } = useStoreWorkspace();
  const toast = useToast();
  const flash = (ok: boolean, text: string) => { if (ok) toast.success(text); else toast.error(text); };

  const [scope, setScope] = useState<string>('home');
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [discarding, setDiscarding] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);

  // Home is a real StorePage (one per store, no alternate keys). Every other
  // scope is a real CollectionTemplate row (see `config`, derived below from
  // the active theme's manifest).
  const [homePage, setHomePage] = useState<StorePageData | null>(null);
  const [templateList, setTemplateList] = useState<CollectionTemplateData[]>([]);
  const [templateKey, setTemplateKey] = useState('default');
  const [activeTemplate, setActiveTemplate] = useState<CollectionTemplateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [draftTheme, setDraftTheme] = useState<StoreThemeData | null>(null);

  const editor = useEditorState<Section[]>();
  useUndoRedoShortcuts(editor.undo, editor.redo, true);

  // `draftTheme` (fetched below) carries the store's real `themeDefinitionId`
  // once loaded; before that (or if it's ever null) `getThemeManifest` falls
  // back to `DEFAULT_THEME_ID`'s manifest, so this never throws waiting on
  // that fetch.
  const manifest = getThemeManifest(draftTheme?.themeDefinitionId, DEFAULT_THEME_ID);
  const scopeDefs: ThemeTemplateScopeDef[] = manifest.templates;
  const scopeDefsById: Record<string, ThemeTemplateScopeDef> = Object.fromEntries(scopeDefs.map(d => [d.id, d]));
  const activeScopeDef = scope === 'theme' ? null : scopeDefsById[scope] ?? null;
  // `store-page` scopes (Home) use the `StorePage` API family below;
  // everything else (including the `theme` sentinel, which has no
  // `activeScopeDef`) uses the `CollectionTemplate` family.
  const isStorePage = activeScopeDef?.resource.kind === 'store-page';
  const config: ResourceConfig | null = activeScopeDef && activeScopeDef.resource.kind === 'collection-template'
    ? { resourceType: activeScopeDef.resource.resourceType, templateKey: activeScopeDef.resource.templateKey, allowAltTemplates: activeScopeDef.resource.allowAltTemplates }
    : null;
  const scopeLabel = (s: string) => (s === 'theme' ? 'Theme Settings' : scopeDefsById[s]?.label ?? s);
  // Live working copy while the seller is on the Theme scope — composited
  // into the preview instead of `draftTheme` so every keystroke reflects
  // immediately, same as every section scope already does. `null` while on
  // any other scope, so those fall back to `draftTheme` untouched below.
  const [themeScopePreview, setThemeScopePreview] = useState<StoreThemeData | null>(null);

  // Click-to-select: which section is highlighted, shared between
  // `PageSectionsEditor`'s cards and `AtelierLivePreview`'s clickable
  // sections — either side setting it drives both (see each component's own
  // doc comment for how the id is computed/kept in sync). Cleared whenever
  // the sections being edited change out from under it (scope/template
  // switch), so a stale id never appears to "select" an unrelated section.
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  useEffect(() => { setSelectedSectionId(null); }, [scope, templateKey]);

  useEffect(() => { apiGetStoreTheme(storeId).then(res => setDraftTheme(res.data)).catch(() => {}); }, [storeId]);

  const loadHome = useCallback(() => {
    setLoading(true);
    apiListStorePages(storeId)
      .then(res => setHomePage(res.data.find(p => p.type === 'home') ?? null))
      .finally(() => setLoading(false));
  }, [storeId]);

  const loadResourceTemplates = useCallback((resourceType: ResourceTemplateType, key: string, allowAlt: boolean) => {
    setLoading(true);
    const listPromise = allowAlt ? apiListResourceTemplates(storeId, resourceType) : Promise.resolve({ data: [] as CollectionTemplateData[] });
    Promise.all([listPromise, apiGetCollectionTemplate(storeId, resourceType, key)])
      .then(([listRes, docRes]) => { setTemplateList(listRes.data); setActiveTemplate(docRes.data); })
      .finally(() => setLoading(false));
  }, [storeId]);

  useEffect(() => {
    if (scope === 'theme') { setLoading(false); return; }
    if (isStorePage) { loadHome(); return; }
    if (!config) return; // scope not (yet) resolvable against the manifest — nothing to load
    setTemplateKey(config.templateKey);
    loadResourceTemplates(config.resourceType, config.templateKey, config.allowAltTemplates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  // Re-fetch the active template doc (not the list) whenever the seller
  // switches which alternate template they're editing (Product/Collection
  // only — the other scopes' `templateKey` never changes from its fixed value).
  useEffect(() => {
    if (!config || !config.allowAltTemplates) return;
    apiGetCollectionTemplate(storeId, config.resourceType, templateKey).then(res => setActiveTemplate(res.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, templateKey]);

  const loadEditor = editor.load;
  useEffect(() => {
    if (isStorePage) {
      if (!homePage) return;
      loadEditor(homePage.sections, homePage.draft?.sections ?? homePage.sections);
    } else {
      if (!activeTemplate) return;
      loadEditor(activeTemplate.sections, activeTemplate.draft?.sections ?? activeTemplate.sections);
    }
  }, [scope, homePage?._id, activeTemplate?._id, activeTemplate?.templateKey, loadEditor]);

  const busy = editor.phase === 'saving' || editor.phase === 'publishing' || discarding;

  const handleSave = async () => {
    if (!editor.workingCopy) return;
    editor.markSaving();
    try {
      if (isStorePage) {
        if (!homePage) return;
        const res = await apiUpdateStorePageSections(storeId, homePage._id, editor.workingCopy);
        setHomePage(res.data);
        editor.markSaved(res.data.draft.sections);
      } else {
        const res = await apiUpdateCollectionTemplateSections(storeId, editor.workingCopy, config!.resourceType, templateKey);
        setActiveTemplate(res.data);
        editor.markSaved(res.data.draft.sections);
      }
      flash(true, 'Draft saved — Publish to make it live.');
    } catch (err) {
      editor.markSaveError(err instanceof Error ? err.message : 'Failed to save.');
      flash(false, err instanceof Error ? err.message : 'Failed to save.');
    }
  };

  const handlePersist = async (next: Section[]) => {
    try {
      if (isStorePage) {
        if (!homePage) return;
        const res = await apiUpdateStorePageSections(storeId, homePage._id, next);
        setHomePage(res.data);
        editor.markSaved(res.data.draft.sections);
      } else {
        const res = await apiUpdateCollectionTemplateSections(storeId, next, config!.resourceType, templateKey);
        setActiveTemplate(res.data);
        editor.markSaved(res.data.draft.sections);
      }
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to save.');
    }
  };

  const handlePublish = async () => {
    editor.markPublishing();
    try {
      // Publish must never republish a stale backend draft — if there's a
      // local edit that hasn't been saved yet, persist it first so Publish
      // always promotes exactly what the merchant currently sees.
      if (editor.dirty && editor.workingCopy) {
        if (isStorePage) {
          if (!homePage) return;
          await apiUpdateStorePageSections(storeId, homePage._id, editor.workingCopy);
        } else {
          await apiUpdateCollectionTemplateSections(storeId, editor.workingCopy, config!.resourceType, templateKey);
        }
      }
      if (isStorePage) {
        if (!homePage) return;
        const res = await apiPublishStorePage(storeId, homePage._id);
        setHomePage(res.data);
        editor.markPublished(res.data.sections);
      } else {
        const res = await apiPublishCollectionTemplate(storeId, config!.resourceType, templateKey);
        setActiveTemplate(res.data);
        editor.markPublished(res.data.sections);
      }
      flash(true, 'Published — your storefront is now live with these changes.');
    } catch (err) {
      editor.markPublishError(err instanceof Error ? err.message : 'Failed to publish.');
      flash(false, err instanceof Error ? err.message : 'Failed to publish.');
    }
  };

  const handleDiscard = async () => {
    setDiscarding(true);
    try {
      if (isStorePage) {
        if (!homePage) return;
        const res = await apiRevertStorePageDraft(storeId, homePage._id);
        setHomePage(res.data);
        editor.discardDraft(res.data.draft.sections);
      } else {
        const res = await apiRevertCollectionTemplateDraft(storeId, config!.resourceType, templateKey);
        setActiveTemplate(res.data);
        editor.discardDraft(res.data.draft.sections);
      }
      flash(true, 'Draft discarded — reverted to your published version.');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to discard draft.');
    } finally {
      setDiscarding(false);
    }
  };

  const openVersions = () => {
    setVersionsOpen(true);
    setVersionsLoading(true);
    const req = isStorePage
      ? (homePage ? apiListStorePageVersions(storeId, homePage._id) : Promise.resolve({ data: [] as VersionRow[] }))
      : apiListCollectionTemplateVersions(storeId, config!.resourceType, templateKey);
    req.then(res => setVersions(res.data)).catch(() => setVersions([])).finally(() => setVersionsLoading(false));
  };

  const restoreVersion = async (versionId: string) => {
    setRestoringVersionId(versionId);
    try {
      if (isStorePage) {
        if (!homePage) return;
        const res = await apiRestoreStorePageVersion(storeId, homePage._id, versionId);
        setHomePage(res.data);
        editor.discardDraft(res.data.draft.sections);
      } else {
        const res = await apiRestoreCollectionTemplateVersion(storeId, versionId, config!.resourceType, templateKey);
        setActiveTemplate(res.data);
        editor.discardDraft(res.data.draft.sections);
      }
      setVersionsOpen(false);
      flash(true, 'Version restored to your draft — review it, then Publish.');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to restore version.');
    } finally {
      setRestoringVersionId(null);
    }
  };

  const handleCreateTemplate = async () => {
    if (!config) return;
    const name = window.prompt(`Name your new ${scopeLabel(scope)} template (e.g. "Featured"):`);
    if (!name?.trim()) return;
    const key = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `template-${Date.now()}`;
    setCreatingTemplate(true);
    try {
      await apiCreateResourceTemplate(storeId, config.resourceType, { name: name.trim(), templateKey: key, cloneFromTemplateKey: templateKey });
      const listRes = await apiListResourceTemplates(storeId, config.resourceType);
      setTemplateList(listRes.data);
      setTemplateKey(key);
      flash(true, `"${name.trim()}" template created.`);
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to create template.');
    } finally {
      setCreatingTemplate(false);
    }
  };

  const pageOptions = useMemo(() => [{ slug: '', title: 'Home' }], []);

  if (storeLoading || loading) {
    return (
      <div className="p-7 flex flex-col gap-4">
        <SkeletonBox width={240} height={22} rounded="6px" />
        <SkeletonBox height={400} rounded="16px" />
      </div>
    );
  }

  const docMissing = scope === 'theme' ? false : isStorePage ? !homePage : !activeTemplate;
  const effectiveDraftTheme = scope === 'theme' && themeScopePreview ? themeScopePreview : draftTheme;

  return (
    <div className="bg-[#FAF9F5] min-h-full">
      <StorePageHeader
        title="Customize — Atelier"
        subtitle="Edits save to a draft — nothing goes live until you Publish."
        actions={
          // Two groups: the left one scrolls horizontally on narrow screens
          // (min-w-0 + overflow-x-auto lets it actually shrink instead of
          // pushing the page wide); Save Draft/Publish/Discard stay in their
          // own shrink-0 group so they're always reachable without scrolling,
          // even on a 390px viewport. The whole cluster still wraps beneath
          // the title if there's truly no room for either group at all.
          <div className="flex items-center gap-2 flex-wrap max-w-[calc(100vw-100px)] lg:max-w-none justify-end">
            <div className="flex items-center gap-2 overflow-x-auto min-w-0 py-0.5" style={{ scrollbarWidth: 'none' }}>
              <select
                value={scope}
                onChange={e => setScope(e.target.value)}
                className="shrink-0 text-[12.5px] font-semibold border border-bone rounded-lg px-2.5 py-[7px] bg-white text-charcoal cursor-pointer"
              >
                <option value="theme">Theme Settings</option>
                {scopeDefs.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>

              {config?.allowAltTemplates && (
                <>
                  <select
                    value={templateKey}
                    onChange={e => setTemplateKey(e.target.value)}
                    className="shrink-0 text-[12.5px] font-semibold border border-bone rounded-lg px-2.5 py-[7px] bg-white text-charcoal cursor-pointer"
                  >
                    {templateList.length === 0 && <option value="default">Default</option>}
                    {templateList.map(tpl => <option key={tpl.templateKey} value={tpl.templateKey}>{tpl.name}</option>)}
                  </select>
                  <button onClick={handleCreateTemplate} disabled={creatingTemplate} title="New Template" className="shrink-0 p-2 rounded-lg border border-bone bg-white text-charcoal disabled:opacity-60 cursor-pointer">
                    {creatingTemplate ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  </button>
                </>
              )}

              <div className="shrink-0 flex items-center gap-1 border border-bone rounded-lg p-1 bg-white mr-1">
                {(['desktop', 'tablet', 'mobile'] as const).map(d => {
                  const Icon = d === 'desktop' ? Monitor : d === 'tablet' ? Tablet : Smartphone;
                  return (
                    <button key={d} type="button" onClick={() => setDevice(d)} aria-label={d}
                      className="p-1.5 rounded-md border-none cursor-pointer"
                      style={{ background: device === d ? '#F1EDE5' : 'transparent', color: device === d ? '#161412' : '#8C8A82' }}>
                      <Icon size={15} />
                    </button>
                  );
                })}
              </div>

              {/* Theme scope owns its own Undo/Redo/Version-History/Discard/
                 Save/Publish (see `AtelierThemeSettingsPanel`) — a different
                 resource than a `Section[]` template, so it isn't wired to
                 the `editor` instance below. */}
              {scope !== 'theme' && (
                <>
                  <button onClick={editor.undo} disabled={!editor.canUndo} title="Undo" className="shrink-0 p-2 rounded-lg border border-bone bg-white text-charcoal disabled:opacity-40 cursor-pointer"><Undo2 size={15} /></button>
                  <button onClick={editor.redo} disabled={!editor.canRedo} title="Redo" className="shrink-0 p-2 rounded-lg border border-bone bg-white text-charcoal disabled:opacity-40 cursor-pointer"><Redo2 size={15} /></button>
                  <button onClick={openVersions} title="Version History" className="shrink-0 p-2 rounded-lg border border-bone bg-white text-charcoal cursor-pointer"><History size={15} /></button>
                </>
              )}
            </div>

            {scope !== 'theme' && (
              <div className="flex items-center gap-2 shrink-0">
                {editor.hasUnpublishedChanges && (
                  <button onClick={handleDiscard} disabled={busy} className="flex items-center gap-1.5 px-3.5 py-[9px] rounded-[10px] text-[12.5px] font-semibold border border-bone bg-white text-charcoal cursor-pointer disabled:opacity-60">
                    <RotateCcw size={13} /> Discard Draft
                  </button>
                )}
                <SaveButton onClick={handleSave} saving={editor.phase === 'saving'} label="Save Draft" />
                <SaveButton onClick={handlePublish} saving={editor.phase === 'publishing'} label="Publish" />
              </div>
            )}
          </div>
        }
      />

      {scope === 'theme' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-5 px-4 lg:px-7 py-5 items-start">
          <AtelierThemeSettingsPanel storeId={storeId} onDraftChange={setThemeScopePreview} />
          <div className="border border-bone rounded-2xl bg-white overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
            <div className="h-full overflow-auto flex justify-center bg-[#F1EDE5] p-4">
              <div style={{ width: DEVICE_WIDTH[device], maxWidth: '100%', background: t.colors.bg, boxShadow: device !== 'desktop' ? '0 0 0 1px #E4DFD3' : undefined, transition: 'width 200ms' }}>
                <AtelierLivePreview sections={[]} showChrome draftTheme={effectiveDraftTheme} />
              </div>
            </div>
          </div>
        </div>
      ) : docMissing ? (
        <div className="p-10 text-center"><p className="text-[14px] text-slate">Couldn't load this template.</p></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5 px-4 lg:px-7 py-5">
          <div className="flex flex-col gap-3">
            <p className="text-[12px] font-bold uppercase tracking-wide text-slate px-1">Sections</p>
            <PageSectionsEditor
              sections={editor.workingCopy ?? []}
              onChange={editor.edit}
              onPersist={handlePersist}
              pageOptions={pageOptions}
              storeId={storeId}
              selectedSectionId={selectedSectionId}
              onSelectSection={setSelectedSectionId}
            />
          </div>

          <div className="border border-bone rounded-2xl bg-white overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
            <div className="h-full overflow-auto flex justify-center bg-[#F1EDE5] p-4">
              <div style={{ width: DEVICE_WIDTH[device], maxWidth: '100%', background: t.colors.bg, boxShadow: device !== 'desktop' ? '0 0 0 1px #E4DFD3' : undefined, transition: 'width 200ms' }}>
                <AtelierLivePreview
                  sections={editor.workingCopy ?? []}
                  showChrome={activeScopeDef?.showChrome ?? false}
                  draftTheme={effectiveDraftTheme}
                  interactive
                  selectedSectionId={selectedSectionId}
                  onSelectSection={setSelectedSectionId}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <VersionHistoryModal
        title={`${scopeLabel(scope)} — Version History`}
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
