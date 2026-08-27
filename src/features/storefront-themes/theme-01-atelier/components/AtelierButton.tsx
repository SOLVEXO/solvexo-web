import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { atelierTheme as t } from '../theme.config';

interface AtelierButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline';
  loading?: boolean;
}

/** Theme 01's own button — sharp corners, outline-first editorial feel,
 *  uppercase letter-spaced label. Not the legacy `ThemedButton`. */
export const AtelierButton = forwardRef<HTMLButtonElement, AtelierButtonProps>(
  ({ variant = 'primary', loading, disabled, children, style, ...rest }, ref) => {
    const isPrimary = variant === 'primary';
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        style={{
          fontFamily: t.fonts.body,
          fontSize: '12px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontWeight: 600,
          padding: '14px 28px',
          borderRadius: t.radius.none,
          border: `1px solid ${t.colors.ink}`,
          background: isPrimary ? t.colors.ink : 'transparent',
          color: isPrimary ? '#FFFFFF' : t.colors.ink,
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'opacity 150ms',
          ...style,
        }}
        {...rest}
      >
        {loading && <Loader2 size={13} className="animate-spin" />}
        {children}
      </button>
    );
  },
);
AtelierButton.displayName = 'AtelierButton';
