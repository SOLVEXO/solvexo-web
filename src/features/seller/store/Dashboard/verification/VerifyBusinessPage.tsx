import { useMemo, useRef, useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import {
  Building2, FileText, PackageSearch, Check, Upload, ExternalLink, ShieldCheck, Clock,
  AlertTriangle, XCircle, MessageSquareWarning, User, Users, Briefcase, AlertCircle,
} from 'lucide-react';
import {
  apiUpdateStoreVerification, apiUploadVerificationDocument, apiSubmitStoreVerification,
  type BusinessProfile, type BusinessType, type SellerVerification, type VerificationDocType,
} from '@/api/services/store';
import { SettingsCard, SettingsChoice } from '@/components/comman/settings';
import { Button, Field, Input, Textarea, Select, Badge, TagInput, SkeletonBox } from '@/components/comman/ui';
import { useToast } from '@/contexts/ToastContext';
import { useStoreVerification } from './useStoreVerification';
import { VerificationBanner } from './VerificationBanner';
import {
  countryGroup, draftFromVerification, profileFromVerification, detailsPayload, formatProblem,
  computeMissing, documentChecklist, documentLabel, fieldLabel, isEditable, latestInfoRequest,
  QUESTION_LABELS, LICENCE_HINTS, CNIC_HINT, NTN_HINT, formatDueDate,
  type DetailsDraft,
} from './verificationForm';

const FBR_IRIS_URL = 'https://iris.fbr.gov.pk';
const DOC_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp';

type Step = 0 | 1 | 2;
const STEPS: { label: string; Icon: typeof Building2 }[] = [
  { label: 'Business details', Icon: Building2 },
  { label: 'Documents', Icon: FileText },
  { label: 'Products and services', Icon: PackageSearch },
];

// ── Small building blocks ─────────────────────────────────────────────────────

function Stepper({ step, onStep, done }: { step: Step; onStep: (s: Step) => void; done: boolean[] }) {
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Verification steps">
      {STEPS.map((s, i) => {
        const active = i === step;
        return (
          <li key={s.label}>
            <button
              type="button"
              onClick={() => onStep(i as Step)}
              aria-current={active ? 'step' : undefined}
              className={clsx(
                'w-full flex items-center gap-2 rounded-xl border px-2.5 sm:px-3 py-2.5 text-left cursor-pointer transition-colors',
                active ? 'border-brand-orange bg-brand-pale-orange' : 'border-bone bg-white hover:bg-cream',
              )}
            >
              <span className={clsx(
                'size-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0',
                done[i] ? 'bg-success text-white' : active ? 'bg-brand-orange text-white' : 'bg-cream text-slate',
              )}>
                {done[i] ? <Check size={12} /> : i + 1}
              </span>
              <span className={clsx('text-[12px] sm:text-[12.5px] font-semibold leading-tight', active ? 'text-brand-deep-orange' : 'text-charcoal')}>{s.label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** Pick-one chips (radio semantics) — compact, wraps on a phone. */
function ChipGroup<T extends string | boolean>({ label, value, options, onChange, disabled }: {
  label: string; value: T | null; options: { value: T; label: string }[]; onChange: (v: T) => void; disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map(o => {
        const on = value === o.value;
        return (
          <button
            key={String(o.value)} type="button" role="radio" aria-checked={on} disabled={disabled}
            onClick={() => onChange(o.value)}
            className={clsx(
              'px-3 py-[7px] pointer-coarse:py-2.5 rounded-full border text-[12.5px] font-medium cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-60',
              on ? 'border-brand-orange bg-brand-pale-orange text-brand-deep-orange' : 'border-bone bg-white text-charcoal hover:bg-cream',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Question({ title, children, hint }: { title: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="py-4 first:pt-0 border-b border-fog last:border-b-0">
      <p className="text-[13px] font-semibold text-charcoal mb-2.5">{title}</p>
      {children}
      {hint}
    </div>
  );
}

function DocumentRow({ type, required, country, uploaded, viewUrl, editable, uploading, onUpload, note }: {
  type: VerificationDocType; required: boolean; country: string; uploaded: string | null; viewUrl: string | null;
  editable: boolean; uploading: boolean; onUpload: (file: File) => void; note?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-fog last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-charcoal leading-[1.4]">
          {documentLabel(type, country)}
          <span className="text-slate font-normal"> · {required ? 'required' : (note ?? 'optional')}</span>
        </p>
        {uploaded && (
          <p className="text-[11.5px] text-slate truncate mt-[2px]">
            {uploaded}
            {viewUrl && <a href={viewUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-brand-deep-orange font-medium inline-flex items-center gap-[3px]">View <ExternalLink size={10} /></a>}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {uploaded && <Badge color="green">Uploaded</Badge>}
        {editable && (
          <>
            <input
              ref={inputRef} type="file" accept={DOC_ACCEPT} className="sr-only" tabIndex={-1}
              aria-label={`Upload ${documentLabel(type, country)}`}
              onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onUpload(f); }}
            />
            <Button
              size="xs" variant={uploaded || !required ? 'outline' : 'primary'} loading={uploading}
              icon={!uploading ? <Upload size={11} /> : undefined}
              onClick={() => inputRef.current?.click()}
            >
              {uploaded ? 'Replace' : 'Upload'}
            </Button>
          </>
        )}
        {!editable && !uploaded && <Badge color={required ? 'red' : 'gray'}>{required ? 'Missing' : 'Not uploaded'}</Badge>}
      </div>
    </div>
  );
}

function StatusCard({ v }: { v: SellerVerification }) {
  const info = latestInfoRequest(v.history);
  const map: Record<string, { tone: string; Icon: typeof Clock; title: string; body: ReactNode } | null> = {
    not_started: null,
    pending: {
      tone: 'bg-info-bg border-info/15 text-info', Icon: Clock, title: 'Submitted for review',
      body: 'Solvexo will check your details and documents. You will get an email and a notification when it is done.',
    },
    under_review: {
      tone: 'bg-info-bg border-info/15 text-info', Icon: Clock, title: 'Under review',
      body: 'Solvexo is checking your details and documents now. Your answers are locked while the review runs.',
    },
    needs_info: {
      tone: 'bg-brand-pale-orange border-brand-orange/25 text-brand-deep-orange', Icon: MessageSquareWarning, title: 'Solvexo needs more information',
      body: (
        <>
          {info?.note && <span className="block my-1.5 px-3 py-2 rounded-lg bg-white text-charcoal border border-brand-orange/20">“{info.note}”</span>}
          Update the details or documents below, then resubmit for review.
        </>
      ),
    },
    verified: {
      tone: 'bg-success-bg border-success/15 text-success', Icon: ShieldCheck, title: 'Your business is verified',
      body: 'Your store shows the “Verified business” badge and can be listed on the Solvexo marketplace.',
    },
    rejected: {
      tone: 'bg-error-bg border-error/15 text-error', Icon: XCircle, title: 'Verification was not approved',
      body: (
        <>
          {v.rejectionReason && <span className="block my-1.5 px-3 py-2 rounded-lg bg-white text-charcoal border border-error/15">Reason: {v.rejectionReason}</span>}
          Fix the details or documents below and resubmit for review.
        </>
      ),
    },
  };
  const s = map[v.verificationStatus];
  if (!s) return null;
  return (
    <div role="status" className={clsx('flex items-start gap-3 rounded-2xl border px-4 py-3.5', s.tone)}>
      <s.Icon size={18} className="shrink-0 mt-[1px]" />
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold">{s.title}</p>
        <div className="text-[12.5px] text-charcoal/85 leading-relaxed mt-[2px]">{s.body}</div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

/** Settings → "Verify your business": 3 steps (details, documents, products and services), draft-saved per step. */
export function VerifyBusinessPage({ storeId }: { storeId: string }) {
  const { data: v, requirements, loading, error, reload } = useStoreVerification(storeId, { withRequirements: true });
  if (loading && !v) {
    return (
      <div className="px-4 lg:px-7 py-6 flex flex-col gap-4">
        <SkeletonBox width="100%" height={56} rounded="16px" />
        <SkeletonBox width="100%" height={360} rounded="16px" />
      </div>
    );
  }
  if (!v || !requirements) {
    return (
      <div className="px-4 lg:px-7 py-6">
        <div role="alert" className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-error-bg text-error text-[12.5px]">
          <span>{error || 'Could not load your verification.'}</span>
          <button type="button" onClick={reload} className="font-semibold underline bg-transparent border-none cursor-pointer text-error">Try again</button>
        </div>
      </div>
    );
  }
  return <VerifyBusinessForm key={v.verificationStatus} storeId={storeId} v={v} reload={reload} requirementsFromApi={requirements} />;
}

function VerifyBusinessForm({ storeId, v, reload, requirementsFromApi }: {
  storeId: string; v: SellerVerification; reload: () => void; requirementsFromApi: NonNullable<SellerVerification['requirements']>;
}) {
  const toast = useToast();
  const country = v.country || 'PK';
  const group = countryGroup(country);
  const editable = isEditable(v.verificationStatus);
  const [step, setStep] = useState<Step>(0);
  const [draft, setDraft] = useState<DetailsDraft>(() => draftFromVerification(v));
  const [profile, setProfile] = useState<BusinessProfile>(() => profileFromVerification(v));
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [uploadingType, setUploadingType] = useState<VerificationDocType | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const goTo = (s: Step) => { setMsg(null); setStep(s); };

  // The API returns requirements for the SAVED business type; the seller may have just changed it.
  const req = useMemo(() => {
    if (!draft.businessType || draft.businessType === v.businessType) return requirementsFromApi;
    const business = draft.businessType !== 'individual';
    const extraFields = business && group !== 'GCC' && !requirementsFromApi.requiredFields.includes('registrationNumber') ? ['registrationNumber'] : [];
    const extraDocs = business && !requirementsFromApi.requiredDocuments.includes('business_registration') ? ['business_registration' as const] : [];
    return {
      ...requirementsFromApi,
      businessType: draft.businessType as BusinessType,
      requiredFields: [...requirementsFromApi.requiredFields, ...extraFields],
      requiredDocuments: [...requirementsFromApi.requiredDocuments, ...extraDocs],
    };
  }, [draft.businessType, v.businessType, requirementsFromApi, group]);

  const docsByType = useMemo(() => new Map(v.documents.map(d => [d.type, d])), [v.documents]);
  const uploaded = useMemo(() => new Set(v.documents.filter(d => d.state === 'uploaded').map(d => d.type)), [v.documents]);
  const missing = computeMissing(req, draft, profile, uploaded);
  const checklist = documentChecklist(req, profile);
  const isRequired = (path: string) => req.requiredFields.includes(path);

  const set = <K extends keyof DetailsDraft>(k: K, val: DetailsDraft[K]) => setDraft(d => ({ ...d, [k]: val }));
  const setP = <K extends keyof BusinessProfile>(k: K, val: BusinessProfile[K]) => setProfile(p => ({ ...p, [k]: val }));

  async function saveDetails(next?: Step) {
    setSaving(true); setMsg(null);
    try {
      await apiUpdateStoreVerification(storeId, detailsPayload(draft, country));
      setMsg({ ok: true, text: 'Saved.' });
      if (next !== undefined) goTo(next);
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not save your details.' });
    } finally { setSaving(false); }
  }

  async function saveProfile(): Promise<boolean> {
    setSaving(true); setMsg(null);
    try {
      await apiUpdateStoreVerification(storeId, { businessProfile: profile });
      setMsg({ ok: true, text: 'Answers saved.' });
      return true;
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not save your answers.' });
      return false;
    } finally { setSaving(false); }
  }

  async function upload(type: VerificationDocType, file: File) {
    setUploadingType(type);
    try {
      await apiUploadVerificationDocument(storeId, type, file);
      toast.success(`${documentLabel(type, country)} uploaded.`);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally { setUploadingType(null); }
  }

  async function submit() {
    setSubmitting(true); setMsg(null);
    try {
      // Save step 1 and step 3 first so the API checks exactly what is on screen.
      await apiUpdateStoreVerification(storeId, { ...detailsPayload(draft, country), businessProfile: profile });
      await apiSubmitStoreVerification(storeId);
      toast.success(v.verificationStatus === 'not_started' ? 'Submitted for review.' : 'Resubmitted for review.');
      reload();
    } catch (err) {
      const details = (err as { details?: { missingFields?: string[]; missingDocuments?: VerificationDocType[] } }).details;
      const items = [
        ...(details?.missingFields ?? []).map(f => fieldLabel(f, country)),
        ...(details?.missingDocuments ?? []).map(d => documentLabel(d, country)),
      ];
      const base = err instanceof Error ? err.message : 'Could not submit for review.';
      setMsg({ ok: false, text: items.length ? `${base}: ${items.join(', ')}.` : base });
    } finally { setSubmitting(false); }
  }

  const docRow = (type: VerificationDocType, required: boolean, note?: string) => {
    const row = docsByType.get(type);
    return (
      <DocumentRow
        key={type} type={type} required={required} country={country} note={note}
        uploaded={row?.state === 'uploaded' ? (row.fileName ?? 'Uploaded file') : null}
        viewUrl={row?.viewUrl ?? null} editable={editable} uploading={uploadingType === type}
        onUpload={f => upload(type, f)}
      />
    );
  };

  const formatOk = !formatProblem('cnicNumber', draft.idNumber, country) && !formatProblem('taxId', draft.taxId, country);
  const stepDone = [
    missing.fields.length === 0 && formatOk,
    checklist.filter(d => d.required && !['brand_authorization', 'product_licence'].includes(d.type)).every(d => uploaded.has(d.type)),
    missing.questions.length === 0 && !missing.documents.some(d => d === 'brand_authorization' || d === 'product_licence'),
  ];
  const totalMissing = missing.fields.length + missing.documents.length + missing.questions.length;
  const resubmit = v.verificationStatus === 'needs_info' || v.verificationStatus === 'rejected';

  const fieldError = (k: 'cnicNumber' | 'taxId', value: string) => (touched[k] ? formatProblem(k, value, country) ?? undefined : undefined);
  const footerMsg = msg && (
    <p role={msg.ok ? 'status' : 'alert'} className={clsx('flex items-start gap-1.5 text-[12.5px]', msg.ok ? 'text-success' : 'text-error')}>
      {msg.ok ? <Check size={14} className="shrink-0 mt-[1px]" /> : <AlertCircle size={14} className="shrink-0 mt-[1px]" />}
      <span>{msg.text}</span>
    </p>
  );

  return (
    <div className="px-4 lg:px-7 py-6 flex flex-col gap-4 max-w-[860px]">
      <div className="max-lg:hidden">
        <h2 className="text-[16px] font-semibold text-charcoal">Verify your business</h2>
        <p className="text-[12.5px] text-slate mt-0.5">
          Three short steps. Documents are stored privately: only Solvexo's review team can open them, through a link that expires after a few minutes.
        </p>
      </div>

      {/* The status card below already explains review / needs-info / rejected; the banner covers the deadline before submit. */}
      {v.verificationStatus === 'not_started' && <VerificationBanner storeId={storeId} verification={v} onPage />}
      <StatusCard v={v} />

      <Stepper step={step} onStep={goTo} done={stepDone} />

      <fieldset disabled={!editable} className="contents">
        {step === 0 && (
          <SettingsCard title="Business details" icon={<Building2 size={14} />} description={`Country: ${new Intl.DisplayNames(['en'], { type: 'region' }).of(country) ?? country}. To change it, edit your Store Profile.`}>
            <div className="mb-4">
              <p className="text-[12px] font-medium text-charcoal mb-1.5">Seller type<span className="text-brand-orange"> *</span></p>
              <div role="radiogroup" aria-label="Seller type" className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {([
                  { value: 'individual', label: 'Individual', description: 'You sell in your own name', Icon: User },
                  { value: 'company', label: 'Company', description: group === 'PK' ? 'Registered with SECP' : 'A registered company', Icon: Briefcase },
                  { value: 'partnership', label: 'Partnership', description: 'A registered firm', Icon: Users },
                ] as const).map(o => (
                  <SettingsChoice
                    key={o.value} name="business-type" checked={draft.businessType === o.value}
                    label={o.label} description={o.description} icon={<o.Icon size={14} />}
                    onChange={() => set('businessType', o.value)} disabled={!editable}
                  />
                ))}
              </div>
            </div>

            <Field label="Legal or business name" required={isRequired('legalBusinessName')} hint="As it appears on your ID or registration documents.">
              <Input value={draft.legalBusinessName} onChange={e => set('legalBusinessName', e.target.value)} maxLength={150} />
            </Field>

            {group === 'PK' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <Field label="CNIC number" required={isRequired('cnicNumber')} hint={CNIC_HINT} error={fieldError('cnicNumber', draft.idNumber)}>
                  <Input value={draft.idNumber} inputMode="numeric" placeholder="12345-1234567-1" maxLength={17}
                    onChange={e => set('idNumber', e.target.value)} onBlur={() => setTouched(t => ({ ...t, cnicNumber: true }))} />
                </Field>
                <div>
                  <Field label={isRequired('taxId') ? 'NTN (required)' : 'NTN (optional)'} error={fieldError('taxId', draft.taxId)}>
                    <Input value={draft.taxId} inputMode="numeric" placeholder="1234567-8" maxLength={10}
                      onChange={e => set('taxId', e.target.value)} onBlur={() => setTouched(t => ({ ...t, taxId: true }))} />
                  </Field>
                  {!fieldError('taxId', draft.taxId) && (
                    <p className="-mt-[10px] mb-[14px] text-[11px] text-slate">
                      {NTN_HINT} Don't have one? <a href={FBR_IRIS_URL} target="_blank" rel="noopener noreferrer" className="text-brand-deep-orange font-medium">Register free on FBR IRIS</a>.
                    </p>
                  )}
                </div>
                <Field label="STRN (optional)" hint="Sales tax registration number, if you have one.">
                  <Input value={draft.strn} onChange={e => set('strn', e.target.value)} maxLength={20} />
                </Field>
                {(isRequired('registrationNumber') || (draft.businessType && draft.businessType !== 'individual')) && (
                  <Field label="SECP or firm registration number" required={isRequired('registrationNumber')}>
                    <Input value={draft.registrationNumber} onChange={e => set('registrationNumber', e.target.value)} maxLength={40} />
                  </Field>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                {group === 'GCC' && (
                  <>
                    <Field label="Trade licence number" required={isRequired('registrationNumber')}>
                      <Input value={draft.registrationNumber} onChange={e => set('registrationNumber', e.target.value)} maxLength={40} />
                    </Field>
                    <Field label="VAT TRN" required={isRequired('taxId')} hint="Your VAT tax registration number (usually 15 digits).">
                      <Input value={draft.taxId} inputMode="numeric" onChange={e => set('taxId', e.target.value)} maxLength={20} />
                    </Field>
                  </>
                )}
                <Field label="ID type" required={isRequired('idDocumentType')}>
                  <Select value={draft.idDocumentType} onChange={e => set('idDocumentType', e.target.value as DetailsDraft['idDocumentType'])}>
                    <option value="">Choose…</option>
                    <option value="national_id">{group === 'GCC' ? 'Emirates ID or national ID' : 'National ID'}</option>
                    <option value="passport">Passport</option>
                  </Select>
                </Field>
                <Field label="ID number" required={isRequired('cnicNumber')}>
                  <Input value={draft.idNumber} onChange={e => set('idNumber', e.target.value)} maxLength={30} />
                </Field>
                {group === 'OTHER' && (
                  <>
                    <Field label="Tax ID" required={isRequired('taxId')}>
                      <Input value={draft.taxId} onChange={e => set('taxId', e.target.value)} maxLength={30} />
                    </Field>
                    {(isRequired('registrationNumber') || (draft.businessType && draft.businessType !== 'individual')) && (
                      <Field label="Registration number" required={isRequired('registrationNumber')}>
                        <Input value={draft.registrationNumber} onChange={e => set('registrationNumber', e.target.value)} maxLength={40} />
                      </Field>
                    )}
                  </>
                )}
              </div>
            )}

            <Field label="Business address" required={isRequired('businessAddress')}>
              <Textarea rows={2} value={draft.businessAddress} onChange={e => set('businessAddress', e.target.value)} maxLength={300} />
            </Field>

            <p className="text-[12px] font-semibold text-charcoal mt-1 mb-2">Authorized contact</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Field label="Name" required={isRequired('authorizedContact.name')}>
                <Input value={draft.contactName} onChange={e => set('contactName', e.target.value)} autoComplete="name" />
              </Field>
              <Field label="Designation" required={isRequired('authorizedContact.designation')}>
                <Input value={draft.contactDesignation} onChange={e => set('contactDesignation', e.target.value)} placeholder="Owner, director…" />
              </Field>
              <Field label="Email" required={isRequired('authorizedContact.email')}>
                <Input type="email" value={draft.contactEmail} onChange={e => set('contactEmail', e.target.value)} autoComplete="email" />
              </Field>
              <Field label="Phone / WhatsApp" required={isRequired('authorizedContact.phone')}>
                <Input type="tel" value={draft.contactPhone} onChange={e => set('contactPhone', e.target.value)} autoComplete="tel" placeholder={group === 'PK' ? '0300 1234567' : ''} />
              </Field>
            </div>

            {editable && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-fog">
                <div className="flex-1 min-w-[160px]">{footerMsg}</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" loading={saving} onClick={() => saveDetails()}>Save draft</Button>
                  <Button size="sm" loading={saving} onClick={() => saveDetails(1)}>Save and continue</Button>
                </div>
              </div>
            )}
          </SettingsCard>
        )}

        {step === 1 && (
          <SettingsCard title="Documents" icon={<FileText size={14} />} description="PDF or a clear photo (JPG, PNG). Each upload is saved straight away.">
            <div>
              {checklist.filter(d => d.type !== 'brand_authorization' && d.type !== 'product_licence').map(d => docRow(d.type, d.required))}
              {group === 'PK' && !checklist.some(d => d.type === 'business_registration') && (
                <div className="flex items-center justify-between gap-3 py-3 text-[13px] text-slate">
                  <span>{documentLabel('business_registration', country)} · companies and partnerships</span>
                  <Badge color="gray">Not needed</Badge>
                </div>
              )}
            </div>
            {checklist.some(d => d.type === 'brand_authorization' || d.type === 'product_licence') && (
              <p className="mt-2 text-[12px] text-slate">Licences and brand documents for what you sell are on the next step.</p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 border-t border-fog">
              <div className="flex-1 min-w-[160px]">{footerMsg}</div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => goTo(0)}>Back</Button>
                <Button size="sm" onClick={() => goTo(2)}>Continue</Button>
              </div>
            </div>
          </SettingsCard>
        )}

        {step === 2 && (
          <SettingsCard title="Products and services" icon={<PackageSearch size={14} />} description="A few questions about how you sell. Answers that need a licence or proof ask for the upload right here.">
            <Question title="How do you get the products you sell?">
              <ChipGroup label="Sourcing" value={profile.sourcing} onChange={x => setP('sourcing', x)} disabled={!editable} options={[
                { value: 'manufacturer', label: 'I make them' }, { value: 'reseller', label: 'I buy and resell' },
                { value: 'importer', label: 'I import' }, { value: 'dropshipper', label: 'Dropshipping' },
              ]} />
            </Question>

            <Question
              title={`Do you sell branded products (e.g. ${group === 'PK' ? "L'Oréal, Samsung, Nike" : 'Apple, Samsung, Nike'})?`}
              hint={profile.sellsBrandedGoods === true && (
                <div className="mt-3 rounded-xl border border-bone px-3">
                  {docRow('brand_authorization', true)}
                </div>
              )}
            >
              <ChipGroup label="Branded products" value={profile.sellsBrandedGoods} onChange={x => setP('sellsBrandedGoods', x)} disabled={!editable} options={[
                { value: true, label: 'Yes' }, { value: false, label: 'No' },
              ]} />
            </Question>

            <Question
              title="Do you sell any of these?"
              hint={profile.regulatedCategories.length > 0 && (
                <div className="mt-3 rounded-xl border border-brand-orange/25 bg-brand-pale-orange/50 px-3 pt-2.5">
                  <p className="flex items-start gap-2 text-[12px] text-brand-deep-orange">
                    <AlertTriangle size={14} className="shrink-0 mt-[1px]" />
                    <span>{profile.regulatedCategories.map(c => LICENCE_HINTS[c]).join(' ')} Upload it, or the store stays high risk.</span>
                  </p>
                  {docRow('product_licence', true)}
                </div>
              )}
            >
              <div role="group" aria-label="Regulated products" className="flex flex-wrap gap-2">
                {([
                  ['cosmetics', 'Cosmetics or skin care'], ['medicines', 'Medicines or supplements'], ['food', 'Food items'], ['mobile_phones', 'Mobile phones'],
                ] as const).map(([value, label]) => {
                  const on = profile.regulatedCategories.includes(value);
                  return (
                    <button key={value} type="button" aria-pressed={on} disabled={!editable}
                      onClick={() => setP('regulatedCategories', on ? profile.regulatedCategories.filter(c => c !== value) : [...profile.regulatedCategories, value])}
                      className={clsx('px-3 py-[7px] pointer-coarse:py-2.5 rounded-full border text-[12.5px] font-medium cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                        on ? 'border-brand-orange bg-brand-pale-orange text-brand-deep-orange' : 'border-bone bg-white text-charcoal hover:bg-cream')}
                    >
                      {label}
                    </button>
                  );
                })}
                <button type="button" aria-pressed={profile.regulatedCategories.length === 0} disabled={!editable}
                  onClick={() => setP('regulatedCategories', [])}
                  className={clsx('px-3 py-[7px] pointer-coarse:py-2.5 rounded-full border text-[12.5px] font-medium cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                    profile.regulatedCategories.length === 0 ? 'border-brand-orange bg-brand-pale-orange text-brand-deep-orange' : 'border-bone bg-white text-charcoal hover:bg-cream')}
                >
                  None of these
                </button>
              </div>
            </Question>

            <Question title="Where do you work from?">
              <ChipGroup label="Premises" value={profile.premises} onChange={x => setP('premises', x)} disabled={!editable} options={[
                { value: 'shop', label: 'Shop' }, { value: 'warehouse', label: 'Warehouse' }, { value: 'home', label: 'Home' },
              ]} />
            </Question>

            <Question title="How long have you been selling?">
              <ChipGroup label="Years selling" value={profile.yearsSelling} onChange={x => setP('yearsSelling', x)} disabled={!editable} options={[
                { value: 'lt_6m', label: 'Under 6 months' }, { value: '6m_1y', label: '6 months to 1 year' },
                { value: '1_3y', label: '1 to 3 years' }, { value: 'gt_3y', label: 'Over 3 years' },
              ]} />
            </Question>

            <Question title="Where else do you sell? (links, optional)">
              <TagInput tags={profile.otherChannels} max={5} onChange={tags => setP('otherChannels', tags.map(t => t.slice(0, 200)))} placeholder="Instagram, Facebook or website link, press Enter" />
            </Question>

            <Question title="Delivery and returns">
              <p className="text-[12px] text-slate mb-1.5">Couriers you use (optional)</p>
              {group === 'PK' && editable && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['TCS', 'Leopards', 'M&P', 'PostEx', 'Trax', 'Own rider'].filter(c => !profile.couriers.includes(c)).map(c => (
                    <button key={c} type="button" disabled={profile.couriers.length >= 5}
                      onClick={() => setP('couriers', [...profile.couriers, c])}
                      className="px-2.5 py-1 rounded-full border border-dashed border-slate/40 text-[11.5px] text-charcoal bg-white cursor-pointer hover:bg-cream disabled:opacity-50">
                      + {c}
                    </button>
                  ))}
                </div>
              )}
              <TagInput tags={profile.couriers} max={5} onChange={tags => setP('couriers', tags)} placeholder="Add a courier, press Enter" />
              <p className="text-[12px] text-slate mt-3 mb-1.5">Dispatch</p>
              <ChipGroup label="Dispatch time" value={profile.dispatchTime} onChange={x => setP('dispatchTime', x)} disabled={!editable} options={[
                { value: 'same_day', label: 'Same day' }, { value: '1_2_days', label: '1 to 2 days' }, { value: '3_plus_days', label: '3+ days' },
              ]} />
              <p className="text-[12px] text-slate mt-3 mb-1.5">Returns</p>
              <ChipGroup label="Return policy" value={profile.returnPolicy} onChange={x => setP('returnPolicy', x)} disabled={!editable} options={[
                { value: '7_day_returns', label: '7-day returns' }, { value: 'exchange_only', label: 'Exchange only' }, { value: 'no_returns', label: 'No returns' },
              ]} />
            </Question>

            <Question title="Expected orders per month">
              <ChipGroup label="Monthly orders" value={profile.monthlyOrders} onChange={x => setP('monthlyOrders', x)} disabled={!editable} options={[
                { value: 'lt_50', label: 'Under 50' }, { value: '50_300', label: '50 to 300' }, { value: 'gt_300', label: 'Over 300' },
              ]} />
            </Question>

            <Question title="Is your bank account in the business or owner's name?">
              <ChipGroup label="Bank account name" value={profile.bankAccountInOwnName} onChange={x => setP('bankAccountInOwnName', x)} disabled={!editable} options={[
                { value: true, label: 'Yes' }, { value: false, label: "No, someone else's" },
              ]} />
            </Question>

            {editable && (
              <div className="pt-4 mt-1 border-t border-fog flex flex-col gap-3">
                {totalMissing > 0 ? (
                  <div className="rounded-xl bg-cream px-3.5 py-3">
                    <p className="text-[12.5px] font-semibold text-charcoal mb-1">Still needed before you submit</p>
                    <ul className="list-disc pl-5 text-[12px] text-slate leading-relaxed">
                      {missing.fields.map(f => <li key={f}>{fieldLabel(f, country)} <button type="button" onClick={() => goTo(0)} className="text-brand-deep-orange underline bg-transparent border-0 cursor-pointer p-0">(step 1)</button></li>)}
                      {missing.documents.map(d => <li key={d}>{documentLabel(d, country)}</li>)}
                      {missing.questions.map(q => <li key={q}>{QUESTION_LABELS[q]}</li>)}
                    </ul>
                  </div>
                ) : (
                  <p className="flex items-center gap-1.5 text-[12.5px] text-success"><Check size={14} /> Everything is filled in. Solvexo will check it after you submit.</p>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex-1 min-w-[160px]">{footerMsg}</div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => goTo(1)}>Back</Button>
                    <Button size="sm" variant="outline" loading={saving} onClick={() => { void saveProfile(); }}>Save answers</Button>
                    <Button size="sm" loading={submitting} icon={!submitting ? <ShieldCheck size={13} /> : undefined} onClick={submit}>
                      {resubmit ? 'Resubmit for review' : 'Submit for review'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </SettingsCard>
        )}
      </fieldset>

      {v.deadline?.enforcementStarted && v.deadline.dueAt && v.verificationStatus !== 'verified' && (
        <p className="text-[11.5px] text-slate">Verification deadline for this store: {formatDueDate(v.deadline.dueAt)}.</p>
      )}
    </div>
  );
}

export default VerifyBusinessPage;
