import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftRight, Ban, CircleCheck, CircleDollarSign, CircleX, Clock, CreditCard, Download, FileText, Flag, Package, Percent,
  RotateCcw, Sparkles, Wallet, ChevronDown, Printer, type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/comman/ui/Button';
import { SkeletonBox } from '@/components/comman/ui/SkeletonBox';
import { downloadBlob } from '@/utils/downloadBlob';
import type { BillingTimelineData, BillingTimelineEvent, BillingTimelineParams } from '@/api/services/billingTimeline';
import { KIND_FILTERS, buildStatementHtml, cardLabel, groupByMonth, money, periodRange, recentMonths, type PeriodKey } from '@/utils/billingTimeline';

interface Props {
  /** Loads the timeline for a filter (seller or admin endpoint). */
  load: (p: BillingTimelineParams) => Promise<{ data: BillingTimelineData }>;
  /** Fetches the CSV text for the same filter. */
  exportCsv: (p: BillingTimelineParams) => Promise<{ data: { filename: string; csv: string } }>;
  /** Bump to refetch after a plan/add-on change elsewhere on the page. */
  refreshKey?: number;
  /** Admin sees provider references (charge / invoice ids) in the details. */
  audience?: 'seller' | 'admin';
  /** Shown at the top of the printed statement. */
  storeName?: string;
}

const KIND_ICON: Record<BillingTimelineEvent['kind'], LucideIcon> = {
  trial_started: Sparkles, trial_ended: Flag, plan_change: ArrowLeftRight, credit: Wallet, payment: CircleCheck, payment_failed: CircleX,
  refund: RotateCcw, addon: Package, transaction_fee: Percent,
};
const STATUS_DOT: Record<BillingTimelineEvent['status'], string> = {
  success: 'bg-success-bg text-success', failed: 'bg-error-bg text-error', pending: 'bg-warning-bg text-warning',
  info: 'bg-fog text-slate', refunded: 'bg-info-bg text-info',
};
const STATUS_LABEL: Record<BillingTimelineEvent['status'], string> = { success: 'Paid', failed: 'Failed', pending: 'Pending', info: '', refunded: 'Refunded' };

function SummaryTile({ icon: Icon, label, value, hint, hintTone }: { icon: LucideIcon; label: string; value: string; hint?: string; hintTone?: 'error' }) {
  return (
    <div className="rounded-[10px] border border-bone bg-white px-4 py-3 min-w-0">
      <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-slate"><Icon size={13} aria-hidden />{label}</div>
      <p className="mt-1 text-[18px] font-semibold leading-tight text-charcoal">{value}</p>
      {hint && <p className={`mt-0.5 text-[11px] ${hintTone === 'error' ? 'text-error' : 'text-slate'}`}>{hint}</p>}
    </div>
  );
}

function EventRow({ e, audience }: { e: BillingTimelineEvent; audience: 'seller' | 'admin' }) {
  const [open, setOpen] = useState(false);
  const Icon = KIND_ICON[e.kind] ?? CircleDollarSign;
  const hasDetails = !!(e.lineItems?.length || e.hostedInvoiceUrl || e.reason || (audience === 'admin' && e.internal));
  const amountClass = e.status === 'failed' ? 'text-error line-through decoration-error/50' : e.amountUSD != null && e.amountUSD < 0 ? 'text-success' : 'text-charcoal';
  const when = new Date(e.at);
  return (
    <li className="relative flex gap-3 px-5 py-3.5 border-b border-fog last:border-b-0">
      <span className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${STATUS_DOT[e.status]}`} aria-hidden><Icon size={14} /></span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-charcoal">
              {e.title}
              {e.attemptNumber ? <span className="ml-1.5 text-[11px] font-normal text-slate">attempt #{e.attemptNumber}</span> : null}
            </p>
            <p className="mt-0.5 text-[12px] leading-[1.5] text-slate">{e.description}</p>
          </div>
          <div className="shrink-0 text-right">
            {e.amountUSD != null && <p className={`text-[13px] font-semibold tabular-nums ${amountClass}`}>{money(e.amountUSD)}</p>}
            {e.creditUSD != null && <p className={`text-[13px] font-semibold tabular-nums ${e.creditUSD > 0 ? 'text-success' : 'text-charcoal'}`}>{e.creditUSD > 0 ? '+' : ''}{money(e.creditUSD)} <span className="text-[10.5px] font-semibold uppercase tracking-wide text-slate">credit</span></p>}
            {STATUS_LABEL[e.status] && e.amountUSD != null && <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate">{STATUS_LABEL[e.status]}</p>}
          </div>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate">
          <time dateTime={e.at}>{when.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} · {when.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</time>
          {e.card && <span className="inline-flex items-center gap-1"><CreditCard size={11} aria-hidden />{cardLabel(e.card)}</span>}
          {hasDetails && (
            <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
              className="inline-flex items-center gap-0.5 font-semibold text-brand-orange hover:underline cursor-pointer">
              {open ? 'Hide details' : 'Details'}<ChevronDown size={12} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} aria-hidden />
            </button>
          )}
        </div>
        {open && (
          <div className="mt-2.5 rounded-[8px] border border-bone bg-cream/60 p-3 text-[12px]">
            {e.lineItems && e.lineItems.length > 0 && (
              <table className="w-full">
                <tbody>
                  {e.lineItems.map((l, i) => (
                    <tr key={i}><td className="py-0.5 pr-3 text-charcoal">{l.label}</td><td className={`py-0.5 text-right tabular-nums ${l.amountUSD < 0 ? 'text-success' : 'text-charcoal'}`}>{money(l.amountUSD)}</td></tr>
                  ))}
                  {e.amountUSD != null && e.kind !== 'refund' && (
                    <tr className="border-t border-bone"><td className="pt-1 pr-3 font-semibold text-charcoal">Total charged</td><td className="pt-1 text-right font-semibold tabular-nums text-charcoal">{money(e.amountUSD)}</td></tr>
                  )}
                </tbody>
              </table>
            )}
            {e.reason && <p className={e.lineItems?.length ? 'mt-2 text-slate' : 'text-slate'}><span className="font-semibold text-charcoal">Reason: </span>{e.reason}</p>}
            {e.hostedInvoiceUrl && (
              <a href={e.hostedInvoiceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 font-semibold text-brand-orange hover:underline">
                <FileText size={12} aria-hidden />{e.status === 'failed' ? 'Pay this invoice' : 'View invoice'}
              </a>
            )}
            {audience === 'admin' && e.internal && (
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-[11px] text-slate">
                {e.internal.providerChargeId && (<><dt>Charge</dt><dd className="break-all">{e.internal.providerChargeId}</dd></>)}
                {e.internal.stripeInvoiceId && (<><dt>Stripe invoice</dt><dd className="break-all">{e.internal.stripeInvoiceId}</dd></>)}
                {e.internal.providerRefundId && (<><dt>Refund</dt><dd className="break-all">{e.internal.providerRefundId}</dd></>)}
              </dl>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * Complete billing record for one store: summary tiles, filters, a monthly statement strip, the chronological timeline
 * (trial → plan changes → payments with card and line items → failed attempts with reasons → refunds → add-ons → fee bills)
 * and CSV export. Shared by the seller's Plan & Billing page and the admin's per-store view.
 */
export function BillingTimeline({ load, exportCsv, refreshKey = 0, audience = 'seller', storeName }: Props) {
  const [period, setPeriod] = useState<PeriodKey>('all');
  const [filterId, setFilterId] = useState('all');
  const [data, setData] = useState<BillingTimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nonce, setNonce] = useState(0);
  const [exporting, setExporting] = useState(false);
  const months = useMemo(() => recentMonths(), []);

  const params = useMemo<BillingTimelineParams>(() => {
    const kinds = KIND_FILTERS.find(f => f.id === filterId)?.kinds ?? [];
    return { ...periodRange(period), ...(kinds.length ? { kinds } : {}) };
  }, [period, filterId]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag for a data fetch
    setLoading(true); setError('');
    load(params)
      .then(res => { if (!cancelled) setData(res.data); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load the billing activity.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [load, params, refreshKey, nonce]);

  const doExport = useCallback(async () => {
    setExporting(true);
    try {
      const res = await exportCsv(params);
      downloadBlob(new Blob([res.data.csv], { type: 'text/csv;charset=utf-8' }), res.data.filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed.');
    } finally { setExporting(false); }
  }, [exportCsv, params]);

  const printStatement = useCallback(() => {
    if (!data) return;
    const w = window.open('', '_blank', 'noopener,width=900,height=1000');
    if (!w) { setError('Allow pop-ups to print the statement.'); return; }
    const label = period === 'all' ? 'All time' : (months.find(m => m.value === period)?.label ?? (period === 'this_month' ? 'This month' : period === 'last_month' ? 'Last month' : 'Last 90 days'));
    w.document.write(buildStatementHtml(data, storeName ?? 'Store', label));
    w.document.close();
    w.focus();
    w.print();
  }, [data, period, months, storeName]);

  const s = data?.summary;
  const st = data?.statement;
  const groups = useMemo(() => groupByMonth(data?.events ?? []), [data]);
  const ranged = period !== 'all';

  return (
    <div className="flex flex-col">
      {/* Summary */}
      <div className="grid grid-cols-1 gap-2.5 px-5 pt-4 min-[480px]:grid-cols-2 lg:grid-cols-4">
        {loading && !s ? Array.from({ length: 4 }, (_, i) => <SkeletonBox key={i} height="72px" rounded="10px" />) : s && (
          <>
            <SummaryTile icon={Wallet} label="Paid to Solvexo (all time)" value={money(s.netLifetimeUSD)}
              hint={s.refundedUSD > 0 ? `${money(s.lifetimePaidUSD)} paid · ${money(s.refundedUSD)} refunded` : `Plans ${money(s.breakdown.plans)} · Add-ons ${money(s.breakdown.addons)} · Fees ${money(s.breakdown.transactionFees)}`} />
            <SummaryTile icon={CircleDollarSign} label="This month" value={money(s.thisMonthUSD)} hint={s.taxPaidUSD > 0 ? `Includes ${money(s.taxPaidUSD)} tax (all time)` : undefined} />
            <SummaryTile icon={Wallet} label="Account credit" value={money(s.creditBalanceUSD)} hint={s.creditBalanceUSD > 0 ? 'Applied to your next charge' : 'No credit balance'} />
            <SummaryTile icon={CreditCard} label="Card used" value={s.card ? cardLabel(s.card) : '—'}
              hint={s.failedPaymentsLast30Days > 0 ? `${s.failedPaymentsLast30Days} failed payment(s) in 30 days` : 'No failed payments in 30 days'} hintTone={s.failedPaymentsLast30Days > 0 ? 'error' : undefined} />
          </>
        )}
      </div>

      {s?.pendingPlanChange && (
        <div role="status" className="mx-5 mt-3 flex items-start gap-2 rounded-[8px] border border-warning/30 bg-warning-bg px-3 py-2 text-[12.5px] text-warning">
          <Clock size={14} className="mt-0.5 shrink-0" aria-hidden />
          <span>Waiting for payment of the <strong>{s.pendingPlanChange.planName}</strong> plan ({money(s.pendingPlanChange.amountUSD)}). It activates as soon as the payment goes through{s.lastBillingError ? ` — last attempt failed: ${s.lastBillingError.replace(/[.\s]+$/, '')}` : ''}.</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-5 pt-4">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter billing activity">
          {KIND_FILTERS.map(f => (
            <button key={f.id} type="button" onClick={() => setFilterId(f.id)} aria-pressed={filterId === f.id}
              className={`rounded-full border px-3 py-1 text-[12px] font-medium cursor-pointer transition-colors ${filterId === f.id ? 'border-charcoal bg-charcoal text-white' : 'border-bone bg-white text-slate hover:bg-cream'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="billing-period">Period</label>
          <select id="billing-period" value={period} onChange={e => setPeriod(e.target.value)}
            className="rounded-[8px] border border-bone bg-white px-2.5 py-1.5 text-[12px] text-charcoal">
            <option value="all">All time</option>
            <option value="this_month">This month</option>
            <option value="last_month">Last month</option>
            <option value="last_90">Last 90 days</option>
            <optgroup label="Monthly statement">
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </optgroup>
          </select>
          <Button size="sm" variant="outline" onClick={doExport} loading={exporting} disabled={loading || !data?.events.length}>
            <Download size={13} aria-hidden /> Export CSV
          </Button>
          <Button size="sm" variant="outline" onClick={printStatement} disabled={loading || !data?.events.length}>
            <Printer size={13} aria-hidden /> Print statement
          </Button>
        </div>
      </div>

      {/* Statement for the chosen period */}
      {ranged && st && (
        <div className="mx-5 mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-bone bg-bone sm:grid-cols-4" aria-label="Statement totals for the selected period">
          {[
            ['Charged', money(st.chargedUSD)], ['Refunded', money(st.refundedUSD)], ['Tax included', money(st.taxUSD)], ['Net', money(st.netUSD)],
          ].map(([k, v]) => (
            <div key={k} className="bg-white px-3.5 py-2.5"><p className="text-[11px] text-slate">{k}</p><p className="text-[14px] font-semibold text-charcoal tabular-nums">{v}</p></div>
          ))}
        </div>
      )}

      {/* Timeline */}
      <div className="mt-3 border-t border-fog">
        {error ? (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 px-5 py-5">
            <p className="text-[13px] text-error">{error}</p>
            <Button size="sm" variant="outline" onClick={() => setNonce(n => n + 1)}>Retry</Button>
          </div>
        ) : loading && !data ? (
          <div className="flex flex-col gap-3 px-5 py-5">{Array.from({ length: 4 }, (_, i) => <SkeletonBox key={i} height="44px" />)}</div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 px-5 py-10 text-center">
            <Ban size={22} className="text-slate/50" aria-hidden />
            <p className="text-[13px] font-medium text-charcoal">Nothing here yet</p>
            <p className="max-w-[340px] text-[12px] text-slate">{ranged || filterId !== 'all' ? 'No billing activity matches this filter. Try a different period.' : 'Trials, plan changes, payments, refunds and add-ons will appear here as they happen.'}</p>
          </div>
        ) : (
          <div aria-busy={loading}>
            {groups.map(g => (
              <section key={g.label} aria-label={g.label}>
                <h4 className="sticky top-0 z-[1] border-b border-fog bg-cream/90 px-5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate backdrop-blur">{g.label}</h4>
                <ol>{g.events.map(e => <EventRow key={e.id} e={e} audience={audience} />)}</ol>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
