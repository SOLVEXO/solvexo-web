import { useRef, useState } from 'react';
import { clsx } from 'clsx';
import { CheckCircle2, Circle, ExternalLink, Upload } from 'lucide-react';
import { Badge, Button } from '@/components/comman/ui';
import {
  STAGE_COLORS, STAGE_LABELS, apiMyDocumentUrl, apiMyOnboarding, apiUploadMyDocument, fmtDay, type PartnerDocType, type PartnerOnboarding,
} from '@/api/services/partnerProgramme';
import { errMsg, useStableToast } from '../sales.utils';

const NEXT: Record<string, string> = {
  applied: 'We are reading your application and will contact you within 2 working days.',
  documents: 'Upload the documents below. We check each one and tell you here if anything needs replacing.',
  review: 'Thank you: every document is in. We are checking them and your references.',
  agreement: 'You are approved. Your partner agreement is being prepared for signing.',
  onboarding: 'Welcome aboard. These are your first 30 days with Solvexo.',
  live: 'Onboarding complete.',
  rejected: 'Your application was not taken forward.',
};

/** The partner's own onboarding: stage, documents to upload (B12) and the 30-day checklist. */
export function MyOnboarding({ d, onChange }: { d: PartnerOnboarding; onChange: (d: PartnerOnboarding) => void }) {
  const toast = useStableToast();
  const [busy, setBusy] = useState('');
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const latest = (t: PartnerDocType) => d.documents.filter(x => x.type === t).at(-1);
  const canUpload = !['rejected'].includes(d.stage);

  const upload = async (type: PartnerDocType, file: File | undefined) => {
    if (!file) return;
    setBusy(type);
    try {
      await apiUploadMyDocument(type, file);
      const r = await apiMyOnboarding();
      if (r.data) onChange(r.data);
      toast.success('Uploaded. We will check it shortly.');
    } catch (e) { toast.error(errMsg(e, 'Upload failed. Use a PDF or a clear photo under 10 MB.')); }
    setBusy('');
    const el = inputs.current[type];
    if (el) el.value = '';
  };
  const open = async (docId: string) => {
    try { window.open((await apiMyDocumentUrl(docId)).data.url, '_blank', 'noopener'); } catch (e) { toast.error(errMsg(e, 'Could not open the document.')); }
  };
  const weeks = [...new Set(d.checklist.map(c => c.week))].filter(w => w > 0);
  const showDocs = ['documents', 'review', 'agreement', 'applied'].includes(d.stage) || d.documents.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-bone bg-white p-4">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate">Your partnership</p>
          <Badge color={STAGE_COLORS[d.stage]} dot>{STAGE_LABELS[d.stage]}</Badge>
        </div>
        <p className="text-[13px] text-charcoal">{NEXT[d.stage]}{d.stage === 'rejected' && d.rejectReason ? ` ${d.rejectReason}` : ''}</p>
        {d.agreement && (
          <p className="text-[12px] text-slate mt-1.5">
            Agreement signed {fmtDay(d.agreement.signedAt)} · pilot until {fmtDay(d.agreement.pilotEndsAt)} · term until {fmtDay(d.agreement.termEndsAt)}
          </p>
        )}
      </section>

      {showDocs && (
        <section className="rounded-xl border border-bone bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate mb-2">Documents</p>
          <ul className="flex flex-col gap-2 list-none p-0 m-0">
            {d.docs.required.map(t => {
              const x = latest(t);
              return (
                <li key={t} className="flex flex-wrap items-center gap-2 border-b border-bone last:border-0 pb-2">
                  <div className="flex-1 min-w-[220px]">
                    <p className="text-[13px] text-charcoal">{d.docs.labels[t]}</p>
                    {x ? (
                      <p className="text-[11.5px] text-slate">
                        {x.fileName} · {fmtDay(x.uploadedAt)}
                        {x.status === 'rejected' && x.reviewNote && <span className="block text-error">Please replace: {x.reviewNote}</span>}
                      </p>
                    ) : <p className="text-[11.5px] text-slate">Not uploaded yet</p>}
                  </div>
                  {x && <Badge color={x.status === 'verified' ? 'green' : x.status === 'rejected' ? 'red' : 'yellow'} dot>{x.status === 'pending' ? 'being checked' : x.status}</Badge>}
                  {x && <Button size="xs" variant="ghost" onClick={() => open(x._id)} aria-label={`Open ${x.fileName}`}><ExternalLink size={12} /></Button>}
                  {canUpload && x?.status !== 'verified' && (
                    <>
                      <input ref={el => { inputs.current[t] = el; }} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" aria-label={`Upload ${d.docs.labels[t]}`} onChange={e => upload(t, e.target.files?.[0])} />
                      <Button size="xs" variant={x ? 'outline' : 'primary'} loading={busy === t} onClick={() => inputs.current[t]?.click()}><Upload size={12} /> {x ? 'Replace' : 'Upload'}</Button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="text-[11.5px] text-slate mt-2">PDF or a clear photo (JPG, PNG), up to 10 MB each. Only Solvexo’s partner team can see these.</p>
        </section>
      )}

      {d.agreement && (
        <section className="rounded-xl border border-bone bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate mb-2">Your first 30 days</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {weeks.map(w => (
              <div key={w}>
                <p className="text-[11px] font-semibold text-slate mb-1">Week {w}</p>
                <ul className="flex flex-col gap-1 list-none p-0 m-0">
                  {d.checklist.filter(c => c.week === w).map(c => {
                    const Icon = c.done ? CheckCircle2 : Circle;
                    return (
                      <li key={c.key} className="flex items-start gap-2 text-[12.5px]">
                        <Icon size={15} className={clsx('shrink-0 mt-[1px]', c.done ? 'text-success' : 'text-slate/60')} aria-hidden />
                        <span>{c.label}{!c.done && c.dueAt && <span className={clsx('block text-[11px]', c.overdue ? 'text-error' : 'text-slate')}>by {fmtDay(c.dueAt)}</span>}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
