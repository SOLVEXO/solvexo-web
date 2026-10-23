import { useEffect, useState } from 'react';
import { ts } from '@/utils/tStatic';
import { apiForgotPassword, apiResendOtp } from '@/api/services/auth';
import { useToast } from '@/contexts/ToastContext';
import { fashionTheme as t } from '../../theme.config';

const WAIT = 59;

/** "Resend in 59s" -> "Resend code". A forgot-password code is resent through the forgot-password endpoint
 *  (the registration resend endpoint rejects an already-verified account). */
export function ResendTimer({ email, storeId, isForgot }: { email: string; storeId?: string; isForgot: boolean }) {
  const toast = useToast();
  const [seconds, setSeconds] = useState(WAIT);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [round, setRound] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => (s <= 1 ? (clearInterval(timer), 0) : s - 1)), 1000);
    return () => clearInterval(timer);
  }, [round]);

  const resend = async () => {
    setSending(true); setError('');
    try {
      if (isForgot) await apiForgotPassword({ email, role: 'user', storeId });
      else await apiResendOtp({ email, role: 'user', storeId });
      setSeconds(WAIT); setRound(r => r + 1);
      toast.success(ts('otp.resent', 'Code resent'));
    } catch (err) {
      setError(err instanceof Error ? err.message : ts('otp.err.resend', 'Failed to resend code.'));
    } finally { setSending(false); }
  };

  if (seconds > 0) return <span className="text-sm" style={{ color: t.colors.inkMuted }}>{ts('auth.resendIn', 'Resend code in {{seconds}}s', { seconds })}</span>;
  return (
    <span className="flex flex-col items-center gap-1">
      <button type="button" onClick={resend} disabled={sending} className="cursor-pointer border-0 bg-transparent text-sm font-semibold underline disabled:opacity-50" style={{ color: t.colors.ink }}>{sending ? ts('otp.sending', 'Sending...') : ts('otp.resendCode', 'Resend code')}</button>
      {error && <span role="alert" className="text-[13px]" style={{ color: t.colors.danger }}>{error}</span>}
    </span>
  );
}
