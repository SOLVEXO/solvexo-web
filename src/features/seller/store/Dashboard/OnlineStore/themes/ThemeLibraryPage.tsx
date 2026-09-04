import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Trash2, Sparkles, ExternalLink, Settings2, Code2, PanelTop, Eye, Copy, Link2, Pencil, Check } from 'lucide-react';
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
import { ThemeThumbnail } from './AtelierThemeDemoPreview';

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
  const [pendingUninstall, setPendingUninstall] = useState<StoreThemeData | null>(null);
  const [busyRowId, setBusyRowId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [sharePreviewRow, setSharePreviewRow] = useState<StoreThemeData | null>(null);

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

  const handleInstallNewTheme = async (id: string, name: string, installDefaults: ThemeInstallColorDefaults) => {
    setInstallingId(id);
    try {
      // Real bug fix: this call used to omit `theme` entirely, so the
      // backend's own generic legacy `StorefrontColors` schema defaults
      // (platform orange, Poppins, medium button radius — none of it this
      // theme's own design) silently became this installation's "customized"
      // colors from the moment it was created — the actual reason a fresh
      // Nova install's Customize preview (and its real published storefront,
      // which reads this exact same document) never showed Nova's real vivid
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
                <div key={entry.id} className="flex flex-col gap-3 bg-white border border-bone rounded-2xl p-4">
                  {/* Live thumbnail of the theme's own real demo homepage —
                     what WordPress/Shopify theme pickers show as a
                     screenshot, so a seller can actually see the design
                     right here instead of reading a text description and
                     guessing. See `ThemeThumbnail`'s own doc comment. */}
                  <ThemeThumbnail themeId={entry.id} className="w-full rounded-xl border border-bone" />
                  <div className="flex items-center justify-between">
                    <p className="text-[14.5px] font-bold text-charcoal">{entry.name}</p>
                    {isActive && <span className="px-2 py-[3px] rounded-full bg-brand-pale-orange text-brand-deep-orange text-[10px] font-bold">ACTIVE</span>}
                  </div>
                  <p className="text-[12px] text-slate leading-snug">{entry.description}</p>
                  <p className="text-[11px] text-slate">
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
                            `AtelierCustomizePage`/`AtelierEditCodePage`'s own
                            doc comments). Gating these three links behind
                            `entry.id === 'theme-01-atelier'` was a real bug:
                            it left ANY second installed+active theme with no
                            way to reach its own editor pages from this UI at
                            all — exactly the "hardcoded per-theme editor
                            page" failure this platform's theme-agnostic
                            architecture is required to avoid. These render
                            for any installed+active theme now, and the URL
                            segment is built from the real `entry.id` too
                            (previously a literal "atelier" regardless of
                            which theme was actually active — a real, if
                            purely cosmetic, naming leak that made the URL
                            lie about which theme you were editing; fixed
                            alongside the same pages' title bars, which had
                            the identical hardcoded-"Atelier" bug). */}
                        <Link
                          to={`${entry.id}/customize`}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-[7px] rounded-lg text-[12px] font-semibold border-none bg-brand-orange text-white hover:bg-brand-deep-orange no-underline"
                        >
                          <Settings2 size={13} /> Customize
                        </Link>
                        <Link
                          to={`${entry.id}/header-footer`}
                          className="flex items-center justify-center gap-1.5 px-3 py-[7px] rounded-lg text-[12px] font-semibold border border-bone bg-white text-charcoal hover:bg-cream no-underline"
                          title="Header & Footer"
                        >
                          <PanelTop size={13} />
                        </Link>
                        <Link
                          to={`${entry.id}/edit-code`}
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
          <h2 className="text-[14px] font-bold text-charcoal">Installed Themes</h2>
          <div className="flex flex-col gap-2">
            {installed.map(row => {
              const defName = newThemeEntries.find(t => t.id === row.themeDefinitionId)?.name ?? 'Theme';
              const displayName = row.name || defName;
              const isRenaming = renamingId === row._id;
              return (
                <div key={row._id} className="flex items-center gap-3 bg-white border border-bone rounded-lg px-4 py-3">
                  {isRenaming ? (
                    <input
                      autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveRename(row); if (e.key === 'Escape') setRenamingId(null); }}
                      className="flex-1 px-2 py-1 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none"
                    />
                  ) : (
                    <span className="text-[13px] font-semibold text-charcoal flex-1 truncate">{displayName}</span>
                  )}
                  {row.status === 'active' && <span className="px-2 py-[3px] rounded-full bg-brand-pale-orange text-brand-deep-orange text-[10px] font-bold shrink-0">ACTIVE</span>}
                  {isRenaming ? (
                    <button type="button" onClick={() => handleSaveRename(row)} disabled={busyRowId === row._id}
                      className="text-[12px] font-semibold px-3 py-1.5 rounded-lg border-none bg-brand-orange text-white cursor-pointer disabled:opacity-60">
                      Save
                    </button>
                  ) : (
                    <button type="button" onClick={() => handleStartRename(row)} title="Rename"
                      className="p-1.5 rounded-lg border border-bone bg-white text-charcoal cursor-pointer shrink-0">
                      <Pencil size={13} />
                    </button>
                  )}
                  <button type="button" onClick={() => handleDuplicate(row)} disabled={busyRowId === row._id} title="Duplicate"
                    className="p-1.5 rounded-lg border border-bone bg-white text-charcoal cursor-pointer shrink-0 disabled:opacity-60">
                    {busyRowId === row._id ? <Loader2 size={13} className="animate-spin" /> : <Copy size={13} />}
                  </button>
                  <button type="button" onClick={() => setSharePreviewRow(row)} title="Share Preview"
                    className="p-1.5 rounded-lg border border-bone bg-white text-charcoal cursor-pointer shrink-0">
                    <Link2 size={13} />
                  </button>
                  {row.status !== 'active' && (
                    <button type="button" onClick={() => setPendingUninstall(row)} title="Delete"
                      className="p-1.5 rounded-lg border-none bg-transparent text-error cursor-pointer shrink-0">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {sharePreviewRow && (
        <SharePreviewModal storeId={storeId} row={sharePreviewRow} onClose={() => setSharePreviewRow(null)} />
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
