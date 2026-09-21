import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, RotateCcw, Undo2, Redo2, History, Monitor, Tablet, Smartphone, Plus, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/contexts/ToastContext';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { SkeletonBox } from '@/components/comman/ui';
import { EditorTopBar, PreviewButton } from '../builder/EditorTopBar';
import { ScopePicker, ResourcePicker } from '../builder/ScopePicker';
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
import {
  apiListBlogs, apiListBlogPosts, apiGetBlogPost,
  type BlogData, type BlogPostData,
} from '@/api/services/storeBlog';
import { apiListAppCatalog, type AppCatalogEntry } from '@/api/services/apps';
import { apiGetPublicMetafieldValues, type MetafieldOwnerResource } from '@/api/services/metafields';
import { apiGetStoreInventory } from '@/api/services/product';
import { apiListCollections } from '@/api/services/collections';
import type { Section, SectionType, CoreSectionPreviewContext } from '@/api/services/storefrontTypes';
import type { VersionRow } from '../builder/VersionHistoryModal';
import { PageSectionsEditor } from '../builder/PageSectionsEditor';
import { VersionHistoryModal } from '../builder/VersionHistoryModal';
import { useEditorState } from '../builder/editor/useEditorState';
import { useUndoRedoShortcuts } from '../builder/editor/useUndoRedoShortcuts';
import { AtelierLivePreview } from './AtelierLivePreview';
import { AtelierThemeSettingsPanel } from './AtelierThemeSettingsPanel';
import { apiGetStoreTheme, type StoreThemeData } from '@/api/services/storeTheme';
import { useResolvedThemeInstance } from '../builder/useResolvedThemeInstance';
import { getThemePreviewComponents } from '@/features/storefront-themes/themePreviewComponents';
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
type ResourceConfig = { resourceType: ResourceTemplateType; templateKey: string; allowAltTemplates: boolean; previewPicker?: 'blog' | 'article' };

// Fixed platform brand color — same literal `ThemeLibraryPage.tsx` uses for
// its own Install button. Admin-chrome controls (Save Draft/Publish here,
// same reasoning as every other seller-dashboard button) intentionally use
// the PLATFORM's own brand color, not the active theme's accent — an admin
// screen isn't the merchant's storefront, so it shouldn't visually change
// depending on which theme happens to be active (this was ALSO a real,
// if purely cosmetic, per-theme-hardcoding bug before this pass: it read
// Atelier's static accent color unconditionally, regardless of which theme
// was actually active on the store being edited).
const ADMIN_ACCENT = '#D97757';

// Phase 4 — explains the locked "core content" card these 5 scopes now
// always seed (Main Product / Search Results / Cart Contents+Summary /
// Blog Posts / Article Content), instead of leaving a merchant to wonder
// why a section they can't delete is sitting in what used to look like an
// empty list. `undefined` for every other scope (Home, Collection, theme) —
// `PageSectionsEditor` simply shows no banner then, unchanged from before.
const SCOPE_HELPER_TEXT: Record<string, string> = {
  pages: 'Pick which of your pages to edit above. A page only supports Rich Text sections — matches exactly what renders on your live storefront.',
  product: 'This product\'s page always shows its media, title, price, variant picker, quantity and buy buttons — the locked "Main Product" card below. Hide or reorder its individual items there, or add more sections to customize what surrounds it.',
  search: 'The Search page always shows its live results grid — the locked "Search Results" card below. Add sections to customize what surrounds it.',
  cart: 'The Cart page always shows its line items and summary/checkout button — the two locked cards below. Add sections to customize what surrounds them.',
  blogIndex: 'The Blog index always shows your list of posts — the locked "Blog Posts" card below. Add sections to customize what surrounds it.',
  blogArticle: 'Every article always shows its title and body — the locked "Article Content" card below. Add sections to customize what surrounds it.',
};

function SaveButton({ onClick, saving, label }: { onClick: () => void; saving: boolean; label: string }) {
  return (
    <button
      onClick={onClick} disabled={saving}
      className="flex items-center gap-1.5 px-5 py-[9px] rounded-[10px] text-[13px] font-bold text-white border-none cursor-pointer transition-opacity disabled:opacity-60"
      style={{ background: ADMIN_ACCENT }}
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

  // Fix for a confirmed P0: resolves the URL's `:themeId` to THIS theme's own
  // installed row so every load/save/publish/discard/version call below acts
  // on the selected theme, never silently on whatever's currently active.
  const themeInstance = useResolvedThemeInstance(storeId);
  const installedThemeId = themeInstance.status === 'ready' ? themeInstance.installedThemeId : undefined;

  const [scope, setScope] = useState<string>('home');
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [discarding, setDiscarding] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);

  // Home AND every real custom Page (Phase 5) are `StorePage` documents —
  // `pages` holds ALL of them from one `apiListStorePages` call; `homePage`/
  // `customPages`/`currentStorePage` below just slice that one list.
  // Every other scope is a real CollectionTemplate row (see `config`,
  // derived below from the active theme's manifest).
  const [pages, setPages] = useState<StorePageData[]>([]);
  // Which real custom page is being edited while `scope === 'pages'` —
  // irrelevant (and untouched) for every other scope. Persists across a
  // scope switch, same convention as `templateKey` below, so coming back to
  // Pages remembers what the seller was last working on.
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [templateList, setTemplateList] = useState<CollectionTemplateData[]>([]);
  const [templateKey, setTemplateKey] = useState('default');
  const [activeTemplate, setActiveTemplate] = useState<CollectionTemplateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [draftTheme, setDraftTheme] = useState<StoreThemeData | null>(null);

  // Phase 5 — Blogs/Articles never change WHICH document the Blog-Index/
  // Blog-Article template edits (still the one shared `activeTemplate` per
  // theme, exactly as Phase 4 built it); a real selected Blog/Article only
  // changes what real data the live preview shows alongside it (see
  // `previewContext` below). `posts` is every real post across every blog —
  // used both as the Article picker's own list and, filtered by
  // `selectedBlogId`, as the Blog Index preview's "recent posts" sample.
  const [blogs, setBlogs] = useState<BlogData[]>([]);
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null);
  const [posts, setPosts] = useState<BlogPostData[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [selectedArticleDetail, setSelectedArticleDetail] = useState<BlogPostData | null>(null);

  // Phase 9 — Dynamic Sources: Product/Collection Template each need a real
  // picked resource too (previously neither had one at all — Product/
  // Collection Template only ever rendered against synthetic/no data).
  // Same "loaded once, lazily, the first time this scope is visited" and
  // "never overrides a seller's own later pick" conventions as Blogs/
  // Articles above — a capped, un-paginated fetch (same
  // `PRODUCTS_FETCH_LIMIT` precedent `EntityPickerModal` already uses), not
  // a new backend endpoint.
  const [products, setProducts] = useState<{ id: string; label: string }[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [collectionsList, setCollectionsList] = useState<{ id: string; label: string }[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [dynamicSourceValues, setDynamicSourceValues] = useState<Record<string, string>>({});

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
  // `store-page` scopes (Home, and Phase 5's Pages) use the `StorePage` API
  // family below; everything else (including the `theme` sentinel, which
  // has no `activeScopeDef`) uses the `CollectionTemplate` family.
  const isStorePage = activeScopeDef?.resource.kind === 'store-page';
  const isCustomPageScope = activeScopeDef?.resource.kind === 'store-page' && activeScopeDef.resource.pageType === 'custom';
  const config: ResourceConfig | null = activeScopeDef && activeScopeDef.resource.kind === 'collection-template'
    ? { resourceType: activeScopeDef.resource.resourceType, templateKey: activeScopeDef.resource.templateKey, allowAltTemplates: activeScopeDef.resource.allowAltTemplates, previewPicker: activeScopeDef.resource.previewPicker }
    : null;
  const scopeLabel = (s: string) => (s === 'theme' ? 'Theme Settings' : scopeDefsById[s]?.label ?? s);
  // Phase 5 — real derived lists/booleans for the Pages/Blogs/Articles
  // resource pickers and their empty states.
  const homePage = pages.find(p => p.type === 'home') ?? null;
  const customPages = useMemo(() => pages.filter(p => p.type === 'custom'), [pages]);
  const currentStorePage = isCustomPageScope ? customPages.find(p => p._id === selectedPageId) ?? null : homePage;
  const needsBlogPicker = config?.previewPicker === 'blog';
  const needsArticlePicker = config?.previewPicker === 'article';
  // Phase 9 — a real picked Product/Collection is needed for BOTH the live
  // preview (Dynamic Sources resolution) AND, going forward, any other
  // per-instance preview data this template might want — `resourceType`
  // alone (not `previewPicker`, which only Blog/Article scopes set) is
  // enough to tell these two scopes apart from every other one.
  const needsProductPicker = config?.resourceType === 'product';
  const needsCollectionPicker = config?.resourceType === 'collection';
  const pagesEmpty = isCustomPageScope && customPages.length === 0;
  const blogsEmpty = needsBlogPicker && blogs.length === 0;
  const articlesEmpty = needsArticlePicker && posts.length === 0;
  // Deliberately NOT gating on "0 products"/"0 collections" the way Pages/
  // Blogs/Articles gate on being empty — Product/Collection Template is a
  // real SHARED template (editable and useful even before the store's
  // first product/collection exists, exactly as it already was before this
  // phase); Dynamic Sources simply has nothing to resolve against yet, the
  // same as a fresh store with no metafield definitions.
  const emptyResourceState = pagesEmpty || blogsEmpty || articlesEmpty;
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

  useEffect(() => {
    if (themeInstance.status !== 'ready') return;
    apiGetStoreTheme(storeId, themeInstance.installedThemeId).then(res => setDraftTheme(res.data)).catch(() => {});
  }, [storeId, themeInstance.status, installedThemeId]);

  // Phase 8 — this store's real installed apps (+ every catalog app's
  // block definitions, needed to render an installed one's settings form),
  // fetched once and passed straight through to `PageSectionsEditor`'s own
  // "+ Add block" picker for whichever scope/section actually supports
  // them. A fetch failure just means "no app blocks offered this session"
  // — never a hard error for a feature most sections don't even use.
  const [installedApps, setInstalledApps] = useState<AppCatalogEntry[]>([]);
  useEffect(() => { apiListAppCatalog(storeId).then(res => setInstalledApps(res.data)).catch(() => setInstalledApps([])); }, [storeId]);

  const loadPages = useCallback(() => {
    setLoading(true);
    apiListStorePages(storeId)
      .then(res => {
        setPages(res.data);
        // Default to the first real custom page the first time this scope
        // is visited — never overrides a seller's own later pick.
        setSelectedPageId(prev => prev ?? res.data.find(p => p.type === 'custom')?._id ?? null);
      })
      .finally(() => setLoading(false));
  }, [storeId]);

  // Phase 5 — loaded once, lazily, the first time either Blog-Index or
  // Blog-Article's scope is visited (both reuse the same real blogs/posts
  // lists for their resource pickers). Never re-fetched on every scope
  // switch between the two.
  const loadBlogsAndPosts = useCallback(() => {
    setLoading(true);
    Promise.all([apiListBlogs(storeId), apiListBlogPosts(storeId)])
      .then(([blogsRes, postsRes]) => {
        setBlogs(blogsRes.data);
        setPosts(postsRes.data);
        setSelectedBlogId(prev => prev ?? blogsRes.data[0]?._id ?? null);
        setSelectedArticleId(prev => prev ?? postsRes.data[0]?._id ?? null);
      })
      .finally(() => setLoading(false));
  }, [storeId]);

  // Phase 9 — same lazy-load-once convention as `loadBlogsAndPosts`.
  const loadProducts = useCallback(() => {
    apiGetStoreInventory(storeId, 1, 200)
      .then(res => {
        const items = res.data.products.map(p => ({ id: p.productId, label: p.name }));
        setProducts(items);
        setSelectedProductId(prev => prev ?? items[0]?.id ?? null);
      })
      .catch(() => setProducts([]));
  }, [storeId]);

  const loadCollectionsList = useCallback(() => {
    apiListCollections(storeId)
      .then(res => {
        const items = res.data.map(c => ({ id: c._id, label: c.name }));
        setCollectionsList(items);
        setSelectedCollectionId(prev => prev ?? items[0]?.id ?? null);
      })
      .catch(() => setCollectionsList([]));
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
    if (isStorePage) { loadPages(); return; }
    if (!config) return; // scope not (yet) resolvable against the manifest — nothing to load
    if (config.previewPicker) loadBlogsAndPosts();
    if (config.resourceType === 'product') loadProducts();
    if (config.resourceType === 'collection') loadCollectionsList();
    setTemplateKey(config.templateKey);
    loadResourceTemplates(config.resourceType, config.templateKey, config.allowAltTemplates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  // Fetches the REAL selected article's title/excerpt for the live preview
  // (see `previewContext` below) — only while on the Blog-Article scope
  // with a real post actually picked.
  useEffect(() => {
    if (!needsArticlePicker || !selectedArticleId) { setSelectedArticleDetail(null); return; }
    apiGetBlogPost(storeId, selectedArticleId).then(res => setSelectedArticleDetail(res.data)).catch(() => setSelectedArticleDetail(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsArticlePicker, selectedArticleId, storeId]);

  // Phase 9 — Dynamic Sources: which real resource type/id (if any) the
  // CURRENT scope represents (see `MetafieldKeyPickerField`'s own doc
  // comment for the full picture). `null` for every scope with no single
  // real resource — Home, Search, Cart, Blog Index, and the Theme sentinel.
  const dynamicSourceOwnerResource: MetafieldOwnerResource | null = isCustomPageScope
    ? 'page'
    : needsProductPicker ? 'product'
    : needsCollectionPicker ? 'collection'
    : needsArticlePicker ? 'article'
    : null;
  const dynamicSourceOwnerId: string | null = isCustomPageScope
    ? selectedPageId
    : needsProductPicker ? selectedProductId
    : needsCollectionPicker ? selectedCollectionId
    : needsArticlePicker ? selectedArticleId
    : null;

  // Real metafield values for whichever resource is picked, resolved
  // exactly the way the real storefront already does (`AtelierProductPage.
  // tsx`) — this is what makes the seller's own live preview (below) show a
  // bound paragraph/heading's ACTUAL value instead of always falling back
  // to blank/static, closing the gap this phase's own research found.
  useEffect(() => {
    if (!dynamicSourceOwnerResource || !dynamicSourceOwnerId) { setDynamicSourceValues({}); return; }
    let cancelled = false;
    apiGetPublicMetafieldValues(storeId, dynamicSourceOwnerResource, dynamicSourceOwnerId)
      .then(res => { if (!cancelled) setDynamicSourceValues(Object.fromEntries(res.data.map(v => [`${v.namespace}:${v.key}`, v.value]))); })
      .catch(() => { if (!cancelled) setDynamicSourceValues({}); });
    return () => { cancelled = true; };
  }, [storeId, dynamicSourceOwnerResource, dynamicSourceOwnerId]);

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
      if (!currentStorePage) return;
      loadEditor(currentStorePage.sections, currentStorePage.draft?.sections ?? currentStorePage.sections);
    } else {
      if (!activeTemplate) return;
      loadEditor(activeTemplate.sections, activeTemplate.draft?.sections ?? activeTemplate.sections);
    }
  }, [scope, currentStorePage?._id, activeTemplate?._id, activeTemplate?.templateKey, loadEditor]);

  const busy = editor.phase === 'saving' || editor.phase === 'publishing' || discarding;

  const handleSave = async () => {
    if (!editor.workingCopy) return;
    editor.markSaving();
    try {
      if (isStorePage) {
        if (!currentStorePage) return;
        const res = await apiUpdateStorePageSections(storeId, currentStorePage._id, editor.workingCopy);
        setPages(prev => prev.map(p => p._id === res.data._id ? res.data : p));
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
    // Real bug found in Phase 11 QA: `onChange(next)` (the caller's own
    // optimistic local update) already ran by the time this fires — this
    // function's closure still holds the PRE-change `editor.workingCopy`
    // (React hasn't re-rendered yet), which is exactly what a failed
    // persist needs to roll back to. Without this, a removal the server
    // rejects (e.g. a sibling block left with an invalid required field)
    // stayed "removed" in the editor while the real saved draft never
    // changed — a real, confusing local/server divergence, not just a
    // missed toast.
    const rollbackTo = editor.workingCopy;
    try {
      if (isStorePage) {
        if (!currentStorePage) return;
        const res = await apiUpdateStorePageSections(storeId, currentStorePage._id, next);
        setPages(prev => prev.map(p => p._id === res.data._id ? res.data : p));
        editor.markSaved(res.data.draft.sections);
      } else {
        const res = await apiUpdateCollectionTemplateSections(storeId, next, config!.resourceType, templateKey);
        setActiveTemplate(res.data);
        editor.markSaved(res.data.draft.sections);
      }
    } catch (err) {
      if (rollbackTo) editor.discardDraft(rollbackTo);
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
          if (!currentStorePage) return;
          await apiUpdateStorePageSections(storeId, currentStorePage._id, editor.workingCopy);
        } else {
          await apiUpdateCollectionTemplateSections(storeId, editor.workingCopy, config!.resourceType, templateKey);
        }
      }
      if (isStorePage) {
        if (!currentStorePage) return;
        const res = await apiPublishStorePage(storeId, currentStorePage._id);
        setPages(prev => prev.map(p => p._id === res.data._id ? res.data : p));
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
        if (!currentStorePage) return;
        const res = await apiRevertStorePageDraft(storeId, currentStorePage._id);
        setPages(prev => prev.map(p => p._id === res.data._id ? res.data : p));
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
      ? (currentStorePage ? apiListStorePageVersions(storeId, currentStorePage._id) : Promise.resolve({ data: [] as VersionRow[] }))
      : apiListCollectionTemplateVersions(storeId, config!.resourceType, templateKey);
    req.then(res => setVersions(res.data)).catch(() => setVersions([])).finally(() => setVersionsLoading(false));
  };

  const restoreVersion = async (versionId: string) => {
    setRestoringVersionId(versionId);
    try {
      if (isStorePage) {
        if (!currentStorePage) return;
        const res = await apiRestoreStorePageVersion(storeId, currentStorePage._id, versionId);
        setPages(prev => prev.map(p => p._id === res.data._id ? res.data : p));
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

  if (storeLoading || themeInstance.status === 'loading' || loading) {
    return (
      <div className="p-7 flex flex-col gap-4">
        <SkeletonBox width={240} height={22} rounded="6px" />
        <SkeletonBox height={400} rounded="16px" />
      </div>
    );
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

  // For a custom-page scope with no pages at all, or a blog/article scope
  // with nothing to pick, `emptyResourceState` (computed above) takes over
  // the render entirely — `docMissing` only ever fires for a genuine load
  // failure now, not "nothing exists yet" (which has its own real empty
  // state below, per Phase 5's requirement 8).
  const docMissing = scope === 'theme' || emptyResourceState ? false : isStorePage ? !currentStorePage : !activeTemplate;
  const effectiveDraftTheme = scope === 'theme' && themeScopePreview ? themeScopePreview : draftTheme;
  // The preview PANEL's own background — resolved against the real active
  // theme (not hardcoded to Atelier) so the frame around the embedded
  // storefront preview matches whichever theme is actually being edited,
  // instead of showing Atelier's background color behind a Nova preview.
  const previewPanelBg = getThemePreviewComponents(effectiveDraftTheme?.themeDefinitionId, DEFAULT_THEME_ID).theme.colors.bg;
  // The real active theme's own registered section types — NOT
  // `effectiveDraftTheme` (which briefly swaps to a theme-settings-only
  // preview while scope === 'theme'), since "which sections can I add" is a
  // property of the store's actual theme, unrelated to which scope's colors
  // are being previewed right now. See `AddSectionModal`'s own doc comment
  // for the bug this closes (Nova could "add" Video/Drop Countdown and have
  // them silently render as nothing).
  const supportedSectionTypes = getThemePreviewComponents(draftTheme?.themeDefinitionId, DEFAULT_THEME_ID).supportedSectionTypes;
  // A custom Page only ever renders its `rich_text` sections on the real
  // storefront (`AtelierCustomPage`/`NovaCustomPage`) — same restriction
  // `PagesPage.tsx`'s own picker already enforces; Customize's "Add a
  // Section" picker for a Page must match, or a seller could add a section
  // here that silently renders as nothing on the live page.
  const effectiveSupportedSectionTypes: SectionType[] | undefined = isCustomPageScope ? (['rich_text'] as SectionType[]) : supportedSectionTypes;

  // Phase 5 — real data for whichever Blog/Article is currently picked,
  // fed into the live preview's `blog_post_list`/`article_content` core
  // sections (see `CoreSectionPreviewContext`). `undefined` for every other
  // scope, or before anything's loaded/picked yet.
  const previewContext: CoreSectionPreviewContext | undefined = needsBlogPicker
    ? (() => {
        const blog = blogs.find(b => b._id === selectedBlogId);
        if (!blog) return undefined;
        const recentPostTitles = posts.filter(p => p.blogId === blog._id).slice(0, 3).map(p => p.title);
        return { blogName: blog.title, recentPostTitles };
      })()
    : needsArticlePicker && selectedArticleDetail
      ? { articleTitle: selectedArticleDetail.title, articleExcerpt: selectedArticleDetail.excerpt }
      : undefined;

  return (
    <div className="bg-[#FAF9F5] min-h-full">
      <EditorTopBar
        exitTo={`/store/${storeId}/online-store/themes`}
        title={`Customize — ${manifest.name}`}
        subtitle="Edits save to a draft — nothing goes live until you Publish."
      >
        {
          // Two groups: the left one scrolls horizontally on narrow screens
          // (min-w-0 + overflow-x-auto lets it actually shrink instead of
          // pushing the page wide); Save Draft/Publish/Discard stay in their
          // own shrink-0 group so they're always reachable without scrolling,
          // even on a 390px viewport. The whole cluster still wraps beneath
          // the title if there's truly no room for either group at all.
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <PreviewButton storeId={storeId} installedThemeId={installedThemeId} />
            <div className="flex items-center gap-2 overflow-x-auto min-w-0 py-0.5" style={{ scrollbarWidth: 'none' }}>
              <ScopePicker scopeDefs={scopeDefs} scope={scope} onChange={setScope} currentLabel={scopeLabel(scope)} />

              {isCustomPageScope && (
                <ResourcePicker
                  items={customPages.map(p => ({ id: p._id, label: p.title }))}
                  valueId={selectedPageId}
                  onChange={setSelectedPageId}
                  placeholder="Choose a page…"
                />
              )}
              {needsProductPicker && (
                <ResourcePicker
                  items={products}
                  valueId={selectedProductId}
                  onChange={setSelectedProductId}
                  placeholder="Choose a product to preview…"
                />
              )}
              {needsCollectionPicker && (
                <ResourcePicker
                  items={collectionsList}
                  valueId={selectedCollectionId}
                  onChange={setSelectedCollectionId}
                  placeholder="Choose a collection to preview…"
                />
              )}
              {needsBlogPicker && (
                <ResourcePicker
                  items={blogs.map(b => ({ id: b._id, label: b.title }))}
                  valueId={selectedBlogId}
                  onChange={setSelectedBlogId}
                  placeholder="Choose a blog…"
                />
              )}
              {needsArticlePicker && (
                <ResourcePicker
                  items={posts.map(p => ({ id: p._id, label: p.status === 'published' ? p.title : `${p.title} (${p.status})` }))}
                  valueId={selectedArticleId}
                  onChange={setSelectedArticleId}
                  placeholder="Choose an article…"
                />
              )}
              {(isCustomPageScope || needsBlogPicker || needsArticlePicker) && (
                <Link
                  to={`/store/${storeId}/online-store/${isCustomPageScope ? 'pages' : 'blog'}`}
                  target="_blank"
                  className="shrink-0 flex items-center gap-1 text-[12px] font-semibold no-underline whitespace-nowrap"
                  style={{ color: '#D97757' }}
                  title="Opens in a new tab — your unsaved draft here is preserved."
                >
                  Manage {isCustomPageScope ? 'Pages' : 'Blog'} <ExternalLink size={12} />
                </Link>
              )}

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
      </EditorTopBar>

      {scope === 'theme' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-5 px-4 lg:px-7 py-5 items-start">
          <AtelierThemeSettingsPanel storeId={storeId} installedThemeId={installedThemeId} onDraftChange={setThemeScopePreview} />
          <div className="border border-bone rounded-2xl bg-white overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
            <div className="h-full overflow-auto flex justify-center bg-[#F1EDE5] p-4">
              <div style={{ width: DEVICE_WIDTH[device], maxWidth: '100%', background: previewPanelBg, boxShadow: device !== 'desktop' ? '0 0 0 1px #E4DFD3' : undefined, transition: 'width 200ms' }}>
                <AtelierLivePreview sections={[]} showChrome draftTheme={effectiveDraftTheme} />
              </div>
            </div>
          </div>
        </div>
      ) : emptyResourceState ? (
        // Phase 5, requirement 8 — a useful empty state (not a bare "Select
        // or create a page" line), with a real action rather than leaving
        // the merchant stuck inside a fullscreen editor with nothing to do.
        <div className="flex flex-col items-center justify-center gap-3 text-center py-24 px-6">
          <p className="text-[14px] font-bold text-charcoal">
            {pagesEmpty ? 'No pages yet' : blogsEmpty ? 'No blogs yet' : 'No articles yet'}
          </p>
          <p className="text-[12.5px] text-slate max-w-[360px]">
            {pagesEmpty
              ? 'Create your first custom page (About Us, Shipping Policy, …) from the Pages screen, then come back here to pick it.'
              : blogsEmpty
                ? 'Create a blog from the Blog screen, then come back here to preview this template against it.'
                : 'Write your first post from the Blog screen, then come back here to preview this template against it.'}
          </p>
          <Link
            to={`/store/${storeId}/online-store/${pagesEmpty ? 'pages' : 'blog'}`}
            target="_blank"
            className="flex items-center gap-1.5 px-4 py-[9px] mt-1 text-[13px] font-bold rounded-[9px] border-none text-white no-underline cursor-pointer transition-colors"
            style={{ background: '#D97757' }}
          >
            {pagesEmpty ? 'Go to Pages' : 'Go to Blog'} <ExternalLink size={13} />
          </Link>
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
              supportedSectionTypes={effectiveSupportedSectionTypes}
              colorSchemes={draftTheme?.theme.colorSchemes ?? []}
              helperText={SCOPE_HELPER_TEXT[scope]}
              installedApps={installedApps}
              ownerResource={dynamicSourceOwnerResource}
            />
          </div>

          <div className="border border-bone rounded-2xl bg-white overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
            <div className="h-full overflow-auto flex justify-center bg-[#F1EDE5] p-4">
              <div style={{ width: DEVICE_WIDTH[device], maxWidth: '100%', background: previewPanelBg, boxShadow: device !== 'desktop' ? '0 0 0 1px #E4DFD3' : undefined, transition: 'width 200ms' }}>
                <AtelierLivePreview
                  sections={editor.workingCopy ?? []}
                  showChrome={activeScopeDef?.showChrome ?? false}
                  draftTheme={effectiveDraftTheme}
                  interactive
                  selectedSectionId={selectedSectionId}
                  onSelectSection={setSelectedSectionId}
                  previewContext={previewContext}
                  dynamicSourceValues={dynamicSourceValues}
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
