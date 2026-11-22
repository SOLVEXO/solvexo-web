import { useState, type FormEvent } from 'react';
import { Building2, Check, Handshake, Repeat, ShieldCheck, Store, User } from 'lucide-react';
import { clsx } from 'clsx';
import { Button, Footer, Input, Select, Textarea } from '@/components/comman/ui';
import { usePageTitle } from '@/hooks/usePageTitle';
import { apiApplyPartner, type PartnerApplication, type PartnerEntity } from '@/api/services/partnerProgramme';

/** B1 of the Channel Partner Programme, using only approved claims. No commission figures: those await approval. */
const WHY = [
  { icon: Store, title: 'A product sellers already need', text: 'Shops and social sellers want to be online without juggling five tools.' },
  { icon: ShieldCheck, title: 'Low-risk to sell', text: 'A 7-day free trial with no card needed, and 0% commission on cash on delivery and in-store sales.' },
  { icon: Repeat, title: 'Recurring income', text: 'You earn on every month your sellers stay subscribed, not just once.' },
  { icon: Handshake, title: 'A real local role', text: 'Sellers want someone nearby to set them up and answer the phone. That’s your value, and you get paid for it.' },
];
/** B2 */
const MODELS = [
  { name: 'Referral Agent', who: 'Individuals: freelancers, consultants, trainers', what: 'Introduce sellers with your partner link or code.' },
  { name: 'Authorised Reseller', who: 'Registered businesses with a sales team', what: 'Sell, onboard and give first-line support.' },
  { name: 'Service Partner', who: 'Agencies, IT firms, photographers, designers', what: 'Paid setup work: store design, product upload, training.' },
  { name: 'Regional Partner', who: 'A Gold reseller who has met regional milestones', what: 'Everything a reseller does, plus building the market in a defined region. By invitation.' },
];
const STEPS = [
  'Apply below. We reply within 2 working days.',
  'Upload your documents in your partner login (registration, CNIC, bank account; a short plan for businesses).',
  'Sign the partner agreement. Every term, including commission, is in writing.',
  'Your first 30 days: demo store, training, certification, first sellers live.',
];

type Form = Omit<PartnerApplication, 'references' | 'entityType' | 'consent'> & { ref1: string; ref1Phone: string; ref2: string; ref2Phone: string };
const EMPTY: Form = {
  contactName: '', contactRole: '', legalName: '', email: '', phone: '', city: '', registrationNo: '', ntn: '', address: '', teamSize: '',
  salesContact: '', supportContact: '', website: '', claimedPartnerships: '', segments: '', plan90: '', heardFrom: '', message: '', model: 'reseller',
  ref1: '', ref1Phone: '', ref2: '', ref2Phone: '', website2: '',
};

/** solvexo.store/partners — the Channel Partner Programme and its application form. */
export function PartnersPage() {
  usePageTitle('Become a partner');
  const [entity, setEntity] = useState<PartnerEntity>('business');
  const [f, setF] = useState<Form>(EMPTY);
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF(x => ({ ...x, [k]: e.target.value }));
  const biz = entity === 'business';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.contactName.trim()) return setError('Enter your name.');
    if (biz && !f.legalName?.trim()) return setError('Enter the registered business name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) return setError('Enter a valid email address.');
    if (f.phone.replace(/\D/g, '').length < 10) return setError('Enter a mobile number we can call or WhatsApp.');
    if (!f.city.trim()) return setError('Enter your city.');
    if (!consent) return setError('Please agree to be contacted about the partner programme.');
    setError(''); setSending(true);
    const { ref1, ref1Phone, ref2, ref2Phone, ...rest } = f;
    try {
      const r = await apiApplyPartner({
        ...rest, entityType: entity, model: biz ? rest.model : undefined, consent: true,
        references: biz ? [{ name: ref1, phone: ref1Phone }, { name: ref2, phone: ref2Phone }].filter(x => x.name.trim()) : [],
      });
      setDone(r.message ?? 'Thank you. We will contact you within 2 working days.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your application. Please try again.');
    }
    setSending(false);
  };

  return (
    <div className="bg-cream min-h-full">
      <section className="px-4 md:px-8 pt-14 md:pt-20 pb-10 max-w-[760px] mx-auto text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-pale-orange px-3 py-1 text-[12.5px] font-semibold text-brand-orange">
          <Handshake size={14} aria-hidden /> Solvexo Channel Partner Programme
        </p>
        <h1 className="mt-5 text-[32px] sm:text-[42px] font-semibold leading-[1.15] tracking-[-0.03em] text-carbon">Become a Solvexo partner</h1>
        <p className="mt-3 text-[16px] leading-[1.65] text-slate">
          Help shops and sellers in your city go online and sell in person with Solvexo, and earn on every month they stay subscribed.
        </p>
      </section>

      <section className="max-w-[960px] mx-auto px-4 md:px-8 pb-12 grid sm:grid-cols-2 gap-3">
        {WHY.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex gap-3 rounded-2xl bg-white border border-bone p-4">
            <span className="size-10 shrink-0 rounded-xl bg-brand-pale-orange text-brand-orange inline-flex items-center justify-center"><Icon size={19} aria-hidden /></span>
            <span><span className="block font-semibold text-carbon text-[14px]">{title}</span><span className="text-[13px] text-slate">{text}</span></span>
          </div>
        ))}
      </section>

      <section className="max-w-[960px] mx-auto px-4 md:px-8 pb-12">
        <h2 className="text-[22px] font-semibold text-carbon text-center">Ways to partner</h2>
        <div className="mt-5 grid sm:grid-cols-2 gap-3">
          {MODELS.map(m => (
            <div key={m.name} className="rounded-2xl bg-white border border-bone p-4">
              <p className="font-semibold text-carbon text-[14px]">{m.name}</p>
              <p className="text-[12.5px] text-slate mt-0.5">{m.who}</p>
              <p className="text-[13px] text-charcoal mt-1.5">{m.what}</p>
            </div>
          ))}
        </div>
        <p className="text-[12.5px] text-slate text-center mt-3">Commission is earned from real sales to real sellers. Nothing is paid for recruiting other partners.</p>
      </section>

      <section className="max-w-[760px] mx-auto px-4 md:px-8 pb-12">
        <h2 className="text-[22px] font-semibold text-carbon text-center">How joining works</h2>
        <ol className="mt-5 flex flex-col gap-2 list-none p-0">
          {STEPS.map((s, i) => (
            <li key={s} className="flex gap-3 rounded-xl bg-white border border-bone p-3.5">
              <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-pale-orange text-brand-orange font-bold text-[13px]">{i + 1}</span>
              <span className="text-[13.5px] text-charcoal pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-white border-t border-b border-bone" id="apply">
        <div className="max-w-[640px] mx-auto px-4 md:px-8 py-12">
          {done ? (
            <div className="flex flex-col items-center text-center gap-3 py-6" role="status">
              <div className="w-12 h-12 rounded-full bg-success-bg flex items-center justify-center"><Check size={22} className="text-success" /></div>
              <p className="text-[16px] font-bold text-carbon">Application received</p>
              <p className="text-[13px] text-slate max-w-[400px]">{done}</p>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
              <h2 className="text-[22px] font-semibold text-carbon">Apply to become a partner</h2>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Applying as">
                {([['business', 'A business', Building2], ['individual', 'An individual', User]] as const).map(([k, label, Icon]) => (
                  <button key={k} type="button" role="radio" aria-checked={entity === k} onClick={() => setEntity(k)}
                    className={clsx('flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-[13.5px] font-medium cursor-pointer', entity === k ? 'border-brand-orange bg-brand-pale-orange text-carbon' : 'border-bone bg-white text-charcoal')}>
                    <Icon size={16} aria-hidden /> {label}
                  </button>
                ))}
              </div>
              <p className="text-[12.5px] text-slate -mt-2">{biz ? 'Authorised Reseller or Service Partner: a registered business with a team.' : 'Referral Agent: you introduce sellers with your partner link.'}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Your name" autoComplete="name" value={f.contactName} onChange={set('contactName')} />
                {biz && <Input label="Your role" placeholder="e.g. Director" value={f.contactRole ?? ''} onChange={set('contactRole')} />}
                {biz && <Input label="Registered business name" autoComplete="organization" value={f.legalName ?? ''} onChange={set('legalName')} />}
                {biz && (
                  <Select label="How you want to partner" value={f.model} onChange={set('model')}>
                    <option value="reseller">Authorised Reseller (sell, onboard, support)</option>
                    <option value="service">Service Partner (setup work)</option>
                  </Select>
                )}
                <Input label="Email" type="email" dir="ltr" autoComplete="email" value={f.email} onChange={set('email')} />
                <Input label="Mobile / WhatsApp" type="tel" dir="ltr" autoComplete="tel" inputMode="tel" placeholder="03XX XXXXXXX" value={f.phone} onChange={set('phone')} />
                <Input label="City" autoComplete="address-level2" value={f.city} onChange={set('city')} />
                {biz && <Input label="Team size" inputMode="numeric" value={f.teamSize ?? ''} onChange={set('teamSize')} />}
              </div>

              {biz && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="SECP / registration number" value={f.registrationNo ?? ''} onChange={set('registrationNo')} />
                    <Input label="NTN (if registered)" value={f.ntn ?? ''} onChange={set('ntn')} />
                    <Input label="Who will do sales?" value={f.salesContact ?? ''} onChange={set('salesContact')} />
                    <Input label="Who will do support?" value={f.supportContact ?? ''} onChange={set('supportContact')} />
                  </div>
                  <Input label="Office address" autoComplete="street-address" value={f.address ?? ''} onChange={set('address')} />
                  <Input label="Partnerships you already have (e.g. Alibaba), if any" value={f.claimedPartnerships ?? ''} onChange={set('claimedPartnerships')} />
                  <Textarea label="Who will you sell to, and your plan for the first 90 days?" rows={3} value={f.plan90 ?? ''} onChange={set('plan90')} />
                  <div>
                    <p className="text-[13px] font-medium text-charcoal mb-1.5">Two business references</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input aria-label="Reference 1 name and company" placeholder="Reference 1: name, company" value={f.ref1} onChange={set('ref1')} />
                      <Input aria-label="Reference 1 phone" placeholder="Phone" inputMode="tel" value={f.ref1Phone} onChange={set('ref1Phone')} />
                      <Input aria-label="Reference 2 name and company" placeholder="Reference 2: name, company" value={f.ref2} onChange={set('ref2')} />
                      <Input aria-label="Reference 2 phone" placeholder="Phone" inputMode="tel" value={f.ref2Phone} onChange={set('ref2Phone')} />
                    </div>
                  </div>
                </>
              )}
              <Textarea label="Anything else? (optional)" rows={2} value={f.message ?? ''} onChange={set('message')} />
              <Input label="How did you hear about Solvexo? (optional)" value={f.heardFrom ?? ''} onChange={set('heardFrom')} />
              {/* Honeypot: hidden from people, bots fill it. */}
              <div aria-hidden className="absolute -left-[9999px] w-px h-px overflow-hidden">
                <label>Website<input tabIndex={-1} autoComplete="off" value={f.website2} onChange={set('website2')} /></label>
              </div>
              <label className="flex items-start gap-2 text-[12.5px] text-charcoal cursor-pointer">
                <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="accent-brand-orange mt-0.5" />
                Solvexo may contact me about the partner programme. I understand that commission, territory and all other terms are only binding once a partner agreement is signed.
              </label>
              {error && <p className="text-[13px] text-error" role="alert">{error}</p>}
              <Button type="submit" variant="primary" fullWidth loading={sending}>Send application</Button>
            </form>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
