import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  apiGetStoreTheme, apiUpdateStoreHeader, apiUpdateStoreFooter, apiPublishStoreTheme, apiRevertStoreThemeDraft,
  apiListStoreThemeVersions, apiRestoreStoreThemeVersion,
  type StoreThemeData, type StorefrontHeader, type StorefrontFooter,
} from '@/api/services/storeTheme';
import { apiUpdateAnnouncementBar, type StoreAnnouncementBar as StoreAnnouncementBarValue } from '@/api/services/store';
import { apiListStorePages } from '@/api/services/storePages';
import { apiListMenus, type Menu } from '@/api/services/menus';
import type { PageOption } from '../builder/BlockFields';
import type { VersionRow } from '../builder/VersionHistoryModal';
import { useEditorState } from '../builder/editor/useEditorState';
import { DEFAULT_ANNOUNCEMENT } from './announcementDefaults';
import { footerSettingsOf } from './headerFooterSettings';

export interface HeaderFooterDraft { header: StorefrontHeader; footer: StorefrontFooter }

/** Header + footer draft (part of the StoreTheme draft) and the announcement
 *  bar (a Store field, live on save), shared by the Customize editor's
 *  Header/Footer groups and the standalone Header & Footer page. */
export function useHeaderFooterDraft({ storeId, installedThemeId, ready, store, refetchStore }: {
  storeId: string;
  installedThemeId?: string;
  /** False until the URL's theme instance is resolved. */
  ready: boolean;
  store?: { announcementBar?: StoreAnnouncementBarValue | null } | null;
  refetchStore?: () => void;
}) {
  const [themeDoc, setThemeDoc] = useState<StoreThemeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [discarding, setDiscarding] = useState(false);
  const [pageOptions, setPageOptions] = useState<PageOption[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);

  const editor = useEditorState<HeaderFooterDraft>();

  const load = useCallback(() => {
    if (!ready) return;
    setLoading(true);
    setLoadError('');
    apiGetStoreTheme(storeId, installedThemeId)
      .then(res => {
        setThemeDoc(res.data);
        editor.load({ header: res.data.header, footer: res.data.footer }, { header: res.data.draft.header, footer: res.data.draft.footer });
      })
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Could not load your header and footer.'))
      .finally(() => setLoading(false));
    apiListStorePages(storeId).then(res => setPageOptions(res.data.filter(p => p.type === 'custom').map(p => ({ slug: p.slug, title: p.title })))).catch(() => setPageOptions([]));
    apiListMenus(storeId).then(res => setMenus(res.data)).catch(() => setMenus([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, ready, installedThemeId]);

  useEffect(() => { load(); }, [load]);

  const headerDraft = editor.workingCopy?.header ?? null;
  const footerDraft = editor.workingCopy?.footer ?? null;

  const persist = useCallback(async (draft: HeaderFooterDraft) => {
    const [hRes, fRes] = await Promise.all([
      apiUpdateStoreHeader(storeId, draft.header, installedThemeId),
      apiUpdateStoreFooter(storeId, draft.footer.blocks, draft.footer.footerStyle, installedThemeId, draft.footer.menuId, footerSettingsOf(draft.footer)),
    ]);
    return { header: hRes.data.draft.header, footer: fRes.data.draft.footer };
  }, [storeId, installedThemeId]);

  /** Saves the header/footer draft. Throws on failure (after marking the editor). */
  const save = useCallback(async () => {
    const draft = editor.workingCopy;
    if (!draft) return;
    editor.markSaving();
    try {
      editor.markSaved(await persist(draft));
    } catch (err) {
      editor.markSaveError(err instanceof Error ? err.message : 'Failed to save.');
      throw err;
    }
  }, [editor, persist]);

  /** A removal saves straight away (like every other editor here). Both parts
   *  are saved because `markSaved` marks the whole draft clean. */
  const persistRemoval = useCallback(async (next: HeaderFooterDraft, onError: (msg: string) => void) => {
    const rollbackTo = editor.workingCopy;
    editor.edit(next);
    try {
      await persist(next);
      editor.markSaved(next);
    } catch (err) {
      if (rollbackTo) editor.discardDraft(rollbackTo);
      onError(err instanceof Error ? err.message : 'Failed to save.');
    }
  }, [editor, persist]);

  /** Saves any local edit first, then publishes the whole theme draft. */
  const publish = useCallback(async () => {
    editor.markPublishing();
    try {
      if (editor.dirty && editor.workingCopy) await persist(editor.workingCopy);
      const res = await apiPublishStoreTheme(storeId, installedThemeId);
      setThemeDoc(res.data);
      editor.markPublished({ header: res.data.header, footer: res.data.footer });
    } catch (err) {
      editor.markPublishError(err instanceof Error ? err.message : 'Failed to publish.');
      throw err;
    }
  }, [editor, persist, storeId, installedThemeId]);

  const discard = useCallback(async () => {
    setDiscarding(true);
    try {
      const res = await apiRevertStoreThemeDraft(storeId, installedThemeId);
      setThemeDoc(res.data);
      editor.discardDraft({ header: res.data.draft.header, footer: res.data.draft.footer });
    } finally {
      setDiscarding(false);
    }
  }, [editor, storeId, installedThemeId]);

  const loadVersions = useCallback(() => {
    setVersionsLoading(true);
    apiListStoreThemeVersions(storeId, installedThemeId)
      .then(res => setVersions(res.data))
      .catch(() => setVersions([]))
      .finally(() => setVersionsLoading(false));
  }, [storeId, installedThemeId]);

  const restoreVersion = useCallback(async (versionId: string) => {
    setRestoringVersionId(versionId);
    try {
      const res = await apiRestoreStoreThemeVersion(storeId, versionId, installedThemeId);
      setThemeDoc(res.data);
      editor.discardDraft({ header: res.data.draft.header, footer: res.data.draft.footer });
    } finally {
      setRestoringVersionId(null);
    }
  }, [editor, storeId, installedThemeId]);

  // ── Announcement bar (Store field, goes live on save) ──
  const [announcementForm, setAnnouncementForm] = useState<StoreAnnouncementBarValue | null>(null);
  const [savedAnnouncement, setSavedAnnouncement] = useState<StoreAnnouncementBarValue | null>(null);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const storeAnnouncement = store?.announcementBar;
  useEffect(() => {
    if (store && announcementForm === null) {
      const initial = storeAnnouncement ?? DEFAULT_ANNOUNCEMENT;
      setAnnouncementForm(initial);
      setSavedAnnouncement(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);
  const announcementDirty = !!announcementForm && !!savedAnnouncement
    && JSON.stringify(announcementForm) !== JSON.stringify(savedAnnouncement);

  const resetAnnouncement = useCallback(() => { if (savedAnnouncement) setAnnouncementForm(savedAnnouncement); }, [savedAnnouncement]);

  const saveAnnouncement = useCallback(async () => {
    if (!announcementForm) return null;
    setSavingAnnouncement(true);
    try {
      const res = await apiUpdateAnnouncementBar(storeId, announcementForm);
      setAnnouncementForm(res.data);
      setSavedAnnouncement(res.data);
      refetchStore?.();
      return res.data;
    } finally {
      setSavingAnnouncement(false);
    }
  }, [announcementForm, storeId, refetchStore]);

  /** The theme doc with the CURRENT (possibly unsaved) header/footer laid over its draft. */
  const previewTheme: StoreThemeData | null = useMemo(() => {
    if (!themeDoc || !headerDraft || !footerDraft) return themeDoc;
    return { ...themeDoc, draft: { ...themeDoc.draft, header: headerDraft, footer: footerDraft } };
  }, [themeDoc, headerDraft, footerDraft]);

  return {
    themeDoc, setThemeDoc, loading, loadError, reload: load, discarding,
    editor, headerDraft, footerDraft, menus, pageOptions, previewTheme,
    save, persistRemoval, publish, discard,
    versions, versionsLoading, restoringVersionId, loadVersions, restoreVersion,
    announcementForm, setAnnouncementForm, announcementDirty, savingAnnouncement, saveAnnouncement, resetAnnouncement,
  };
}

export type HeaderFooterDraftState = ReturnType<typeof useHeaderFooterDraft>;
