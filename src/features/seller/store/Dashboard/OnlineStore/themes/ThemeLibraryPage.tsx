import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Trash2, Sparkles, ExternalLink, Settings2, Code2, PanelTop } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { SkeletonBox } from '@/components/comman/ui';
import {
  apiListInstalledThemes, apiInstallTheme, apiActivateTheme, apiUninstallTheme,
  type StoreThemeData,
} from '@/api/services/storeTheme';
import { ConfirmDialog } from '../builder/ConfirmDialog';
import { listNewThemeEntries } from '@/features/storefront-themes/registry';
import { getStorefrontUrl } from '@/utils/storefrontUrl';

/**
 * The Theme Library (route: `online-store/themes`) — browse every
 * independently-implemented storefront theme (`storefront-themes/registry.ts`),
 * install one as a new configurable instance on this store, switch which
 * installed instance is ACTIVE, or remove an unused one.
 *
 * The legacy 12-theme shared-engine system (config-driven themes fed
 * through one shared renderer, plus its own Customize/Edit Code authoring
 * surfaces) has been fully removed — archived under `_legacy-theme-backup/`
 * at the repo root, not reachable from the app. Every theme now installable
 * here is a real, independent storefront implementation.
 *
 * "Installed" vs. "Active": installing a theme seeds a new row
 * (`StoreThemeData`) for that theme id. Activating swaps which single
 * installed row the public storefront renders; a store always has exactly
 * one active theme.
 */
export function ThemeLibraryPage() {
  const { store, storeId, loading: storeLoading } = useStoreWorkspace();
  const toast = useToast();

  const [installed, setInstalled] = useState<StoreThemeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [pendingActivate, setPendingActivate] = useState<StoreThemeData | null>(null);
  const [pendingUninstall, setPendingUninstall] = useState<StoreThemeData | null>(null);
  const [busyRowId, setBusyRowId] = useState<string | null>(null);

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
  const newThemeEntries = listNewThemeEntries();
  const activeThemeName = newThemeEntries.find((t) => t.id === activeRow?.themeDefinitionId)?.name;

  const handleInstallNewTheme = async (id: string, name: string) => {
    setInstallingId(id);
    try {
      await apiInstallTheme(storeId, { themeDefinitionId: id });
      toast.success(`${name} installed — activate it to make it live.`);
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
      toast.success('Theme activated — your storefront now uses it.');
      setPendingActivate(null);
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

  if (storeLoading || loading) {
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
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-brand-orange" />
            <h2 className="text-[14px] font-bold text-charcoal">Storefront themes</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {newThemeEntries.map((entry) => {
              const row = installedByDefinitionId.get(entry.id);
              const isActive = row?.status === 'active';
              const isInstalled = !!row;
              return (
                <div key={entry.id} className="flex flex-col gap-2 bg-white border border-bone rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[14.5px] font-bold text-charcoal">{entry.name}</p>
                    {isActive && <span className="px-2 py-[3px] rounded-full bg-brand-pale-orange text-brand-deep-orange text-[10px] font-bold">ACTIVE</span>}
                  </div>
                  <p className="text-[12px] text-slate leading-snug">{entry.description}</p>
                  <p className="text-[11px] text-slate">
                    In progress — {entry.builtRouteCount} of {entry.totalRouteCount} storefront pages built so far.
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {!isInstalled ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleInstallNewTheme(entry.id, entry.name)}
                          disabled={installingId === entry.id}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-[8px] rounded-lg text-[12.5px] font-bold text-white border-none cursor-pointer disabled:opacity-60"
                          style={{ background: '#D97757' }}
                        >
                          {installingId === entry.id ? <Loader2 size={13} className="animate-spin" /> : null} Install
                        </button>
                        {/* Demo-content preview is currently only wired for
                            Atelier (`AtelierThemeDemoPreview`/`atelier/preview`
                            route) — a theme with no demo preview of its own
                            (e.g. Nova, this pass) simply doesn't get this
                            button, a disclosed gap rather than a broken link.
                            This is the one editor entry point that's
                            legitimately per-theme content, not a generic
                            platform surface — unlike Customize/Header-Footer/
                            Edit Code below, which every installed+active
                            theme can always reach. */}
                        {entry.id === 'theme-01-atelier' && (
                          <Link
                            to="atelier/preview"
                            className="flex items-center justify-center gap-1.5 px-3 py-[7px] rounded-lg text-[12px] font-semibold border border-bone bg-white text-charcoal hover:bg-cream no-underline"
                            title="Preview with demo content"
                          >
                            <ExternalLink size={13} />
                          </Link>
                        )}
                      </>
                    ) : isActive && store ? (
                      <>
                        {/* Customize/Header & Footer/Edit Code all route
                            through the SAME three generic editor pages
                            regardless of which theme is active (each page
                            resolves the active store's real
                            `themeDefinitionId` against `THEME_MANIFESTS`/
                            `THEME_DEV_FILES` internally — see
                            `AtelierCustomizePage`/`AtelierEditCodePage`'s own
                            doc comments). Gating these three links behind
                            `entry.id === 'theme-01-atelier'` was a real bug:
                            it left ANY second installed+active theme with no
                            way to reach its own editor pages from this UI at
                            all — exactly the "hardcoded per-theme editor
                            page" failure this platform's theme-agnostic
                            architecture is required to avoid. These render
                            for any installed+active theme now; only the
                            route's own URL segment still literally reads
                            "atelier" (a cosmetic naming leak — the
                            destination page resolves the real active theme
                            internally regardless — tracked as a lower-
                            priority follow-up, not a functional blocker). */}
                        <Link
                          to="atelier/customize"
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-[7px] rounded-lg text-[12px] font-semibold border-none bg-brand-orange text-white hover:bg-brand-deep-orange no-underline"
                        >
                          <Settings2 size={13} /> Customize
                        </Link>
                        <Link
                          to="atelier/header-footer"
                          className="flex items-center justify-center gap-1.5 px-3 py-[7px] rounded-lg text-[12px] font-semibold border border-bone bg-white text-charcoal hover:bg-cream no-underline"
                          title="Header & Footer"
                        >
                          <PanelTop size={13} />
                        </Link>
                        <Link
                          to="atelier/edit-code"
                          className="flex items-center justify-center gap-1.5 px-3 py-[7px] rounded-lg text-[12px] font-semibold border border-bone bg-white text-charcoal hover:bg-cream no-underline"
                          title="Edit Code"
                        >
                          <Code2 size={13} />
                        </Link>
                        <a
                          href={getStorefrontUrl(store.slug)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 px-3 py-[7px] rounded-lg text-[12px] font-semibold border border-bone bg-white text-charcoal hover:bg-cream no-underline"
                          title="View Live Store"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setPendingActivate(row)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-[7px] rounded-lg text-[12px] font-semibold border-none bg-brand-orange text-white hover:bg-brand-deep-orange cursor-pointer"
                        >
                          Activate
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingUninstall(row)}
                          className="flex items-center justify-center gap-1.5 px-3 py-[7px] rounded-lg text-[12px] font-semibold border border-bone bg-white text-error hover:bg-error-bg cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {pendingActivate && (
        <ConfirmDialog
          title={`Activate ${newThemeEntries.find((t) => t.id === pendingActivate.themeDefinitionId)?.name ?? 'this theme'}?`}
          message="Your storefront will immediately switch to this theme's published configuration. Your current active theme stays installed and can be reactivated any time."
          confirmLabel="Activate"
          confirmVariant="primary"
          loading={busyRowId === pendingActivate._id}
          onCancel={() => setPendingActivate(null)}
          onConfirm={handleActivate}
        />
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
