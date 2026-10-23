import { useState } from 'react';
import { ts } from '@/utils/tStatic';
import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import { apiGetMyStoreCredit } from '@/api/services/storeCredit';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { fashionTheme as t } from '../theme.config';
import { useMoney } from '../../core/hooks/useMoney';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { AccountLayout } from '../ui/AccountLayout';
import { Card, EmptyState, ErrorState, SectionHeading, SkeletonBlock } from '../ui/primitives';
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
    <AccountLayout title={ts('pg.store', 'Store')} accent={ts('pg.word_credit', 'credit')} subtitle={ts('pg.credit_from_refunds_and_gifts_at_store', 'Credit from refunds and gifts at {{store}}. It is applied at checkout.', { store: store.name })}>
      {loading ? (
        <div role="status" aria-label={ts('pg.loading_store_credit', 'Loading store credit')}><SkeletonBlock h={150} /><div className="mt-6"><SkeletonBlock h={64} rows={3} /></div></div>
      ) : error ? (
        <ErrorState message={ts('pg.we_could_not_load_your_store_credit', 'We could not load your store credit.')} onRetry={retry} />
      ) : (
        <div className="flex flex-col gap-8">
          <Card tone="soft" style={{ background: t.colors.accent, color: t.colors.accentInk }}>
            <p className="m-0 text-sm" style={{ opacity: 0.7 }}>{ts('credit.available', 'Available balance')}</p>
            <p className="m-0 mt-1 text-[clamp(36px,6vw,56px)] font-medium leading-none tracking-tight" aria-live="polite">{money(data?.balance ?? 0, from)}</p>
            {data?.nextExpiry && <p className="m-0 mt-4 text-sm" style={{ opacity: 0.75 }}>{ts('pg.amount_expires_on_date', '{{amount}} expires on {{date}}', { amount: money(data.nextExpiry.amount, from), date: formatStoreCreditDate(data.nextExpiry.expiresAt) })}</p>}
            <Link to="/cart" className="fx-pill mt-6" style={{ background: t.colors.bg, color: t.colors.ink, borderRadius: t.buttonRadiusPx }}>{ts('orders.goToCart', 'Go to cart')}</Link>
          </Card>

          <section aria-labelledby="credit-history">
            <SectionHeading><span id="credit-history">{ts('credit.history', 'History')}</span></SectionHeading>
            {!txs || txs.items.length === 0 ? (
              <EmptyState icon={<Wallet size={24} />} title={ts('credit.none', 'No store credit activity yet')} text={ts('pg.credit_from_refunds_or_store_will_show', 'Credit from refunds or {{store}} will show up here.', { store: store.name })} />
            ) : (
              <>
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {txs.items.map(tx => {
                    const up = isStoreCreditIncrease(tx);
                    const Icon = up ? ArrowDownLeft : ArrowUpRight;
                    return (
                      <li key={tx._id} className="flex items-center gap-4 p-4" style={{ border: `1px solid ${t.colors.border}`, borderRadius: 18 }}>
                        <span className="grid size-10 shrink-0 place-items-center rounded-full" style={{ background: t.colors.bgAlt }}><Icon size={17} aria-hidden /></span>
                        <div className="min-w-0 flex-1">
                          <p className="m-0 text-[15px] font-medium">{STORE_CREDIT_TYPE_LABEL[tx.type] ?? tx.type}</p>
                          {tx.note && <p className="m-0 text-[13px]" style={{ color: t.colors.inkMuted }}>{tx.note}</p>}
                          <p className="m-0 text-xs" style={{ color: t.colors.inkMuted }}>{formatStoreCreditDate(tx.createdAt)}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="m-0 text-[15px] font-semibold" style={{ color: up ? t.colors.success : t.colors.danger }}><span className="sr-only">{up ? ts('pg.word_added', 'Added') : ts('pg.word_used', 'Used')}{' '}</span>{up ? '+' : '-'}{money(Math.abs(tx.amount), from)}</p>
                          <p className="m-0 text-xs" style={{ color: t.colors.inkMuted }}>{ts('pg.balance_amount', 'Balance {{amount}}', { amount: money(tx.balanceAfter, from) })}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <Pager page={page} totalPages={totalPages} onChange={setPage} />
              </>
            )}
          </section>
        </div>
      )}
    </AccountLayout>
  );
}

/** `/store-credit` - balance, next expiry and the paged credit ledger for this store. */
export function FashionStoreCreditPage() {
  return <RequireAccount><StoreCredit /></RequireAccount>;
}
