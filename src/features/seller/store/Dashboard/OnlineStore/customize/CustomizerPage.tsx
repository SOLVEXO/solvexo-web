import { useState, useEffect, useCallback } from 'react';
import { Loader2, Eye, ExternalLink, LayoutList, Package, Palette, PanelTop, PanelBottom, UserCog, UploadCloud, RotateCcw, Undo2, Redo2, History } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { SkeletonBox, Modal, Button, Field } from '@/components/comman/ui';
import { getStorefrontUrl } from '@/utils/storefrontUrl';
import { apiListStorePages, type StorePageData } from '@/api/services/storePages';
import {
  apiGetStoreTheme, apiUpdateStoreThemeColors, apiUpdateStoreHeader, apiUpdateStoreFooter, apiUpdateIdentityBanner,
  apiPublishStoreTheme, apiRevertStoreThemeDraft, apiListStoreThemeVersions, apiRestoreStoreThemeVersion,
  type StoreThemeData, type ThemeVersionData,
} from '@/api/services/storeTheme';
import {
  apiListResourceTemplates, apiCreateResourceTemplate, apiDeleteResourceTemplate,
  apiGetCollectionTemplate, apiUpdateCollectionTemplateSections,
  apiPublishCollectionTemplate, apiRevertCollectionTemplateDraft,
  apiListCollectionTemplateVersions, apiRestoreCollectionTemplateVersion,
  type ResourceTemplateType, type CollectionTemplateData, type CollectionTemplateVersionData,
} from '@/api/services/collectionTemplate';
import type { Section } from '@/api/services/storefrontTypes';
import { PageSectionsEditor } from '../builder/PageSectionsEditor';
import { ThemeTab } from '../builder/ThemeTab';
import { ConfirmDialog } from '../builder/ConfirmDialog';
import { HeaderTab, FooterTab } from '../builder/HeaderFooterTabs';
import { StoreInfoTab } from '../builder/StoreInfoTab';
import { VersionHistoryModal } from '../builder/VersionHistoryModal';
import { useEditorState } from '../builder/editor/useEditorState';
import { useUndoRedoShortcuts } from '../builder/editor/useUndoRedoShortcuts';
import { previewChannelName, type PreviewSyncMessage } from '../builder/editor/previewSync';

/** Theme/Header/Footer/Store Info share one server-side draft/publish document (see StoreThemeData) — so they share ONE editor-engine instance and undo/redo history, matching how "Save"/"Publish"/"Discard Draft" already treat them as one combined surface today. */
type ThemeWorkingCopy = StoreThemeData['draft'];

type Tab = 'theme' | 'header' | 'footer' | 'storeInfo' | 'collectionTemplate' | 'productTemplate';
const TABS: { id: Tab; label: string; Icon: typeof Palette }[] = [
  { id: 'theme',              label: 'Theme',               Icon: Palette },
  { id: 'header',             label: 'Header',              Icon: PanelTop },
  { id: 'footer',             label: 'Footer',              Icon: PanelBottom },
  { id: 'storeInfo',          label: 'Store Info',          Icon: UserCog },
  { id: 'collectionTemplate', label: 'Collection Template', Icon: LayoutList },
  { id: 'productTemplate',    label: 'Product Template',    Icon: Package },
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

/**
 * One editor-engine instance + its own template picker (list/create/delete)
 * for a single resource type (`'collection'` | `'product'`) — the
 * generalized alternate-templates API (`apiListResourceTemplates` etc.)
 * lets a store keep several named templates per resource type, unlike the
 * old singleton Collection Template. `apiListResourceTemplates` already
 * returns each template's full `sections`/`draft`, so switching templates
 * never needs a separate GET — only Save/Publish/Discard/Restore-version
 * responses (or an explicit single-template refetch) need one.
 */
function useResourceTemplateEditor(storeId: string, resourceType: ResourceTemplateType, flash: (ok: boolean, text: string) => void) {
  const editor = useEditorState<Section[]>();
  const [templates, setTemplates] = useState<CollectionTemplateData[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);
  const [discardingDraft, setDiscardingDraft] = useState(false);
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [pendingDeleteTemplateKey, setPendingDeleteTemplateKey] = useState<string | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState(false);

  const loadTemplates = useCallback(() => {
    setTemplatesLoading(true);
    apiListResourceTemplates(storeId, resourceType)
      .then(res => {
        setTemplates(res.data);
        setSelectedTemplateKey(prev => prev ?? res.data.find(t => t.isDefault)?.templateKey ?? res.data[0]?.templateKey ?? null);
      })
      .finally(() => setTemplatesLoading(false));
  }, [storeId, resourceType]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const selectedTemplate = templates.find(t => t.templateKey === selectedTemplateKey) ?? null;

  // Re-loads the editor (fresh undo/redo history) whenever the SELECTED
  // DOCUMENT actually changes (a different template's real `_id`) — not on
  // every `templates` array update from a Save/Publish response, which
  // would otherwise wipe the seller's in-progress undo history.
  const loadEditor = editor.load;
  useEffect(() => {
    if (!selectedTemplate) return;
    loadEditor(selectedTemplate.sections, selectedTemplate.draft?.sections ?? selectedTemplate.sections);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate?._id, loadEditor]);

  const reloadCurrentTemplate = useCallback(() => {
    if (!selectedTemplateKey) return;
    apiGetCollectionTemplate(storeId, resourceType, selectedTemplateKey).then(res => {
      setTemplates(prev => prev.map(t => t.templateKey === selectedTemplateKey ? res.data : t));
      editor.load(res.data.sections, res.data.draft.sections);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, resourceType, selectedTemplateKey]);

  const handleSave = async () => {
    if (!editor.workingCopy) return;
    editor.markSaving();
    try {
      const res = await apiUpdateCollectionTemplateSections(storeId, editor.workingCopy, resourceType, selectedTemplateKey ?? undefined);
      setTemplates(prev => prev.map(t => t._id === res.data._id ? res.data : t));
      editor.markSaved(res.data.draft.sections);
      flash(true, 'Draft saved — Publish to make it live.');
    } catch (err) {
      editor.markSaveError(err instanceof Error ? err.message : 'Failed to save.');
      flash(false, err instanceof Error ? err.message : 'Failed to save.');
    }
  };

  const handlePublish = async () => {
    editor.markPublishing();
    try {
      const res = await apiPublishCollectionTemplate(storeId, resourceType, selectedTemplateKey ?? undefined);
      setTemplates(prev => prev.map(t => t._id === res.data._id ? res.data : t));
      editor.markPublished(res.data.sections);
      flash(true, 'Published — your storefront is now live with these changes.');
    } catch (err) {
      editor.markPublishError(err instanceof Error ? err.message : 'Failed to publish.');
      flash(false, err instanceof Error ? err.message : 'Failed to publish.');
    }
  };

  const handleDiscardDraft = async () => {
    setDiscardingDraft(true);
    try {
      const res = await apiRevertCollectionTemplateDraft(storeId, resourceType, selectedTemplateKey ?? undefined);
      setTemplates(prev => prev.map(t => t._id === res.data._id ? res.data : t));
      editor.discardDraft(res.data.draft.sections);
      flash(true, 'Draft discarded — reverted to your published version.');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to discard draft.');
    } finally {
      setDiscardingDraft(false);
    }
  };

  // Same "removal is a real delete, save it immediately" reasoning as the
  // Pages tab's `persistSections`.
  const persistSections = async (next: Section[]) => {
    editor.edit(next);
    editor.markSaving();
    try {
      const res = await apiUpdateCollectionTemplateSections(storeId, next, resourceType, selectedTemplateKey ?? undefined);
      setTemplates(prev => prev.map(t => t._id === res.data._id ? res.data : t));
      editor.markSaved(res.data.draft.sections);
    } catch (err) {
      editor.markSaveError(err instanceof Error ? err.message : 'Failed to remove — try again.');
      flash(false, err instanceof Error ? err.message : 'Failed to remove — try again.');
    }
  };

  const handleCreateTemplate = async (name: string, templateKey: string) => {
    setCreatingTemplate(true);
    try {
      const res = await apiCreateResourceTemplate(storeId, resourceType, { name, templateKey, cloneFromTemplateKey: selectedTemplateKey ?? undefined });
      setTemplates(prev => [...prev, res.data]);
      setSelectedTemplateKey(res.data.templateKey);
      flash(true, 'Template created.');
      return true;
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to create template.');
      return false;
    } finally {
      setCreatingTemplate(false);
    }
  };

  const confirmDeleteTemplate = async () => {
    if (!pendingDeleteTemplateKey) return;
    setDeletingTemplate(true);
    try {
      await apiDeleteResourceTemplate(storeId, resourceType, pendingDeleteTemplateKey);
      const remaining = templates.filter(t => t.templateKey !== pendingDeleteTemplateKey);
      setTemplates(remaining);
      if (selectedTemplateKey === pendingDeleteTemplateKey) {
        setSelectedTemplateKey(remaining.find(t => t.isDefault)?.templateKey ?? remaining[0]?.templateKey ?? null);
      }
      setPendingDeleteTemplateKey(null);
      flash(true, 'Template deleted.');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to delete template.');
    } finally {
      setDeletingTemplate(false);
    }
  };

  // Same unified version-history mechanism as Theme/Pages.
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versions, setVersions] = useState<CollectionTemplateVersionData[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);

  const openVersionHistory = () => {
    setShowVersionHistory(true);
    setVersionsLoading(true);
    apiListCollectionTemplateVersions(storeId, resourceType, selectedTemplateKey ?? undefined)
      .then(res => setVersions(res.data))
      .finally(() => setVersionsLoading(false));
  };

  const handleRestoreVersion = async (versionId: string) => {
    setRestoringVersionId(versionId);
    try {
      await apiRestoreCollectionTemplateVersion(storeId, versionId, resourceType, selectedTemplateKey ?? undefined);
      reloadCurrentTemplate();
      setShowVersionHistory(false);
      flash(true, 'Version restored to your draft — review it, then Publish to make it live.');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to restore version.');
    } finally {
      setRestoringVersionId(null);
    }
  };

  const busy = editor.phase === 'saving' || editor.phase === 'publishing' || discardingDraft;

  return {
    editor, templates, templatesLoading, selectedTemplateKey, selectedTemplate,
    setSelectedTemplateKey, busy,
    creatingTemplate, handleCreateTemplate,
    pendingDeleteTemplateKey, setPendingDeleteTemplateKey, deletingTemplate, confirmDeleteTemplate,
    handleSave, handlePublish, handleDiscardDraft, persistSections,
    showVersionHistory, setShowVersionHistory, versions, versionsLoading, restoringVersionId, openVersionHistory, handleRestoreVersion,
  };
}

type ResourceTemplateEditorState = ReturnType<typeof useResourceTemplateEditor>;

/** Presentational panel for one resource-type's template tab — template
 *  picker (switch/create/delete) above the shared `PageSectionsEditor`. */
function ResourceTemplatePanel({ label, hint, state, storeId, mainCategoryId, pageOptions }: {
  label: string;
  hint: string;
  state: ResourceTemplateEditorState;
  storeId: string;
  mainCategoryId?: string;
  pageOptions: { slug: string; title: string }[];
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKey, setNewKey] = useState('');

  const submitCreate = async () => {
    if (!newName.trim() || !newKey.trim()) return;
    const ok = await state.handleCreateTemplate(newName.trim(), newKey.trim());
    if (ok) {
      setShowCreateForm(false);
      setNewName('');
      setNewKey('');
    }
  };

  if (state.templatesLoading || !state.editor.workingCopy) {
    return <SkeletonBox height={200} rounded="8px" />;
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[13px] font-bold text-charcoal">{label}</p>
        <p className="text-[12px] text-slate mt-0.5">{hint}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={state.selectedTemplateKey ?? ''}
          onChange={(e) => state.setSelectedTemplateKey(e.target.value)}
          className="px-3 py-[8px] rounded-[10px] text-[12.5px] font-semibold border border-bone bg-white text-charcoal cursor-pointer"
        >
          {state.templates.map(t => (
            <option key={t.templateKey} value={t.templateKey}>{t.name}{t.isDefault ? ' (Default)' : ''}</option>
          ))}
        </select>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-1.5 px-3.5 py-[8px] rounded-[10px] text-[12.5px] font-semibold border border-bone bg-white text-charcoal hover:bg-cream cursor-pointer transition-colors whitespace-nowrap"
        >
          + New Template
        </button>
        {state.selectedTemplate && !state.selectedTemplate.isDefault && (
          <button
            onClick={() => state.setPendingDeleteTemplateKey(state.selectedTemplate!.templateKey)}
            className="flex items-center gap-1.5 px-3.5 py-[8px] rounded-[10px] text-[12.5px] font-semibold border border-bone bg-white text-error hover:bg-cream cursor-pointer transition-colors whitespace-nowrap"
          >
            Delete Template
          </button>
        )}
      </div>

      <PageSectionsEditor
        sections={state.editor.workingCopy ?? []}
        onChange={state.editor.edit}
        onPersist={state.persistSections}
        pageOptions={pageOptions}
        storeId={storeId}
        mainCategoryId={mainCategoryId}
      />

      <div className="flex items-center gap-2">
        <SaveButton onClick={state.handleSave} saving={state.editor.phase === 'saving'} label={`Save ${label}`} />
        <button
          onClick={state.editor.undo}
          disabled={!state.editor.canUndo}
          title="Undo (Ctrl/Cmd+Z)"
          aria-label="Undo"
          className="flex items-center justify-center w-9 h-9 rounded-[10px] border border-bone bg-white text-charcoal hover:bg-cream cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Undo2 size={15} />
        </button>
        <button
          onClick={state.editor.redo}
          disabled={!state.editor.canRedo}
          title="Redo (Ctrl/Cmd+Shift+Z)"
          aria-label="Redo"
          className="flex items-center justify-center w-9 h-9 rounded-[10px] border border-bone bg-white text-charcoal hover:bg-cream cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Redo2 size={15} />
        </button>
        <button
          onClick={state.openVersionHistory}
          title="Version History"
          className="flex items-center gap-1.5 px-3 h-9 rounded-[10px] border border-bone bg-white text-charcoal hover:bg-cream cursor-pointer transition-colors text-[12.5px] font-semibold"
        >
          <History size={14} /> History
        </button>
      </div>

      {showCreateForm && (
        <Modal
          title={`New ${label}`}
          onClose={() => setShowCreateForm(false)}
          width={420}
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowCreateForm(false)} disabled={state.creatingTemplate}>Cancel</Button>
              <Button onClick={submitCreate} loading={state.creatingTemplate}>Create</Button>
            </>
          }
        >
          <Field label="Name" required>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Sale Collection"
              className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none" />
          </Field>
          <Field label="Template Key" required hint="A short unique identifier, e.g. 'sale' — used to select this template elsewhere.">
            <input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="e.g. sale"
              className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none" />
          </Field>
        </Modal>
      )}

      {state.pendingDeleteTemplateKey && (
        <ConfirmDialog
          title="Delete template"
          message="This template and all of its sections will be permanently deleted. This cannot be undone."
          confirmLabel="Delete Template"
          loading={state.deletingTemplate}
          onCancel={() => state.setPendingDeleteTemplateKey(null)}
          onConfirm={state.confirmDeleteTemplate}
        />
      )}

      <VersionHistoryModal
        title={`${label} Version History`}
        open={state.showVersionHistory}
        onClose={() => state.setShowVersionHistory(false)}
        versions={state.versions}
        loading={state.versionsLoading}
        restoringId={state.restoringVersionId}
        onRestore={state.handleRestoreVersion}
      />
    </div>
  );
}

export function CustomizerPage() {
  const { storeId, store, loading: storeLoading } = useStoreWorkspace();
  const [tab, setTab] = useState<Tab>('theme');
  const toast = useToast();
  const flash = (ok: boolean, text: string) => { if (ok) toast.success(text); else toast.error(text); };

  // Header/Footer/PageSectionsEditor link-target pickers need the store's
  // custom-page list too — a lightweight independent fetch here now that
  // Pages management itself lives on its own page (`PagesPage.tsx`).
  const [pages, setPages] = useState<StorePageData[]>([]);
  useEffect(() => { apiListStorePages(storeId).then(res => setPages(res.data)); }, [storeId]);
  const pageOptions = pages.filter(p => p.type === 'custom' && p.status === 'published').map(p => ({ slug: p.slug, title: p.title }));

  // Theme/Header/Footer/Store Info run on one editor engine instance — one
  // shared server-side draft/publish document and one combined "Save"/
  // "Publish"/"Discard Draft" surface.
  const themeEditor = useEditorState<ThemeWorkingCopy>();
  const [themeLoading, setThemeLoading] = useState(true);
  const [discardingThemeDraft, setDiscardingThemeDraft] = useState(false);

  const collectionTemplate = useResourceTemplateEditor(storeId, 'collection', flash);
  const productTemplate = useResourceTemplateEditor(storeId, 'product', flash);

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

  useEffect(() => { loadTheme(); }, [loadTheme]);

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
  // button persists all three together, not just the `theme.*` fields.
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
  // the server — not on possibly-unsaved local field edits.
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
  // every successful publish. Restoring a past version writes it into the
  // DRAFT slot only.
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

  const themeEditorBusy = themeEditor.phase === 'saving' || themeEditor.phase === 'publishing' || discardingThemeDraft;
  useUndoRedoShortcuts(themeEditor.undo, themeEditor.redo, ['theme', 'header', 'footer', 'storeInfo'].includes(tab));
  useUndoRedoShortcuts(collectionTemplate.editor.undo, collectionTemplate.editor.redo, tab === 'collectionTemplate');
  useUndoRedoShortcuts(productTemplate.editor.undo, productTemplate.editor.redo, tab === 'productTemplate');

  // Live Preview (opened via the unpublished-changes banner below) listens
  // on this same channel — this is what makes it show the CURRENT working
  // copy instead of the last-saved-to-server draft.
  useEffect(() => {
    if (!themeEditor.workingCopy) return;
    const channel = new BroadcastChannel(previewChannelName(storeId));
    channel.postMessage({ type: 'theme', theme: themeEditor.workingCopy } satisfies PreviewSyncMessage);
    channel.close();
  }, [storeId, themeEditor.workingCopy]);

  if (storeLoading || !store) {
    return (
      <div className="p-7 flex flex-col gap-4">
        <SkeletonBox width={240} height={22} rounded="6px" />
        <SkeletonBox height={44} rounded="10px" />
        <SkeletonBox height={400} rounded="16px" />
      </div>
    );
  }

  const activeResourceTemplate: ResourceTemplateEditorState | null =
    tab === 'collectionTemplate' ? collectionTemplate : tab === 'productTemplate' ? productTemplate : null;

  const showUnpublishedBanner =
    (themeEditor.hasUnpublishedChanges && ['theme', 'header', 'footer', 'storeInfo'].includes(tab))
    || (!!activeResourceTemplate && activeResourceTemplate.editor.hasUnpublishedChanges);

  return (
    <div className="bg-[#FAF9F5] min-h-full">
      <StorePageHeader
        title="Customize"
        subtitle="Design your storefront — theme, navbar, footer, collection & product layout. Zero platform branding, entirely yours."
        actions={
          <div className="flex items-center gap-2.5">
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

      {/* Theme/Header/Footer/Store Info/Collection Template/Product Template
          all share a draft/publish model — nothing here reaches the live
          storefront until Publish. Shown whenever the draft actually
          differs from what's live, on any of those tabs. */}
      {showUnpublishedBanner && (
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
              onClick={activeResourceTemplate ? activeResourceTemplate.handleDiscardDraft : handleDiscardDraft}
              disabled={activeResourceTemplate ? activeResourceTemplate.busy : themeEditorBusy}
              className="flex items-center gap-1.5 px-3.5 py-[8px] rounded-[10px] text-[12.5px] font-semibold border border-bone bg-white text-charcoal hover:bg-cream cursor-pointer transition-colors disabled:opacity-60 whitespace-nowrap">
              <RotateCcw size={13} /> Discard Draft
            </button>
            <button
              onClick={activeResourceTemplate ? activeResourceTemplate.handlePublish : handlePublishTheme}
              disabled={activeResourceTemplate ? activeResourceTemplate.busy : themeEditorBusy}
              className="flex items-center gap-1.5 px-3.5 py-[8px] rounded-[10px] text-[12.5px] font-bold text-white border-none cursor-pointer transition-opacity disabled:opacity-60 whitespace-nowrap"
              style={{ background: '#D97757' }}>
              {(activeResourceTemplate ? activeResourceTemplate.busy : themeEditorBusy) ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />} Publish
            </button>
          </div>
        </div>
      )}

      <div className="px-4 lg:px-7 py-5 grid grid-cols-1 gap-5 items-start">
        {tab === 'collectionTemplate' ? (
          <div className="bg-white border border-bone rounded-2xl p-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
            <ResourceTemplatePanel
              label="Collection Template"
              hint="This layout is shared by every collection on your storefront — add sections above or below the product grid, or reorder/hide them. The product grid itself always shows whichever collection a buyer is currently browsing."
              state={collectionTemplate}
              storeId={storeId}
              mainCategoryId={store.categoryId}
              pageOptions={pageOptions}
            />
          </div>
        ) : tab === 'productTemplate' ? (
          <div className="bg-white border border-bone rounded-2xl p-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
            <ResourceTemplatePanel
              label="Product Template"
              hint="A product's core commerce UI (image gallery, variant/option selection, quantity, add-to-cart) is fixed and not editable here — this layout only controls the surrounding content sections shown above or below that fixed area."
              state={productTemplate}
              storeId={storeId}
              mainCategoryId={store.categoryId}
              pageOptions={pageOptions}
            />
          </div>
        ) : (
          <div className="bg-white border border-bone rounded-2xl p-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
            {themeLoading || !themeEditor.workingCopy ? <SkeletonBox height={200} rounded="8px" /> : (
              <div className="flex flex-col gap-5">
                {tab === 'theme'     && (
                  <ThemeTab
                    value={themeEditor.workingCopy.theme}
                    onChange={(next) => themeEditor.edit(prev => prev ? { ...prev, theme: next } : prev)}
                    baseThemeId={themeEditor.workingCopy.baseThemeId}
                    headerStyle={themeEditor.workingCopy.header?.headerStyle ?? 'standard'}
                    footerStyle={themeEditor.workingCopy.footer?.footerStyle ?? 'columns'}
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
    </div>
  );
}
