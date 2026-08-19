import { useState, useEffect, useCallback } from 'react';
import { Loader2, Eye, EyeOff, Check, ExternalLink, LayoutGrid, Palette, PanelTop, PanelBottom, Newspaper, UserCog } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { SkeletonBox } from '@/components/comman/ui';
import { getStorefrontUrl } from '@/utils/storefrontUrl';
import {
  apiListStorePages, apiCreateStorePage, apiUpdateStorePageSections,
  apiPublishStorePage, apiUnpublishStorePage, apiDeleteStorePage,
  type StorePageData,
} from '@/api/services/storePages';
import {
  apiGetStoreTheme, apiUpdateStoreThemeColors, apiUpdateStoreHeader, apiUpdateStoreFooter, apiUpdateIdentityBanner,
  type StoreThemeData,
} from '@/api/services/storeTheme';
import type { Section } from '@/api/services/storefrontTypes';
import { PagesList } from './builder/PagesList';
import { PageSectionsEditor } from './builder/PageSectionsEditor';
import { ThemeTab } from './builder/ThemeTab';
import { ConfirmDialog } from './builder/ConfirmDialog';
import { HeaderTab, FooterTab } from './builder/HeaderFooterTabs';
import { StoreInfoTab } from './builder/StoreInfoTab';
import { BlogTab } from './builder/BlogTab';
import type { ThemeDefinition } from './builder/themes';

type Tab = 'pages' | 'theme' | 'header' | 'footer' | 'storeInfo' | 'blog';
const TABS: { id: Tab; label: string; Icon: typeof LayoutGrid }[] = [
  { id: 'pages',     label: 'Pages',      Icon: LayoutGrid },
  { id: 'theme',     label: 'Theme',      Icon: Palette },
  { id: 'header',    label: 'Header',     Icon: PanelTop },
  { id: 'footer',    label: 'Footer',     Icon: PanelBottom },
  { id: 'storeInfo', label: 'Store Info', Icon: UserCog },
  { id: 'blog',      label: 'Blog',       Icon: Newspaper },
];

function SaveStatus({ message }: { message: { ok: boolean; text: string } | null }) {
  if (!message) return null;
  return (
    <span className={`flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-[6px] rounded-full ${message.ok ? 'bg-success-bg text-success' : 'bg-error-bg text-error'}`}>
      {message.ok && <Check size={13} />} {message.text}
    </span>
  );
}

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
  const [sections, setSections] = useState<Section[]>([]);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [creatingPage, setCreatingPage] = useState(false);

  // The full saved theme doc is only ever written here (`setTheme`), never
  // read directly — every consumer works off the per-field drafts below.
  const [, setTheme] = useState<StoreThemeData | null>(null);
  const [themeLoading, setThemeLoading] = useState(true);
  // Local drafts — Theme/Header/Footer/Store Info tabs call `onChange` on
  // every keystroke/toggle for a responsive UI, so they edit these drafts,
  // not the saved `theme` directly; each tab has its own explicit Save
  // button that PATCHes only when clicked (never on every keystroke).
  const [themeDraft, setThemeDraft] = useState<StoreThemeData['theme'] | null>(null);
  const [headerDraft, setHeaderDraft] = useState<StoreThemeData['header'] | null>(null);
  const [footerDraft, setFooterDraft] = useState<StoreThemeData['footer'] | null>(null);
  const [identityDraft, setIdentityDraft] = useState<StoreThemeData['identityBanner'] | null>(null);
  // Which curated `themes.ts` theme the fields above were last bulk-applied
  // from — tracked alongside the drafts so "Save Theme" can persist it
  // together with everything else in one action (see `handleApplyTheme`).
  const [baseThemeIdDraft, setBaseThemeIdDraft] = useState<string | null>(null);
  // Controlled here (not local to `ThemeTab`) so the page grid can give the
  // Theme Gallery the FULL page width instead of squeezing it into the
  // narrow control rail that only Customize mode actually benefits from
  // (that rail exists so the live preview can dominate while fine-tuning
  // individual fields — the gallery's own "Preview" opens a real, fully
  // independent storefront preview in a new browser tab instead, see
  // `ThemePreviewPage.tsx`, so it never needs a side-by-side column here).
  const [themeMode, setThemeMode] = useState<'themes' | 'customize'>('themes');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

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

  const loadTheme = useCallback(() => {
    setThemeLoading(true);
    apiGetStoreTheme(storeId)
      .then(res => {
        setTheme(res.data);
        setThemeDraft(res.data.theme);
        setHeaderDraft(res.data.header);
        setFooterDraft(res.data.footer);
        setIdentityDraft(res.data.identityBanner);
        setBaseThemeIdDraft(res.data.baseThemeId);
      })
      .finally(() => setThemeLoading(false));
  }, [storeId]);

  useEffect(() => { loadPages(); loadTheme(); }, [loadPages, loadTheme]);
  useEffect(() => { setSections(selectedPage?.sections ?? []); }, [selectedPage?._id]);

  const flash = (ok: boolean, text: string) => { setMessage({ ok, text }); setTimeout(() => setMessage(null), 3000); };

  const handleSaveSections = async () => {
    if (!selectedPage) return;
    setSaving(true);
    try {
      const res = await apiUpdateStorePageSections(storeId, selectedPage._id, sections);
      setPages(prev => prev.map(p => p._id === res.data._id ? res.data : p));
      flash(true, 'Saved');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!selectedPage) return;
    setSaving(true);
    try {
      const res = selectedPage.status === 'published'
        ? await apiUnpublishStorePage(storeId, selectedPage._id)
        : await apiPublishStorePage(storeId, selectedPage._id);
      setPages(prev => prev.map(p => p._id === res.data._id ? res.data : p));
      flash(true, res.data.status === 'published' ? 'Page published' : 'Page unpublished');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePage = async (title: string, slug: string) => {
    setCreatingPage(true);
    try {
      const res = await apiCreateStorePage(storeId, { title, slug });
      setPages(prev => [...prev, res.data]);
      setSelectedPageId(res.data._id);
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
    setSections(next);
    if (!selectedPage) return;
    try {
      const res = await apiUpdateStorePageSections(storeId, selectedPage._id, next);
      setPages(prev => prev.map(p => p._id === res.data._id ? res.data : p));
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to remove — try again.');
    }
  };

  const persistHeader = async (next: StoreThemeData['header']) => {
    setHeaderDraft(next);
    try {
      const res = await apiUpdateStoreHeader(storeId, next);
      setTheme(res.data);
      setHeaderDraft(res.data.header);
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to remove — try again.');
    }
  };

  const persistFooter = async (next: StoreThemeData['footer']) => {
    setFooterDraft(next);
    try {
      const res = await apiUpdateStoreFooter(storeId, next.blocks, next.footerStyle);
      setTheme(res.data);
      setFooterDraft(res.data.footer);
    } catch (err) {
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
    if (!themeDraft) return;
    setSaving(true);
    try {
      const [themeRes, headerRes, footerRes] = await Promise.all([
        apiUpdateStoreThemeColors(storeId, { ...themeDraft, baseThemeId: baseThemeIdDraft }),
        headerDraft ? apiUpdateStoreHeader(storeId, { headerStyle: headerDraft.headerStyle }) : null,
        footerDraft ? apiUpdateStoreFooter(storeId, footerDraft.blocks, footerDraft.footerStyle) : null,
      ]);
      const latest = footerRes?.data ?? headerRes?.data ?? themeRes.data;
      setTheme(latest);
      setThemeDraft(latest.theme);
      setHeaderDraft(latest.header);
      setFooterDraft(latest.footer);
      setBaseThemeIdDraft(latest.baseThemeId);
      flash(true, 'Theme saved');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to save theme.');
    } finally {
      setSaving(false);
    }
  };

  // Applying a gallery theme updates every affected draft at once (colors +
  // baseThemeId + headerStyle + footerStyle) — still just a local, unsaved
  // change until "Save Theme" is clicked, same as any other Theme-tab edit.
  // Never fires directly from a card/button click — see `pendingApplyTheme`
  // below, which gates this behind an explicit confirm dialog first.
  const applyThemeNow = (t: ThemeDefinition) => {
    setThemeDraft(t.colors);
    setBaseThemeIdDraft(t.id);
    setHeaderDraft(prev => prev ? { ...prev, headerStyle: t.headerStyle } : prev);
    setFooterDraft(prev => prev ? { ...prev, footerStyle: t.footerStyle } : prev);
    setPendingApplyTheme(null);
    setThemeMode('customize');
    flash(true, `${t.name} applied — customize it below, then Save Theme to publish.`);
  };

  // Clicking a gallery card or "Use Theme" just requests a confirmation
  // first — nothing is ever replaced silently, since this does overwrite
  // whatever the seller had customized.
  const [pendingApplyTheme, setPendingApplyTheme] = useState<ThemeDefinition | null>(null);

  const handleSaveHeader = async () => {
    if (!headerDraft) return;
    setSaving(true);
    try {
      const res = await apiUpdateStoreHeader(storeId, headerDraft);
      setTheme(res.data);
      setHeaderDraft(res.data.header);
      flash(true, 'Header saved');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to save header.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFooter = async () => {
    if (!footerDraft) return;
    setSaving(true);
    try {
      const res = await apiUpdateStoreFooter(storeId, footerDraft.blocks);
      setTheme(res.data);
      setFooterDraft(res.data.footer);
      flash(true, 'Footer saved');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to save footer.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIdentity = async () => {
    if (!identityDraft) return;
    setSaving(true);
    try {
      const res = await apiUpdateIdentityBanner(storeId, identityDraft);
      setTheme(res.data);
      setIdentityDraft(res.data.identityBanner);
      flash(true, 'Store info saved');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

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
            <SaveStatus message={message} />
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

      {/* No embedded live-preview column anywhere in this page any more —
          "View Live Store" above opens the real thing in its own tab
          instead, and the Theme Gallery's "Preview" opens a specific theme
          the same way (`ThemePreviewPage`). Every tab is a single, full-width
          editor column now. */}
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
                      <SaveButton onClick={handleSaveSections} saving={saving} label="Save Changes" />
                    </div>
                  </div>
                  <PageSectionsEditor sections={sections} onChange={setSections} onPersist={persistSections} pageOptions={pageOptions} />
                </>
              ) : (
                <div className="bg-white border border-bone rounded-2xl p-10 text-center">
                  <p className="text-[13px] text-slate">Select or create a page to start editing.</p>
                </div>
              )}
            </div>
          </>
        ) : tab === 'blog' ? (
          <BlogTab storeId={storeId} />
        ) : (
          <div className="bg-white border border-bone rounded-2xl p-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
            {themeLoading || !themeDraft || !headerDraft || !footerDraft || !identityDraft ? <SkeletonBox height={200} rounded="8px" /> : (
              <div className="flex flex-col gap-5">
                {tab === 'theme'     && (
                  <ThemeTab
                    storeId={storeId}
                    value={themeDraft}
                    onChange={setThemeDraft}
                    baseThemeId={baseThemeIdDraft}
                    onApplyTheme={setPendingApplyTheme}
                    headerStyle={headerDraft?.headerStyle ?? 'standard'}
                    footerStyle={footerDraft?.footerStyle ?? 'columns'}
                    storeHint={{ sellerType: store.sellerType, productTypes: store.productTypes }}
                    mode={themeMode}
                    onModeChange={setThemeMode}
                  />
                )}
                {tab === 'header'    && <HeaderTab    value={headerDraft}   onChange={setHeaderDraft} onPersist={persistHeader} pageOptions={pageOptions} />}
                {tab === 'footer'    && <FooterTab    value={footerDraft}   onChange={setFooterDraft} onPersist={persistFooter} pageOptions={pageOptions} />}
                {tab === 'storeInfo' && <StoreInfoTab value={identityDraft} onChange={setIdentityDraft} />}
                <SaveButton
                  onClick={tab === 'theme' ? handleSaveTheme : tab === 'header' ? handleSaveHeader : tab === 'footer' ? handleSaveFooter : handleSaveIdentity}
                  saving={saving}
                  label={`Save ${TABS.find(t => t.id === tab)?.label}`}
                />
              </div>
            )}
          </div>
        )}
      </div>

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
