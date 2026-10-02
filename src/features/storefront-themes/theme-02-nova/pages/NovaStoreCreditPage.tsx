import { useState, useEffect, useCallback } from 'react';
import { Wallet, AlertCircle } from 'lucide-react';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetMyStoreCredit, type StoreCreditAccount } from '@/api/services/storeCredit';
import { currencySymbol, fmt2 } from '@/utils/currency';
import { STORE_CREDIT_TYPE_LABEL, isStoreCreditIncrease, formatStoreCreditDate } from '../../storeCreditUi';
import { novaTheme as t } from '../theme.config';

const LIMIT = 10;

/** Theme 02's Store credit page: ported 1:1 from `AtelierStoreCreditPage`,
 *  restyled with Nova's rounded/pill vocabulary. */
export function NovaStoreCreditPage() {
  useStorefrontSeo({ title: 'Store credit', noindex: true });
  const { store } = useStorefront();
  const [data, setData] = useState<StoreCreditAccount | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt(a => a + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    apiGetMyStoreCredit(store.storeId, { page, limit: LIMIT })
      .then(res => { if (!cancelled) setData(res.data); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load your store credit.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [store.storeId, page, attempt]);

  const symbol = currencySymbol(data?.currency ?? store.baseCurrency);
  const money = (n: number) => `${symbol} ${fmt2(n)}`;
  const txs = data?.transactions;
  const totalPages = txs ? Math.max(1, Math.ceil(txs.total / (txs.limit || LIMIT))) : 1;
  const pillBtn = { color: t.colors.ink, border: `1.5px solid ${t.colors.border}`, borderRadius: '9999px', padding: '7px 16px' } as const;

  return (
    <main className="mx-auto" style={{ maxWidth: '720px', padding: `48px ${t.layout.containerPadX}` }}>
      <h1 style={{ fontFamily: t.fonts.display, fontSize: '26px', fontWeight: 700, color: t.colors.ink, marginBottom: '28px' }}>
        Store credit
      </h1>

      {loading && !data ? (
        <div className="animate-pulse" style={{ height: '280px', background: t.colors.bgAlt, borderRadius: t.radius.md }} />
      ) : error && !data ? (
        <div role="alert" className="flex flex-col items-center text-center" style={{ padding: '56px 0', border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md }}>
          <AlertCircle size={26} style={{ color: t.colors.danger, marginBottom: '12px' }} />
          <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.ink }}>{error}</p>
          <button type="button" onClick={retry} className="cursor-pointer bg-transparent" style={{ ...pillBtn, marginTop: '14px', fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 700 }}>
            Try again
          </button>
        </div>
      ) : (
        <>
          <section style={{ border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md, padding: '24px', marginBottom: '32px' }}>
            <p style={{ fontFamily: t.fonts.body, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: t.colors.inkMuted }}>Available balance</p>
            <p style={{ fontFamily: t.fonts.display, fontSize: '32px', fontWeight: 700, color: t.colors.ink, marginTop: '4px' }}>
              {money(data?.balance ?? 0)}
            </p>
            {data?.nextExpiry && (
              <p style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted, marginTop: '12px' }}>
                {money(data.nextExpiry.amount)} expires on {formatStoreCreditDate(data.nextExpiry.expiresAt)}
              </p>
            )}
            <p style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted, marginTop: '8px' }}>
              Apply your store credit at checkout on {store.name}.
            </p>
          </section>

          <p style={{ fontFamily: t.fonts.display, fontSize: '16px', fontWeight: 700, color: t.colors.ink, marginBottom: '16px' }}>History</p>
          {error && (
            <div role="alert" className="flex items-center gap-2" style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.danger, marginBottom: '12px' }}>
              <AlertCircle size={13} /> {error}
              <button type="button" onClick={retry} className="cursor-pointer bg-transparent underline" style={{ color: t.colors.ink, border: 'none' }}>Retry</button>
            </div>
          )}
          {!txs || txs.items.length === 0 ? (
            <div className="flex flex-col items-center text-center" style={{ padding: '48px 0', border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md }}>
              <Wallet size={26} style={{ color: t.colors.inkMuted, marginBottom: '12px' }} />
              <p style={{ fontFamily: t.fonts.display, fontSize: '15px', fontWeight: 700, color: t.colors.ink }}>No store credit activity yet</p>
              <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted, marginTop: '6px' }}>
                Credit from refunds or {store.name} will show up here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col" style={{ border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md, overflow: 'hidden', opacity: loading ? 0.6 : 1 }}>
              {txs.items.map((tx, i) => {
                const up = isStoreCreditIncrease(tx);
                return (
                  <div key={tx._id} className="flex items-start justify-between gap-3" style={{ padding: '14px 18px', borderTop: i === 0 ? 'none' : `1.5px solid ${t.colors.border}` }}>
                    <div className="min-w-0">
                      <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', fontWeight: 700, color: t.colors.ink }}>{STORE_CREDIT_TYPE_LABEL[tx.type] ?? tx.type}</p>
                      {tx.note && <p style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted, marginTop: '2px' }}>{tx.note}</p>}
                      <p style={{ fontFamily: t.fonts.body, fontSize: '11.5px', color: t.colors.inkMuted, marginTop: '2px' }}>{formatStoreCreditDate(tx.createdAt)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', fontWeight: 700, color: up ? t.colors.ink : t.colors.danger }}>
                        {up ? '+' : '-'}{money(Math.abs(tx.amount))}
                      </p>
                      <p style={{ fontFamily: t.fonts.body, fontSize: '11.5px', color: t.colors.inkMuted, marginTop: '2px' }}>Balance {money(tx.balanceAfter)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {txs && totalPages > 1 && (
            <div className="flex items-center justify-between" style={{ marginTop: '16px', fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted }}>
              <button type="button" disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)} className="cursor-pointer bg-transparent disabled:opacity-40 disabled:cursor-not-allowed" style={pillBtn}>Previous</button>
              <span>Page {page} of {totalPages}</span>
              <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage(p => p + 1)} className="cursor-pointer bg-transparent disabled:opacity-40 disabled:cursor-not-allowed" style={pillBtn}>Next</button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
