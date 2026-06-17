import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  User, ShoppingBag, Heart, MapPin, Phone, Mail,
  Camera, Check, Shield, LogOut, ShoppingCart, ImageOff, Loader2, Star,
  Plus, Pencil, ArrowLeft, Home, Briefcase, Star as StarIcon,
  type LucideIcon,
} from 'lucide-react';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { TokenStorage } from '@/api/commerce/auth';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { useCartContext } from '@/contexts/CartContext';
import {
  apiGetMyAddresses, apiAddAddress, apiUpdateAddress,
  type Address, type AddressPayload,
} from '@/api/commerce/address';

const INPUT_CLS = 'w-full py-[10px] px-[13px] text-[13px] border border-bone rounded-[9px] outline-none text-charcoal bg-white box-border';
const LABEL_CLS = 'text-[12px] font-medium text-[#4A4945] mb-[6px] block';

// ── Tab nav ───────────────────────────────────────────────────────────────────
type Tab = 'profile' | 'orders' | 'wishlist' | 'addresses';
const TABS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: 'profile', label: 'My Profile', Icon: User },
  { id: 'orders', label: 'My Orders', Icon: ShoppingBag },
  { id: 'wishlist', label: 'Wishlist', Icon: Heart },
  { id: 'addresses', label: 'Addresses', Icon: MapPin },
];

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ w, h, radius = 6 }: { w: number | string; h: number; radius?: number }) {
  return (
    <div
      className="animate-pulse"
      style={{ width: w, height: h, borderRadius: radius, background: '#E8E6DC' }}
    />
  );
}

// ── Placeholder tab ───────────────────────────────────────────────────────────
function PlaceholderTab({ Icon, label, desc }: { Icon: LucideIcon; label: string; desc: string }) {
  return (
    <div className="bg-white border border-[#E8E6DC] rounded-[12px] px-[26px] py-[24px] shadow-[0_1px_6px_rgba(0,0,0,0.05)] flex flex-col items-center px-5 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-cream border border-[#E8E6DC] flex items-center justify-center mb-4">
        <Icon size={28} className="text-brand-orange opacity-60" />
      </div>
      <p className="text-[16px] font-bold text-[#141413] mb-[6px]">{label}</p>
      <p className="text-[13px] text-[#8C8A82] max-w-[320px]">{desc}</p>
    </div>
  );
}

// ── Wishlist item image ───────────────────────────────────────────────────────
function WishlistImg({ images, name }: { images?: string[]; name: string }) {
  const [err, setErr] = useState(false);
  const src = images?.[0];
  if (!src || err) {
    return (
      <div className="w-20 h-20 rounded-[10px] bg-brand-pale-orange flex-shrink-0 flex items-center justify-center">
        <ImageOff size={20} className="text-brand-orange opacity-[0.45]" />
      </div>
    );
  }
  return (
    <img src={src} alt={name} onError={() => setErr(true)}
      className="w-20 h-20 rounded-[10px] object-cover flex-shrink-0 block" />
  );
}

// ── Wishlist tab content ──────────────────────────────────────────────────────
function WishlistTab() {
  const navigate = useNavigate();
  const { wishlistItems, wishlistCount, loading: wLoading, wishlisting, removeFromWishlist } = useWishlistContext();
  const { addToCart, adding } = useCartContext();

  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  const handleRemove = async (productId: string, variantId: string) => {
    setRemovingId(variantId);
    try { await removeFromWishlist(productId, variantId); }
    finally { setRemovingId(null); }
  };

  const handleAddToCart = async (productId: string, variantId: string) => {
    setAddingId(variantId);
    try { await addToCart(productId, variantId); }
    finally { setAddingId(null); }
  };

  if (wLoading) {
    return (
      <div className="bg-white border border-[#E8E6DC] rounded-[12px] px-[26px] py-6 shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
        <p className="text-[15px] font-bold text-[#141413] mb-[18px]">Saved Items</p>
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-[14px] py-4 border-b border-[#F0EEE6]">
              <div className="animate-pulse w-20 h-20 rounded-[10px] bg-bone flex-shrink-0" />
              <div className="flex-1 flex flex-col gap-[10px]">
                <div className="animate-pulse h-[13px] rounded-[6px] bg-bone w-1/2" />
                <div className="animate-pulse h-[11px] rounded bg-bone w-1/4" />
                <div className="flex gap-2">
                  <div className="animate-pulse h-[30px] w-24 rounded-lg bg-bone" />
                  <div className="animate-pulse h-[30px] w-[76px] rounded-lg bg-bone" />
                </div>
              </div>
            </div>
          ))}
        </div>
              </div>
    );
  }

  if (wishlistCount === 0) {
    return (
      <PlaceholderTab
        Icon={Heart}
        label="Wishlist is empty"
        desc="Save products you love to your wishlist and find them here anytime."
      />
    );
  }

  return (
    <div className="bg-white border border-[#E8E6DC] rounded-[12px] px-[26px] py-6 shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
      <p className="text-[15px] font-bold text-[#141413] mb-1">Saved Items</p>
      <p className="text-[12px] text-[#8C8A82] mb-5">{wishlistCount} item{wishlistCount !== 1 ? 's' : ''}</p>

      <div className="flex flex-col">
        {wishlistItems.map((item, idx) => {
          const p = item.product;
          const variant = item.variants[0];
          const isRemoving = removingId === variant?._id || wishlisting === variant?._id;
          const isAdding = addingId === variant?._id || adding === variant?._id;
          const isLast = idx === wishlistItems.length - 1;

          return (
            <div
              key={p._id}
              className={clsx('flex gap-[14px] py-4 transition-opacity duration-200', !isLast && 'border-b border-[#F0EEE6]', isRemoving && 'opacity-40')}
            >
              <WishlistImg images={p.images ?? []} name={p.name} />

              <div className="flex-1 min-w-0">
                <p
                  onClick={() => navigate(`/marketplace/${p._id}`)}
                  className="font-semibold text-[14px] text-[#141413] mb-[3px] cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap"
                >
                  {p.name}
                </p>

                {/* Stars */}
                <div className="flex gap-[2px] mb-[6px]">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} size={10} style={{
                      color: i <= Math.round(p.averageRating) ? '#D97757' : '#E8E6DC',
                      fill: i <= Math.round(p.averageRating) ? '#D97757' : '#E8E6DC',
                    }} />
                  ))}
                </div>

                {variant && (
                  <p className="text-[12px] text-[#8C8A82] mb-[10px]">
                    {variant.color && <span>{variant.color}</span>}
                    {variant.color && variant.size && <span> · </span>}
                    {variant.size && <span>{variant.size}</span>}
                    {(variant.color || variant.size) && <span className="mx-[6px] text-bone">|</span>}
                    <span className="font-semibold text-[#141413]">${variant.price.toLocaleString()}</span>
                    {variant.compareAtPrice && variant.compareAtPrice > variant.price && (
                      <span className="ml-[6px] line-through text-[#8C8A82]">
                        ${variant.compareAtPrice.toLocaleString()}
                      </span>
                    )}
                  </p>
                )}

                <div className="flex gap-2 flex-wrap">
                  {variant && (
                    <button
                      onClick={() => handleAddToCart(p._id, variant._id)}
                      disabled={isAdding}
                      className={clsx('flex items-center gap-[5px] px-[14px] py-[6px] rounded-lg text-[12px] font-semibold bg-brand-orange text-white border-none', isAdding ? 'cursor-not-allowed opacity-70' : 'cursor-pointer')}
                    >
                      {isAdding
                        ? <Loader2 size={11} className="animate-spin" />
                        : <ShoppingCart size={11} />
                      }
                      {isAdding ? 'Adding…' : 'Add to Cart'}
                    </button>
                  )}
                  <button
                    onClick={() => variant && handleRemove(p._id, variant._id)}
                    disabled={isRemoving}
                    className={clsx('flex items-center gap-[5px] px-3 py-[6px] rounded-lg text-[12px] font-medium bg-[#FFF0F5] text-[#E11D48] border border-[#FECDD3]', isRemoving ? 'cursor-not-allowed' : 'cursor-pointer')}
                  >
                    {isRemoving
                      ? <Loader2 size={11} className="animate-spin" />
                      : <Heart size={11} className="fill-[#E11D48]" />
                    }
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
          </div>
  );
}

// ── Address helpers ───────────────────────────────────────────────────────────
const EMPTY_FORM: AddressPayload = {
  label: 'Home', recipientName: '', phoneNumber: '',
  addressLine1: '', addressLine2: '', state: '', city: '', zipCode: '',
  isDefault: false,
};

// ── Defined at module scope so the reference stays stable across re-renders ───
function AddrField({
  label, value, onChange, placeholder, half,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  half?: boolean;
}) {
  return (
    <div className={half ? '' : 'col-span-2'}>
      <label className={LABEL_CLS}>{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={INPUT_CLS}
      />
    </div>
  );
}

function AddressForm({
  initial, onSave, onCancel, saving,
}: {
  initial: AddressPayload;
  onSave: (data: AddressPayload) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<AddressPayload>(initial);
  const set = (k: keyof AddressPayload, v: string | boolean) =>
    setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="border-[1.5px] border-brand-orange rounded-[12px] px-[18px] py-5 bg-[#FFFAF7]">
      <div className="grid grid-cols-2 gap-3">
        {/* Label select */}
        <div className="col-span-2">
          <label className={LABEL_CLS}>Label</label>
          <div className="flex gap-2">
            {['Home', 'Work', 'Other'].map(l => (
              <button
                key={l}
                type="button"
                onClick={() => set('label', l)}
                className="px-4 py-[6px] rounded-lg text-[12px] font-semibold cursor-pointer"
                style={{
                  border: `1.5px solid ${form.label === l ? '#D97757' : '#E8E6DC'}`,
                  background: form.label === l ? '#FBECE4' : '#fff',
                  color: form.label === l ? '#B95A3A' : '#8C8A82',
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <AddrField label="Recipient Name" value={form.recipientName} onChange={v => set('recipientName', v)} placeholder="Full name" half />
        <AddrField label="Phone Number" value={form.phoneNumber} onChange={v => set('phoneNumber', v)} placeholder="e.g. 03001234567" half />
        <AddrField label="Address Line 1" value={form.addressLine1} onChange={v => set('addressLine1', v)} placeholder="House no, Street" />
        <AddrField label="Address Line 2 (Optional)" value={form.addressLine2 ?? ''} onChange={v => set('addressLine2', v)} placeholder="Landmark, Area" />
        <AddrField label="City" value={form.city} onChange={v => set('city', v)} placeholder="e.g. Karachi" half />
        <AddrField label="State" value={form.state} onChange={v => set('state', v)} placeholder="e.g. Sindh" half />
        <AddrField label="Zip Code" value={form.zipCode} onChange={v => set('zipCode', v)} placeholder="e.g. 75300" half />

        {/* Default checkbox */}
        <div className="col-span-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="addr-isDefault"
            checked={form.isDefault ?? false}
            onChange={e => set('isDefault', e.target.checked)}
            className="w-[15px] h-[15px] cursor-pointer accent-brand-orange"
          />
          <label htmlFor="addr-isDefault" className="text-[12px] text-[#4A4945] cursor-pointer">
            Set as default address
          </label>
        </div>
      </div>

      <div className="flex gap-[10px] mt-[18px]">
        <button
          onClick={() => onSave(form)}
          disabled={saving}
          className={clsx('px-6 py-[9px] rounded-[9px] text-[13px] font-semibold bg-brand-orange text-white border-none flex items-center gap-[6px]', saving ? 'cursor-not-allowed opacity-70' : 'cursor-pointer')}
        >
          {saving && <Loader2 size={13} className="animate-spin" />}
          {saving ? 'Saving…' : 'Save Address'}
        </button>
        <button
          onClick={onCancel}
          className="px-[18px] py-[9px] rounded-[9px] text-[13px] border border-[#E8E6DC] bg-white text-[#8C8A82] cursor-pointer"
        >
          Discard
        </button>
      </div>
          </div>
  );
}

// ── Address tab ───────────────────────────────────────────────────────────────
type AddrView = 'list' | 'add' | 'edit';

function AddressTab() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<AddrView>('list');
  const [editTarget, setEditTarget] = useState<Address | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGetMyAddresses()
      .then(res => { if (!cancelled) setAddresses(res.data ?? []); })
      .catch(() => { })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const goList = () => { setView('list'); setEditTarget(null); };

  const handleSave = async (data: AddressPayload) => {
    setSaving(true);
    try {
      if (view === 'add') {
        const res = await apiAddAddress(data);
        setAddresses(prev =>
          data.isDefault
            ? [...prev.map(a => ({ ...a, isDefault: false })), res.data]
            : [...prev, res.data],
        );
      } else if (view === 'edit' && editTarget) {
        const res = await apiUpdateAddress(editTarget._id, data);
        setAddresses(prev =>
          data.isDefault
            ? prev.map(a => a._id === editTarget._id ? res.data : { ...a, isDefault: false })
            : prev.map(a => a._id === editTarget._id ? res.data : a),
        );
      }
      goList();
    } catch {
      // keep form open
    } finally {
      setSaving(false);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-white border border-[#E8E6DC] rounded-[12px] px-[26px] py-6 shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-3">
          {[1, 2].map(i => (
            <div key={i} className="border border-[#E8E6DC] rounded-[12px] p-[18px]">
              <div className="flex gap-3">
                <div className="animate-pulse w-9 h-9 rounded-[10px] bg-bone flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="animate-pulse h-[13px] w-[30%] rounded-[6px] bg-bone" />
                  <div className="animate-pulse h-[11px] w-1/2 rounded bg-bone" />
                  <div className="animate-pulse h-[11px] w-[70%] rounded bg-bone" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Form view (Add or Edit) ───────────────────────────────────────────────
  if (view === 'add' || view === 'edit') {
    return (
      <div className="bg-white border border-[#E8E6DC] rounded-[12px] px-[26px] py-6 shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
        {/* Back header */}
        <div className="flex items-center gap-[10px] mb-[22px] pb-4 border-b border-[#F0EEE6]">
          <button
            onClick={goList}
            className="flex items-center gap-[6px] px-3 py-[6px] rounded-lg text-[12px] border border-[#E8E6DC] bg-cream text-[#4A4945] cursor-pointer"
          >
            <ArrowLeft size={15} /> Back
          </button>
          <p className="text-[15px] font-bold text-[#141413]">
            {view === 'edit' ? 'Edit Address' : 'Add New Address'}
          </p>
        </div>

        <AddressForm
          initial={editTarget
            ? { label: editTarget.label, recipientName: editTarget.recipientName, phoneNumber: editTarget.phoneNumber, addressLine1: editTarget.addressLine1, addressLine2: editTarget.addressLine2, state: editTarget.state, city: editTarget.city, zipCode: editTarget.zipCode, isDefault: editTarget.isDefault }
            : EMPTY_FORM
          }
          onSave={handleSave}
          onCancel={goList}
          saving={saving}
        />
      </div>
    );
  }

  // ── List view (table style — matches seller dashboard Recent Orders) ─────────
  return (
    <div className="bg-white border border-[#E8E6DC] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="px-5 pt-4 pb-[10px] flex items-center justify-between">
        <p className="text-[14px] font-bold text-[#141413]">Saved Addresses</p>
        <button
          onClick={() => setView('add')}
          className="flex items-center gap-[6px] px-[14px] py-[7px] rounded-lg text-[13px] font-semibold bg-brand-orange text-white border-none cursor-pointer"
        >
          <Plus size={18} /> Add Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="px-5 py-12 text-center border-t border-[#E8E6DC]">
          <div className="w-[52px] h-[52px] rounded-[12px] bg-cream border border-[#E8E6DC] flex items-center justify-center mx-auto mb-3">
            <MapPin size={22} className="text-brand-orange opacity-60" />
          </div>
          <p className="text-[14px] font-bold text-[#141413] mb-1">No addresses saved</p>
          <p className="text-[12px] text-[#8C8A82]">Add a shipping address to speed up checkout.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-t border-b border-[#E8E6DC]">
                {['#', 'Label', 'Recipient', 'Phone', 'Address', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-[#8C8A82] uppercase tracking-[0.05em] px-[18px] py-[10px]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {addresses.map((addr, i) => (
                <tr
                  key={addr._id}
                  className="transition-colors duration-[120ms]"
                  style={{ borderBottom: i < addresses.length - 1 ? '1px solid #F5F4EF' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* S.No */}
                  <td className="px-[18px] py-[11px] text-[#8C8A82] text-[12px]">{i + 1}</td>

                  {/* Label */}
                  <td className="px-[18px] py-[11px]">
                    <span className="inline-flex items-center gap-[5px] bg-brand-pale-orange text-[#B95A3A] text-[11px] font-semibold px-[10px] py-[3px] rounded-[5px]">
                      {addr.label === 'Home' && <Home size={10} />}
                      {addr.label === 'Work' && <Briefcase size={10} />}
                      {addr.label === 'Other' && <StarIcon size={10} />}
                      {addr.label}
                    </span>
                  </td>

                  {/* Recipient */}
                  <td className="px-[18px] py-[11px]">
                    <div className="flex items-center gap-2">
                      <div className="w-[26px] h-[26px] rounded-full bg-[#EAF3FB] text-[#2156A8] text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                        {addr.recipientName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[#4A4945]">{addr.recipientName}</span>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-[18px] py-[11px] text-[#4A4945]">{addr.phoneNumber}</td>

                  {/* Address */}
                  <td className="px-[18px] py-[11px] text-[#4A4945] max-w-[240px]">
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap block">
                      {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, {addr.city}, {addr.state}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-[18px] py-[11px]">
                    <span
                      className="inline-block text-[11px] font-semibold px-[10px] py-[3px] rounded-[5px]"
                      style={{
                        background: addr.isDefault ? '#E3F4EA' : '#F0EEE6',
                        color: addr.isDefault ? '#1E7A3C' : '#8C8A82',
                      }}
                    >
                      {addr.isDefault ? 'Default' : 'Saved'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-[18px] py-[11px]">
                    <button
                      onClick={() => { setEditTarget(addr); setView('edit'); }}
                      className="flex items-center gap-1 px-3 py-1 rounded-[6px] text-[12px] font-medium border border-[#E8E6DC] bg-cream text-[#4A4945] cursor-pointer"
                    >
                      <Pencil size={12} /> Edit

                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function UserProfile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab | null) ?? 'profile';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const { profile, loading } = useGetProfile();

  useEffect(() => {
    if (!profile) return;
    const parts = profile.name.split(' ');
    setFirstName(parts[0] ?? '');
    setLastName(parts.slice(1).join(' '));
    setPhone(profile.phone ?? '');
    setAddress(profile.address ?? '');
  }, [profile]);

  const handleLogout = () => {
    TokenStorage.clear();
    navigate('/');
    window.location.reload();
  };

  const initials = profile?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '..';

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-[900px] mx-auto px-5 pt-8 pb-[60px]">

        {/* ── Hero card ── */}
        <div className="bg-white border border-[#E8E6DC] rounded-[14px] px-7 pt-7 pb-6 mb-5 shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-5 flex-wrap">

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-brand-pale-orange overflow-hidden flex items-center justify-center text-[28px] font-bold text-[#B95A3A] border-[3px] border-brand-pale-orange">
                {loading
                  ? <Skeleton w={80} h={80} radius={40} />
                  : profile?.profileImage
                    ? <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
                    : initials}
              </div>
              <button className="absolute bottom-[2px] right-[2px] w-6 h-6 rounded-full bg-brand-orange border-2 border-white flex items-center justify-center cursor-pointer">
                <Camera size={11} className="text-white" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-[180px]">
              {loading ? (
                <>
                  <Skeleton w={160} h={18} /><div className="h-2" />
                  <Skeleton w={200} h={12} /><div className="h-2" />
                  <Skeleton w={60} h={20} radius={10} />
                </>
              ) : (
                <>
                  <h1 className="text-[20px] font-bold text-[#141413] m-0">{profile?.name ?? '—'}</h1>
                  <div className="flex items-center gap-[6px] mt-[5px] flex-wrap">
                    <Mail size={12} className="text-[#8C8A82]" />
                    <span className="text-[12px] text-[#8C8A82]">{profile?.email ?? '—'}</span>
                    {profile?.isVerified && (
                      <span className="flex items-center gap-[3px] px-2 py-[1px] rounded-[10px] bg-[#E3F4EA] text-[#1E7A3C] text-[10px] font-semibold">
                        <Check size={9} /> Verified
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-[10px] flex-wrap">
                    <span className="px-3 py-[3px] rounded-[20px] bg-brand-pale-orange text-[#B95A3A] text-[11px] font-semibold capitalize">
                      {profile?.role ?? ''}
                    </span>
                    <span
                      className="px-3 py-[3px] rounded-[20px] text-[11px] font-semibold capitalize"
                      style={{
                        background: profile?.status === 'active' ? '#E3F4EA' : '#F0EEE6',
                        color: profile?.status === 'active' ? '#1E7A3C' : '#8C8A82',
                      }}
                    >
                      {profile?.status ?? ''}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-[7px] px-4 py-2 rounded-[9px] border border-bone bg-white text-[13px] text-slate cursor-pointer transition-all duration-150 hover:border-[#C0392B] hover:text-[#C0392B]"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>

          {/* Quick info row */}
          {!loading && (
            <div className="flex gap-5 mt-5 pt-[18px] border-t border-[#F0EEE6] flex-wrap">
              {[
                { Icon: Phone, value: profile?.phone || '—', label: 'Phone' },
                { Icon: MapPin, value: profile?.address || '—', label: 'Address' },
                { Icon: Shield, value: 'Secure Account', label: 'Security' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-[7px]">
                  <item.Icon size={13} className="text-brand-orange flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-[#8C8A82] m-0">{item.label}</p>
                    <p className="text-[12px] font-medium text-charcoal m-0 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-5 bg-white rounded-[10px] p-[5px] border border-[#E8E6DC] w-fit">
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-[7px] px-[18px] py-2 rounded-[7px] border-none text-[13px] cursor-pointer transition-all duration-150"
                style={{
                  background: active ? '#D97757' : 'transparent',
                  color: active ? '#fff' : '#8C8A82',
                  fontWeight: active ? 600 : 400,
                }}
              >
                <t.Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Tab content ── */}

        {/* Profile form */}
        {tab === 'profile' && (
          <div className="bg-white border border-[#E8E6DC] rounded-[12px] px-[26px] py-6 shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
            <p className="text-[15px] font-bold text-[#141413] mb-[22px]">Edit Profile</p>

            {loading ? (
              <div>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="mb-[18px]">
                    <Skeleton w={90} h={11} /><div className="h-[6px]" />
                    <Skeleton w="100%" h={40} />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
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
                    <input readOnly value={profile?.email ?? ''} className={INPUT_CLS + ' flex-1 !bg-cream !text-slate'} />
                    {profile?.isVerified && (
                      <span className="px-3 py-[5px] rounded-[7px] text-[11px] font-semibold bg-[#E3F4EA] text-[#1E7A3C] flex items-center gap-1 flex-shrink-0">
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
                  <button className="px-7 py-[10px] bg-brand-orange border-none rounded-[9px] text-[13px] font-semibold text-white cursor-pointer">
                    Save Changes
                  </button>
                  <p className="text-[11px] text-[#8C8A82]">Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '—'}</p>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'orders' && (
          <PlaceholderTab
            Icon={ShoppingBag}
            label="No orders yet"
            desc="Your order history will appear here once you make your first purchase on the marketplace."
          />
        )}

        {tab === 'wishlist' && <WishlistTab />}
        {tab === 'addresses' && <AddressTab />}

      </div>
    </div>
  );
}
