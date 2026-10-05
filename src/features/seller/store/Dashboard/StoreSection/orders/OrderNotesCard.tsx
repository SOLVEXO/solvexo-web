import { useState } from 'react';
import { StickyNote, AlertCircle } from 'lucide-react';
import { Button, Modal, Textarea } from '@/components/comman/ui';
import { useToast } from '@/contexts/ToastContext';
import { apiUpdateOrderNote } from '@/api/services/orders';
import { OrderSideCard } from './OrderTimelineCard';

const MAX_NOTE = 2000;

interface Props {
  storeId: string;
  orderId: string;
  note: string;
  canEdit: boolean;
  onSaved: (note: string) => void;
}

export function OrderNotesCard({ storeId, orderId, note, canEdit, onSaved }: Props) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const openModal = () => { setDraft(note); setError(''); setOpen(true); };

  const save = () => {
    if (busy) return;
    setBusy(true);
    setError('');
    apiUpdateOrderNote(storeId, orderId, draft.trim())
      .then(res => { onSaved(res.data.note ?? draft.trim()); toast.success('Note saved'); setOpen(false); })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to save note.'))
      .finally(() => setBusy(false));
  };

  return (
    <>
      <OrderSideCard
        title="Notes"
        icon={StickyNote}
        action={canEdit ? (
          <button onClick={openModal} className="text-[12px] font-semibold text-brand-orange hover:underline cursor-pointer">Edit</button>
        ) : undefined}
      >
        {note
          ? <p className="text-[12.5px] text-charcoal whitespace-pre-wrap break-words">{note}</p>
          : <p className="text-[12.5px] text-slate">No notes</p>}
      </OrderSideCard>

      {open && (
        <Modal
          title="Edit notes"
          onClose={() => { if (!busy) setOpen(false); }}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
              <Button size="sm" onClick={save} loading={busy} disabled={busy}>Save</Button>
            </div>
          }
        >
          <div className="flex flex-col gap-2">
            <Textarea rows={5} maxLength={MAX_NOTE} aria-label="Order notes" value={draft} onChange={e => setDraft(e.target.value)} disabled={busy} />
            <span className="text-[11px] text-slate text-right">{draft.length}/{MAX_NOTE}</span>
            {error && <p role="alert" className="flex items-center gap-1.5 text-[12px] text-error"><AlertCircle size={13} /> {error}</p>}
          </div>
        </Modal>
      )}
    </>
  );
}
