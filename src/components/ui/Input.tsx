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

// Reference exact: padding "9px 12px", borderRadius 8, border bone, bg white, fontFamily Poppins, fontSize 13
const baseStyle: React.CSSProperties = {
  fontFamily: "'Poppins', sans-serif",
  fontSize: 13,
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid #E8E6DC',
  background: '#FFFFFF',
  color: '#2C2A28',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftAddon, className, style, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label
          className="block text-[12px] font-medium text-charcoal mb-1.5"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftAddon && (
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 select-none"
            style={{ fontSize: 13, color: '#8C8A82' }}
          >
            {leftAddon}
          </span>
        )}
        <input
          ref={ref}
          className={clsx(
            'placeholder:text-slate',
            'focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10',
            'disabled:opacity-50 disabled:bg-cream',
            leftAddon && 'pl-6',
            error && '!border-error',
            className,
          )}
          style={{ ...baseStyle, ...(leftAddon ? { paddingLeft: 24 } : {}), ...style }}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-[11px] text-error" style={{ fontFamily: "'Poppins', sans-serif" }}>{error}</p>}
    </div>
  ),
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, rows = 4, style, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-[12px] font-medium text-charcoal mb-1.5" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={clsx('resize-vertical placeholder:text-slate focus:border-brand-orange', error && '!border-error', className)}
        style={{ ...baseStyle, resize: 'vertical', ...style }}
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
      <label className="block text-[12px] font-medium text-charcoal mb-1.5" style={{ fontFamily: "'Poppins', sans-serif" }}>
        {label}
      </label>
    )}
    <select
      ref={ref}
      className={clsx('appearance-none cursor-pointer', error && '!border-error', className)}
      style={{ ...baseStyle, ...style }}
      {...props}
    >
      {children}
    </select>
    {error && <p className="mt-1 text-[11px] text-error">{error}</p>}
  </div>
));
Select.displayName = 'Select';
