import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import { fashionTheme as t } from '../../theme.config';
import { OTP_LENGTH } from '../../../core/auth/authLinks';

/** Six single-digit boxes: auto-advance, backspace/arrow navigation, paste of the whole code. */
export function OtpBoxes({ values, onChange, invalid }: { values: string[]; onChange: (i: number, v: string) => void; invalid?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const change = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    onChange(i, val);
    if (val && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus();
  };
  const keyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !values[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus();
  };
  const paste = (e: ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    pasted.split('').forEach((ch, i) => onChange(i, ch));
    refs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };
  return (
    <div role="group" aria-label={`${OTP_LENGTH}-digit verification code`} className="flex justify-center gap-2">
      {values.map((val, i) => (
        <input key={i} ref={el => { refs.current[i] = el; }} aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`} aria-invalid={invalid || undefined}
          type="text" inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'} maxLength={1} value={val}
          onChange={e => change(i, e.target.value)} onKeyDown={e => keyDown(i, e)} onPaste={paste}
          className="text-center font-medium" style={{ width: 'clamp(40px, 12vw, 52px)', height: 56, fontSize: 20, fontFamily: t.fonts.body, color: t.colors.ink, outline: 'none', borderRadius: 14, background: val ? t.colors.bgAlt : t.colors.bg, border: `1px solid ${invalid ? t.colors.danger : val ? t.colors.ink : t.colors.border}` }} />
      ))}
    </div>
  );
}
