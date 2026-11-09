import { useEffect, useRef } from 'react';
import { ArrowLeft, KeyRound, Smartphone } from 'lucide-react';
import { Button } from '@/components/comman/ui/Button';
import { Input } from '@/components/comman/ui/Input';

interface Props {
  code: string; setCode: (v: string) => void; useRecovery: boolean; setUseRecovery: (v: boolean) => void;
  loading: boolean; error: string; onSubmit: () => void; onBack: () => void;
}

/** Second sign-in step for sellers and store staff with two-factor on: authenticator code, or a one-time recovery code. */
export function TwoFactorStep({ code, setCode, useRecovery, setUseRecovery, loading, error, onSubmit, onBack }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, [useRecovery]);
  return (
    <>
      <div className="size-11 rounded-xl bg-brand-pale-orange text-brand-orange flex items-center justify-center mb-4 mx-auto lg:mx-0">
        {useRecovery ? <KeyRound size={20} /> : <Smartphone size={20} />}
      </div>
      <h1 className="text-[22px] font-bold text-carbon mb-1.5 text-center lg:text-left">Two-factor sign-in</h1>
      <p className="text-[13px] text-slate mb-6 text-center lg:text-left">
        {useRecovery
          ? 'Enter one of the recovery codes you saved when you turned on two-factor sign-in. Each code works once.'
          : 'Open your authenticator app and enter the 6-digit code for Solvexo.'}
      </p>
      <Input
        id="member-login-2fa-code"
        label={useRecovery ? 'Recovery code' : 'Authentication code'}
        placeholder={useRecovery ? 'XXXXX-XXXXX' : '123 456'}
        autoComplete="one-time-code"
        inputMode={useRecovery ? 'text' : 'numeric'}
        maxLength={useRecovery ? 11 : 7}
        ref={inputRef}
        value={code}
        onChange={(e) => setCode(useRecovery ? e.target.value.toUpperCase() : e.target.value.replace(/[^\d ]/g, ''))}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
      />
      <Button variant="primary" size="lg" fullWidth onClick={onSubmit} loading={loading} disabled={!code.trim()} className="mt-6">Verify and sign in</Button>
      {error && <div role="alert" className="bg-error-bg rounded-lg px-[14px] py-[10px] mt-3 text-[13px] text-error text-center">{error}</div>}
      <div className="flex items-center justify-between mt-4 gap-3 flex-wrap">
        <Button variant="link" size="sm" onClick={onBack}><ArrowLeft size={13} /> Back</Button>
        <Button variant="link" size="sm" onClick={() => { setUseRecovery(!useRecovery); setCode(''); }}>{useRecovery ? 'Use authenticator app' : 'Lost your phone? Use a recovery code'}</Button>
      </div>
    </>
  );
}
