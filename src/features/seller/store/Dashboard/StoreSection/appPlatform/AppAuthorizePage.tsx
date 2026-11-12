import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { SkeletonBox, EmptyState } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import { apiAuthorizeApp, apiAuthorizePreview, type AuthorizePreview } from '@/api/services/appPlatform';

const errText = (e: unknown, f: string) => (e instanceof Error && e.message ? e.message : f);

/** The consent screen. Everything shown here was validated by the server (registered redirect, requested permissions, state). */
export default function AppAuthorizePage() {
  const { storeId } = useStoreWorkspace();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const q = { client_id: params.get('client_id') ?? '', redirect_uri: params.get('redirect_uri') ?? '', scope: params.get('scope') ?? '', state: params.get('state') ?? '' };
  const [data, setData] = useState<AuthorizePreview | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    let off = false;
    apiAuthorizePreview(storeId, q).then((d) => { if (!off) setData(d); }).catch((e: unknown) => { if (!off) setError(errText(e, 'This install link is not valid.')); });
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, q.client_id, q.redirect_uri, q.scope, q.state]);

  const allow = async () => {
    setBusy(true); setError('');
    try { const r = await apiAuthorizeApp(storeId, q); window.location.assign(r.redirectTo); }
    catch (e: unknown) { setError(errText(e, 'Could not install the app.')); setBusy(false); }
  };
  const back = () => navigate(`/store/${storeId}/app-platform`);

  return (
    <>
      <StorePageHeader title="Allow this app?" subtitle="Check what the app asks for before you continue." />
      <div className="px-4 lg:px-7 pt-5 pb-10 w-full max-w-[560px]">
        {error && !data ? <EmptyState icon={<ShieldCheck size={22} />} title="This link cannot be used" description={error} action={{ label: 'Back to apps', onClick: back }} />
          : !data ? <SkeletonBox className="h-40 w-full" /> : (
            <div className="rounded-2xl border border-border-soft bg-white p-5 flex flex-col gap-3">
              <h2 className="text-[16px] font-semibold text-charcoal m-0">{data.app.name}{data.app.developerName ? <span className="font-normal text-slate"> by {data.app.developerName}</span> : null}</h2>
              {data.app.description && <p className="text-[13px] text-slate m-0">{data.app.description}</p>}
              <div>
                <p className="text-[13px] font-medium text-charcoal m-0 mb-1">This app will be able to:</p>
                <ul className="m-0 pl-5 text-[13px] text-charcoal">{data.scopeLabels.map((l) => <li key={l}>{l}</li>)}</ul>
              </div>
              <p className="text-[12px] text-slate m-0">After you allow it, you are sent to <strong className="break-all">{new URL(data.redirectUri).origin}</strong> to finish. {data.alreadyInstalled ? 'The app is already installed; installing again replaces its old access.' : ''}</p>
              {error && <p role="alert" className="text-[12.5px] text-error m-0">{error}</p>}
              <div className="flex gap-2 pt-1"><Button onClick={allow} loading={busy}>Allow and install</Button><Button variant="secondary" onClick={back} disabled={busy}>Cancel</Button></div>
            </div>
          )}
      </div>
    </>
  );
}
