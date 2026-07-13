import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  User, ShoppingBag, Heart, MapPin, Mail, Camera,
  Check, Shield, ShoppingCart, ImageOff, Loader2, Star,
  Plus, Pencil, ArrowLeft, Home, Briefcase, Star as StarIcon,
  ChevronRight, Menu, X, MessageSquare, Ban, Flag, Trash2, RefreshCw,
  type LucideIcon,
} from 'lucide-react';
import { useGetProfile, invalidateProfileCache } from '@/hooks/auth/useGetProfile';
import { useEditProfile } from '@/hooks/auth/useEditProfile';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { useCartContext } from '@/contexts/CartContext';
import {
  apiGetMyAddresses, apiAddAddress, apiUpdateAddress, apiSetDefaultAddress, apiDeleteAddress,
  type Address, type AddressPayload,
} from '@/api/services/address';
import { useConversations, useSearchConversations, useStartConversation } from '@/hooks/messaging/useConversations';
import { useMessages } from '@/hooks/messaging/useMessages';
import { useModeration } from '@/hooks/messaging/useModeration';
import { apiUploadAttachment, apiDeleteConversation, type Conversation } from '@/api/services/messaging';
import { ChatList, ChatWindow, NewChatModal, type ChatListEntry } from '@/components/comman/messaging';
import {
  Table,     type TableColumn,
  ActionMenu,
  type ActionMenuItem,
  Badge,
  Card,
  EmptyState,
  SkeletonBox,
} from '@/components/comman/ui';
import { OrdersTab } from '@/features/buyer/pages/MyOrdersPage';
import { ReviewsTab } from '@/features/buyer/pages/MyReviewsPage';
import { SubscriptionsTab } from '@/features/buyer/pages/MySubscriptionsPage';
import { apiChangePassword, apiDeleteAccount } from '@/api/services/users';
import { TokenStorage } from '@/api/services/auth';
import { Modal } from '@/components/comman/ui/Modal';

// ── Constants ─────────────────────────────────────────────────────────────────
type Tab = 'profile' | 'orders' | 'wishlist' | 'addresses' | 'messages' | 'reviews' | 'subscriptions';

const NAV_ITEMS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: 'profile',   label: 'My Profile', Icon: User          },
  { id: 'orders',    label: 'My Orders',  Icon: ShoppingBag    },
  { id: 'subscriptions', label: 'My Subscriptions', Icon: RefreshCw },
  { id: 'reviews',   label: 'My Reviews', Icon: Star           },
  { id: 'wishlist',  label: 'Wishlist',   Icon: Heart          },
  { id: 'addresses', label: 'Addresses',  Icon: MapPin         },
  { id: 'messages',  label: 'Messages',   Icon: MessageSquare  },
];

const INPUT_CLS  = 'w-full py-[10px] px-[13px] text-[13px] border border-bone rounded-[9px] outline-none text-charcoal bg-white box-border';
const LABEL_CLS  = 'text-[12px] font-medium text-graphite mb-[6px] block';
const EMPTY_FORM: AddressPayload = {
  label: 'Home', recipientName: '', phoneNumber: '',
  addressLine1: '', addressLine2: '', state: '', city: '', zipCode: '',
  isDefault: false,
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
interface SidebarProps {
  profile:        ReturnType<typeof useGetProfile>['profile'];
  loading:        boolean;
  tab:            Tab;
  setTab:         (t: Tab) => void;
  wishlistCount:  number;
  mobileOpen:     boolean;
  onMobileClose:  () => void;
}

function ProfileSidebar({ profile, loading, tab, setTab, wishlistCount, mobileOpen, onMobileClose }: SidebarProps) {
  const initials = profile?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '..';

  const inner = (
    <>
      {/* ── Avatar + info ── */}
      <div className="px-5 pt-7 pb-5 border-b border-bone shrink-0">
        {/* Avatar */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="relative mb-3">
            <div className="w-[80px] h-[80px] rounded-full bg-brand-pale-orange overflow-hidden flex items-center justify-center text-[28px] font-bold text-brand-deep-orange border-[3px] border-bone">
              {loading
                ? <SkeletonBox width={80} height={80} rounded="50%" />
                : profile?.profileImage
                  ? <img loading="lazy" decoding="async" src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
                  : initials}
            </div>
            <button className="absolute bottom-0 right-0 w-[26px] h-[26px] rounded-full bg-brand-orange border-2 border-white flex items-center justify-center cursor-pointer">
              <Camera size={11} className="text-white" />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <SkeletonBox width={130} height={16} />
              <SkeletonBox width={160} height={12} />
            </div>
          ) : (
            <>
              <p className="text-[15px] font-bold text-charcoal leading-tight mb-[5px]">
                {profile?.name ?? '—'}
              </p>
              <div className="flex items-center gap-[5px] mb-3">
                <Mail size={11} className="text-slate shrink-0" />
                <span className="text-[11px] text-slate truncate max-w-[170px]">{profile?.email ?? '—'}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                <Badge color="orange" size="sm" className="capitalize">{profile?.role ?? ''}</Badge>
                <Badge
                  color={profile?.status === 'active' ? 'green' : 'gray'}
                  size="sm"
                  dot
                  className="capitalize"
                >
                  {profile?.status ?? ''}
                </Badge>
                {profile?.isVerified && (
                  <Badge color="green" size="sm">
                    <Check size={9} className="mr-[2px]" /> Verified
                  </Badge>
                )}
              </div>
            </>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="bg-bone rounded-[9px] px-3 py-2.5 text-center">
            <p className="text-[18px] font-bold text-charcoal leading-none mb-[3px]">{wishlistCount}</p>
            <p className="text-[10px] text-slate">Wishlist</p>
          </div>
          <div className="bg-bone rounded-[9px] px-3 py-2.5 text-center">
            <p className="text-[18px] font-bold text-charcoal leading-none mb-[3px]">—</p>
            <p className="text-[10px] text-slate">Orders</p>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-3 py-4">
        <p className="text-[10px] font-semibold text-slate uppercase tracking-[0.08em] px-2 mb-2">Account</p>
        {NAV_ITEMS.map(item => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={clsx(
                'w-full flex items-center justify-between px-3 py-[9px] rounded-[8px] text-[13px] mb-[2px] transition-all duration-150 border-none cursor-pointer',
                active
                  ? 'bg-brand-pale-orange text-brand-orange font-semibold'
                  : 'bg-transparent text-slate hover:bg-bone hover:text-charcoal font-normal',
              )}
            >
              <span className="flex items-center gap-[9px]">
                <item.Icon size={14} />
                {item.label}
                {item.id === 'wishlist' && wishlistCount > 0 && (
                  <span className={clsx(
                    'text-[10px] font-bold px-[6px] py-[1px] rounded-full',
                    active ? 'bg-brand-orange text-white' : 'bg-bone text-slate',
                  )}>
                    {wishlistCount}
                  </span>
                )}
              </span>
              <ChevronRight size={13} className={active ? 'text-brand-orange' : 'text-bone'} />
            </button>
          );
        })}
      </nav>

    </>
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-[260px] shrink-0 bg-white border-r border-bone flex-col h-full">
        {inner}
      </aside>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-x-0 top-[44px] bottom-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onMobileClose} />
          <aside className="relative flex flex-col w-[280px] max-w-[85vw] h-full bg-white shadow-2xl overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-bone">
              <span className="text-[11px] font-bold text-slate uppercase tracking-[0.08em]">Account</span>
              <button
                onClick={onMobileClose}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-bone border-none cursor-pointer"
              >
                <X size={13} className="text-charcoal" />
              </button>
            </div>
            {inner}
          </aside>
        </div>
      )}
    </>
  );
}

// ── Wishlist helpers ──────────────────────────────────────────────────────────
function WishlistImg({ images, name }: { images?: string[]; name: string }) {
  const [err, setErr] = useState(false);
  const src = images?.[0];
  if (!src || err) {
    return (
      <div className="w-[84px] h-[84px] rounded-[12px] bg-brand-pale-orange shrink-0 flex items-center justify-center border border-[#EDEBE2]">
        <ImageOff size={20} className="text-brand-orange opacity-40" />
      </div>
    );
  }
  return (
    <img loading="lazy" decoding="async" src={src} alt={name} onError={() => setErr(true)}
      className="w-[84px] h-[84px] rounded-[12px] object-cover shrink-0 border border-[#EDEBE2]" />
  );
}

// ── Wishlist tab ──────────────────────────────────────────────────────────────
function WishlistTab() {
  const navigate = useNavigate();
  const { wishlistItems, wishlistCount, loading: wLoading, wishlisting, removeFromWishlist, clearWishlist, clearing } = useWishlistContext();
  const { addToCart, adding } = useCartContext();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingId,   setAddingId]   = useState<string | null>(null);

  const handleRemove = (productId: string, variantId: string) => {
    setRemovingId(variantId);
    removeFromWishlist(productId, variantId).finally(() => setRemovingId(null));
  };
  const handleAddToCart = (productId: string, variantId: string, type?: 'physical' | 'digital') => {
    setAddingId(variantId);
    addToCart(productId, variantId, type).finally(() => setAddingId(null));
  };
  const handleClearAll = () => {
    if (!window.confirm('Remove all items from your wishlist?')) return;
    clearWishlist().catch(err => alert(err instanceof Error ? err.message : 'Failed to clear wishlist.'));
  };

  if (wLoading) {
    return (
      <Card padding="none">
        <div className="px-5 pt-5 pb-4 border-b border-bone flex items-end justify-between">
          <div className="flex flex-col gap-[6px]">
            <SkeletonBox width={100} height={10} />
            <SkeletonBox width={120} height={22} />
          </div>
          <div className="flex flex-col gap-[5px] items-end pb-[2px]">
            <SkeletonBox width={80} height={13} />
            <SkeletonBox width={50} height={10} />
          </div>
        </div>
        <div className="divide-y divide-[#F5F4EF]">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4 items-center px-5 py-[18px]">
              <SkeletonBox width={84} height={84} rounded="12px" />
              <div className="flex-1 flex flex-col gap-[10px]">
                <SkeletonBox width="50%" height={14} />
                <SkeletonBox width="20%" height={10} />
                <div className="flex gap-2">
                  <SkeletonBox width={48} height={22} rounded="6px" />
                  <SkeletonBox width={36} height={22} rounded="6px" />
                </div>
                <SkeletonBox width="35%" height={16} />
              </div>
              <div className="flex flex-col gap-[8px] items-end shrink-0">
                <SkeletonBox width={110} height={36} rounded="10px" />
                <SkeletonBox width={80}  height={30} rounded="8px" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (wishlistCount === 0) {
    return (
      <Card padding="none">
        <div className="px-5 pt-5 pb-4 border-b border-bone">
          <p className="text-[11px] text-slate mb-[3px]">Account / Wishlist</p>
          <h1 className="text-[22px] font-bold text-charcoal">Wishlist</h1>
        </div>
        <EmptyState
          icon={<Heart size={28} className="text-brand-orange opacity-55" />}
          title="Wishlist is empty"
          description="Save products you love and find them here anytime."
          className="py-12"
        />
      </Card>
    );
  }

  return (
    <Card padding="none">
      {/* Header: title left, Saved Items right — single row */}
      <div className="px-5 pt-5 pb-4 border-b border-bone flex items-end justify-between">
        <div>
          <p className="text-[11px] text-slate mb-[3px]">Account / Wishlist</p>
          <h1 className="text-[22px] font-bold text-charcoal leading-none">Wishlist</h1>
        </div>
        <div className="flex flex-col items-end gap-[6px] pb-[2px]">
          <div className="text-right">
            <p className="text-[13px] font-semibold text-charcoal leading-tight">Saved Items</p>
            <p className="text-[11px] text-slate mt-[2px]">{wishlistCount} item{wishlistCount !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={handleClearAll}
            disabled={clearing}
            className="text-[11px] font-medium text-error bg-transparent border-none cursor-pointer disabled:opacity-50"
          >
            {clearing ? 'Clearing…' : 'Clear All'}
          </button>
        </div>
      </div>
      <div className="divide-y divide-[#F5F4EF]">
        {wishlistItems.map((item, idx) => {
          const isLast = idx === wishlistItems.length - 1;
          const p       = item.product;
          const variant = item.variants[0];
          const isRemoving = removingId === variant?._id || wishlisting === variant?._id;
          const isAdding   = addingId   === variant?._id || adding       === variant?._id;

          const discount = variant?.compareAtPrice && variant.compareAtPrice > variant.price
            ? Math.round((1 - variant.price / variant.compareAtPrice) * 100)
            : null;

          return (
            <div
              key={p._id}
              className={clsx(
                'group flex gap-4 items-center px-5 py-[18px] transition-all',
                !isLast && 'border-b border-[#F0EDE5]',
                isRemoving && 'opacity-40',
                'hover:bg-[#FAFAF8]',
              )}
            >
              <WishlistImg images={p.images ?? []} name={p.name} />

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col gap-[7px]">
                <p
                  onClick={() => navigate(`/marketplace/${p._id}`)}
                  className="font-bold text-[14px] text-carbon cursor-pointer leading-snug hover:text-brand-orange transition-colors line-clamp-1"
                >
                  {p.name}
                </p>

                {/* Stars + rating */}
                <div className="flex items-center gap-[4px]">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} size={11} className={clsx(
                      i <= Math.round(p.averageRating) ? 'text-brand-orange fill-brand-orange' : 'text-bone fill-bone',
                    )} />
                  ))}
                  {p.averageRating > 0 && (
                    <span className="text-[11px] text-slate ml-[2px]">({p.averageRating.toFixed(1)})</span>
                  )}
                </div>

                {/* Variant pills */}
                {variant && (variant.color || variant.size) && (
                  <div className="flex items-center gap-[5px]">
                    {variant.color && (
                      <span className="text-[11px] px-[8px] py-[2px] rounded-[6px] bg-[#F2F0EA] text-slate font-medium">
                        {variant.color}
                      </span>
                    )}
                    {variant.size && (
                      <span className="text-[11px] px-[8px] py-[2px] rounded-[6px] bg-[#F2F0EA] text-slate font-medium">
                        {variant.size}
                      </span>
                    )}
                  </div>
                )}

                {/* Price row */}
                {variant && (
                  <div className="flex items-center gap-[8px]">
                    <span className="font-bold text-[16px] text-carbon">
                      ${variant.price.toLocaleString()}
                    </span>
                    {variant.compareAtPrice && variant.compareAtPrice > variant.price && (
                      <span className="text-[12px] line-through text-[#B0AEAA]">
                        ${variant.compareAtPrice.toLocaleString()}
                      </span>
                    )}
                    {discount && (
                      <span className="text-[10px] font-bold px-[7px] py-[2px] rounded-[5px] bg-[#DCFCE7] text-[#15803D]">
                        Save {discount}%
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-[8px] justify-center shrink-0">
                {variant && (
                  <button
                    onClick={() => handleAddToCart(p._id, variant._id, 'physical')}
                    disabled={isAdding}
                    className={clsx(
                      'flex items-center gap-[6px] px-[16px] py-[9px] rounded-[10px] text-[12px] font-bold bg-brand-orange text-white border-none whitespace-nowrap',
                      isAdding ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:opacity-90',
                    )}
                  >
                    {isAdding ? <Loader2 size={12} className="animate-spin" /> : <ShoppingCart size={12} />}
                    {isAdding ? 'Adding…' : 'Add to Cart'}
                  </button>
                )}
                <button
                  onClick={() => variant && handleRemove(p._id, variant._id)}
                  disabled={isRemoving}
                  className={clsx(
                    'flex items-center justify-center gap-[5px] px-3 py-[6px] rounded-[8px] text-[11px] font-medium border border-bone bg-white text-slate whitespace-nowrap transition-colors',
                    isRemoving ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-[#FECDD3] hover:text-[#E11D48] hover:bg-[#FFF5F7]',
                  )}
                >
                  {isRemoving ? <Loader2 size={11} className="animate-spin" /> : <Heart size={11} />}
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ── Address helpers ───────────────────────────────────────────────────────────
function AddrField({ label, value, onChange, placeholder, half }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; half?: boolean;
}) {
  return (
    <div className={half ? '' : 'sm:col-span-2'}>
      <label className={LABEL_CLS}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={INPUT_CLS} />
    </div>
  );
}

function AddressForm({ initial, onSave, onCancel, saving }: {
  initial: AddressPayload; onSave: (d: AddressPayload) => void; onCancel: () => void; saving: boolean;
}) {
  const [form, setForm] = useState<AddressPayload>(initial);
  const set = (k: keyof AddressPayload, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="border-[1.5px] border-brand-orange rounded-[12px] px-5 py-5 bg-[#FFFAF7]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className={LABEL_CLS}>Label</label>
          <div className="flex gap-2">
            {(['Home', 'Work', 'Other'] as const).map(l => (
              <button
                key={l} type="button" onClick={() => set('label', l)}
                className={clsx(
                  'px-4 py-[6px] rounded-lg text-[12px] font-semibold cursor-pointer border',
                  form.label === l
                    ? 'border-brand-orange bg-brand-pale-orange text-brand-deep-orange'
                    : 'border-bone bg-white text-slate',
                )}
              >{l}</button>
            ))}
          </div>
        </div>
        <AddrField label="Recipient Name"            value={form.recipientName}      onChange={v => set('recipientName', v)}  placeholder="Full name"        half />
        <AddrField label="Phone Number"              value={form.phoneNumber}        onChange={v => set('phoneNumber', v)}    placeholder="e.g. 03001234567" half />
        <AddrField label="Address Line 1"            value={form.addressLine1}       onChange={v => set('addressLine1', v)}   placeholder="House no, Street" />
        <AddrField label="Address Line 2 (Optional)" value={form.addressLine2 ?? ''} onChange={v => set('addressLine2', v)}   placeholder="Landmark, Area"   />
        <AddrField label="City"                      value={form.city}               onChange={v => set('city', v)}           placeholder="e.g. Karachi"     half />
        <AddrField label="State"                     value={form.state}              onChange={v => set('state', v)}          placeholder="e.g. Sindh"       half />
        <AddrField label="Zip Code"                  value={form.zipCode}            onChange={v => set('zipCode', v)}        placeholder="e.g. 75300"       half />
        <div className="sm:col-span-2 flex items-center gap-2">
          <input
            type="checkbox" id="addr-default"
            checked={form.isDefault ?? false}
            onChange={e => set('isDefault', e.target.checked)}
            className="w-[15px] h-[15px] cursor-pointer accent-brand-orange"
          />
          <label htmlFor="addr-default" className="text-[12px] text-graphite cursor-pointer">
            Set as default address
          </label>
        </div>
      </div>
      <div className="flex gap-[10px] mt-[18px]">
        <button
          onClick={() => onSave(form)} disabled={saving}
          className={clsx(
            'px-6 py-[9px] rounded-[9px] text-[13px] font-semibold bg-brand-orange text-white border-none flex items-center gap-[6px]',
            saving ? 'cursor-not-allowed opacity-70' : 'cursor-pointer',
          )}
        >
          {saving && <Loader2 size={13} className="animate-spin" />}
          {saving ? 'Saving…' : 'Save Address'}
        </button>
        <button onClick={onCancel} className="px-[18px] py-[9px] rounded-[9px] text-[13px] border border-bone bg-white text-slate cursor-pointer">
          Discard
        </button>
      </div>
    </div>
  );
}

// ── Address tab ───────────────────────────────────────────────────────────────
type AddrView = 'list' | 'add' | 'edit';

const LABEL_ICON: Record<string, LucideIcon> = { Home, Work: Briefcase, Other: StarIcon };

function AddressTab() {
  const [addresses,  setAddresses]  = useState<Address[]>([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [view,       setView]       = useState<AddrView>('list');
  const [editTarget, setEditTarget] = useState<Address | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGetMyAddresses()
      .then(res => { if (!cancelled) setAddresses(res.data ?? []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setAddrLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const goList = () => { setView('list'); setEditTarget(null); };

  const refreshAddresses = () =>
    apiGetMyAddresses()
      .then(res => setAddresses(res.data ?? []))
      .catch(() => {});

  const handleSave = async (data: AddressPayload) => {
    setSaving(true);
    try {
      if (view === 'add') await apiAddAddress(data);
      else if (view === 'edit' && editTarget) await apiUpdateAddress(editTarget._id, data);
      await refreshAddresses();
      goList();
    } catch { /* keep form open */ }
    finally { setSaving(false); }
  };

  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const handleSetDefault = async (addressId: string) => {
    setSettingDefaultId(addressId);
    try {
      await apiSetDefaultAddress(addressId);
      await refreshAddresses();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to set default address.');
    } finally {
      setSettingDefaultId(null);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const handleDeleteAddress = async (addressId: string) => {
    if (!window.confirm('Delete this address? This cannot be undone.')) return;
    setDeletingId(addressId);
    try {
      await apiDeleteAddress(addressId);
      await refreshAddresses();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete address.');
    } finally {
      setDeletingId(null);
    }
  };

  const columns: TableColumn<Address>[] = [
    {
      key: 'no', header: '#', width: '48px',
      render: (_, i) => <span className="text-[12px] text-slate">{i + 1}</span>,
    },
    {
      key: 'label', header: 'Label',
      render: a => {
        const LIcon = LABEL_ICON[a.label] ?? MapPin;
        return (
          <Badge color="orange" size="sm">
            <LIcon size={10} className="mr-[3px]" />{a.label}
          </Badge>
        );
      },
    },
    {
      key: 'recipientName', header: 'Recipient',
      render: a => (
        <div className="flex items-center gap-2">
          <div className="w-[26px] h-[26px] rounded-full bg-[#EAF3FB] text-[11px] font-bold flex items-center justify-center shrink-0 text-[#2156A8]">
            {a.recipientName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <span className="text-charcoal">{a.recipientName}</span>
        </div>
      ),
    },
    {
      key: 'phoneNumber', header: 'Phone',
      render: a => <span className="text-slate">{a.phoneNumber}</span>,
    },
    {
      key: 'address', header: 'Address',
      render: a => (
        <span className="text-slate text-[12px] block max-w-[220px] truncate">
          {a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}, {a.city}, {a.state}
        </span>
      ),
    },
    {
      key: 'isDefault', header: 'Status',
      render: a => (
        <Badge color={a.isDefault ? 'green' : 'gray'} dot>
          {a.isDefault ? 'Default' : 'Saved'}
        </Badge>
      ),
    },
    {
      key: 'actions', header: '', align: 'center', width: '60px',
      render: a => (
        <ActionMenu
          align="right"
          items={[
            { label: 'Edit', onClick: () => { setEditTarget(a); setView('edit'); }, icon: <Pencil size={13} /> },
            ...(a.isDefault ? [] : [{
              label: settingDefaultId === a._id ? 'Setting…' : 'Set as Default',
              onClick: () => handleSetDefault(a._id),
              icon: <StarIcon size={13} />,
            }]),
            {
              label: deletingId === a._id ? 'Deleting…' : 'Delete',
              onClick: () => handleDeleteAddress(a._id),
              icon: <Trash2 size={13} />,
              danger: true,
            },
          ]}
        />
      ),
    },
  ];

  if (view !== 'list') {
    return (
      <Card padding="none">
        <div className="px-5 pt-5 pb-4 mb-5 border-b border-bone flex items-end justify-between">
          <div>
            <p className="text-[11px] text-slate mb-[3px]">Account / Addresses</p>
            <h1 className="text-[22px] font-bold text-charcoal leading-none">Addresses</h1>
          </div>
          <div className="flex items-center gap-[10px] pb-[2px]">
            <button onClick={goList} className="flex items-center gap-[6px] px-3 py-[6px] rounded-lg text-[12px] border border-bone bg-cream text-charcoal cursor-pointer">
              <ArrowLeft size={14} /> Back
            </button>
            <p className="text-[14px] font-semibold text-charcoal">
              {view === 'edit' ? 'Edit Address' : 'Add New Address'}
            </p>
          </div>
        </div>
        <div className="px-5 pb-5">
          <AddressForm
            initial={editTarget
              ? { label: editTarget.label, recipientName: editTarget.recipientName, phoneNumber: editTarget.phoneNumber, addressLine1: editTarget.addressLine1, addressLine2: editTarget.addressLine2, state: editTarget.state, city: editTarget.city, zipCode: editTarget.zipCode, isDefault: editTarget.isDefault }
              : EMPTY_FORM}
            onSave={handleSave}
            onCancel={goList}
            saving={saving}
          />
        </div>
      </Card>
    );
  }

  return (
    <Card padding="none">
      <div className="px-5 pt-5 pb-4 flex items-end justify-between border-b border-bone">
        <div>
          <p className="text-[11px] text-slate mb-[3px]">Account / Addresses</p>
          <h1 className="text-[22px] font-bold text-charcoal leading-none">Addresses</h1>
        </div>
        <div className="flex items-end gap-4 pb-[2px]">
          <div className="text-right">
            <p className="text-[13px] font-semibold text-charcoal leading-tight">Saved Addresses</p>
            <p className="text-[11px] text-slate mt-[1px]">{addresses.length} address{addresses.length !== 1 ? 'es' : ''}</p>
          </div>
          <button
            onClick={() => setView('add')}
            className="flex items-center gap-[6px] px-[14px] py-[8px] rounded-lg text-[13px] font-semibold bg-brand-orange text-white border-none cursor-pointer"
          >
            <Plus size={15} /> Add Address
          </button>
        </div>
      </div>

      {addrLoading ? (
        <div className="px-5 py-4 flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4">
              <SkeletonBox width={20}  height={13} />
              <SkeletonBox width={60}  height={22} rounded="999px" />
              <SkeletonBox width="20%" height={13} />
              <SkeletonBox width="15%" height={13} />
              <SkeletonBox width="30%" height={13} />
              <SkeletonBox width={60}  height={22} rounded="999px" />
              <SkeletonBox width={30}  height={30} rounded="7px" />
            </div>
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin size={28} className="text-brand-orange opacity-55" />}
          title="No addresses saved"
          description="Add a shipping address to speed up checkout."
          action={{ label: 'Add Address', onClick: () => setView('add'), icon: <Plus size={14} /> }}
        />
      ) : (
        <Table columns={columns} data={addresses} keyExtractor={a => a._id} />
      )}
    </Card>
  );
}

// ── Messages tab ──────────────────────────────────────────────────────────────
// NOTE: buyer role has no archive/pin/mute — those messaging actions are
// seller-only per the API. Buyer can start/search/delete conversations,
// send/edit/delete messages, and block/report a seller.
function toBuyerEntry(c: Conversation): ChatListEntry {
  return {
    id:      c._id,
    name:    c.store?.name ?? `Seller #${c.sellerId?.slice(-6).toUpperCase() ?? '——'}`,
    image:   c.store?.logo,
    preview: c.lastMessage ? (c.lastMessage.type === 'text' ? c.lastMessage.text ?? '' : c.lastMessage.type === 'voice' ? '🎤 Voice note' : c.lastMessage.type === 'image' ? '📷 Photo' : c.lastMessage.type === 'video' ? '🎥 Video' : '📎 File') : 'No messages yet',
    time:    c.lastMessage ? new Date(c.lastMessage.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    unread:  c.buyerUnread,
  };
}

function MessagesTab({ initialConversationId }: { initialConversationId?: string | null }) {
  const { profile } = useGetProfile();
  const { conversations, loading: listLoading, error: listError, refetch: refetchList } = useConversations();
  const { results: searchResults, search, loading: searching } = useSearchConversations();
  const [query, setQuery] = useState('');

  const isSearching = query.trim().length >= 2;
  const list = isSearching ? searchResults : conversations;

  const [activeId, setActiveId] = useState<string | null>(initialConversationId ?? null);
  const active = list.find(c => c._id === activeId) ?? null;

  // Auto-open the conversation passed via URL ?conversation=xxx
  useEffect(() => {
    if (initialConversationId) setActiveId(initialConversationId);
  }, [initialConversationId]);

  const {
    messages, loading: msgLoading, sending, send, edit, remove, markSeen, hasMore, loadMore,
    otherOnline, otherTyping, sendTyping,
  } = useMessages(activeId);
  const { block, unblock, report } = useModeration();
  const { execute: startConversation, loading: starting } = useStartConversation();

  const [uploading, setUploading]             = useState(false);
  const [showNewChat, setShowNewChat]         = useState(false);
  const [blockedSellerId, setBlockedSellerId] = useState<string | null>(null);

  // Mark the latest incoming message as seen once the thread is open.
  useEffect(() => {
    if (!activeId || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.senderId !== profile?._id) void markSeen(last._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, messages.length]);

  const handleSearch = (v: string) => {
    setQuery(v);
    if (v.trim().length >= 2) search(v.trim());
  };

  const handleStartConversation = async (storeId: string) => {
    const convo = await startConversation({ storeId });
    if (convo) {
      setShowNewChat(false);
      await refetchList();
      setActiveId(convo._id);
    }
  };

  const handleUpload = async (file: File) => {
    if (!activeId) return;
    setUploading(true);
    try {
      const attachment = await apiUploadAttachment(activeId, file);
      const kind = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'voice' : file.type === 'application/pdf' ? 'pdf' : 'document';
      await send({ type: kind, attachments: [attachment] });
    } finally {
      setUploading(false);
    }
  };

  const handleBlock = () => {
    if (!active) return;
    void block({ targetId: active.sellerId, targetRole: 'seller', reason: 'Blocked from buyer inbox' }).then(ok => {
      if (ok) setBlockedSellerId(active.sellerId);
    });
  };
  const handleUnblock = () => {
    if (!blockedSellerId) return;
    void unblock(blockedSellerId).then(ok => { if (ok) setBlockedSellerId(null); });
  };
  const handleReport = () => {
    if (!active) return;
    void report({ targetType: 'conversation', targetId: active._id, reason: 'inappropriate', details: 'Reported from buyer inbox' });
  };
  const handleDelete = async () => {
    if (!active) return;
    await apiDeleteConversation(active._id);
    setActiveId(null);
    refetchList();
  };

  const menuItems: ActionMenuItem[] = active ? [
    blockedSellerId === active.sellerId
      ? { label: 'Unblock seller', icon: <Ban size={14} />, onClick: handleUnblock }
      : { label: 'Block seller',   icon: <Ban size={14} />, onClick: handleBlock },
    { label: 'Report conversation', icon: <Flag size={14} />, onClick: handleReport },
    { label: 'Delete chat', icon: <Trash2 size={14} />, onClick: () => void handleDelete(), danger: true },
  ] : [];

  return (
    <Card padding="none">
      <div className="flex overflow-hidden" style={{ height: '620px' }}>
        <div className={clsx('md:flex', activeId ? 'hidden' : 'flex')}>
          <ChatList
            title="Messages"
            entries={list.map(toBuyerEntry)}
            activeId={activeId}
            onSelect={setActiveId}
            query={query}
            onQueryChange={handleSearch}
            loading={isSearching ? searching : listLoading}
            error={listError}
          />
        </div>

        <ChatWindow
          open={!!active}
          headerName={active ? (active.store?.name ?? `Seller #${active.sellerId.slice(-6).toUpperCase()}`) : ''}
          headerImage={active?.store?.logo}
          headerSubtitle={undefined}
          menuItems={menuItems}
          onBack={() => setActiveId(null)}
          messages={messages}
          msgLoading={msgLoading}
          currentUserId={profile?._id}
          otherPartyId={active?.sellerId ?? ''}
          hasMore={hasMore}
          onLoadMore={loadMore}
          sending={sending}
          uploading={uploading}
          onSend={payload => void send(payload)}
          onUpload={file => void handleUpload(file)}
          onEditMessage={(id, text) => void edit(id, text)}
          onDeleteMessage={id => void remove(id)}
          otherOnline={otherOnline}
          otherTyping={otherTyping}
          onTyping={sendTyping}
          conversationId={activeId}
        />
      </div>

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onStart={handleStartConversation}
          starting={starting}
        />
      )}
    </Card>
  );
}

// ── Profile edit tab ──────────────────────────────────────────────────────────
function ProfileTab() {
  const navigate = useNavigate();
  const { profile, loading } = useGetProfile();
  const { execute: editProfile, loading: saving, error: saveError, success: saved } = useEditProfile();
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [address,   setAddress]   = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [pwSaving,  setPwSaving]  = useState(false);
  const [pwError,   setPwError]   = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleChangePassword = async () => {
    setPwError(''); setPwSuccess(false);
    if (!currentPassword || !newPassword) return;
    setPwSaving(true);
    try {
      await apiChangePassword({ currentPassword, newPassword });
      setPwSuccess(true);
      setCurrentPassword(''); setNewPassword('');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

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

  useEffect(() => {
    if (!profile) return;
    const parts = profile.name.split(' ');
    setFirstName(parts[0] ?? '');
    setLastName(parts.slice(1).join(' '));
    setPhone(profile.phone ?? '');
    setAddress(profile.address ?? '');
  }, [profile]);

  const handleSave = () => {
    const name = `${firstName} ${lastName}`.trim();
    editProfile({ name, phone, address });
  };

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : '—';

  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 300px' }}>
      {/* Edit form */}
      <Card padding="none">
        <div className="px-5 pt-5 pb-4 border-b border-bone flex items-end justify-between">
          <div>
            <p className="text-[11px] text-slate mb-[3px]">Account / My Profile</p>
            <h1 className="text-[22px] font-bold text-charcoal leading-none">My Profile</h1>
          </div>
        </div>
        <div className="p-5">

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i}>
                <SkeletonBox width={90} height={11} className="mb-[6px]" />
                <SkeletonBox width="100%" height={40} rounded="9px" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={LABEL_CLS}>First Name</label>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} className={INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}>Last Name</label>
                <input value={lastName} onChange={e => setLastName(e.target.value)} className={INPUT_CLS} />
              </div>
            </div>

            <div className="mb-4">
              <label className={LABEL_CLS}>Email Address</label>
              <div className="flex items-center gap-[10px]">
                <input readOnly value={profile?.email ?? ''} className={clsx(INPUT_CLS, 'flex-1 bg-cream text-slate cursor-default')} />
                {profile?.isVerified && (
                  <span className="px-3 py-[5px] rounded-[7px] text-[11px] font-semibold bg-success-bg text-success flex items-center gap-1 shrink-0">
                    <Check size={10} /> Verified
                  </span>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className={LABEL_CLS}>Phone Number</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +92 300 0000000" className={INPUT_CLS} />
            </div>

            <div className="mb-6">
              <label className={LABEL_CLS}>Address</label>
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Your address" className={INPUT_CLS} />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className={clsx(
                  'px-7 py-[10px] bg-brand-orange border-none rounded-[9px] text-[13px] font-semibold text-white flex items-center gap-2',
                  saving ? 'cursor-not-allowed opacity-70' : 'cursor-pointer',
                )}
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <span className="text-[11px] text-slate">Member since {memberSince}</span>
              {saved && <span className="text-[11px] text-success font-medium">Profile updated</span>}
              {saveError && <span className="text-[11px] text-error font-medium">{saveError}</span>}
            </div>
          </>
        )}
        </div>
      </Card>

      {/* Account info sidebar */}
      <div className="flex flex-col gap-4">
        <Card>
          <p className="text-[12px] font-semibold text-charcoal mb-4">Account Summary</p>
          {[
            { label: 'Member Since', value: memberSince },
            { label: 'Account Role', value: profile?.role ?? '—' },
            { label: 'Status',       value: profile?.status ?? '—' },
          ].map(r => (
            <div key={r.label} className="flex justify-between py-[9px] border-b border-[#F5F4EF] last:border-0">
              <span className="text-[12px] text-slate">{r.label}</span>
              <span className="text-[12px] font-semibold text-charcoal capitalize">{r.value}</span>
            </div>
          ))}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={14} className="text-brand-orange" />
            <p className="text-[12px] font-semibold text-charcoal">Security</p>
          </div>
          {profile?.isVerified && (
            <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-success-bg rounded-[8px]">
              <Check size={12} className="text-success shrink-0" />
              <span className="text-[11px] text-success font-medium">Email verified</span>
            </div>
          )}

          <label className={LABEL_CLS}>Current Password</label>
          <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={clsx(INPUT_CLS, 'mb-3')} />
          <label className={LABEL_CLS}>New Password</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={clsx(INPUT_CLS, 'mb-3')} />

          <button
            onClick={handleChangePassword}
            disabled={pwSaving}
            className={clsx(
              'w-full px-4 py-[9px] bg-white border border-bone rounded-[9px] text-[12px] font-semibold text-charcoal flex items-center justify-center gap-2',
              pwSaving ? 'cursor-not-allowed opacity-70' : 'cursor-pointer',
            )}
          >
            {pwSaving && <Loader2 size={12} className="animate-spin" />}
            {pwSaving ? 'Updating…' : 'Change Password'}
          </button>
          {pwSuccess && <p className="text-[11px] text-success font-medium mt-2">Password changed</p>}
          {pwError && <p className="text-[11px] text-error font-medium mt-2">{pwError}</p>}
        </Card>

        <Card>
          <p className="text-[12px] font-semibold text-error mb-2">Danger Zone</p>
          <p className="text-[11px] text-slate leading-relaxed mb-3">
            Deactivating your account signs you out and hides your profile. This can't be undone from the app.
          </p>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full px-4 py-[9px] bg-white border border-error rounded-[9px] text-[12px] font-semibold text-error cursor-pointer flex items-center justify-center gap-2"
          >
            <Trash2 size={13} /> Delete Account
          </button>
        </Card>
      </div>

      {showDeleteConfirm && (
        <Modal title="Delete your account?" onClose={() => setShowDeleteConfirm(false)} footer={
          <>
            <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-white border border-bone rounded-lg text-xs font-medium text-graphite cursor-pointer">
              Cancel
            </button>
            <button onClick={handleDeleteAccount} disabled={deleting} className="px-4 py-2 bg-error border-none rounded-lg text-xs font-semibold text-white cursor-pointer disabled:opacity-50">
              {deleting ? 'Deleting…' : 'Delete Account'}
            </button>
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

// ── Mobile top bar ────────────────────────────────────────────────────────────
function MobileTopBar({ tab, onOpen }: { tab: Tab; onOpen: () => void }) {
  const current = NAV_ITEMS.find(n => n.id === tab);
  return (
    <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-bone shrink-0">
      <div className="flex items-center gap-2">
        {current && <current.Icon size={15} className="text-brand-orange" />}
        <span className="text-[14px] font-semibold text-charcoal">{current?.label ?? 'Account'}</span>
      </div>
      <button
        onClick={onOpen}
        className="w-9 h-9 flex items-center justify-center rounded-[8px] border border-bone bg-cream cursor-pointer"
      >
        <Menu size={16} className="text-charcoal" />
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function UserProfile() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab | null) ?? 'profile');
  const initialConversationId = searchParams.get('conversation');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { profile, loading } = useGetProfile();
  const { wishlistCount } = useWishlistContext();

  const handleSetTab = (t: Tab) => { setTab(t); setSidebarOpen(false); };

  return (
    <div className="bg-cream flex flex-col md:flex-row h-[calc(100vh-108px)] md:h-[calc(100vh-44px)] overflow-hidden">
      <ProfileSidebar
        profile={profile}
        loading={loading}
        tab={tab}
        setTab={handleSetTab}
        wishlistCount={wishlistCount}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        <MobileTopBar tab={tab} onOpen={() => setSidebarOpen(true)} />
        <main className="flex-1 min-h-0 min-w-0 px-4 md:px-7 py-4 md:py-6 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tab === 'profile'   && <ProfileTab />}
          {tab === 'wishlist'  && <WishlistTab />}
          {tab === 'addresses' && <AddressTab />}
          {tab === 'orders'    && <OrdersTab />}
          {tab === 'subscriptions' && <SubscriptionsTab />}
          {tab === 'reviews'   && <ReviewsTab />}
          {tab === 'messages'  && <MessagesTab initialConversationId={initialConversationId} />}
        </main>
      </div>
    </div>
  );
}
