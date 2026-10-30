import { useCallback, useEffect, useState } from 'react';
import { errorMessage } from '@/api/errorMessage';
import { Link, useSearchParams } from 'react-router-dom';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { TokenStorage } from '@/api/services/auth';
import { apiDownloadUrl, apiGetLibrary, apiRecoverLibrary, type LibraryItem } from '@/api/services/digitalLibrary';

const UPDATED_DAYS = 14;
const isRecent = (iso: string | null) => !!iso && Date.now() - new Date(iso).getTime() < UPDATED_DAYS * 86_400_000;
const errMsg = errorMessage;
const mb = (n: number | null) => (n ? `${(n / 1024 / 1024).toFixed(1)} MB` : '');

/**
 * Theme-neutral "My library" page (route key `library`). Any theme that has no own `library`
 * page - React themes and the Liquid storefront - renders this one, inheriting the page's fonts/colours.
 * Signed-in buyers use their account; guests recover access with order number + email.
 */
export function DefaultLibraryPage() {
  const { store } = useStorefront();
  const storeId = store.storeId;
  const signedIn = !!TokenStorage.getToken();
  const [params] = useSearchParams();
  const recovery = params.get('recovery') || undefined; // from the emailed link
  const [sentNote, setSentNote] = useState(false);
  const [items, setItems] = useState<LibraryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState({ orderRef: '', email: '' });

  const load = useCallback(async () => {
    setError(null);
    setItems(null);
    try {
      setItems(await apiGetLibrary(storeId, recovery));
    } catch (e) {
      setItems([]);
      setError(errMsg(e, 'Could not load your library'));
    }
  }, [storeId, recovery]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads once per key; the state is only set after the request resolves
    if (signedIn || recovery) void load();
  }, [signedIn, recovery, load]);

  async function download(productId: string, fileIndex: number) {
    const key = `${productId}:${fileIndex}`;
    setBusy(key);
    setError(null);
    try {
      window.location.assign(await apiDownloadUrl(storeId, productId, fileIndex, recovery));
      setTimeout(() => void load(), 3000);
    } catch (e) {
      setError(errMsg(e, 'Download failed'));
    } finally {
      setBusy(null);
    }
  }

  async function recover(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiRecoverLibrary(storeId, form.orderRef, form.email);
      setSentNote(true);
    } catch (err) {
      setError(errMsg(err, 'We could not find a matching order'));
    }
  }

  const field = 'w-full rounded-lg border border-current/30 bg-transparent px-3 py-2 text-sm';

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <meta name="robots" content="noindex" />
      <h1 className="text-2xl font-semibold mb-6">My library</h1>
      {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}

      {sentNote && <p role="status" className="mb-4 text-sm">If we found a matching order, we emailed you a link to your downloads. It works for 30 minutes.</p>}
      {!signedIn && !recovery && !sentNote && (
        <form onSubmit={recover} className="flex flex-col gap-3 max-w-md">
          <p className="text-sm opacity-80">
            <Link to="/login" className="underline">Sign in</Link> to see your downloads, or find them with your order number and email.
          </p>
          <label className="text-sm">Order number
            <input className={field} required value={form.orderRef} onChange={(e) => setForm({ ...form, orderRef: e.target.value })} />
          </label>
          <label className="text-sm">Email used at checkout
            <input className={field} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <button type="submit" className="rounded-lg border border-current font-medium px-4 py-2 text-sm">Email me a link</button>
        </form>
      )}

      {(signedIn || recovery) && items === null && <p className="text-sm opacity-70" aria-busy="true">Loading...</p>}
      {(signedIn || recovery) && items?.length === 0 && !error && <p className="text-sm opacity-70">You have no downloads yet.</p>}

      <ul className="flex flex-col gap-4">
        {items?.map((it) => (
          <li key={it.accessId} className="rounded-xl border border-current/20 p-4">
            <div className="flex items-center gap-3 mb-3">
              {it.image && <img src={it.image} alt="" className="size-12 rounded object-cover" />}
              <div className="flex-1">
                <p className="font-medium">{it.name}</p>
                <p className="text-xs opacity-70">
                  {it.downloadLimit === 'unlimited' ? 'Unlimited downloads' : `${it.downloadsUsed} of ${it.downloadLimit} downloads used`}
                  {it.expiresAt ? ` · expires ${new Date(it.expiresAt).toLocaleDateString()}` : ''}
                </p>
              </div>
            </div>
            <ul className="flex flex-col gap-2">
              {it.files.map((f) => (
                <li key={f.fileIndex} className="flex items-center gap-3 text-sm">
                  <span className="flex-1 min-w-0 truncate">
                    {f.label || f.name}
                    {f.version && <span className="opacity-60"> v{f.version}</span>}
                    {isRecent(f.updatedAt) && <span className="ml-2 rounded border border-current px-1.5 py-0.5 text-[10px]">Updated</span>}
                    <span className="opacity-60"> {mb(f.size)}</span>
                    {isRecent(f.updatedAt) && f.changelog && <span className="block text-xs opacity-70">{f.changelog}</span>}
                  </span>
                  <button
                    type="button"
                    disabled={busy === `${it.productId}:${f.fileIndex}`}
                    onClick={() => void download(it.productId, f.fileIndex)}
                    className="rounded-lg border border-current/40 px-3 py-1.5 disabled:opacity-50"
                  >
                    Download
                  </button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </main>
  );
}
