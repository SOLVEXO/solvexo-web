import { type ButtonHTMLAttributes, type ReactNode, type CSSProperties } from 'react';
import type { ButtonVariant, ButtonSize } from '@/types';

export type { ButtonVariant, ButtonSize };

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   ButtonVariant;
  size?:      ButtonSize;
  icon?:      ReactNode;
  fullWidth?: boolean;
  children:   ReactNode;
}

// ── Exact values from reference source (Btn component) ───────────────────────
const BASE: CSSProperties = {
  display:        'inline-flex',
  alignItems:     'center',
  justifyContent: 'center',
  gap:            6,
  borderRadius:   8,
  fontFamily:     "'Poppins', sans-serif",
  fontWeight:     500,
  cursor:         'pointer',
  border:         'none',           // overridden by ghost variant below
  transition:     'all 0.18s ease',
  whiteSpace:     'nowrap',
  outline:        'none',
  userSelect:     'none',
  flexShrink:     0,
  textDecoration: 'none',
  lineHeight:     1.4,
  boxSizing:      'border-box',
};

const SIZES: Record<ButtonSize, CSSProperties> = {
  sm: { padding: '6px 12px',  fontSize: 12 },
  md: { padding: '10px 18px', fontSize: 13 },
  lg: { padding: '13px 24px', fontSize: 15 },
};

// Colors exact from reference C object
const VARIANTS: Record<ButtonVariant, CSSProperties> = {
  primary:   { background: '#D97757', color: '#FFFFFF' },
  secondary: { background: '#FBECE4', color: '#B95A3A' },
  ghost:     { background: 'transparent', color: '#8C8A82', border: '1px solid #E8E6DC' },
  dark:      { background: '#2C2A28', color: '#FFFFFF' },
  danger:    { background: '#FDEAEA', color: '#C13030' },
};

// Hover darkening via opacity — applied on mouseenter/leave
const HOVER_OPACITY: Record<ButtonVariant, number> = {
  primary:   0.88,
  secondary: 0.88,
  ghost:     1,     // ghost uses bg on hover instead
  dark:      0.88,
  danger:    0.88,
};

export function Button({
  variant   = 'primary',
  size      = 'md',
  icon,
  fullWidth = false,
  style,
  className,
  onMouseEnter,
  onMouseLeave,
  disabled,
  children,
  ...props
}: ButtonProps) {
  // Merge: base ← size ← variant ← fullWidth ← user style overrides
  // This is exactly how the reference works: { ...base, ...sizes[size], ...variants[variant], ...style }
  const computedStyle: CSSProperties = {
    ...BASE,
    ...SIZES[size],
    ...VARIANTS[variant],
    ...(fullWidth  ? { width: '100%', justifyContent: 'center' } : {}),
    ...(disabled   ? { opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' } : {}),
    ...style,  // user overrides last — e.g. borderColor override for dark-bg ghost buttons
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      if (variant === 'ghost') {
        (e.currentTarget as HTMLButtonElement).style.background = '#FAF9F5';
      } else {
        (e.currentTarget as HTMLButtonElement).style.opacity = String(HOVER_OPACITY[variant]);
      }
    }
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      if (variant === 'ghost') {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      } else {
        (e.currentTarget as HTMLButtonElement).style.opacity = '1';
      }
    }
    onMouseLeave?.(e);
  };

  return (
    <button
      style={computedStyle}
      className={className}
      disabled={disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {icon && (
        <span style={{ fontSize: size === 'sm' ? 12 : 14, lineHeight: 1, flexShrink: 0 }}>
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}
