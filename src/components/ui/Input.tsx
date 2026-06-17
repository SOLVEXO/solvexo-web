import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftAddon?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

// Reference exact values: py-[9px] px-3, rounded-md (8px), border-bone, bg-white, text-[13px], text-charcoal
const BASE =
  'w-full py-[9px] px-3 rounded-md border border-bone bg-white text-[13px] text-charcoal ' +
  'outline-none transition-colors duration-150 ' +
  'placeholder:text-slate focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 ' +
  'disabled:opacity-50 disabled:bg-cream';

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftAddon, className, style, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-[12px] font-medium text-charcoal mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftAddon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 select-none text-[13px] text-slate">
            {leftAddon}
          </span>
        )}
        <input
          ref={ref}
          className={clsx(
            BASE,
            leftAddon && 'pl-6',
            error && '!border-error',
            className,
          )}
          style={style}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-[11px] text-error">{error}</p>}
    </div>
  ),
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, rows = 4, style, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-[12px] font-medium text-charcoal mb-1.5">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={clsx(
          BASE,
          'resize-vertical focus:border-brand-orange',
          error && '!border-error',
          className,
        )}
        style={style}
        {...props}
      />
      {error && <p className="mt-1 text-[11px] text-error">{error}</p>}
    </div>
  ),
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }
>(({ label, error, className, children, style, ...props }, ref) => (
  <div className="w-full">
    {label && (
      <label className="block text-[12px] font-medium text-charcoal mb-1.5">
        {label}
      </label>
    )}
    <select
      ref={ref}
      className={clsx(BASE, 'appearance-none cursor-pointer', error && '!border-error', className)}
      style={style}
      {...props}
    >
      {children}
    </select>
    {error && <p className="mt-1 text-[11px] text-error">{error}</p>}
  </div>
));
Select.displayName = 'Select';
