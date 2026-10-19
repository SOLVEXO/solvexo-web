import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Trash2, Sparkles, ExternalLink, Settings2, PanelTop, Eye, Copy, Link2, Pencil, Check } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { SkeletonBox, Modal, Button } from '@/components/comman/ui';
import {
  apiListInstalledThemes, apiInstallTheme, apiActivateTheme, apiUninstallTheme,
  apiDuplicateTheme, apiRenameTheme, apiCreatePreviewLink, apiRevokePreviewLink,
  type StoreThemeData,
} from '@/api/services/storeTheme';
import { ConfirmDialog } from '../builder/ConfirmDialog';
import { listNewThemeEntries, type ThemeInstallColorDefaults } from '@/features/storefront-themes/registry';
import { getStorefrontUrl } from '@/utils/storefrontUrl';
import { ThemeThumbnail } from './ThemeDemoPreview';
import { ThemeSourcePackageDialog } from '@/features/themes/liquid/ThemeSourcePackageDialog';

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
 *
 * PREVIEW: every theme (installed or not, active or not) can be previewed
 * with that theme's own static demo content, opened in a NEW TAB (a real
 * route — `online-store/themes/:themeId/preview`, matching how Shopify's
 * own theme preview opens) — see `ThemeDemoPreview`/`themeDemoPreview.ts`.
 * This used to render the store's REAL saved section data through a
 * candidate (non-active) theme's own renderer inside an in-page modal —
 * which could look genuinely incomplete, since a theme only ever renders
 * the section types it has actually implemented and silently skips the
 * rest (see `themeDemoPreview.ts`'s doc comment for the full story). Demo
 * content sidesteps that entirely: every theme's own demo sections only
 * ever use section types that theme itself renders, so a preview always
 * looks like a complete, finished theme — for any theme, with zero
 * per-theme code on this page.
 */
/** Mints (or reuses) a real, shareable "see this before it's live" link —
 *  the merchant-facing half of the preview-token backend (see
 *  `PreviewToken`'s schema comment for the scope boundary: theme tokens
 *  only, rendered over demo content, not the seller's real product
 *  catalog). No expiry countdown shown here — the 2-day TTL is documented
 *  inline instead, since re-generating is one click either way. */
function SharePreviewModal({ storeId, row, onClose }: { storeId: string; row: StoreThemeData; onClose: () => void }) {
  const toast = useToast();
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(false);
  const [copied, setCopied] = useState(false);

  const mint = useCallback(() => {
    setLoading(true);
    apiCreatePreviewLink(storeId, row._id)
      .then(res => setLink(`${window.location.origin}/theme-preview/${storeId}/${res.data.token}`))
      .catch(() => toast.error('Could not create a preview link.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, row._id]);

  useEffect(() => { mint(); }, [mint]);

  const handleCopy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async () => {
    setRevoking(true);
    try {
      await apiRevokePreviewLink(storeId, row._id);
      toast.success('Preview link revoked.');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke link.');
    } finally {
      setRevoking(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Share Preview">
      <div className="flex flex-col gap-3">
        <p className="text-[12.5px] text-slate">
          Anyone with this link can see your draft colors, header, and footer — no login needed. Expires in 2 days.
          Shows your real branding over sample content, not your live product catalog.
        </p>
        {loading ? (
          <div className="h-10 bg-cream animate-pulse rounded-lg" />
        ) : link ? (
          <div className="flex items-center gap-2">
            <input readOnly value={link} className="flex-1 px-3 py-2 text-[12.5px] border border-bone rounded-lg text-charcoal bg-cream/40 outline-none" />
            <button type="button" onClick={handleCopy} className="p-2 rounded-lg border border-bone bg-white text-charcoal cursor-pointer">
              {copied ? <Check size={15} className="text-success" /> : <Copy size={15} />}
            </button>
          </div>
        ) : null}
        <div className="flex justify-between items-center mt-2">
          <button type="button" onClick={handleRevoke} disabled={revoking} className="text-[12px] font-semibold text-error bg-transparent border-none cursor-pointer disabled:opacity-60">
            Revoke link
          </button>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}

export function ThemeLibraryPage() {
  const { store, storeId, loading: storeLoading } = useStoreWorkspace();
  const toast = useToast();

  const [installed, setInstalled] = useState<StoreThemeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [pendingActivate, setPendingActivate] = useState<StoreThemeData | null>(null);
  // The Shopify-style theme ZIP workspace, opened for one installed theme.
  const [zipForThemeId, setZipForThemeId] = useState<string | null>(null);
  const [pendingUninstall, setPendingUninstall] = useState<StoreThemeData | null>(null);
  const [busyRowId, setBusyRowId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [sharePreviewRow, setSharePreviewRow] = useState<StoreThemeData | null>(null);

  const [loadError, setLoadError] = useState('');
  const load = useCallback(() => {
    setLoading(true);
    setLoadError('');
    apiListInstalledThemes(storeId)
      .then((res) => setInstalled(res.data))
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Could not load your themes.'))
      .finally(() => setLoading(false));
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const installedByDefinitionId = useMemo(
    () => {
      const byDefinition = new Map<string, StoreThemeData>();
      for (const row of installed) {
        if (!row.themeDefinitionId) continue;
        if (!byDefinition.has(row.themeDefinitionId) || row.status === 'active') byDefinition.set(row.themeDefinitionId, row);
      }
      return byDefinition;
    },
    [installed],
  );
  const activeRow = installed.find((row) => row.status === 'active') ?? null;
  const newThemeEntries = listNewThemeEntries();
  const activeThemeName = newThemeEntries.find((t) => t.id === activeRow?.themeDefinitionId)?.name;

  const handleInstallNewTheme = async (id: string, name: string, installDefaults: ThemeInstallColorDefaults) => {
    setInstallingId(id);
    try {
      // Real bug fix: this call used to omit `theme` entirely, so the
      // backend's own generic legacy `StorefrontColors` schema defaults
      // (platform orange, Poppins, medium button radius — none of it this
      // theme's own design) silently became this installation's "customized"
      // colors from the moment it was created — the actual reason a fresh
      // another theme install's Customize preview (and its real published storefront,
      // which reads this exact same document) never showed another theme's real vivid
      // indigo + full-pill buttons. See `registry.ts`'s `installDefaults`
      // doc comment for the full story.
      await apiInstallTheme(storeId, { themeDefinitionId: id, theme: installDefaults });
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

  const handleDuplicate = async (row: StoreThemeData) => {
    setBusyRowId(row._id);
    try {
      await apiDuplicateTheme(storeId, row._id);
      toast.success('Theme duplicated — find the copy in Installed Themes below.');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to duplicate theme.');
    } finally {
      setBusyRowId(null);
    }
  };

  // Rows whose theme no longer exists in the code registry (retired themes) and are not live.
  const orphanRows = installed.filter(
    (row) => row.status !== 'active' && !newThemeEntries.some((t) => t.id === row.themeDefinitionId),
  );
  const [confirmCleanup, setConfirmCleanup] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const handleCleanup = async () => {
    setCleaning(true);
    const results = await Promise.allSettled(orphanRows.map((row) => apiUninstallTheme(storeId, row._id)));
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed) toast.error(`${failed} theme(s) could not be removed.`);
    else toast.success('Unused themes removed.');
    setCleaning(false);
    setConfirmCleanup(false);
    load();
  };

  const handleStartRename = (row: StoreThemeData) => {
    setRenamingId(row._id);
    setRenameValue(row.name ?? newThemeEntries.find(t => t.id === row.themeDefinitionId)?.name ?? '');
  };

  const handleSaveRename = async (row: StoreThemeData) => {
    setBusyRowId(row._id);
    try {
      await apiRenameTheme(storeId, row._id, renameValue);
      setRenamingId(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to rename theme.');
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

  if (loadError) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 py-24 px-6 text-center">
        <p className="text-[14px] font-bold text-charcoal">Couldn't load your themes.</p>
        <p className="text-[13px] text-slate">{loadError}</p>
        <Button onClick={load}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF9F5] min-h-full">
      <StorePageHeader
        actions={
          <button type="button" onClick={() => { const target = installed.find(r => r.status === 'active') ?? installed[0]; if (target) setZipForThemeId(target._id); else toast.error('Install a theme first, then you can upload your own theme files onto it.'); }}
            className="px-3.5 py-2 rounded-lg text-[12.5px] font-semibold border border-bone bg-white text-charcoal cursor-pointer hover:bg-cream">
            Upload theme (ZIP)
          </button>
        }
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
                <div key={entry.id} className="group relative rounded-2xl overflow-hidden border border-bone bg-white">
                  {/* Live thumbnail of the theme's own real demo homepage —
                     what WordPress/Shopify theme pickers show as a
                     screenshot, so a seller can actually see the design
                     right here instead of reading a text description and
                     guessing. See `ThemeThumbnail`'s own doc comment. */}
                  <ThemeThumbnail themeId={entry.id} className="w-full" />
                  {isActive && (
                    <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-[5px] rounded-full bg-emerald-600 text-[10.5px] font-bold tracking-wide text-white shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" /> ACTIVE
                    </span>
                  )}
                  {/* Details + actions appear only on hover/focus (tap on touch). */}
                  <div className="absolute inset-0 flex items-center justify-center p-5 bg-gradient-to-b from-black/30 via-black/55 to-black/75 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-focus-within:opacity-100">
                  <div className="flex flex-col gap-2 w-full max-w-[340px] text-center translate-y-2 transition-transform duration-200 ease-out group-hover:translate-y-0 group-focus-within:translate-y-0">
                  <p className="text-[20px] font-bold tracking-tight text-white">{entry.name}</p>
                  <p className="text-[12px] text-white/80 leading-snug line-clamp-2">{entry.description}</p>
                  <p className="text-[11px] text-white/60">
                    {entry.builtRouteCount >= entry.totalRouteCount
                      ? `Complete — all ${entry.totalRouteCount} storefront pages built.`
                      : `In progress — ${entry.builtRouteCount} of ${entry.totalRouteCount} storefront pages built so far.`}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {!isInstalled ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleInstallNewTheme(entry.id, entry.name, entry.installDefaults)}
                          disabled={installingId === entry.id}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-[8px] rounded-lg text-[12.5px] font-bold text-white border-none cursor-pointer disabled:opacity-60"
                          style={{ background: '#D97757' }}
                        >
                          {installingId === entry.id ? <Loader2 size={13} className="animate-spin" /> : null} Install
                        </button>
                        <Link
                          to={`${entry.id}/preview`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 px-3 py-[7px] rounded-lg text-[12px] font-semibold border border-bone bg-white text-charcoal hover:bg-cream no-underline"
                          title="Preview with demo content (opens in a new tab)"
                        >
                          <Eye size={13} />
                        </Link>
                      </>
                    ) : isActive && store ? (
                      <>
                        {/* Customize/Header & Footer/Edit Code all route
                            through the SAME three generic editor pages
                            regardless of which theme is active (each page
                            resolves the active store's real
                            `themeDefinitionId` against `THEME_MANIFESTS`/
                            `THEME_DEV_FILES` internally — see
                            `ThemeCustomizePage`/`ThemeEditCodePage`'s own
                            doc comments). Gating these three links behind
                            `entry.id === 'theme-03-fashion'` was a real bug:
                            it left ANY second installed+active theme with no
                            way to reach its own editor pages from this UI at
                            all — exactly the "hardcoded per-theme editor
                            page" failure this platform's theme-agnostic
                            architecture is required to avoid. These render
                            for any installed+active theme now, and the URL
                            segment is built from the real `entry.id` too
                            (previously a hardcoded theme name regardless of
                            which theme was actually active — a real, if
                            purely cosmetic, naming leak that made the URL
                            lie about which theme you were editing; fixed
                            alongside the same pages' title bars, which had
                            the identical hardcoded-"Maison" bug). */}
                        <Link
                          to={`${row?._id ?? entry.id}/customize`}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-[7px] rounded-lg text-[12px] font-semibold border-none bg-brand-orange text-white hover:bg-brand-deep-orange no-underline"
                        >
                          <Settings2 size={13} /> Customize
                        </Link>
                        <Link
                          to={`${row?._id ?? entry.id}/header-footer`}
                          className="flex items-center justify-center gap-1.5 px-3 py-[7px] rounded-lg text-[12px] font-semibold border border-bone bg-white text-charcoal hover:bg-cream no-underline"
                          title="Header & Footer"
                        >
                          <PanelTop size={13} />
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
                        <Link
                          to={`${entry.id}/preview`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 px-3 py-[7px] rounded-lg text-[12px] font-semibold border border-bone bg-white text-charcoal hover:bg-cream no-underline"
                          title="Preview with demo content (opens in a new tab)"
                        >
                          <Eye size={13} />
                        </Link>
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
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Every INSTALLED ROW, not one card per theme package — this is
            the only place a duplicate (two rows of the same
            `themeDefinitionId`, see `duplicateTheme`) is actually visible;
            the gallery above keys off `themeDefinitionId` alone and would
            silently collapse duplicates into one card. */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[14px] font-bold text-charcoal">Installed Themes</h2>
            {orphanRows.length > 0 && (
              <button type="button" onClick={() => setConfirmCleanup(true)} className="px-3 py-1.5 rounded-lg border border-bone bg-white text-error text-[11.5px] font-semibold cursor-pointer">
                Remove {orphanRows.length} unused
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {installed.map(row => {
              const knownEntry = newThemeEntries.find(t => t.id === row.themeDefinitionId);
              const displayName = row.name || knownEntry?.name || 'Retired theme';
              const isRenaming = renamingId === row._id;
              const isLive = row.status === 'active';
              const busy = busyRowId === row._id;
              const ghost = 'flex items-center justify-center gap-1.5 px-2.5 py-[7px] rounded-lg text-[11.5px] font-semibold border border-bone bg-white text-charcoal hover:bg-cream cursor-pointer no-underline disabled:opacity-60';
              return (
                <article key={row._id} className="group relative rounded-2xl overflow-hidden border border-bone bg-white">
                  <ThemeThumbnail themeId={row.themeDefinitionId ?? ''} className="w-full" />
                  {isLive ? (
                    <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-[5px] rounded-full bg-emerald-600 text-[10.5px] font-bold tracking-wide text-white shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE
                    </span>
                  ) : (
                    <span className="absolute top-3 left-3 z-10 px-2.5 py-[5px] rounded-full bg-charcoal/80 text-[10.5px] font-bold tracking-wide text-white">NOT LIVE</span>
                  )}
                  {/* Name stays visible without hover (retired themes have no screenshot). */}
                  <span className="absolute bottom-3 left-3 z-10 max-w-[80%] truncate px-2.5 py-[5px] rounded-full bg-white/90 text-[11.5px] font-semibold text-charcoal shadow-sm transition-opacity duration-200 group-hover:opacity-0 group-focus-within:opacity-0">{displayName}</span>
                  <div className={`absolute inset-0 z-20 flex items-center justify-center p-4 bg-gradient-to-b from-black/30 via-black/55 to-black/80 transition-opacity duration-200 ease-out group-hover:opacity-100 group-focus-within:opacity-100 ${isRenaming ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="flex flex-col gap-2 w-full max-w-[340px] text-center translate-y-2 transition-transform duration-200 ease-out group-hover:translate-y-0 group-focus-within:translate-y-0">
                      {isRenaming ? (
                        <div className="flex gap-2">
                          <input
                            autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSaveRename(row); if (e.key === 'Escape') setRenamingId(null); }}
                            aria-label="Theme name"
                            className="flex-1 min-w-0 px-2.5 py-1.5 text-[13px] border-none rounded-lg text-charcoal bg-white outline-none"
                          />
                          <button type="button" onClick={() => handleSaveRename(row)} disabled={busy} className="text-[12px] font-semibold px-3 py-1.5 rounded-lg border-none bg-brand-orange text-white cursor-pointer disabled:opacity-60">Save</button>
                        </div>
                      ) : (
                        <p className="text-[19px] font-bold tracking-tight text-white truncate">{displayName}</p>
                      )}
                      <p className="text-[11.5px] text-white/75 leading-snug">
                        {knownEntry ? `Based on ${knownEntry.name}` : 'Old design, no longer available. Safe to remove.'}
                      </p>
                      {isLive && row.sourcePackageVersion != null && (
                        <span title="Your storefront is rendering uploaded theme files. Customize / Header & Footer edits do not change those pages." className="self-center px-2 py-[3px] rounded-full bg-[#E0F2FE] text-[#075985] text-[10px] font-bold">CUSTOM FILES LIVE · r{row.sourcePackageVersion}</span>
                      )}
                      <div className="flex gap-2">
                        {isLive ? (
                          <Link to={`${row._id}/customize`} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-[8px] rounded-lg text-[12px] font-semibold bg-brand-orange text-white hover:bg-brand-deep-orange no-underline">
                            <Settings2 size={13} /> Customize
                          </Link>
                        ) : (
                          <>
                            <button type="button" onClick={() => setPendingActivate(row)} disabled={busy} className="flex-1 flex items-center justify-center px-3 py-[8px] rounded-lg text-[12px] font-semibold border-none bg-brand-orange text-white hover:bg-brand-deep-orange cursor-pointer disabled:opacity-60">
                              Make live
                            </button>
                            <Link to={`${row._id}/customize`} className={ghost}><Settings2 size={13} /> Customize</Link>
                          </>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <Link to={`${row._id}/header-footer`} className={ghost}><PanelTop size={12} /> Header</Link>
                        <button type="button" onClick={() => handleStartRename(row)} className={ghost}><Pencil size={12} /> Rename</button>
                        <button type="button" onClick={() => handleDuplicate(row)} disabled={busy} className={ghost}>
                          {busy ? <Loader2 size={12} className="animate-spin" /> : <Copy size={12} />} Copy
                        </button>
                        <button type="button" onClick={() => setSharePreviewRow(row)} className={ghost}><Link2 size={12} /> Share</button>
                        {!isLive ? (
                          <button type="button" onClick={() => setPendingUninstall(row)} className={`${ghost} !text-error hover:!bg-error-bg`}><Trash2 size={12} /> Delete</button>
                        ) : <span />}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      {sharePreviewRow && (
        <SharePreviewModal storeId={storeId} row={sharePreviewRow} onClose={() => setSharePreviewRow(null)} />
      )}

      {zipForThemeId && <ThemeSourcePackageDialog storeId={storeId} installedThemeId={zipForThemeId} onClose={() => { setZipForThemeId(null); load(); }} />}
      {confirmCleanup && (
        <ConfirmDialog
          title={`Remove ${orphanRows.length} unused themes?`}
          message="These are old or retired theme copies that are not live. Your active theme is not touched."
          confirmLabel="Remove"
          confirmVariant="danger"
          loading={cleaning}
          onCancel={() => setConfirmCleanup(false)}
          onConfirm={handleCleanup}
        />
      )}
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
