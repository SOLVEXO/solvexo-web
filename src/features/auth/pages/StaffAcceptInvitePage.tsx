import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { PasswordField } from '@/components/comman/ui/PasswordField';
import { apiGetStaffInvite, apiAcceptStaffInvite, type StaffInviteInfo } from '@/api/services/staff';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';

/** Public, unauthenticated "Accept Invite" page — reached via the secure,
 *  token-secured link `StaffService.create()`/`resendInvite()` emails an
 *  invited staff member. This is the ONLY place a staff account's password
 *  is ever set — the inviting seller never sees/sets it (see
 *  StaffMember.passwordHash's own doc comment). */
export default function StaffAcceptInvitePage() {
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<StaffInviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    apiGetStaffInvite(token)
      .then(res => setInvite(res.data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'This invite link could not be found.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async () => {
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords don\'t match.'); return; }
    setSaving(true);
    try {
      const res = await apiAcceptStaffInvite(token, password);
      setAccepted(true);
      setTimeout(() => navigate(`/staff-login/${res.data.storeId}`), 1800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-[13px] text-slate">Loading invite…</div>;
  }

  if (error && !invite) {
    return (
      <AuthSplitLayout pageContext="login" heading={<>Invite <span className="text-brand-orange">not available</span></>} subtext="Ask the store owner to send you a new invite.">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle size={28} className="text-error" />
          <p className="text-[14px] font-semibold text-charcoal">{error}</p>
        </div>
      </AuthSplitLayout>
    );
  }

  if (!invite) return null;

  return (
    <AuthSplitLayout
      pageContext="new_password"
      heading={<>Join <span className="text-brand-orange">{invite.storeName ?? 'the store'}</span></>}
      subtext="Set your own password to activate your staff account."
    >
      <h1 className="text-[20px] font-bold text-carbon mb-1 text-center lg:text-left">Join {invite.storeName ?? 'the store'}</h1>
      <p className="text-[12.5px] text-slate mb-1 text-center lg:text-left">Invited as {invite.name} · {invite.email}</p>

        <div className="mt-4">
          {accepted ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <CheckCircle2 size={32} className="text-success" />
              <p className="text-[14px] font-semibold text-charcoal">Password set — taking you to login…</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-[12.5px] text-slate">Set your own password to activate your account. Only you will know it.</p>
              <div>
                <label htmlFor="staff-invite-pw" className="text-[12px] font-medium text-graphite mb-1 block">Password</label>
                <PasswordField
                  id="staff-invite-pw"
                  autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                />
              </div>
              <div>
                <label htmlFor="staff-invite-conf" className="text-[12px] font-medium text-graphite mb-1 block">Confirm password</label>
                <PasswordField
                  id="staff-invite-conf"
                  autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                />
              </div>
              {error && <p className="text-[12px] text-error">{error}</p>}
              <button
                type="button" onClick={handleSubmit} disabled={saving}
                className="w-full py-3 rounded-lg bg-[#D97757] text-white text-[13px] font-bold cursor-pointer disabled:opacity-60 mt-1"
              >
                {saving ? 'Setting password…' : 'Set Password & Activate Account'}
              </button>
            </div>
          )}
        </div>
    </AuthSplitLayout>
  );
}
