import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { AlertTriangle, Check, Clock, RefreshCw, X } from 'lucide-react';
import { Badge, Button, EmptyState } from '@/components/comman/ui';
import {
  DEAL_STATUS_COLORS, DEAL_STATUS_LABELS, PROGRESS_LABELS, apiDealLost, apiDeals, apiDecideDeal, apiExtendDeal, apiRunDeals, fmtDay,
  type Deal, type DealStatus,
} from '@/api/services/partnerProgramme';
import { errMsg, useStableToast } from '../sales.utils';

type Filter = 'pending' | 'overdue' | 'extension' | DealStatus | '';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'pending', label: 'To decide' }, { key: 'overdue', label: 'Past deadline' }, { key: 'extension', label: 'Extension asked' },
  { key: 'accepted', label: 'Protected' }, { key: 'won', label: 'Signed up' }, { key: 'rejected', label: 'Not accepted' },
  { key: 'expired', label: 'Expired' }, { key: 'lost', label: 'Lost' }, { key: '', label: 'All' },
];

/** Super Admin → Sales Ops → Partners → Deal registrations (programme B7). */
export function DealsBoard() {
  const toast = useStableToast();
  const [filter, setFilter] = useState<Filter>('pending');
  const [data, setData] = useState<{ counts: Record<string, number>; deals: Deal[] } | null>(null);
  const [busy, setBusy] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiDeals(filter || undefined).then(r => { if (!cancelled) setData({ counts: r.data.counts as Record<string, number>, deals: r.data.deals }); })
      .catch(e => { if (!cancelled) { setData({ counts: {}, deals: [] }); toast.error(errMsg(e, 'Could not load registrations.')); } });
    return () => { cancelled = true; };
  }, [filter, tick, toast]);

  const act = async (key: string, fn: () => Promise<{ message?: string }>) => {
    setBusy(key);
    try { const r = await fn(); if (r.message) toast.success(r.message); setTick(t => t + 1); } catch (e) { toast.error(errMsg(e, 'That did not work.')); }
    setBusy('');
  };
  const reject = (d: Deal) => {
    const reason = window.prompt(`Why is ${d.businessName} not accepted? (the partner sees this)`, d.conflicts?.[0]?.detail ?? '');
    if (reason?.trim()) void act(`r:${d._id}`, () => apiDecideDeal(d._id, 'reject', reason.trim()));
  };
  const extend = (d: Deal) => {
    const days = window.prompt('Extend protection by how many days?', '90');
    if (days && Number(days) > 0) void act(`e:${d._id}`, () => apiExtendDeal(d._id, Number(days)));
  };
  const count = (k: Filter) => (k === '' ? Object.entries(data?.counts ?? {}).filter(([s]) => !['overdue', 'extension'].includes(s)).reduce((n, [, v]) => n + v, 0) : data?.counts[k] ?? 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter registrations">
          {FILTERS.map(f => (
            <button key={f.key || 'all'} role="tab" aria-selected={filter === f.key} onClick={() => { if (f.key !== filter) { setData(null); setFilter(f.key); } }}
              className={clsx('px-3 py-1.5 rounded-full text-[12px] font-medium border cursor-pointer', filter === f.key ? 'bg-charcoal text-white border-charcoal' : 'bg-white text-charcoal border-bone hover:border-charcoal/40',
                (f.key === 'overdue' || f.key === 'extension') && count(f.key) > 0 && filter !== f.key && 'border-warning text-warning')}>
              {f.label} <span className="opacity-60">{data ? count(f.key) : ''}</span>
            </button>
          ))}
        </div>
        <Button size="sm" variant="ghost" loading={busy === 'run'} onClick={() => act('run', async () => {
          const r = await apiRunDeals();
          return { message: `${r.data.won} matched to a signup, ${r.data.expired} expired.` };
        })}><RefreshCw size={13} /> Match signups now</Button>
      </div>
      <p className="text-[12px] text-slate -mt-2">
        Partners register prospects from their login. Accept or reject within the reply deadline with a reason; an accepted registration is protected, and a seller who then signs up with the same phone or email is credited to that partner every morning. Existing customers, house accounts and another partner’s protected registration are rejected automatically.
      </p>

      {!data ? <div className="h-40 rounded-xl bg-cream animate-pulse" /> : data.deals.length === 0 ? (
        <EmptyState icon={<Clock size={28} />} title="Nothing here" description="Deal registrations from partners show up here." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-bone bg-white">
          <table className="w-full text-[13px]">
            <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate border-b border-bone">
              <th className="px-3 py-2 font-semibold">Prospect</th><th className="px-3 py-2 font-semibold">Partner</th>
              <th className="px-3 py-2 font-semibold">Status</th><th className="px-3 py-2 font-semibold">Dates</th><th className="px-3 py-2" />
            </tr></thead>
            <tbody>
              {data.deals.map(d => (
                <tr key={d._id} className="border-b border-bone last:border-0 align-top">
                  <td className="px-3 py-2">
                    <p className="font-medium text-charcoal">{d.businessName}</p>
                    <p className="text-[11.5px] text-slate">{[d.contactName, d.phone, d.email, d.city].filter(Boolean).join(' · ')}</p>
                    {d.notes && <p className="text-[11.5px] text-slate italic">{d.notes}</p>}
                    {(d.conflicts ?? []).map(c => <p key={c.detail} className="text-[11.5px] text-warning flex items-start gap-1"><AlertTriangle size={12} className="shrink-0 mt-[2px]" aria-hidden />{c.detail}</p>)}
                  </td>
                  <td className="px-3 py-2 text-slate">{d.partnerName}</td>
                  <td className="px-3 py-2">
                    <Badge color={DEAL_STATUS_COLORS[d.status]} dot>{DEAL_STATUS_LABELS[d.status]}</Badge>
                    {d.rejectReason && <p className="text-[11.5px] text-slate mt-0.5">{d.decidedHow === 'auto' ? 'Automatic: ' : ''}{d.rejectReason}</p>}
                    {d.extensionRequest && <p className="text-[11.5px] text-warning mt-0.5">Asks for more time: {PROGRESS_LABELS[d.extensionRequest.progress]}{d.extensionRequest.note ? ` (${d.extensionRequest.note})` : ''}</p>}
                  </td>
                  <td className="px-3 py-2 text-[12px] text-slate whitespace-nowrap">
                    Registered {fmtDay(d.submittedAt)}
                    {d.status === 'pending' && <span className={clsx('block', d.overdue && 'text-error font-semibold')}>Reply by {fmtDay(d.decisionDueAt)}</span>}
                    {d.protectedUntil && (d.status === 'accepted' || d.status === 'expired') && <span className="block">Protected until {fmtDay(d.protectedUntil)}</span>}
                    {d.wonAt && <span className="block text-success">Signed up {fmtDay(d.wonAt)}</span>}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    {d.status === 'pending' && <>
                      <Button size="xs" loading={busy === `a:${d._id}`} onClick={() => act(`a:${d._id}`, () => apiDecideDeal(d._id, 'accept'))}><Check size={12} /> Accept</Button>
                      <Button size="xs" variant="ghost" loading={busy === `r:${d._id}`} onClick={() => reject(d)}><X size={12} /> Reject</Button>
                    </>}
                    {(d.status === 'accepted' || d.status === 'expired') && <>
                      <Button size="xs" variant={d.extensionRequest ? 'primary' : 'ghost'} loading={busy === `e:${d._id}`} onClick={() => extend(d)}>Extend</Button>
                      <Button size="xs" variant="ghost" onClick={() => act(`l:${d._id}`, () => apiDealLost(d._id))}>Lost</Button>
                    </>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
