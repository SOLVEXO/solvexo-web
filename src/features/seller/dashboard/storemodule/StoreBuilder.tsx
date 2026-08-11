import { useState, useEffect, useCallback } from 'react';
import { Loader2, Eye, EyeOff, Check, LayoutGrid, Palette, PanelTop, PanelBottom, Newspaper, UserCog, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { SkeletonBox } from '@/components/comman/ui';
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
import { HeaderTab, FooterTab } from './builder/HeaderFooterTabs';
import { StoreInfoTab } from './builder/StoreInfoTab';
import { BuilderPreview } from './builder/BuilderPreview';
import { BlogTab } from './builder/BlogTab';

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
  // The 3-column Pages layout (sidebar + editor + live preview) is the most
  // cramped view in the builder — a seller mid-edit on a laptop-width screen
  // gets squeezed into what's left after two fixed-width columns. Letting
  // them collapse the preview gives the editor its width back on demand,
  // instead of it being permanently fixed at 400px whether they're using it
  // this moment or not.
  const [previewOpen, setPreviewOpen] = useState(true);

  const [pages, setPages] = useState<StorePageData[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [creatingPage, setCreatingPage] = useState(false);

  const [theme, setTheme] = useState<StoreThemeData | null>(null);
  const [themeLoading, setThemeLoading] = useState(true);
  // Local drafts — Theme/Header/Footer/Store Info tabs call `onChange` on
  // every keystroke/toggle for a responsive UI, so they edit these drafts,
  // not the saved `theme` directly; each tab has its own explicit Save
  // button that PATCHes only when clicked (never on every keystroke).
  const [themeDraft, setThemeDraft] = useState<StoreThemeData['theme'] | null>(null);
  const [headerDraft, setHeaderDraft] = useState<StoreThemeData['header'] | null>(null);
  const [footerDraft, setFooterDraft] = useState<StoreThemeData['footer'] | null>(null);
  const [identityDraft, setIdentityDraft] = useState<StoreThemeData['identityBanner'] | null>(null);

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

  const handleDeletePage = async (pageId: string) => {
    if (!confirm('Delete this page? This cannot be undone.')) return;
    await apiDeleteStorePage(storeId, pageId);
    setPages(prev => prev.filter(p => p._id !== pageId));
    if (selectedPageId === pageId) setSelectedPageId(null);
  };

  const handleSaveTheme = async () => {
    if (!themeDraft) return;
    setSaving(true);
    try {
      const res = await apiUpdateStoreThemeColors(storeId, themeDraft);
      setTheme(res.data);
      flash(true, 'Theme saved');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to save theme.');
    } finally {
      setSaving(false);
    }
  };

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
        actions={<SaveStatus message={message} />}
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

      <div className={`px-4 lg:px-7 py-5 grid grid-cols-1 gap-5 items-start ${tab === 'pages' && previewOpen ? 'lg:grid-cols-[280px_1fr_400px]' : 'lg:grid-cols-[280px_1fr]'}`}>
        {tab === 'pages' ? (
          <>
            <div className="bg-white border border-bone rounded-2xl p-3 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
              {pagesLoading ? <SkeletonBox height={160} rounded="8px" /> : (
                <PagesList pages={pages} selectedId={selectedPageId} onSelect={setSelectedPageId} onCreate={handleCreatePage} onDelete={handleDeletePage} creating={creatingPage} />
              )}
            </div>

            <div className="flex flex-col gap-3 min-w-0">
              {selectedPage ? (
                <>
                  <div className="flex items-center justify-between bg-white border border-bone rounded-2xl px-4 py-3 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
                    <div>
                      <h2 className="text-[15px] font-bold text-charcoal">{selectedPage.title}</h2>
                      <p className="text-[11.5px] text-slate mt-[1px]">
                        {selectedPage.status === 'published'
                          ? <span className="text-success font-semibold">● Live on your storefront</span>
                          : <span className="text-slate">○ Draft — not visible to buyers yet</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setPreviewOpen(o => !o)}
                        title={previewOpen ? 'Hide live preview' : 'Show live preview'}
                        className="hidden lg:flex items-center gap-1.5 px-3.5 py-[9px] rounded-[10px] text-[12.5px] font-semibold border border-bone bg-white text-charcoal hover:bg-cream cursor-pointer transition-colors">
                        {previewOpen ? <PanelRightClose size={13} /> : <PanelRightOpen size={13} />} {previewOpen ? 'Hide Preview' : 'Show Preview'}
                      </button>
                      <button onClick={handleTogglePublish} disabled={saving}
                        className="flex items-center gap-1.5 px-3.5 py-[9px] rounded-[10px] text-[12.5px] font-semibold border border-bone bg-white text-charcoal hover:bg-cream cursor-pointer transition-colors disabled:opacity-60">
                        {selectedPage.status === 'published' ? <><EyeOff size={13} /> Unpublish</> : <><Eye size={13} /> Publish</>}
                      </button>
                      <SaveButton onClick={handleSaveSections} saving={saving} label="Save Changes" />
                    </div>
                  </div>
                  <PageSectionsEditor sections={sections} onChange={setSections} pageOptions={pageOptions} />
                </>
              ) : (
                <div className="bg-white border border-bone rounded-2xl p-10 text-center">
                  <p className="text-[13px] text-slate">Select or create a page to start editing.</p>
                </div>
              )}
            </div>

            {previewOpen && (
              <div className="hidden lg:block sticky top-[130px]">
                <BuilderPreview store={store} theme={theme} sections={sections} />
              </div>
            )}
          </>
        ) : tab === 'blog' ? (
          <div className="lg:col-span-3">
            <BlogTab storeId={storeId} />
          </div>
        ) : (
          <div className="lg:col-span-2 bg-white border border-bone rounded-2xl p-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
            {themeLoading || !themeDraft || !headerDraft || !footerDraft || !identityDraft ? <SkeletonBox height={200} rounded="8px" /> : (
              <div className="flex flex-col gap-5">
                {tab === 'theme'     && <ThemeTab     value={themeDraft}    onChange={setThemeDraft} />}
                {tab === 'header'    && <HeaderTab    value={headerDraft}   onChange={setHeaderDraft} pageOptions={pageOptions} />}
                {tab === 'footer'    && <FooterTab    value={footerDraft}   onChange={setFooterDraft} pageOptions={pageOptions} />}
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
    </div>
  );
}
