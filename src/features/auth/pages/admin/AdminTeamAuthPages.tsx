import { useState, useEffect, type ReactNode } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, UserPlus, KeyRound } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { PasswordField } from '@/components/comman/ui/PasswordField';
import { apiGetAdminInvite, apiAcceptAdminInvite, apiAdminForgotPassword, apiAdminResetPassword } from '@/api/services/adminTeam';

const INPUT = 'w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40';
const BTN = 'w-full py-3 rounded-lg bg-[#D97757] text-white text-[13px] font-bold cursor-pointer disabled:opacity-60';
const msg = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

function Shell({ icon, title, subtitle, children }: { icon: ReactNode; title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-10">
      <div className="max-w-sm w-full bg-white border border-bone rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-bone flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-pale-orange flex items-center justify-center shrink-0">{icon}</div>
          <div>
            <p className="text-[14px] font-bold text-charcoal">{title}</p>
            {subtitle && <p className="text-[11px] text-slate">{subtitle}</p>}
          </div>
        </div>
        <div className="px-6 py-5 flex flex-col gap-3">{children}</div>
      </div>
    </div>
  );
}

/** Shared "choose a password" form used by the invite and the reset page. */
function PasswordForm({ idPrefix, button, busy, error, onSubmit }: { idPrefix: string; button: string; busy: boolean; error: string; onSubmit: (pw: string, confirm: string) => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  return (
    <>
      <div>
        <label htmlFor={`${idPrefix}-pw`} className="text-[12px] font-medium text-graphite mb-1 block">Password</label>
        <PasswordField id={`${idPrefix}-pw`} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" className={INPUT} />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-conf`} className="text-[12px] font-medium text-graphite mb-1 block">Confirm password</label>
        <PasswordField id={`${idPrefix}-conf`} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} className={INPUT} />
      </div>
      {error && <p role="alert" className="text-[12px] text-error">{error}</p>}
      <button type="button" onClick={() => onSubmit(password, confirm)} disabled={busy} className={BTN}>{busy ? 'Please wait…' : button}</button>
    </>
  );
}

const checkPasswords = (pw: string, confirm: string) =>
  pw.length < 8 ? 'Password must be at least 8 characters.' : pw !== confirm ? "Passwords don't match." : '';

/** /admin-invite/:token — a platform-team admin sets their own password. */
export function AdminAcceptInvitePage() {
  usePageTitle('Join the admin team');
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<{ name: string; email: string; roleName: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiGetAdminInvite(token)
      .then(res => setInvite(res.data))
      .catch(err => setError(msg(err, 'This invite link could not be found.')))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[13px] text-slate">Loading invite…</div>;
  if (!invite) {
    return (
      <Shell icon={<AlertTriangle size={18} className="text-error" />} title="Invite not available">
        <p className="text-[13px] text-charcoal">{error || 'This invite link is no longer valid.'}</p>
        <Link to="/admin/login" className="text-center text-[12.5px] text-brand-orange hover:underline">Go to sign in</Link>
      </Shell>
    );
  }

  const submit = async (pw: string, confirm: string) => {
    const problem = checkPasswords(pw, confirm);
    if (problem) { setError(problem); return; }
    setError(''); setSaving(true);
    try {
      await apiAcceptAdminInvite(token, pw);
      setDone(true);
      setTimeout(() => navigate('/admin/login'), 1800);
    } catch (err) { setError(msg(err, 'Failed to accept invite.')); } finally { setSaving(false); }
  };

  return (
    <Shell icon={<UserPlus size={18} className="text-brand-orange" />} title="Join the Solvexo admin team" subtitle={`${invite.name} · ${invite.email}${invite.roleName ? ` · ${invite.roleName}` : ''}`}>
      {done ? (
        <div className="flex flex-col items-center gap-2 py-4">
          <CheckCircle2 size={32} className="text-success" />
          <p className="text-[14px] font-semibold text-charcoal">Password set — taking you to sign in…</p>
        </div>
      ) : (
        <>
          <p className="text-[12.5px] text-slate">Set your own password to activate your account. Only you will know it.</p>
          <PasswordForm idPrefix="admin-invite" button="Set Password & Activate" busy={saving} error={error} onSubmit={submit} />
        </>
      )}
    </Shell>
  );
}

/** /admin/forgot-password — always shows the same answer so it can't be used to discover admin emails. */
export function AdminForgotPasswordPage() {
  usePageTitle('Reset admin password');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError('Enter a valid email address.'); return; }
    setSending(true);
    try { await apiAdminForgotPassword(email.trim()); setSent(true); }
    catch (err) { setError(msg(err, 'Something went wrong. Please try again.')); }
    finally { setSending(false); }
  };

  return (
    <Shell icon={<KeyRound size={18} className="text-brand-orange" />} title="Reset your password">
      {sent ? (
        <div className="flex flex-col items-center gap-2 py-3 text-center">
          <CheckCircle2 size={32} className="text-success" />
          <p className="text-[13px] text-charcoal">If that email belongs to an admin account, a reset link is on its way. It expires in 1 hour.</p>
        </div>
      ) : (
        <>
          <p className="text-[12.5px] text-slate">Enter your admin email and we'll send you a link to choose a new password.</p>
          <div>
            <label htmlFor="admin-forgot-email" className="text-[12px] font-medium text-graphite mb-1 block">Email address</label>
            <input id="admin-forgot-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()} className={INPUT} />
          </div>
          {error && <p role="alert" className="text-[12px] text-error">{error}</p>}
          <button type="button" onClick={submit} disabled={sending} className={BTN}>{sending ? 'Sending…' : 'Send reset link'}</button>
        </>
      )}
      <Link to="/admin/login" className="text-center text-[12.5px] text-brand-orange hover:underline">Back to sign in</Link>
    </Shell>
  );
}

/** /admin-reset-password/:token */
export function AdminResetPasswordPage() {
  usePageTitle('Choose a new admin password');
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (pw: string, confirm: string) => {
    const problem = checkPasswords(pw, confirm);
    if (problem) { setError(problem); return; }
    setError(''); setSaving(true);
    try {
      await apiAdminResetPassword(token, pw);
      setDone(true);
      setTimeout(() => navigate('/admin/login'), 1800);
    } catch (err) { setError(msg(err, 'This reset link is invalid or has expired.')); } finally { setSaving(false); }
  };

  return (
    <Shell icon={<KeyRound size={18} className="text-brand-orange" />} title="Choose a new password">
      {done ? (
        <div className="flex flex-col items-center gap-2 py-4">
          <CheckCircle2 size={32} className="text-success" />
          <p className="text-[14px] font-semibold text-charcoal">Password updated — taking you to sign in…</p>
        </div>
      ) : (
        <PasswordForm idPrefix="admin-reset" button="Update password" busy={saving} error={error} onSubmit={submit} />
      )}
    </Shell>
  );
}
