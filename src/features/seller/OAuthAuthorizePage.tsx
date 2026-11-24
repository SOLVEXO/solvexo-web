import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Store } from 'lucide-react';
import { TokenStorage } from '@/api/services/auth';
import { apiGetMyStores, type MyStoreItem } from '@/api/services/store';
import { errorMessage } from '@/api/errorMessage';
import { Badge, Button, EmptyState, SkeletonBox } from '@/components/comman/ui';

/**
 * www.solvexo.store/oauth/authorize — the one fixed address apps and tools like Zapier and Make send a store owner to.
 * It signs them in if needed, lets them pick which store to connect (straight through when there's only one), then
 * hands the untouched query (client_id, redirect_uri, scope, state) to that store's consent screen, which the server
 * checks in full. Nothing is granted on this page.
 */
export default function OAuthAuthorizePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = TokenStorage.getUser<{ role?: string; storeId?: string | null }>();
  const [stores, setStores] = useState<MyStoreItem[] | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const query = location.search;
  const consentFor = (storeId: string) => `/store/${storeId}/app-platform/authorize${query}`;
  const isSeller = user?.role === 'seller';

  useEffect(() => {
    if (!isSeller) return;
    let alive = true;
    apiGetMyStores()
      .then((r) => { if (alive) setStores((r.data ?? []).filter((s) => !s.isDelete)); })
      .catch((e: unknown) => { if (alive) setError(errorMessage(e)); });
    return () => { alive = false; };
  }, [isSeller, attempt]);

  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + query)}`} replace />;
  // Staff work inside one store: that store is the only one they can connect.
  if (user.role === 'staff' && user.storeId) return <Navigate to={consentFor(user.storeId)} replace />;
  if (!isSeller) {
    return (
      <Shell>
        <EmptyState icon={<Store size={22} />} title="Sign in with a store account" description="Only a store owner or their staff can connect an app to a store. Sign out and sign in with your store account." />
      </Shell>
    );
  }
  if (stores && stores.length === 1) return <Navigate to={consentFor(String(stores[0]._id))} replace />;

  return (
    <Shell>
      <h1 className="m-0 text-[20px] font-semibold text-carbon">Which store do you want to connect?</h1>
      <p className="m-0 mt-1 text-[13px] text-slate">Next you'll see exactly what the app asks for, and you decide whether to allow it.</p>
      <div className="mt-5">
        {error ? (
          <div className="flex flex-col items-start gap-3">
            <p role="alert" className="m-0 text-[13px] text-error">{error}</p>
            <Button variant="outline" size="sm" onClick={() => { setError(''); setStores(null); setAttempt((a) => a + 1); }}>Try again</Button>
          </div>
        ) : !stores ? (
          <div className="flex flex-col gap-2"><SkeletonBox height={56} rounded="12px" /><SkeletonBox height={56} rounded="12px" /></div>
        ) : stores.length === 0 ? (
          <EmptyState icon={<Store size={22} />} title="You don't have a store yet" description="Create a store first, then connect the app to it." action={{ label: 'Create a store', onClick: () => navigate('/onboard') }} />
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {stores.map((s) => (
              <li key={String(s._id)}>
                <button type="button" onClick={() => navigate(consentFor(String(s._id)))}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-bone bg-white px-4 py-3 text-start hover:border-brand-orange/40">
                  <Store size={18} className="shrink-0 text-slate" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-carbon">{s.name}</span>
                    <span className="block truncate text-[12px] text-slate">{s.slug}</span>
                  </span>
                  {s.planStatus === 'development' && <Badge color="gray" size="sm">Development store</Badge>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream px-4 py-12">
      <div className="mx-auto w-full max-w-[480px] rounded-2xl border border-bone bg-white p-6">{children}</div>
    </div>
  );
}
