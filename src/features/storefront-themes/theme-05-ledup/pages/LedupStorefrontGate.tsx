import { useState, type FormEvent } from 'react';
import { Lock } from 'lucide-react';
import type { PublicStoreData } from '@/api/services/store';
import { apiVerifyStorePassword } from '@/api/services/store';
import { ts } from '@/utils/tStatic';
import { setStorefrontToken } from '@/utils/currentStorefront';
import { ledupTheme as t, applyMerchantThemeOverrides } from '../theme.config';
import '../ledup.css';

export function LedupStorefrontGate({ store, onUnlocked }: { store: PublicStoreData; onUnlocked: () => void }) {
  applyMerchantThemeOverrides(null);
  const comingSoon = store.privacyMode === 'coming_soon';
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await apiVerifyStorePassword(store.storeId, password);
      if (res.data?.valid) {
        setStorefrontToken(store.storeId, res.data.token);
        onUnlocked();
      } else {
        setError(ts('pg.incorrect_password', 'Incorrect password.'));
      }
    } catch {
      setError(ts('pg.something_went_wrong_try_again', 'Something went wrong. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center px-6 py-16 bg-[#F9F8F6] text-stone-900" style={{ fontFamily: t.fonts.body }}>
      <div className="w-full max-w-[460px] rounded-3xl bg-white p-8 md:p-12 text-center shadow-xl border border-stone-200/80">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ld-accent)]/10 text-[var(--ld-accent)]">
          <Lock size={24} />
        </div>
        <h1 className="m-0 text-2xl font-bold tracking-tight text-stone-900">
          {comingSoon ? ts('pg.opening_soon', 'Opening soon') : ts('pg.store_password_protected', 'This store is password protected')}
        </h1>
        <p className="mt-2 text-sm text-stone-500 leading-relaxed">
          {comingSoon ? ts('pg.we_are_getting_ready_check_back_soon', 'We are getting ready. Please check back soon.') : ts('pg.enter_the_password_to_visit', 'Enter the password to visit the store.')}
        </p>

        {!comingSoon && (
          <form onSubmit={submit} className="mt-8 flex flex-col gap-3">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={ts('auth.password', 'Password')} aria-label={ts('auth.password', 'Password')}
              className="h-12 w-full rounded-full border border-stone-300 bg-stone-50/50 px-5 text-sm text-stone-900 focus:border-[var(--ld-accent)] focus:outline-none"
            />
            {error && <p className="text-xs text-red-500 m-0">{error}</p>}
            <button
              type="submit"
              disabled={busy || !password}
              className="mt-2 flex h-12 w-full items-center justify-center rounded-full bg-[var(--ld-accent)] text-sm font-semibold text-white transition hover:bg-[var(--ld-accent-hover)] disabled:opacity-50"
            >
              {busy ? ts('pg.checking', 'Checking…') : ts('pg.enter_store', 'Enter store')}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
