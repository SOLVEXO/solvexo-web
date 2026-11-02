import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Handshake, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Badge, Button, CopyIconButton, EmptyState, Input, MetricCard, Modal, Select, Textarea } from '@/components/comman/ui';
import { can } from '@/hooks/auth/useCan';
import {
  LINE_STATUS_LABELS, PARTNER_KINDS, PARTNER_KIND_LABELS, PAYOUT_LABELS, PAYOUT_METHODS, REFERRAL_SOURCE_LABELS,
  apiAddAdjustment, apiAddReferral, apiCommissionPlans, apiPartner, apiPartnerLogins, apiPartnerStatement, apiPartners,
  apiRecordPayout, apiRemoveReferral, apiRunCommissions, apiSaveCommissionPlan, apiSavePartner, describePlan, formatPKR,
  type CommissionPlan, type CommissionPlanInput, type PartnerDetail, type PartnerKind, type PartnerLogin, type PartnerRow,
  type PartnerStatement, type PayoutMethod,
} from '@/api/services/salesOps';
import { errMsg, useStableToast } from './sales.utils';

const thisMonth = () => new Date(Date.now() + 5 * 3_600_000).toISOString().slice(0, 7);
const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const STATUS_COLOR: Record<string, 'yellow' | 'green' | 'gray' | 'red'> = { pending: 'yellow', payable: 'green', paid: 'gray', void: 'red' };

/** Super Admin → Sales Ops → Partners: resellers, agents and reps, how they are paid, what they are owed. */
export function PartnersTab() {
  const toast = useStableToast();
  const [rows, setRows] = useState<PartnerRow[] | null>(null);
  const [plans, setPlans] = useState<CommissionPlan[]>([]);
  const [tick, setTick] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<PartnerDetail | 'new' | null>(null);
  const [planForm, setPlanForm] = useState<CommissionPlan | 'new' | null>(null);
  const [running, setRunning] = useState(false);
  const reload = () => setTick(t => t + 1);

  useEffect(() => {
    let cancelled = false;
    Promise.all([apiPartners(), apiCommissionPlans()])
      .then(([p, c]) => { if (!cancelled) { setRows(p.data); setPlans(c.data); } })
      .catch(e => { if (!cancelled) { setRows([]); toast.error(errMsg(e, 'Could not load partners.')); } });
    return () => { cancelled = true; };
  }, [tick, toast]);

  const sum = (k: 'payablePKR' | 'pendingPKR' | 'paidPKR') => (rows ?? []).reduce((s, r) => s + r[k], 0);
  const run = async () => {
    setRunning(true);
    try {
      const r = await apiRunCommissions();
      if (r.skipped) toast.error(r.skipped);
      else toast.success(r.created || r.attributed ? `${r.attributed} merchant${r.attributed === 1 ? '' : 's'} credited, ${r.created} commission line${r.created === 1 ? '' : 's'} added.` : 'Everything is up to date.');
      reload();
    } catch (e) { toast.error(errMsg(e, 'Could not calculate.')); }
    setRunning(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Partners" value={rows?.filter(r => r.status === 'active').length ?? 0} loading={!rows} sub={rows ? `${rows.reduce((s, r) => s + r.payingNow, 0)} paying merchants` : undefined} />
        <MetricCard label="Payable now" value={formatPKR(sum('payablePKR'))} loading={!rows} />
        <MetricCard label="On hold" value={formatPKR(sum('pendingPKR'))} loading={!rows} sub="Within the refund window" />
        <MetricCard label="Paid out" value={formatPKR(sum('paidPKR'))} loading={!rows} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12.5px] text-slate">Commissions are worked out every morning from Solvexo plan payments. Run it now after a change.</p>
        <div className="flex gap-2">
          <Button variant="ghost" loading={running} onClick={run}><RefreshCw size={14} /> Calculate now</Button>
          <Button onClick={() => setEditing('new')} disabled={!plans.some(p => !p.isArchived)} title={plans.some(p => !p.isArchived) ? undefined : 'Create a commission plan first'}><Plus size={14} /> New partner</Button>
        </div>
      </div>

      {!rows ? <div className="h-40 rounded-xl bg-cream animate-pulse" /> : !rows.length ? (
        <EmptyState icon={<Handshake size={28} />} title="No partners yet"
          description={plans.length ? 'Add your resellers, agents and sales reps. Each gets a referral link and earns on the plan you choose.' : 'Start by creating a commission plan below, then add your partners.'} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-bone bg-white">
          <table className="w-full text-[13px]">
            <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate border-b border-bone">
              <th className="px-3 py-2 font-semibold">Partner</th><th className="px-3 py-2 font-semibold">Plan</th>
              <th className="px-3 py-2 font-semibold text-right">Merchants</th><th className="px-3 py-2 font-semibold text-right">On hold</th>
              <th className="px-3 py-2 font-semibold text-right">Payable</th><th className="px-3 py-2 font-semibold text-right">Paid</th>
            </tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r._id} onClick={() => setOpenId(r._id)} className="border-b border-bone last:border-0 hover:bg-cream cursor-pointer">
                  <td className="px-3 py-2">
                    <p className="font-medium text-charcoal">{r.name}{r.status === 'paused' && <span className="ml-1.5 text-[11px] text-slate">(paused)</span>}</p>
                    <p className="text-[11.5px] text-slate">{PARTNER_KIND_LABELS[r.kind]} · <code>{r.code}</code></p>
                  </td>
                  <td className="px-3 py-2 text-slate">{r.planName ?? <span className="text-warning">No plan</span>}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.referred}<span className="text-slate text-[11.5px]"> · {r.payingNow} paying</span></td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate">{formatPKR(r.pendingPKR)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">{formatPKR(r.payablePKR)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate">{formatPKR(r.paidPKR)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate">Commission plans</p>
          <Button size="sm" variant="outline" onClick={() => setPlanForm('new')}><Plus size={13} /> New plan</Button>
        </div>
        {plans.length === 0 ? <p className="text-[12.5px] text-slate">No plans yet. A plan says what a partner earns: a fixed amount per new paying merchant, a share of what merchants pay, or both.</p> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {plans.map(p => (
              <button key={p._id} onClick={() => setPlanForm(p)} className={clsx('text-left rounded-xl border bg-white p-3 cursor-pointer hover:border-brand-orange/60', p.isArchived ? 'border-bone opacity-60' : 'border-bone')}>
                <p className="text-[13px] font-semibold text-charcoal">{p.name}{p.isArchived && ' (archived)'}</p>
                <p className="text-[12px] text-charcoal mt-1">{describePlan(p)}</p>
                <p className="text-[11.5px] text-slate mt-1">Held {p.holdDays} days{p.minPayoutPKR ? ` · minimum payout ${formatPKR(p.minPayoutPKR)}` : ''} · {p.partners ?? 0} partner{p.partners === 1 ? '' : 's'}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      {planForm && <PlanModal plan={planForm === 'new' ? null : planForm} onClose={() => setPlanForm(null)} onSaved={list => { setPlans(list); setPlanForm(null); toast.success('Plan saved.'); }} />}
      {editing && <PartnerFormModal partner={editing === 'new' ? null : editing} plans={plans} onClose={() => setEditing(null)} onSaved={d => { setEditing(null); reload(); setOpenId(d.partner._id); toast.success('Partner saved.'); }} />}
      {openId && <PartnerModal id={openId} onClose={() => setOpenId(null)} onChanged={reload} onEdit={d => { setOpenId(null); setEditing(d); }} />}
    </div>
  );
}

// ── Plan form ───────────────────────────────────────────────────────────────

function PlanModal({ plan, onClose, onSaved }: { plan: CommissionPlan | null; onClose: () => void; onSaved: (plans: CommissionPlan[]) => void }) {
  const [f, setF] = useState({
    name: plan?.name ?? '', description: plan?.description ?? '', bounty: plan?.bountyPKR?.toString() ?? '', percent: plan?.percent?.toString() ?? '',
    months: plan ? (plan.percentMonths === null ? 'forever' : String(plan.percentMonths)) : '12',
    hold: String(plan?.holdDays ?? 14), minPayout: plan?.minPayoutPKR ? String(plan.minPayoutPKR) : '',
    tiers: (plan?.tiers ?? []).map(t => ({ minPaying: String(t.minPaying), percent: String(t.percent) })),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const n = (s: string) => (s.trim() === '' ? null : Number(s.replace(/,/g, '')));

  const save = async (extra: CommissionPlanInput = {}) => {
    const body: CommissionPlanInput = {
      name: f.name.trim(), description: f.description.trim() || null, bountyPKR: n(f.bounty), percent: n(f.percent),
      percentMonths: f.months === 'forever' ? null : Number(f.months), holdDays: n(f.hold) ?? 0, minPayoutPKR: n(f.minPayout) ?? 0,
      tiers: f.tiers.filter(t => t.minPaying && t.percent).map(t => ({ minPaying: Number(t.minPaying), percent: Number(t.percent) })), ...extra,
    };
    if (!body.name) { setError('Give the plan a name.'); return; }
    if ([body.bountyPKR, body.percent, body.holdDays, body.minPayoutPKR].some(v => v !== null && v !== undefined && (!Number.isFinite(v) || v < 0))) { setError('Amounts must be numbers.'); return; }
    setBusy(true); setError('');
    try { onSaved((await apiSaveCommissionPlan(plan?._id ?? null, body)).data); } catch (e) { setError(errMsg(e, 'Could not save the plan.')); setBusy(false); }
  };

  const preview = describePlan({ bountyPKR: n(f.bounty), percent: n(f.percent), percentMonths: f.months === 'forever' ? null : Number(f.months), tiers: f.tiers.filter(t => t.minPaying && t.percent).map(t => ({ minPaying: Number(t.minPaying), percent: Number(t.percent) })), holdDays: n(f.hold) ?? 0 });
  return (
    <Modal title={plan ? 'Edit commission plan' : 'New commission plan'} onClose={onClose} width={600}
      footer={<div className="flex justify-between w-full gap-2">
        {plan ? <Button variant="ghost" onClick={() => void save({ isArchived: !plan.isArchived })}>{plan.isArchived ? 'Restore' : 'Archive'}</Button> : <span />}
        <div className="flex gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={busy} onClick={() => void save()}>Save plan</Button></div>
      </div>}>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2"><Input label="Name" placeholder="e.g. Reseller standard, Sales rep" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
        <Input label="One-time amount per new paying merchant (PKR)" inputMode="numeric" placeholder="e.g. 5000" value={f.bounty} onChange={e => setF({ ...f, bounty: e.target.value })} />
        <Input label="Share of what they pay Solvexo (%)" inputMode="decimal" placeholder="e.g. 20" value={f.percent} onChange={e => setF({ ...f, percent: e.target.value })} />
        <Select label="Share is paid for" value={f.months} onChange={e => setF({ ...f, months: e.target.value })}>
          <option value="0">The first payment only</option><option value="3">3 months</option><option value="6">6 months</option>
          <option value="12">12 months</option><option value="24">24 months</option><option value="forever">As long as they pay</option>
        </Select>
        <Input label="Hold before payable (days)" inputMode="numeric" value={f.hold} onChange={e => setF({ ...f, hold: e.target.value })} />
        <Input label="Minimum payout (PKR)" inputMode="numeric" placeholder="0" value={f.minPayout} onChange={e => setF({ ...f, minPayout: e.target.value })} />
      </div>
      <div className="mt-3">
        <p className="text-[12px] font-medium text-charcoal mb-1.5">Volume bonus (optional): a higher share once they have enough paying merchants</p>
        {f.tiers.map((t, i) => (
          <div key={i} className="flex items-center gap-2 mb-1.5 text-[12.5px]">
            <span>From</span><div className="w-20"><Input aria-label={`Tier ${i + 1} paying merchants`} inputMode="numeric" value={t.minPaying} onChange={e => setF({ ...f, tiers: f.tiers.map((x, j) => (j === i ? { ...x, minPaying: e.target.value } : x)) })} /></div>
            <span>paying merchants, earn</span><div className="w-20"><Input aria-label={`Tier ${i + 1} percent`} inputMode="decimal" value={t.percent} onChange={e => setF({ ...f, tiers: f.tiers.map((x, j) => (j === i ? { ...x, percent: e.target.value } : x)) })} /></div><span>%</span>
            <button aria-label={`Remove tier ${i + 1}`} onClick={() => setF({ ...f, tiers: f.tiers.filter((_, j) => j !== i) })} className="bg-transparent border-0 text-slate hover:text-error cursor-pointer"><Trash2 size={13} /></button>
          </div>
        ))}
        {f.tiers.length < 5 && <Button size="xs" variant="ghost" onClick={() => setF({ ...f, tiers: [...f.tiers, { minPaying: '', percent: '' }] })}><Plus size={12} /> Add a level</Button>}
      </div>
      <Textarea label="Notes (optional)" rows={2} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
      <p className="text-[12px] text-charcoal mt-2 rounded-lg bg-cream/70 border border-bone px-3 py-2"><span className="text-slate">Partners on this plan earn: </span>{preview}. Amounts wait {n(f.hold) ?? 0} days (the refund window) before they can be paid.</p>
      {error && <p role="alert" className="mt-2 text-[12px] text-error">{error}</p>}
    </Modal>
  );
}

// ── Partner form ────────────────────────────────────────────────────────────

function PartnerFormModal({ partner, plans, onClose, onSaved }: { partner: PartnerDetail | null; plans: CommissionPlan[]; onClose: () => void; onSaved: (d: PartnerDetail) => void }) {
  const p = partner?.partner;
  const [f, setF] = useState({
    name: p?.name ?? '', kind: (p?.kind ?? 'reseller') as PartnerKind, code: p?.code ?? '', planId: p?.planId ?? plans.find(x => !x.isArchived)?._id ?? '',
    adminId: p?.adminId ?? '', email: p?.email ?? '', phone: p?.phone ?? '', city: p?.city ?? '',
    payoutMethod: (p?.payoutMethod ?? 'bank') as PayoutMethod, payoutDetails: p?.payoutDetails ?? '', status: p?.status ?? 'active', notes: p?.notes ?? '',
  });
  const [logins, setLogins] = useState<PartnerLogin[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { apiPartnerLogins().then(r => setLogins(r.data)).catch(() => setLogins([])); }, []);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF(x => ({ ...x, [k]: e.target.value }));

  const save = async () => {
    if (!f.name.trim()) { setError('Add the partner’s name.'); return; }
    setBusy(true); setError('');
    const orNull = (v: string) => v.trim() || null;
    try {
      onSaved((await apiSavePartner(p?._id ?? null, {
        name: f.name.trim(), kind: f.kind, ...(f.code.trim() ? { code: f.code.trim() } : {}), planId: f.planId || null, adminId: f.adminId || null,
        email: orNull(f.email), phone: orNull(f.phone), city: orNull(f.city), payoutMethod: f.payoutMethod, payoutDetails: orNull(f.payoutDetails),
        status: f.status as 'active' | 'paused', notes: orNull(f.notes),
      })).data);
    } catch (e) { setError(errMsg(e, 'Could not save the partner.')); setBusy(false); }
  };

  return (
    <Modal title={p ? `Edit ${p.name}` : 'New partner'} onClose={onClose} width={620}
      footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={busy} onClick={save}>Save</Button></div>}>
      <div className="grid sm:grid-cols-2 gap-3">
        <Input label="Name" value={f.name} onChange={set('name')} placeholder="Person or company" />
        <Select label="Type" value={f.kind} onChange={set('kind')}>{PARTNER_KINDS.map(k => <option key={k} value={k}>{PARTNER_KIND_LABELS[k]}</option>)}</Select>
        <Select label="Commission plan" value={f.planId} onChange={set('planId')}>
          <option value="">No plan (earns nothing yet)</option>
          {plans.filter(x => !x.isArchived || x._id === f.planId).map(x => <option key={x._id} value={x._id}>{x.name}</option>)}
        </Select>
        <Input label="Referral code" value={f.code} onChange={e => setF(x => ({ ...x, code: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') }))} placeholder={p ? '' : 'Made from the name if left empty'} />
        <Input label="Phone / WhatsApp" value={f.phone} onChange={set('phone')} />
        <Input label="Email" type="email" value={f.email} onChange={set('email')} />
        <Input label="City" value={f.city} onChange={set('city')} />
        <Select label="Login (to see their earnings)" value={f.adminId} onChange={set('adminId')}>
          <option value="">No login</option>
          {logins.filter(l => !l.partnerName || l._id === f.adminId).map(l => <option key={l._id} value={l._id}>{l.name} · {l.email}{l.roleName ? ` (${l.roleName})` : ''}</option>)}
        </Select>
        <Select label="Pay by" value={f.payoutMethod} onChange={set('payoutMethod')}>{PAYOUT_METHODS.map(m => <option key={m} value={m}>{PAYOUT_LABELS[m]}</option>)}</Select>
        <Select label="Status" value={f.status} onChange={set('status')}><option value="active">Active</option><option value="paused">Paused (earns nothing new)</option></Select>
        <div className="sm:col-span-2"><Textarea label="Payout details" rows={2} placeholder="Account title, IBAN / account number, bank — or the JazzCash / Easypaisa number" value={f.payoutDetails} onChange={set('payoutDetails')} /></div>
        <div className="sm:col-span-2"><Textarea label="Notes (managers only)" rows={2} value={f.notes} onChange={set('notes')} /></div>
      </div>
      <p className="text-[11.5px] text-slate mt-2">For an outside partner to log in, invite them in Settings → Team with the “Partner (reseller / agent)” role, then pick their login here. Sales reps can use their own login.</p>
      {error && <p role="alert" className="mt-2 text-[12px] text-error">{error}</p>}
    </Modal>
  );
}

// ── Partner card ────────────────────────────────────────────────────────────

type PartnerSection = 'merchants' | 'statement' | 'payouts';

function PartnerModal({ id, onClose, onChanged, onEdit }: { id: string; onClose: () => void; onChanged: () => void; onEdit: (d: PartnerDetail) => void }) {
  const toast = useStableToast();
  const [d, setD] = useState<PartnerDetail | null>(null);
  const [section, setSection] = useState<PartnerSection>('merchants');
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  useEffect(() => { apiPartner(id).then(r => setD(r.data)).catch(e => { toast.error(errMsg(e, 'Could not load the partner.')); closeRef.current(); }); }, [id, toast]);

  const act = async (fn: () => Promise<{ data: PartnerDetail }>, ok: string) => {
    try { setD((await fn()).data); onChanged(); toast.success(ok); return true; } catch (e) { toast.error(errMsg(e, 'Could not save.')); return false; }
  };

  if (!d) return <Modal title="Partner" onClose={onClose} width={720}><div className="h-40 rounded-xl bg-cream animate-pulse" /></Modal>;
  const { partner: p, balances: b } = d;
  return (
    <Modal title={p.name} onClose={onClose} width={760}
      footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => onEdit(d)}>Edit partner</Button><Button onClick={onClose}>Done</Button></div>}>
      <div className="flex flex-col gap-4 text-[13px]">
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-slate">
          <Badge color={p.status === 'active' ? 'green' : 'gray'} size="sm">{p.status === 'active' ? 'Active' : 'Paused'}</Badge>
          <span>{PARTNER_KIND_LABELS[p.kind]}</span>{p.phone && <span>· {p.phone}</span>}{p.email && <span>· {p.email}</span>}{p.city && <span>· {p.city}</span>}
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate mb-1.5">Referral link</p>
          <div className="flex items-center gap-2 rounded-lg border border-bone bg-cream/60 px-3 py-2"><code className="flex-1 min-w-0 break-all text-[12px]">{d.link}</code><CopyIconButton value={d.link} title="Copy link" size={14} /></div>
          <p className="text-[11.5px] text-slate mt-1">{d.plan ? <>Plan “{d.plan.name}”: {describePlan(d.plan)}.</> : <span className="text-warning">No commission plan: this partner earns nothing until you choose one.</span>}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {([['On hold', b.pendingPKR], ['Payable now', b.payablePKR], ['Paid out', b.paidPKR], ['Earned in total', b.earnedPKR]] as const).map(([k, v]) => (
            <div key={k} className="rounded-lg border border-bone p-2.5"><p className="text-[11px] text-slate">{k}</p><p className="text-[15px] font-bold text-carbon tabular-nums">{formatPKR(v)}</p></div>
          ))}
        </div>

        <div className="flex gap-1 border-b border-bone" role="tablist">
          {(['merchants', 'statement', 'payouts'] as const).map(s => (
            <button key={s} role="tab" aria-selected={section === s} onClick={() => setSection(s)}
              className={clsx('px-3 py-2 text-[12.5px] font-medium border-0 border-b-2 bg-transparent cursor-pointer', section === s ? 'border-brand-orange text-brand-deep-orange' : 'border-transparent text-slate')}>
              {s === 'merchants' ? `Merchants (${d.referrals.length})` : s === 'statement' ? 'Statement' : `Payouts (${d.payouts.length})`}
            </button>
          ))}
        </div>
        {section === 'merchants' && <MerchantsSection d={d} act={act} />}
        {section === 'statement' && <StatementSection partnerId={p._id} />}
        {section === 'payouts' && <PayoutsSection d={d} act={act} />}
      </div>
    </Modal>
  );
}

type Act = (fn: () => Promise<{ data: PartnerDetail }>, ok: string) => Promise<boolean>;

function MerchantsSection({ d, act }: { d: PartnerDetail; act: Act }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      {d.referrals.length === 0 ? <p className="text-slate text-[12.5px]">No merchants yet. Merchants who sign up or book a demo through the link above are added automatically.</p> : (
        <ul className="divide-y divide-bone rounded-lg border border-bone">
          {d.referrals.map(r => (
            <li key={r.sellerId} className="flex items-center gap-3 px-3 py-2">
              <div className="flex-1 min-w-0"><p className="font-medium text-charcoal truncate">{r.merchant}</p><p className="text-[11.5px] text-slate">{REFERRAL_SOURCE_LABELS[r.source] ?? r.source} · counts from {day(r.effectiveFrom)}</p></div>
              <Badge color={r.payingNow ? 'green' : 'gray'} size="sm">{r.payingNow ? 'Paying' : 'Not paying'}</Badge>
              <span className="w-28 text-right tabular-nums">{formatPKR(r.earnedPKR)}</span>
              <button aria-label={`Remove ${r.merchant}`} onClick={() => void act(() => apiRemoveReferral(d.partner._id, r.sellerId), 'Merchant removed from this partner.')} className="bg-transparent border-0 text-slate hover:text-error cursor-pointer"><Trash2 size={13} /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[220px]"><Input label="Credit a merchant by hand" placeholder="The merchant’s account email" value={email} onChange={e => setEmail(e.target.value)} /></div>
        <Button size="sm" variant="outline" loading={busy} disabled={!email.trim()} onClick={async () => { setBusy(true); if (await act(() => apiAddReferral(d.partner._id, { sellerEmail: email.trim() }), 'Merchant credited.')) setEmail(''); setBusy(false); }}>Credit</Button>
      </div>
      <p className="text-[11.5px] text-slate">Crediting by hand replaces any automatic credit for that merchant. Commission starts from their sign-up date.</p>
    </div>
  );
}

function StatementSection({ partnerId, load = apiPartnerStatement }: { partnerId: string; load?: (id: string, month: string) => Promise<{ data: PartnerStatement }> }) {
  const [month, setMonth] = useState(thisMonth);
  const [s, setS] = useState<PartnerStatement | null>(null);
  useEffect(() => { let c = false; load(partnerId, month).then(r => { if (!c) setS(r.data); }).catch(() => { if (!c) setS(null); }); return () => { c = true; }; }, [partnerId, month, load]);
  return <StatementView month={month} onMonth={m => { setS(null); setMonth(m); }} s={s} />;
}

export function StatementView({ month, onMonth, s }: { month: string; onMonth: (m: string) => void; s: PartnerStatement | null }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="w-44"><Input label="Month" type="month" value={month} max={thisMonth()} onChange={e => e.target.value && onMonth(e.target.value)} /></div>
        {s && <Button size="sm" variant="ghost" onClick={() => window.print()}>Print</Button>}
      </div>
      {!s ? <div className="h-24 rounded-lg bg-cream animate-pulse" /> : (
        <>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px]">
            {([['Owed at start', s.openingPKR], ['Earned', s.earnedPKR], ['Paid', s.paidPKR], ['Owed at end', s.closingPKR]] as const).map(([k, v]) => (
              <div key={k} className="rounded-lg border border-bone p-2"><dt className="text-slate">{k}</dt><dd className="text-[14px] font-semibold text-charcoal tabular-nums">{formatPKR(v)}</dd></div>
            ))}
          </dl>
          {s.lines.length === 0 ? <p className="text-slate text-[12.5px]">Nothing earned this month.</p> : (
            <div className="overflow-x-auto rounded-lg border border-bone">
              <table className="w-full text-[12.5px]">
                <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate border-b border-bone"><th className="px-2.5 py-1.5 font-semibold">Date</th><th className="px-2.5 py-1.5 font-semibold">Merchant</th><th className="px-2.5 py-1.5 font-semibold">For</th><th className="px-2.5 py-1.5 font-semibold">Status</th><th className="px-2.5 py-1.5 font-semibold text-right">Amount</th></tr></thead>
                <tbody>
                  {s.lines.map(l => (
                    <tr key={l._id} className="border-b border-bone last:border-0">
                      <td className="px-2.5 py-1.5 whitespace-nowrap text-slate">{day(l.earnedAt)}</td>
                      <td className="px-2.5 py-1.5">{l.merchant ?? '—'}</td>
                      <td className="px-2.5 py-1.5 text-slate">{l.description}</td>
                      <td className="px-2.5 py-1.5"><Badge color={STATUS_COLOR[l.status] ?? 'gray'} size="sm">{LINE_STATUS_LABELS[l.status] ?? l.status}</Badge></td>
                      <td className={clsx('px-2.5 py-1.5 text-right tabular-nums font-medium', l.amountPKR < 0 && 'text-error')}>{formatPKR(l.amountPKR)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {s.payouts.length > 0 && <p className="text-[12px] text-slate">Paid this month: {s.payouts.map(p => `${formatPKR(p.amountPKR)} on ${day(p.paidAt)}${p.reference ? ` (ref ${p.reference})` : ''}`).join('; ')}.</p>}
        </>
      )}
    </div>
  );
}

function PayoutsSection({ d, act }: { d: PartnerDetail; act: Act }) {
  const canPay = can('finance.payouts');
  const [f, setF] = useState({ method: d.partner.payoutMethod, reference: '', paidAt: new Date().toISOString().slice(0, 10), note: '' });
  const [adj, setAdj] = useState({ amount: '', description: '' });
  const [busy, setBusy] = useState<'pay' | 'adj' | null>(null);
  const payable = d.balances.payablePKR;
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-bone p-3">
        <p className="font-semibold text-charcoal">Pay {formatPKR(Math.max(0, payable))}</p>
        <p className="text-[12px] text-slate mb-2">{PAYOUT_LABELS[d.partner.payoutMethod]}{d.partner.payoutDetails ? `: ${d.partner.payoutDetails}` : ' — no payout details saved yet.'}</p>
        {!canPay ? <p className="text-[12px] text-slate">Recording payouts needs the Payouts permission (finance).</p> : payable <= 0 ? <p className="text-[12px] text-slate">Nothing is payable right now.</p> : (
          <div className="grid sm:grid-cols-4 gap-2 items-end">
            <Select label="Paid by" value={f.method} onChange={e => setF({ ...f, method: e.target.value as PayoutMethod })}>{PAYOUT_METHODS.map(m => <option key={m} value={m}>{PAYOUT_LABELS[m]}</option>)}</Select>
            <Input label="Transaction ref" value={f.reference} onChange={e => setF({ ...f, reference: e.target.value })} />
            <Input label="Date paid" type="date" value={f.paidAt} onChange={e => setF({ ...f, paidAt: e.target.value })} />
            <Button loading={busy === 'pay'} onClick={async () => { setBusy('pay'); await act(() => apiRecordPayout(d.partner._id, { method: f.method, reference: f.reference.trim() || undefined, paidAt: new Date(f.paidAt).toISOString(), note: f.note.trim() || undefined }), 'Payout recorded.'); setBusy(null); }}>Record payout</Button>
          </div>
        )}
      </div>
      <div className="rounded-lg border border-bone p-3">
        <p className="font-semibold text-charcoal mb-2">Bonus or deduction</p>
        <div className="grid sm:grid-cols-[140px_1fr_auto] gap-2 items-end">
          <Input label="Amount (PKR)" placeholder="-2000 to deduct" value={adj.amount} onChange={e => setAdj({ ...adj, amount: e.target.value })} />
          <Input label="What for" value={adj.description} onChange={e => setAdj({ ...adj, description: e.target.value })} />
          <Button variant="outline" loading={busy === 'adj'} disabled={!Number(adj.amount.replace(/,/g, '')) || !adj.description.trim()}
            onClick={async () => { setBusy('adj'); if (await act(() => apiAddAdjustment(d.partner._id, { amountPKR: Math.round(Number(adj.amount.replace(/,/g, ''))), description: adj.description.trim() }), 'Added.')) setAdj({ amount: '', description: '' }); setBusy(null); }}>Add</Button>
        </div>
      </div>
      {d.payouts.length > 0 && (
        <ul className="divide-y divide-bone rounded-lg border border-bone">
          {d.payouts.map(p => <li key={p._id} className="flex items-center gap-3 px-3 py-2"><span className="w-28 text-slate">{day(p.paidAt)}</span><span className="w-32 font-semibold tabular-nums">{formatPKR(p.amountPKR)}</span><span className="text-slate">{PAYOUT_LABELS[p.method] ?? p.method}{p.reference ? ` · ${p.reference}` : ''}</span></li>)}
        </ul>
      )}
    </div>
  );
}
