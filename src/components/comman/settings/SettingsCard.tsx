import { type ReactNode } from 'react';
import { clsx } from 'clsx';

interface SettingsCardProps {
  title:       string;
  /** One line under the title — what this card actually controls. */
  description?: ReactNode;
  /** Small lucide icon; renders in the same 32px badge the tab rail uses, so a
   *  card reads as belonging to its section. */
  icon?:          ReactNode;
  actions?:       ReactNode;
  children?:      ReactNode;
  className?:     string;
  bodyClassName?: string;
  /** `hairline` draws a rule between header and body — for cards whose body is
   *  a table/list rather than a form. */
  divided?: boolean;
  /** `danger` tints the badge for destructive cards (delete, suspend, remove). */
  tone?: 'default' | 'danger';
}

/** The one card every settings section is framed in.
 *
 *  The hubs had three competing conventions (`rounded-xl p-4 sm:p-6`,
 *  `rounded-[10px] px-[22px] py-5`, and `Card padding="none"` + a hand-rolled
 *  bordered header) with different radii, paddings and title weights, which is
 *  most of why the pages read as a stack of unrelated panels. This keeps the
 *  existing look (white card, hairline border, 32px orange-tint badge) but in
 *  one place, so a tab is a header + a run of these. */
export function SettingsCard({
  title, description, icon, actions, children,
  className, bodyClassName, divided = false, tone = 'default',
}: SettingsCardProps) {
  return (
    <section className={clsx('bg-white border border-bone rounded-2xl overflow-hidden', className)}>
      <header className={clsx('flex items-start gap-3 px-5 pt-5 pb-4', divided && 'border-b border-fog')}>
        {icon && (
          <span
            aria-hidden
            className={clsx(
              'size-8 rounded-[9px] flex items-center justify-center shrink-0',
              tone === 'danger' ? 'bg-error-bg text-error' : 'bg-brand-pale-orange text-brand-orange',
            )}
          >
            {icon}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-semibold text-charcoal leading-[1.35]">{title}</h3>
          {description && (
            <p className="mt-[3px] text-[12px] text-slate leading-relaxed">{description}</p>
          )}
        </div>
        {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
      </header>
      {children && <div className={clsx('px-5 pb-5', bodyClassName)}>{children}</div>}
    </section>
  );
}

interface SettingsRowProps {
  label:        ReactNode;
  description?: ReactNode;
  /** The control (Toggle, Select, Button, value text). Sits right-aligned and
   *  never wraps out of the row. */
  children?:    ReactNode;
  className?:   string;
  /** Stack the control under the label instead of beside it — for wide
   *  controls (date pickers, chip lists) that would squash the text. */
  stacked?: boolean;
}

/** Label + explanation on the left, control on the right. Put rows in a
 *  `divide-y divide-fog` column and the card reads as a real settings list
 *  instead of floating form fields. */
export function SettingsRow({ label, description, children, className, stacked = false }: SettingsRowProps) {
  return (
    <div className={clsx('py-3.5 flex gap-4', stacked ? 'flex-col' : 'flex-col sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-charcoal leading-[1.4]">{label}</p>
        {description && <p className="mt-[2px] text-[11.5px] text-slate leading-relaxed">{description}</p>}
      </div>
      {children && <div className={clsx('shrink-0', !stacked && 'sm:w-auto w-full sm:w-auto')}>{children}</div>}
    </div>
  );
}

/** Uppercase mini-heading inside a card body, for grouping rows. */
export function SettingsGroupLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={clsx('text-[10.5px] font-bold text-slate uppercase tracking-[0.06em]', className)}>
      {children}
    </p>
  );
}

interface SettingsChoiceProps {
  type?: 'radio' | 'checkbox';
  /** Pass `name` for a radio group so the browser groups them natively. */
  name?: string;
  checked: boolean;
  label:   ReactNode;
  description?: ReactNode;
  icon?:   ReactNode;
  onChange: () => void;
  disabled?: boolean;
  className?: string;
}

/** A selectable option card (radio or checkbox) — the shape every "pick one of
 *  these modes" list in settings uses. Previously each list hand-wrote the same
 *  three states as inline `style={{ borderColor: '#D97757', background:
 *  '#FDF6F1' }}`, which is why selected rows disagreed on colour per tab. */
export function SettingsChoice({
  type = 'radio', name, checked, label, description, icon, onChange, disabled, className,
}: SettingsChoiceProps) {
  return (
    <label
      className={clsx(
        'flex items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors',
        // The real input is visually hidden, so keyboard focus has to land on
        // the card itself.
        'has-focus-visible:ring-2 has-focus-visible:ring-brand-orange/45 has-focus-visible:ring-offset-1',
        disabled ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer',
        checked ? 'border-brand-orange bg-brand-pale-orange' : 'border-bone bg-white hover:bg-cream',
        className,
      )}
    >
      <input type={type} name={name} checked={checked} onChange={onChange} disabled={disabled} className="sr-only" />
      {icon && (
        <span
          aria-hidden
          className={clsx(
            'size-7 rounded-[8px] flex items-center justify-center shrink-0',
            checked ? 'bg-brand-orange text-white' : 'bg-cream text-slate',
          )}
        >
          {icon}
        </span>
      )}
      <span className="flex-1 min-w-0">
        <span className={clsx('block text-[12.5px] font-semibold leading-[1.4]', checked ? 'text-brand-deep-orange' : 'text-charcoal')}>
          {label}
        </span>
        {description && <span className="block mt-[2px] text-[11.5px] text-slate leading-relaxed">{description}</span>}
      </span>
      <span
        aria-hidden
        className={clsx(
          'size-4 shrink-0 mt-[2px] border flex items-center justify-center transition-colors',
          type === 'checkbox' ? 'rounded-[5px]' : 'rounded-full',
          checked ? 'border-brand-orange bg-brand-orange' : 'border-border-hover bg-white',
        )}
      >
        {checked && (
          type === 'checkbox'
            ? <svg viewBox="0 0 12 12" className="size-[9px] text-white" aria-hidden><path d="M1.5 6.2 4.4 9 10.5 2.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            : <span className="size-[6px] rounded-full bg-white" />
        )}
      </span>
    </label>
  );
}
