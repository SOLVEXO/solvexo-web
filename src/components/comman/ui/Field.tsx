import { type ReactNode } from 'react';
import { clsx } from 'clsx';

interface FieldProps {
  label:      string;
  required?:  boolean;
  hint?:      string;
  error?:     string;
  className?: string;
  children:   ReactNode;
}

export function Field({ label, required, hint, error, className, children }: FieldProps) {
  return (
    <div className={clsx('mb-[14px]', className)}>
      <label className="block text-[12px] font-medium text-charcoal mb-[5px]">
        {label}
        {required && <span className="text-brand-orange ml-[2px]"> *</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="mt-1 text-[11px] text-slate">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-[11px] text-error">{error}</p>
      )}
    </div>
  );
}
