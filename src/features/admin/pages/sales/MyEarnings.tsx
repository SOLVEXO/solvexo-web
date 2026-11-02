import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Handshake, MessageCircle } from 'lucide-react';
import { AdminPageHeader } from '@/components/comman/ui/AdminPageHeader';
import { Badge, CopyIconButton, EmptyState, MetricCard } from '@/components/comman/ui';
import { can } from '@/hooks/auth/useCan';
import { apiMyPartner, apiMyStatement, describePlan, formatPKR, PAYOUT_LABELS, type PartnerDetail, type PartnerStatement } from '@/api/services/salesOps';
import { StatementView } from './PartnersTab';
import { errMsg } from './sales.utils';

const thisMonth = () => new Date(Date.now() + 5 * 3_600_000).toISOString().slice(0, 7);
const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

/** Super Admin → My earnings: a partner's (or rep's) own referral link, merchants, commissions and payouts. */
export function MyEarnings() {
  const [d, setD] = useState<PartnerDetail | null | undefined>(undefined);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(thisMonth);
  const [statement, setStatement] = useState<PartnerStatement | null>(null);

  useEffect(() => {
    apiMyPartner().then(r => { setD(r.data); setStatement(r.data?.statement ?? null); }).catch(e => { setD(null); setError(errMsg(e, 'Could not load your earnings.')); });
  }, []);
  const changeMonth = (m: string) => {
    setMonth(m); setStatement(null);
    apiMyStatement(m).then(r => setStatement(r.data)).catch(() => setStatement(null));
  };

  const header = <AdminPageHeader title="My earnings" subtitle="Your referral link, the merchants you brought in, and what you have earned." icon={<Handshake size={18} />} />;
  if (d === undefined) return <>{header}<div className="px-4 sm:px-7 py-6"><div className="h-48 rounded-xl bg-cream animate-pulse" /></div></>;
  if (!d) return (
    <>{header}<div className="px-4 sm:px-7 py-10">
      <EmptyState icon={<Handshake size={28} />} title={error || 'You are not set up as a partner yet'}
        description={can('sales.manage') ? 'Partners are added in Sales Ops → Partners. Link a partner to your login to see their earnings here.' : 'Ask your Solvexo manager to add you as a partner and link this login.'} />
      {can('sales.manage') && <p className="text-center mt-3"><Link to="/admin/sales?tab=partners" className="text-[13px] font-medium text-brand-orange hover:underline">Go to Partners</Link></p>}
    </div></>
  );

  const { balances: b } = d;
  const share = `https://wa.me/?text=${encodeURIComponent(`Open your online store with Solvexo: ${d.link}`)}`;
  return (
    <>
      {header}
      <div className="px-4 sm:px-7 py-5 flex flex-col gap-5 max-w-5xl">
        <section className="rounded-xl border border-bone bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate mb-1.5">Your referral link</p>
          <div className="flex items-center gap-2 rounded-lg border border-bone bg-cream/60 px-3 py-2">
            <code className="flex-1 min-w-0 break-all text-[12.5px] text-charcoal">{d.link}</code>
            <CopyIconButton value={d.link} title="Copy link" size={14} />
            <a href={share} target="_blank" rel="noreferrer" aria-label="Share on WhatsApp" className="text-slate hover:text-success"><MessageCircle size={16} /></a>
          </div>
          <p className="text-[12px] text-slate mt-2">
            Merchants who sign up or book a demo through this link are credited to you (code <code className="text-charcoal">{d.partner.code}</code>).
            {d.plan ? <> You earn: {describePlan(d.plan)}. Each amount is held {d.plan.holdDays} days before it can be paid{d.plan.minPayoutPKR ? `, and payouts start from ${formatPKR(d.plan.minPayoutPKR)}` : ''}.</> : ' Your commission plan has not been set yet.'}
          </p>
        </section>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="Payable now" value={formatPKR(b.payablePKR)} />
          <MetricCard label="On hold" value={formatPKR(b.pendingPKR)} sub="Within the refund window" />
          <MetricCard label="Paid to you" value={formatPKR(b.paidPKR)} />
          <MetricCard label="Merchants" value={d.referrals.length} sub={`${d.referrals.filter(r => r.payingNow).length} paying now`} />
        </div>

        <section className="rounded-xl border border-bone bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate mb-2">Your merchants</p>
          {d.referrals.length === 0 ? <p className="text-[12.5px] text-slate">None yet. Share your link to get started.</p> : (
            <ul className="divide-y divide-bone">
              {d.referrals.map(r => (
                <li key={r.sellerId} className="flex items-center gap-3 py-2 text-[13px]">
                  <span className="flex-1 min-w-0 truncate font-medium text-charcoal">{r.merchant}</span>
                  <span className="hidden sm:inline text-[12px] text-slate">since {day(r.effectiveFrom)}</span>
                  <Badge color={r.payingNow ? 'green' : 'gray'} size="sm">{r.payingNow ? 'Paying' : 'Not paying yet'}</Badge>
                  <span className="w-28 text-right tabular-nums">{formatPKR(r.earnedPKR)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-bone bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate mb-2">Monthly statement</p>
          <StatementView month={month} onMonth={changeMonth} s={statement} />
        </section>

        <section className="rounded-xl border border-bone bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate mb-2">Payouts</p>
          <p className="text-[12px] text-slate mb-2">Paid by {PAYOUT_LABELS[d.partner.payoutMethod]}{d.partner.payoutDetails ? ` to ${d.partner.payoutDetails}` : ''}. To change your payout details, contact your Solvexo manager.</p>
          {d.payouts.length === 0 ? <p className="text-[12.5px] text-slate">No payouts yet.</p> : (
            <ul className="divide-y divide-bone">
              {d.payouts.map(p => <li key={p._id} className="flex items-center gap-3 py-2 text-[13px]"><span className="w-28 text-slate">{day(p.paidAt)}</span><span className="font-semibold tabular-nums">{formatPKR(p.amountPKR)}</span><span className="text-slate">{PAYOUT_LABELS[p.method] ?? p.method}{p.reference ? ` · ref ${p.reference}` : ''}</span></li>)}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
