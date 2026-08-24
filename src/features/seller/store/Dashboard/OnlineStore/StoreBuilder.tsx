import { useState, useEffect, useCallback } from 'react';
import { Loader2, Eye, EyeOff, ExternalLink, LayoutGrid, LayoutList, Palette, PanelTop, PanelBottom, Newspaper, UserCog, UploadCloud, RotateCcw, Undo2, Redo2, History } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { SkeletonBox } from '@/components/comman/ui';
import { getStorefrontUrl } from '@/utils/storefrontUrl';
import {
  apiListStorePages, apiCreateStorePage, apiUpdateStorePageSections,
  apiPublishStorePage, apiUnpublishStorePage, apiRevertStorePageDraft, apiDeleteStorePage,
  apiListStorePageVersions, apiRestoreStorePageVersion,
  type StorePageData, type StorePageVersionData,
} from '@/api/services/storePages';
import {
  apiGetStoreTheme, apiUpdateStoreThemeColors, apiUpdateStoreHeader, apiUpdateStoreFooter, apiUpdateIdentityBanner,
  apiPublishStoreTheme, apiRevertStoreThemeDraft, apiListStoreThemeVersions, apiRestoreStoreThemeVersion,
  type StoreThemeData, type ThemeVersionData,
} from '@/api/services/storeTheme';
import {
  apiGetCollectionTemplate, apiUpdateCollectionTemplateSections,
  apiPublishCollectionTemplate, apiRevertCollectionTemplateDraft,
  apiListCollectionTemplateVersions, apiRestoreCollectionTemplateVersion,
  type CollectionTemplateVersionData,
} from '@/api/services/collectionTemplate';
import type { Section } from '@/api/services/storefrontTypes';
import { PagesList } from './builder/PagesList';
import { PageSectionsEditor } from './builder/PageSectionsEditor';
import { ThemeTab } from './builder/ThemeTab';
import { ConfirmDialog } from './builder/ConfirmDialog';
import { HeaderTab, FooterTab } from './builder/HeaderFooterTabs';
import { StoreInfoTab } from './builder/StoreInfoTab';
import { BlogTab } from './builder/BlogTab';
import { VersionHistoryModal } from './builder/VersionHistoryModal';
import type { ThemeDefinition } from './builder/themes';
import { useEditorState } from './builder/editor/useEditorState';
import { useUndoRedoShortcuts } from './builder/editor/useUndoRedoShortcuts';
import { previewChannelName, type PreviewSyncMessage } from './builder/editor/previewSync';

/** Theme/Header/Footer/Store Info share one server-side draft/publish document (see StoreThemeData) — so they share ONE editor-engine instance and undo/redo history, matching how "Save"/"Publish"/"Discard Draft" already treat them as one combined surface today. */
type ThemeWorkingCopy = StoreThemeData['draft'];

type Tab = 'pages' | 'collection' | 'theme' | 'header' | 'footer' | 'storeInfo' | 'blog';
const TABS: { id: Tab; label: string; Icon: typeof LayoutGrid }[] = [
  { id: 'pages',      label: 'Pages',           Icon: LayoutGrid },
  { id: 'collection', label: 'Collection Page', Icon: LayoutList },
  { id: 'theme',      label: 'Theme',           Icon: Palette },
  { id: 'header',     label: 'Header',          Icon: PanelTop },
  { id: 'footer',     label: 'Footer',          Icon: PanelBottom },
  { id: 'storeInfo',  label: 'Store Info',      Icon: UserCog },
  { id: 'blog',       label: 'Blog',            Icon: Newspaper },
];

function SaveButton({ onClick, saving, label }: { onClick: () => void; saving: boolean; label: string }) {
  return (
    <button
      onClick={onClick} disabled={saving}
      className="flex items-center gap-1.5 px-5 py-[9px] rounded-[10px] text-[13px] font-bold text-white border-none cursor-pointer transition-opacity disabled:opacity-60"
      style={{ background: '#D97757' }}
    >
      {saving ? <Loader2 size={13} className="animate-spin" /> : null} {label}
    </button>
  );
}

export function StoreBuilder() {
  const { storeId, store, loading: storeLoading } = useStoreWorkspace();
  const [tab, setTab] = useState<Tab>('pages');

  const [pages, setPages] = useState<StorePageData[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const pagesEditor = useEditorState<Section[]>();
  const [pagesLoading, setPagesLoading] = useState(true);
  const [creatingPage, setCreatingPage] = useState(false);
  const [discardingPageDraft, setDiscardingPageDraft] = useState(false);

  // The singleton Collection Template — same draft/live/publish shape as a
  // StorePage's `sections`, so it gets its own `useEditorState<Section[]>()`
  // instance (a genuinely different server document from any StorePage, so
  // it can't share `pagesEditor`'s undo/redo history), but behaves like the
  // Theme-family tabs for publish (one Save button + the shared banner —
  // no per-document "first publish" toggle the way Pages has, since there's
  // only ever one Collection Template per store).
  const collectionTemplateEditor = useEditorState<Section[]>();
  const [collectionTemplateLoading, setCollectionTemplateLoading] = useState(true);
  const [discardingCollectionTemplateDraft, setDiscardingCollectionTemplateDraft] = useState(false);

  // Theme/Header/Footer/Store Info now run on the new editor engine — one
  // instance for all four, since they share one server-side draft/publish
  // document and (per the pre-existing design) one combined "Save"/"Publish"/
  // "Discard Draft" surface. `published` = the live root fields; `workingCopy`
  // = what every tab actually edits (starts equal to the server draft).
  // Undo/redo, dirty-tracking, and the save/publish lifecycle all come from
  // this one hook now instead of five separately-hand-diffed pieces of state.
  const themeEditor = useEditorState<ThemeWorkingCopy>();
  const [themeLoading, setThemeLoading] = useState(true);
  // Discard Draft has no dedicated phase in the editor engine (it's neither
  // a save nor a publish) — this is just its own local busy flag for the
  // button's disabled/spinner state during the round trip.
  const [discardingThemeDraft, setDiscardingThemeDraft] = useState(false);
  // Controlled here (not local to `ThemeTab`) so the page grid can give the
  // Theme Gallery the FULL page width instead of squeezing it into the
  // narrow control rail that only Customize mode actually benefits from
  // (that rail exists so the live preview can dominate while fine-tuning
  // individual fields — the gallery's own "Preview" opens a real, fully
  // independent storefront preview in a new browser tab instead, see
  // `ThemePreviewPage.tsx`, so it never needs a side-by-side column here).
  const [themeMode, setThemeMode] = useState<'themes' | 'customize'>('themes');

  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const selectedPage = pages.find(p => p._id === selectedPageId) ?? null;

  const loadPages = useCallback(() => {
    setPagesLoading(true);
    apiListStorePages(storeId)
      .then(res => {
        setPages(res.data);
        const home = res.data.find(p => p.type === 'home');
        setSelectedPageId(prev => prev ?? home?._id ?? res.data[0]?._id ?? null);
      })
      .finally(() => setPagesLoading(false));
  }, [storeId]);

  // Loads the live fields as `published` and the server draft as the
  // engine's `workingCopy` — every Theme/Header/Footer/Store Info edit from
  // here on goes through `themeEditor`, never a direct setState.
  // `loadThemeWorkingCopy` is pulled out to a plain local const first —
  // `themeEditor.load` alone (a stable, useCallback-wrapped function) is a
  // valid, referentially-stable dependency, but eslint-plugin-react-hooks
  // doesn't recognize a member-expression dependency here and asks for the
  // whole `themeEditor` object instead, which is NOT stable (it's a fresh
  // object every render) and would turn this into an infinite reload loop if
  // actually followed. This is the standard workaround for that limitation.
  const loadThemeWorkingCopy = themeEditor.load;
  const loadTheme = useCallback(() => {
    setThemeLoading(true);
    apiGetStoreTheme(storeId)
      .then(res => {
        loadThemeWorkingCopy(
          { theme: res.data.theme, header: res.data.header, footer: res.data.footer, identityBanner: res.data.identityBanner, baseThemeId: res.data.baseThemeId, customCss: res.data.customCss },
          res.data.draft,
        );
      })
      .finally(() => setThemeLoading(false));
  }, [storeId, loadThemeWorkingCopy]);

  // Loaded once on mount, like `loadTheme` — the template is a singleton, so
  // there's no per-document id dependency the way `pagesEditor`'s load has.
  const loadCollectionTemplateEditor = collectionTemplateEditor.load;
  const loadCollectionTemplate = useCallback(() => {
    setCollectionTemplateLoading(true);
    apiGetCollectionTemplate(storeId)
      .then(res => { loadCollectionTemplateEditor(res.data.sections, res.data.draft.sections); })
      .finally(() => setCollectionTemplateLoading(false));
  }, [storeId, loadCollectionTemplateEditor]);

  useEffect(() => { loadPages(); loadTheme(); loadCollectionTemplate(); }, [loadPages, loadTheme, loadCollectionTemplate]);
  // Editing always targets the DRAFT now — a page that's already live keeps
  // showing its published content to buyers until Publish is clicked. Falls
  // back to the live `sections` only for a response shape that predates this
  // field (shouldn't happen once the backend backfill runs, but avoids a
  // blank editor if it ever does). Re-loads (fresh undo/redo history) every
  // time the selected page changes, same as switching a Theme-family tab
  // doesn't reload but switching the PAGE itself is a genuinely different
  // document.
  const loadPagesEditor = pagesEditor.load;
  useEffect(() => {
    if (!selectedPage) return;
    loadPagesEditor(selectedPage.sections, selectedPage.draft?.sections ?? selectedPage.sections);
  }, [selectedPage?._id, loadPagesEditor]);

  // Was a local, inline "SaveStatus" banner (fixed 3s auto-hide, its own
  // little pill in the page header) — now the shared app-wide toast layer
  // (already built and used on the buyer side, just never adopted anywhere
  // in the seller workspace) so this Save/Publish/Discard feedback looks and
  // behaves the same as every other confirmation in the app.
  const flash = (ok: boolean, text: string) => { if (ok) toast.success(text); else toast.error(text); };

  const handleSaveSections = async () => {
    if (!selectedPage || !pagesEditor.workingCopy) return;
    pagesEditor.markSaving();
    try {
      const res = await apiUpdateStorePageSections(storeId, selectedPage._id, pagesEditor.workingCopy);
      setPages(prev => prev.map(p => p._id === res.data._id ? res.data : p));
      pagesEditor.markSaved(res.data.draft.sections);
      flash(true, 'Draft saved — Publish to make it live.');
    } catch (err) {
      pagesEditor.markSaveError(err instanceof Error ? err.message : 'Failed to save.');
      flash(false, err instanceof Error ? err.message : 'Failed to save.');
    }
  };

  // First-time "go live" and "take down" only — pushing a NEW edit on an
  // already-published page live is `handlePublishPage` below (the
  // unpublished-changes banner), since `status` alone can't tell those two
  // publish actions apart any more now that Pages has a real draft.
  const handleTogglePublish = async () => {
    if (!selectedPage) return;
    setSaving(true);
    try {
      const res = selectedPage.status === 'published'
        ? await apiUnpublishStorePage(storeId, selectedPage._id)
        : await apiPublishStorePage(storeId, selectedPage._id);
      setPages(prev => prev.map(p => p._id === res.data._id ? res.data : p));
      if (res.data.status === 'published') pagesEditor.markPublished(res.data.sections);
      flash(true, res.data.status === 'published' ? 'Page published' : 'Page unpublished');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishPage = async () => {
    if (!selectedPage) return;
    pagesEditor.markPublishing();
    try {
      const res = await apiPublishStorePage(storeId, selectedPage._id);
      setPages(prev => prev.map(p => p._id === res.data._id ? res.data : p));
      pagesEditor.markPublished(res.data.sections);
      flash(true, 'Published — your storefront is now live with these changes.');
    } catch (err) {
      pagesEditor.markPublishError(err instanceof Error ? err.message : 'Failed to publish.');
      flash(false, err instanceof Error ? err.message : 'Failed to publish.');
    }
  };

  const handleDiscardPageDraft = async () => {
    if (!selectedPage) return;
    setDiscardingPageDraft(true);
    try {
      const res = await apiRevertStorePageDraft(storeId, selectedPage._id);
      setPages(prev => prev.map(p => p._id === res.data._id ? res.data : p));
      pagesEditor.discardDraft(res.data.draft.sections);
      flash(true, 'Draft discarded — reverted to your published page.');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to discard draft.');
    } finally {
      setDiscardingPageDraft(false);
    }
  };

  const handleCreatePage = async (title: string, slug: string, sections?: Section[]) => {
    setCreatingPage(true);
    try {
      const res = await apiCreateStorePage(storeId, { title, slug });
      let page = res.data;
      // Template-originated pages seed their sections in a second call —
      // `create-page` itself always starts a page with `sections: []`, same
      // as a blank page, so a template is just a convenience pre-fill on top
      // of that, not a different creation path.
      if (sections?.length) {
        const seeded = await apiUpdateStorePageSections(storeId, page._id, sections);
        page = seeded.data;
      }
      setPages(prev => [...prev, page]);
      setSelectedPageId(page._id);
    } finally {
      setCreatingPage(false);
    }
  };

  // Nothing deletes straight from the row click — `onDelete` only opens the
  // confirm dialog below; the actual API call happens in `confirmDeletePage`.
  const [pendingDeletePageId, setPendingDeletePageId] = useState<string | null>(null);
  const [deletingPage, setDeletingPage] = useState(false);

  const confirmDeletePage = async () => {
    if (!pendingDeletePageId) return;
    setDeletingPage(true);
    try {
      await apiDeleteStorePage(storeId, pendingDeletePageId);
      setPages(prev => prev.filter(p => p._id !== pendingDeletePageId));
      if (selectedPageId === pendingDeletePageId) setSelectedPageId(null);
      setPendingDeletePageId(null);
    } finally {
      setDeletingPage(false);
    }
  };

  // Removing a section/block (or a nav link/footer block, below) is
  // confirmed via a dialog, so — unlike an ordinary field edit — it should
  // behave like the real deletion it is: saved immediately, not left
  // sitting in the unsaved draft only to silently come back on next load if
  // the seller never gets around to clicking "Save Changes."
  const persistSections = async (next: Section[]) => {
    pagesEditor.edit(next);
    if (!selectedPage) return;
    pagesEditor.markSaving();
    try {
      const res = await apiUpdateStorePageSections(storeId, selectedPage._id, next);
      setPages(prev => prev.map(p => p._id === res.data._id ? res.data : p));
      pagesEditor.markSaved(res.data.draft.sections);
    } catch (err) {
      pagesEditor.markSaveError(err instanceof Error ? err.message : 'Failed to remove — try again.');
      flash(false, err instanceof Error ? err.message : 'Failed to remove — try again.');
    }
  };

  const handleSaveCollectionTemplate = async () => {
    if (!collectionTemplateEditor.workingCopy) return;
    collectionTemplateEditor.markSaving();
    try {
      const res = await apiUpdateCollectionTemplateSections(storeId, collectionTemplateEditor.workingCopy);
      collectionTemplateEditor.markSaved(res.data.draft.sections);
      flash(true, 'Draft saved — Publish to make it live.');
    } catch (err) {
      collectionTemplateEditor.markSaveError(err instanceof Error ? err.message : 'Failed to save.');
      flash(false, err instanceof Error ? err.message : 'Failed to save.');
    }
  };

  const handlePublishCollectionTemplate = async () => {
    collectionTemplateEditor.markPublishing();
    try {
      const res = await apiPublishCollectionTemplate(storeId);
      collectionTemplateEditor.markPublished(res.data.sections);
      flash(true, 'Published — your storefront is now live with these changes.');
    } catch (err) {
      collectionTemplateEditor.markPublishError(err instanceof Error ? err.message : 'Failed to publish.');
      flash(false, err instanceof Error ? err.message : 'Failed to publish.');
    }
  };

  const handleDiscardCollectionTemplateDraft = async () => {
    setDiscardingCollectionTemplateDraft(true);
    try {
      const res = await apiRevertCollectionTemplateDraft(storeId);
      collectionTemplateEditor.discardDraft(res.data.draft.sections);
      flash(true, 'Draft discarded — reverted to your published version.');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to discard draft.');
    } finally {
      setDiscardingCollectionTemplateDraft(false);
    }
  };

  // Same "removal is a real delete, save it immediately" reasoning as
  // `persistSections` above.
  const persistCollectionTemplateSections = async (next: Section[]) => {
    collectionTemplateEditor.edit(next);
    collectionTemplateEditor.markSaving();
    try {
      const res = await apiUpdateCollectionTemplateSections(storeId, next);
      collectionTemplateEditor.markSaved(res.data.draft.sections);
    } catch (err) {
      collectionTemplateEditor.markSaveError(err instanceof Error ? err.message : 'Failed to remove — try again.');
      flash(false, err instanceof Error ? err.message : 'Failed to remove — try again.');
    }
  };

  const persistHeader = async (next: StoreThemeData['header']) => {
    themeEditor.edit(prev => prev ? { ...prev, header: next } : prev);
    themeEditor.markSaving();
    try {
      const res = await apiUpdateStoreHeader(storeId, next);
      themeEditor.markSaved(res.data.draft);
    } catch (err) {
      themeEditor.markSaveError(err instanceof Error ? err.message : 'Failed to remove — try again.');
      flash(false, err instanceof Error ? err.message : 'Failed to remove — try again.');
    }
  };

  const persistFooter = async (next: StoreThemeData['footer']) => {
    themeEditor.edit(prev => prev ? { ...prev, footer: next } : prev);
    themeEditor.markSaving();
    try {
      const res = await apiUpdateStoreFooter(storeId, next.blocks, next.footerStyle);
      themeEditor.markSaved(res.data.draft);
    } catch (err) {
      themeEditor.markSaveError(err instanceof Error ? err.message : 'Failed to remove — try again.');
      flash(false, err instanceof Error ? err.message : 'Failed to remove — try again.');
    }
  };

  // The Theme tab represents colors/typography/layout/hero/product/
  // testimonial/faq (all on `theme`) PLUS `headerStyle`/`footerStyle` (which
  // live on `header`/`footer`) as one conceptual "look" — so its one Save
  // button persists all three together, not just the `theme.*` fields,
  // otherwise applying a gallery theme could silently leave its header/
  // footer layout unsaved if the seller never separately visits those tabs.
  const handleSaveTheme = async () => {
    if (!themeEditor.workingCopy) return;
    const { theme, header, footer, baseThemeId } = themeEditor.workingCopy;
    themeEditor.markSaving();
    try {
      const [themeRes, headerRes, footerRes] = await Promise.all([
        apiUpdateStoreThemeColors(storeId, { ...theme, baseThemeId }),
        apiUpdateStoreHeader(storeId, { headerStyle: header.headerStyle }),
        apiUpdateStoreFooter(storeId, footer.blocks, footer.footerStyle),
      ]);
      const latest = footerRes.data ?? headerRes.data ?? themeRes.data;
      themeEditor.markSaved(latest.draft);
      flash(true, 'Draft saved — Publish to make it live.');
    } catch (err) {
      themeEditor.markSaveError(err instanceof Error ? err.message : 'Failed to save theme.');
      flash(false, err instanceof Error ? err.message : 'Failed to save theme.');
    }
  };

  // Applying a gallery theme updates every affected draft at once (colors +
  // baseThemeId + headerStyle + footerStyle) — still just a local, unsaved
  // change until "Save Theme" is clicked, same as any other Theme-tab edit.
  // Never fires directly from a card/button click — see `pendingApplyTheme`
  // below, which gates this behind an explicit confirm dialog first.
  const applyThemeNow = (t: ThemeDefinition) => {
    themeEditor.edit(prev => prev ? {
      ...prev,
      theme: t.colors,
      baseThemeId: t.id,
      header: { ...prev.header, headerStyle: t.headerStyle },
      footer: { ...prev.footer, footerStyle: t.footerStyle },
    } : prev);
    setPendingApplyTheme(null);
    setThemeMode('customize');
    flash(true, `${t.name} applied — customize it below, then Save Theme to publish.`);
  };

  // Clicking a gallery card or "Use Theme" just requests a confirmation
  // first — nothing is ever replaced silently, since this does overwrite
  // whatever the seller had customized.
  const [pendingApplyTheme, setPendingApplyTheme] = useState<ThemeDefinition | null>(null);

  const handleSaveHeader = async () => {
    if (!themeEditor.workingCopy) return;
    themeEditor.markSaving();
    try {
      const res = await apiUpdateStoreHeader(storeId, themeEditor.workingCopy.header);
      themeEditor.markSaved(res.data.draft);
      flash(true, 'Draft saved — Publish to make it live.');
    } catch (err) {
      themeEditor.markSaveError(err instanceof Error ? err.message : 'Failed to save header.');
      flash(false, err instanceof Error ? err.message : 'Failed to save header.');
    }
  };

  const handleSaveFooter = async () => {
    if (!themeEditor.workingCopy) return;
    themeEditor.markSaving();
    try {
      const res = await apiUpdateStoreFooter(storeId, themeEditor.workingCopy.footer.blocks);
      themeEditor.markSaved(res.data.draft);
      flash(true, 'Draft saved — Publish to make it live.');
    } catch (err) {
      themeEditor.markSaveError(err instanceof Error ? err.message : 'Failed to save footer.');
      flash(false, err instanceof Error ? err.message : 'Failed to save footer.');
    }
  };

  const handleSaveIdentity = async () => {
    if (!themeEditor.workingCopy) return;
    themeEditor.markSaving();
    try {
      const res = await apiUpdateIdentityBanner(storeId, themeEditor.workingCopy.identityBanner);
      themeEditor.markSaved(res.data.draft);
      flash(true, 'Draft saved — Publish to make it live.');
    } catch (err) {
      themeEditor.markSaveError(err instanceof Error ? err.message : 'Failed to save.');
      flash(false, err instanceof Error ? err.message : 'Failed to save.');
    }
  };

  // Publish/Discard operate on whatever is currently saved as the draft on
  // the server — not on possibly-unsaved local field edits — so a seller
  // must click the tab's own Save first (same two-step model Pages already
  // uses: Save Changes, then Publish). This is an existing, deliberate
  // product behavior, unchanged by the migration onto the new engine.
  const handlePublishTheme = async () => {
    themeEditor.markPublishing();
    try {
      const res = await apiPublishStoreTheme(storeId);
      themeEditor.markPublished({ theme: res.data.theme, header: res.data.header, footer: res.data.footer, identityBanner: res.data.identityBanner, baseThemeId: res.data.baseThemeId, customCss: res.data.customCss });
      flash(true, 'Published — your storefront is now live with these changes.');
    } catch (err) {
      themeEditor.markPublishError(err instanceof Error ? err.message : 'Failed to publish.');
      flash(false, err instanceof Error ? err.message : 'Failed to publish.');
    }
  };

  const handleDiscardDraft = async () => {
    setDiscardingThemeDraft(true);
    try {
      const res = await apiRevertStoreThemeDraft(storeId);
      themeEditor.discardDraft(res.data.draft);
      flash(true, 'Draft discarded — reverted to your published theme.');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to discard draft.');
    } finally {
      setDiscardingThemeDraft(false);
    }
  };

  // Real theme version history — a snapshot is appended server-side on
  // every successful publish (see StoreThemeService.publishTheme). Restoring
  // a past version writes it into the DRAFT slot only — the seller still
  // has to review and hit Publish themselves, same as any other draft edit.
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [themeVersions, setThemeVersions] = useState<ThemeVersionData[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);

  const openVersionHistory = () => {
    setShowVersionHistory(true);
    setVersionsLoading(true);
    apiListStoreThemeVersions(storeId).then(res => setThemeVersions(res.data)).finally(() => setVersionsLoading(false));
  };

  const handleRestoreVersion = async (versionId: string) => {
    setRestoringVersionId(versionId);
    try {
      await apiRestoreStoreThemeVersion(storeId, versionId);
      loadTheme();
      setShowVersionHistory(false);
      flash(true, 'Version restored to your draft — review it, then Publish to make it live.');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to restore version.');
    } finally {
      setRestoringVersionId(null);
    }
  };

  // Same unified version-history mechanism as Theme (see the comment on
  // `ContentVersioningService`), applied to Pages and the Collection
  // Template — real history for every content type with a draft/publish
  // split, not just Theme.
  const [showPageVersionHistory, setShowPageVersionHistory] = useState(false);
  const [pageVersions, setPageVersions] = useState<StorePageVersionData[]>([]);
  const [pageVersionsLoading, setPageVersionsLoading] = useState(false);
  const [restoringPageVersionId, setRestoringPageVersionId] = useState<string | null>(null);

  const openPageVersionHistory = () => {
    if (!selectedPage) return;
    setShowPageVersionHistory(true);
    setPageVersionsLoading(true);
    apiListStorePageVersions(storeId, selectedPage._id).then(res => setPageVersions(res.data)).finally(() => setPageVersionsLoading(false));
  };

  const handleRestorePageVersion = async (versionId: string) => {
    if (!selectedPage) return;
    setRestoringPageVersionId(versionId);
    try {
      await apiRestoreStorePageVersion(storeId, selectedPage._id, versionId);
      loadPagesEditor(selectedPage.sections, selectedPage.draft?.sections ?? selectedPage.sections);
      loadPages();
      setShowPageVersionHistory(false);
      flash(true, 'Version restored to your draft — review it, then Publish to make it live.');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to restore version.');
    } finally {
      setRestoringPageVersionId(null);
    }
  };

  const [showCollectionVersionHistory, setShowCollectionVersionHistory] = useState(false);
  const [collectionVersions, setCollectionVersions] = useState<CollectionTemplateVersionData[]>([]);
  const [collectionVersionsLoading, setCollectionVersionsLoading] = useState(false);
  const [restoringCollectionVersionId, setRestoringCollectionVersionId] = useState<string | null>(null);

  const openCollectionVersionHistory = () => {
    setShowCollectionVersionHistory(true);
    setCollectionVersionsLoading(true);
    apiListCollectionTemplateVersions(storeId).then(res => setCollectionVersions(res.data)).finally(() => setCollectionVersionsLoading(false));
  };

  const handleRestoreCollectionVersion = async (versionId: string) => {
    setRestoringCollectionVersionId(versionId);
    try {
      await apiRestoreCollectionTemplateVersion(storeId, versionId);
      loadCollectionTemplate();
      setShowCollectionVersionHistory(false);
      flash(true, 'Version restored to your draft — review it, then Publish to make it live.');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to restore version.');
    } finally {
      setRestoringCollectionVersionId(null);
    }
  };

  const themeEditorBusy = themeEditor.phase === 'saving' || themeEditor.phase === 'publishing' || discardingThemeDraft;
  const pagesEditorBusy = pagesEditor.phase === 'saving' || pagesEditor.phase === 'publishing' || discardingPageDraft;
  const collectionTemplateEditorBusy = collectionTemplateEditor.phase === 'saving' || collectionTemplateEditor.phase === 'publishing' || discardingCollectionTemplateDraft;
  useUndoRedoShortcuts(themeEditor.undo, themeEditor.redo, ['theme', 'header', 'footer', 'storeInfo'].includes(tab));
  useUndoRedoShortcuts(pagesEditor.undo, pagesEditor.redo, tab === 'pages');
  useUndoRedoShortcuts(collectionTemplateEditor.undo, collectionTemplateEditor.redo, tab === 'collection');

  // Live Preview (opened via the unpublished-changes banner below) listens
  // on this same channel — this is what makes it show the CURRENT working
  // copy instead of the last-saved-to-server draft. A fresh, immediately-
  // closed channel per broadcast is intentional (BroadcastChannel is cheap;
  // avoids a ref/cleanup dance for something that only fires on real edits).
  useEffect(() => {
    if (!themeEditor.workingCopy) return;
    const channel = new BroadcastChannel(previewChannelName(storeId));
    channel.postMessage({ type: 'theme', theme: themeEditor.workingCopy } satisfies PreviewSyncMessage);
    channel.close();
  }, [storeId, themeEditor.workingCopy]);

  // Live Preview only ever renders the Home page — no broadcast needed for
  // any other page.
  useEffect(() => {
    if (!pagesEditor.workingCopy || selectedPage?.type !== 'home') return;
    const channel = new BroadcastChannel(previewChannelName(storeId));
    channel.postMessage({ type: 'homeSections', sections: pagesEditor.workingCopy } satisfies PreviewSyncMessage);
    channel.close();
  }, [storeId, pagesEditor.workingCopy, selectedPage?.type]);

  const pageOptions = pages.filter(p => p.type === 'custom' && p.status === 'published').map(p => ({ slug: p.slug, title: p.title }));

  if (storeLoading || !store) {
    return (
      <div className="p-7 flex flex-col gap-4">
        <SkeletonBox width={240} height={22} rounded="6px" />
        <SkeletonBox height={44} rounded="10px" />
        <SkeletonBox height={400} rounded="16px" />
      </div>
    );
  }

  return (
    <div className="bg-[#FAF9F5] min-h-full">
      <StorePageHeader
        title="Storefront Builder"
        subtitle="Design your storefront — navbar, hero, pages, footer. Zero platform branding, entirely yours."
        actions={
          <div className="flex items-center gap-2.5">
            {/* One button, not an embedded side-by-side preview panel — opens
                the real, currently-live storefront in a new tab. */}
            <a
              href={getStorefrontUrl(store.slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-[9px] rounded-[10px] text-[12.5px] font-semibold border border-bone bg-white text-charcoal hover:bg-cream no-underline transition-colors whitespace-nowrap"
            >
              <ExternalLink size={13} /> View Live Store
            </a>
          </div>
        }
      />

      <div className="px-4 lg:px-7 pt-4 sticky top-0 z-10 bg-[#FAF9F5]/95 backdrop-blur-sm">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide border-b border-bone">
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-[10px] text-[13px] font-semibold shrink-0 border-none border-b-2 -mb-px cursor-pointer transition-colors whitespace-nowrap ${active ? 'text-brand-orange border-b-brand-orange bg-transparent' : 'text-slate border-b-transparent bg-transparent hover:text-charcoal'}`}
              >
                <t.Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme/Header/Footer/Store Info/Pages all share one draft/publish
          model now — nothing here reaches the live storefront until
          Publish. Shown whenever the draft actually differs from what's
          live, on any of those tabs. Pages only shows this once the page
          has been published at least once — a never-published page already
          has its own "Publish" toggle in its per-page header below, and
          showing both at once would be confusing. */}
      {((themeEditor.hasUnpublishedChanges && ['theme', 'header', 'footer', 'storeInfo'].includes(tab))
        || (pagesEditor.hasUnpublishedChanges && tab === 'pages' && selectedPage?.status === 'published')
        || (collectionTemplateEditor.hasUnpublishedChanges && tab === 'collection')) && (
        <div className="mx-4 lg:mx-7 mt-4 flex flex-wrap items-center justify-between gap-3 bg-brand-pale-orange border border-[#f5d0bc] rounded-2xl px-4 py-3">
          <p className="text-[12.5px] font-semibold text-brand-deep-orange">You have unpublished changes — your live storefront still shows the last published version.</p>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`/store/${storeId}/live-preview`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-[8px] rounded-[10px] text-[12.5px] font-semibold border border-bone bg-white text-charcoal hover:bg-cream no-underline transition-colors whitespace-nowrap"
            >
              <Eye size={13} /> Preview
            </a>
            <button
              onClick={tab === 'pages' ? handleDiscardPageDraft : tab === 'collection' ? handleDiscardCollectionTemplateDraft : handleDiscardDraft}
              disabled={tab === 'pages' ? pagesEditorBusy : tab === 'collection' ? collectionTemplateEditorBusy : themeEditorBusy}
              className="flex items-center gap-1.5 px-3.5 py-[8px] rounded-[10px] text-[12.5px] font-semibold border border-bone bg-white text-charcoal hover:bg-cream cursor-pointer transition-colors disabled:opacity-60 whitespace-nowrap">
              <RotateCcw size={13} /> Discard Draft
            </button>
            <button
              onClick={tab === 'pages' ? handlePublishPage : tab === 'collection' ? handlePublishCollectionTemplate : handlePublishTheme}
              disabled={tab === 'pages' ? pagesEditorBusy : tab === 'collection' ? collectionTemplateEditorBusy : themeEditorBusy}
              className="flex items-center gap-1.5 px-3.5 py-[8px] rounded-[10px] text-[12.5px] font-bold text-white border-none cursor-pointer transition-opacity disabled:opacity-60 whitespace-nowrap"
              style={{ background: '#D97757' }}>
              {(tab === 'pages' ? pagesEditorBusy : tab === 'collection' ? collectionTemplateEditorBusy : themeEditorBusy) ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />} Publish
            </button>
          </div>
        </div>
      )}

      {/* No embedded live-preview column anywhere in this page any more —
          "View Live Store" above opens the real thing in its own tab
          instead, and the Theme Gallery's "Preview" opens a specific theme
          the same way (`ThemePreviewPage`); the draft's own "Preview" above
          opens the real real-data live-preview route (Phase 9). Every tab
          is a single, full-width editor column now. */}
      <div className={`px-4 lg:px-7 py-5 grid grid-cols-1 gap-5 items-start ${tab === 'pages' ? 'lg:grid-cols-[280px_1fr]' : 'lg:grid-cols-1'}`}>
        {tab === 'pages' ? (
          <>
            <div className="bg-white border border-bone rounded-2xl p-3 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
              {pagesLoading ? <SkeletonBox height={160} rounded="8px" /> : (
                <PagesList pages={pages} selectedId={selectedPageId} onSelect={setSelectedPageId} onCreate={handleCreatePage} onDelete={setPendingDeletePageId} creating={creatingPage} />
              )}
            </div>

            <div className="flex flex-col gap-3 min-w-0">
              {selectedPage ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-bone rounded-2xl px-4 py-3 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
                    <div className="min-w-0">
                      <h2 className="text-[15px] font-bold text-charcoal truncate">{selectedPage.title}</h2>
                      <p className="text-[11.5px] text-slate mt-[1px] whitespace-nowrap">
                        {selectedPage.status === 'published'
                          ? <span className="text-success font-semibold">● Live on your storefront</span>
                          : <span className="text-slate">○ Draft — not visible to buyers yet</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <button onClick={handleTogglePublish} disabled={saving}
                        className="flex items-center gap-1.5 px-3.5 py-[9px] rounded-[10px] text-[12.5px] font-semibold border border-bone bg-white text-charcoal hover:bg-cream cursor-pointer transition-colors disabled:opacity-60 whitespace-nowrap">
                        {selectedPage.status === 'published' ? <><EyeOff size={13} className="shrink-0" /> Unpublish</> : <><Eye size={13} className="shrink-0" /> Publish</>}
                      </button>
                      <SaveButton onClick={handleSaveSections} saving={pagesEditor.phase === 'saving'} label="Save Changes" />
                      <button
                        onClick={pagesEditor.undo}
                        disabled={!pagesEditor.canUndo}
                        title="Undo (Ctrl/Cmd+Z)"
                        aria-label="Undo"
                        className="flex items-center justify-center w-9 h-9 rounded-[10px] border border-bone bg-white text-charcoal hover:bg-cream cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Undo2 size={15} />
                      </button>
                      <button
                        onClick={pagesEditor.redo}
                        disabled={!pagesEditor.canRedo}
                        title="Redo (Ctrl/Cmd+Shift+Z)"
                        aria-label="Redo"
                        className="flex items-center justify-center w-9 h-9 rounded-[10px] border border-bone bg-white text-charcoal hover:bg-cream cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Redo2 size={15} />
                      </button>
                      {selectedPage.lastPublishedAt && (
                        <button
                          onClick={openPageVersionHistory}
                          title="Version History"
                          className="flex items-center gap-1.5 px-3 h-9 rounded-[10px] border border-bone bg-white text-charcoal hover:bg-cream cursor-pointer transition-colors text-[12.5px] font-semibold"
                        >
                          <History size={14} /> History
                        </button>
                      )}
                    </div>
                  </div>
                  <PageSectionsEditor sections={pagesEditor.workingCopy ?? []} onChange={pagesEditor.edit} onPersist={persistSections} pageOptions={pageOptions} storeId={storeId} mainCategoryId={store.categoryId} />
                </>
              ) : (
                <div className="bg-white border border-bone rounded-2xl p-10 text-center">
                  <p className="text-[13px] text-slate">Select or create a page to start editing.</p>
                </div>
              )}
            </div>
          </>
        ) : tab === 'collection' ? (
          <div className="bg-white border border-bone rounded-2xl p-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
            {collectionTemplateLoading ? <SkeletonBox height={200} rounded="8px" /> : (
              <div className="flex flex-col gap-5">
                <div>
                  <p className="text-[13px] font-bold text-charcoal">Collection Page</p>
                  <p className="text-[12px] text-slate mt-0.5">This layout is shared by every collection on your storefront — add sections above or below the product grid, or reorder/hide them. The product grid itself always shows whichever collection a buyer is currently browsing.</p>
                </div>
                <PageSectionsEditor
                  sections={collectionTemplateEditor.workingCopy ?? []}
                  onChange={collectionTemplateEditor.edit}
                  onPersist={persistCollectionTemplateSections}
                  pageOptions={pageOptions}
                  storeId={storeId}
                  mainCategoryId={store.categoryId}
                />
                <div className="flex items-center gap-2">
                  <SaveButton onClick={handleSaveCollectionTemplate} saving={collectionTemplateEditor.phase === 'saving'} label="Save Collection Page" />
                  <button
                    onClick={collectionTemplateEditor.undo}
                    disabled={!collectionTemplateEditor.canUndo}
                    title="Undo (Ctrl/Cmd+Z)"
                    aria-label="Undo"
                    className="flex items-center justify-center w-9 h-9 rounded-[10px] border border-bone bg-white text-charcoal hover:bg-cream cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Undo2 size={15} />
                  </button>
                  <button
                    onClick={collectionTemplateEditor.redo}
                    disabled={!collectionTemplateEditor.canRedo}
                    title="Redo (Ctrl/Cmd+Shift+Z)"
                    aria-label="Redo"
                    className="flex items-center justify-center w-9 h-9 rounded-[10px] border border-bone bg-white text-charcoal hover:bg-cream cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Redo2 size={15} />
                  </button>
                  <button
                    onClick={openCollectionVersionHistory}
                    title="Version History"
                    className="flex items-center gap-1.5 px-3 h-9 rounded-[10px] border border-bone bg-white text-charcoal hover:bg-cream cursor-pointer transition-colors text-[12.5px] font-semibold"
                  >
                    <History size={14} /> History
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : tab === 'blog' ? (
          <BlogTab storeId={storeId} />
        ) : (
          <div className="bg-white border border-bone rounded-2xl p-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
            {themeLoading || !themeEditor.workingCopy ? <SkeletonBox height={200} rounded="8px" /> : (
              <div className="flex flex-col gap-5">
                {tab === 'theme'     && (
                  <ThemeTab
                    storeId={storeId}
                    value={themeEditor.workingCopy.theme}
                    onChange={(next) => themeEditor.edit(prev => prev ? { ...prev, theme: next } : prev)}
                    baseThemeId={themeEditor.workingCopy.baseThemeId}
                    onApplyTheme={setPendingApplyTheme}
                    headerStyle={themeEditor.workingCopy.header?.headerStyle ?? 'standard'}
                    footerStyle={themeEditor.workingCopy.footer?.footerStyle ?? 'columns'}
                    storeHint={{ sellerType: store.sellerType, productTypes: store.productTypes }}
                    mode={themeMode}
                    onModeChange={setThemeMode}
                  />
                )}
                {tab === 'header'    && <HeaderTab    value={themeEditor.workingCopy.header}   onChange={(next) => themeEditor.edit(prev => prev ? { ...prev, header: next } : prev)} onPersist={persistHeader} pageOptions={pageOptions} storeId={storeId} mainCategoryId={store.categoryId} />}
                {tab === 'footer'    && <FooterTab    value={themeEditor.workingCopy.footer}   onChange={(next) => themeEditor.edit(prev => prev ? { ...prev, footer: next } : prev)} onPersist={persistFooter} pageOptions={pageOptions} storeId={storeId} mainCategoryId={store.categoryId} />}
                {tab === 'storeInfo' && <StoreInfoTab value={themeEditor.workingCopy.identityBanner} onChange={(next) => themeEditor.edit(prev => prev ? { ...prev, identityBanner: next } : prev)} />}
                <div className="flex items-center gap-2">
                  <SaveButton
                    onClick={tab === 'theme' ? handleSaveTheme : tab === 'header' ? handleSaveHeader : tab === 'footer' ? handleSaveFooter : handleSaveIdentity}
                    saving={themeEditor.phase === 'saving'}
                    label={`Save ${TABS.find(t => t.id === tab)?.label}`}
                  />
                  <button
                    onClick={themeEditor.undo}
                    disabled={!themeEditor.canUndo}
                    title="Undo (Ctrl/Cmd+Z)"
                    aria-label="Undo"
                    className="flex items-center justify-center w-9 h-9 rounded-[10px] border border-bone bg-white text-charcoal hover:bg-cream cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Undo2 size={15} />
                  </button>
                  <button
                    onClick={themeEditor.redo}
                    disabled={!themeEditor.canRedo}
                    title="Redo (Ctrl/Cmd+Shift+Z)"
                    aria-label="Redo"
                    className="flex items-center justify-center w-9 h-9 rounded-[10px] border border-bone bg-white text-charcoal hover:bg-cream cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Redo2 size={15} />
                  </button>
                  {tab === 'theme' && (
                    <button
                      onClick={openVersionHistory}
                      title="Version History"
                      className="flex items-center gap-1.5 px-3 h-9 rounded-[10px] border border-bone bg-white text-charcoal hover:bg-cream cursor-pointer transition-colors text-[12.5px] font-semibold"
                    >
                      <History size={14} /> History
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <VersionHistoryModal
        title="Theme Version History"
        open={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        versions={themeVersions}
        loading={versionsLoading}
        restoringId={restoringVersionId}
        onRestore={handleRestoreVersion}
      />
      <VersionHistoryModal
        title="Page Version History"
        open={showPageVersionHistory}
        onClose={() => setShowPageVersionHistory(false)}
        versions={pageVersions}
        loading={pageVersionsLoading}
        restoringId={restoringPageVersionId}
        onRestore={handleRestorePageVersion}
      />
      <VersionHistoryModal
        title="Collection Template Version History"
        open={showCollectionVersionHistory}
        onClose={() => setShowCollectionVersionHistory(false)}
        versions={collectionVersions}
        loading={collectionVersionsLoading}
        restoringId={restoringCollectionVersionId}
        onRestore={handleRestoreCollectionVersion}
      />

      {pendingApplyTheme && (
        <ConfirmDialog
          title={`Apply ${pendingApplyTheme.name}?`}
          message="Your current theme customization will be replaced by this theme. You can customize it again afterward."
          confirmLabel="Apply Theme"
          onCancel={() => setPendingApplyTheme(null)}
          onConfirm={() => applyThemeNow(pendingApplyTheme)}
        />
      )}

      {pendingDeletePageId && (
        <ConfirmDialog
          title="Delete page"
          message="This page and all of its sections will be permanently deleted. This cannot be undone."
          confirmLabel="Delete Page"
          loading={deletingPage}
          onCancel={() => setPendingDeletePageId(null)}
          onConfirm={confirmDeletePage}
        />
      )}
    </div>
  );
}
