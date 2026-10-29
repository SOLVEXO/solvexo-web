import { clsx } from 'clsx';

interface ToggleProps {
  checked:   boolean;
  onChange:  (v: boolean) => void;
  disabled?: boolean;
  size?:     'sm' | 'md';
  /** Required whenever this toggle has no adjacent visible text that's
   *  already programmatically tied to it (e.g. via a wrapping `<label>`) —
   *  the vast majority of call sites in this app place it next to a plain
   *  `<span>`, which a screen reader has no way to associate with the
   *  control (confirmed by axe: "Buttons must have discernible text"). */
  ariaLabel?: string;
}

export function Toggle({ checked, onChange, disabled = false, size = 'md', ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={clsx(
        size === 'md' ? 'w-10 h-[22px] pointer-coarse:w-[51px] pointer-coarse:h-[31px]' : 'w-8 h-5',
        'relative rounded-full border-none cursor-pointer p-0 shrink-0',
        // The visible pill stays iOS-sized; an invisible box grown past its
        // edges is what the thumb actually hits, so the control clears 44px on
        // a phone without the row it sits in getting taller.
        'pointer-coarse:before:absolute pointer-coarse:before:inset-[-12px_-6px] pointer-coarse:before:content-[""]',
        'transition-colors duration-[180ms]',
        checked ? 'bg-brand-orange' : 'bg-[#d1d5db]',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span
        className={clsx(
          size === 'md'
            ? 'w-4 h-4 top-[3px] pointer-coarse:w-[27px] pointer-coarse:h-[27px] pointer-coarse:top-[2px]'
            : 'w-3.5 h-3.5 top-[3px]',
          'absolute rounded-full bg-white transition-[left] duration-[180ms]',
          checked
            ? (size === 'md' ? 'left-[21px] pointer-coarse:left-[22px]' : 'left-[14px]')
            : (size === 'md' ? 'left-[3px] pointer-coarse:left-[2px]' : 'left-[3px]'),
        )}
      />
    </button>
  );
}
