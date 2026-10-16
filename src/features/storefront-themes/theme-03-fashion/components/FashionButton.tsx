import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { fashionTheme as t } from '../theme.config';
import { buttonLook } from './buttonLook';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  variant?: 'primary' | 'outline';
  children?: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
  /** Pill with the sliding arrow chip (hero / section calls to action). */
  arrow?: boolean;
  style?: CSSProperties;
}


export function FashionButton({ variant = 'primary', children, fullWidth, loading, arrow, style, type = 'button', disabled, className, ...rest }: Props) {
  const look = buttonLook(variant);
  const width: CSSProperties = fullWidth || t.buttonWidth === 'full' ? { width: '100%' } : {};
  if (arrow) {
    const chipBg = variant === 'primary' ? t.colors.bg : t.colors.ink;
    const chipFg = variant === 'primary' ? t.colors.ink : t.colors.bg;
    return (
      <button type={type} disabled={disabled || loading} aria-busy={loading || undefined} {...rest} className={`fx-cta ${className ?? ''}`} style={{ ...look, ...width, ...style }}>
        <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
        <span className="fx-cta-icon" style={{ background: chipBg, color: chipFg }}><ArrowUpRight size={16} /></span>
      </button>
    );
  }
  return <button type={type} disabled={disabled || loading} aria-busy={loading || undefined} {...rest} className={`fx-pill ${className ?? ''}`} style={{ ...look, ...width, ...style }}>{children}</button>;
}
