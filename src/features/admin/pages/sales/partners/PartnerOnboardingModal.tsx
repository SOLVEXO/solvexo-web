import { useEffect, useRef, useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { AlertTriangle, Check, CheckCircle2, Circle, ExternalLink, Plus, Trash2, Upload, XCircle } from 'lucide-react';
import { Badge, Button, CopyIconButton, Input, Modal, Select, Textarea, DateField } from '@/components/comman/ui';
import {
  DOC_TYPES, MODEL_LABELS, STAGE_COLORS, STAGE_LABELS, TIER_LABELS, apiApprovePartner, apiDocumentUrl, apiInvitePartner, apiPartnerOnboarding,
  apiRecordAgreement, apiRejectPartner, apiReopenPartner, apiReviewDocument, apiSaveStaff, apiSavePartnerProfile, apiSetDemoStores, apiTickChecklist,
  apiUploadPartnerDocument, fmtDay, type ChecklistItem, type PartnerDocType, type PartnerModel, type PartnerOnboarding, type PartnerTier,
} from '@/api/services/partnerProgramme';
import { errMsg, useStableToast } from '../sales.utils';

const DOC_COLOR = { pending: 'yellow', verified: 'green', rejected: 'red' } as const;
const WEEK_LABEL = (w: number) => (w === 0 ? 'Vetting' : `Week ${w}`);

function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="rounded-xl border border-bone bg-white p-4">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate">{title}</p>
        {right}
      </div>
      {children}
    </section>
  );
}

/** Super Admin → Sales Ops → Partners → one partner's vetting and onboarding (Channel Partner Programme B12). */
export function PartnerOnboardingModal({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const toast = useStableToast();
  const [d, setD] = useState<PartnerOnboarding | null>(null);
  const [busy, setBusy] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');

  useEffect(() => {
    apiPartnerOnboarding(id).then(r => setD(r.data)).catch(e => toast.error(errMsg(e, 'Could not load the partner.')));
  }, [id, toast]);

  /** Runs an action that returns the refreshed partner. */
  const act = async (key: string, fn: () => Promise<{ data: PartnerOnboarding; message?: string }>, ok?: string) => {
    setBusy(key);
    try {
      const r = await fn();
      setD(r.data);
      onChanged();
      if (ok) toast.success(ok);
    } catch (e) { toast.error(errMsg(e, 'That did not work.')); }
    setBusy('');
  };

  if (!d) return <Modal title="Partner" onClose={onClose} width={820}><div className="h-48 rounded-xl bg-cream animate-pulse" /></Modal>;

  const invite = () => act('invite', async () => {
    const r = await apiInvitePartner(d._id);
    if (r.inviteUrl) setInviteUrl(r.inviteUrl);
    return r;
  }, 'Login created and invite sent.');
  const reject = () => {
    const reason = window.prompt('Why is this application not taken forward? (sent to the applicant)');
    if (reason?.trim()) void act('reject', () => apiRejectPartner(d._id, reason.trim()), 'Application closed.');
  };

  return (
    <Modal title={d.name} onClose={onClose} width={860}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge color={STAGE_COLORS[d.stage]} dot>{STAGE_LABELS[d.stage]}</Badge>
          {d.model && <Badge color="gray">{MODEL_LABELS[d.model]}{d.resellerMode ? ` · ${d.resellerMode}` : ''}</Badge>}
          {d.tier && <Badge color="gray">{TIER_LABELS[d.tier]}</Badge>}
          <span className="text-[12px] text-slate">{d.entityType === 'business' ? 'Business' : 'Individual'} · {d.city ?? '—'} · code <code>{d.code}</code></span>
        </div>

        {d.attention.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg bg-warning-bg px-3 py-2 text-[12.5px] text-charcoal">
            <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" aria-hidden /> <span>{d.attention.join(' · ')}</span>
          </div>
        )}

        <NextStep d={d} busy={busy} onInvite={invite} onReject={reject}
          onApprove={() => act('approve', () => apiApprovePartner(d._id), 'Partner approved.')}
          onReopen={() => act('reopen', () => apiReopenPartner(d._id), 'Application reopened.')} />
        {inviteUrl && (
          <div className="flex items-center gap-2 rounded-lg border border-bone bg-cream/60 px-3 py-2 text-[12px]">
            <span className="text-slate shrink-0">Invite link (also emailed):</span>
            <code className="flex-1 min-w-0 truncate">{inviteUrl}</code><CopyIconButton value={inviteUrl} title="Copy invite link" size={13} />
          </div>
        )}

        {d.stage === 'agreement' && <AgreementForm d={d} busy={busy === 'agreement'} onSave={body => act('agreement', () => apiRecordAgreement(d._id, body), 'Agreement recorded. The partner now earns commission.')} />}

        <div className="grid lg:grid-cols-2 gap-4">
          <ChecklistSection d={d} busy={busy} onTick={(k, done) => act(`tick:${k}`, () => apiTickChecklist(d._id, k, done))} />
          <div className="flex flex-col gap-4">
            <ProfileSection d={d} busy={busy === 'profile'} onSave={body => act('profile', () => apiSavePartnerProfile(d._id, body), 'Saved.')} />
            {d.agreement && (
              <Section title="Agreement">
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[12.5px]">
                  <dt className="text-slate">Version</dt><dd>{d.agreement.version ?? '—'}</dd>
                  <dt className="text-slate">Signed by</dt><dd>{d.agreement.entity ?? '—'}</dd>
                  <dt className="text-slate">Signed</dt><dd>{fmtDay(d.agreement.signedAt)}</dd>
                  <dt className="text-slate">Pilot ends</dt><dd>{fmtDay(d.agreement.pilotEndsAt)}</dd>
                  <dt className="text-slate">Term ends</dt><dd>{fmtDay(d.agreement.termEndsAt)}</dd>
                  <dt className="text-slate">Notice by</dt><dd>{fmtDay(d.agreement.noticeBy)}</dd>
                </dl>
              </Section>
            )}
          </div>
        </div>

        <DocumentsSection d={d} onChanged={setD} parentChanged={onChanged} />
        <div className="grid lg:grid-cols-2 gap-4">
          {d.entityType === 'business' && <StaffSection d={d} busy={busy === 'staff'} onSave={staff => act('staff', () => apiSaveStaff(d._id, staff), 'Salespeople saved.')} />}
          <DemoStoresSection d={d} busy={busy === 'demo'} onSave={stores => act('demo', () => apiSetDemoStores(d._id, stores), 'Demo stores saved.')} />
        </div>
        {d.application && <ApplicationSection d={d} />}
      </div>
    </Modal>
  );
}

function NextStep({ d, busy, onInvite, onReject, onApprove, onReopen }: { d: PartnerOnboarding; busy: string; onInvite: () => void; onReject: () => void; onApprove: () => void; onReopen: () => void }) {
  const refsOk = d.entityType !== 'business' || d.checklist.find(c => c.key === 'references_checked')?.done;
  let text: string;
  let actions: ReactNode = null;
  switch (d.stage) {
    case 'applied':
      text = 'Read the application. If it is worth taking forward, give them a login so they can upload their documents.';
      actions = <><Button size="sm" loading={busy === 'invite'} onClick={onInvite}>Give login to upload documents</Button><Button size="sm" variant="outline" onClick={onReject}>Not taking forward</Button></>;
      break;
    case 'documents':
    case 'review':
      text = d.docs.allVerified
        ? (refsOk ? 'Every required document is verified. Approve to move on to the agreement.' : 'Documents verified. Tick “References and claimed partnerships checked”, then approve.')
        : `Waiting for documents: ${d.docs.required.length - d.docs.verified.length} of ${d.docs.required.length} still to verify.${d.hasLogin ? '' : ' They have no login yet.'}`;
      actions = <>
        {!d.hasLogin && <Button size="sm" variant="outline" loading={busy === 'invite'} onClick={onInvite}>Give login</Button>}
        <Button size="sm" loading={busy === 'approve'} disabled={!d.docs.allVerified || !refsOk} onClick={onApprove}>Approve</Button>
        <Button size="sm" variant="outline" onClick={onReject}>Not taking forward</Button>
      </>;
      break;
    case 'agreement': text = 'Approved. Record the signed agreement below: the pilot and term dates follow, and the partner starts earning.'; break;
    case 'onboarding': text = 'Onboarding: the checklist ticks itself as things happen. Overdue items are flagged.'; break;
    case 'live': text = 'Onboarding complete.'; break;
    default:
      text = `Not taken forward${d.rejectReason ? `: ${d.rejectReason}` : '.'}`;
      actions = <Button size="sm" variant="outline" loading={busy === 'reopen'} onClick={onReopen}>Reopen</Button>;
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-bone bg-cream/50 px-4 py-3">
      <p className="text-[13px] text-charcoal flex-1 min-w-[240px]">{text}</p>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

function AgreementForm({ d, busy, onSave }: { d: PartnerOnboarding; busy: boolean; onSave: (b: { signedAt: string; version?: string; entity?: string; note?: string }) => void }) {
  const [f, setF] = useState({ signedAt: new Date().toISOString().slice(0, 10), version: '', entity: '', note: '' });
  const hasSigned = d.documents.some(x => x.type === 'agreement');
  return (
    <Section title="Record the signed agreement">
      <div className="grid sm:grid-cols-3 gap-3">
        <DateField label="Date signed" value={f.signedAt} max={new Date().toISOString().slice(0, 10)} onChange={e => setF({ ...f, signedAt: e.target.value })} />
        <Input label="Agreement version" placeholder="From programme settings" value={f.version} onChange={e => setF({ ...f, version: e.target.value })} />
        <Input label="Solvexo entity that signed" placeholder="From programme settings" value={f.entity} onChange={e => setF({ ...f, entity: e.target.value })} />
      </div>
      <div className="mt-3"><Textarea label="Note (optional)" rows={2} value={f.note} onChange={e => setF({ ...f, note: e.target.value })} /></div>
      <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
        <p className="text-[12px] text-slate">{hasSigned ? 'Signed copy uploaded.' : 'Upload the signed copy under Documents (type: Signed partner agreement).'}</p>
        <Button size="sm" loading={busy} onClick={() => onSave({ signedAt: f.signedAt, version: f.version || undefined, entity: f.entity || undefined, note: f.note || undefined })}>Record agreement</Button>
      </div>
    </Section>
  );
}

function ChecklistSection({ d, busy, onTick }: { d: PartnerOnboarding; busy: string; onTick: (key: string, done: boolean) => void }) {
  const weeks = [...new Set(d.checklist.map(c => c.week))];
  const done = d.checklist.filter(c => c.done).length;
  return (
    <Section title="Onboarding checklist" right={<span className="text-[12px] text-slate">{done}/{d.checklist.length} done</span>}>
      <div className="flex flex-col gap-3">
        {weeks.map(w => (
          <div key={w}>
            <p className="text-[11px] font-semibold text-slate mb-1">{WEEK_LABEL(w)}</p>
            <ul className="flex flex-col gap-1 list-none p-0 m-0">
              {d.checklist.filter(c => c.week === w).map(c => <ChecklistRow key={c.key} c={c} busy={busy === `tick:${c.key}`} onTick={onTick} />)}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}

function ChecklistRow({ c, busy, onTick }: { c: ChecklistItem; busy: boolean; onTick: (key: string, done: boolean) => void }) {
  const Icon = c.done ? CheckCircle2 : Circle;
  return (
    <li className="flex items-start gap-2 text-[12.5px]">
      {c.auto ? (
        <Icon size={15} className={clsx('shrink-0 mt-[1px]', c.done ? 'text-success' : 'text-slate/60')} aria-hidden />
      ) : (
        <input type="checkbox" checked={c.done} disabled={busy} onChange={e => onTick(c.key, e.target.checked)} aria-label={c.label} className="accent-brand-orange mt-[3px] cursor-pointer" />
      )}
      <span className="flex-1">
        <span className={clsx(c.done ? 'text-charcoal' : 'text-charcoal/80')}>{c.label}</span>
        <span className="block text-[11px] text-slate">
          {c.auto ? 'Ticks itself' : 'Tick when done'}
          {c.done && c.doneAt ? ` · ${fmtDay(c.doneAt)}` : ''}
          {!c.done && c.dueAt ? <> · due {fmtDay(c.dueAt)}{c.overdue && <span className="text-error font-semibold"> · overdue</span>}</> : null}
        </span>
      </span>
    </li>
  );
}

function ProfileSection({ d, busy, onSave }: { d: PartnerOnboarding; busy: boolean; onSave: (b: Parameters<typeof apiSavePartnerProfile>[1]) => void }) {
  const [f, setF] = useState({
    model: d.model ?? '', resellerMode: d.resellerMode ?? '', tier: d.tier ?? '', territory: d.territory ?? '', exclusive: d.exclusive,
    exclusiveFrom: d.exclusiveFrom?.slice(0, 10) ?? '', exclusiveUntil: d.exclusiveUntil?.slice(0, 10) ?? '', houseAccounts: (d.houseAccounts ?? []).join('\n'),
  });
  const reseller = f.model === 'reseller' || f.model === 'regional';
  return (
    <Section title="Model, tier and territory">
      <div className="grid sm:grid-cols-2 gap-3">
        <Select label="Model" value={f.model} onChange={e => setF({ ...f, model: e.target.value })}>
          <option value="">Not set</option>{Object.entries(MODEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Select label="Agency or resale" value={f.resellerMode} disabled={!reseller} onChange={e => setF({ ...f, resellerMode: e.target.value })}>
          <option value="">Not decided</option><option value="agency">Agency (acts for Solvexo)</option><option value="resale">Resale (bills sellers in PKR)</option>
        </Select>
        <Select label="Tier" value={f.tier} onChange={e => setF({ ...f, tier: e.target.value })}>
          <option value="">Not set</option>{Object.entries(TIER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Input label="Territory" placeholder="e.g. Lahore District" value={f.territory} onChange={e => setF({ ...f, territory: e.target.value })} />
      </div>
      <label className="flex items-center gap-2 text-[12.5px] text-charcoal mt-3 cursor-pointer">
        <input type="checkbox" checked={f.exclusive} onChange={e => setF({ ...f, exclusive: e.target.checked })} className="accent-brand-orange" />
        Exclusive in this territory (B6: only after the pilot milestones are met)
      </label>
      {f.exclusive && (
        <div className="grid sm:grid-cols-2 gap-3 mt-2">
          <DateField label="Exclusive from" value={f.exclusiveFrom} onChange={e => setF({ ...f, exclusiveFrom: e.target.value })} />
          <DateField label="Exclusive until" value={f.exclusiveUntil} onChange={e => setF({ ...f, exclusiveUntil: e.target.value })} />
        </div>
      )}
      <div className="mt-3"><Textarea label="House accounts (one per line: store name or email Solvexo handles directly)" rows={2} value={f.houseAccounts} onChange={e => setF({ ...f, houseAccounts: e.target.value })} /></div>
      {d.tierRule && (
        <p className="text-[11.5px] text-slate mt-2">
          {TIER_LABELS[d.tierRule.key]} tier: commission {d.tierRule.commissionPercent === null ? 'not set yet' : `${d.tierRule.commissionPercent}%`}
          {!d.tierRule.commissionApproved && ' (awaiting management approval)'} · {d.tierRule.demoStores} demo store{d.tierRule.demoStores === 1 ? '' : 's'}.
        </p>
      )}
      <div className="flex justify-end mt-3">
        <Button size="sm" loading={busy} onClick={() => onSave({
          model: (f.model || null) as PartnerModel | null, resellerMode: reseller ? ((f.resellerMode || null) as 'agency' | 'resale' | null) : null,
          tier: (f.tier || null) as PartnerTier | null, territory: f.territory.trim() || null, exclusive: f.exclusive,
          exclusiveFrom: f.exclusive && f.exclusiveFrom ? f.exclusiveFrom : null, exclusiveUntil: f.exclusive && f.exclusiveUntil ? f.exclusiveUntil : null,
          houseAccounts: f.houseAccounts.split('\n').map(s => s.trim()).filter(Boolean),
        })}>Save</Button>
      </div>
    </Section>
  );
}

function DocumentsSection({ d, onChanged, parentChanged }: { d: PartnerOnboarding; onChanged: (d: PartnerOnboarding) => void; parentChanged: () => void }) {
  const toast = useStableToast();
  const [type, setType] = useState<PartnerDocType>(d.docs.missing[0] ?? 'other');
  const [busy, setBusy] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const reload = async () => { onChanged((await apiPartnerOnboarding(d._id)).data); parentChanged(); };
  const status = (t: PartnerDocType) => d.documents.filter(x => x.type === t).at(-1)?.status ?? null;

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy('upload');
    try { await apiUploadPartnerDocument(d._id, type, file); await reload(); toast.success('Document uploaded.'); } catch (e) { toast.error(errMsg(e, 'Upload failed.')); }
    setBusy('');
    if (fileRef.current) fileRef.current.value = '';
  };
  const review = async (docId: string, s: 'verified' | 'rejected') => {
    let note: string | undefined;
    if (s === 'rejected') {
      note = window.prompt('What is wrong with this document? (sent to the partner)')?.trim();
      if (!note) return;
    }
    setBusy(docId);
    try { onChanged((await apiReviewDocument(d._id, docId, s, note)).data); parentChanged(); } catch (e) { toast.error(errMsg(e, 'Could not save.')); }
    setBusy('');
  };
  const open = async (docId: string) => {
    try { window.open((await apiDocumentUrl(d._id, docId)).data.url, '_blank', 'noopener'); } catch (e) { toast.error(errMsg(e, 'Could not open the document.')); }
  };

  return (
    <Section title="Documents (B12)" right={<span className="text-[12px] text-slate">{d.docs.verified.length}/{d.docs.required.length} required verified</span>}>
      <ul className="flex flex-wrap gap-1.5 list-none p-0 m-0 mb-3">
        {d.docs.required.map(t => {
          const s = status(t);
          return <li key={t}><Badge color={s ? DOC_COLOR[s] : 'gray'} dot>{shortDoc(t)}: {s ?? 'missing'}</Badge></li>;
        })}
      </ul>
      {d.documents.length === 0 ? <p className="text-[12.5px] text-slate">Nothing uploaded yet.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <tbody>
              {[...d.documents].reverse().map(x => (
                <tr key={x._id} className="border-b border-bone last:border-0 align-top">
                  <td className="py-1.5 pr-2">
                    <p className="font-medium text-charcoal">{shortDoc(x.type)}</p>
                    <p className="text-[11px] text-slate break-all">{x.fileName} · {x.uploadedByRole === 'partner' ? 'by partner' : 'by Solvexo'} · {fmtDay(x.uploadedAt)}</p>
                    {x.reviewNote && <p className="text-[11px] text-error">{x.reviewNote}</p>}
                  </td>
                  <td className="py-1.5 pr-2"><Badge color={DOC_COLOR[x.status]} dot>{x.status}</Badge></td>
                  <td className="py-1.5 text-right whitespace-nowrap">
                    <Button size="xs" variant="ghost" onClick={() => open(x._id)} aria-label={`Open ${x.fileName}`}><ExternalLink size={12} /></Button>
                    {x.status !== 'verified' && <Button size="xs" variant="ghost" loading={busy === x._id} onClick={() => review(x._id, 'verified')}><Check size={12} /> Verify</Button>}
                    {x.status !== 'rejected' && <Button size="xs" variant="ghost" onClick={() => review(x._id, 'rejected')}><XCircle size={12} /> Reject</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex flex-wrap items-end gap-2 mt-3">
        <div className="flex-1 min-w-[220px]">
          <Select label="Upload a document for them" value={type} onChange={e => setType(e.target.value as PartnerDocType)}>
            {DOC_TYPES.map(t => <option key={t} value={t}>{d.docs.labels[t] ?? t}</option>)}
          </Select>
        </div>
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={e => upload(e.target.files?.[0])} />
        <Button size="sm" variant="outline" loading={busy === 'upload'} onClick={() => fileRef.current?.click()}><Upload size={13} /> Choose file</Button>
      </div>
    </Section>
  );
}

const SHORT: Record<PartnerDocType, string> = {
  company_registration: 'Company registration', ntn: 'NTN / sales tax', cnic: 'CNIC', bank_account: 'Bank account', partnership_proof: 'Partnership proof',
  business_plan: 'Business plan', reference_letter: 'Reference letter', agreement: 'Signed agreement', other: 'Other',
};
const shortDoc = (t: PartnerDocType) => SHORT[t] ?? t;

function StaffSection({ d, busy, onSave }: { d: PartnerOnboarding; busy: boolean; onSave: (s: { name: string; phone: string | null; email: string | null; certified: boolean }[]) => void }) {
  const [rows, setRows] = useState(d.staff.map(s => ({ name: s.name, phone: s.phone ?? '', email: s.email ?? '', certified: !!s.certifiedAt })));
  const set = (i: number, patch: Partial<(typeof rows)[number]>) => setRows(r => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const need = d.tierRule?.certifiedStaff ?? 0;
  return (
    <Section title="Salespeople" right={<span className="text-[12px] text-slate">{rows.filter(r => r.certified).length} certified{need ? ` · ${need} needed for ${TIER_LABELS[d.tierRule!.key]}` : ''}</span>}>
      <div className="flex flex-col gap-2">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
            <input aria-label="Name" placeholder="Name" value={r.name} onChange={e => set(i, { name: e.target.value })} className="rounded-lg border border-bone px-2.5 py-1.5 text-[12.5px]" />
            <input aria-label="Phone" placeholder="Phone" value={r.phone} onChange={e => set(i, { phone: e.target.value })} className="rounded-lg border border-bone px-2.5 py-1.5 text-[12.5px]" />
            <label className="flex items-center gap-1 text-[12px] whitespace-nowrap cursor-pointer" title="Ran a live demo for Solvexo">
              <input type="checkbox" checked={r.certified} onChange={e => set(i, { certified: e.target.checked })} className="accent-brand-orange" /> Certified
            </label>
            <button type="button" aria-label="Remove" onClick={() => setRows(rs => rs.filter((_, j) => j !== i))} className="text-slate hover:text-error bg-transparent border-0 cursor-pointer"><Trash2 size={14} /></button>
          </div>
        ))}
        <div className="flex justify-between">
          <Button size="xs" variant="ghost" onClick={() => setRows(r => [...r, { name: '', phone: '', email: '', certified: false }])}><Plus size={12} /> Add salesperson</Button>
          <Button size="sm" loading={busy} onClick={() => onSave(rows.filter(r => r.name.trim()).map(r => ({ name: r.name.trim(), phone: r.phone.trim() || null, email: r.email.trim() || null, certified: r.certified })))}>Save</Button>
        </div>
      </div>
    </Section>
  );
}

function DemoStoresSection({ d, busy, onSave }: { d: PartnerOnboarding; busy: boolean; onSave: (s: string[]) => void }) {
  const [text, setText] = useState(d.demoStores.map(s => s.slug).join(', '));
  const allowed = d.tierRule?.demoStores ?? null;
  return (
    <Section title="Demo stores (not for resale)" right={allowed !== null ? <span className="text-[12px] text-slate">{d.demoStores.length}/{allowed} for this tier</span> : undefined}>
      {d.demoStores.length > 0 && <ul className="text-[12.5px] list-disc pl-5 mb-2">{d.demoStores.map(s => <li key={s._id}>{s.name} <span className="text-slate">({s.slug})</span></li>)}</ul>}
      <Input label="Store addresses or IDs, separated by commas" placeholder="e.g. lahore-demo-1" value={text} onChange={e => setText(e.target.value)} />
      <div className="flex justify-end mt-2"><Button size="sm" loading={busy} onClick={() => onSave(text.split(',').map(s => s.trim()).filter(Boolean))}>Save</Button></div>
    </Section>
  );
}

function ApplicationSection({ d }: { d: PartnerOnboarding }) {
  const a = d.application!;
  const rows: [string, ReactNode][] = [
    ['Contact', `${a.contactName ?? '—'}${a.contactRole ? ` (${a.contactRole})` : ''}`],
    ['Email / phone', `${d.email ?? '—'} · ${d.phone ?? '—'}`],
    ['Registered name', a.legalName ?? '—'], ['Registration no.', a.registrationNo ?? '—'], ['NTN', a.ntn ?? '—'], ['Address', a.address ?? '—'],
    ['Team size', a.teamSize ?? '—'], ['Sales by', a.salesContact ?? '—'], ['Support by', a.supportContact ?? '—'], ['Website', a.website ?? '—'],
    ['Claimed partnerships', a.claimedPartnerships ?? '—'], ['Segments', a.segments ?? '—'], ['First 90 days', a.plan90 ?? '—'],
    ['Heard about us', a.heardFrom ?? '—'], ['Message', a.message ?? '—'], ['Applied', fmtDay(d.appliedAt)],
  ];
  return (
    <Section title="Application">
      <dl className="grid sm:grid-cols-[180px_1fr] gap-x-3 gap-y-1 text-[12.5px]">
        {rows.map(([k, v]) => <div key={k} className="contents"><dt className="text-slate">{k}</dt><dd className="whitespace-pre-wrap break-words">{v}</dd></div>)}
      </dl>
      {(a.references ?? []).length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] font-semibold text-slate mb-1">References</p>
          <ul className="text-[12.5px] list-disc pl-5">{a.references!.map((r, i) => <li key={i}>{r.name}{r.company ? `, ${r.company}` : ''} · {[r.phone, r.email].filter(Boolean).join(' · ')}</li>)}</ul>
        </div>
      )}
    </Section>
  );
}
