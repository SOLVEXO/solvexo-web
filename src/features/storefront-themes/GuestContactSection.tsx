import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { ts } from '@/utils/tStatic';

interface Props {
  email: string;
  onEmailChange: (v: string) => void;
  onBlur: () => void;
  error: string;
  saving: boolean;
  /** Theme-owned input style so the section matches each theme's form fields. */
  inputStyle: CSSProperties;
  textColor: string;
  mutedColor: string;
  dangerColor: string;
  accentColor: string;
  fontFamily: string;
  /** Where "Log in" should bring the buyer back to. */
  returnPath?: string;
}

/** Shopify-style "Contact" block for guest checkout: email + "Already have an account? Log in". */
export function GuestContactSection({
  email, onEmailChange, onBlur, error, saving, inputStyle, textColor, mutedColor, dangerColor, accentColor, fontFamily, returnPath = '/checkout',
}: Props): ReactNode {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3 flex-wrap" style={{ fontFamily, fontSize: '12.5px' }}>
        <label htmlFor="guest-checkout-email" style={{ color: textColor, fontWeight: 600 }}>{ts('auth.email', 'Email')}</label>
        <span style={{ color: mutedColor }}>
          {ts('auth.haveAccount', 'Already have an account?')}{' '}
          <Link to={`/login?redirect=${encodeURIComponent(returnPath)}`} style={{ color: accentColor, fontWeight: 600 }}>{ts('checkout.logIn', 'Log in')}</Link>
        </span>
      </div>
      <input
        id="guest-checkout-email"
        type="email"
        autoComplete="email"
        required
        aria-invalid={!!error}
        placeholder={ts('common.emailPlaceholder', 'you@example.com')}
        style={inputStyle}
        value={email}
        onChange={e => onEmailChange(e.target.value)}
        onBlur={onBlur}
      />
      {saving && <Loader2 size={14} className="animate-spin" style={{ color: mutedColor }} />}
      {error && (
        <p role="alert" className="flex items-start gap-2" style={{ fontFamily, fontSize: '12px', color: dangerColor }}>
          <AlertCircle size={13} className="mt-[1px] shrink-0" /> {error}
        </p>
      )}
      <p style={{ fontFamily, fontSize: '11.5px', color: mutedColor }}>{ts('checkout.emailHint', 'Your order confirmation and updates are sent to this email.')}</p>
    </div>
  );
}
