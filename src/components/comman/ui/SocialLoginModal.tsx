import { useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { GoogleIcon, AppleIcon, FacebookIcon } from './SocialIcons';

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
        className="relative bg-white rounded-2xl border border-bone w-full max-w-[400px] overflow-hidden outline-none"
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
