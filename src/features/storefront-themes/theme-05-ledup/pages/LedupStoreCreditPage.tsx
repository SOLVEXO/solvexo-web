import { useState } from 'react';
import { ts } from '@/utils/tStatic';
import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import { apiGetMyStoreCredit } from '@/api/services/storeCredit';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { ledupTheme as t } from '../theme.config';
import { useMoney } from '../../core/hooks/useMoney';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { AccountLayout } from '../ui/ledupAccount';
import { EmptyState, ErrorState, SkeletonBlock } from '../ui/ledupForm';
import { LedupPanel } from '../ui/ledupPanels';
import { ledupTd, ledupTh } from '../ui/ledupPanelStyles';
import { STORE_CREDIT_TYPE_LABEL, formatStoreCreditDate, isStoreCreditIncrease } from '../../storeCreditUi';
import { useLoad } from '../../core/pageHooks';
import { Pager, RequireAccount } from './orders/OrderParts';

const LIMIT = 10;

function StoreCredit() {
  useStorefrontSeo({ title: ts('checkout.storeCredit', 'Store credit'), noindex: true });
  const { store } = useStorefront();
  const { money } = useMoney();
  const [page, setPage] = useState(1);
  const { data: res, loading, error, retry } = useLoad(() => apiGetMyStoreCredit(store.storeId, { page, limit: LIMIT }), [store.storeId, page]);
  const data = res?.data ?? null;
  const from = data?.currency ?? store.baseCurrency;
  const txs = data?.transactions;
  const totalPages = txs ? Math.max(1, Math.ceil(txs.total / (txs.limit || LIMIT))) : 1;

  return (
    <AccountLayout title={ts('h.store_credit', 'Store *credit*')} subtitle={ts('pg.credit_from_refunds_and_gifts_at_store', 'Credit from refunds and gifts at {{store}}. It is applied at checkout.', { store: store.name })}>
      {loading ? (
        <div role="status" aria-label={ts('pg.loading_store_credit', 'Loading store credit')}><SkeletonBlock h={150} /><div className="mt-6"><SkeletonBlock h={64} rows={3} /></div></div>
      ) : error ? (
        <ErrorState message={ts('pg.we_could_not_load_your_store_credit', 'We could not load your store credit.')} onRetry={retry} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid items-stretch gap-0 overflow-hidden md:grid-cols-[1fr_auto]" style={{ background: t.colors.dark, color: t.colors.darkInk, borderRadius: t.cardRadiusPx }}>
            <div className="p-6 md:p-8">
              <p className="m-0 text-xs font-bold uppercase" style={{ letterSpacing: '.08em', opacity: 0.7 }}>{ts('credit.available', 'Available balance')}</p>
              <p className="m-0 mt-2 text-[clamp(34px,6vw,52px)] font-bold leading-none" aria-live="polite">{money(data?.balance ?? 0, from)}</p>
              {data?.nextExpiry && <p className="m-0 mt-3 text-sm" style={{ opacity: 0.75 }}>{ts('pg.amount_expires_on_date', '{{amount}} expires on {{date}}', { amount: money(data.nextExpiry.amount, from), date: formatStoreCreditDate(data.nextExpiry.expiresAt) })}</p>}
            </div>
            <div className="flex items-center p-6 md:p-8" style={{ background: t.colors.accent, color: t.colors.accentInk }}>
              <Link to="/cart" className="tx-btn" style={{ background: t.colors.bg, color: t.colors.ink, borderRadius: t.buttonRadiusPx }}>{ts('orders.goToCart', 'Go to cart')}</Link>
            </div>
          </div>

          <LedupPanel title={ts('credit.history', 'History')} flush>
            {!txs || txs.items.length === 0 ? (
              <div className="p-5"><EmptyState icon={<Wallet size={24} />} title={ts('credit.none', 'No store credit activity yet')} text={ts('pg.credit_from_refunds_or_store_will_show', 'Credit from refunds or {{store}} will show up here.', { store: store.name })} /></div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        <th scope="col" style={ledupTh()}>{ts('credit.date', 'Date')}</th>
                        <th scope="col" style={ledupTh()}>{ts('credit.activity', 'Activity')}</th>
                        <th scope="col" style={{ ...ledupTh(), textAlign: 'end' }}>{ts('credit.amount', 'Amount')}</th>
                        <th scope="col" className="max-sm:hidden" style={{ ...ledupTh(), textAlign: 'end' }}>{ts('credit.balance', 'Balance')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txs.items.map(tx => {
                        const up = isStoreCreditIncrease(tx);
                        const Icon = up ? ArrowDownLeft : ArrowUpRight;
                        return (
                          <tr key={tx._id}>
                            <td style={{ ...ledupTd(), whiteSpace: 'nowrap', color: t.colors.inkMuted }}>{formatStoreCreditDate(tx.createdAt)}</td>
                            <td style={ledupTd()}>
                              <span className="inline-flex items-center gap-2 font-medium"><Icon size={15} aria-hidden style={{ color: up ? t.colors.success : t.colors.danger }} />{STORE_CREDIT_TYPE_LABEL[tx.type] ?? tx.type}</span>
                              {tx.note && <span className="block text-[13px]" style={{ color: t.colors.inkMuted }}>{tx.note}</span>}
                            </td>
                            <td style={{ ...ledupTd(), textAlign: 'end', fontWeight: 700, color: up ? t.colors.success : t.colors.danger, whiteSpace: 'nowrap' }}><span className="sr-only">{up ? ts('pg.word_added', 'Added') : ts('pg.word_used', 'Used')}{' '}</span>{up ? '+' : '-'}{money(Math.abs(tx.amount), from)}</td>
                            <td className="max-sm:hidden" style={{ ...ledupTd(), textAlign: 'end', whiteSpace: 'nowrap' }}>{money(tx.balanceAfter, from)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 pb-4"><Pager page={page} totalPages={totalPages} onChange={setPage} /></div>
              </>
            )}
          </LedupPanel>
        </div>
      )}
    </AccountLayout>
  );
}

/** `/store-credit` - balance, next expiry and the paged credit ledger for this store. */
export function LedupStoreCreditPage() {
  return <RequireAccount><StoreCredit /></RequireAccount>;
}
