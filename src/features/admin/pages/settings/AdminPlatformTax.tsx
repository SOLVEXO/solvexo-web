import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Landmark, Plus, Trash2, Users } from 'lucide-react';
import { Button, Card, Input, Select, SkeletonBox } from '@/components/comman/ui';
import { useToast } from '@/contexts/ToastContext';
import { COUNTRY_OPTIONS } from '@/utils/countries';
import { TAX_SUGGESTIONS } from '@/utils/taxSuggestions';
import {
  apiApplyPlatformTax, apiGetPlatformTax, apiGetPlatformTaxCoverage, apiUpdatePlatformTax,
  type ApplyTaxResult, type PlatformTaxAuthority, type PlatformTaxGap, type PlatformTaxSettings,
} from '@/api/services/adminPlatformTax';

interface RateRow { key: string; id?: string; country: string; label: string; ratePercent: string; status: 'draft' | 'confirmed'; effectiveFrom: string }
interface Form { legalName: string; authority: PlatformTaxAuthority; ntn: string; strn: string; address: string; rates: RateRow[] }

const AUTHORITIES: { id: PlatformTaxAuthority; label: string }[] = [
  { id: 'FBR', label: 'FBR (Federal Board of Revenue)' }, { id: 'SRB', label: 'SRB (Sindh)' }, { id: 'PRA', label: 'PRA (Punjab)' },
  { id: 'KPRA', label: 'KPRA (Khyber Pakhtunkhwa)' }, { id: 'BRA', label: 'BRA (Balochistan)' }, { id: 'OTHER', label: 'Other' },
];

const GAP_REASON: Record<string, string> = {
  not_listed: 'no rate listed', not_confirmed: 'rate still a draft', not_effective: 'rate has not started yet', no_country: 'store country not set',
};

let rowSeq = 0;
const newKey = () => `row-${++rowSeq}`;

function toForm(s: PlatformTaxSettings): Form {
  return {
    legalName: s.legalName ?? '', authority: (s.authority || 'FBR') as PlatformTaxAuthority, ntn: s.ntn ?? '', strn: s.strn ?? '', address: s.address ?? '',
    rates: (s.rates ?? []).map(r => ({
      key: newKey(), id: r.id, country: r.country, label: r.label, ratePercent: String(r.ratePercent), status: r.status,
      effectiveFrom: r.effectiveFrom ? String(r.effectiveFrom).slice(0, 10) : '',
    })),
  };
}

function errMsg(err: unknown, fallback: string) { return err instanceof Error && err.message ? err.message : fallback; }

/** Admin → Settings → Tax: Solvexo's OWN tax on plan fees (not the stores' sales tax). Only CONFIRMED rates are ever charged. */
export function AdminPlatformTax() {
  const toast = useToast();
  const [form, setForm] = useState<Form | null>(null);
  const [saved, setSaved] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState<'check' | 'apply' | null>(null);
  const [applyResult, setApplyResult] = useState<ApplyTaxResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGetPlatformTax()
      .then(res => { if (cancelled) return; const f = toForm(res.data); setForm(f); setSaved(JSON.stringify(strip(f))); setLoadError(''); })
      .catch((e: unknown) => { if (!cancelled) setLoadError(errMsg(e, 'Could not load tax settings.')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const reload = useCallback(() => { setLoading(true); setLoadError(''); setReloadKey(k => k + 1); }, []);
  const dirty = !!form && JSON.stringify(strip(form)) !== saved;

  const problems = useMemo(() => {
    if (!form) return [] as string[];
    const out: string[] = [];
    const seen = new Set<string>();
    form.rates.forEach((r, i) => {
      const n = i + 1;
      const pct = Number(r.ratePercent);
      if (!r.country) out.push(`Rate ${n}: choose a country.`);
      if (r.ratePercent.trim() === '' || !Number.isFinite(pct) || pct < 0 || pct > 100) out.push(`Rate ${n}: enter a percentage between 0 and 100.`);
      if (r.status === 'confirmed') {
        const k = `${r.country}|${r.effectiveFrom}`;
        if (seen.has(k)) out.push(`Rate ${n}: another confirmed ${r.country} rate starts on the same date.`);
        seen.add(k);
      }
    });
    return out;
  }, [form]);

  const patch = (p: Partial<Form>) => setForm(f => (f ? { ...f, ...p } : f));
  const patchRow = (key: string, p: Partial<RateRow>) => setForm(f => (f ? { ...f, rates: f.rates.map(r => (r.key === key ? { ...r, ...p } : r)) } : f));
  const addRow = (country = '', ratePercent = '', label = 'Sales Tax') => setForm(f => (f ? { ...f, rates: [...f.rates, { key: newKey(), country, label, ratePercent, status: 'draft', effectiveFrom: '' }] } : f));

  const [gaps, setGaps] = useState<PlatformTaxGap[]>([]);
  useEffect(() => {
    let cancelled = false;
    apiGetPlatformTaxCoverage().then(res => { if (!cancelled) setGaps(res.data); }).catch(() => { if (!cancelled) setGaps([]); });
    return () => { cancelled = true; };
  }, [saved, reloadKey]);
  const countryName = (cc: string) => COUNTRY_OPTIONS.find(c => c.code === cc)?.name ?? (cc === 'UNKNOWN' ? 'Country not set' : cc);
  const unusedSuggestions = Object.keys(TAX_SUGGESTIONS).filter(cc => !(form?.rates ?? []).some(r => r.country === cc));

  const save = async () => {
    if (!form || problems.length) return;
    setSaving(true);
    try {
      const res = await apiUpdatePlatformTax({
        legalName: form.legalName.trim(), authority: form.authority, ntn: form.ntn.trim(), strn: form.strn.trim(), address: form.address.trim(),
        rates: form.rates.map(r => ({ id: r.id, country: r.country, label: r.label.trim() || 'Sales Tax', ratePercent: Number(r.ratePercent), status: r.status, effectiveFrom: r.effectiveFrom || null })),
      });
      const f = toForm(res.data);
      setForm(f); setSaved(JSON.stringify(strip(f)));
      toast.success('Tax settings saved');
    } catch (e) {
      toast.error(errMsg(e, 'Could not save tax settings.'));
    } finally { setSaving(false); }
  };

  const runApply = async (dryRun: boolean) => {
    setApplying(dryRun ? 'check' : 'apply');
    try {
      const res = await apiApplyPlatformTax(dryRun);
      setApplyResult(res.data);
      if (!dryRun) toast.success('Tax updated on live subscriptions');
    } catch (e) {
      toast.error(errMsg(e, 'Could not update subscriptions.'));
    } finally { setApplying(null); }
  };

  if (loading && !form) {
    return <div className="px-4 sm:px-7 py-6 flex flex-col gap-3" aria-busy="true"><SkeletonBox width={260} height={14} /><SkeletonBox width="100%" height={140} /><SkeletonBox width="100%" height={200} /></div>;
  }
  if (loadError || !form) {
    return (
      <div className="px-4 sm:px-7 py-6 flex items-center justify-between gap-4">
        <p role="alert" className="flex items-center gap-1.5 text-[12.5px] text-error"><AlertCircle size={14} /> {loadError || 'Could not load.'}</p>
        <Button size="sm" variant="outline" onClick={reload}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-7 py-6 flex flex-col gap-6 max-w-[1100px]">
      <p className="text-[12.5px] text-slate bg-cream rounded-lg px-3 py-2.5 leading-relaxed">
        This is <b>Solvexo&apos;s own tax</b> on the plan fees sellers pay you. It is separate from the sales tax each store charges its own customers.
        Only <b>Confirmed</b> rates are charged, from their start date. A seller&apos;s country with no confirmed rate pays no tax, so add a rate for every country you bill.
        Confirm each rate with your accountant before you switch it on.
      </p>

      {gaps.length > 0 && (
        <div role="alert" className="rounded-lg border border-warning/40 bg-warning-bg px-4 py-3 text-[12.5px] text-charcoal">
          <p className="font-semibold flex items-center gap-1.5"><AlertCircle size={14} /> These paying sellers are not being taxed</p>
          <ul className="mt-1.5 list-disc pl-5">
            {gaps.map(g => (
              <li key={g.country}>{countryName(g.country)}: {g.stores} store{g.stores === 1 ? '' : 's'} ({GAP_REASON[g.reason] ?? g.reason})</li>
            ))}
          </ul>
        </div>
      )}

      <Card padding="none">
        <div className="px-5 pt-5 pb-4 border-b border-bone">
          <h2 className="text-[16px] font-bold text-carbon flex items-center gap-2"><Landmark size={16} /> Tax profile</h2>
          <p className="text-[12px] text-slate mt-0.5">Your registered business details, shown on plan invoices.</p>
        </div>
        <div className="p-5 grid gap-4 sm:grid-cols-2">
          <Input label="Registered business name" value={form.legalName} maxLength={120} onChange={e => patch({ legalName: e.target.value })} />
          <Select label="Tax authority" value={form.authority} onChange={e => patch({ authority: e.target.value as PlatformTaxAuthority })}>
            {AUTHORITIES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
          </Select>
          <Input label="NTN" value={form.ntn} maxLength={30} onChange={e => patch({ ntn: e.target.value })} />
          <Input label="STRN / sales tax registration no." value={form.strn} maxLength={30} onChange={e => patch({ strn: e.target.value })} />
          <div className="sm:col-span-2"><Input label="Registered address" value={form.address} maxLength={300} onChange={e => patch({ address: e.target.value })} /></div>
        </div>
      </Card>

      <Card padding="none">
        <div className="px-5 pt-5 pb-4 border-b border-bone flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-[16px] font-bold text-carbon">Rates by seller country</h2>
            <p className="text-[12px] text-slate mt-0.5">The seller&apos;s store country decides the rate. Tax is added on top of the plan price.</p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            {unusedSuggestions.length > 0 && (
              <Select aria-label="Add a suggested rate as a draft" value="" onChange={e => { const cc = e.target.value; const s = TAX_SUGGESTIONS[cc]; if (s) addRow(cc, String(s.rate), s.label); }}>
                <option value="">Add suggested draft…</option>
                {unusedSuggestions.map(cc => <option key={cc} value={cc}>{countryName(cc)} ({TAX_SUGGESTIONS[cc].rate}%)</option>)}
              </Select>
            )}
            <Button size="sm" icon={<Plus size={13} />} onClick={() => addRow()}>Add rate</Button>
          </div>
        </div>

        {form.rates.length === 0 ? (
          <p className="p-5 text-[13px] text-slate">No rates yet, so no plan fee is taxed. Add Pakistan to start.</p>
        ) : (
          <div className="p-5 flex flex-col gap-3">
            <div className="hidden lg:grid grid-cols-[1.5fr_1fr_90px_150px_130px_36px] gap-3 text-[11px] font-semibold uppercase tracking-wide text-slate px-1">
              <span>Country</span><span>Label on invoice</span><span>Rate %</span><span>Starts on</span><span>Status</span><span />
            </div>
            {form.rates.map((r, i) => (
              <div key={r.key} className="grid grid-cols-2 lg:grid-cols-[1.5fr_1fr_90px_150px_130px_36px] gap-3 items-end rounded-lg border border-bone p-3 lg:border-0 lg:p-0">
                <div className="col-span-2 lg:col-span-1">
                  <Select aria-label={`Rate ${i + 1} country`} value={r.country} onChange={e => patchRow(r.key, { country: e.target.value })}>
                    <option value="">Choose country</option>
                    {COUNTRY_OPTIONS.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </Select>
                </div>
                <Input aria-label={`Rate ${i + 1} label`} value={r.label} maxLength={40} onChange={e => patchRow(r.key, { label: e.target.value })} />
                <Input aria-label={`Rate ${i + 1} percentage`} inputMode="decimal" value={r.ratePercent} placeholder="0" onChange={e => patchRow(r.key, { ratePercent: e.target.value })} />
                <Input aria-label={`Rate ${i + 1} start date`} type="date" value={r.effectiveFrom} onChange={e => patchRow(r.key, { effectiveFrom: e.target.value })} />
                <Select aria-label={`Rate ${i + 1} status`} value={r.status} onChange={e => patchRow(r.key, { status: e.target.value as RateRow['status'] })}>
                  <option value="draft">Draft (not charged)</option>
                  <option value="confirmed">Confirmed</option>
                </Select>
                <button type="button" aria-label={`Remove rate ${i + 1}`} onClick={() => setForm(f => (f ? { ...f, rates: f.rates.filter(x => x.key !== r.key) } : f))}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-md text-slate hover:text-error hover:bg-cream justify-self-end"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card padding="none">
        <div className="px-5 pt-5 pb-4 border-b border-bone">
          <h2 className="text-[16px] font-bold text-carbon flex items-center gap-2"><Users size={16} /> Sellers already paying</h2>
          <p className="text-[12px] text-slate mt-0.5">New subscriptions get the tax automatically. For sellers who already pay, save your rates first, then apply them here. It takes effect from each seller&apos;s next invoice.</p>
        </div>
        <div className="p-5 flex flex-col gap-3">
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => runApply(true)} loading={applying === 'check'} disabled={dirty || !!applying}>Check how many change</Button>
            <Button size="sm" onClick={() => runApply(false)} loading={applying === 'apply'} disabled={dirty || !!applying || !applyResult || applyResult.dryRun === false}>Apply to live subscriptions</Button>
          </div>
          {dirty && <p className="text-[12px] text-slate">Save your changes first.</p>}
          {applyResult && (
            <p role="status" className="flex items-start gap-1.5 text-[12.5px] text-charcoal">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-success" />
              {applyResult.dryRun ? 'Would update' : 'Updated'} {applyResult.total} subscriptions: {applyResult.withTax} with tax, {applyResult.withoutTax} without{applyResult.failed ? `, ${applyResult.failed} failed` : ''}.
            </p>
          )}
        </div>
      </Card>

      <div className="sticky bottom-3 z-10 flex items-center justify-between gap-3 flex-wrap rounded-xl border border-bone bg-white px-4 py-3">
        <div className="text-[12.5px] min-w-0">
          {problems.length > 0 ? <p role="alert" className="text-error">{problems[0]}{problems.length > 1 ? ` (+${problems.length - 1} more)` : ''}</p>
            : dirty ? <p className="text-charcoal">You have unsaved changes.</p> : <p className="text-slate">All changes saved.</p>}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={!dirty || saving} onClick={reload}>Discard</Button>
          <Button size="sm" onClick={save} loading={saving} disabled={!dirty || problems.length > 0}>Save changes</Button>
        </div>
      </div>
    </div>
  );
}

/** Comparable shape (row keys are local only). */
function strip(f: Form) {
  return { ...f, rates: f.rates.map(r => ({ id: r.id, country: r.country, label: r.label, ratePercent: r.ratePercent, status: r.status, effectiveFrom: r.effectiveFrom })) };
}
