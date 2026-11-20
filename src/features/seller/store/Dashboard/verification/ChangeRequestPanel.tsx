import { useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Clock, FilePen, Upload, XCircle, Check, AlertCircle } from 'lucide-react';
import {
  apiCancelVerificationChange, apiRequestVerificationChange,
  type RequestVerificationChangePayload, type SellerVerification, type VerificationDocType,
} from '@/api/services/store';
import { apiUploadPrivateFile } from '@/api/upload';
import { SettingsCard } from '@/components/comman/settings';
import { Button, Field, Input, Textarea } from '@/components/comman/ui';
import { useToast } from '@/contexts/ToastContext';
import { countryGroup, CNIC_HINT, DECLARATION_TEXT, documentLabel, fieldLabel, formatDueDate, formatProblem } from './verificationForm';

const DOC_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp';

type Scalar = 'legalBusinessName' | 'registrationNumber' | 'taxId' | 'strn' | 'cnicNumber' | 'businessAddress';
type Contact = 'name' | 'designation' | 'email' | 'phone';
type UploadedDoc = { type: VerificationDocType; publicId: string; resourceType: string; fileName: string };

const CONTACT_LABEL: Record<Contact, string> = { name: 'Contact name', designation: 'Contact designation', email: 'Contact email', phone: 'Contact phone' };

/**
 * Verified stores cannot edit their details in place (the badge would then vouch for data nobody reviewed).
 * Instead the seller sends a change request: the live details stay as they are until Solvexo approves it.
 */
export function ChangeRequestPanel({ storeId, v, reload }: { storeId: string; v: SellerVerification; reload: () => void }) {
  const toast = useToast();
  const country = v.country || 'PK';
  const pk = countryGroup(country) === 'PK';
  const change = v.change ?? null;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  async function cancel() {
    setBusy(true);
    try {
      await apiCancelVerificationChange(storeId);
      toast.success('Change request cancelled.');
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not cancel the request.');
    } finally { setBusy(false); setConfirmCancel(false); }
  }

  if (change?.status === 'pending') {
    const rows: { label: string; value: string }[] = [];
    (Object.keys(change.fields) as (keyof typeof change.fields)[]).forEach(k => {
      if (k === 'director') {
        Object.entries(change.fields.director ?? {}).forEach(([dk, dv]) => rows.push({ label: dk === 'name' ? 'Director name' : 'Director ID number', value: String(dv || '(empty)') }));
      } else if (k === 'authorizedContact') {
        Object.entries(change.fields.authorizedContact ?? {}).forEach(([ck, cv]) => rows.push({ label: CONTACT_LABEL[ck as Contact] ?? ck, value: String(cv || '(empty)') }));
      } else {
        rows.push({ label: fieldLabel(k, country), value: String(change.fields[k] ?? '(empty)') });
      }
    });
    change.documents.forEach(d => rows.push({ label: documentLabel(d.type, country), value: d.fileName ?? 'New file' }));
    return (
      <div role="status" className="rounded-2xl border border-info/15 bg-info-bg px-4 py-3.5 flex flex-col gap-2.5">
        <div className="flex items-start gap-3">
          <Clock size={18} className="shrink-0 mt-[1px] text-info" />
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-info">Change request waiting for review</p>
            <p className="text-[12.5px] text-charcoal/85 leading-relaxed mt-[2px]">
              Your current details and the Verified badge stay in place until Solvexo approves this. {change.requestedAt ? `Sent ${formatDueDate(change.requestedAt)}.` : ''}
            </p>
          </div>
        </div>
        <ul className="text-[12.5px] text-charcoal bg-white rounded-xl border border-bone px-3.5 py-2.5 flex flex-col gap-1">
          {rows.map(r => <li key={r.label}><span className="text-slate">{r.label}:</span> <strong className="font-semibold break-words">{r.value}</strong></li>)}
        </ul>
        {change.sellerNote && <p className="text-[12px] text-slate">Your note: {change.sellerNote}</p>}
        {confirmCancel ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12.5px] text-charcoal">Withdraw this request? The files you uploaded for it are deleted.</span>
            <Button size="xs" variant="danger" loading={busy} onClick={cancel}>Yes, withdraw</Button>
            <Button size="xs" variant="ghost" onClick={() => setConfirmCancel(false)}>Keep it</Button>
          </div>
        ) : (
          <div><Button size="xs" variant="outline" onClick={() => setConfirmCancel(true)}>Withdraw request</Button></div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {change?.status === 'rejected' && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-error/15 bg-error-bg px-4 py-3.5">
          <XCircle size={18} className="shrink-0 mt-[1px] text-error" />
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold text-error">Your last change request was not approved</p>
            <p className="text-[12.5px] text-charcoal/85 leading-relaxed mt-[2px]">
              Your details were not changed.{change.rejectionReason ? ` Reason: ${change.rejectionReason}` : ''} You can send a new request.
            </p>
          </div>
        </div>
      )}
      {change?.status === 'approved' && !open && (
        <p className="flex items-center gap-1.5 text-[12.5px] text-success"><Check size={14} /> Your last change request was approved{change.reviewedAt ? ` on ${formatDueDate(change.reviewedAt)}` : ''}.</p>
      )}
      {!open ? (
        <div className="flex items-center justify-between gap-3 flex-wrap rounded-2xl border border-bone bg-white px-4 py-3.5">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-charcoal">Need to change your details?</p>
            <p className="text-[12px] text-slate mt-[2px]">Your business is verified, so details are locked. Send a change request and Solvexo will review it. Nothing changes until it is approved.</p>
          </div>
          <Button size="sm" variant="outline" icon={<FilePen size={13} />} onClick={() => setOpen(true)}>Request a change</Button>
        </div>
      ) : (
        <ChangeForm storeId={storeId} v={v} pk={pk} country={country} onDone={() => { setOpen(false); reload(); }} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

function ChangeForm({ storeId, v, pk, country, onDone, onClose }: {
  storeId: string; v: SellerVerification; pk: boolean; country: string; onDone: () => void; onClose: () => void;
}) {
  const toast = useToast();
  const original = {
    legalBusinessName: v.legalBusinessName ?? '', registrationNumber: v.registrationNumber ?? '', taxId: v.taxId ?? '',
    strn: v.strn ?? '', cnicNumber: v.cnicNumber ?? '', businessAddress: v.businessAddress ?? '',
  } satisfies Record<Scalar, string>;
  const originalContact: Record<Contact, string> = {
    name: v.authorizedContact?.name ?? '', designation: v.authorizedContact?.designation ?? '',
    email: v.authorizedContact?.email ?? '', phone: v.authorizedContact?.phone ?? '',
  };
  const [vals, setVals] = useState<Record<Scalar, string>>(original);
  const [contact, setContact] = useState<Record<Contact, string>>(originalContact);
  const entity = !!v.businessType && v.businessType !== 'individual';
  const originalDirector = { name: v.director?.name ?? '', idNumber: v.director?.idNumber ?? '' };
  const [director, setDirector] = useState(originalDirector);
  const [docs, setDocs] = useState<Partial<Record<VerificationDocType, UploadedDoc>>>({});
  const [uploading, setUploading] = useState<VerificationDocType | null>(null);
  const [note, setNote] = useState('');
  const [declared, setDeclared] = useState(false);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pickType, setPickType] = useState<VerificationDocType | null>(null);

  const setV = (k: Scalar, val: string) => setVals(s => ({ ...s, [k]: val }));
  const setC = (k: Contact, val: string) => setContact(s => ({ ...s, [k]: val }));
  const cnicErr = pk ? formatProblem('cnicNumber', vals.cnicNumber, country) : null;
  const ntnErr = pk ? formatProblem('taxId', vals.taxId, country) : null;

  async function upload(type: VerificationDocType, file: File) {
    setUploading(type);
    try {
      const res = await apiUploadPrivateFile(file, 'kyc_document');
      const { publicId, resourceType, fileName } = res.data;
      setDocs(d => ({ ...d, [type]: { type, publicId, resourceType, fileName: fileName || file.name } }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally { setUploading(null); }
  }

  async function submit() {
    setMsg(null);
    const body: RequestVerificationChangePayload = { declarationAccepted: true };
    (Object.keys(original) as Scalar[]).forEach(k => { if (vals[k].trim() !== original[k].trim()) body[k] = vals[k].trim(); });
    const contactChanges: Partial<Record<Contact, string>> = {};
    (Object.keys(originalContact) as Contact[]).forEach(k => { if (contact[k].trim() !== originalContact[k].trim()) contactChanges[k] = contact[k].trim(); });
    if (Object.keys(contactChanges).length) body.authorizedContact = contactChanges;
    const directorChanges: { name?: string; idNumber?: string } = {};
    if (entity) {
      if (director.name.trim() !== originalDirector.name.trim()) directorChanges.name = director.name.trim();
      if (director.idNumber.trim() !== originalDirector.idNumber.trim()) directorChanges.idNumber = director.idNumber.trim();
    }
    if (Object.keys(directorChanges).length) body.director = directorChanges;
    const docList = Object.values(docs).filter((d): d is UploadedDoc => !!d);
    if (docList.length) body.documents = docList;
    if (note.trim()) body.note = note.trim();

    if (Object.keys(body).length === 1 && !body.note) { setMsg('Change something first, or close this form.'); return; }
    const directorErr = entity && pk ? formatProblem('cnicNumber', director.idNumber, country) : null;
    if (cnicErr || ntnErr || directorErr) { setMsg(cnicErr || ntnErr || directorErr); return; }
    if (!declared) { setMsg('Please tick the declaration before you send.'); return; }

    setSending(true);
    try {
      await apiRequestVerificationChange(storeId, body);
      toast.success('Change request sent. Your current details stay until Solvexo approves it.');
      onDone();
    } catch (err) {
      const details = (err as { details?: { missingFields?: string[]; missingDocuments?: VerificationDocType[] } }).details;
      const items = [...(details?.missingFields ?? []).map(f => fieldLabel(f, country)), ...(details?.missingDocuments ?? []).map(d => documentLabel(d, country))];
      const base = err instanceof Error ? err.message : 'Could not send the request.';
      setMsg(items.length ? `${base}: ${items.join(', ')}.` : base);
    } finally { setSending(false); }
  }

  const docTypes = v.documents.filter(d => d.state === 'uploaded').map(d => d.type);

  return (
    <SettingsCard title="Request a change" icon={<FilePen size={14} />} description="Change only what is different. Your current details and the Verified badge stay in place until Solvexo approves the request.">
      <Field label="Legal or business name"><Input value={vals.legalBusinessName} maxLength={150} onChange={e => setV('legalBusinessName', e.target.value)} /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <Field label={fieldLabel('cnicNumber', country)} hint={pk ? CNIC_HINT : undefined} error={cnicErr ?? undefined}>
          <Input value={vals.cnicNumber} maxLength={pk ? 17 : 30} onChange={e => setV('cnicNumber', e.target.value)} />
        </Field>
        <Field label={fieldLabel('taxId', country)} error={ntnErr ?? undefined}>
          <Input value={vals.taxId} maxLength={pk ? 17 : 30} onChange={e => setV('taxId', e.target.value)} />
        </Field>
        {pk && <Field label="STRN"><Input value={vals.strn} maxLength={20} onChange={e => setV('strn', e.target.value)} /></Field>}
        <Field label={fieldLabel('registrationNumber', country)}><Input value={vals.registrationNumber} maxLength={40} onChange={e => setV('registrationNumber', e.target.value)} /></Field>
      </div>
      <Field label="Business address"><Textarea rows={2} value={vals.businessAddress} maxLength={300} onChange={e => setV('businessAddress', e.target.value)} /></Field>

      {entity && (
        <>
          <p className="text-[12px] font-semibold text-charcoal mt-1 mb-2">Director or partner</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Field label="Name"><Input value={director.name} maxLength={100} onChange={e => setDirector(d => ({ ...d, name: e.target.value }))} /></Field>
            <Field label={pk ? 'CNIC number' : 'ID number'}><Input value={director.idNumber} maxLength={pk ? 17 : 30} onChange={e => setDirector(d => ({ ...d, idNumber: e.target.value }))} /></Field>
          </div>
        </>
      )}

      <p className="text-[12px] font-semibold text-charcoal mt-1 mb-2">Authorized contact</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <Field label="Name"><Input value={contact.name} maxLength={100} onChange={e => setC('name', e.target.value)} /></Field>
        <Field label="Designation"><Input value={contact.designation} maxLength={100} onChange={e => setC('designation', e.target.value)} /></Field>
        <Field label="Email"><Input type="email" value={contact.email} onChange={e => setC('email', e.target.value)} /></Field>
        <Field label="Phone / WhatsApp"><Input type="tel" value={contact.phone} maxLength={30} onChange={e => setC('phone', e.target.value)} /></Field>
      </div>

      {docTypes.length > 0 && (
        <div className="mt-1">
          <p className="text-[12px] font-semibold text-charcoal mb-1">New documents (only if a document changed)</p>
          <input ref={fileRef} type="file" accept={DOC_ACCEPT} className="sr-only" tabIndex={-1} aria-label="Choose the new document"
            onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f && pickType) void upload(pickType, f); }} />
          {docTypes.map(type => (
            <div key={type} className="flex items-center justify-between gap-3 py-2.5 border-b border-fog last:border-b-0">
              <div className="min-w-0">
                <p className="text-[13px] text-charcoal leading-[1.4]">{documentLabel(type, country)}</p>
                {docs[type] && <p className="text-[11.5px] text-success truncate mt-[2px]">New file: {docs[type]?.fileName}</p>}
              </div>
              <Button size="xs" variant="outline" loading={uploading === type} icon={uploading === type ? undefined : <Upload size={11} />}
                onClick={() => { setPickType(type); fileRef.current?.click(); }}>
                {docs[type] ? 'Replace again' : 'Upload new file'}
              </Button>
            </div>
          ))}
        </div>
      )}

      <Field label="Why are you changing it? (optional)"><Textarea rows={2} value={note} maxLength={500} onChange={e => setNote(e.target.value)} placeholder="For example: we moved to a new shop" /></Field>

      <label htmlFor="change-declaration" className="flex items-start gap-2.5 rounded-xl border border-bone px-3.5 py-3 text-[12.5px] text-charcoal leading-relaxed cursor-pointer">
        <input id="change-declaration" type="checkbox" className="mt-[3px] accent-brand-orange shrink-0" checked={declared} onChange={e => setDeclared(e.target.checked)} />
        <span>{DECLARATION_TEXT}</span>
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-fog">
        <div className="flex-1 min-w-[160px]">
          {msg && <p role="alert" className={clsx('flex items-start gap-1.5 text-[12.5px] text-error')}><AlertCircle size={14} className="shrink-0 mt-[1px]" /><span>{msg}</span></p>}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
          <Button size="sm" loading={sending} onClick={submit}>Send change request</Button>
        </div>
      </div>
    </SettingsCard>
  );
}
