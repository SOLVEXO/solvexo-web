import { Loader2 } from 'lucide-react';
import type { SocialProviderKey } from '@/api/services/customerSocialLogin';
import { fashionTheme as t } from '../../theme.config';
import { ts } from '@/utils/tStatic';

function GoogleMark() {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" aria-hidden="true" className="shrink-0">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path fill="#1877F2" d="M24 12a12 12 0 1 0-13.88 11.85v-8.38H7.08V12h3.04V9.36c0-3 1.79-4.67 4.53-4.67 1.31 0 2.69.23 2.69.23v2.95h-1.52c-1.49 0-1.96.93-1.96 1.88V12h3.34l-.53 3.47h-2.81v8.38A12 12 0 0 0 24 12Z" />
    </svg>
  );
}

/** "Continue with Google / Facebook" pill buttons under a divider. Renders nothing when the store connected no provider. */
export function SocialSignIn({ providers, onStart, loading, disabled, dividerText }: {
  providers: SocialProviderKey[]; onStart: (p: SocialProviderKey) => void; loading: boolean; disabled?: boolean; dividerText: string;
}) {
  if (providers.length === 0) return null;
  const blocked = disabled || loading;
  return (
    <div className="mt-6" style={{ fontFamily: t.fonts.body }}>
      <div className="mb-4 flex items-center gap-3" role="separator">
        <div className="h-px flex-1" style={{ background: t.colors.border }} />
        <span className="text-xs" style={{ color: t.colors.inkMuted }}>{dividerText}</span>
        <div className="h-px flex-1" style={{ background: t.colors.border }} />
      </div>
      <div className="flex flex-col gap-2.5" aria-busy={loading || undefined}>
        {providers.map(p => (
          <button key={p} type="button" disabled={blocked} onClick={() => onStart(p)}
            className="flex w-full items-center justify-center gap-2.5 px-5 text-sm font-medium"
            style={{ minHeight: 48, border: `1px solid ${t.colors.border}`, borderRadius: t.buttonRadiusPx, background: 'transparent', color: t.colors.ink, cursor: blocked ? 'not-allowed' : 'pointer', opacity: blocked ? 0.6 : 1 }}>
            {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : p === 'google' ? <GoogleMark /> : <FacebookMark />}
            {ts('pg.continue_with_provider', 'Continue with {{provider}}', { provider: p === 'google' ? 'Google' : 'Facebook' })}
          </button>
        ))}
      </div>
    </div>
  );
}