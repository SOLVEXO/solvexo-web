import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { clsx } from 'clsx';
import type { ButtonVariant, ButtonSize } from '@/types';

export type { ButtonVariant, ButtonSize };

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   ButtonVariant;
  size?:      ButtonSize;
  icon?:      ReactNode;
  fullWidth?: boolean;
  children:   ReactNode;
}

const BASE =
  'inline-flex items-center justify-center gap-[6px] rounded-md font-medium cursor-pointer ' +
  'transition-all duration-[180ms] whitespace-nowrap outline-none select-none shrink-0 ' +
  'no-underline leading-[1.4]';

const SIZES: Record<ButtonSize, string> = {
  sm: 'py-[6px] px-3 text-[12px]',
  md: 'py-[10px] px-[18px] text-[13px]',
  lg: 'py-[13px] px-6 text-[15px]',
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary:   'bg-brand-orange text-white border-0 hover:opacity-[0.88]',
  secondary: 'bg-brand-pale-orange text-brand-deep-orange border-0 hover:opacity-[0.88]',
  ghost:     'bg-transparent text-slate border border-bone hover:bg-cream',
  dark:      'bg-charcoal text-white border-0 hover:opacity-[0.88]',
  danger:    'bg-error-bg text-error border-0 hover:opacity-[0.88]',
};

export function Button({
  variant   = 'primary',
  size      = 'md',
  icon,
  fullWidth = false,
  style,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        BASE,
        SIZES[size],
        VARIANTS[variant],
        fullWidth && 'w-full',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className,
      )}
      style={style}
      disabled={disabled}
      {...props}
    >
      {icon && (
        <span className={clsx('leading-none shrink-0', size === 'sm' ? 'text-[12px]' : 'text-[14px]')}>
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}
