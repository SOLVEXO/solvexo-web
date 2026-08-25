import { Modal, Button } from '@/components/comman/ui';

/** Shared confirmation dialog for every destructive action in the Store
 *  Builder (delete a page/post, remove a section, remove a block) — nothing
 *  here is ever removed straight from a button click. Replaces the native
 *  browser `confirm()` popup too, so every destructive action gets the same
 *  on-brand dialog instead of an inconsistent OS-styled prompt. */
export function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel, loading, children, confirmVariant = 'danger' }: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  /** Optional extra content below the message — e.g. a checkbox for a related opt-in action (see the Theme Library's "also apply starter content" option). */
  children?: React.ReactNode;
  /** Most confirm dialogs here guard a destructive action ('danger', the default) — a few (e.g. "Activate this theme") aren't destructive at all. */
  confirmVariant?: 'danger' | 'primary';
}) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      width={400}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="text-[13px] text-slate leading-relaxed">{message}</p>
      {children}
    </Modal>
  );
}
