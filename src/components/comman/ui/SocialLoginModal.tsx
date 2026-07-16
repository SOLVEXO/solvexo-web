import { useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';

/* ── SVG Brand Icons ─────────────────────────────────────────────────────── */
function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M14.044 9.52c-.02-2.22 1.815-3.293 1.897-3.348-1.033-1.511-2.638-1.718-3.207-1.736-1.363-.14-2.665.806-3.354.806-.69 0-1.755-.788-2.885-.766-1.482.022-2.853.866-3.614 2.197-1.54 2.674-.395 6.633 1.107 8.8.737 1.062 1.61 2.253 2.758 2.21 1.11-.044 1.527-.714 2.868-.714 1.34 0 1.713.714 2.884.69 1.193-.02 1.946-1.082 2.677-2.147.845-1.23 1.19-2.42 1.208-2.482-.027-.012-2.316-.888-2.339-3.51Z" fill="#141413"/>
      <path d="M11.78 3.06c.613-.742 1.026-1.773.912-2.8-.883.035-1.95.587-2.582 1.33-.567.655-1.063 1.703-.93 2.707 1 .077 2.02-.508 2.6-1.237Z" fill="#141413"/>
    </svg>
  );
}

function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <rect width="18" height="18" rx="4" fill="#1877F2"/>
      <path d="M12.25 11.5l.375-2.5H10.25V7.5c0-.694.344-1.25 1.313-1.25H12.75V4.062S11.875 3.75 10.938 3.75c-1.875 0-3.063 1.156-3.063 3.25V9H5.75v2.5H7.875V18h2.375v-6.5h2Z" fill="white"/>
    </svg>
  );
}

interface MockProfile {
  name:  string;
  email: string;
  id:    string;
  avatar: string;
}

const MOCK_PROFILES: MockProfile[] = [
  { name: 'Jane Cooper',  email: 'jane.cooper@gmail.com',  id: 'g-1038294829', avatar: 'JC' },
  { name: 'Alex Morgan',  email: 'alex.morgan@gmail.com',  id: 'g-2093847293', avatar: 'AM' },
  { name: 'Dave Clark',   email: 'dave.clark@gmail.com',   id: 'g-3092837492', avatar: 'DC' },
];

const AVATAR_COLORS = ['#4285F4', '#34A853', '#EA4335'];

interface SocialLoginModalProps {
  provider: 'google' | 'facebook' | 'apple';
  onClose:  () => void;
  onSuccess: (profile: {
    userName: string;
    email:    string;
    socialId: string;
    image:    string;
    token:    string;
  }) => void;
  loading?:  boolean;
}

export function SocialLoginModal({ provider, onClose, onSuccess, loading = false }: SocialLoginModalProps) {
  const [isCustom,     setIsCustom]     = useState(false);
  const [customName,   setCustomName]   = useState('');
  const [customEmail,  setCustomEmail]  = useState('');

  const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1);
  const ProviderIcon  = provider === 'google' ? GoogleIcon : provider === 'apple' ? AppleIcon : FacebookIcon;

  const handleSelectMock = (profile: MockProfile) => {
    onSuccess({
      userName: profile.name,
      email:    profile.email,
      socialId: profile.id,
      image:    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name)}`,
      token:    `mock-oauth-token-${profile.id}`,
    });
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customEmail.trim()) return;
    const mockId = `mock-${provider}-${Math.random().toString(36).slice(2, 9)}`;
    onSuccess({
      userName: customName.trim(),
      email:    customEmail.trim(),
      socialId: mockId,
      image:    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customName.trim())}`,
      token:    `mock-oauth-token-${mockId}`,
    });
  };

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Sign in with ${providerLabel}`}
        className="relative bg-white rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.22)] border border-bone w-full max-w-[400px] overflow-hidden outline-none"
      >
        {/* Header — mimics OAuth popup chrome */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-bone bg-[#FAFAFA]">
          <ProviderIcon size={20} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-carbon leading-none">Sign in with {providerLabel}</p>
            <p className="text-[11px] text-slate mt-[3px]">solvexo.com</p>
          </div>
          <button
            onClick={onClose}
            className="size-7 rounded-lg border border-bone flex items-center justify-center cursor-pointer bg-white text-slate hover:text-charcoal transition-colors"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {!isCustom ? (
            <>
              <p className="text-[12px] text-slate -mt-1">
                Choose an account to continue to <strong className="text-charcoal">Solvexo</strong>
              </p>

              {/* Account list */}
              <div className="flex flex-col gap-1.5">
                {MOCK_PROFILES.map((profile, idx) => (
                  <button
                    key={profile.email}
                    disabled={loading}
                    onClick={() => handleSelectMock(profile)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-bone bg-white hover:bg-[#F8F8F8] cursor-pointer text-left transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {/* Avatar circle */}
                    <div
                      className="size-9 rounded-full flex items-center justify-center text-white text-[13px] font-bold shrink-0"
                      style={{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
                    >
                      {profile.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-carbon truncate">{profile.name}</p>
                      <p className="text-[11px] text-slate truncate">{profile.email}</p>
                    </div>
                    <ShieldCheck size={14} className="text-slate/40 group-hover:text-brand-orange shrink-0 transition-colors" />
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-bone" />
                <span className="text-[10px] text-slate">or</span>
                <div className="flex-1 h-px bg-bone" />
              </div>

              <button
                disabled={loading}
                onClick={() => setIsCustom(true)}
                className="w-full py-[10px] rounded-xl border border-bone text-[12.5px] font-medium text-charcoal bg-white hover:bg-[#F8F8F8] cursor-pointer transition-colors disabled:opacity-50"
              >
                Use another account
              </button>
            </>
          ) : (
            <form onSubmit={handleCustomSubmit} className="flex flex-col gap-3">
              <p className="text-[12px] text-slate -mt-1">
                Enter your details to continue to <strong className="text-charcoal">Solvexo</strong>
              </p>

              <Input
                id="social-custom-email"
                label="Email"
                type="email"
                placeholder="you@example.com"
                required
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
              />
              <Input
                id="social-custom-name"
                label="Full Name"
                placeholder="Your name"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />

              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setIsCustom(false)}
                  className="flex-1 py-[10px] rounded-xl border border-bone text-[12.5px] font-medium text-charcoal bg-white hover:bg-[#F8F8F8] cursor-pointer transition-colors"
                >
                  Back
                </button>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  className="flex-1"
                  loading={loading}
                  disabled={!customName.trim() || !customEmail.trim()}
                >
                  Continue
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 text-center">
          <p className="text-[10px] text-slate/70">
            By continuing, Google will share your name, email, and profile photo with Solvexo.
          </p>
        </div>
      </div>
    </div>
  );
}
