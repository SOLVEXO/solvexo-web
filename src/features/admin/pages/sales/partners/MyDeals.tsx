import { useEffect, useState, type FormEvent } from 'react';
import { Badge, Button, Input, Select, Textarea } from '@/components/comman/ui';
import {
  DEAL_STATUS_COLORS, DEAL_STATUS_LABELS, PROGRESS_LABELS, apiMyDeals, apiRegisterDeal, apiRequestExtension, fmtDay, type Deal, type DealProgress,
} from '@/api/services/partnerProgramme';
import { errMsg, useStableToast } from '../sales.utils';

const EMPTY = { businessName: '', contactName: '', phone: '', email: '', city: '', link: '', notes: '' };

/** The partner's own deal registrations (programme B7): register a prospect, see decisions and protection. */
export function MyDeals() {
  const toast = useStableToast();
  const [d, setD] = useState<{ canRegister: boolean; protectionDays: number; responseDays: number; deals: Deal[] } | null>(null);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = () => apiMyDeals().then(r => setD(r.data)).catch(() => setD(null));
  useEffect(() => { void load(); }, []);
  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => setF(x => ({ ...x, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.businessName.trim()) return setError('Enter the business name.');
    if (!f.phone.trim() && !f.email.trim()) return setError('Add their phone or email.');
    if (!consent) return setError('Only register a seller who agreed to it.');
    setBusy(true); setError('');
    try {
      const r = await apiRegisterDeal({ ...f, consent: true });
      toast.success(r.message ?? 'Registered.');
      setF(EMPTY); setConsent(false); setOpen(false); void load();
    } catch (err) { setError(errMsg(err, 'Could not register.')); }
    setBusy(false);
  };
  const [asking, setAsking] = useState<string | null>(null);
  const [progress, setProgress] = useState<DealProgress>('demo_held');
  const askMore = async (deal: Deal) => {
    try { await apiRequestExtension(deal._id, progress); toast.success('Extension requested.'); setAsking(null); void load(); } catch (err) { toast.error(errMsg(err, 'Could not ask.')); }
  };

  if (!d) return null;
  return (
    <section className="rounded-xl border border-bone bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate">Deal registrations</p>
        {d.canRegister && !open && <Button size="sm" onClick={() => setOpen(true)}>Register a prospect</Button>}
      </div>
      <p className="text-[12px] text-slate mb-3">
        Register a seller you are working with, with their permission. Solvexo replies within {d.responseDays} working days; an accepted registration is protected for {d.protectionDays} days, and longer when you show progress. If they sign up with the same phone or email, they are credited to you. The seller can always choose to buy directly or through another partner.
      </p>
      {open && (
        <form onSubmit={submit} className="flex flex-col gap-3 rounded-lg border border-bone bg-cream/40 p-3 mb-3" noValidate>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="Business name" value={f.businessName} onChange={set('businessName')} />
            <Input label="Contact person" value={f.contactName} onChange={set('contactName')} />
            <Input label="Phone / WhatsApp" type="tel" inputMode="tel" value={f.phone} onChange={set('phone')} />
            <Input label="Email" type="email" value={f.email} onChange={set('email')} />
            <Input label="City" value={f.city} onChange={set('city')} />
            <Input label="Facebook / Instagram / website (optional)" value={f.link} onChange={set('link')} />
          </div>
          <Textarea label="Notes (optional)" rows={2} value={f.notes} onChange={set('notes')} />
          <label className="flex items-start gap-2 text-[12.5px] cursor-pointer">
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="accent-brand-orange mt-0.5" />
            The seller agreed that I register them with Solvexo.
          </label>
          {error && <p className="text-[12.5px] text-error" role="alert">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" type="button" onClick={() => { setOpen(false); setError(''); }}>Cancel</Button>
            <Button size="sm" type="submit" loading={busy}>Register</Button>
          </div>
        </form>
      )}
      {d.deals.length === 0 ? <p className="text-[12.5px] text-slate">No registrations yet.</p> : (
        <ul className="flex flex-col list-none p-0 m-0">
          {d.deals.map(x => (
            <li key={x._id} className="flex flex-wrap items-start gap-2 border-b border-bone last:border-0 py-2">
              <div className="flex-1 min-w-[200px]">
                <p className="text-[13px] font-medium text-charcoal">{x.businessName}</p>
                <p className="text-[11.5px] text-slate">
                  Registered {fmtDay(x.submittedAt)}
                  {x.status === 'pending' && ` · reply by ${fmtDay(x.decisionDueAt)}`}
                  {x.status === 'accepted' && x.protectedUntil && ` · protected until ${fmtDay(x.protectedUntil)}`}
                  {x.wonAt && ` · signed up ${fmtDay(x.wonAt)}`}
                </p>
                {x.rejectReason && <p className="text-[11.5px] text-slate">{x.rejectReason}</p>}
                {x.extensionRequest && <p className="text-[11.5px] text-slate">Extension asked: {PROGRESS_LABELS[x.extensionRequest.progress]}</p>}
              </div>
              <Badge color={DEAL_STATUS_COLORS[x.status]} dot>{DEAL_STATUS_LABELS[x.status]}</Badge>
              {x.status === 'accepted' && !x.extensionRequest && (asking === x._id ? (
                <span className="flex items-end gap-1.5">
                  <Select label="Progress" value={progress} onChange={e => setProgress(e.target.value as DealProgress)}>
                    {Object.entries(PROGRESS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </Select>
                  <Button size="xs" onClick={() => askMore(x)}>Ask</Button>
                </span>
              ) : <Button size="xs" variant="ghost" onClick={() => setAsking(x._id)}>Ask for more time</Button>)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
