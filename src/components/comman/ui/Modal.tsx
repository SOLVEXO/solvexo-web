import { X } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { DialogShell } from './DialogShell';

export interface ModalProps {
  title:    string;
  onClose:  () => void;
  children: ReactNode;
  footer?:  ReactNode;
  width?:   number;
}

export function Modal({ title, onClose, children, footer, width = 440 }: ModalProps) {
  const titleId = useId();

  return (
    <DialogShell onClose={onClose} ariaLabelledBy={titleId} className="max-h-[90vh]" style={{ maxWidth: width }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-bone shrink-0">
        <p id={titleId} className="text-[15px] font-semibold text-[#1A1918]">{title}</p>
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-transparent border-0 cursor-pointer text-slate hover:bg-[#F5F3EE]"
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-5 py-4 overflow-y-auto">{children}</div>

      {footer && (
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-bone shrink-0">
          {footer}
        </div>
      )}
    </DialogShell>
  );
}
