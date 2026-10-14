import type { SocialProviderKey } from '@/api/services/customerSocialLogin';
import type { ProviderState } from './socialProviderUtils';

/** Official-looking brand marks, inline so there is no extra request and they render in both themes. */
export function ProviderLogo({ provider, size = 22 }: { provider: SocialProviderKey; size?: number }) {
  if (provider === 'google') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.8-4.7 4.55-4.7 1.32 0 2.69.24 2.69.24v2.97h-1.52c-1.5 0-1.96.93-1.96 1.89v2.26h3.34l-.53 3.49h-2.81V24C19.61 23.1 24 18.1 24 12.07z" />
    </svg>
  );
}

const BADGE: Record<ProviderState, { label: string; bg: string; fg: string; dot: string }> = {
  connected: { label: 'Connected', bg: '#DCFCE7', fg: '#166534', dot: '#16A34A' },
  attention: { label: 'Needs attention', bg: '#FEE2E2', fg: '#991B1B', dot: '#DC2626' },
  not_connected: { label: 'Not connected', bg: '#F1EFE7', fg: '#6B6960', dot: '#A8A69C' },
};

export function StatusBadge({ state }: { state: ProviderState }) {
  const b = BADGE[state];
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: b.bg, color: b.fg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: b.dot }} aria-hidden="true" />
      {b.label}
    </span>
  );
}

/** A non-interactive "Continue with …" button, drawn like the one customers see on the store's sign-in page. */
export function PreviewButton({ provider, label }: { provider: SocialProviderKey; label: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5 w-full rounded-lg border border-bone bg-white px-4 py-2.5 text-[13px] font-semibold text-charcoal select-none" aria-hidden="true">
      <ProviderLogo provider={provider} size={18} />
      Continue with {label}
    </div>
  );
}
