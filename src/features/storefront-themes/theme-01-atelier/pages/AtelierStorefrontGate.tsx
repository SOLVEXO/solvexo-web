import { useState } from 'react';
import { Lock, AlertCircle, Clock } from 'lucide-react';
import type { PublicStoreData } from '@/api/services/store';
import { apiVerifyStorePassword } from '@/api/services/store';
import { AtelierButton } from '../components/AtelierButton';
import { atelierInput, atelierLabel } from '../components/atelierFormStyles';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { atelierTheme as t } from '../theme.config';

/** Real Shopify-style storefront gate — rendered by `StorefrontLayout.tsx`
 *  INSTEAD of the theme's normal `<Layout><Outlet/></Layout>` tree whenever
 *  `store.privacyMode !== 'public'` and this browser tab hasn't already
 *  unlocked it this session (see the sessionStorage key in
 *  `StorefrontLayout.tsx`). Deliberately its own minimal chrome (no navbar/
 *  cart/footer) — there is genuinely nothing else on the site to navigate to
 *  while gated. */
export function AtelierStorefrontGate({ store, onUnlocked }: { store: PublicStoreData; onUnlocked: () => void }) {
  const isComingSoon = store.privacyMode === 'coming_soon';
  useStorefrontSeo({ title: isComingSoon ? 'Coming Soon' : 'This store is password protected', noindex: true });

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiVerifyStorePassword(store.storeId, password);
      if (res.data.valid) {
        sessionStorage.setItem(`storefront_unlock_${store.storeId}`, '1');
        onUnlocked();
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center"
      style={{ background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body, padding: '24px' }}
    >
      <div className="flex flex-col items-center gap-2" style={{ marginBottom: '36px' }}>
        {store.logo ? (
          <img src={store.logo} alt={store.name} style={{ height: '44px', width: 'auto', objectFit: 'contain', marginBottom: '8px' }} />
        ) : null}
        <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3vw, 30px)', fontWeight: 600, color: t.colors.ink }}>{store.name}</h1>
      </div>

      {isComingSoon ? (
        <div className="flex flex-col items-center gap-3" style={{ maxWidth: '380px' }}>
          <Clock size={32} style={{ color: t.colors.inkMuted }} />
          <p style={{ fontSize: '15px', fontWeight: 600, color: t.colors.ink }}>We'll be right back</p>
          <p style={{ fontSize: '13px', color: t.colors.inkMuted, lineHeight: 1.6 }}>
            This store is getting ready to launch. Please check back soon.
          </p>
        </div>
      ) : (
        <div className="w-full" style={{ maxWidth: '340px' }}>
          <div className="flex flex-col items-center gap-2" style={{ marginBottom: '18px' }}>
            <Lock size={22} style={{ color: t.colors.inkMuted }} />
            <p style={{ fontSize: '13px', color: t.colors.inkMuted }}>This store is password protected.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2" style={{ marginBottom: '14px', border: `1px solid ${t.colors.danger}`, padding: '9px 12px' }}>
              <AlertCircle size={13} style={{ color: t.colors.danger, flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: t.colors.danger }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 atelier-form text-left" style={{ border: `1px solid ${t.colors.border}`, padding: '24px' }}>
            <div>
              <label htmlFor="atelier-gate-password" style={atelierLabel}>Password</label>
              <input
                id="atelier-gate-password"
                type="password"
                required
                autoFocus
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={atelierInput}
              />
            </div>
            <AtelierButton type="submit" style={{ width: '100%', justifyContent: 'center' }} loading={loading}>
              Enter
            </AtelierButton>
          </form>
        </div>
      )}
    </div>
  );
}
