import type { CSSProperties } from 'react';
import { Loader2 } from 'lucide-react';
import type { SocialProviderKey } from '@/api/services/customerSocialLogin';
import { GoogleIcon } from './SocialIcons';

function FacebookIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }} aria-hidden="true">
      <path fill="#1877F2" d="M24 12a12 12 0 1 0-13.88 11.85v-8.38H7.08V12h3.04V9.36c0-3 1.79-4.67 4.53-4.67 1.31 0 2.69.23 2.69.23v2.95h-1.52c-1.49 0-1.96.93-1.96 1.88V12h3.34l-.53 3.47h-2.81v8.38A12 12 0 0 0 24 12Z" />
    </svg>
  );
}

interface Props {
  providers: SocialProviderKey[];
  onStart: (provider: SocialProviderKey) => void;
  disabled?: boolean;
  loading?: boolean;
  /** Theme-owned look: the buttons inherit the storefront theme's own font/border/radius. */
  buttonStyle: CSSProperties;
  lineColor: string;
  textColor: string;
  fontFamily: string;
  /** Divider wording differs between sign-in and sign-up pages. */
  dividerText: string;
  position?: 'top' | 'bottom';
}

/** The "Continue with Google / Facebook" buttons of a store's own sign-in/sign-up page. Renders nothing at all
 *  when the store connected no provider, so a store without social sign-in looks exactly as before. */
export function StorefrontSocialButtons({ providers, onStart, disabled, loading, buttonStyle, lineColor, textColor, fontFamily, dividerText, position = 'bottom' }: Props) {
  if (providers.length === 0) return null;

  const buttons = (
    <div className="flex flex-col gap-2.5" aria-busy={loading || undefined}>
      {providers.map(p => (
        <button
          key={p}
          type="button"
          onClick={() => onStart(p)}
          disabled={disabled || loading}
          className="flex items-center justify-center gap-2.5 w-full cursor-pointer"
          style={{ ...buttonStyle, opacity: disabled || loading ? 0.6 : 1 }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : p === 'google' ? <GoogleIcon /> : <FacebookIcon />}
          Continue with {p === 'google' ? 'Google' : 'Facebook'}
        </button>
      ))}
    </div>
  );

  const divider = (
    <div className="flex items-center gap-3" role="separator" style={{ margin: position === 'top' ? '18px 0 0' : '0 0 18px' }}>
      <div style={{ flex: 1, height: 1, background: lineColor }} />
      <span style={{ fontSize: '11.5px', color: textColor, fontFamily }}>{dividerText}</span>
      <div style={{ flex: 1, height: 1, background: lineColor }} />
    </div>
  );

  return position === 'top' ? <div>{buttons}{divider}</div> : <div>{divider}{buttons}</div>;
}
