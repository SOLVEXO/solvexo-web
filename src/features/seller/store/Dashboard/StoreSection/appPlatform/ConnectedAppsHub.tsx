import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Blocks } from 'lucide-react';
import { StorePageHeader, useStoreWorkspace, hasNavPermission } from '@/components/layouts/StoreLayout';
import { SkeletonBox, EmptyState, Badge } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import { Modal } from '@/components/comman/ui/Modal';
import { TabBar, type Tab } from '@/components/comman/ui/TabBar';
import { useToast } from '@/contexts/ToastContext';
import { TokenStorage } from '@/api/services/auth';
import { apiAvailableApps, apiInstalledApps, apiUninstallApp, type AvailableApp, type InstalledApp } from '@/api/services/appPlatform';

const TABS: Tab[] = [{ id: 'installed', label: 'Installed' }, { id: 'available', label: 'Available apps' }];
const errText = (e: unknown, f: string) => (e instanceof Error && e.message ? e.message : f);
const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
const randomState = () => { const b = new Uint8Array(12); crypto.getRandomValues(b); return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join(''); };

/** Apps approved by Solvexo. Installing one shows what it may do (consent screen); it then gets its own API token with only those permissions. */
export default function ConnectedAppsHub() {
  const { storeId } = useStoreWorkspace();
  const navigate = useNavigate();
  const toast = useToast();
  const user = TokenStorage.getUser<{ role?: 'admin' | 'seller' | 'staff' | 'user'; permissions?: string[] }>();
  const canManage = hasNavPermission(user as never, ['apps.manage']);
  const [tab, setTab] = useState('installed');
  const [installed, setInstalled] = useState<InstalledApp[]>([]);
  const [available, setAvailable] = useState<AvailableApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<InstalledApp | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!storeId) return;
    setLoading(true); setError('');
    Promise.all([apiInstalledApps(storeId), apiAvailableApps(storeId)])
      .then(([i, a]) => { setInstalled(i); setAvailable(a); })
      .catch((e: unknown) => setError(errText(e, 'Could not load apps.')))
      .finally(() => setLoading(false));
  }, [storeId]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const install = (a: AvailableApp) => {
    const q = new URLSearchParams({ client_id: a.clientId, redirect_uri: a.redirectUrls[0], scope: a.scopes.join(' '), state: randomState() });
    navigate(`/store/${storeId}/app-platform/authorize?${q.toString()}`);
  };
  const uninstall = async (i: InstalledApp) => {
    setBusy(true);
    try { await apiUninstallApp(storeId, i.installId); toast.success(`${i.app.name} was removed`); setConfirm(null); load(); }
    catch (e: unknown) { toast.error(errText(e, 'Could not remove the app.')); } finally { setBusy(false); }
  };

  return (
    <>
      <StorePageHeader title="Connected apps" subtitle="Apps approved by Solvexo that can read or change store data. You decide what each one may do, and you can remove it at any time." />
      <div className="px-4 lg:px-7 pt-5 pb-10 w-full flex flex-col gap-5">
        <TabBar tabs={TABS} active={tab} onChange={setTab} />
        {error ? <EmptyState icon={<Blocks size={22} />} title="Could not load" description={error} action={{ label: 'Retry', onClick: load }} />
          : loading ? <SkeletonBox className="h-24 w-full" />
            : tab === 'installed' ? (
              installed.length === 0 ? <EmptyState icon={<Blocks size={22} />} title="No apps installed" description="Open Available apps to see what you can connect." />
                : (
                  <ul className="grid gap-3 list-none p-0 m-0 grid-cols-[repeat(auto-fill,minmax(min(100%,380px),1fr))]">
                    {installed.map((i) => (
                      <li key={i.installId} className="rounded-2xl border border-border-soft bg-white p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2"><span className="font-semibold text-[14px] text-charcoal truncate">{i.app.name}</span><Badge color="green" size="sm">Installed</Badge></div>
                        <p className="text-[12.5px] text-slate m-0">{i.app.description || 'No description'}</p>
                        <p className="text-[12px] text-slate m-0">Can: {i.scopeLabels.join('; ')}</p>
                        <p className="text-[12px] text-slate m-0">Installed {when(i.installedAt)}{i.app.developerName ? ` · by ${i.app.developerName}` : ''}</p>
                        <div className="flex gap-2 pt-1">
                          {i.embed && <Button size="sm" onClick={() => navigate(`/store/${storeId}/app-platform/${i.installId}`)}>Open {i.embed.title}</Button>}
                          {canManage && <Button size="sm" variant="outline" onClick={() => setConfirm(i)}>Remove</Button>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )
            ) : (
              available.length === 0 ? <EmptyState icon={<Blocks size={22} />} title="No apps available yet" description="Solvexo has not approved any app for installation yet." />
                : (
                  <ul className="grid gap-3 list-none p-0 m-0 grid-cols-[repeat(auto-fill,minmax(min(100%,380px),1fr))]">
                    {available.map((a) => (
                      <li key={a.id} className="rounded-2xl border border-border-soft bg-white p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2"><span className="font-semibold text-[14px] text-charcoal truncate">{a.name}</span>{a.installed && <Badge color="green" size="sm">Installed</Badge>}</div>
                        <p className="text-[12.5px] text-slate m-0">{a.description || 'No description'}</p>
                        <p className="text-[12px] text-slate m-0">Asks to: {a.scopeLabels.join('; ')}</p>
                        {canManage && <div className="pt-1"><Button size="sm" variant={a.installed ? 'secondary' : 'primary'} onClick={() => install(a)}>{a.installed ? 'Reinstall' : 'Install'}</Button></div>}
                      </li>
                    ))}
                  </ul>
                )
            )}
      </div>
      {confirm && (
        <Modal title={`Remove ${confirm.app.name}?`} onClose={() => setConfirm(null)} width={440} mobileSheet
          footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setConfirm(null)}>Keep</Button><Button loading={busy} onClick={() => void uninstall(confirm)}>Remove app</Button></div>}>
          <p className="text-[13px] text-charcoal m-0">The app loses its access straight away and its webhooks stop. Data it already copied stays with the app's developer.</p>
        </Modal>
      )}
    </>
  );
}
