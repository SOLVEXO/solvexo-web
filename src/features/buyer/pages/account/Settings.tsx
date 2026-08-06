import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCog, AlertTriangle, Trash2, User, Shield, MapPin, Bell, RefreshCw, ChevronRight,
} from 'lucide-react';
import { useGetProfile, invalidateProfileCache } from '@/hooks/auth/useGetProfile';
import { apiDeleteAccount } from '@/api/services/users';
import { TokenStorage } from '@/api/services/auth';
import { Card, PageHeader, InfoRow, Badge, Modal, Button, SkeletonBox } from '@/components/comman/ui';

const QUICK_LINKS = [
  { label: 'Profile',        description: 'Name, email, phone, and address',      Icon: User,      path: '/account/profile' },
  { label: 'Login & Security', description: 'Password and account security',      Icon: Shield,    path: '/account/security' },
  { label: 'Addresses',      description: 'Manage your saved delivery addresses', Icon: MapPin,    path: '/account/addresses' },
  { label: 'Notifications',  description: 'Choose what you get notified about',  Icon: Bell,      path: '/account/notifications' },
  { label: 'Subscriptions',  description: 'Manage your active memberships',      Icon: RefreshCw, path: '/account/subscriptions' },
];

// Settings is now a hub, not a tab switcher — Profile/Security/Addresses/
// Notifications/Subscriptions each got their own real route (see
// router/index.tsx's account children) instead of living behind
// ?tab=<name> on this one page. This keeps only what's genuinely
// settings-page-shaped: a glance at the account, links to the rest, and the
// danger zone.
export function Settings() {
  const navigate = useNavigate();
  const { profile, loading } = useGetProfile();
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : '—';

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await apiDeleteAccount();
      TokenStorage.clear();
      invalidateProfileCache();
      navigate('/login');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your profile, security, and account preferences."
      />

      <Card padding="none" className="rounded-2xl overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-br from-brand-pale-orange/60 to-cream border-b border-bone flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-white border border-bone flex items-center justify-center shrink-0">
            <UserCog size={16} className="text-brand-orange" />
          </div>
          <p className="text-[13px] font-bold text-charcoal">Account Overview</p>
        </div>
        <div className="px-6 py-1">
          {loading ? (
            <div className="flex flex-col gap-3 py-4">
              {[1, 2, 3].map(i => <SkeletonBox key={i} height={14} width="60%" />)}
            </div>
          ) : (
            <>
              <InfoRow label="Full Name" value={profile?.name ?? '—'} />
              <InfoRow label="Email" value={profile?.email ?? '—'} />
              <InfoRow label="Member Since" value={memberSince} />
              <InfoRow label="Account Role" value={<span className="capitalize">{profile?.role ?? '—'}</span>} />
              <InfoRow
                label="Status"
                value={<Badge color={profile?.status === 'active' ? 'green' : 'gray'} size="sm" dot className="capitalize">{profile?.status ?? '—'}</Badge>}
                border={false}
              />
            </>
          )}
        </div>
        <div className="h-4" />
      </Card>

      <Card padding="none" className="rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-bone">
          <p className="text-[13px] font-bold text-charcoal">Quick Links</p>
        </div>
        <div className="divide-y divide-[#f5f4ef]">
          {QUICK_LINKS.map(({ label, description, Icon, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="w-full flex items-center gap-3 px-6 py-[14px] bg-transparent border-0 cursor-pointer text-left hover:bg-cream transition-colors duration-150"
            >
              <div className="w-9 h-9 rounded-[10px] bg-brand-pale-orange flex items-center justify-center shrink-0">
                <Icon size={15} className="text-brand-orange" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-charcoal">{label}</p>
                <p className="text-[11.5px] text-slate mt-[1px]">{description}</p>
              </div>
              <ChevronRight size={15} className="text-slate shrink-0" />
            </button>
          ))}
        </div>
      </Card>

      <Card padding="none" className="rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#f5bcbc] bg-error-bg/40 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-white border border-[#f5bcbc] flex items-center justify-center shrink-0">
            <AlertTriangle size={16} className="text-error" />
          </div>
          <p className="text-[13px] font-bold text-error">Danger Zone</p>
        </div>
        <div className="p-6">
          <p className="text-[12px] text-slate leading-relaxed mb-4">
            Deleting your account signs you out and deactivates your profile immediately. This can't be undone from the app — you'll need to contact support to reactivate it.
          </p>
          <Button variant="danger" icon={<Trash2 size={13} />} onClick={() => setShowDeleteConfirm(true)}>
            Delete Account
          </Button>
        </div>
      </Card>

      {showDeleteConfirm && (
        <Modal title="Delete your account?" onClose={() => setShowDeleteConfirm(false)} footer={
          <>
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteAccount} loading={deleting}>Delete Account</Button>
          </>
        }>
          <p className="text-[13px] text-slate">
            This deactivates your account and signs you out immediately. You'll need to contact support to reactivate it.
          </p>
        </Modal>
      )}
    </div>
  );
}
