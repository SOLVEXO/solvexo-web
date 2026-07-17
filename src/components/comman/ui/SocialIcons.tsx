import type { ReactElement } from 'react';
import { clsx } from 'clsx';

/* ── Brand SVG icons — single source of truth (was copy-pasted 3× across
   LoginPage, RegisterPage and SocialLoginModal). ─────────────────────────── */

export function GoogleIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

export function AppleIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <path d="M14.044 9.52c-.02-2.22 1.815-3.293 1.897-3.348-1.033-1.511-2.638-1.718-3.207-1.736-1.363-.14-2.665.806-3.354.806-.69 0-1.755-.788-2.885-.766-1.482.022-2.853.866-3.614 2.197-1.54 2.674-.395 6.633 1.107 8.8.737 1.062 1.61 2.253 2.758 2.21 1.11-.044 1.527-.714 2.868-.714 1.34 0 1.713.714 2.884.69 1.193-.02 1.946-1.082 2.677-2.147.845-1.23 1.19-2.42 1.208-2.482-.027-.012-2.316-.888-2.339-3.51Z" fill="#141413"/>
      <path d="M11.78 3.06c.613-.742 1.026-1.773.912-2.8-.883.035-1.95.587-2.582 1.33-.567.655-1.063 1.703-.93 2.707 1 .077 2.02-.508 2.6-1.237Z" fill="#141413"/>
    </svg>
  );
}

export function FacebookIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <rect width="18" height="18" rx="4" fill="#1877F2"/>
      <path d="M12.25 11.5l.375-2.5H10.25V7.5c0-.694.344-1.25 1.313-1.25H12.75V4.062S11.875 3.75 10.938 3.75c-1.875 0-3.063 1.156-3.063 3.25V9H5.75v2.5H7.875V18h2.375v-6.5h2Z" fill="white"/>
    </svg>
  );
}

export type SocialProvider = 'google' | 'facebook' | 'apple';

export const SOCIAL_PROVIDERS: { Icon: (props: { size?: number }) => ReactElement; label: string; provider: SocialProvider }[] = [
  { Icon: GoogleIcon,   label: 'Google',   provider: 'google'   },
  { Icon: AppleIcon,    label: 'Apple',    provider: 'apple'    },
  { Icon: FacebookIcon, label: 'Facebook', provider: 'facebook' },
];

/** Premium social-login button row — shared by LoginPage, RegisterPage. */
export function SocialLoginRow({
  onSelect,
  disabled = false,
  className,
}: {
  onSelect:  (provider: SocialProvider) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={clsx('flex gap-2.5', className)}>
      {SOCIAL_PROVIDERS.map(({ Icon, label, provider }) => (
        <button
          key={provider}
          type="button"
          onClick={() => onSelect(provider)}
          disabled={disabled}
          className={[
            'flex-1 flex items-center justify-center gap-[7px] px-3 py-[11px] bg-white border border-bone rounded-xl',
            'text-[12.5px] font-medium text-charcoal cursor-pointer',
            'transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out',
            'hover:bg-cream hover:border-slate/40 hover:-translate-y-px hover:shadow-sm',
            'active:translate-y-0 active:scale-[0.98]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-orange/50',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none',
          ].join(' ')}
        >
          <Icon />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
