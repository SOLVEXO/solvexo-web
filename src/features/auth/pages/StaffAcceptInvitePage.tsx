import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, UserPlus } from 'lucide-react';
import { apiGetStaffInvite, apiAcceptStaffInvite, type StaffInviteInfo } from '@/api/services/staff';

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
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white border border-bone rounded-2xl p-6 text-center flex flex-col items-center gap-3">
          <AlertTriangle size={28} className="text-error" />
          <p className="text-[14px] font-semibold text-charcoal">{error}</p>
        </div>
      </div>
    );
  }

  if (!invite) return null;

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-10">
      <div className="max-w-sm w-full bg-white border border-bone rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-bone flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-pale-orange flex items-center justify-center shrink-0">
            <UserPlus size={18} className="text-brand-orange" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-charcoal">Join {invite.storeName ?? 'the store'}</p>
            <p className="text-[11px] text-slate">Invited as {invite.name} · {invite.email}</p>
          </div>
        </div>

        <div className="px-6 py-5">
          {accepted ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <CheckCircle2 size={32} className="text-success" />
              <p className="text-[14px] font-semibold text-charcoal">Password set — taking you to login…</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-[12.5px] text-slate">Set your own password to activate your account. Only you will know it.</p>
              <div>
                <label className="text-[12px] font-medium text-graphite mb-1 block">Password</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-graphite mb-1 block">Confirm password</label>
                <input
                  type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
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
      </div>
    </div>
  );
}
