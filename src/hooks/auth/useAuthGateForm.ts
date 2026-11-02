import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiLogin, TokenStorage, LastRolePreference, type AppRole } from '@/api/services/auth';
import { useSocialLogin } from '@/hooks/auth/useSocialLogin';
import { useForm } from '@/hooks/useForm';
import { loginSchema, type LoginFormData } from '@/utils/validation/schemas';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { getCurrentStorefrontStoreId } from '@/utils/currentStorefront';

/** Headless logic of the "sign in to continue" prompt (shared by the platform modal and every theme's own look):
 *  signs in without navigating away, so the gated action carries the buyer straight back to what they were doing. */
export function useAuthGateForm() {
  const navigate = useNavigate();
  const { pending, cancel, resolve } = useAuthGate();
  // Buyer-only surface: the role is 'user' (useSocialLogin defaults to 'seller' for the seller login page).
  const social = useSocialLogin('user');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const resetRef = useRef<() => void>(() => {});

  const form = useForm<LoginFormData>(
    loginSchema,
    { email: '', password: '' },
    {
      onSubmit: async (data: LoginFormData) => {
        setSubmitError('');
        setSubmitting(true);
        try {
          const res = await apiLogin({ email: data.email, password: data.password, role: 'user', storeId: getCurrentStorefrontStoreId() });
          const { token, user } = res.data;
          TokenStorage.save(token.accessToken, token.refreshToken);
          TokenStorage.saveUser(user);
          LastRolePreference.set((user.role ?? 'user') as AppRole);
          resetRef.current();
          resolve();
        } catch (err) {
          setSubmitError(err instanceof Error ? err.message : 'Invalid credentials. Please try again.');
        } finally {
          setSubmitting(false);
        }
      },
    },
  );

  resetRef.current = form.reset;
  const close = () => {
    cancel();
    form.reset();
    setSubmitError('');
  };
  const goRegister = () => { close(); navigate('/register'); };

  return { pending, close, goRegister, form, submitting, submitError, showPass, setShowPass, social };
}
