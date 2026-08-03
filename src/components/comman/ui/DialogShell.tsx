import { useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { useFocusTrap } from './useFocusTrap';

export interface DialogShellProps {
  onClose: () => void;
  children: ReactNode;
  /** 'center' (default) for a typical modal; 'top' for an overlay that should
   *  sit near the top of the viewport (e.g. a command palette). */
  align?: 'center' | 'top';
  /** Applied to the dialog panel itself (width/max-height/etc.) — the shell only owns backdrop + positioning + focus trap. */
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  /** Extra keydown handling on the dialog panel itself (e.g. arrow-key navigation) — on top of the Escape-to-close the focus trap already provides. */
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
}

/**
 * The backdrop + centered/near-top panel + focus-trap wiring shared by every
 * modal-style overlay (Modal, CommandPalette, DateTimePickerModal) — each of
 * those previously reimplemented this exact shell independently. Callers
 * still own their own header/body/footer markup via `children`.
 */
export function DialogShell({ onClose, children, align = 'center', className, style, ariaLabel, ariaLabelledBy, onKeyDown }: DialogShellProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, onClose);

  return (
    <div
      className={clsx(
        'fixed inset-0 z-[9999] flex justify-center p-4',
        align === 'top' ? 'items-start pt-[12vh]' : 'items-center',
      )}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        style={style}
        className={clsx('relative flex flex-col w-full bg-white rounded-2xl border border-bone overflow-hidden outline-none', className)}
      >
        {children}
      </div>
    </div>
  );
}
