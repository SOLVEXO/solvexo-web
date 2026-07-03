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
    <div className="flex-1 flex items-center justify-center bg-pos-bg">
      <div className="w-[340px] bg-pos-surface border border-carbon rounded-2xl p-7">
        <div className="flex flex-col items-center mb-6">
          <SolvexoIcon size={36} />
          <p className="text-[16px] font-bold text-white mt-3">POS Employee Login</p>
          <p className="text-[12px] text-pos-muted mt-1">Enter your email and 4-digit PIN to start</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-[11px] text-pos-faint mb-1">Email</label>
            <input
              type="email"
              value={values.email}
              onChange={set('email')}
              onBlur={blur('email')}
              placeholder="you@store.com"
              className="w-full bg-carbon border border-carbon rounded-lg px-3 py-[9px] text-[13px] text-white outline-none box-border"
              autoFocus
            />
            {errors.email && <p className="text-[11px] text-error mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-[11px] text-pos-faint mb-1">PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={values.pin}
              onChange={set('pin')}
              onBlur={blur('pin')}
              placeholder="••••"
              className="w-full bg-carbon border border-carbon rounded-lg px-3 py-[9px] text-[16px] tracking-[8px] text-white outline-none box-border"
            />
            {errors.pin && <p className="text-[11px] text-error mt-1">{errors.pin}</p>}
          </div>

          {apiError && (
            <p className="text-[12px] text-error bg-[#C1303020] border border-error rounded-lg px-3 py-2">
              {apiError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full bg-brand-orange border-0 rounded-lg py-[11px] text-[13px] font-bold text-white cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
