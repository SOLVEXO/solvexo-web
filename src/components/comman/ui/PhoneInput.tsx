import { useId, type CSSProperties, type ReactNode } from 'react';
import PhoneInputWithCountrySelect, { isSupportedCountry, type Country } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { clsx } from 'clsx';

interface PhoneInputProps {
  label?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /** ISO-3166 alpha-2 (e.g. 'PK', 'US') — used only to pick the INITIAL dial
   *  code/flag shown before the visitor has typed/picked anything themselves;
   *  the library never overrides a country the visitor has explicitly chosen,
   *  even if this prop changes later (e.g. once an async IP lookup resolves). */
  defaultCountry?: string | null;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  name?: string;
  autoComplete?: string;
  required?: boolean;
  /** When true, skips the apex app's own `.solvexo-phone-input`/Tailwind
   *  label styling entirely — for a storefront theme page (Atelier/Nova),
   *  which renders its own independent chrome with its theme's own inline
   *  style tokens (`atelierInput`/`novaInput`, etc.) rather than this app's
   *  shared design system, same convention every other raw `<input>` in
   *  those pages already follows. Pair with `containerStyle`/`inputStyle`/
   *  `labelNode` to fully re-skin it. */
  unstyled?: boolean;
  /** Only used when `unstyled` — inline style for the bordered container
   *  that wraps the flag/dial-code select + number input (the equivalent of
   *  a theme's own `atelierInput`/`novaInput` box style). */
  containerStyle?: CSSProperties;
  /** Only used when `unstyled` — inline style for the native number
   *  `<input>` itself (kept borderless/transparent so `containerStyle`'s
   *  border is the only visible one, same as the styled variant). */
  inputStyle?: CSSProperties;
  /** Only used when `unstyled` — a theme renders its own label markup
   *  (`atelierLabel`/`novaLabel` style objects) rather than this
   *  component's built-in Tailwind label, so it's passed in as a node. */
  labelNode?: ReactNode;
}

/**
 * Shared phone number field — real country dial-code + flag picker (via
 * `react-phone-number-input`, embedded SVG flags, no extra asset fetching).
 * Two skins: the default styled variant matches this app's `Input`
 * component (see the `.solvexo-phone-input` override block in
 * `index.css`); `unstyled` hands full visual control to the caller via
 * `containerStyle`/`inputStyle`/`labelNode`, for a storefront theme page
 * that renders its own independent chrome. Always stores/emits full
 * E.164-ish international format (`+923001234567`) regardless of skin —
 * this is what `RegisterDto.phone` should receive, so a number round-trips
 * unambiguously regardless of which country's national format was typed.
 */
export function PhoneInput({
  label, error, value, onChange, onBlur, defaultCountry, placeholder, className, id, disabled, name, autoComplete, required,
  unstyled, containerStyle, inputStyle, labelNode,
}: PhoneInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const safeDefaultCountry: Country | undefined =
    defaultCountry && isSupportedCountry(defaultCountry) ? (defaultCountry as Country) : undefined;

  return (
    <div className="w-full">
      {unstyled
        ? labelNode
        : label && (
          <label htmlFor={inputId} className="block text-[12px] font-medium text-charcoal mb-1.5">
            {label}
          </label>
        )}
      <PhoneInputWithCountrySelect
        id={inputId}
        name={name}
        international
        defaultCountry={safeDefaultCountry}
        value={value || undefined}
        onChange={(v) => onChange(v ?? '')}
        onBlur={onBlur}
        placeholder={placeholder ?? 'Enter your phone number'}
        disabled={disabled}
        autoComplete={autoComplete ?? 'tel'}
        aria-invalid={!!error}
        className={unstyled ? className : clsx('solvexo-phone-input', error && 'solvexo-phone-input--error', className)}
        style={unstyled ? containerStyle : undefined}
        numberInputProps={unstyled ? { style: inputStyle, required } : { required }}
      />
      {error && (
        unstyled
          ? <p role="alert" className="mt-1 text-[11px]" style={{ color: '#C0392B' }}>{error}</p>
          : <p role="alert" className="mt-1 text-[11px] text-error">{error}</p>
      )}
    </div>
  );
}
