import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { AlertTriangle, ArrowLeft, Camera, CloudUpload, Loader2, MapPin, WifiOff, X } from 'lucide-react';
import { Button } from '@/components/comman/ui';
import { TokenStorage } from '@/api/services/auth';
import { apiCheckVisit, apiSaveVisit, apiVisitAreas, type VisitMatch } from '@/api/services/salesVisits';
import { VISIT_OPTIONS, optionLabel, type VisitOptionGroup } from './visitOptions';
import { WHEN, emptyVisit, missingFields, nextStepDate, toVisitInput, type VisitForm } from './visitForm';
import {
  QUEUE_EVENT, cacheAreas, cachedAreas, clearDraft, enqueueVisit, loadDraft, newClientId, pendingCount, saveDraft, syncQueuedVisits,
} from './visitQueue';
import { shrinkPhoto } from './visitPhoto';
import { useStableToast } from '../sales.utils';

// ── Small building blocks ─────────────────────────────────────────────────────

const URDU = { fontFamily: "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Noto Naskh Arabic', serif" };

function Label({ en, ur, required, hint, htmlFor }: { en: string; ur: string; required?: boolean; hint?: string; htmlFor?: string }) {
  const text = <>{en}{required && <span className="text-error"> *</span>}{hint && <span className="font-normal text-slate"> ({hint})</span>}</>;
  return (
    <div className="flex items-baseline justify-between gap-3">
      {htmlFor ? <label htmlFor={htmlFor} className="text-[13px] font-semibold text-charcoal">{text}</label> : <span className="text-[13px] font-semibold text-charcoal">{text}</span>}
      <span dir="rtl" lang="ur" className="text-[13px] leading-[2] text-slate" style={URDU}>{ur}</span>
    </div>
  );
}

function Chips({ group, value, onChange, label, multi }: { group: VisitOptionGroup; value: string | string[]; onChange: (v: string | string[]) => void; label: string; multi?: boolean }) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {VISIT_OPTIONS[group].map(o => {
        const on = selected.includes(o.key);
        return (
          <button key={o.key} type="button" aria-pressed={on}
            onClick={() => onChange(multi ? (on ? selected.filter(k => k !== o.key) : [...selected, o.key]) : on ? '' : o.key)}
            className={clsx('rounded-full border px-3 py-1.5 text-[13px] leading-tight transition-colors pointer-coarse:min-h-9',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange',
              on ? 'border-brand-orange bg-brand-pale-orange text-brand-deep-orange font-semibold' : 'border-bone bg-cream text-charcoal hover:border-border-hover')}>
            {o.en}
          </button>
        );
      })}
    </div>
  );
}

const inputCls = 'w-full py-[9px] px-3 rounded-md border border-bone bg-white text-[16px] sm:text-[13px] text-charcoal outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-pale-orange';

function Field({ children }: { children: ReactNode }) { return <div className="flex flex-col gap-1.5">{children}</div>; }
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-b border-dashed border-bone pb-5 last:border-0">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate">{title}</h2>
      {children}
    </section>
  );
}

type Loc = { state: 'idle' | 'locating' | 'denied' | 'unavailable' } | { state: 'ok'; lat: number; lng: number; accuracyM: number | null };

/** Super Admin → Sales Ops → New visit: the phone form a rep fills in a shop. Works with no signal (see visitQueue.ts). */
export function VisitFormPage() {
  const toast = useStableToast();
  const navigate = useNavigate();
  const repName = useMemo(() => TokenStorage.getUser<{ name?: string }>()?.name ?? 'You', []);
  const [f, setF] = useState<VisitForm>(() => ({ ...emptyVisit(), ...(loadDraft<VisitForm>() ?? {}) }));
  const [restored] = useState(() => !!loadDraft<VisitForm>()?.storeName);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [loc, setLoc] = useState<Loc>(() => ({ state: typeof navigator !== 'undefined' && navigator.geolocation ? 'locating' : 'unavailable' }));
  const [areas, setAreas] = useState<string[]>(cachedAreas);
  const [newArea, setNewArea] = useState(false);
  const [matches, setMatches] = useState<VisitMatch[]>([]);
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [waiting, setWaiting] = useState(pendingCount);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [startedAt] = useState(() => new Date());
  const topRef = useRef<HTMLDivElement>(null);

  const set = useCallback(<K extends keyof VisitForm>(k: K, v: VisitForm[K]) => setF(prev => ({ ...prev, [k]: v })), []);
  const choose = (k: keyof VisitForm) => (v: string | string[]) => set(k, v as never);

  // Draft: kept on the phone while the rep types, so a closed tab or a dead battery doesn't lose the visit.
  useEffect(() => { const id = setTimeout(() => saveDraft(f), 400); return () => clearTimeout(id); }, [f]);
  useEffect(() => { if (restored) toast.info('Your unsaved visit was restored.'); }, [restored, toast]);

  // Connection state and the waiting queue.
  const sync = useCallback(async () => {
    const r = await syncQueuedVisits();
    if (r.sent) toast.success(`${r.sent} saved visit${r.sent === 1 ? '' : 's'} uploaded.`);
    setWaiting(r.waiting);
  }, [toast]);
  useEffect(() => {
    const up = () => { setOnline(true); void sync(); };
    const down = () => setOnline(false);
    const q = () => setWaiting(pendingCount());
    window.addEventListener('online', up); window.addEventListener('offline', down); window.addEventListener(QUEUE_EVENT, q);
    const first = setTimeout(() => { if (navigator.onLine) void sync(); }, 0);
    return () => { clearTimeout(first); window.removeEventListener('online', up); window.removeEventListener('offline', down); window.removeEventListener(QUEUE_EVENT, q); };
  }, [sync]);

  // Areas the team already visited (kept on the phone for offline use).
  useEffect(() => {
    if (!navigator.onLine) return;
    apiVisitAreas().then(r => { setAreas(r.data); cacheAreas(r.data); }).catch(() => undefined);
  }, []);

  // GPS: asked once when the form opens, and again from the location button.
  const requestPosition = useCallback(() => {
    navigator.geolocation?.getCurrentPosition(
      p => setLoc({ state: 'ok', lat: p.coords.latitude, lng: p.coords.longitude, accuracyM: Number.isFinite(p.coords.accuracy) ? Math.round(p.coords.accuracy) : null }),
      e => setLoc({ state: e.code === 1 ? 'denied' : 'unavailable' }),
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 60_000 },
    );
  }, []);
  const locate = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { setLoc({ state: 'unavailable' }); return; }
    setLoc({ state: 'locating' });
    requestPosition();
  }, [requestPosition]);
  useEffect(() => { if (typeof navigator !== 'undefined' && navigator.geolocation) requestPosition(); }, [requestPosition]);

  // "Already visited" check while typing the number or the shop name (online only).
  const digits = f.whatsapp.replace(/\D/g, '');
  const checkable = online && (digits.length >= 7 || f.storeName.trim().length >= 3);
  useEffect(() => {
    if (!checkable) return;
    const id = setTimeout(() => {
      apiCheckVisit({ phone: digits.length >= 7 ? f.whatsapp : undefined, storeName: f.storeName.trim() || undefined, area: f.area || undefined })
        .then(r => setMatches(r.data)).catch(() => setMatches([]));
    }, 600);
    return () => clearTimeout(id);
  }, [f.whatsapp, f.storeName, f.area, checkable, digits.length]);

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhotoBusy(true);
    try { setPhoto(await shrinkPhoto(file)); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not use this photo.'); }
    setPhotoBusy(false);
  };

  const reset = () => {
    clearDraft();
    setF(emptyVisit(f.area));
    setPhoto(null); setMatches([]); setError('');
    topRef.current?.scrollIntoView?.({ behavior: 'smooth' });
    locate();
  };

  const submit = async () => {
    const missing = missingFields(f);
    if (missing.length) { setError(`Fill in: ${missing.join(', ')}.`); return; }
    setError(''); setBusy(true);
    const input = toVisitInput(f, {
      clientId: newClientId(), visitedAt: new Date(), photoDataUrl: photo,
      location: loc.state === 'ok' ? { lat: loc.lat, lng: loc.lng, accuracyM: loc.accuracyM } : null,
    });
    const keep = () => {
      const r = enqueueVisit(input);
      if (r === 'failed') { setError('This phone could not keep the visit. Free some space or reconnect, then save again.'); return false; }
      toast.info(r === 'saved' ? 'No signal. The visit is kept on this phone and uploads when you are back online.' : 'No signal and the phone is full: the visit is kept without its photo.');
      setWaiting(pendingCount());
      return true;
    };
    try {
      if (!navigator.onLine) { if (keep()) reset(); return; }
      const r = await apiSaveVisit(input);
      const when = input.nextStepAt ? new Date(input.nextStepAt).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) : '';
      toast.success(input.nextStepAt
        ? `Visit saved. Follow-up “${optionLabel('nextStep', input.nextStep)}” for ${r.data.followUpOwner && r.data.followUpOwner !== repName ? r.data.followUpOwner : 'you'} on ${when}.`
        : 'Visit saved.');
      reset();
    } catch (e) {
      const err = e as { isNetworkError?: boolean; status?: number; message?: string };
      if (err.isNetworkError || !err.status || err.status >= 500) { if (keep()) reset(); }
      else setError(err.message || 'The visit could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  const shown = checkable ? matches : [];
  const samePhone = shown.find(m => m.samePhone);
  const nameMatch = !samePhone ? shown[0] : undefined;
  const nextDate = f.nextStep && f.nextStep !== 'none' ? nextStepDate(f) : null;

  return (
    <div className="min-h-full bg-cream">
      <div ref={topRef} className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-bone bg-white px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <Link to="/admin/sales?tab=visits" aria-label="Back to visits" className="rounded-md p-1 text-slate hover:bg-fog"><ArrowLeft size={18} /></Link>
          <h1 className="text-[15px] font-semibold text-charcoal truncate">New visit</h1>
        </div>
        <button type="button" onClick={() => void sync()} disabled={!online}
          className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold',
            online ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning')}>
          {online ? <CloudUpload size={13} /> : <WifiOff size={13} />}
          {online ? (waiting ? `Online · ${waiting} waiting` : 'Online') : `Offline${waiting ? ` · ${waiting} waiting` : ''}`}
        </button>
      </div>

      <form className="mx-auto flex max-w-xl flex-col gap-5 px-4 pt-5" onSubmit={e => { e.preventDefault(); void submit(); }} noValidate>
        <Section title="Shop">
          <Field><Label en="Store name" ur="دکان کا نام" required htmlFor="v-store" />
            <input id="v-store" className={inputCls} value={f.storeName} onChange={e => set('storeName', e.target.value)} autoComplete="off" /></Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1.4fr]">
            <Field><Label en="Unit" ur="یونٹ" htmlFor="v-unit" /><input id="v-unit" className={inputCls} value={f.unit} onChange={e => set('unit', e.target.value)} placeholder="Shop 14" /></Field>
            <Field><Label en="Floor" ur="منزل" /><Chips group="floor" label="Floor" value={f.floor} onChange={choose('floor')} /></Field>
          </div>
          <Field>
            <Label en="Market / area" ur="مارکیٹ / علاقہ" htmlFor={newArea ? 'v-area' : undefined} />
            <div role="group" aria-label="Market / area" className="flex flex-wrap gap-1.5">
              {areas.slice(0, 12).map(a => (
                <button key={a} type="button" aria-pressed={f.area === a && !newArea} onClick={() => { setNewArea(false); set('area', f.area === a ? '' : a); }}
                  className={clsx('rounded-full border px-3 py-1.5 text-[13px] pointer-coarse:min-h-9', f.area === a && !newArea ? 'border-brand-orange bg-brand-pale-orange text-brand-deep-orange font-semibold' : 'border-bone bg-cream text-charcoal')}>{a}</button>
              ))}
              <button type="button" aria-pressed={newArea} onClick={() => { setNewArea(true); set('area', ''); }}
                className={clsx('rounded-full border border-dashed px-3 py-1.5 text-[13px] pointer-coarse:min-h-9', newArea ? 'border-brand-orange text-brand-deep-orange' : 'border-bone text-slate')}>+ New area</button>
            </div>
            {(newArea || (!areas.length)) && <input id="v-area" className={inputCls} value={f.area} onChange={e => set('area', e.target.value)} placeholder="e.g. Tariq Road · Karachi" />}
          </Field>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button type="button" onClick={locate}
              className={clsx('flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-[12.5px]',
                loc.state === 'ok' ? 'border-success bg-success-bg text-success' : 'border-dashed border-bone bg-white text-charcoal')}>
              {loc.state === 'locating' ? <Loader2 size={15} className="animate-spin" /> : <MapPin size={15} />}
              {loc.state === 'ok' ? `Location saved${loc.accuracyM ? ` · ±${loc.accuracyM} m` : ''}`
                : loc.state === 'locating' ? 'Finding location…'
                  : loc.state === 'denied' ? 'Location blocked: allow it in the browser, then tap' : loc.state === 'unavailable' ? 'No location: tap to try again' : 'Save location'}
            </button>
            <label className={clsx('flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-[12.5px]', photo ? 'border-success bg-success-bg text-success' : 'border-dashed border-bone bg-white text-charcoal')}>
              {photoBusy ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
              {photo ? 'Photo added · tap to retake' : 'Add shopfront photo'}
              <input type="file" accept="image/*" capture="environment" className="sr-only" aria-label="Shopfront photo" onChange={e => { void onPhoto(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
          </div>
          {photo && (
            <div className="relative w-32">
              <img src={photo} alt="Shopfront" className="h-24 w-32 rounded-lg object-cover" />
              <button type="button" aria-label="Remove photo" onClick={() => setPhoto(null)} className="absolute -right-2 -top-2 rounded-full bg-charcoal p-1 text-white"><X size={12} /></button>
            </div>
          )}
        </Section>

        <Section title="Business">
          <Field><Label en="Category" ur="کیٹیگری" /><Chips group="category" label="Category" value={f.category} onChange={choose('category')} />
            {f.category === 'other' && <input aria-label="Other category" className={inputCls} value={f.categoryOther} onChange={e => set('categoryOther', e.target.value)} placeholder="Type the category" />}</Field>
          <Field><Label en="Price range" ur="قیمت کی رینج" /><Chips group="priceRange" label="Price range" value={f.priceRange} onChange={choose('priceRange')} /></Field>
          <Field><Label en="Wholesale?" ur="ہول سیل؟" /><Chips group="wholesale" label="Wholesale" value={f.wholesale} onChange={choose('wholesale')} /></Field>
        </Section>

        <Section title="Contact">
          <Field><Label en="Owner / manager name" ur="مالک / مینیجر کا نام" htmlFor="v-contact" /><input id="v-contact" className={inputCls} value={f.contactName} onChange={e => set('contactName', e.target.value)} autoComplete="off" /></Field>
          <Field><Label en="Role" ur="عہدہ" /><Chips group="contactRole" label="Role" value={f.contactRole} onChange={choose('contactRole')} /></Field>
          <Field><Label en="WhatsApp" ur="واٹس ایپ" htmlFor="v-wa" /><input id="v-wa" className={inputCls} inputMode="tel" value={f.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="03xx xxxxxxx" autoComplete="off" /></Field>
          {(samePhone || nameMatch) && (
            <div role="status" className="flex gap-2 rounded-lg bg-warning-bg px-3 py-2.5 text-[12.5px] text-warning">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <p>
                <span className="font-semibold text-charcoal">{samePhone ? 'Already visited' : 'A shop with this name was visited'}</span>{' '}
                {(() => {
                  const m = (samePhone ?? nameMatch)!;
                  const next = m.nextStep !== 'none' ? `, “${optionLabel('nextStep', m.nextStep)}”` : '';
                  return `on ${new Date(m.visitedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} by ${m.adminName ?? 'a teammate'} (${optionLabel('interest', m.interest)}${next}). `;
                })()}
                {samePhone ? 'Saving adds this visit to the same lead.' : 'Check it is a different shop.'}
              </p>
            </div>
          )}
          <Field><Label en="OK to message on WhatsApp?" ur="واٹس ایپ پر رابطے کی اجازت؟" />
            <div role="group" aria-label="WhatsApp permission" className="flex flex-wrap gap-1.5">
              {([['yes', 'Yes, permission given'], ['no', 'No']] as const).map(([k, en]) => (
                <button key={k} type="button" aria-pressed={f.waPermission === k} onClick={() => set('waPermission', f.waPermission === k ? '' : k)}
                  className={clsx('rounded-full border px-3 py-1.5 text-[13px] pointer-coarse:min-h-9', f.waPermission === k ? 'border-brand-orange bg-brand-pale-orange text-brand-deep-orange font-semibold' : 'border-bone bg-cream text-charcoal')}>{en}</button>
              ))}
            </div></Field>
          <Field><Label en="Best time to contact" ur="رابطے کا بہترین وقت" /><Chips group="bestTime" label="Best time to contact" value={f.bestTime} onChange={choose('bestTime')} /></Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field><Label en="Instagram" ur="انسٹاگرام" htmlFor="v-ig" /><input id="v-ig" className={inputCls} value={f.instagram} onChange={e => set('instagram', e.target.value)} placeholder="@shopname" autoComplete="off" /></Field>
            <Field><Label en="Facebook" ur="فیس بک" htmlFor="v-fb" /><input id="v-fb" className={inputCls} value={f.facebook} onChange={e => set('facebook', e.target.value)} placeholder="Page name" autoComplete="off" /></Field>
          </div>
          <Field><Label en="Website" ur="ویب سائٹ" htmlFor="v-web" /><input id="v-web" className={inputCls} inputMode="url" value={f.website} onChange={e => set('website', e.target.value)} autoComplete="off" /></Field>
        </Section>

        <Section title="How they sell">
          <Field><Label en="Sells on" ur="کہاں بیچتے ہیں" hint="pick all" /><Chips group="sellsOn" label="Sells on" multi value={f.sellsOn} onChange={choose('sellsOn')} /></Field>
          <Field><Label en="Online orders / month" ur="ماہانہ آن لائن آرڈرز" hint="estimate" /><Chips group="ordersPerMonth" label="Online orders per month" value={f.ordersPerMonth} onChange={choose('ordersPerMonth')} /></Field>
          <Field><Label en="Payments taken" ur="ادائیگی کے طریقے" hint="pick all" /><Chips group="payments" label="Payments" multi value={f.payments} onChange={choose('payments')} /></Field>
          <Field><Label en="Courier" ur="کوریئر" hint="pick all" /><Chips group="couriers" label="Courier" multi value={f.couriers} onChange={choose('couriers')} /></Field>
          <Field><Label en="How they book it" ur="بکنگ کیسے کرتے ہیں" /><Chips group="courierBooking" label="How they book the courier" value={f.courierBooking} onChange={choose('courierBooking')} /></Field>
        </Section>

        <Section title="In the shop">
          <Field><Label en="Billing / POS" ur="بلنگ / پی او ایس" /><Chips group="billing" label="Billing / POS" value={f.billing} onChange={choose('billing')} />
            {f.billing === 'software' && <input aria-label="Software name" className={inputCls} value={f.billingSoftware} onChange={e => set('billingSoftware', e.target.value)} placeholder="Which software?" />}</Field>
          <Field><Label en="Gives credit (Khata)?" ur="ادھار (کھاتہ)؟" /><Chips group="khata" label="Khata" value={f.khata} onChange={choose('khata')} /></Field>
          <Field><Label en="Busy seasons" ur="مصروف سیزن" hint="pick all" /><Chips group="seasons" label="Busy seasons" multi value={f.seasons} onChange={choose('seasons')} /></Field>
          <Field><Label en="Best sellers" ur="سب سے زیادہ بکنے والی چیزیں" htmlFor="v-best" /><input id="v-best" className={inputCls} value={f.bestSellers} onChange={e => set('bestSellers', e.target.value)} /></Field>
        </Section>

        <Section title="Conversation">
          <Field><Label en="Biggest problem" ur="سب سے بڑا مسئلہ" hint="their exact words" htmlFor="v-problem" />
            <textarea id="v-problem" rows={2} className={inputCls} value={f.problem} onChange={e => set('problem', e.target.value)} />
            <Chips group="problemTags" label="Problem tags" multi value={f.problemTags} onChange={choose('problemTags')} /></Field>
          <Field><Label en="Objections raised" ur="اعتراضات" hint="pick all" /><Chips group="objections" label="Objections" multi value={f.objections} onChange={choose('objections')} /></Field>
          <Field><Label en="Interest" ur="دلچسپی" required /><Chips group="interest" label="Interest" value={f.interest} onChange={choose('interest')} /></Field>
          <Field><Label en="Next step" ur="اگلا قدم" required /><Chips group="nextStep" label="Next step" value={f.nextStep} onChange={choose('nextStep')} />
            {f.nextStep && f.nextStep !== 'none' && (
              <>
                <div role="group" aria-label="Next step date" className="flex flex-wrap gap-1.5">
                  {WHEN.map(w => (
                    <button key={w.key} type="button" aria-pressed={f.when === w.key} onClick={() => set('when', f.when === w.key ? '' : w.key)}
                      className={clsx('rounded-full border px-3 py-1.5 text-[13px] pointer-coarse:min-h-9', f.when === w.key ? 'border-brand-orange bg-brand-pale-orange text-brand-deep-orange font-semibold' : 'border-bone bg-cream text-charcoal')}>{w.en}</button>
                  ))}
                </div>
                {f.when === 'pick' && <input type="date" aria-label="Pick the next-step date" className={inputCls} value={f.pickDate} min={new Date().toISOString().slice(0, 10)} onChange={e => set('pickDate', e.target.value)} />}
                {nextDate && <p className="text-[11.5px] text-slate">Becomes a follow-up task on {nextDate.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}.</p>}
              </>
            )}</Field>
          <div className="flex justify-between gap-3 rounded-lg bg-white px-3 py-2.5 text-[12.5px] text-slate">
            <span>Visited by <span className="font-semibold text-charcoal">{repName}</span></span>
            <span>{startedAt.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          </div>
        </Section>

        <div className="sticky bottom-[-48px] z-40 -mx-4 border-t border-bone bg-white px-4 pt-3 pb-[60px] lg:bottom-0 lg:pb-3">
          <div className="mx-auto flex max-w-xl flex-col gap-2">
            {error && <p role="alert" className="text-[12.5px] text-error">{error}</p>}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => { if (f.storeName || f.whatsapp) { saveDraft(f); toast.info('Draft kept on this phone.'); } navigate('/admin/sales?tab=visits'); }}>Close</Button>
              <Button type="submit" className="flex-1" loading={busy}>Save visit</Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
