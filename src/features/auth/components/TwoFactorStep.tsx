import { useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/comman/ui/Button';
import { Input } from '@/components/comman/ui/Input';
import { useSiteText } from '@/i18n/site/useSiteText';
import { TWO_FACTOR_TEXT } from './TwoFactorStep.text';

interface Props {
  code: string; setCode: (v: string) => void; useRecovery: boolean; setUseRecovery: (v: boolean) => void;
  loading: boolean; error: string; onSubmit: () => void; onBack: () => void;
}

/** Second sign-in step for sellers and store staff with two-factor on: authenticator code, or a one-time recovery code. */
export function TwoFactorStep({ code, setCode, useRecovery, setUseRecovery, loading, error, onSubmit, onBack }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useSiteText(TWO_FACTOR_TEXT);
  useEffect(() => { inputRef.current?.focus(); }, [useRecovery]);
  return (
    <>
      <h1 className="text-[22px] font-bold text-carbon mb-1.5 text-center lg:text-start">{t.title}</h1>
      <p className="text-[13px] text-slate mb-6 text-center lg:text-start">
        {useRecovery
          ? t.recoveryHelp
          : t.appHelp}
      </p>
      <Input
        id="member-login-2fa-code"
        label={useRecovery ? t.recoveryLabel : t.appLabel}
        dir="ltr"
        placeholder={useRecovery ? 'XXXXX-XXXXX' : '123 456'}
        autoComplete="one-time-code"
        inputMode={useRecovery ? 'text' : 'numeric'}
        maxLength={useRecovery ? 11 : 7}
        ref={inputRef}
        value={code}
        onChange={(e) => setCode(useRecovery ? e.target.value.toUpperCase() : e.target.value.replace(/[^\d ]/g, ''))}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
      />
      <Button variant="primary" size="lg" fullWidth onClick={onSubmit} loading={loading} disabled={!code.trim()} className="mt-6">{t.verify}</Button>
      {error && <div role="alert" className="bg-error-bg rounded-lg px-[14px] py-[10px] mt-3 text-[13px] text-error text-center">{error}</div>}
      <div className="flex items-center justify-between mt-4 gap-3 flex-wrap">
        <Button variant="link" size="sm" onClick={onBack}><ArrowLeft size={13} className="rtl:-scale-x-100" /> {t.back}</Button>
        <Button variant="link" size="sm" onClick={() => { setUseRecovery(!useRecovery); setCode(''); }}>{useRecovery ? t.useApp : t.useRecovery}</Button>
      </div>
    </>
  );
}
