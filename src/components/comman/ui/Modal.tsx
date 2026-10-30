import { X } from 'lucide-react';
import { useId, useRef, type CSSProperties, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { DialogShell } from './DialogShell';

export interface ModalProps {
  title:    string;
  onClose:  () => void;
  children: ReactNode;
  footer?:  ReactNode;
  width?:   number;
  /** Renders as a native-app bottom sheet below `sm` (full-width, rounded top
   *  only, slides up) instead of a centered dialog — stays a normal centered
   *  modal at `sm` and up either way. On by default because a box floating in
   *  the middle of a phone screen is the clearest giveaway of a website; pass
   *  `mobileSheet={false}` for the rare overlay that genuinely wants to stay
   *  centered (a confirm prompt, a picker anchored to its trigger). */
  mobileSheet?: boolean;
}

export function Modal({ title, onClose, children, footer, width = 440, mobileSheet = true }: ModalProps) {
  const titleId = useId();
  const dragY = useRef(0);

  const style: CSSProperties = mobileSheet
    ? { '--modal-w': `${width}px` } as CSSProperties
    : { maxWidth: width };

  return (
    <DialogShell
      onClose={onClose}
      align={mobileSheet ? 'bottom-mobile' : 'center'}
      ariaLabelledBy={titleId}
      // `dvh` on mobile: a sheet sized against the *large* viewport gets its
      // footer pushed under the browser's own bar once the URL bar collapses.
      className={clsx('max-h-[86dvh] sm:max-h-[90vh]', mobileSheet && 'max-w-full sm:max-w-[var(--modal-w)]')}
      style={style}
    >
      {mobileSheet && (
        <div className="sm:hidden shrink-0 py-2 touch-none" onTouchStart={e => { dragY.current = e.touches[0].clientY; }} onTouchEnd={e => { if (e.changedTouches[0].clientY - dragY.current > 70) onClose(); }}>
          <span aria-hidden className="mx-auto block h-1 w-9 rounded-full bg-bone" />
        </div>
      )}
      <div className="flex items-center justify-between px-5 py-4 max-sm:py-3 border-b border-bone shrink-0">
        <p id={titleId} className="text-subheading font-semibold text-carbon">{title}</p>
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="w-7 h-7 pointer-coarse:size-11 flex items-center justify-center rounded-lg bg-transparent border-0 cursor-pointer text-slate hover:bg-fog transition-[background-color,color,transform] duration-fast ease-spring hover:rotate-90 hover:text-carbon"
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-5 py-4 overflow-y-auto overscroll-contain">{children}</div>

      {footer && (
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-bone shrink-0 max-sm:flex-col-reverse max-sm:items-stretch max-sm:[&>*]:w-full">
          {footer}
        </div>
      )}
    </DialogShell>
  );
}
