import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { novaTheme as t } from '../theme.config';

interface NovaButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline';
  loading?: boolean;
}

/** Theme 02's own button — solid pill by default, bold and accent-forward
 *  (the deliberate opposite of Atelier's outline-first editorial feel: see
 *  `AtelierButton`'s own doc comment to compare). Not the legacy
 *  `ThemedButton`, and not `AtelierButton` — genuinely independent. */
export const NovaButton = forwardRef<HTMLButtonElement, NovaButtonProps>(
  ({ variant = 'primary', loading, disabled, children, style, ...rest }, ref) => {
    const isPrimary = variant === 'primary';
    // A merchant's saved button style (`Theme` scope in Customize) governs
    // the PRIMARY variant's fill — same three-way choice Atelier exposes,
    // but Nova's own defaults: 'solid' fills with the vivid accent (Nova's
    // identity leads with color, unlike Atelier's ink-first default), 'soft'
    // fills with a light accent tint, 'outline' stays a bold accent-colored
    // outline. The SECONDARY variant always stays a quiet ink outline — it's
    // already this theme's quiet button, no merchant control needed there.
    let bg: string, border: string, color: string;
    if (!isPrimary) {
      bg = 'transparent'; border = t.colors.ink; color = t.colors.ink;
    } else if (t.buttonStyle === 'outline') {
      bg = 'transparent'; border = t.colors.accent; color = t.colors.accent;
    } else if (t.buttonStyle === 'soft') {
      bg = t.colors.bgAlt; border = t.colors.bgAlt; color = t.colors.accent;
    } else {
      bg = t.colors.accent; border = t.colors.accent; color = t.colors.accentInk;
    }
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className="nova-focus-ring"
        style={{
          fontFamily: t.fonts.display,
          fontSize: '13px',
          letterSpacing: '0.01em',
          fontWeight: 700,
          padding: '14px 30px',
          borderRadius: t.buttonRadiusPx,
          border: `1.5px solid ${border}`,
          background: bg,
          color,
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: isPrimary && t.buttonWidth === 'full' ? '100%' : undefined,
          transition: 'opacity 150ms, transform 150ms',
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
NovaButton.displayName = 'NovaButton';
