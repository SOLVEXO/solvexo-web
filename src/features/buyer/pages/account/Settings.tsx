import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Shield, RefreshCw, MapPin, ChevronRight, Trash2, AlertTriangle, UserCog,
} from 'lucide-react';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { invalidateProfileCache } from '@/hooks/auth/useGetProfile';
import { apiDeleteAccount } from '@/api/services/users';
import { TokenStorage } from '@/api/services/auth';
import { Card, PageHeader, InfoRow, Badge, Modal, Button, SkeletonBox } from '@/components/comman/ui';

const LINKS = [
  { label: 'Notification Preferences', description: 'Choose what updates you receive and how', path: '/account/notifications', Icon: Bell },
  { label: 'Login & Security',          description: 'Password and account protection',        path: '/account/security',     Icon: Shield },
  { label: 'Subscriptions & Billing',   description: 'Manage plans, invoices, and billing',     path: '/account/subscriptions', Icon: RefreshCw },
  { label: 'Addresses',                 description: 'Manage your saved delivery addresses',    path: '/account/addresses',    Icon: MapPin },
];

export function Settings() {
  const navigate = useNavigate();
  const { profile, loading } = useGetProfile();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : '—';

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
        description="An overview of your account and quick links to the rest of your preferences."
      />

      <Card padding="none" className="rounded-2xl overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-br from-brand-pale-orange/60 to-cream border-b border-bone flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex items-center justify-center shrink-0">
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
        <div className="p-2">
          {LINKS.map(link => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="w-full flex items-center gap-3 px-4 py-[12px] rounded-[10px] bg-transparent border-none cursor-pointer hover:bg-cream transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-[9px] bg-brand-pale-orange flex items-center justify-center shrink-0">
                <link.Icon size={15} className="text-brand-orange" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold text-charcoal">{link.label}</p>
                <p className="text-[11px] text-slate mt-[1px]">{link.description}</p>
              </div>
              <ChevronRight size={14} className="text-bone shrink-0" />
            </button>
          ))}
        </div>
      </Card>

      <Card padding="none" className="rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F5BCBC] bg-error-bg/40 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex items-center justify-center shrink-0">
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
