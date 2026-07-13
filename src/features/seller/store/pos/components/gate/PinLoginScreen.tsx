import { useState } from 'react';
import { SolvexoIcon } from '@/components/comman/ui/SolvexoLogo';
import { useForm } from '@/hooks/useForm';
import { required, email as emailValidator, exactLength, numeric } from '@/utils/validation/validators';
import type { Schema } from '@/utils/validation/schemas';
import { apiPinLogin, type PinLoginResult } from '@/api/services/pos/posPinLogin';

interface PinLoginFormData {
  email: string;
  pin:   string;
}

const schema: Schema<PinLoginFormData> = {
  email: [required('Email'), emailValidator()],
  pin:   [required('PIN'), numeric('PIN must be numeric'), exactLength(4, 'PIN')],
};

interface PinLoginScreenProps {
  storeId:   string;
  onSuccess: (result: PinLoginResult) => void;
}

export function PinLoginScreen({ storeId, onSuccess }: PinLoginScreenProps) {
  const [submitting, setSubmitting] = useState(false);
  const [apiError,   setApiError]   = useState('');

  const { values, errors, set, blur, handleSubmit } = useForm<PinLoginFormData>(
    schema,
    { email: '', pin: '' },
    {
      onSubmit: async data => {
        setApiError('');
        setSubmitting(true);
        try {
          const res = await apiPinLogin({ storeId, email: data.email.trim(), pin: data.pin });
          onSuccess(res.data);
        } catch (err) {
          setApiError(err instanceof Error ? err.message : 'PIN login failed. Please try again.');
        } finally {
          setSubmitting(false);
        }
      },
    },
  );

  return (
    <div className="flex-1 flex items-center justify-center bg-pos-bg px-4">
      <div className="w-full max-w-[360px] bg-pos-surface border border-carbon rounded-2xl shadow-xl p-8 pos-panel-enter">
        <div className="flex flex-col items-center mb-7">
          <SolvexoIcon size={36} />
          <p className="text-[17px] font-bold text-white mt-4">POS Employee Login</p>
          <p className="text-[12px] text-pos-muted mt-[6px] text-center leading-[1.5]">Enter your email and 4-digit PIN to start</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-medium text-pos-faint mb-[6px]">Email</label>
            <input
              type="email"
              value={values.email}
              onChange={set('email')}
              onBlur={blur('email')}
              placeholder="you@store.com"
              className="w-full bg-carbon border border-carbon rounded-lg px-[14px] py-[11px] text-[13px] text-white outline-none box-border transition-shadow duration-150 focus:shadow-md"
              autoFocus
            />
            {errors.email && <p className="text-[11px] text-error mt-[6px]">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-medium text-pos-faint mb-[6px]">PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={values.pin}
              onChange={set('pin')}
              onBlur={blur('pin')}
              placeholder="••••"
              className="w-full bg-carbon border border-carbon rounded-lg px-[14px] py-3 text-[18px] tracking-[10px] text-white outline-none box-border transition-shadow duration-150 focus:shadow-md"
            />
            {errors.pin && <p className="text-[11px] text-error mt-[6px]">{errors.pin}</p>}
          </div>

          {apiError && (
            <p className="text-[12px] text-error bg-[#C1303020] border border-error rounded-lg px-3 py-2">
              {apiError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full bg-brand-orange border-0 rounded-lg py-3 text-[13px] font-bold text-white cursor-pointer shadow-md transition-transform duration-100 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
