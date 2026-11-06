import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { errorMessage } from '@/api/errorMessage';
import { TokenStorage } from '@/api/services/auth';
import { apiGetMyMessagingPrefs, apiMessagingOptIn, apiMessagingOptOut, type MyMessagingPrefs } from '@/api/services/marketingMessaging';
import { useStorefront } from '@/features/storefront/StorefrontContext';

type Channel = 'whatsapp' | 'sms';
const LABEL: Record<Channel, string> = { whatsapp: 'WhatsApp', sms: 'SMS' };
const inputCls = 'w-full rounded-lg border border-current/30 bg-transparent px-3 py-2 text-sm';
const btnCls = 'rounded-lg border border-current/40 px-4 py-2 text-sm font-medium disabled:opacity-50';

/** Theme-neutral page where a signed-in customer chooses whether this store may message them on WhatsApp or SMS (route key `messagingPrefs`). */
export function DefaultMessagingPrefsPage() {
  const { store } = useStorefront();
  const signedIn = !!TokenStorage.getToken();
  const [prefs, setPrefs] = useState<MyMessagingPrefs | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiGetMyMessagingPrefs(store.storeId).then((p) => { setPrefs(p); setError(null); }).catch((e: unknown) => setError(errorMessage(e, 'Could not load your message settings')));
  }, [store.storeId]);
  useEffect(() => { if (signedIn) load(); }, [signedIn, load]);

  const channels = (['whatsapp', 'sms'] as Channel[]).filter((c) => prefs?.available[c]);

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <meta name="robots" content="noindex" />
      <h1 className="mb-2 text-2xl font-semibold">Message preferences</h1>
      <p className="mb-6 text-sm opacity-80">Choose whether {store.name ?? 'this store'} may send you offers and news. This never affects messages about your orders.</p>
      {!signedIn && <p className="text-sm"><Link to="/login" className="underline">Sign in</Link> to manage your message preferences.</p>}
      {error && <p role="alert" className="mb-4 text-sm text-red-600">{error} <button type="button" className="underline" onClick={load}>Retry</button></p>}
      {signedIn && !prefs && !error && <p aria-busy="true" className="text-sm opacity-70">Loading...</p>}
      {prefs && channels.length === 0 && <p className="text-sm">This store does not send marketing messages by WhatsApp or SMS.</p>}
      {prefs && channels.map((c) => <ChannelCard key={c} channel={c} storeId={store.storeId} prefs={prefs} onChange={setPrefs} />)}
    </main>
  );
}

function ChannelCard({ channel, storeId, prefs, onChange }: { channel: Channel; storeId: string; prefs: MyMessagingPrefs; onChange: (p: MyMessagingPrefs) => void }) {
  const current = prefs.consents.find((x) => x.channel === channel);
  const optedIn = current?.status === 'opted_in';
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<MyMessagingPrefs>) {
    setBusy(true); setError(null);
    try { onChange(await fn()); setAgreed(false); setPhone(''); } catch (e) { setError(errorMessage(e, 'Something went wrong. Please try again.')); } finally { setBusy(false); }
  }

  return (
    <section className="mb-4 flex flex-col gap-3 rounded-xl border border-current/20 p-5 text-sm">
      <h2 className="m-0 text-base font-semibold">{LABEL[channel]}</h2>
      {optedIn ? (
        <>
          <p role="status" className="m-0">You receive offers by {LABEL[channel]} on the number ending <bdi>{current?.phoneEnding}</bdi>.</p>
          <div><button type="button" className={btnCls} disabled={busy} onClick={() => void run(() => apiMessagingOptOut(storeId, channel))}>{busy ? 'Saving...' : 'Stop messages'}</button></div>
        </>
      ) : (
        <>
          {current?.status === 'opted_out' && <p className="m-0 opacity-80">You stopped these messages. You can turn them back on below.</p>}
          <label className="flex flex-col gap-1">Mobile number
            <input type="tel" inputMode="tel" autoComplete="tel" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 1234567" />
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>Yes, send me offers and news by {LABEL[channel]}. I can stop any time{channel === 'sms' ? ' by replying STOP' : ''}.</span>
          </label>
          <div><button type="button" className={btnCls} disabled={busy || !agreed || !phone.trim()} onClick={() => void run(() => apiMessagingOptIn(storeId, { channel, phone: phone.trim(), agreed: true }))}>{busy ? 'Saving...' : 'Turn on'}</button></div>
        </>
      )}
      {error && <p role="alert" className="m-0 text-red-600">{error}</p>}
    </section>
  );
}
