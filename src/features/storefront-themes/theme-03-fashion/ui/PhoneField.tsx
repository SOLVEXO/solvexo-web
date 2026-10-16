import PhoneInputWithCountrySelect, { isSupportedCountry, type Country } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { fashionTheme as t } from '../theme.config';
import { controlStyle } from './controlStyle';
import { Field } from './primitives';

/** Maison phone field: country picker + number in one pill-rounded control. Emits E.164 (+923001234567).
 *  defaultCountry (ISO alpha-2) only seeds the initial flag; a country the visitor picked is never overridden. */
export function PhoneField({ label = 'Phone number', value, onChange, defaultCountry, error, required, disabled, name }: {
  label?: string; value: string; onChange: (value: string) => void; defaultCountry?: string | null; error?: string | null; required?: boolean; disabled?: boolean; name?: string;
}) {
  const seed: Country | undefined = defaultCountry && isSupportedCountry(defaultCountry) ? (defaultCountry as Country) : undefined;
  return (
    <Field label={label} required={required} error={error}>
      {p => (
        <PhoneInputWithCountrySelect id={p.id} name={name} international defaultCountry={seed} value={value || undefined} onChange={v => onChange(v ?? '')}
          placeholder="Enter your phone number" disabled={disabled} autoComplete="tel" aria-invalid={p['aria-invalid']} aria-describedby={p['aria-describedby']}
          style={{ ...controlStyle(p['aria-invalid']), display: 'flex', alignItems: 'center', gap: 8, '--PhoneInputCountrySelectArrow-color': t.colors.inkMuted } as React.CSSProperties}
          numberInputProps={{ required, style: { border: 'none', outline: 'none', background: 'transparent', padding: 0, minWidth: 0, fontFamily: t.fonts.body, fontSize: 15, color: t.colors.ink } }} />
      )}
    </Field>
  );
}