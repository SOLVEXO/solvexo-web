import { type ReactNode } from 'react';
import { AlertCircle, CheckCircle, Save } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../ui/Button';

export interface SettingsSaveState { isDirty: boolean; saving: boolean }

interface SettingsSaveBarProps extends SettingsSaveState {
  onSave: () => void;
  /** Inline result of the last save attempt — the pattern every settings tab
   *  already used, kept so a tab that shows a message needs no extra state. */
  saveMsg?: { ok: boolean; text: string } | null;
  /** Left-aligned note when there's nothing to report yet. */
  hint?: ReactNode;
  /** Extra actions beside Save (Discard, Test connection…). */
  actions?: ReactNode;
  /** `card`     — last child of a `SettingsCard` body: sticks to the bottom of
   *               the viewport while that card is on screen, and bleeds to the
   *               card's edges.
   *  `floating` — a self-contained bar that sticks above the page gutter; used
   *               by tabs whose form spans several cards. Never bleeds, so it
   *               can't widen the page. */
  variant?: 'card' | 'floating';
  className?: string;
  /** `disabled` wins over the dirty check — e.g. a form that's invalid. */
  disabledReason?: string | null;
}

/** The save bar every settings section shares.
 *
 *  Previously each hub tab hand-rolled its own (`StoreSettings`'s local
 *  `SaveBar`, plus near-copies elsewhere) with the brand colors typed in as
 *  literal hex, and it sat at the TOP of the form — so on a long section the
 *  button was off-screen by the time you finished editing. It now sticks to the
 *  bottom of the viewport instead. */
export function SettingsSaveBar({
  isDirty, saving, onSave, saveMsg, hint, actions,
  variant = 'card', className, disabledReason,
}: SettingsSaveBarProps) {
  const disabled = saving || !isDirty || !!disabledReason;

  // Nothing pending and nothing to report → no bar at all. A permanently
  // visible "Save changes" strip on every tab is what made the old pages read
  // as a stack of unfinished forms.
  if (!isDirty && !saveMsg && !saving) return null;

  const body = (
    <>
      <div className="flex-1 min-w-[160px]">
        {saveMsg ? (
          <p className={clsx('flex items-center gap-2 text-[12.5px]', saveMsg.ok ? 'text-success' : 'text-error')}>
            {saveMsg.ok ? <CheckCircle size={14} className="shrink-0" /> : <AlertCircle size={14} className="shrink-0" />}
            <span className="min-w-0">{saveMsg.text}</span>
          </p>
        ) : (
          <p className="text-[12px] text-slate leading-relaxed">
            {disabledReason ?? (isDirty ? (hint ?? 'You have unsaved changes.') : null)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {actions}
        <Button
          variant="primary"
          size="sm"
          onClick={onSave}
          disabled={disabled}
          loading={saving}
          icon={!saving ? <Save size={14} /> : undefined}
        >
          Save changes
        </Button>
      </div>
    </>
  );

  return variant === 'floating' ? (
    <div
      className={clsx(
        'sticky bottom-4 z-20 flex flex-wrap items-center gap-3',
        'px-4 py-3 rounded-2xl',
        'bg-white/95 backdrop-blur border border-bone',
        className,
      )}
    >
      {body}
    </div>
  ) : (
    <div
      className={clsx(
        'sticky bottom-0 z-10 flex flex-wrap items-center gap-3 py-3 -mx-5 -mb-5 px-5',
        'bg-white/92 backdrop-blur border-t border-fog',
        className,
      )}
    >
      {body}
    </div>
  );
}
