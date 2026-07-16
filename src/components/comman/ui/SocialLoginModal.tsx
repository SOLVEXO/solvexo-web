import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Globe, Smartphone, Share2, Mail, User, ShieldCheck } from 'lucide-react';

interface MockProfile {
  name:  string;
  email: string;
  id:    string;
  image: string;
}

const MOCK_PROFILES: MockProfile[] = [
  {
    name: 'Jane Cooper',
    email: 'jane.cooper@example.com',
    id: 'google-oauth2|1038294829',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
  },
  {
    name: 'Alex Morgan',
    email: 'alex.morgan@example.com',
    id: 'google-oauth2|2093847293',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
  },
  {
    name: 'Dave Clark',
    email: 'dave.clark@example.com',
    id: 'google-oauth2|3092837492',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
  },
];

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
  const [isCustom, setIsCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');

  const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1);
  const ProviderIcon = provider === 'google' ? Globe : provider === 'apple' ? Smartphone : Share2;
  const iconColor = provider === 'google' ? '#4285F4' : provider === 'apple' ? '#141413' : '#1877F2';

  const handleSelectMock = (profile: MockProfile) => {
    onSuccess({
      userName: profile.name,
      email:    profile.email,
      socialId: profile.id,
      image:    profile.image,
      token:    `mock-oauth-token-${profile.id}`,
    });
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customEmail.trim()) return;
    const mockId = `mock-${provider}-${Math.random().toString(36).substring(2, 9)}`;
    onSuccess({
      userName: customName.trim(),
      email:    customEmail.trim(),
      socialId: mockId,
      image:    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customName.trim())}`,
      token:    `mock-oauth-token-${mockId}`,
    });
  };

  return (
    <Modal title={`${providerLabel} Login Simulation`} onClose={onClose} width={420}>
      <div className="flex flex-col gap-4">
        {/* Header decoration */}
        <div className="flex items-center gap-3 p-3 bg-cream rounded-xl border border-bone">
          <div className="size-9 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
            <ProviderIcon size={18} style={{ color: iconColor }} />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-charcoal leading-none mb-[3px]">
              Simulating {providerLabel} OAuth Flow
            </p>
            <p className="text-[10.5px] text-slate">
              Select a mock profile or enter custom details to continue.
            </p>
          </div>
        </div>

        {!isCustom ? (
          <>
            {/* Predefined mock profiles */}
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold text-slate uppercase tracking-[0.05em] mb-1">
                Choose a Mock Account
              </p>
              {MOCK_PROFILES.map((profile) => (
                <button
                  key={profile.email}
                  disabled={loading}
                  onClick={() => handleSelectMock(profile)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-bone bg-white hover:bg-cream cursor-pointer text-left transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <img
                    src={profile.image}
                    alt={profile.name}
                    className="size-9 rounded-full object-cover border-2 border-bone shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-carbon group-hover:text-brand-orange leading-tight truncate">
                      {profile.name}
                    </p>
                    <p className="text-[11px] text-slate mt-[2px] truncate">{profile.email}</p>
                  </div>
                  <div className="size-6 rounded-full bg-bone group-hover:bg-brand-pale-orange flex items-center justify-center shrink-0 transition-colors">
                    <ShieldCheck size={13} className="text-slate group-hover:text-brand-orange" />
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-bone" />
              <span className="text-[10px] text-slate uppercase">or</span>
              <div className="flex-1 h-px bg-bone" />
            </div>

            <Button
              variant="outline"
              size="md"
              fullWidth
              disabled={loading}
              onClick={() => setIsCustom(true)}
            >
              Use Custom Profile Info
            </Button>
          </>
        ) : (
          <form onSubmit={handleCustomSubmit} className="flex flex-col gap-3">
            <p className="text-[11px] font-semibold text-slate uppercase tracking-[0.05em] mb-1">
              Enter Custom Profile details
            </p>

            <Input
              id="social-custom-name"
              label="Full Name"
              placeholder="e.g. John Doe"
              required
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              leftIcon={<User size={14} className="text-slate" />}
            />

            <Input
              id="social-custom-email"
              label="Email Address"
              type="email"
              placeholder="e.g. john@example.com"
              required
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              leftIcon={<Mail size={14} className="text-slate" />}
            />

            <div className="flex gap-2 mt-2">
              <Button
                variant="ghost"
                size="md"
                className="flex-1"
                disabled={loading}
                onClick={() => setIsCustom(false)}
              >
                Back
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                className="flex-1"
                loading={loading}
                disabled={!customName.trim() || !customEmail.trim()}
              >
                Sign In Simulation
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
