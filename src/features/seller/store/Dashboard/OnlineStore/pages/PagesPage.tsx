import { useState, useEffect, useCallback } from 'react';
import { Loader2, Eye, EyeOff, ExternalLink, UploadCloud, RotateCcw, Undo2, Redo2, History } from 'lucide-react';
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
import type { Section } from '@/api/services/storefrontTypes';
import { PagesList } from '../builder/PagesList';
import { PageSectionsEditor } from '../builder/PageSectionsEditor';
import { ConfirmDialog } from '../builder/ConfirmDialog';
import { VersionHistoryModal } from '../builder/VersionHistoryModal';
import { useEditorState } from '../builder/editor/useEditorState';
import { useUndoRedoShortcuts } from '../builder/editor/useUndoRedoShortcuts';
import { previewChannelName, type PreviewSyncMessage } from '../builder/editor/previewSync';

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

export function PagesPage() {
  const { storeId, store, loading: storeLoading } = useStoreWorkspace();

  const [pages, setPages] = useState<StorePageData[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const pagesEditor = useEditorState<Section[]>();
  const [pagesLoading, setPagesLoading] = useState(true);
  const [creatingPage, setCreatingPage] = useState(false);
  const [discardingPageDraft, setDiscardingPageDraft] = useState(false);

  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const flash = (ok: boolean, text: string) => { if (ok) toast.success(text); else toast.error(text); };

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

  useEffect(() => { loadPages(); }, [loadPages]);

  // Editing always targets the DRAFT now — a page that's already live keeps
  // showing its published content to buyers until Publish is clicked. Falls
  // back to the live `sections` only for a response shape that predates this
  // field. Re-loads (fresh undo/redo history) every time the selected page
  // changes.
  const loadPagesEditor = pagesEditor.load;
  useEffect(() => {
    if (!selectedPage) return;
    loadPagesEditor(selectedPage.sections, selectedPage.draft?.sections ?? selectedPage.sections);
  }, [selectedPage?._id, loadPagesEditor]);

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

  // Removing a section/block (or a nav link/footer block) is confirmed via
  // a dialog, so — unlike an ordinary field edit — it should behave like the
  // real deletion it is: saved immediately, not left sitting in the unsaved
  // draft only to silently come back on next load if the seller never gets
  // around to clicking "Save Changes."
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

  // Same unified version-history mechanism as Theme, applied to Pages.
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

  const pagesEditorBusy = pagesEditor.phase === 'saving' || pagesEditor.phase === 'publishing' || discardingPageDraft;
  useUndoRedoShortcuts(pagesEditor.undo, pagesEditor.redo, true);

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
        title="Pages"
        subtitle="Create and edit the standalone pages on your storefront — Home, About, Shipping Policy, and anything else you add."
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

      {/* A never-published page already has its own "Publish" toggle in its
          per-page header below, and showing both at once would be confusing
          — this banner only shows once the page has been published at
          least once. */}
      {pagesEditor.hasUnpublishedChanges && selectedPage?.status === 'published' && (
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
              onClick={handleDiscardPageDraft}
              disabled={pagesEditorBusy}
              className="flex items-center gap-1.5 px-3.5 py-[8px] rounded-[10px] text-[12.5px] font-semibold border border-bone bg-white text-charcoal hover:bg-cream cursor-pointer transition-colors disabled:opacity-60 whitespace-nowrap">
              <RotateCcw size={13} /> Discard Draft
            </button>
            <button
              onClick={handlePublishPage}
              disabled={pagesEditorBusy}
              className="flex items-center gap-1.5 px-3.5 py-[8px] rounded-[10px] text-[12.5px] font-bold text-white border-none cursor-pointer transition-opacity disabled:opacity-60 whitespace-nowrap"
              style={{ background: '#D97757' }}>
              {pagesEditorBusy ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />} Publish
            </button>
          </div>
        </div>
      )}

      <div className="px-4 lg:px-7 py-5 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 items-start">
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
      </div>

      <VersionHistoryModal
        title="Page Version History"
        open={showPageVersionHistory}
        onClose={() => setShowPageVersionHistory(false)}
        versions={pageVersions}
        loading={pageVersionsLoading}
        restoringId={restoringPageVersionId}
        onRestore={handleRestorePageVersion}
      />

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
