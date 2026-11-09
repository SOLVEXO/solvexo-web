import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { PasswordField } from '@/components/comman/ui/PasswordField';
import { apiStaffResetPassword } from '@/api/services/staff';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';

/** Public page reached from the emailed reset link — sets a new password. */
export default function StaffResetPasswordPage() {
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();
  usePageTitle('Choose a new password');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [storeId, setStoreId] = useState<string | null>(null);

  const submit = async () => {
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setSaving(true);
    try {
      const res = await apiStaffResetPassword(token, password);
      setStoreId(res.data.storeId);
      setTimeout(() => navigate(`/staff-login/${res.data.storeId}`), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset your password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthSplitLayout
      pageContext="new_password"
      heading={<>Choose a new <span className="text-brand-orange">password</span></>}
      subtext="Pick a strong one. Only you will know it."
    >
      <h1 className="text-[20px] font-bold text-carbon mb-1 text-center lg:text-left">Choose a new password</h1>
      <div className="flex flex-col gap-3 mt-3">
          {storeId ? (
            <div className="flex flex-col items-center gap-2 py-3">
              <CheckCircle2 size={32} className="text-success" />
              <p className="text-[14px] font-semibold text-charcoal">Password updated — taking you to sign in…</p>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="staff-reset-pw" className="text-[12px] font-medium text-graphite mb-1 block">New password</label>
                <PasswordField id="staff-reset-pw" autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40" />
              </div>
              <div>
                <label htmlFor="staff-reset-conf" className="text-[12px] font-medium text-graphite mb-1 block">Confirm password</label>
                <PasswordField id="staff-reset-conf" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40" />
              </div>
              {error && <p role="alert" className="text-[12px] text-error">{error}</p>}
              <button type="button" onClick={submit} disabled={saving}
                className="w-full py-3 rounded-lg bg-[#D97757] text-white text-[13px] font-bold cursor-pointer disabled:opacity-60">
                {saving ? 'Saving…' : 'Update password'}
              </button>
              <p className="text-center text-[12px] text-slate">Link expired? Open your store's staff sign-in page and use “Forgot password?”.</p>
            </>
          )}
      </div>
    </AuthSplitLayout>
  );
}
