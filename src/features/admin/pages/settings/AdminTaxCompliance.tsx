import { useState } from 'react';
import { AlertCircle, CheckCircle2, Circle, ShieldCheck } from 'lucide-react';
import { Button, Input, Select } from '@/components/comman/ui';
import { SettingsCard } from '@/components/comman/settings';
import { useKeyedLoad } from '@/components/comman/dashboard/useKeyedLoad';
import { useToast } from '@/contexts/ToastContext';
import { isTeamAdminSession } from '@/hooks/auth/useCan';
import { COMPLIANCE_STEPS, LIVE_CONFIRMATION, PRODUCTION_LOCK_NOTE, complianceBadge, type ComplianceState } from '@/utils/complianceWording';
import { apiApproveLive, apiGetCompliance, apiMarkResearched, apiRevokeLive, apiSaveVerifiedRule, apiVerifyRules, type ComplianceView } from '@/api/services/taxCompliance';

const errMsg = (e: unknown, fb: string) => (e instanceof Error && e.message ? e.message : fb);
const fmt = (d: string) => new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const rank = (s: ComplianceState) => COMPLIANCE_STEPS.findIndex(x => x.state === s);

/**
 * Admin → Settings → Tax: how far Solvexo's own FBR registration has been taken (research, rules, sandbox, live approval). Anyone with
 * billing access reads it; only the Super Admin can move it up. It falls back by itself when the registration, rules, adapter or token change.
 */
export function AdminTaxCompliance() {
  const toast = useToast();
  const { data: loaded, error, retry } = useKeyedLoad(async () => (await apiGetCompliance()).data, 'compliance');
  const [fresh, setFresh] = useState<ComplianceView | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [src, setSrc] = useState(''); const [acc, setAcc] = useState(''); const [note, setNote] = useState('');
  const [rule, setRule] = useState({ country: 'PK', treatment: 'taxable', rate: '', source: '', accountant: '' });
  const [typed, setTyped] = useState('');

  const view = fresh ?? loaded;
  const readOnly = isTeamAdminSession();
  if (error && !view) {
    return (
      <div className="px-4 sm:px-7 pb-6">
        <div role="alert" className="rounded-xl border border-error/30 bg-error-bg px-4 py-3 text-[12.5px] text-error flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5"><AlertCircle size={14} />{error}</span>
          <Button size="sm" variant="outline" onClick={retry}>Try again</Button>
        </div>
      </div>
    );
  }
  if (!view) return <div className="px-4 sm:px-7 pb-6"><div className="h-32 rounded-xl bg-bone animate-pulse" aria-label="Loading tax compliance" /></div>;

  const run = async (key: string, fn: () => Promise<{ data: ComplianceView }>, ok: string) => {
    setBusy(key);
    try { setFresh((await fn()).data); toast.success(ok); } catch (e) { toast.error(errMsg(e, 'Could not do that.')); } finally { setBusy(null); }
  };
  const at = rank(view.state);
  const badge = complianceBadge(view.state, view.liveApprovedAt);

  return (
    <div className="px-4 sm:px-7 pb-8 flex flex-col gap-5">
      <SettingsCard title="Tax compliance status" icon={<ShieldCheck size={14} />} description="How far Solvexo's own registration has been taken. It only moves up when the Super Admin says so, and it moves back down by itself if the registration, the verified rules, the filing code or the sandbox token change.">
        <div className="flex flex-col gap-4">
          <p data-testid="compliance-badge" className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-semibold ${view.state === 'live_approved' ? 'bg-success-bg text-success' : 'bg-bone text-charcoal'}`}>{badge}</p>
          <ol className="grid gap-2 sm:grid-cols-5">
            {COMPLIANCE_STEPS.map((s, i) => (
              <li key={s.state} className={`rounded-lg border px-3 py-2 text-[12px] ${i <= at ? 'border-success/40 bg-success-bg/40' : 'border-bone'}`}>
                <p className="font-semibold text-charcoal flex items-center gap-1.5">{i <= at ? <CheckCircle2 size={13} className="text-success" /> : <Circle size={13} className="text-slate" />}{s.label}</p>
                <p className="mt-1 text-slate leading-snug">{s.what}</p>
              </li>
            ))}
          </ol>
          <p className="text-[12px] text-slate">{PRODUCTION_LOCK_NOTE}</p>
          {readOnly && <p role="status" className="text-[12.5px] text-charcoal bg-cream rounded-lg px-3 py-2">You can read this page. Only the Super Admin can verify rules or approve live filing.</p>}
        </div>
      </SettingsCard>

      <SettingsCard title="Verified tax rules" icon={<CheckCircle2 size={14} />} description="A rule counts as verified only when its source and the accountant who confirmed it are written down. The country rates in the table above stay 'legacy' until they are verified here.">
        {view.verifiedRules.length === 0 ? <p className="text-[13px] text-slate mb-3">No verified rules yet. Invoices are held, not sent, until a rule is verified.</p> : (
          <ul className="mb-3 divide-y divide-fog border-y border-fog">
            {view.verifiedRules.map(r => (
              <li key={`${r.country}-${r.supplyType}`} className="py-2 text-[12.5px]">
                <b>{r.country}</b> · {r.supplyType} · {r.treatment}{r.ratePercent ? ` ${r.ratePercent}%` : ''}
                <span className="block text-[11.5px] text-slate">Source: {r.source} · accountant: {r.accountantName}{r.verifiedAt ? ` · ${fmt(r.verifiedAt)}` : ''}</span>
              </li>
            ))}
          </ul>
        )}
        {!readOnly && (
          <div className="grid gap-3 sm:grid-cols-6 items-end">
            <Input label="Country" value={rule.country} maxLength={2} onChange={e => setRule(r => ({ ...r, country: e.target.value.toUpperCase() }))} />
            <Select label="Treatment" value={rule.treatment} onChange={e => setRule(r => ({ ...r, treatment: e.target.value }))}>
              <option value="taxable">Taxable</option><option value="zero_rated">Zero-rated</option><option value="exempt">Exempt</option><option value="out_of_scope">Out of scope</option>
            </Select>
            <Input label="Rate %" inputMode="decimal" value={rule.rate} disabled={rule.treatment !== 'taxable'} onChange={e => setRule(r => ({ ...r, rate: e.target.value }))} />
            <Input label="Source (law / notice)" value={rule.source} maxLength={300} onChange={e => setRule(r => ({ ...r, source: e.target.value }))} />
            <Input label="Accountant" value={rule.accountant} maxLength={120} onChange={e => setRule(r => ({ ...r, accountant: e.target.value }))} />
            <Button size="sm" loading={busy === 'rule'} disabled={!rule.source.trim() || !rule.accountant.trim()}
              onClick={() => run('rule', () => apiSaveVerifiedRule({ country: rule.country, treatment: rule.treatment, ratePercent: rule.treatment === 'taxable' ? Number(rule.rate) : null, source: rule.source, accountantName: rule.accountant }), 'Rule saved as verified.')}>Save rule</Button>
          </div>
        )}
      </SettingsCard>

      {!readOnly && (
        <SettingsCard title="Move to the next step" icon={<ShieldCheck size={14} />} description="Each step needs its evidence. Saving or changing a rule above sends the status back to Researched.">
          <div className="flex flex-col gap-4">
            {view.state === 'unsupported' && (
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end">
                <Input label="Where did the research come from?" value={src} maxLength={300} onChange={e => setSrc(e.target.value)} />
                <Input label="Note (optional)" value={note} maxLength={500} onChange={e => setNote(e.target.value)} />
                <Button size="sm" loading={busy === 'research'} disabled={!src.trim()} onClick={() => run('research', () => apiMarkResearched({ source: src, note }), 'Marked as researched.')}>Mark researched</Button>
              </div>
            )}
            {view.state === 'researched' && (
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end">
                <Input label="Source of the verification" value={src} maxLength={300} onChange={e => setSrc(e.target.value)} />
                <Input label="Accountant who confirmed" value={acc} maxLength={120} onChange={e => setAcc(e.target.value)} />
                <Button size="sm" loading={busy === 'verify'} disabled={!src.trim() || !acc.trim() || view.verifiedRules.length === 0}
                  onClick={() => run('verify', () => apiVerifyRules({ source: src, accountantName: acc }), 'Rules verified.')}>Verify rules</Button>
              </div>
            )}
            {view.state === 'rules_verified' && <p className="text-[12.5px] text-charcoal">Next: run <b>Test with FBR sandbox</b> in the FBR digital invoicing card above. A passing test moves this to Sandbox tested by itself.</p>}
            {view.state === 'sandbox_tested' && (
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
                <Input label={`Type ${LIVE_CONFIRMATION} to approve live filing`} value={typed} onChange={e => setTyped(e.target.value)} />
                <Button size="sm" loading={busy === 'approve'} disabled={typed !== LIVE_CONFIRMATION} onClick={() => run('approve', () => apiApproveLive(typed), 'Live filing approved.')}>Approve live filing</Button>
              </div>
            )}
            {view.state === 'live_approved' && <Button size="sm" variant="outline" loading={busy === 'revoke'} onClick={() => run('revoke', () => apiRevokeLive(), 'Live approval withdrawn.')}>Withdraw live approval</Button>}
          </div>
        </SettingsCard>
      )}

      <SettingsCard title="History" icon={<Circle size={14} />} description="Every change of status: who, when and on what evidence.">
        {view.history.length === 0 ? <p className="text-[13px] text-slate">No changes yet.</p> : (
          <ul className="divide-y divide-fog border-y border-fog">
            {view.history.map((h, i) => (
              <li key={i} className="py-2 text-[12.5px]">
                <b>{h.from} → {h.to}</b> · {fmt(h.at)} · {h.auto ? 'by the system' : h.byName ?? h.by}
                {(h.source || h.accountantName || h.note) && <span className="block text-[11.5px] text-slate">{[h.source && `Source: ${h.source}`, h.accountantName && `Accountant: ${h.accountantName}`, h.note].filter(Boolean).join(' · ')}</span>}
              </li>
            ))}
          </ul>
        )}
      </SettingsCard>
    </div>
  );
}
