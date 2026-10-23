import { useId, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { fashionTheme as t } from '../../theme.config';
import { Card } from '../../ui/primitives';
import { ts } from '@/utils/tStatic';

/** Numbered step card: rounded surface, step badge (turns into a check when done), heading, content. */
export function StepCard({ step, title, done, aside, children }: { step: number; title: string; done?: boolean; aside?: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id}>
      <Card>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold"
              style={{ background: done ? t.colors.success : t.colors.accent, color: done ? '#FFFFFF' : t.colors.accentInk }}>
              {done ? <Check size={16} /> : step}
            </span>
            <h2 id={id} className="m-0 text-lg font-semibold tracking-tight">{title}</h2>
            {done && <span className="sr-only">{ts('pg.word_completed_2', '(completed)')}</span>}
          </div>
          {aside}
        </div>
        {children}
      </Card>
    </section>
  );
}

/** A selectable card with a real radio input (keyboard and screen-reader friendly). */
export function RadioRow({ name, checked, onChange, children, label }: { name: string; checked: boolean; onChange: () => void; children: ReactNode; label?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 p-4 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
      style={{ border: `1.5px solid ${checked ? t.colors.selected : t.colors.border}`, borderRadius: 16, background: checked ? t.colors.bgAlt : t.colors.bg, outlineColor: t.colors.ink }}>
      <input type="radio" name={name} checked={checked} onChange={onChange} aria-label={label} className="mt-1 size-4 shrink-0" style={{ accentColor: t.colors.accent }} />
      <div className="min-w-0 flex-1">{children}</div>
    </label>
  );
}

export function TextLinkButton({ children, onClick, disabled, danger }: { children: ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="cursor-pointer border-0 bg-transparent p-0 text-sm font-medium underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      style={{ color: danger ? t.colors.danger : t.colors.ink }}>{children}</button>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="m-0 text-sm leading-relaxed" style={{ color: t.colors.inkMuted }}>{children}</p>;
}
