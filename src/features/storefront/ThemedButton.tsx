import { clsx } from 'clsx';
import { useStorefront } from './StorefrontContext';

interface ThemedButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  /** `sm` fits inline in a nav bar or footer column; `lg` is a bigger hero
   *  CTA. Omit to use the theme's own `buttonSize` setting (most callers —
   *  a section CTA should follow the seller's chosen size; only inline nav/
   *  footer links force `sm` regardless of that setting). An explicit `size`
   *  also opts the button out of `buttonWidth: 'full'` — a nav/footer
   *  "highlight" link should never stretch to fill its row. */
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASS: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'px-3.5 py-[6px] text-[12px]',
  md: 'px-5 py-[10px] text-[13px]',
  lg: 'px-6 py-[13px] text-[14.5px]',
};

// The one shared primary-CTA button every storefront section renders
// through (Hero slide CTA, Image-with-Text CTA, …) instead of each section
// hardcoding its own `style={{background: cfg.primaryColor}}` button — so a
// seller's `buttonStyle`/`buttonSize`/`buttonRadius`/`buttonWidth` theme
// choice actually shows up consistently everywhere, and only ever affects
// buttons (never product/testimonial cards or images — see StorefrontCfg).
export function ThemedButton({ onClick, children, className, size }: ThemedButtonProps) {
  const { cfg } = useStorefront();
  const resolvedSize = size ?? cfg.buttonSize;
  const fullWidth = size === undefined && cfg.buttonWidth === 'full';

  const style =
    cfg.buttonStyle === 'outline'
      ? { background: 'transparent', color: cfg.primaryColor, border: `1.5px solid ${cfg.primaryColor}`, borderRadius: cfg.buttonRadiusPx }
      : cfg.buttonStyle === 'soft'
      ? { background: `${cfg.primaryColor}1A`, color: cfg.primaryColor, border: 'none', borderRadius: cfg.buttonRadiusPx }
      : { background: cfg.primaryColor, color: '#fff', border: 'none', borderRadius: cfg.buttonRadiusPx };

  return (
    <button
      onClick={onClick}
      className={clsx(SIZE_CLASS[resolvedSize], 'font-bold cursor-pointer', fullWidth && 'w-full block text-center', className)}
      style={style}
    >
      {children}
    </button>
  );
}
