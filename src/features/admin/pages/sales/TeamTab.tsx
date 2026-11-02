import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { Shuffle, Trophy } from 'lucide-react';
import { Button, EmptyState, Input, Modal, Toggle } from '@/components/comman/ui';
import {
  apiSalesSettings, apiSalesTeam, apiSaveSalesSettings, apiSaveTargets, formatPKR,
  type LeaderRow, type SalesOwner, type SalesSettings, type Target, type TeamReport,
} from '@/api/services/salesOps';
import { errMsg, useStableToast } from './sales.utils';

/** Pakistan time, like the server: the month the team is working in right now. */
const thisMonth = () => new Date(Date.now() + 5 * 3_600_000).toISOString().slice(0, 7);
const monthLabel = (m: string) => new Date(`${m}-15T00:00:00Z`).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' });

function Goal({ value, target, pct, format = (n: number) => String(n) }: { value: number; target: number | null | undefined; pct: number | null; format?: (n: number) => string }) {
  return (
    <div className="min-w-[96px]">
      <p className="tabular-nums"><span className="font-semibold text-charcoal">{format(value)}</span>{target ? <span className="text-slate text-[11.5px]"> / {format(target)}</span> : null}</p>
      {pct !== null && (
        <div className="h-1.5 rounded-full bg-mist mt-1 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${pct}% of target`}>
          <div className={clsx('h-full rounded-full', pct >= 100 ? 'bg-success' : 'bg-brand-orange')} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

/** Super Admin → Sales Ops → Team: the month's leaderboard, targets and who gets new leads. */
export function TeamTab({ isManager, owners }: { isManager: boolean; owners: SalesOwner[] }) {
  const toast = useStableToast();
  const [month, setMonth] = useState(thisMonth);
  const [data, setData] = useState<TeamReport | null>(null);
  const [tick, setTick] = useState(0);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiSalesTeam(month).then(r => { if (!cancelled) setData(r.data); })
      .catch(e => { if (!cancelled) { setData({ month, reps: [], unassignedOpen: 0 }); toast.error(errMsg(e, 'Could not load the team.')); } });
    return () => { cancelled = true; };
  }, [month, tick, toast]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-48"><Input label="Month" type="month" value={month} max={thisMonth()} onChange={e => { if (e.target.value) { setData(null); setMonth(e.target.value); } }} /></div>
        {isManager && <Button variant="outline" onClick={() => setEditing(true)} disabled={!data?.reps.length}>Set targets for {monthLabel(month)}</Button>}
      </div>

      {isManager && data && data.unassignedOpen > 0 && (
        <p className="text-[12.5px] text-warning">{data.unassignedOpen} open lead{data.unassignedOpen === 1 ? ' has' : 's have'} no owner. Assign them from the pipeline, or turn on automatic assignment below.</p>
      )}

      {!data ? <div className="h-48 rounded-xl bg-cream animate-pulse" /> : !data.reps.length ? (
        <EmptyState icon={<Trophy size={28} />} title="No sales team yet" description="Give admins the Sales rep or Sales manager role in Team settings and they’ll appear here." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-bone bg-white">
          <table className="w-full text-[13px]">
            <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate border-b border-bone">
              <th className="px-3 py-2 font-semibold w-8">#</th><th className="px-3 py-2 font-semibold">Name</th>
              <th className="px-3 py-2 font-semibold">Value won</th><th className="px-3 py-2 font-semibold">Deals won</th>
              <th className="px-3 py-2 font-semibold">Activities</th><th className="px-3 py-2 font-semibold text-right">Demos</th>
              <th className="px-3 py-2 font-semibold text-right">New leads</th><th className="px-3 py-2 font-semibold text-right">Win rate</th>
              <th className="px-3 py-2 font-semibold text-right">Open pipeline</th><th className="px-3 py-2 font-semibold text-right">Overdue</th>
            </tr></thead>
            <tbody>
              {data.reps.map((r: LeaderRow, i) => (
                <tr key={r.adminId} className="border-b border-bone last:border-0 align-top">
                  <td className="px-3 py-2.5 text-slate">{i === 0 && r.wonValuePKR > 0 ? <Trophy size={14} className="text-brand-orange" aria-label="Top" /> : i + 1}</td>
                  <td className="px-3 py-2.5 font-medium text-charcoal whitespace-nowrap">{r.name}</td>
                  <td className="px-3 py-2.5"><Goal value={r.wonValuePKR} target={r.target?.wonValuePKR} pct={r.progress.wonValuePKR} format={formatPKR} /></td>
                  <td className="px-3 py-2.5"><Goal value={r.won} target={r.target?.wonDeals} pct={r.progress.wonDeals} /></td>
                  <td className="px-3 py-2.5"><Goal value={r.activities} target={r.target?.activities} pct={r.progress.activities} /></td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{r.demos}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{r.newLeads}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{r.winRate === null ? '—' : `${r.winRate}%`}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{r.openLeads} · {formatPKR(r.openValuePKR)}</td>
                  <td className={clsx('px-3 py-2.5 text-right tabular-nums', r.overdue > 0 ? 'text-error font-semibold' : 'text-slate')}>{r.overdue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11.5px] text-slate">Activities are calls, WhatsApps, meetings and emails logged that month. Value won is the deal value of leads marked Won that month. Months follow Pakistan time.</p>

      {isManager && <AutoAssignCard owners={owners} />}
      {editing && data && (
        <TargetsModal month={month} reps={data.reps} onClose={() => setEditing(false)}
          onSave={async targets => { setData((await apiSaveTargets(month, targets)).data); setEditing(false); toast.success('Targets saved.'); setTick(t => t + 1); }} />
      )}
    </div>
  );
}

function TargetsModal({ month, reps, onClose, onSave }: { month: string; reps: LeaderRow[]; onClose: () => void; onSave: (t: Target[]) => Promise<void> }) {
  const [rows, setRows] = useState(() => reps.map(r => ({
    adminId: r.adminId, name: r.name,
    wonDeals: r.target?.wonDeals?.toString() ?? '', wonValuePKR: r.target?.wonValuePKR?.toString() ?? '', activities: r.target?.activities?.toString() ?? '',
  })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const num = (s: string) => (s.trim() === '' ? null : Number(s.replace(/,/g, '')));
  const set = (i: number, k: 'wonDeals' | 'wonValuePKR' | 'activities', v: string) => setRows(rs => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  const save = async () => {
    const out = rows.map(r => ({ adminId: r.adminId, wonDeals: num(r.wonDeals), wonValuePKR: num(r.wonValuePKR), activities: num(r.activities) }));
    if (out.some(t => [t.wonDeals, t.wonValuePKR, t.activities].some(v => v !== null && (!Number.isFinite(v) || v < 0)))) { setError('Targets must be numbers.'); return; }
    setBusy(true); setError('');
    try { await onSave(out); } catch (e) { setError(errMsg(e, 'Could not save targets.')); setBusy(false); }
  };

  return (
    <Modal title={`Targets for ${monthLabel(month)}`} onClose={onClose} width={640}
      footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={busy} onClick={save}>Save targets</Button></div>}>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate"><th className="py-1.5 pr-2 font-semibold">Name</th><th className="py-1.5 px-1 font-semibold">Deals won</th><th className="py-1.5 px-1 font-semibold">Value won (PKR)</th><th className="py-1.5 px-1 font-semibold">Activities</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.adminId}>
                <td className="py-1.5 pr-2 font-medium text-charcoal whitespace-nowrap">{r.name}</td>
                <td className="py-1.5 px-1"><Input aria-label={`Deals won target for ${r.name}`} inputMode="numeric" value={r.wonDeals} onChange={e => set(i, 'wonDeals', e.target.value)} /></td>
                <td className="py-1.5 px-1"><Input aria-label={`Value won target for ${r.name}`} inputMode="numeric" value={r.wonValuePKR} onChange={e => set(i, 'wonValuePKR', e.target.value)} /></td>
                <td className="py-1.5 px-1"><Input aria-label={`Activities target for ${r.name}`} inputMode="numeric" value={r.activities} onChange={e => set(i, 'activities', e.target.value)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11.5px] text-slate mt-2">Leave a box empty to not track that goal.</p>
      {error && <p role="alert" className="mt-2 text-[12px] text-error">{error}</p>}
    </Modal>
  );
}

function AutoAssignCard({ owners }: { owners: SalesOwner[] }) {
  const toast = useStableToast();
  const [s, setS] = useState<SalesSettings | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { apiSalesSettings().then(r => setS(r.data)).catch(() => setS({ autoAssign: false, assigneeIds: [] })); }, []);
  if (!s) return null;

  const save = async (next: SalesSettings, message: string) => {
    setBusy(true);
    try { setS((await apiSaveSalesSettings(next)).data); toast.success(message); }
    catch (e) { toast.error(errMsg(e, 'Could not save.')); }
    setBusy(false);
  };

  return (
    <section className="rounded-xl border border-bone bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-charcoal flex items-center gap-1.5"><Shuffle size={14} className="text-brand-orange" /> Share out new leads automatically</p>
          <p className="text-[12px] text-slate mt-0.5">Demo requests, Contact Us messages and stalled sign-ups go to the people you tick, one after another. Leads you add or import yourself are not changed.</p>
        </div>
        <Toggle ariaLabel="Share out new leads automatically" checked={s.autoAssign} disabled={busy || (!s.autoAssign && s.assigneeIds.length === 0)} onChange={v => void save({ ...s, autoAssign: v }, v ? 'New leads will be shared out automatically.' : 'Automatic sharing is off.')} />
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {owners.map(o => {
          const on = s.assigneeIds.includes(o._id);
          return (
            <label key={o._id} className={clsx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px] cursor-pointer', on ? 'border-brand-orange bg-brand-pale-orange/50 text-brand-deep-orange' : 'border-bone text-charcoal')}>
              <input type="checkbox" className="accent-brand-orange" checked={on} disabled={busy}
                onChange={() => {
                  const ids = on ? s.assigneeIds.filter(x => x !== o._id) : [...s.assigneeIds, o._id];
                  if (s.autoAssign && ids.length === 0) { toast.error('Keep at least one person, or turn sharing off first.'); return; }
                  void save({ ...s, assigneeIds: ids }, 'Saved.');
                }} />
              {o.name}
            </label>
          );
        })}
      </div>
      {!s.autoAssign && s.assigneeIds.length === 0 && <p className="text-[11.5px] text-slate mt-2">Tick at least one person, then switch it on.</p>}
    </section>
  );
}
