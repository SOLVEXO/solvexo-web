import { useState, useEffect, useCallback } from 'react';
import { Loader2, PackageCheck, AlertCircle } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { SkeletonBox } from '@/components/comman/ui';
import { apiListAppCatalog, apiInstallApp, apiUninstallApp, type AppCatalogEntry } from '@/api/services/apps';

/**
 * Phase 8 — App Blocks: seller-facing install/uninstall management.
 * Deliberately minimal (list + one install/uninstall action per app) —
 * there is no app "store" browsing UI, review/ratings, or a developer
 * submission flow, since this MVP's catalog is fixed and code-defined (see
 * `apps/app-catalog.ts` on the backend), not a real marketplace. Real
 * per-store state either way: installing/uninstalling here genuinely
 * changes what's addable in Customize's "+ Add block" picker for every
 * section that supports app blocks.
 */
export function AppsPage() {
  const { storeId, loading: storeLoading } = useStoreWorkspace();
  const toast = useToast();
  const flash = (ok: boolean, text: string) => { if (ok) toast.success(text); else toast.error(text); };

  const [apps, setApps] = useState<AppCatalogEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyAppId, setBusyAppId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiListAppCatalog(storeId)
      .then(res => setApps(res.data))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load apps.'))
      .finally(() => setLoading(false));
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const toggleInstall = async (app: AppCatalogEntry) => {
    setBusyAppId(app.id);
    try {
      if (app.installed) {
        await apiUninstallApp(storeId, app.id);
        flash(true, `"${app.name}" uninstalled — its blocks were removed from every page and template.`);
      } else {
        await apiInstallApp(storeId, app.id);
        flash(true, `"${app.name}" installed — its blocks are now available in "+ Add block."`);
      }
      load();
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to update this app.');
    } finally {
      setBusyAppId(null);
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
        title="Apps"
        subtitle="Apps can add their own blocks to supported sections (e.g. Rich Text) in Customize — install one here, then add its block from any supporting section's “+ Add block” menu."
      />

      <div className="px-4 lg:px-7 py-5 flex flex-col gap-3 max-w-2xl">
        {error && (
          <div className="flex items-center gap-2 bg-error-bg border border-error/20 rounded-xl px-4 py-3 text-[13px] text-error">
            <AlertCircle size={15} className="shrink-0" /> {error}
          </div>
        )}

        {!error && apps && apps.length === 0 && (
          <div className="bg-white border border-bone rounded-2xl p-8 text-center">
            <p className="text-[13px] text-slate">No apps are available yet.</p>
          </div>
        )}

        {apps?.map(app => (
          <div key={app.id} className="bg-white border border-bone rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-bold text-charcoal">{app.name}</p>
                  {app.installed && (
                    <span className="flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wide text-success">
                      <PackageCheck size={12} /> Installed
                    </span>
                  )}
                </div>
                <p className="text-[12.5px] text-slate mt-1">{app.description}</p>
              </div>
              <button
                onClick={() => toggleInstall(app)}
                disabled={busyAppId === app.id}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-[9px] rounded-[10px] text-[12.5px] font-bold cursor-pointer border-none disabled:opacity-60 ${app.installed ? 'text-charcoal bg-white border border-bone hover:bg-cream' : 'text-white'}`}
                style={app.installed ? {} : { background: '#D97757' }}
              >
                {busyAppId === app.id ? <Loader2 size={13} className="animate-spin" /> : null}
                {app.installed ? 'Uninstall' : 'Install'}
              </button>
            </div>

            <div className="border-t border-bone pt-3 flex flex-col gap-2">
              <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate">Blocks this app provides</p>
              {app.blocks.map(block => (
                <div key={block.key} className="flex flex-col gap-0.5">
                  <p className="text-[12.5px] font-semibold text-charcoal">{block.label}</p>
                  <p className="text-[11.5px] text-slate">{block.description}</p>
                  <p className="text-[10.5px] text-slate">Works in: {block.supportedSectionTypes.map(t => t.replace(/_/g, ' ')).join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
