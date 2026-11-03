import { clsx } from 'clsx';

interface LogoProps {
  size?:          number;
  showWordmark?:  boolean;
  className?:     string;
  variant?:       'dark' | 'light';
}

/**
 * Solvexo's original logo artwork (public/brand, cut from the master logo with transparent backgrounds):
 * - solvexo-icon.png        the square "S" mark on its own
 * - solvexo-logo.png        mark + black "Solvex" wordmark with the orange "o", for light backgrounds
 * - solvexo-logo-light.png  same with a white wordmark, for dark backgrounds
 */
const ICON_SRC = '/brand/solvexo-icon.png';
const LOGO_SRC = { dark: '/brand/solvexo-logo.png', light: '/brand/solvexo-logo-light.png' } as const;
/** Width / height of the full logo artwork (833 × 285). */
const LOGO_RATIO = 833 / 285;

export function SolvexoIcon({ size = 32 }: { size?: number }) {
  return <img src={ICON_SRC} alt="Solvexo" width={size} height={size} className="shrink-0 select-none" draggable={false} />;
}

/** `size` is the height of the mark; `variant` is the wordmark colour: 'dark' text for light backgrounds, 'light' for dark ones. */
export function SolvexoLogo({ size = 32, showWordmark = true, className, variant = 'dark' }: LogoProps) {
  if (!showWordmark) {
    return <div className={clsx('flex items-center', className)}><SolvexoIcon size={size} /></div>;
  }
  return (
    <div className={clsx('flex items-center', className)}>
      <img
        src={LOGO_SRC[variant]}
        alt="Solvexo"
        height={size}
        width={Math.round(size * LOGO_RATIO)}
        style={{ height: size, width: 'auto' }}
        className="shrink-0 select-none"
        draggable={false}
      />
    </div>
  );
}
