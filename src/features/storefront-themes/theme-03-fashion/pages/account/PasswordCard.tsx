import { useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import { useChangePassword } from '@/hooks/auth/useChangePassword';
import { Card, Field, PillButton, Notice, SectionHeading } from '../../ui/primitives';
import { PasswordInput } from '../auth/PasswordInput';
import { fashionTheme as t } from '../../theme.config';

/** Change password for a signed-in buyer (current + new + confirm). */
export function PasswordCard() {
  const change = useChangePassword();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [formError, setFormError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (next.length < 8) { setFormError('New password must be at least 8 characters.'); return; }
    if (next !== confirm) { setFormError('New passwords do not match.'); return; }
    if (await change.execute({ currentPassword: current, newPassword: next })) { setCurrent(''); setNext(''); setConfirm(''); }
  };
  const error = formError || change.error;

  return (
    <Card>
      <SectionHeading>Password</SectionHeading>
      <form onSubmit={submit} className="grid max-w-[460px] gap-4">
        <Field label="Current password">{p => <PasswordInput {...p} autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} />}</Field>
        <Field label="New password" hint="At least 8 characters.">{p => <PasswordInput {...p} autoComplete="new-password" value={next} onChange={e => setNext(e.target.value)} />}</Field>
        <Field label="Confirm new password">{p => <PasswordInput {...p} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} />}</Field>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex items-center gap-3">
          <PillButton type="submit" loading={change.loading} disabled={!current || !next || !confirm}>Update password</PillButton>
          <span aria-live="polite" className="flex items-center gap-1 text-sm font-medium" style={{ color: t.colors.success }}>{change.success && !error && <><Check size={15} aria-hidden /> Updated</>}</span>
        </div>
      </form>
    </Card>
  );
}
