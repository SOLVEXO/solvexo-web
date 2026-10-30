import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '@/api/client';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { TokenStorage } from '@/api/services/auth';

interface Row { id: string; productId: string; key: string; activationLimit: number; activations: number }

/** Theme-neutral "My licenses" page (route key `licenses`). */
export function DefaultLicensesPage() {
  const { store } = useStorefront();
  const signedIn = !!TokenStorage.getToken();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!signedIn) return;
    (client.get('/api/licenses/me', { params: { storeId: store.storeId } }) as Promise<Row[]>)
      .then(setRows)
      .catch((e: any) => { setRows([]); setError(e?.response?.data?.message ?? 'Could not load your licenses'); });
  }, [signedIn, store.storeId]);

  async function copy(r: Row) {
    try { await navigator.clipboard.writeText(r.key); setCopied(r.id); } catch { setError('Copy failed, select the key and copy it manually'); }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <meta name="robots" content="noindex" />
      <h1 className="text-2xl font-semibold mb-6">My licenses</h1>
      {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}
      {!signedIn && <p className="text-sm"><Link to="/login" className="underline">Sign in</Link> to see your license keys.</p>}
      {signedIn && rows === null && <p aria-busy="true" className="text-sm opacity-70">Loading...</p>}
      {rows?.length === 0 && !error && <p className="text-sm opacity-70">You have no license keys yet.</p>}
      <ul className="flex flex-col gap-3">
        {rows?.map((r) => (
          <li key={r.id} className="rounded-xl border border-black/15 p-4 text-sm flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <code className="font-mono text-base select-all">{r.key}</code>
              <p className="opacity-70">{r.activations} of {r.activationLimit} devices activated</p>
            </div>
            <button type="button" onClick={() => void copy(r)} className="rounded-lg border border-black/30 px-3 py-1.5">{copied === r.id ? 'Copied' : 'Copy'}</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
