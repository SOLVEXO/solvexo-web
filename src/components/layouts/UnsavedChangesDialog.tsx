import { DialogShell } from '@/components/comman/ui/DialogShell';

/** Accessible (focus-trapped) replacement for `window.confirm` in the theme editor's unsaved-changes guards. */
export function UnsavedChangesDialog({
  title = 'Unsaved changes',
  message = 'You have unsaved changes. If you leave now, they will be discarded.',
  confirmLabel = 'Discard changes',
  onConfirm,
  onCancel,
}: {
  title?: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <DialogShell onClose={onCancel} ariaLabelledBy="unsaved-changes-title" className="w-full max-w-[420px] bg-white rounded-2xl p-6 shadow-xl">
      <h2 id="unsaved-changes-title" className="text-[15px] font-bold text-charcoal m-0">{title}</h2>
      <p className="text-[13px] text-slate mt-2 mb-5">{message}</p>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-bone bg-white text-charcoal cursor-pointer">
          Keep editing
        </button>
        <button type="button" onClick={onConfirm} className="px-4 py-2 rounded-[10px] text-[13px] font-bold text-white border-none cursor-pointer" style={{ background: '#B3413A' }}>
          {confirmLabel}
        </button>
      </div>
    </DialogShell>
  );
}
