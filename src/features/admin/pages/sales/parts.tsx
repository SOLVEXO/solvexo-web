import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Input, Modal, Select, Textarea, Toggle } from '@/components/comman/ui';
import {
  CONSENT_LABELS, LEAD_SOURCES, LOST_REASONS, LOST_REASON_LABELS, SOURCE_LABELS, STAGE_LABELS,
  type ConsentStatus, type LeadInput, type LeadSource, type LeadStage, type SalesLead, type SalesOwner,
} from '@/api/services/salesOps';
import { CONSENT_COLORS, STAGE_COLORS, consentSentence, errMsg } from './sales.utils';

export function StageBadge({ stage }: { stage: LeadStage }) {
  return <Badge color={STAGE_COLORS[stage]} size="sm">{STAGE_LABELS[stage]}</Badge>;
}

/** Marketing-email permission: Agreed / Not asked / Asked / Unsubscribed. */
export function ConsentBadge({ status }: { status: ConsentStatus | null | undefined }) {
  const s = status ?? 'none';
  return <Badge color={CONSENT_COLORS[s]} size="sm">{CONSENT_LABELS[s]}</Badge>;
}

/** Add or edit a lead. Reps never see the owner field (the server makes them the owner of what they add). */
export function LeadFormModal({ lead, owners, canAssign, onClose, onSave }: {
  lead?: SalesLead | null;
  owners: SalesOwner[];
  canAssign: boolean;
  onClose: () => void;
  onSave: (input: LeadInput) => Promise<void>;
}) {
  const [f, setF] = useState({
    name: lead?.name ?? '', businessName: lead?.businessName ?? '', email: lead?.email ?? '', phone: lead?.phone ?? '',
    city: lead?.city ?? '', businessType: lead?.businessType ?? '', source: (lead?.source ?? 'manual') as LeadSource,
    sourceDetail: lead?.sourceDetail ?? '', dealValuePKR: lead?.dealValuePKR != null ? String(lead.dealValuePKR) : '',
    ownerAdminId: lead?.ownerAdminId ?? '',
  });
  const consentWas = lead?.marketingConsent?.status === 'granted';
  const [consent, setConsent] = useState(consentWas);
  const [consentNote, setConsentNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; existingId?: string } | null>(null);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    if (!f.name.trim()) return setError({ text: 'Add the person’s name.' });
    if (!f.email.trim() && !f.phone.trim()) return setError({ text: 'Add an email or a phone number so you can reach them.' });
    const value = f.dealValuePKR.trim() ? Number(f.dealValuePKR.replace(/,/g, '')) : null;
    if (value !== null && (!Number.isFinite(value) || value < 0)) return setError({ text: 'Deal value must be a number in PKR.' });
    if (consent && !consentWas && consentNote.trim().length < 3) return setError({ text: 'Say where and when the lead agreed, e.g. ‘Asked on call 24 Nov’.' });
    setBusy(true); setError(null);
    const orNull = (v: string) => v.trim() || null;
    try {
      await onSave({
        name: f.name.trim(), businessName: orNull(f.businessName), email: orNull(f.email), phone: orNull(f.phone),
        city: orNull(f.city), businessType: orNull(f.businessType), source: f.source, sourceDetail: orNull(f.sourceDetail),
        dealValuePKR: value, ...(canAssign ? { ownerAdminId: f.ownerAdminId || null } : {}),
        // Only sent when it changed: turning it on records who agreed and where; off on an agreed lead = unsubscribed.
        ...(consent !== consentWas ? { marketingConsent: consent, ...(consent ? { marketingConsentNote: consentNote.trim() } : {}) } : {}),
      });
    } catch (e) {
      const details = (e as { details?: { existingLeadId?: string } }).details;
      setError({ text: errMsg(e, 'Could not save the lead.'), existingId: details?.existingLeadId });
      setBusy(false);
    }
  };

  return (
    <Modal
      title={lead ? 'Edit lead' : 'Add a lead'}
      onClose={onClose}
      width={560}
      footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={busy}>{lead ? 'Save' : 'Add lead'}</Button></div>}
    >
      <div className="grid sm:grid-cols-2 gap-3">
        <Input label="Name *" value={f.name} onChange={set('name')} />
        <Input label="Business name" value={f.businessName} onChange={set('businessName')} />
        <Input label="Email" type="email" value={f.email} onChange={set('email')} />
        <Input label="Phone / WhatsApp" value={f.phone} onChange={set('phone')} placeholder="03xx xxxxxxx" />
        <Input label="City" value={f.city} onChange={set('city')} />
        <Input label="What they sell" value={f.businessType} onChange={set('businessType')} placeholder="Clothing, grocery, cosmetics…" />
        <Select label="Source" value={f.source} onChange={set('source')}>
          {LEAD_SOURCES.map(s => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
        </Select>
        <Input label="Source detail" value={f.sourceDetail} onChange={set('sourceDetail')} placeholder="Campaign, event or referrer" />
        <Input label="Deal value (PKR / year)" inputMode="numeric" value={f.dealValuePKR} onChange={set('dealValuePKR')} placeholder="e.g. 60000" />
        {canAssign && (
          <Select label="Owner" value={f.ownerAdminId} onChange={set('ownerAdminId')}>
            <option value="">Unassigned</option>
            {owners.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
          </Select>
        )}
      </div>
      <div className="mt-4 pt-3 border-t border-bone flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium text-charcoal">Agreed to marketing emails</p>
            <p className="text-[12px] text-slate">
              {consent && !consentWas ? 'Only switch this on if they said yes to news and offers by email.'
                : consentWas && !consent ? 'They will be marked as unsubscribed and get no more marketing emails.'
                  : lead ? consentSentence(lead.marketingConsent) : 'Only switch this on if they said yes to news and offers by email.'}
            </p>
          </div>
          <Toggle ariaLabel="Agreed to marketing emails" checked={consent} onChange={setConsent} />
        </div>
        {consent && !consentWas && (
          <Input label="Where and when did they agree? *" placeholder="e.g. Asked on call 24 Nov" maxLength={300} value={consentNote} onChange={e => setConsentNote(e.target.value)} />
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-[12px] text-error">
          {error.text}{' '}
          {error.existingId && <Link className="underline font-medium" to={`/admin/sales/leads/${error.existingId}`} onClick={onClose}>Open that lead</Link>}
        </p>
      )}
    </Modal>
  );
}

/** Moving a lead to Lost always asks why — the reasons feed the win/loss report. */
export function LostReasonModal({ name, onClose, onConfirm }: { name: string; onClose: () => void; onConfirm: (reason: string, note: string) => Promise<void> }) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      title={`Why was ${name} lost?`}
      onClose={onClose}
      footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="danger" disabled={!reason} loading={busy} onClick={async () => { setBusy(true); try { await onConfirm(reason, note.trim()); } finally { setBusy(false); } }}>Mark as lost</Button></div>}
    >
      <div className="flex flex-col gap-3">
        <Select label="Reason" value={reason} onChange={e => setReason(e.target.value)}>
          <option value="">Choose a reason</option>
          {LOST_REASONS.map(r => <option key={r} value={r}>{LOST_REASON_LABELS[r]}</option>)}
        </Select>
        <Textarea label="Note (optional)" rows={3} value={note} onChange={e => setNote(e.target.value)} />
      </div>
    </Modal>
  );
}
