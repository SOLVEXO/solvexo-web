import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, Megaphone, Plus, Trash2 } from 'lucide-react';
import { Button, CopyIconButton, EmptyState, Input, MetricCard, Modal, Select, Textarea } from '@/components/comman/ui';
import {
  CAMPAIGN_CHANNELS, CHANNEL_LABELS, apiAddSpend, apiGetCampaign, apiListCampaigns, apiRemoveSpend, apiSaveCampaign, formatPKR,
  type CampaignChannel, type CampaignDetail, type CampaignInput, type CampaignList,
} from '@/api/services/salesOps';
import { StageBadge } from './parts';
import { errMsg, useStableToast } from './sales.utils';

const LANDING_PAGES = [
  { path: '/book-demo', label: 'Book a demo' }, { path: '/', label: 'Home page' }, { path: '/pricing', label: 'Pricing' },
  { path: '/sellers', label: 'For Sellers' }, { path: '/register?role=seller', label: 'Sign-up page' },
];
const toCode = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 60);
const dateOnly = (iso: string | null) => (iso ? iso.slice(0, 10) : '');
const money = (n: number | null) => (n === null ? '—' : formatPKR(n));

/** Super Admin → Sales Ops → Campaigns: what each campaign cost and what it brought in, down to paying customers. */
export function CampaignsTab() {
  const toast = useStableToast();
  const [archived, setArchived] = useState(false);
  const [data, setData] = useState<CampaignList | null>(null);
  const [tick, setTick] = useState(0);
  const [form, setForm] = useState<{ campaign: CampaignDetail | null; code?: string } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const reload = () => setTick(t => t + 1);

  useEffect(() => {
    let cancelled = false;
    apiListCampaigns(archived).then(r => { if (!cancelled) setData(r.data); })
      .catch(e => { if (!cancelled) { setData({ campaigns: [], totals: { spendPKR: 0, leads: 0, signups: 0, paying: 0, mrrUSD: 0, costPerPayingPKR: null }, untracked: [], pkrPerUSD: null }); toast.error(errMsg(e, 'Could not load campaigns.')); } });
    return () => { cancelled = true; };
  }, [archived, tick, toast]);

  const t = data?.totals;
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Spent" value={formatPKR(t?.spendPKR)} loading={!data} />
        <MetricCard label="Leads" value={t?.leads ?? 0} loading={!data} sub={t ? `${t.signups} signed up` : undefined} />
        <MetricCard label="Paying customers" value={t?.paying ?? 0} loading={!data} sub={t && t.mrrUSD > 0 ? `MRR $${t.mrrUSD.toLocaleString()}` : undefined} />
        <MetricCard label="Cost per paying customer" value={money(t?.costPerPayingPKR ?? null)} loading={!data} />
      </div>

      {data && data.untracked.length > 0 && (
        <div className="rounded-xl border border-warning/40 bg-warning-bg/40 p-3 text-[12.5px] text-charcoal">
          <p className="font-semibold mb-1.5">People are arriving from links that aren’t tracked yet</p>
          <div className="flex flex-wrap gap-2">
            {data.untracked.map(u => (
              <button key={u.code} onClick={() => setForm({ campaign: null, code: u.code })}
                className="inline-flex items-center gap-1.5 rounded-full border border-bone bg-white px-2.5 py-1 cursor-pointer hover:border-brand-orange/60">
                <code>{u.code}</code><span className="text-slate">{u.leads} lead{u.leads === 1 ? '' : 's'} · {u.signups} sign-up{u.signups === 1 ? '' : 's'}</span><Plus size={12} className="text-brand-orange" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-[12.5px] text-slate cursor-pointer">
          <input type="checkbox" className="accent-brand-orange" checked={archived} onChange={e => { setData(null); setArchived(e.target.checked); }} /> Show archived
        </label>
        <Button onClick={() => setForm({ campaign: null })}><Plus size={14} /> New campaign</Button>
      </div>

      {!data ? <div className="h-40 rounded-xl bg-cream animate-pulse" /> : !data.campaigns.length ? (
        <EmptyState icon={<Megaphone size={28} />} title="No campaigns yet"
          description="Create a campaign for each ad, post, influencer or event. Share its link, log what you spend, and see how many paying customers it brings."
          action={{ label: 'New campaign', onClick: () => setForm({ campaign: null }) }} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-bone bg-white">
          <table className="w-full text-[13px]">
            <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate border-b border-bone">
              <th className="px-3 py-2 font-semibold">Campaign</th><th className="px-3 py-2 font-semibold text-right">Spent</th>
              <th className="px-3 py-2 font-semibold text-right">Leads</th><th className="px-3 py-2 font-semibold text-right">Sign-ups</th>
              <th className="px-3 py-2 font-semibold text-right">Trials</th><th className="px-3 py-2 font-semibold text-right">Paying</th>
              <th className="px-3 py-2 font-semibold text-right">MRR</th><th className="px-3 py-2 font-semibold text-right">Cost / paying</th>
            </tr></thead>
            <tbody>
              {data.campaigns.map(c => (
                <tr key={c.id} onClick={() => setOpenId(c.id)} className="border-b border-bone last:border-0 hover:bg-cream cursor-pointer">
                  <td className="px-3 py-2">
                    <p className="font-medium text-charcoal">{c.name}{c.isArchived && <span className="ml-1.5 text-[11px] text-slate">(archived)</span>}</p>
                    <p className="text-[11.5px] text-slate">{CHANNEL_LABELS[c.channel] ?? c.channel} · <code>{c.code}</code></p>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatPKR(c.spendPKR)}{c.budgetPKR ? <p className="text-[11px] text-slate">of {formatPKR(c.budgetPKR)}</p> : null}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.leads}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.signups}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.trials}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">{c.paying}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.mrrPKR !== null ? formatPKR(c.mrrPKR) : `$${c.mrrUSD}`}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{money(c.costPerPayingPKR)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data?.pkrPerUSD && <p className="text-[11.5px] text-slate">MRR in PKR uses today’s rate (1 USD = {data.pkrPerUSD} PKR). A sign-up counts when the merchant arrived through the campaign’s link or was one of its leads.</p>}

      {form && <CampaignFormModal campaign={form.campaign} initialCode={form.code} onClose={() => setForm(null)} onSaved={c => { setForm(null); reload(); setOpenId(c.id); toast.success('Campaign saved.'); }} />}
      {openId && <CampaignModal id={openId} onClose={() => setOpenId(null)} onChanged={reload} onEdit={c => { setOpenId(null); setForm({ campaign: c }); }} />}
    </div>
  );
}

function CampaignFormModal({ campaign, initialCode, onClose, onSaved }: { campaign: CampaignDetail | null; initialCode?: string; onClose: () => void; onSaved: (c: CampaignDetail) => void }) {
  const [f, setF] = useState({
    name: campaign?.name ?? (initialCode ? initialCode.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase()) : ''),
    code: campaign?.code ?? initialCode ?? '', codeTouched: !!campaign || !!initialCode,
    channel: (campaign?.channel ?? 'facebook') as CampaignChannel, landingPath: campaign?.landingPath ?? '/book-demo',
    startDate: dateOnly(campaign?.startDate ?? null), endDate: dateOnly(campaign?.endDate ?? null),
    budgetPKR: campaign?.budgetPKR != null ? String(campaign.budgetPKR) : '', notes: campaign?.notes ?? '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const presets = LANDING_PAGES.some(p => p.path === f.landingPath);

  const save = async () => {
    if (!f.name.trim()) { setError('Give the campaign a name.'); return; }
    const budget = f.budgetPKR.trim() ? Number(f.budgetPKR.replace(/,/g, '')) : null;
    if (budget !== null && (!Number.isFinite(budget) || budget < 0)) { setError('Budget must be a number in PKR.'); return; }
    setBusy(true); setError('');
    const body: CampaignInput = {
      name: f.name.trim(), code: f.code.trim() || toCode(f.name), channel: f.channel, landingPath: f.landingPath,
      startDate: f.startDate ? new Date(f.startDate).toISOString() : null, endDate: f.endDate ? new Date(f.endDate).toISOString() : null,
      budgetPKR: budget, notes: f.notes.trim() || null,
    };
    try { onSaved((await apiSaveCampaign(campaign?.id ?? null, body)).data); }
    catch (e) { setError(errMsg(e, 'Could not save the campaign.')); setBusy(false); }
  };

  return (
    <Modal title={campaign ? 'Edit campaign' : 'New campaign'} onClose={onClose} width={560}
      footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={busy} onClick={save}>Save</Button></div>}>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2"><Input label="Name" placeholder="e.g. Eid sale — Facebook" value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value, code: p.codeTouched ? p.code : toCode(e.target.value) }))} /></div>
        <Select label="Channel" value={f.channel} onChange={e => setF(p => ({ ...p, channel: e.target.value as CampaignChannel }))}>
          {CAMPAIGN_CHANNELS.map(c => <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>)}
        </Select>
        <Input label="Link code" value={f.code} onChange={e => setF(p => ({ ...p, code: toCode(e.target.value), codeTouched: true }))} />
        <Select label="Link opens" value={presets ? f.landingPath : 'custom'} onChange={e => setF(p => ({ ...p, landingPath: e.target.value === 'custom' ? '/' : e.target.value }))}>
          {LANDING_PAGES.map(p => <option key={p.path} value={p.path}>{p.label}</option>)}<option value="custom">Another page…</option>
        </Select>
        {!presets ? <Input label="Page path" value={f.landingPath} onChange={e => setF(p => ({ ...p, landingPath: e.target.value }))} placeholder="/solutions/fashion" /> : <Input label="Budget (PKR)" inputMode="numeric" value={f.budgetPKR} onChange={e => setF(p => ({ ...p, budgetPKR: e.target.value }))} />}
        <Input label="Starts" type="date" value={f.startDate} onChange={e => setF(p => ({ ...p, startDate: e.target.value }))} />
        <Input label="Ends" type="date" value={f.endDate} onChange={e => setF(p => ({ ...p, endDate: e.target.value }))} />
        {!presets && <Input label="Budget (PKR)" inputMode="numeric" value={f.budgetPKR} onChange={e => setF(p => ({ ...p, budgetPKR: e.target.value }))} />}
        <div className="sm:col-span-2"><Textarea label="Notes" rows={2} value={f.notes} onChange={e => setF(p => ({ ...p, notes: e.target.value }))} /></div>
      </div>
      <p className="text-[11.5px] text-slate mt-2">The link code goes on every link you share (as utm_campaign). Changing it later stops counting people who used the old links.</p>
      {error && <p role="alert" className="mt-2 text-[12px] text-error">{error}</p>}
    </Modal>
  );
}

function CampaignModal({ id, onClose, onChanged, onEdit }: { id: string; onClose: () => void; onChanged: () => void; onEdit: (c: CampaignDetail) => void }) {
  const toast = useStableToast();
  const [c, setC] = useState<CampaignDetail | null>(null);
  const [spend, setSpend] = useState({ date: new Date().toISOString().slice(0, 10), amount: '', note: '' });
  const [busy, setBusy] = useState(false);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  useEffect(() => { apiGetCampaign(id).then(r => setC(r.data)).catch(e => { toast.error(errMsg(e, 'Could not load the campaign.')); closeRef.current(); }); }, [id, toast]);

  const run = async (fn: () => Promise<{ data: CampaignDetail }>, ok: string) => {
    setBusy(true);
    try { setC((await fn()).data); onChanged(); toast.success(ok); return true; }
    catch (e) { toast.error(errMsg(e, 'Could not save.')); return false; }
    finally { setBusy(false); }
  };

  if (!c) return <Modal title="Campaign" onClose={onClose} width={640}><div className="h-40 rounded-xl bg-cream animate-pulse" /></Modal>;
  const funnel: [string, number | string][] = [['Leads', c.leads], ['Sign-ups', c.signups], ['Trials', c.trials], ['Paying', c.paying], ['Paying now', c.payingNow]];

  return (
    <Modal title={c.name} onClose={onClose} width={680}
      footer={<div className="flex justify-between gap-2 w-full">
        <Button variant="ghost" onClick={() => void run(() => apiSaveCampaign(c.id, { isArchived: !c.isArchived }), c.isArchived ? 'Campaign restored.' : 'Campaign archived.')}><Archive size={14} /> {c.isArchived ? 'Restore' : 'Archive'}</Button>
        <div className="flex gap-2"><Button variant="outline" onClick={() => onEdit(c)}>Edit</Button><Button onClick={onClose}>Done</Button></div>
      </div>}>
      <div className="flex flex-col gap-4 text-[13px]">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate mb-1.5">Share this link</p>
          <div className="flex items-center gap-2 rounded-lg border border-bone bg-cream/60 px-3 py-2">
            <code className="flex-1 min-w-0 break-all text-[12px] text-charcoal">{c.link}</code>
            {c.link && <CopyIconButton value={c.link} title="Copy link" size={14} />}
          </div>
          <p className="text-[11.5px] text-slate mt-1">{CHANNEL_LABELS[c.channel]} · everyone who arrives through this link and books a demo or signs up is counted here.</p>
        </div>

        <div className="grid grid-cols-5 gap-2 text-center">
          {funnel.map(([label, v]) => (
            <div key={label} className="rounded-lg border border-bone p-2"><p className="text-[18px] font-bold text-carbon tabular-nums">{v}</p><p className="text-[11px] text-slate">{label}</p></div>
          ))}
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px]">
          {([['Spent', formatPKR(c.spendPKR) + (c.budgetPKR ? ` of ${formatPKR(c.budgetPKR)}` : '')], ['MRR', c.mrrPKR !== null ? formatPKR(c.mrrPKR) : `$${c.mrrUSD}`],
            ['Cost per lead', money(c.costPerLeadPKR)], ['Cost per paying', money(c.costPerPayingPKR)],
            ['Cost per sign-up', money(c.costPerSignupPKR)], ['Earns back spend in', c.paybackMonths !== null ? `${c.paybackMonths} months` : '—']] as const).map(([k, v]) => (
            <div key={k}><dt className="text-slate">{k}</dt><dd className="font-semibold text-charcoal">{v}</dd></div>
          ))}
        </dl>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate mb-1.5">Spend</p>
          <div className="flex flex-wrap items-end gap-2 mb-2">
            <div className="w-36"><Input aria-label="Spend date" type="date" value={spend.date} onChange={e => setSpend(s => ({ ...s, date: e.target.value }))} /></div>
            <div className="w-32"><Input aria-label="Amount (PKR)" inputMode="numeric" placeholder="PKR" value={spend.amount} onChange={e => setSpend(s => ({ ...s, amount: e.target.value }))} /></div>
            <div className="flex-1 min-w-[140px]"><Input aria-label="Spend note" placeholder="What for (optional)" value={spend.note} onChange={e => setSpend(s => ({ ...s, note: e.target.value }))} /></div>
            <Button size="sm" loading={busy} disabled={!(Number(spend.amount.replace(/,/g, '')) > 0) || !spend.date}
              onClick={async () => { if (await run(() => apiAddSpend(c.id, { date: new Date(spend.date).toISOString(), amountPKR: Number(spend.amount.replace(/,/g, '')), note: spend.note.trim() || undefined }), 'Spend added.')) setSpend(s => ({ ...s, amount: '', note: '' })); }}>
              <Plus size={14} /> Add
            </Button>
          </div>
          {c.spend.length === 0 ? <p className="text-[12px] text-slate">Nothing logged yet. Add each top-up, boost or fee as you pay it.</p> : (
            <ul className="divide-y divide-bone rounded-lg border border-bone">
              {c.spend.map(s => (
                <li key={s._id} className="flex items-center gap-3 px-3 py-1.5">
                  <span className="w-24 text-slate text-[12px]">{new Date(s.date).toLocaleDateString()}</span>
                  <span className="w-28 font-medium tabular-nums">{formatPKR(s.amountPKR)}</span>
                  <span className="flex-1 min-w-0 truncate text-slate text-[12px]">{s.note}</span>
                  <button aria-label={`Remove ${formatPKR(s.amountPKR)} spend`} onClick={() => void run(() => apiRemoveSpend(c.id, s._id), 'Spend removed.')} className="bg-transparent border-0 text-slate hover:text-error cursor-pointer"><Trash2 size={13} /></button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {c.recentLeads.length > 0 && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate mb-1.5">Leads from this campaign</p>
            <ul className="flex flex-col gap-1">
              {c.recentLeads.slice(0, 10).map(l => (
                <li key={l._id} className="flex items-center gap-2"><Link to={`/admin/sales/leads/${l._id}`} onClick={onClose} className="text-charcoal hover:text-brand-orange font-medium">{l.name}</Link><span className="text-slate text-[12px] truncate">{l.businessName}</span><span className="ml-auto"><StageBadge stage={l.stage} /></span></li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}

