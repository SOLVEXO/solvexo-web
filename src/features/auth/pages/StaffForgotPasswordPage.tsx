import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, KeyRound } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { apiStaffForgotPassword } from '@/api/services/staff';

/** Public "Forgot password" for a store's staff login — always shows the same
 *  confirmation so it can't be used to discover which emails are staff. */
export default function StaffForgotPasswordPage() {
  const { storeId = '' } = useParams<{ storeId: string }>();
  usePageTitle('Reset staff password');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError('Enter a valid email address.'); return; }
    setSending(true);
    try {
      await apiStaffForgotPassword(storeId, email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-10">
      <div className="max-w-sm w-full bg-white border border-bone rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-bone flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-pale-orange flex items-center justify-center shrink-0"><KeyRound size={18} className="text-brand-orange" /></div>
          <p className="text-[14px] font-bold text-charcoal">Reset your password</p>
        </div>
        <div className="px-6 py-5 flex flex-col gap-3">
          {sent ? (
            <div className="flex flex-col items-center gap-2 py-3 text-center">
              <CheckCircle2 size={32} className="text-success" />
              <p className="text-[13px] text-charcoal">If that email belongs to a staff account on this store, a reset link is on its way. It expires in 1 hour.</p>
            </div>
          ) : (
            <>
              <p className="text-[12.5px] text-slate">Enter your staff email and we'll send you a link to choose a new password.</p>
              <div>
                <label htmlFor="staff-forgot-email" className="text-[12px] font-medium text-graphite mb-1 block">Email address</label>
                <input id="staff-forgot-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40" />
              </div>
              {error && <p role="alert" className="text-[12px] text-error">{error}</p>}
              <button type="button" onClick={submit} disabled={sending}
                className="w-full py-3 rounded-lg bg-[#D97757] text-white text-[13px] font-bold cursor-pointer disabled:opacity-60">
                {sending ? 'Sending…' : 'Send reset link'}
              </button>
            </>
          )}
          <Link to={`/staff-login/${storeId}`} className="text-center text-[12.5px] text-brand-orange hover:underline">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
