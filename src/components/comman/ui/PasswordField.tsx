import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/** A password `<input>` with its own show/hide eye button inside the field —
 *  each field toggles independently. Pass the same `className` you would give
 *  a text input; right padding for the button is added here. */
export function PasswordField({ className = '', ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...rest} type={visible ? 'text' : 'password'} className={`${className} pr-10`} />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 w-10 flex items-center justify-center bg-transparent border-0 cursor-pointer text-slate hover:text-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-orange rounded-r-lg"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

/** Just the eye button, for the `rightIcon` slot of the shared `Input`. */
export function PasswordToggleButton({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? 'Hide password' : 'Show password'}
      aria-pressed={visible}
      className="bg-transparent border-none cursor-pointer text-slate p-0 flex hover:text-charcoal transition-colors"
    >
      {visible ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );
}
