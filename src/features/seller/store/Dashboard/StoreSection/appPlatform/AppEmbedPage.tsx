import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Blocks } from 'lucide-react';
import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { SkeletonBox, EmptyState } from '@/components/comman/ui';
import { apiAppSessionToken } from '@/api/services/appPlatform';

/**
 * An app's own page inside the dashboard: a sandboxed iframe. The app announces itself with
 * `postMessage({type:'solvexo:ready'})`; the page then hands it a short-lived signed session token
 * (never in the URL) with `postMessage({type:'solvexo:session', token, storeId}, <the app's origin>)`.
 * Only messages from that iframe and that exact origin are answered.
 */
export default function AppEmbedPage() {
  const { storeId } = useStoreWorkspace();
  const { installId = '' } = useParams<{ installId: string }>();
  const frame = useRef<HTMLIFrameElement | null>(null);
  const [info, setInfo] = useState<{ origin: string; embedUrl: string } | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!storeId || !installId) return;
    setError('');
    apiAppSessionToken(storeId, installId).then((r) => setInfo({ origin: r.origin, embedUrl: r.embedUrl })).catch((e: unknown) => setError(e instanceof Error && e.message ? e.message : 'Could not open this app.'));
  }, [storeId, installId]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!info) return;
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || e.origin !== info.origin) return;
      const type = (e.data as { type?: string } | null)?.type;
      if (type !== 'solvexo:ready' && type !== 'solvexo:session-request') return;
      apiAppSessionToken(storeId, installId)
        .then((r) => frame.current?.contentWindow?.postMessage({ type: 'solvexo:session', token: r.token, storeId: r.storeId }, info.origin))
        .catch(() => { /* the app keeps waiting; the seller can reload */ });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [info, storeId, installId]);

  return (
    <>
      <StorePageHeader title="App" subtitle="This page is provided by the app. Solvexo only shares a short-lived sign-in with it." />
      <div className="px-4 lg:px-7 pt-3 pb-6 w-full">
        {error ? <EmptyState icon={<Blocks size={22} />} title="Could not open the app" description={error} action={{ label: 'Retry', onClick: load }} />
          : !info ? <SkeletonBox className="h-[60vh] w-full" /> : (
            <iframe ref={frame} title="App" src={info.embedUrl} sandbox="allow-scripts allow-forms allow-same-origin allow-popups" referrerPolicy="no-referrer" className="w-full rounded-xl border border-border-soft bg-white" style={{ height: '75vh' }} />
          )}
      </div>
    </>
  );
}
