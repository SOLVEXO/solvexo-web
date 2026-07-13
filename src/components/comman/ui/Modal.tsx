import { X } from 'lucide-react';
import { useId, useRef, type ReactNode } from 'react';
import { useFocusTrap } from './useFocusTrap';

export interface ModalProps {
  title:    string;
  onClose:  () => void;
  children: ReactNode;
  footer?:  ReactNode;
  width?:   number;
}

export function Modal({ title, onClose, children, footer, width = 440 }: ModalProps) {
  const titleId  = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(dialogRef, onClose);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex flex-col w-full max-h-[90vh] bg-white rounded-2xl border border-bone shadow-[0_32px_80px_rgba(0,0,0,0.28)] overflow-hidden outline-none"
        style={{ maxWidth: width }}
      >
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
      </div>
    </div>
  );
}
