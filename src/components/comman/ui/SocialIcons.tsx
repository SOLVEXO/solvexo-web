import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';

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

export type SocialProvider = 'google';

export const SOCIAL_PROVIDERS: { provider: SocialProvider }[] = [
  { provider: 'google' },
];

// One provider's real widget mounts into this slot — see SocialLoginRow.
function ProviderSlot({
  provider,
  mount,
  disabled,
}: {
  provider: SocialProvider;
  mount: (provider: SocialProvider, container: HTMLElement) => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) mount(provider, ref.current);
  }, [provider, mount]);

  return (
    <div className={clsx('w-full flex justify-center [&>div]:w-full', disabled && 'opacity-50 pointer-events-none')}>
      <div ref={ref} className="w-full" />
    </div>
  );
}

// Renders each provider's OWN real sign-in widget (Google Identity Services'
// `renderButton`, mounted via the `mount` callback from useSocialLogin) —
// not a custom-styled button of ours that then calls the provider's API.
// The previous version rendered a plain button that called Google's One Tap
// `prompt()` on click; that silently fails on Safari/mobile/Incognito (One
// Tap is suppressed under ITP-style third-party-storage restrictions —
// confirmed via a production repro showing `is_itp=true` on Google's own
// FedCM status check, with the prompt never displaying). A real, directly
// user-clicked provider button reliably falls back to a proper popup sign-in
// flow everywhere instead.
export function SocialLoginRow({
  mount,
  disabled = false,
  className,
  layout = 'row',
}: {
  mount: (provider: SocialProvider, container: HTMLElement) => void;
  disabled?: boolean;
  className?: string;
  layout?: 'row' | 'stacked';
}) {
  return (
    <div className={clsx(layout === 'row' ? 'flex gap-2.5' : 'flex flex-col gap-2.5', className)}>
      {SOCIAL_PROVIDERS.map(({ provider }) => (
        <ProviderSlot key={provider} provider={provider} mount={mount} disabled={disabled} />
      ))}
    </div>
  );
}
