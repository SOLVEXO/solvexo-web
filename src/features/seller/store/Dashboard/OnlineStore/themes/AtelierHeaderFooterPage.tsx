import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Plus, RotateCcw, History, Undo2, Redo2, Monitor, Tablet, Smartphone, Megaphone } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { SkeletonBox, Toggle } from '@/components/comman/ui';
import {
  apiGetStoreTheme, apiUpdateStoreHeader, apiUpdateStoreFooter, apiPublishStoreTheme, apiRevertStoreThemeDraft,
  apiListStoreThemeVersions, apiRestoreStoreThemeVersion,
  type StoreThemeData, type StorefrontHeader, type StorefrontFooter,
} from '@/api/services/storeTheme';
import { apiUpdateAnnouncementBar, type StoreAnnouncementBar as StoreAnnouncementBarValue, type StoreAnnouncementType } from '@/api/services/store';
import type { Block } from '@/api/services/storefrontTypes';
import { BlockFields, type PageOption } from '../builder/BlockFields';
import { SortableList } from '../builder/Sortable';
import { ConfirmDialog } from '../builder/ConfirmDialog';
import { VersionHistoryModal, type VersionRow } from '../builder/VersionHistoryModal';
import { useEditorState } from '../builder/editor/useEditorState';
import { useUndoRedoShortcuts } from '../builder/editor/useUndoRedoShortcuts';
import { apiListStorePages } from '@/api/services/storePages';
import { apiListMenus, type Menu } from '@/api/services/menus';
import { AtelierLivePreview } from './AtelierLivePreview';
import { getThemePreviewComponents } from '@/features/storefront-themes/themePreviewComponents';
import { getThemeManifest } from '@/features/storefront-themes/themeManifest';
import { DEFAULT_THEME_ID } from '@/features/storefront-themes/registry';

// Fixed platform brand color — same literal `ThemeLibraryPage.tsx`'s Install
// button and `AtelierCustomizePage.tsx`'s `SaveButton` use. Admin-chrome
// controls (Save/Publish/"+ Add" links here) intentionally use the
// PLATFORM's own brand color rather than the active theme's accent — this
// page previously read Atelier's static accent color unconditionally
// regardless of which theme was actually active on the store, a real (if
// purely cosmetic) per-theme-hardcoding bug fixed alongside the live-preview
// panel's own fix (see `themePreviewComponents.ts`).
const ADMIN_ACCENT = '#D97757';

const ANNOUNCEMENT_TYPE_LABEL: Record<StoreAnnouncementType, string> = {
  info: 'Info', sale: 'Sale', coupon: 'Coupon', warning: 'Warning', shipping: 'Shipping', holiday: 'Holiday',
};
const DEFAULT_ANNOUNCEMENT: StoreAnnouncementBarValue = {
  message: null, type: 'info', ctaLabel: null, ctaLink: null, isActive: false, startAt: null, endAt: null,
};

// `datetime-local` inputs need `YYYY-MM-DDTHH:mm` in the browser's own local
// time, with no trailing `Z`/offset — this round-trips through the ISO
// strings the API stores/returns without importing a date library for one
// format conversion.
function toDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromDatetimeLocal(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const DEVICE_WIDTH: Record<'desktop' | 'tablet' | 'mobile', string> = { desktop: '100%', tablet: '768px', mobile: '390px' };

interface HeaderFooterDraft { header: StorefrontHeader; footer: StorefrontFooter }

const FOOTER_BLOCK_OPTIONS: { type: string; label: string; defaults: Record<string, unknown> }[] = [
  { type: 'footer_column', label: 'Link column', defaults: { heading: '', links: [] } },
  { type: 'social_link', label: 'Social link', defaults: { platform: 'facebook', url: '' } },
  { type: 'copyright_text', label: 'Copyright text', defaults: { text: '' } },
];

function BlockRow({ block, onChange, onRemove, pageOptions, storeId }: {
  block: Block; onChange: (next: Block) => void; onRemove: () => void; pageOptions: PageOption[]; storeId: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const label = block.settings.label || block.settings.heading || block.settings.platform || block.settings.text || block.type;
  return (
    <div className="border border-bone rounded-lg bg-white">
      <div className="flex items-center gap-2 px-3 py-2">
        <button type="button" onClick={() => setOpen(o => !o)} className="flex-1 min-w-0 flex items-center gap-2 bg-transparent border-none cursor-pointer text-left p-0">
          <span className="text-[12.5px] font-medium text-charcoal truncate capitalize">{label || String(block.type).replace(/_/g, ' ')}</span>
        </button>
        <button type="button" onClick={() => setConfirming(true)} className="text-error text-[11px] font-semibold px-2 py-1 hover:bg-error-bg rounded-md bg-transparent border-none cursor-pointer">Remove</button>
      </div>
      {open && <div className="px-3 pb-3 pt-1 border-t border-bone/70"><BlockFields type={block.type} settings={block.settings} onChange={settings => onChange({ ...block, settings })} pageOptions={pageOptions} storeId={storeId} /></div>}
      {confirming && (
        <ConfirmDialog title="Remove item" message={`Remove "${label}"? This cannot be undone.`} confirmLabel="Remove" onCancel={() => setConfirming(false)} onConfirm={() => { setConfirming(false); onRemove(); }} />
      )}
    </div>
  );
}

/** The Announcement tab's form — edits `Store.announcementBar` directly.
 *  Deliberately NOT wired into `useEditorState`/the draft-publish toolbar:
 *  unlike header/footer, this field has no draft — `apiUpdateAnnouncementBar`
 *  writes (and takes effect on the live storefront, subject to `isActive`/
 *  the schedule window) the moment the seller clicks Save. The form makes
 *  that explicit rather than borrowing "Save Draft" language that would be
 *  dishonest about what actually happens. */
function AnnouncementForm({ value, onChange }: { value: StoreAnnouncementBarValue; onChange: (next: StoreAnnouncementBarValue) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between bg-white border border-bone rounded-lg px-3 py-2.5">
        <div>
          <p className="text-[12.5px] font-semibold text-charcoal">Show announcement bar</p>
          <p className="text-[11px] text-slate">When off, nothing shows even if a message is set below.</p>
        </div>
        <Toggle checked={value.isActive} onChange={isActive => onChange({ ...value, isActive })} ariaLabel="Show announcement bar" />
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate">Message</span>
        <textarea
          value={value.message ?? ''}
          onChange={e => onChange({ ...value, message: e.target.value || null })}
          placeholder="Free shipping on orders over $50"
          rows={2}
          maxLength={200}
          className="text-[13px] px-3 py-2 rounded-lg border border-bone bg-white resize-none focus:outline-none focus:ring-1"
          style={{ fontFamily: 'inherit' }}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate">Style</span>
        <select
          value={value.type}
          onChange={e => onChange({ ...value, type: e.target.value as StoreAnnouncementType })}
          className="text-[13px] px-3 py-2 rounded-lg border border-bone bg-white"
        >
          {(Object.keys(ANNOUNCEMENT_TYPE_LABEL) as StoreAnnouncementType[]).map(k => (
            <option key={k} value={k}>{ANNOUNCEMENT_TYPE_LABEL[k]}</option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate">Button label</span>
          <input
            value={value.ctaLabel ?? ''}
            onChange={e => onChange({ ...value, ctaLabel: e.target.value || null })}
            placeholder="Shop now"
            className="text-[13px] px-3 py-2 rounded-lg border border-bone bg-white"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate">Button link</span>
          <input
            value={value.ctaLink ?? ''}
            onChange={e => onChange({ ...value, ctaLink: e.target.value || null })}
            placeholder="/collections/sale"
            className="text-[13px] px-3 py-2 rounded-lg border border-bone bg-white"
          />
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate">Schedule (optional)</span>
        <p className="text-[11px] text-slate -mt-1">Leave blank to show as soon as it's on, with no end date.</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] text-slate">Starts</span>
            <input
              type="datetime-local"
              value={toDatetimeLocal(value.startAt)}
              onChange={e => onChange({ ...value, startAt: fromDatetimeLocal(e.target.value) })}
              className="text-[12.5px] px-2.5 py-2 rounded-lg border border-bone bg-white"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] text-slate">Ends</span>
            <input
              type="datetime-local"
              value={toDatetimeLocal(value.endAt)}
              onChange={e => onChange({ ...value, endAt: fromDatetimeLocal(e.target.value) })}
              className="text-[12.5px] px-2.5 py-2 rounded-lg border border-bone bg-white"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

/** Theme 01's own Header + Footer content editor — `Online Store → Themes
 *  → Atelier → Header & Footer`. Deliberately does NOT expose the legacy
 *  visual layout pickers (logoSource/headerStyle/navAlignment/footerStyle)
 *  — Atelier's header/footer LAYOUT is its own fixed design, not a
 *  swappable variant; only real merchant CONTENT (nav links, footer link
 *  columns, social links, copyright text) is editable here, via the same
 *  real `StoreTheme.header`/`.footer` block data `AtelierNavbar`/
 *  `AtelierFooter` already render on the real storefront.
 *
 *  Uses the exact same `useEditorState` draft/undo-redo/save/publish engine
 *  every other Atelier template editor uses (Home/Product/Collection/
 *  Search/Cart/Blog) — this previously had its own hand-rolled undo/redo
 *  array pair, which behaved subtly differently (e.g. no `hasUnpublishedChanges`
 *  computed the same way). Consolidating onto the shared engine removes that
 *  inconsistency rather than just leaving it as a "known difference." */
export function AtelierHeaderFooterPage() {
  const { store, storeId, loading: storeLoading, refetch: refetchStore } = useStoreWorkspace();
  const toast = useToast();
  const flash = (ok: boolean, text: string) => { if (ok) toast.success(text); else toast.error(text); };

  const [tab, setTab] = useState<'header' | 'footer' | 'announcement'>('header');
  const [themeDoc, setThemeDoc] = useState<StoreThemeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [discarding, setDiscarding] = useState(false);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [pageOptions, setPageOptions] = useState<PageOption[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);

  // Announcement bar — separate state from `editor` above on purpose: this
  // field lives on `Store`, not `StoreTheme`, and saves immediately (see
  // `AnnouncementForm`'s doc comment), so it has no draft/undo/redo/version
  // history of its own. Seeded once from the real store record, then only
  // ever overwritten by this component's own successful saves — never
  // silently clobbered by an unrelated `store` refetch while the seller is
  // mid-edit.
  const [announcementForm, setAnnouncementForm] = useState<StoreAnnouncementBarValue | null>(null);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  useEffect(() => {
    if (store && announcementForm === null) setAnnouncementForm(store.announcementBar ?? DEFAULT_ANNOUNCEMENT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const handleSaveAnnouncement = async () => {
    if (!announcementForm) return;
    setSavingAnnouncement(true);
    try {
      const res = await apiUpdateAnnouncementBar(storeId, announcementForm);
      setAnnouncementForm(res.data);
      refetchStore();
      flash(true, res.data.isActive ? 'Announcement bar saved — live on your storefront now.' : 'Announcement bar saved (currently off).');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to save announcement bar.');
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const editor = useEditorState<HeaderFooterDraft>();
  useUndoRedoShortcuts(editor.undo, editor.redo, true);

  const load = useCallback(() => {
    setLoading(true);
    apiGetStoreTheme(storeId)
      .then(res => {
        setThemeDoc(res.data);
        editor.load({ header: res.data.header, footer: res.data.footer }, { header: res.data.draft.header, footer: res.data.draft.footer });
      })
      .finally(() => setLoading(false));
    apiListStorePages(storeId).then(res => setPageOptions(res.data.filter(p => p.type === 'custom').map(p => ({ slug: p.slug, title: p.title })))).catch(() => {});
    apiListMenus(storeId).then(res => setMenus(res.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const workingCopy = editor.workingCopy;
  const headerDraft = workingCopy?.header ?? null;
  const footerDraft = workingCopy?.footer ?? null;

  const handleSave = async () => {
    if (!headerDraft || !footerDraft) return;
    editor.markSaving();
    try {
      const [hRes, fRes] = await Promise.all([
        apiUpdateStoreHeader(storeId, headerDraft),
        apiUpdateStoreFooter(storeId, footerDraft.blocks, footerDraft.footerStyle, undefined, footerDraft.menuId),
      ]);
      editor.markSaved({ header: hRes.data.draft.header, footer: fRes.data.draft.footer });
      flash(true, 'Draft saved — Publish to make it live.');
    } catch (err) {
      editor.markSaveError(err instanceof Error ? err.message : 'Failed to save.');
      flash(false, err instanceof Error ? err.message : 'Failed to save.');
    }
  };

  const handlePersistRemoval = async (kind: 'header' | 'footer', next: HeaderFooterDraft) => {
    try {
      if (kind === 'header') await apiUpdateStoreHeader(storeId, next.header);
      else await apiUpdateStoreFooter(storeId, next.footer.blocks, next.footer.footerStyle, undefined, next.footer.menuId);
      editor.markSaved(next);
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
      if (editor.dirty && headerDraft && footerDraft) {
        await Promise.all([
          apiUpdateStoreHeader(storeId, headerDraft),
          apiUpdateStoreFooter(storeId, footerDraft.blocks, footerDraft.footerStyle, undefined, footerDraft.menuId),
        ]);
      }
      const res = await apiPublishStoreTheme(storeId);
      setThemeDoc(res.data);
      editor.markPublished({ header: res.data.header, footer: res.data.footer });
      flash(true, 'Published — your storefront is now live with these changes.');
    } catch (err) {
      editor.markPublishError(err instanceof Error ? err.message : 'Failed to publish.');
      flash(false, err instanceof Error ? err.message : 'Failed to publish.');
    }
  };

  const handleDiscard = async () => {
    setDiscarding(true);
    try {
      const res = await apiRevertStoreThemeDraft(storeId);
      setThemeDoc(res.data);
      editor.discardDraft({ header: res.data.draft.header, footer: res.data.draft.footer });
      flash(true, 'Draft discarded — reverted to your published header/footer.');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to discard draft.');
    } finally {
      setDiscarding(false);
    }
  };

  const openVersions = () => {
    setVersionsOpen(true);
    setVersionsLoading(true);
    apiListStoreThemeVersions(storeId).then(res => setVersions(res.data)).catch(() => setVersions([])).finally(() => setVersionsLoading(false));
  };

  const restoreVersion = async (versionId: string) => {
    setRestoringVersionId(versionId);
    try {
      const res = await apiRestoreStoreThemeVersion(storeId, versionId);
      setThemeDoc(res.data);
      editor.discardDraft({ header: res.data.draft.header, footer: res.data.draft.footer });
      setVersionsOpen(false);
      flash(true, 'Version restored to your draft — review it, then Publish.');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to restore version.');
    } finally {
      setRestoringVersionId(null);
    }
  };

  // Feeds the shared live-preview panel — the same real `AtelierNavbar`/
  // `AtelierFooter` the public storefront renders, given the CURRENT
  // (possibly unsaved) header/footer draft instead of `themeDoc`'s last-
  // fetched one. This is the real fix for "editing Header/Footer showed no
  // live preview at all" — previously this page had no preview panel.
  const previewTheme: StoreThemeData | null = useMemo(() => {
    if (!themeDoc || !headerDraft || !footerDraft) return themeDoc;
    return { ...themeDoc, draft: { ...themeDoc.draft, header: headerDraft, footer: footerDraft } };
  }, [themeDoc, headerDraft, footerDraft]);

  // The preview PANEL's own background — resolved against the real active
  // theme (not hardcoded to Atelier), same fix as `AtelierCustomizePage.tsx`'s
  // own `previewPanelBg` — see that file's comment.
  const previewPanelBg = getThemePreviewComponents(previewTheme?.themeDefinitionId, DEFAULT_THEME_ID).theme.colors.bg;

  // Page title's theme name — resolved the same way, instead of a literal
  // "Atelier" that kept showing even while editing a Nova (or any other
  // non-Atelier) store's Header & Footer. See `AtelierCustomizePage.tsx`'s
  // identical `manifest.name` fix for the full story.
  const manifest = getThemeManifest(themeDoc?.themeDefinitionId, DEFAULT_THEME_ID);

  const busy = editor.phase === 'saving' || editor.phase === 'publishing' || discarding;

  if (storeLoading || loading || !headerDraft || !footerDraft) {
    return <div className="p-7 flex flex-col gap-4"><SkeletonBox width={240} height={22} rounded="6px" /><SkeletonBox height={400} rounded="16px" /></div>;
  }

  return (
    <div className="bg-[#FAF9F5] min-h-full">
      <StorePageHeader
        title={`Header & Footer — ${manifest.name}`}
        subtitle={tab === 'announcement'
          ? 'A message strip shown across your whole storefront. Saving here takes effect immediately — there is no separate Publish step.'
          : 'Navigation links, footer columns, social links, and copyright text. Edits save to a draft — nothing goes live until you Publish.'}
        actions={
          // Same split as Customize's toolbar: a horizontally-scrollable
          // group for device toggle/undo/redo/history, and a shrink-0 group
          // for Save Draft/Publish/Discard so those stay reachable without
          // scrolling on a narrow (390px) viewport.
          <div className="flex items-center gap-2 flex-wrap max-w-[calc(100vw-100px)] lg:max-w-none justify-end">
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
                <button onClick={handleSaveAnnouncement} disabled={savingAnnouncement || !announcementForm} className="flex items-center gap-1.5 px-5 py-[9px] rounded-[10px] text-[13px] font-bold text-white border-none cursor-pointer disabled:opacity-60" style={{ background: ADMIN_ACCENT }}>
                  {savingAnnouncement ? <Loader2 size={13} className="animate-spin" /> : null} Save — goes live immediately
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
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5 px-4 lg:px-7 py-5">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 border-b border-bone">
            {(['header', 'footer', 'announcement'] as const).map(k => (
              <button key={k} type="button" onClick={() => setTab(k)}
                className="px-4 py-2.5 text-[13px] font-semibold cursor-pointer bg-transparent border-none capitalize flex items-center gap-1.5"
                style={{ color: tab === k ? '#161412' : '#8C8A82', borderBottom: tab === k ? '2px solid #161412' : '2px solid transparent' }}>
                {k === 'announcement' && <Megaphone size={13} />}
                {k === 'announcement' ? 'Announcement' : k}
              </button>
            ))}
          </div>

          {tab === 'header' ? (
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1.5 pb-3 mb-1 border-b border-bone">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-slate">Navigation source</label>
                <select
                  className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none"
                  value={headerDraft.menuId ?? ''}
                  onChange={e => editor.edit(prev => ({ ...prev!, header: { ...headerDraft, menuId: e.target.value || null } }))}
                >
                  <option value="">Custom Links (below)</option>
                  {menus.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
                <p className="text-[11px] text-slate">
                  {headerDraft.menuId
                    ? 'Your storefront uses this menu\'s items. The links below are kept as a fallback if you detach it.'
                    : `Manage reusable menus under Online Store → Menus, then pick one here.`}
                </p>
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">Navigation Links</p>
              <SortableList items={headerDraft.blocks} keyFor={(b, i) => b._id ?? `new-${i}`} onReorder={blocks => editor.edit(prev => ({ ...prev!, header: { ...headerDraft, blocks } }))}>
                {(block, i) => (
                  <BlockRow
                    block={block}
                    onChange={next => editor.edit(prev => ({ ...prev!, header: { ...headerDraft, blocks: headerDraft.blocks.map((b, j) => j === i ? next : b) } }))}
                    onRemove={() => {
                      const nextHeader = { ...headerDraft, blocks: headerDraft.blocks.filter((_, j) => j !== i) };
                      const next = { header: nextHeader, footer: footerDraft };
                      editor.edit(next);
                      handlePersistRemoval('header', next);
                    }}
                    pageOptions={pageOptions}
                    storeId={storeId}
                  />
                )}
              </SortableList>
              {headerDraft.blocks.length < 10 && (
                <button type="button" onClick={() => editor.edit(prev => ({ ...prev!, header: { ...headerDraft, blocks: [...headerDraft.blocks, { type: 'nav_link', settings: { label: '', linkType: 'home' } }] } }))}
                  className="text-[12px] font-semibold cursor-pointer bg-transparent border-none text-left flex items-center gap-1" style={{ color: ADMIN_ACCENT }}>
                  <Plus size={13} /> Add nav link
                </button>
              )}
            </div>
          ) : tab === 'footer' ? (
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1.5 pb-3 mb-1 border-b border-bone">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-slate">Quick Links menu</label>
                <select
                  className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none"
                  value={footerDraft.menuId ?? ''}
                  onChange={e => editor.edit(prev => ({ ...prev!, footer: { ...footerDraft, menuId: e.target.value || null } }))}
                >
                  <option value="">None — use the link columns below only</option>
                  {menus.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
                <p className="text-[11px] text-slate">
                  {footerDraft.menuId
                    ? 'This menu appears as one extra link column on your storefront, alongside the columns below. Social links / copyright text below still render normally.'
                    : `Manage reusable menus under Online Store → Menus, then pick one here to add it as a footer column.`}
                </p>
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">Footer Content</p>
              {footerDraft.blocks.length === 0 && (
                <p className="text-[12.5px] text-slate leading-relaxed bg-white border border-bone rounded-lg px-3 py-2.5 mb-1">
                  Your footer is empty — add a link column, social links, or a copyright line.
                </p>
              )}
              <SortableList items={footerDraft.blocks} keyFor={(b, i) => b._id ?? `new-${i}`} onReorder={blocks => editor.edit(prev => ({ ...prev!, footer: { ...footerDraft, blocks } }))}>
                {(block, i) => (
                  <BlockRow
                    block={block}
                    onChange={next => editor.edit(prev => ({ ...prev!, footer: { ...footerDraft, blocks: footerDraft.blocks.map((b, j) => j === i ? next : b) } }))}
                    onRemove={() => {
                      const nextFooter = { ...footerDraft, blocks: footerDraft.blocks.filter((_, j) => j !== i) };
                      const next = { header: headerDraft, footer: nextFooter };
                      editor.edit(next);
                      handlePersistRemoval('footer', next);
                    }}
                    pageOptions={pageOptions}
                    storeId={storeId}
                  />
                )}
              </SortableList>
              <div className="flex items-center gap-3 flex-wrap">
                {FOOTER_BLOCK_OPTIONS.map(opt => (
                  <button key={opt.type} type="button"
                    onClick={() => editor.edit(prev => ({ ...prev!, footer: { ...footerDraft, blocks: [...footerDraft.blocks, { type: opt.type, settings: { ...opt.defaults } }] } }))}
                    className="text-[12px] font-semibold cursor-pointer bg-transparent border-none text-left flex items-center gap-1" style={{ color: ADMIN_ACCENT }}>
                    <Plus size={13} /> {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <AnnouncementForm value={announcementForm ?? DEFAULT_ANNOUNCEMENT} onChange={setAnnouncementForm} />
          )}
        </div>

        <div className="border border-bone rounded-2xl bg-white overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
          <div className="h-full overflow-auto flex justify-center bg-[#F1EDE5] p-4">
            <div style={{ width: DEVICE_WIDTH[device], maxWidth: '100%', background: previewPanelBg, boxShadow: device !== 'desktop' ? '0 0 0 1px #E4DFD3' : undefined, transition: 'width 200ms' }}>
              <AtelierLivePreview sections={[]} showChrome draftTheme={previewTheme} announcementOverride={announcementForm} />
            </div>
          </div>
        </div>
      </div>

      <VersionHistoryModal
        title="Header & Footer — Version History"
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
