import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:      string;
  error?:      string;
  leftAddon?:  string;
  rightIcon?:  ReactNode;  // e.g. eye toggle for password
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const BASE =
  'w-full py-[9px] px-3 rounded-md border border-bone bg-white text-[13px] text-charcoal ' +
  'outline-none transition-colors duration-150 ' +
  'placeholder:text-slate focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 ' +
  'disabled:opacity-50 disabled:bg-cream';

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftAddon, rightIcon, className, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-[12px] font-medium text-charcoal mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftAddon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 select-none text-[13px] text-slate pointer-events-none">
            {leftAddon}
          </span>
        )}
        <input
          ref={ref}
          className={clsx(
            BASE,
            leftAddon  && 'pl-6',
            rightIcon  && 'pr-9',
            error      && '!border-error',
            className,
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p className="mt-1 text-[11px] text-error">{error}</p>}
    </div>
  ),
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, rows = 4, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-[12px] font-medium text-charcoal mb-1.5">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={clsx(BASE, 'resize-vertical', error && '!border-error', className)}
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
>(({ label, error, className, children, ...props }, ref) => (
  <div className="w-full">
    {label && (
      <label className="block text-[12px] font-medium text-charcoal mb-1.5">
        {label}
      </label>
    )}
    <div className="relative">
      <select
        ref={ref}
        className={clsx(BASE, 'appearance-none cursor-pointer pr-8', error && '!border-error', className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={13}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none"
      />
    </div>
    {error && <p className="mt-1 text-[11px] text-error">{error}</p>}
  </div>
));
Select.displayName = 'Select';
