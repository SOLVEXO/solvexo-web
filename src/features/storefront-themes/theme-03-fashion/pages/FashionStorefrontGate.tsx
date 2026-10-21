import { useState, type FormEvent } from 'react';
import { ts } from '@/utils/tStatic';
import { Lock } from 'lucide-react';
import type { PublicStoreData } from '@/api/services/store';
import { apiVerifyStorePassword } from '@/api/services/store';
import { setStorefrontToken } from '@/utils/currentStorefront';
import { fashionTheme as t, applyMerchantThemeOverrides } from '../theme.config';
import '../fashion.css';

/** Shown instead of the whole store while it is password-protected or "coming soon". */
export function FashionStorefrontGate({ store, onUnlocked }: { store: PublicStoreData; onUnlocked: () => void }) {
  applyMerchantThemeOverrides(null);
  const comingSoon = store.privacyMode === 'coming_soon';
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true); setError('');
    try {
      const res = await apiVerifyStorePassword(store.storeId, password);
      if (res.data?.valid) { setStorefrontToken(store.storeId, res.data.token); onUnlocked(); }
      else setError(ts('gate.wrongPassword', 'That password is not correct.'));
    } catch { setError(ts('pg.something_went_wrong_please_try_again', 'Something went wrong. Please try again.')); }
    finally { setBusy(false); }
  };

  return (
    <main className="grid min-h-screen place-items-center px-5 py-16" style={{ background: t.colors.bgAlt, color: t.colors.ink, fontFamily: t.fonts.body }}>
      <div className="w-full max-w-[440px] p-8 text-center md:p-10" style={{ background: t.colors.bg, borderRadius: 28, border: `1px solid ${t.colors.border}` }}>
        {store.logo ? <img src={store.logo} alt={store.name} className="mx-auto mb-6 max-h-12 max-w-[180px] object-contain" />
          : <p className="m-0 mb-6 text-2xl font-semibold tracking-tight">{store.name}</p>}
        <span className="mx-auto mb-5 grid size-12 place-items-center rounded-full" style={{ background: t.colors.bgAlt }}><Lock size={20} /></span>
        <h1 className="m-0 text-2xl font-semibold tracking-tight">{comingSoon ? <>{ts('pg.opening', 'Opening')} <span className="fx-serif">{ts('pg.word_soon', 'soon')}</span></> : ts('gate.passwordProtected', 'This store is password protected')}</h1>
        <p className="m-0 mt-3 text-[15px] leading-relaxed" style={{ color: t.colors.inkMuted }}>
          {comingSoon ? (store.tagline || ts('pg.we_are_putting_the_finishing_touches_on', 'We are putting the finishing touches on the store. Please check back shortly.')) : ts('pg.enter_the_password_to_visit_the_store', 'Enter the password to visit the store.')}
        </p>
        {!comingSoon && (
          <form onSubmit={submit} className="mt-7 flex flex-col gap-3 text-left">
            <label htmlFor="fx-gate-pw" className="sr-only">{ts('auth.password', 'Password')}</label>
            <input id="fx-gate-pw" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder={ts('auth.password', 'Password')} aria-invalid={!!error}
              className="h-12 w-full bg-transparent px-5 text-sm outline-none" style={{ border: `1px solid ${error ? t.colors.danger : t.colors.border}`, borderRadius: 9999, color: t.colors.ink }} />
            {error && <p role="alert" className="m-0 px-2 text-sm" style={{ color: t.colors.danger }}>{error}</p>}
            <button type="submit" disabled={busy || !password} className="fx-pill" style={{ background: t.colors.accent, color: t.colors.accentInk, border: 'none' }}>{busy ? ts('pg.word_checking', 'Checking…') : ts('pg.enter_store', 'Enter store')}</button>
          </form>
        )}
      </div>
    </main>
  );
}
