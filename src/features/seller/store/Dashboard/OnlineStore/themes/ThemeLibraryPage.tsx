import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Settings2, Trash2, Code2 } from 'lucide-react';
import { Toggle } from '@/components/comman/ui';
import { useToast } from '@/contexts/ToastContext';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { SkeletonBox } from '@/components/comman/ui';
import {
  apiListInstalledThemes, apiInstallTheme, apiActivateTheme, apiUninstallTheme,
  type StoreThemeData,
} from '@/api/services/storeTheme';
import { apiListStorePages, apiUpdateStorePageSections } from '@/api/services/storePages';
import { apiUpdateCollectionTemplateSections } from '@/api/services/collectionTemplate';
import type { Section } from '@/api/services/storefrontTypes';
import { THEMES, THEME_TEMPLATES, type ThemeDefinition, type ThemeCategory } from '../builder/themes';
import { ThemeCard } from '../builder/ThemeCard';
import { ThemeFilters } from '../builder/ThemeFilters';
import { ConfirmDialog } from '../builder/ConfirmDialog';
import { themeTemplateToSections } from '../builder/themeTemplateToSections';

/**
 * The Theme Library — its own dedicated product surface (route:
 * `online-store/themes`), separate from Customize and Edit Code (see
 * `CustomizerPage.tsx`/`CodeEditorPage.tsx`). Browse every theme PACKAGE
 * (`builder/themes/<id>/`, a code-shipped `ThemeDefinition` — see that
 * directory's module comment for why theme source lives in code, not the
 * database), install one as a new configurable instance on this store,
 * switch which installed instance is ACTIVE, or remove an unused one.
 *
 * "Installed" vs. "Active" (Theme Definition ⟷ Installed Theme Instance):
 * installing a theme seeds a new row (`StoreThemeData`) from that
 * definition's own default bundle — a real, independent configuration a
 * seller can review before committing to it. Activating swaps which single
 * installed row the public storefront renders; a store always has exactly
 * one active theme. `Customize`/`Edit Code` currently only operate on the
 * ACTIVE installed theme (see those pages) — customizing a non-active
 * installed theme before activating it is a disclosed follow-up, not yet
 * wired end to end.
 */
export function ThemeLibraryPage() {
  const { storeId, loading: storeLoading } = useStoreWorkspace();
  const toast = useToast();

  const [installed, setInstalled] = useState<StoreThemeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<ThemeCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [pendingActivate, setPendingActivate] = useState<StoreThemeData | null>(null);
  const [pendingUninstall, setPendingUninstall] = useState<StoreThemeData | null>(null);
  const [busyRowId, setBusyRowId] = useState<string | null>(null);
  // Real content-seeding, not just colors — see `themeTemplateToSections`.
  // Off by default: a seller who's already customized their Home/Collection/
  // Product content must opt IN to replacing it, never have it silently
  // overwritten by switching themes. One toggle covers all three surfaces —
  // they're seeded together (or not at all), matching a real theme
  // "install" giving you its complete starter content, not a partial mix.
  const [applyStarterContent, setApplyStarterContent] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiListInstalledThemes(storeId).then((res) => setInstalled(res.data)).finally(() => setLoading(false));
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const installedByDefinitionId = useMemo(
    () => new Map(installed.map((row) => [row.themeDefinitionId, row])),
    [installed],
  );
  const activeRow = installed.find((row) => row.status === 'active') ?? null;
  const activeThemeName = THEMES.find((t) => t.id === activeRow?.themeDefinitionId)?.name;

  const filtered = THEMES.filter((t) => {
    if (category !== 'all' && t.category !== category) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const installedDefinitions = filtered.filter((t) => installedByDefinitionId.has(t.id));
  const discoverDefinitions = filtered.filter((t) => !installedByDefinitionId.has(t.id));

  const handleInstall = async (def: ThemeDefinition) => {
    setInstallingId(def.id);
    try {
      await apiInstallTheme(storeId, {
        themeDefinitionId: def.id,
        theme: def.colors,
        header: { headerStyle: def.headerStyle },
        footer: { footerStyle: def.footerStyle },
      });
      toast.success(`${def.name} installed — activate it to make it live, or customize it first.`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to install theme.');
    } finally {
      setInstallingId(null);
    }
  };

  const handleActivate = async () => {
    if (!pendingActivate) return;
    setBusyRowId(pendingActivate._id);
    try {
      await apiActivateTheme(storeId, pendingActivate._id);

      // Real content-seeding: writes the theme's own `templates.{home,
      // collection,product}` onto the corresponding store content's DRAFT
      // (never live) — the seller still reviews and explicitly publishes
      // from Pages/Customize, same as any other draft edit. Best-effort per
      // surface: a failure on one doesn't undo the activation (already
      // succeeded) or block the other two — each surfaces its own toast.
      if (applyStarterContent) {
        const def = THEMES.find((t) => t.id === pendingActivate.themeDefinitionId);
        const templates = def ? THEME_TEMPLATES[def.id] : undefined;

        if (templates?.home?.length) {
          try {
            const pages = await apiListStorePages(storeId);
            const home = pages.data.find((p) => p.type === 'home');
            if (home) {
              await apiUpdateStorePageSections(storeId, home._id, themeTemplateToSections(templates.home));
              toast.success('Home page starter content applied to your draft — review it on the Pages page, then Publish.');
            }
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Theme activated, but applying its starter home content failed.');
          }
        }

        // Collection Template: the `collection_product_grid` section is
        // structural (always renders whichever collection a buyer is
        // currently browsing) — a theme's own template content is
        // supplementary, seeded AFTER it, never replacing it. Without this
        // anchor a seeded collection page would show no products at all.
        if (templates?.collection?.length) {
          try {
            const gridAnchor: Section = { type: 'collection_product_grid', settings: { columns: 3, showFilters: true }, blocks: [] };
            const sections = [gridAnchor, ...themeTemplateToSections(templates.collection)];
            await apiUpdateCollectionTemplateSections(storeId, sections, 'collection', 'default');
            toast.success('Collection page starter content applied to your draft — review it on the Customize page, then Publish.');
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Theme activated, but applying its starter collection content failed.');
          }
        }

        // Product Template: no structural anchor needed — the commerce-
        // critical gallery/variant/add-to-cart core is fixed chrome outside
        // this section system entirely (see StorefrontProductPage), so the
        // theme's own content is the WHOLE seeded array.
        if (templates?.product?.length) {
          try {
            await apiUpdateCollectionTemplateSections(storeId, themeTemplateToSections(templates.product), 'product', 'default');
            toast.success('Product page starter content applied to your draft — review it on the Customize page, then Publish.');
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Theme activated, but applying its starter product content failed.');
          }
        }
      }

      toast.success('Theme activated — your storefront now uses it.');
      setPendingActivate(null);
      setApplyStarterContent(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to activate theme.');
    } finally {
      setBusyRowId(null);
    }
  };

  const handleUninstall = async () => {
    if (!pendingUninstall) return;
    setBusyRowId(pendingUninstall._id);
    try {
      await apiUninstallTheme(storeId, pendingUninstall._id);
      toast.success('Theme removed.');
      setPendingUninstall(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove theme.');
    } finally {
      setBusyRowId(null);
    }
  };

  if (storeLoading) {
    return (
      <div className="p-7 flex flex-col gap-4">
        <SkeletonBox width={240} height={22} rounded="6px" />
        <SkeletonBox height={200} rounded="16px" />
      </div>
    );
  }

  return (
    <div className="bg-[#FAF9F5] min-h-full">
      <StorePageHeader
        title="Themes"
        subtitle={activeThemeName ? `Active theme: ${activeThemeName} — browse, install, and switch between complete storefront themes.` : 'Browse, install, and switch between complete storefront themes.'}
      />

      <div className="px-4 lg:px-7 py-5 flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <h2 className="text-[14px] font-bold text-charcoal">Installed on this store</h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0, 1].map((i) => <SkeletonBox key={i} height={260} rounded="16px" />)}
            </div>
          ) : installedDefinitions.length === 0 ? (
            <p className="text-[12.5px] text-slate">No installed themes match your filters.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {installedDefinitions.map((def) => {
                const row = installedByDefinitionId.get(def.id)!;
                const isActive = row.status === 'active';
                return (
                  <div key={def.id} className="flex flex-col gap-2">
                    <ThemeCard
                      theme={def}
                      active={isActive}
                      onApply={() => { if (!isActive) setPendingActivate(row); }}
                      onPreview={() => window.open(`/store/${storeId}/theme-preview/${def.id}`, '_blank')}
                    />
                    <div className="flex items-center gap-2 px-1">
                      {isActive ? (
                        <>
                          <Link to={`/store/${storeId}/online-store/customize`} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-[7px] rounded-lg text-[12px] font-semibold border border-bone bg-white text-charcoal hover:bg-cream no-underline">
                            <Settings2 size={13} /> Customize
                          </Link>
                          <Link to={`/store/${storeId}/online-store/code`} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-[7px] rounded-lg text-[12px] font-semibold border border-bone bg-white text-charcoal hover:bg-cream no-underline">
                            <Code2 size={13} /> Edit Code
                          </Link>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPendingUninstall(row)}
                          className="flex items-center justify-center gap-1.5 px-3 py-[7px] rounded-lg text-[12px] font-semibold border border-bone bg-white text-error hover:bg-error-bg cursor-pointer"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            <h2 className="text-[14px] font-bold text-charcoal">Discover more themes</h2>
            <ThemeFilters category={category} onCategoryChange={setCategory} search={search} onSearchChange={setSearch} />
          </div>
          {discoverDefinitions.length === 0 ? (
            <p className="text-[12.5px] text-slate">No more themes match your filters.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {discoverDefinitions.map((def) => (
                <div key={def.id} className="flex flex-col gap-2">
                  <ThemeCard
                    theme={def}
                    active={false}
                    onApply={() => handleInstall(def)}
                    onPreview={() => window.open(`/store/${storeId}/theme-preview/${def.id}`, '_blank')}
                    actionLabel="Install"
                  />
                  <button
                    type="button"
                    onClick={() => handleInstall(def)}
                    disabled={installingId === def.id}
                    className="flex items-center justify-center gap-1.5 px-3 py-[8px] rounded-lg text-[12.5px] font-bold text-white border-none cursor-pointer disabled:opacity-60"
                    style={{ background: '#D97757' }}
                  >
                    {installingId === def.id ? <Loader2 size={13} className="animate-spin" /> : null} Install
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {pendingActivate && (
        <ConfirmDialog
          title={`Activate ${THEMES.find((t) => t.id === pendingActivate.themeDefinitionId)?.name ?? 'this theme'}?`}
          message="Your storefront will immediately switch to this theme's published configuration. Your current active theme stays installed and can be reactivated any time."
          confirmLabel="Activate"
          confirmVariant="primary"
          loading={busyRowId === pendingActivate._id}
          onCancel={() => { setPendingActivate(null); setApplyStarterContent(false); }}
          onConfirm={handleActivate}
        >
          {(() => {
            const t = THEME_TEMPLATES[pendingActivate.themeDefinitionId ?? ''];
            const hasStarterContent = !!(t?.home?.length || t?.collection?.length || t?.product?.length);
            if (!hasStarterContent) return null;
            return (
              <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-bone">
                <span className="text-[12.5px] text-charcoal">Also apply this theme's starter content — Home, Collection, and Product pages (replaces those drafts — review before publishing)</span>
                <Toggle checked={applyStarterContent} onChange={setApplyStarterContent} ariaLabel="Also apply starter content" />
              </div>
            );
          })()}
        </ConfirmDialog>
      )}
      {pendingUninstall && (
        <ConfirmDialog
          title="Remove this theme?"
          message="This installed theme and its saved configuration will be permanently deleted. This cannot be undone."
          confirmLabel="Remove"
          loading={busyRowId === pendingUninstall._id}
          onCancel={() => setPendingUninstall(null)}
          onConfirm={handleUninstall}
        />
      )}
    </div>
  );
}
