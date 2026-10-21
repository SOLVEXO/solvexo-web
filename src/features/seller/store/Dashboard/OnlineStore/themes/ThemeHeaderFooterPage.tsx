import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, RotateCcw, History, Undo2, Redo2, Monitor, Tablet, Smartphone, Megaphone } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { SkeletonBox } from '@/components/comman/ui';
import { EditorTopBar, PreviewButton } from '../builder/EditorTopBar';
import { VersionHistoryModal } from '../builder/VersionHistoryModal';
import { useThemeEditorUnsavedChanges } from '@/components/layouts/ThemeEditorUnsavedContext';
import { useUndoRedoShortcuts } from '../builder/editor/useUndoRedoShortcuts';
import { useResolvedThemeInstance } from '../builder/useResolvedThemeInstance';
import { ThemeLivePreview } from './ThemeLivePreview';
import { AnnouncementForm } from './AnnouncementForm';
import { DEFAULT_ANNOUNCEMENT } from './announcementDefaults';
import { HeaderEditor, FooterEditor } from './HeaderFooterEditors';
import { useHeaderFooterDraft } from './useHeaderFooterDraft';
import { getThemePreviewComponents } from '@/features/storefront-themes/themePreviewComponents';
import { getThemeManifest } from '@/features/storefront-themes/themeManifest';
import { DEFAULT_THEME_ID } from '@/features/storefront-themes/registry';

// Platform brand colour for editor chrome (not the theme's accent).
const ADMIN_ACCENT = '#D97757';

const DEVICE_WIDTH: Record<'desktop' | 'tablet' | 'mobile', string> = { desktop: '100%', tablet: '768px', mobile: '390px' };

/** Online Store → Themes → Header & Footer. The same header/footer/announcement
 *  editors are also inside Customize (Header and Footer groups); this page is
 *  the focused view of just those three. Draft/publish/version history are the
 *  theme's own (shared with Theme settings). */
export function ThemeHeaderFooterPage() {
  const { store, storeId, loading: storeLoading, refetch: refetchStore } = useStoreWorkspace();
  const toast = useToast();
  const flash = (ok: boolean, text: string) => { if (ok) toast.success(text); else toast.error(text); };

  // Resolves the URL's `:themeId` to this theme's own installed row so edits
  // never land on a different, active theme.
  const themeInstance = useResolvedThemeInstance(storeId);
  const installedThemeId = themeInstance.status === 'ready' ? themeInstance.installedThemeId : undefined;

  const [tab, setTab] = useState<'header' | 'footer' | 'announcement'>('header');
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [versionsOpen, setVersionsOpen] = useState(false);

  const hf = useHeaderFooterDraft({ storeId, installedThemeId, ready: themeInstance.status === 'ready', store, refetchStore });
  const { editor, headerDraft, footerDraft, themeDoc } = hf;
  useThemeEditorUnsavedChanges(editor.dirty || hf.announcementDirty);
  useUndoRedoShortcuts(editor.undo, editor.redo, true);

  const handleSave = async () => {
    try { await hf.save(); flash(true, 'Draft saved — Publish to make it live.'); }
    catch (err) { flash(false, err instanceof Error ? err.message : 'Failed to save.'); }
  };
  const handlePublish = async () => {
    try { await hf.publish(); flash(true, 'Published — your storefront is now live with these changes.'); }
    catch (err) { flash(false, err instanceof Error ? err.message : 'Failed to publish.'); }
  };
  const handleDiscard = async () => {
    try { await hf.discard(); flash(true, 'Draft discarded — reverted to your published header/footer.'); }
    catch (err) { flash(false, err instanceof Error ? err.message : 'Failed to discard draft.'); }
  };
  const handleSaveAnnouncement = async () => {
    try {
      const saved = await hf.saveAnnouncement();
      if (saved) flash(true, saved.isActive ? 'Announcement bar saved — live on your storefront now.' : 'Announcement bar saved (currently off).');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to save announcement bar.');
    }
  };
  const openVersions = () => { setVersionsOpen(true); hf.loadVersions(); };
  const restoreVersion = async (versionId: string) => {
    try {
      await hf.restoreVersion(versionId);
      setVersionsOpen(false);
      flash(true, 'Version restored to your draft — review it, then Publish.');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to restore version.');
    }
  };

  const previewPanelBg = getThemePreviewComponents(hf.previewTheme?.themeDefinitionId, DEFAULT_THEME_ID).theme.colors.bg;
  const manifest = getThemeManifest(themeDoc?.themeDefinitionId, DEFAULT_THEME_ID);
  const busy = editor.phase === 'saving' || editor.phase === 'publishing' || hf.discarding;

  if (hf.loadError && !hf.loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-center py-24 px-6" role="alert">
        <p className="text-[14px] font-bold text-charcoal">Couldn't load your header and footer.</p>
        <p className="text-[13px] text-slate">{hf.loadError}</p>
        <button type="button" onClick={hf.reload} className="h-9 px-4 rounded-lg text-[13px] font-semibold text-white border-none cursor-pointer" style={{ background: ADMIN_ACCENT }}>Try again</button>
      </div>
    );
  }

  // Safe rejection for an invalid/uninstalled/cross-store theme id.
  if (themeInstance.status === 'not-found') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-center py-24 px-6">
        <p className="text-[14px] font-bold text-charcoal">This theme isn't installed on this store.</p>
        <Link to={`/store/${storeId}/online-store/themes`} className="text-[13px] font-semibold no-underline" style={{ color: ADMIN_ACCENT }}>
          Back to Themes
        </Link>
      </div>
    );
  }

  if (storeLoading || themeInstance.status === 'loading' || hf.loading || !headerDraft || !footerDraft) {
    return <div className="p-7 flex flex-col gap-4"><SkeletonBox width={240} height={22} rounded="6px" /><SkeletonBox height={400} rounded="16px" /></div>;
  }

  return (
    <div className="bg-[#FAF9F5] min-h-full">
      <EditorTopBar
        exitTo={`/store/${storeId}/online-store/themes`}
        title={`Header & Footer — ${manifest.name}`}
        subtitle={tab === 'announcement'
          ? 'A message strip shown across your whole storefront. Saving here takes effect immediately — there is no separate Publish step.'
          : 'Navigation links, footer columns, social links, and copyright text. Edits save to a draft — nothing goes live until you Publish.'}
      >
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <PreviewButton storeId={storeId} installedThemeId={installedThemeId} />
          <div className="flex items-center gap-2 overflow-x-auto min-w-0 py-0.5" style={{ scrollbarWidth: 'none' }}>
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
            {tab !== 'announcement' && (
              <>
                <button onClick={editor.undo} disabled={!editor.canUndo} title="Undo" className="shrink-0 p-2 rounded-lg border border-bone bg-white text-charcoal disabled:opacity-40 cursor-pointer"><Undo2 size={15} /></button>
                <button onClick={editor.redo} disabled={!editor.canRedo} title="Redo" className="shrink-0 p-2 rounded-lg border border-bone bg-white text-charcoal disabled:opacity-40 cursor-pointer"><Redo2 size={15} /></button>
                <button onClick={openVersions} title="Version History" className="shrink-0 p-2 rounded-lg border border-bone bg-white text-charcoal cursor-pointer"><History size={15} /></button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {tab === 'announcement' ? (
              <button onClick={handleSaveAnnouncement} disabled={hf.savingAnnouncement || !hf.announcementForm} className="flex items-center gap-1.5 px-5 py-[9px] rounded-[10px] text-[13px] font-bold text-white border-none cursor-pointer disabled:opacity-60" style={{ background: ADMIN_ACCENT }}>
                {hf.savingAnnouncement ? <Loader2 size={13} className="animate-spin" /> : null} Save — goes live immediately
              </button>
            ) : (
              <>
                {editor.hasUnpublishedChanges && (
                  <button onClick={handleDiscard} disabled={busy} className="flex items-center gap-1.5 px-3.5 py-[9px] rounded-[10px] text-[12.5px] font-semibold border border-bone bg-white text-charcoal cursor-pointer disabled:opacity-60">
                    <RotateCcw size={13} /> Discard Draft
                  </button>
                )}
                <button onClick={handleSave} disabled={editor.phase === 'saving'} className="flex items-center gap-1.5 px-5 py-[9px] rounded-[10px] text-[13px] font-bold text-white border-none cursor-pointer disabled:opacity-60" style={{ background: ADMIN_ACCENT }}>
                  {editor.phase === 'saving' ? <Loader2 size={13} className="animate-spin" /> : null} Save Draft
                </button>
                <button onClick={handlePublish} disabled={editor.phase === 'publishing'} className="flex items-center gap-1.5 px-5 py-[9px] rounded-[10px] text-[13px] font-bold text-white border-none cursor-pointer disabled:opacity-60" style={{ background: ADMIN_ACCENT }}>
                  {editor.phase === 'publishing' ? <Loader2 size={13} className="animate-spin" /> : null} Publish
                </button>
              </>
            )}
          </div>
        </div>
      </EditorTopBar>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5 px-4 lg:px-7 py-5">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 border-b border-bone" role="tablist">
            {(['header', 'footer', 'announcement'] as const).map(k => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                className="px-4 py-2.5 text-[13px] font-semibold cursor-pointer bg-transparent border-none capitalize flex items-center gap-1.5"
                style={{ color: tab === k ? '#161412' : '#8C8A82', borderBottom: tab === k ? '2px solid #161412' : '2px solid transparent' }}>
                {k === 'announcement' && <Megaphone size={13} />}
                {k === 'announcement' ? 'Announcement' : k}
              </button>
            ))}
          </div>

          {tab === 'header' ? (
            <HeaderEditor hf={hf} storeId={storeId} onError={msg => flash(false, msg)} supports={manifest.supportedHeaderOptions} choices={manifest.headerOptionChoices} />
          ) : tab === 'footer' ? (
            <FooterEditor hf={hf} storeId={storeId} onError={msg => flash(false, msg)} supports={manifest.supportedFooterOptions} />
          ) : (
            <AnnouncementForm value={hf.announcementForm ?? DEFAULT_ANNOUNCEMENT} onChange={hf.setAnnouncementForm} />
          )}
        </div>

        <div className="border border-bone rounded-2xl bg-white overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
          <div className="h-full overflow-auto flex justify-center bg-[#F1EDE5] p-4">
            <div style={{ width: DEVICE_WIDTH[device], maxWidth: '100%', background: previewPanelBg, boxShadow: device !== 'desktop' ? '0 0 0 1px #E4DFD3' : undefined, transition: 'width 200ms' }}>
              <ThemeLivePreview sections={[]} showChrome draftTheme={hf.previewTheme} announcementOverride={hf.announcementForm} />
            </div>
          </div>
        </div>
      </div>

      <VersionHistoryModal
        title="Header & Footer — Version History"
        open={versionsOpen}
        loading={hf.versionsLoading}
        versions={hf.versions}
        restoringId={hf.restoringVersionId}
        onClose={() => setVersionsOpen(false)}
        onRestore={restoreVersion}
      />
    </div>
  );
}
