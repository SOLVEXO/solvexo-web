import { fashionTheme as t } from '../../theme.config';
import { ts } from '@/utils/tStatic';
import { Field, TextArea } from '../../ui/primitives';
import { CHECKOUT_NOTE_MAX, useCheckoutNote } from '../../../core/checkout/useCheckoutNote';

/** "Add a note to your order" - saved on blur, copied onto the order when it is placed. */
export function OrderNoteField({ checkoutId, initial }: { checkoutId: string; initial?: string }) {
  const n = useCheckoutNote(checkoutId, initial);
  return (
    <div>
      <Field label={ts('checkout.orderNoteLabel', 'Order note (optional)')}>{p => <TextArea {...p} rows={2} value={n.note} maxLength={CHECKOUT_NOTE_MAX} onChange={e => n.setNote(e.target.value)} onBlur={n.save} placeholder={ts('checkout.orderNotePlaceholder', 'Gift message or delivery instructions')} />}</Field>
      <p role="status" className="m-0 mt-1 text-xs" style={{ color: n.state === 'error' ? t.colors.danger : t.colors.inkMuted }}>
        {n.state === 'saving' ? ts('checkout.noteSaving', 'Saving…') : n.state === 'saved' ? ts('checkout.noteSaved', 'Note saved') : n.state === 'error' ? ts('checkout.noteError', 'Could not save the note.') : `${n.note.length}/${CHECKOUT_NOTE_MAX}`}
      </p>
    </div>
  );
}
