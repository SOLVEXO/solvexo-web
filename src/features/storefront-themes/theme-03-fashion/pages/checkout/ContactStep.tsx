import { Link } from 'react-router-dom';
import { ts } from '@/utils/tStatic';
import { Loader2 } from 'lucide-react';
import { fashionTheme as t } from '../../theme.config';
import { Field, TextInput } from '../../ui/primitives';
import { StepCard } from './CheckoutParts';

interface Props {
  step: number;
  email: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error: string;
  saving: boolean;
  done: boolean;
}

/** Guest checkout: just an email (confirmation and updates go there), with a way to log in instead. */
export function ContactStep({ step, email, onChange, onBlur, error, saving, done }: Props) {
  return (
    <StepCard step={step} title={ts('checkout.contact', 'Contact')} done={done}
      aside={<span className="text-sm" style={{ color: t.colors.inkMuted }}>{ts('checkout.haveAccount', 'Have an account?')} <Link to={`/login?redirect=${encodeURIComponent('/checkout')}`} style={{ color: t.colors.ink, fontWeight: 500 }}>{ts('checkout.logIn', 'Log in')}</Link></span>}>
      <Field label={ts('auth.email', 'Email')} required error={error || null} hint={ts('checkout.emailHint', 'Your order confirmation and updates are sent to this email.')}>
        {p => (
          <div className="relative">
            <TextInput {...p} type="email" autoComplete="email" inputMode="email" placeholder={ts('common.emailPlaceholder', 'you@example.com')} required value={email}
              onChange={e => onChange(e.target.value)} onBlur={onBlur} invalid={!!error} />
            {saving && <Loader2 size={16} aria-hidden className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin" style={{ color: t.colors.inkMuted }} />}
          </div>
        )}
      </Field>
    </StepCard>
  );
}
