import { useEffect, useState, type ReactNode } from 'react';
import { Badge, Button, Input, Modal } from '@/components/comman/ui';
import { TIER_LABELS, apiProgrammeSettings, apiSaveProgrammeSettings, type ProgrammeSettings, type TierRule } from '@/api/services/partnerProgramme';
import { errMsg, useStableToast } from '../sales.utils';

type NumKey = 'pilotDays' | 'termMonths' | 'noticeDays' | 'dealResponseWorkingDays' | 'dealProtectionDays' | 'pilotMinPayingSellers'
  | 'pilotMinLiveStores' | 'pilotMaxComplaintRatePercent' | 'activationBonusPKR' | 'minPayoutPKR' | 'statementDay' | 'payoutDay'
  | 'cardFeePercent' | 'cardFeeFixedUSD' | 'withholdingTaxPercent' | 'supportNoticeDays';

/** Fields, grouped as in the programme document. `nullable`: may stay empty ("not decided yet"). */
const GROUPS: { title: string; ref: string; fields: { key: NumKey; label: string; nullable?: boolean }[] }[] = [
  { title: 'Term', ref: 'B14', fields: [{ key: 'pilotDays', label: 'Pilot (days)' }, { key: 'termMonths', label: 'Term (months)' }, { key: 'noticeDays', label: 'Notice (days)' }] },
  { title: 'Pilot milestones', ref: 'B6', fields: [
    { key: 'pilotMinPayingSellers', label: 'X: paying sellers', nullable: true }, { key: 'pilotMinLiveStores', label: 'Y: stores live (5+ products)', nullable: true },
    { key: 'pilotMaxComplaintRatePercent', label: 'Z: complaint rate under (%)', nullable: true },
  ] },
  { title: 'Deal registration', ref: 'B7', fields: [{ key: 'dealResponseWorkingDays', label: 'Reply within (working days)' }, { key: 'dealProtectionDays', label: 'Protection (days)' }] },
  { title: 'Payments', ref: 'A3 / B4', fields: [
    { key: 'activationBonusPKR', label: 'Activation bonus (PKR)', nullable: true }, { key: 'minPayoutPKR', label: 'Minimum payout (PKR)', nullable: true },
    { key: 'statementDay', label: 'Statement by (day of month)' }, { key: 'payoutDay', label: 'Payment by (day of month)' },
    { key: 'withholdingTaxPercent', label: 'Withholding tax on payouts (%)', nullable: true },
  ] },
  { title: 'Commission base', ref: 'B4.1 / B4.4', fields: [
    { key: 'cardFeePercent', label: 'Card processing fee (%)', nullable: true }, { key: 'cardFeeFixedUSD', label: 'Card fee per payment (US$)', nullable: true },
    { key: 'supportNoticeDays', label: 'Notice before commission on a seller ends (days)' },
  ] },
];

const numOrNull = (s: string) => (s.trim() === '' ? null : Number(s));

/** Every "requires management approval" value, prefilled with the programme document's proposals. */
export function ProgrammeSettingsModal({ onClose }: { onClose: () => void }) {
  const toast = useStableToast();
  const [s, setS] = useState<ProgrammeSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { apiProgrammeSettings().then(r => setS(r.data)).catch(e => setError(errMsg(e, 'Could not load the settings.'))); }, []);

  const approved = (k: string) => !!s?.approvedKeys.includes(k);
  const toggleApproved = (k: string) => s && setS({ ...s, approvedKeys: approved(k) ? s.approvedKeys.filter(x => x !== k) : [...s.approvedKeys, k] });
  const setTier = (key: TierRule['key'], patch: Partial<TierRule>) => s && setS({ ...s, tiers: s.tiers.map(t => (t.key === key ? { ...t, ...patch } : t)) });

  const save = async () => {
    if (!s) return;
    setBusy(true); setError('');
    try { setS((await apiSaveProgrammeSettings(s)).data); toast.success('Programme settings saved.'); onClose(); }
    catch (e) { setError(errMsg(e, 'Could not save.')); }
    setBusy(false);
  };

  const box = (k: string) => <ApprovedBox checked={approved(k)} onToggle={() => toggleApproved(k)} />;

  return (
    <Modal title="Partner programme settings" onClose={onClose} width={820}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button loading={busy} disabled={!s} onClick={save}>Save</Button></>}>
      {!s ? <div className="h-40 rounded-xl bg-cream animate-pulse">{error && <p className="p-4 text-error text-[13px]">{error}</p>}</div> : (
        <div className="flex flex-col gap-3">
          <p className="text-[12.5px] text-slate">
            Values come from the programme document (v0.1). Empty means management has not decided yet. Tick <strong>Approved</strong> once a value is final: until then partners and managers see it marked “awaiting approval”.
          </p>
          <Group title="Tiers" refText="B3" right={box('tiers')}>
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead><tr className="text-left text-[11px] text-slate">
                  <th className="py-1 pr-2 font-semibold">Tier</th><th className="py-1 pr-2 font-semibold">Paying sellers</th><th className="py-1 pr-2 font-semibold">Retention target %</th>
                  <th className="py-1 pr-2 font-semibold">Certified staff</th><th className="py-1 pr-2 font-semibold">Commission %</th><th className="py-1 font-semibold">Demo stores</th>
                </tr></thead>
                <tbody>
                  {s.tiers.map(t => (
                    <tr key={t.key}>
                      <td className="py-1 pr-2 font-medium">{TIER_LABELS[t.key]}</td>
                      {(['minPayingSellers', 'retentionTargetPercent', 'certifiedStaff', 'commissionPercent', 'demoStores'] as const).map(k => (
                        <td key={k} className="py-1 pr-2">
                          <input aria-label={`${TIER_LABELS[t.key]} ${k}`} inputMode="decimal" value={t[k] ?? ''} placeholder={k === 'minPayingSellers' && t.key === 'regional' ? 'invite' : 'not set'}
                            onChange={e => setTier(t.key, { [k]: k === 'certifiedStaff' || k === 'demoStores' ? (numOrNull(e.target.value) ?? 0) : numOrNull(e.target.value) })}
                            className="w-20 rounded-lg border border-bone px-2 py-1 text-[12.5px]" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Group>
          <div className="grid md:grid-cols-2 gap-3">
            {GROUPS.map(g => (
              <Group key={g.title} title={g.title} refText={g.ref}>
                <div className="flex flex-col gap-2">
                  {g.fields.map(f => (
                    <div key={f.key} className="flex items-end gap-2">
                      <div className="flex-1">
                        <Input label={f.label} inputMode="decimal" value={s[f.key] ?? ''} placeholder={f.nullable ? 'Not decided' : undefined}
                          onChange={e => setS({ ...s, [f.key]: numOrNull(e.target.value) })} />
                      </div>
                      <div className="pb-2.5">{box(f.key)}</div>
                    </div>
                  ))}
                </div>
              </Group>
            ))}
            <Group title="Agreement" refText="A3 #9">
              <div className="flex flex-col gap-2">
                <div className="flex items-end gap-2">
                  <div className="flex-1"><Input label="Agreement version" value={s.agreementVersion} onChange={e => setS({ ...s, agreementVersion: e.target.value })} /></div>
                  <div className="pb-2.5">{box('agreementVersion')}</div>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1"><Input label="Solvexo entity that signs" placeholder="Solvexo LLC or i9 Experts (Pvt) Ltd" value={s.signingEntity ?? ''} onChange={e => setS({ ...s, signingEntity: e.target.value || null })} /></div>
                  <div className="pb-2.5">{box('signingEntity')}</div>
                </div>
              </div>
            </Group>
          </div>
          <p className="text-[12px] text-slate">
            The card fee is taken out of the commission base only for card payments made after it is set{s.cardFeeFrom ? ` (in force since ${new Date(s.cardFeeFrom).toLocaleDateString()})` : ''}, so commission already earned never goes down. The activation bonus is paid once per seller that has paid for 2 full months and still pays; leave it empty for none.
          </p>
          <p className="text-[12px] text-slate">
            Still awaiting approval: <Badge color="yellow">{['tiers', ...GROUPS.flatMap(g => g.fields.map(f => f.key)), 'agreementVersion', 'signingEntity'].filter(k => !approved(k)).length}</Badge> values.
          </p>
          {error && <p className="text-[12.5px] text-error" role="alert">{error}</p>}
        </div>
      )}
    </Modal>
  );
}

function ApprovedBox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <label className="flex items-center gap-1.5 text-[11.5px] text-slate cursor-pointer whitespace-nowrap">
      <input type="checkbox" checked={checked} onChange={onToggle} className="accent-brand-orange" /> Approved
    </label>
  );
}

function Group({ title, refText, children, right }: { title: string; refText: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="rounded-xl border border-bone p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-[12.5px] font-semibold text-charcoal">{title} <span className="text-slate font-normal">({refText})</span></p>
        {right}
      </div>
      {children}
    </section>
  );
}
