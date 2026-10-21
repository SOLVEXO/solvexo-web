import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { fashionTheme as t } from '../../theme.config';
import { TextInput } from '../../ui/primitives';
import { ts } from '@/utils/tStatic';

/** Password box with its own show/hide eye (each box toggles independently). Pass the props `Field` hands to its render function. */
export function PasswordInput({ invalid, ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { invalid?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <TextInput {...rest} invalid={invalid} type={show ? 'text' : 'password'} style={{ paddingRight: 48 }} />
      <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? ts('auth.hidePassword', 'Hide password') : ts('auth.showPassword', 'Show password')} aria-pressed={show}
        className="absolute inset-y-0 right-0 flex w-12 cursor-pointer items-center justify-center border-0 bg-transparent" style={{ color: t.colors.inkMuted, borderRadius: 14 }}>
        {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
      </button>
    </div>
  );
}
