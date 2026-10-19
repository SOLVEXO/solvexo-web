import { useState } from 'react';
import { ts } from '@/utils/tStatic';
import { Check, Package, X } from 'lucide-react';
import { apiRequestReturn, type OrderLineItem } from '@/api/services/orders';
import { fashionTheme as t } from '../../theme.config';
import { Field, Notice, PillButton, TextArea } from '../../ui/primitives';
import { buyerReturnText, returnNextStepHint } from '../../../returnText';
import { ExchangeItemLink, ReturnProgress } from './OrderExtras';

/** One returnable line: status / progress when a return exists, otherwise a "Request return" form. */
export function ReturnItemRow({ orderId, item }: { orderId: string; item: OrderLineItem }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const stored = item.returnStatus ?? 'none';
  const status = stored === 'none' && submitted ? 'requested' : stored;
  const hasReturn = status !== 'none';
  const hint = returnNextStepHint(status);
  const label = item.returnLabel?.labelUrl && /^https?:\/\//i.test(item.returnLabel.labelUrl) ? item.returnLabel : null;

  const submit = async () => {
    if (!reason.trim()) { setFieldError('Please describe the issue.'); return; }
    setFieldError(''); setSubmitError(''); setSubmitting(true);
    try {
      await apiRequestReturn(orderId, { reason: reason.trim(), itemIds: [item.itemId] });
      setSubmitted(true); setOpen(false); setReason('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'We could not submit your return request.');
    } finally { setSubmitting(false); }
  };

  return (
    <li className="py-4" style={{ borderTop: `1px solid ${t.colors.border}` }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center overflow-hidden" style={{ background: t.colors.bgAlt, borderRadius: 12 }}>
            {item.image ? <img src={item.image} alt="" className="size-full object-cover" /> : <Package size={18} style={{ color: t.colors.inkMuted }} aria-hidden />}
          </span>
          <div className="min-w-0">
            <p className="m-0 truncate text-[15px] font-medium">{item.name}</p>
            <p className="m-0 text-[13px]" style={{ color: t.colors.inkMuted }}>Quantity {item.quantity}</p>
          </div>
        </div>
        {hasReturn ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: status === 'rejected' ? t.colors.danger : t.colors.success }}>{status === 'rejected' ? <X size={15} aria-hidden /> : <Check size={15} aria-hidden />}{buyerReturnText(status)}</span>
        ) : (
          <PillButton variant="outline" aria-expanded={open} onClick={() => { setOpen(o => !o); setFieldError(''); setSubmitError(''); }}>{open ? 'Cancel' : 'Request return'}</PillButton>
        )}
      </div>

      {item.exchangeOrderId && <div className="mt-2.5"><ExchangeItemLink orderId={item.exchangeOrderId} orderNumber={item.exchangeOrderNumber} /></div>}
      <ReturnProgress status={status} rejectReason={item.returnRejectReason} />
      {hint && <p className="m-0 mt-2 text-[13px]" style={{ color: t.colors.inkMuted }}>{hint}</p>}
      {label && status === 'approved' && (
        <div className="mt-3 rounded-2xl p-3.5" style={{ background: t.colors.bgAlt }}>
          <a href={label.labelUrl ?? undefined} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold underline" style={{ color: t.colors.ink }}>{ts('pg.download_return_label', 'Download return label')}</a>
          {(label.carrier || label.trackingNumber) && <p className="m-0 mt-1 text-[13px]" style={{ color: t.colors.inkMuted }}>{[label.carrier, label.trackingNumber].filter(Boolean).join(' · ')}</p>}
        </div>
      )}

      {open && (
        <form className="mt-4 flex flex-col gap-3" onSubmit={e => { e.preventDefault(); void submit(); }} noValidate>
          <Field label={ts('pg.what_went_wrong', 'What went wrong?')} error={fieldError} required>
            {p => <TextArea {...p} value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder={ts('pg.describe_the_issue_for_example_damaged_o', 'Describe the issue, for example damaged or wrong item')} />}
          </Field>
          {submitError && <Notice tone="error">{submitError}</Notice>}
          <div><PillButton type="submit" loading={submitting}>{ts('pg.submit_request', 'Submit request')}</PillButton></div>
        </form>
      )}
    </li>
  );
}
