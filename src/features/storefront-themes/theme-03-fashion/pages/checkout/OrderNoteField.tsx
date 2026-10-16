import { fashionTheme as t } from '../../theme.config';
import { Field, TextArea } from '../../ui/primitives';
import { CHECKOUT_NOTE_MAX, useCheckoutNote } from '../../../core/checkout/useCheckoutNote';

/** "Add a note to your order" - saved on blur, copied onto the order when it is placed. */
export function OrderNoteField({ checkoutId, initial }: { checkoutId: string; initial?: string }) {
  const n = useCheckoutNote(checkoutId, initial);
  return (
    <div>
      <Field label="Order note (optional)">{p => <TextArea {...p} rows={2} value={n.note} maxLength={CHECKOUT_NOTE_MAX} onChange={e => n.setNote(e.target.value)} onBlur={n.save} placeholder="Gift message or delivery instructions" />}</Field>
      <p role="status" className="m-0 mt-1 text-xs" style={{ color: n.state === 'error' ? t.colors.danger : t.colors.inkMuted }}>
        {n.state === 'saving' ? 'Saving…' : n.state === 'saved' ? 'Note saved' : n.state === 'error' ? 'Could not save the note.' : `${n.note.length}/${CHECKOUT_NOTE_MAX}`}
      </p>
    </div>
  );
}
