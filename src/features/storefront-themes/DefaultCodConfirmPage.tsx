import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { errorMessage } from '@/api/errorMessage';
import { apiCancelCodByLink, apiConfirmCodByLink, apiGetCodConfirmation, type CodPublicView } from '@/api/services/codProtection';

const btnCls = 'rounded-lg border border-current/40 px-4 py-2 text-sm font-medium disabled:opacity-50';

const DONE_TEXT: Record<string, string> = {
  confirmed: 'Thank you! Your order is confirmed and the store will prepare it for delivery.',
  cancelled: 'Your order has been cancelled.',
  expired: 'The time to confirm this order has passed, so it was cancelled. You can place a new order any time.',
};

/** Theme-neutral page behind the link in the "please confirm your cash-on-delivery order" message (route key `codConfirm`). */
export function DefaultCodConfirmPage() {
  const { token = '' } = useParams();
  const [view, setView] = useState<CodPublicView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [busy, setBusy] = useState<'confirm' | 'cancel' | null>(null);

  const load = useCallback(() => {
    apiGetCodConfirmation(token)
      .then((v) => { setView(v); setError(null); setInvalid(false); })
      .catch((e: unknown) => {
        const status = (e as { response?: { status?: number } })?.response?.status;
        if (status === 404) setInvalid(true); else setError(errorMessage(e, 'Could not load your order'));
      });
  }, [token]);
  useEffect(() => { load(); }, [load]);

  async function act(kind: 'confirm' | 'cancel') {
    setBusy(kind); setError(null);
    try { setView(await (kind === 'confirm' ? apiConfirmCodByLink(token) : apiCancelCodByLink(token))); }
    catch (e) { setError(errorMessage(e, 'Something went wrong. Please try again.')); } finally { setBusy(null); }
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12">
      <meta name="robots" content="noindex" />
      <h1 className="mb-4 text-2xl font-semibold">Confirm your order</h1>
      {invalid && <p role="alert" className="text-sm">This link is not valid any more. It may have been replaced by a newer message, or the order was already handled. If you need help, contact the store.</p>}
      {error && <p role="alert" className="mb-4 text-sm text-red-600">{error} <button type="button" className="underline" onClick={load}>Retry</button></p>}
      {!view && !invalid && !error && <p aria-busy="true" className="text-sm opacity-70">Loading...</p>}
      {view && (
        <section className="flex flex-col gap-4 rounded-xl border border-current/20 p-5 text-sm">
          <p className="m-0"><strong>{view.storeName}</strong> · order #{view.orderNumber}</p>
          <p className="m-0 opacity-80">{view.itemCount} item(s) · cash on delivery · total <bdi>{view.currency} {view.total.toLocaleString()}</bdi></p>
          {view.status === 'awaiting' ? (
            <>
              <p className="m-0">Please confirm that you want this order. It will be cancelled automatically if you do not confirm by {new Date(view.expiresAt).toLocaleString()}.</p>
              <div className="flex flex-wrap gap-3">
                <button type="button" className={btnCls} disabled={busy !== null} onClick={() => void act('confirm')}>{busy === 'confirm' ? 'Confirming...' : 'Yes, confirm my order'}</button>
                <button type="button" className={btnCls} disabled={busy !== null} onClick={() => void act('cancel')}>{busy === 'cancel' ? 'Cancelling...' : 'No, cancel it'}</button>
              </div>
            </>
          ) : <p role="status" className="m-0 font-medium">{DONE_TEXT[view.status]}</p>}
        </section>
      )}
    </main>
  );
}
