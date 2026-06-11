import { useState, useEffect } from 'react';
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

// ── Styles ────────────────────────────────────────────────────────────────────
const FONT = "'Poppins', sans-serif";
const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #E8E6DC',
  borderRadius: 12, padding: '24px 26px',
  boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 13px', fontSize: 13,
  border: '1px solid #E8E6DC', borderRadius: 9, outline: 'none',
  fontFamily: FONT, color: '#2C2A28', background: '#fff',
  boxSizing: 'border-box' as const,
};
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: '#4A4945',
  marginBottom: 6, display: 'block', fontFamily: FONT,
};

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
    <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 20px', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: '#FAF9F5', border: '1px solid #E8E6DC', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Icon size={28} style={{ color: '#D97757', opacity: 0.6 }} />
      </div>
      <p style={{ fontSize: 16, fontWeight: 700, color: '#141413', marginBottom: 6, fontFamily: FONT }}>{label}</p>
      <p style={{ fontSize: 13, color: '#8C8A82', maxWidth: 320, fontFamily: FONT }}>{desc}</p>
    </div>
  );
}

// ── Wishlist item image ───────────────────────────────────────────────────────
function WishlistImg({ images, name }: { images?: string[]; name: string }) {
  const [err, setErr] = useState(false);
  const src = images?.[0];
  if (!src || err) {
    return (
      <div style={{ width: 80, height: 80, borderRadius: 10, background: '#FBECE4', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ImageOff size={20} style={{ color: '#D97757', opacity: 0.45 }} />
      </div>
    );
  }
  return (
    <img src={src} alt={name} onError={() => setErr(true)}
      style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover', flexShrink: 0, display: 'block' }} />
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
      <div style={card}>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#141413', marginBottom: 18, fontFamily: FONT }}>Saved Items</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '16px 0', borderBottom: '1px solid #F0EEE6' }}>
              <div className="animate-pulse" style={{ width: 80, height: 80, borderRadius: 10, background: '#E8E6DC', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="animate-pulse" style={{ height: 13, borderRadius: 6, background: '#E8E6DC', width: '50%' }} />
                <div className="animate-pulse" style={{ height: 11, borderRadius: 4, background: '#E8E6DC', width: '25%' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <div className="animate-pulse" style={{ height: 30, width: 96, borderRadius: 8, background: '#E8E6DC' }} />
                  <div className="animate-pulse" style={{ height: 30, width: 76, borderRadius: 8, background: '#E8E6DC' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
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
    <div style={card}>
      <p style={{ fontSize: 15, fontWeight: 700, color: '#141413', marginBottom: 4, fontFamily: FONT }}>Saved Items</p>
      <p style={{ fontSize: 12, color: '#8C8A82', marginBottom: 20, fontFamily: FONT }}>{wishlistCount} item{wishlistCount !== 1 ? 's' : ''}</p>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {wishlistItems.map((item, idx) => {
          const p = item.product;
          const variant = item.variants[0];
          const isRemoving = removingId === variant?._id || wishlisting === variant?._id;
          const isAdding = addingId === variant?._id || adding === variant?._id;
          const isLast = idx === wishlistItems.length - 1;

          return (
            <div
              key={p._id}
              style={{
                display: 'flex', gap: 14, padding: '16px 0',
                borderBottom: isLast ? 'none' : '1px solid #F0EEE6',
                opacity: isRemoving ? 0.4 : 1, transition: 'opacity 0.2s',
              }}
            >
              <WishlistImg images={p.images ?? []} name={p.name} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  onClick={() => navigate(`/marketplace/${p._id}`)}
                  style={{ fontWeight: 600, fontSize: 14, color: '#141413', marginBottom: 3, cursor: 'pointer', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {p.name}
                </p>

                {/* Stars */}
                <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} size={10} style={{
                      color: i <= Math.round(p.averageRating) ? '#D97757' : '#E8E6DC',
                      fill: i <= Math.round(p.averageRating) ? '#D97757' : '#E8E6DC',
                    }} />
                  ))}
                </div>

                {variant && (
                  <p style={{ fontSize: 12, color: '#8C8A82', marginBottom: 10, fontFamily: FONT }}>
                    {variant.color && <span>{variant.color}</span>}
                    {variant.color && variant.size && <span> · </span>}
                    {variant.size && <span>{variant.size}</span>}
                    {(variant.color || variant.size) && <span style={{ margin: '0 6px', color: '#E8E6DC' }}>|</span>}
                    <span style={{ fontWeight: 600, color: '#141413' }}>${variant.price.toLocaleString()}</span>
                    {variant.compareAtPrice && variant.compareAtPrice > variant.price && (
                      <span style={{ marginLeft: 6, textDecoration: 'line-through', color: '#8C8A82' }}>
                        ${variant.compareAtPrice.toLocaleString()}
                      </span>
                    )}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {variant && (
                    <button
                      onClick={() => handleAddToCart(p._id, variant._id)}
                      disabled={isAdding}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        background: '#D97757', color: '#fff', border: 'none',
                        cursor: isAdding ? 'not-allowed' : 'pointer', opacity: isAdding ? 0.7 : 1,
                        fontFamily: FONT,
                      }}
                    >
                      {isAdding
                        ? <Loader2 size={11} style={{ animation: 'spin 0.7s linear infinite' }} />
                        : <ShoppingCart size={11} />
                      }
                      {isAdding ? 'Adding…' : 'Add to Cart'}
                    </button>
                  )}
                  <button
                    onClick={() => variant && handleRemove(p._id, variant._id)}
                    disabled={isRemoving}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                      background: '#FFF0F5', color: '#E11D48',
                      border: '1px solid #FECDD3',
                      cursor: isRemoving ? 'not-allowed' : 'pointer',
                      fontFamily: FONT,
                    }}
                  >
                    {isRemoving
                      ? <Loader2 size={11} style={{ animation: 'spin 0.7s linear infinite' }} />
                      : <Heart size={11} style={{ fill: '#E11D48' }} />
                    }
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
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
    <div style={{ gridColumn: half ? 'auto' : 'span 2' }}>
      <label style={labelStyle}>{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
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
    <div style={{
      border: '1.5px solid #D97757', borderRadius: 12,
      padding: '20px 18px', background: '#FFFAF7',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Label select */}
        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>Label</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Home', 'Work', 'Other'].map(l => (
              <button
                key={l}
                type="button"
                onClick={() => set('label', l)}
                style={{
                  padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: `1.5px solid ${form.label === l ? '#D97757' : '#E8E6DC'}`,
                  background: form.label === l ? '#FBECE4' : '#fff',
                  color: form.label === l ? '#B95A3A' : '#8C8A82',
                  cursor: 'pointer', fontFamily: FONT,
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
        <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            id="addr-isDefault"
            checked={form.isDefault ?? false}
            onChange={e => set('isDefault', e.target.checked)}
            style={{ width: 15, height: 15, accentColor: '#D97757', cursor: 'pointer' }}
          />
          <label htmlFor="addr-isDefault" style={{ fontSize: 12, color: '#4A4945', cursor: 'pointer', fontFamily: FONT }}>
            Set as default address
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <button
          onClick={() => onSave(form)}
          disabled={saving}
          style={{
            padding: '9px 24px', borderRadius: 9, fontSize: 13, fontWeight: 600,
            background: '#D97757', color: '#fff', border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT,
          }}
        >
          {saving && <Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} />}
          {saving ? 'Saving…' : 'Save Address'}
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '9px 18px', borderRadius: 9, fontSize: 13,
            border: '1px solid #E8E6DC', background: '#fff',
            color: '#8C8A82', cursor: 'pointer', fontFamily: FONT,
          }}
        >
          Discard
        </button>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
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
      <div style={card}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2].map(i => (
            <div key={i} style={{ border: '1px solid #E8E6DC', borderRadius: 12, padding: 18 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="animate-pulse" style={{ width: 36, height: 36, borderRadius: 10, background: '#E8E6DC', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="animate-pulse" style={{ height: 13, width: '30%', borderRadius: 6, background: '#E8E6DC' }} />
                  <div className="animate-pulse" style={{ height: 11, width: '50%', borderRadius: 4, background: '#E8E6DC' }} />
                  <div className="animate-pulse" style={{ height: 11, width: '70%', borderRadius: 4, background: '#E8E6DC' }} />
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
      <div style={card}>
        {/* Back header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, paddingBottom: 16, borderBottom: '1px solid #F0EEE6' }}>
          <button
            onClick={goList}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8, fontSize: 12,
              border: '1px solid #E8E6DC', background: '#FAF9F5',
              color: '#4A4945', cursor: 'pointer', fontFamily: FONT,
            }}
          >
            <ArrowLeft size={15} /> Back
          </button>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#141413', fontFamily: FONT }}>
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
    <div style={{
      background: '#FFFFFF', border: '1px solid #E8E6DC',
      borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#141413', fontFamily: FONT }}>Saved Addresses</p>
        <button
          onClick={() => setView('add')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: '#D97757', color: '#fff', border: 'none',
            cursor: 'pointer', fontFamily: FONT,
          }}
        >
          <Plus size={18} /> Add Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div style={{ padding: '48px 20px', textAlign: 'center', borderTop: '1px solid #E8E6DC' }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: '#FAF9F5', border: '1px solid #E8E6DC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <MapPin size={22} style={{ color: '#D97757', opacity: 0.6 }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#141413', marginBottom: 4, fontFamily: FONT }}>No addresses saved</p>
          <p style={{ fontSize: 12, color: '#8C8A82', fontFamily: FONT }}>Add a shipping address to speed up checkout.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: FONT }}>
            <thead>
              <tr style={{ borderTop: '1px solid #E8E6DC', borderBottom: '1px solid #E8E6DC' }}>
                {['#', 'Label', 'Recipient', 'Phone', 'Address', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', fontSize: 11, fontWeight: 600,
                    color: '#8C8A82', textTransform: 'uppercase',
                    letterSpacing: '0.05em', padding: '10px 18px',
                    fontFamily: FONT,
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {addresses.map((addr, i) => (
                <tr
                  key={addr._id}
                  style={{ borderBottom: i < addresses.length - 1 ? '1px solid #F5F4EF' : 'none', transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* S.No */}
                  <td style={{ padding: '11px 18px', color: '#8C8A82', fontSize: 12 }}>{i + 1}</td>

                  {/* Label */}
                  <td style={{ padding: '11px 18px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: '#FBECE4', color: '#B95A3A',
                      fontSize: 11, fontWeight: 600,
                      padding: '3px 10px', borderRadius: 5,
                    }}>
                      {addr.label === 'Home' && <Home size={10} />}
                      {addr.label === 'Work' && <Briefcase size={10} />}
                      {addr.label === 'Other' && <StarIcon size={10} />}
                      {addr.label}
                    </span>
                  </td>

                  {/* Recipient */}
                  <td style={{ padding: '11px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: '#EAF3FB', color: '#2156A8',
                        fontSize: 9, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {addr.recipientName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ color: '#4A4945' }}>{addr.recipientName}</span>
                    </div>
                  </td>

                  {/* Phone */}
                  <td style={{ padding: '11px 18px', color: '#4A4945' }}>{addr.phoneNumber}</td>

                  {/* Address */}
                  <td style={{ padding: '11px 18px', color: '#4A4945', maxWidth: 240 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                      {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, {addr.city}, {addr.state}
                    </span>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '11px 18px' }}>
                    <span style={{
                      display: 'inline-block',
                      background: addr.isDefault ? '#E3F4EA' : '#F0EEE6',
                      color: addr.isDefault ? '#1E7A3C' : '#8C8A82',
                      fontSize: 11, fontWeight: 600,
                      padding: '3px 10px', borderRadius: 5,
                    }}>
                      {addr.isDefault ? 'Default' : 'Saved'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '11px 18px' }}>
                    <button
                      onClick={() => { setEditTarget(addr); setView('edit'); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                        border: '1px solid #E8E6DC', background: '#FAF9F5',
                        color: '#4A4945', cursor: 'pointer', fontFamily: FONT,
                      }}
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
    <div style={{ minHeight: '100vh', background: '#FAF9F5', fontFamily: FONT }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 60px' }}>

        {/* ── Hero card ── */}
        <div style={{
          background: '#fff', border: '1px solid #E8E6DC', borderRadius: 14,
          padding: '28px 28px 24px', marginBottom: 20,
          boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>

            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: '#FBECE4', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 700, color: '#B95A3A',
                border: '3px solid #FBECE4',
              }}>
                {loading
                  ? <Skeleton w={80} h={80} radius={40} />
                  : profile?.profileImage
                    ? <img src={profile.profileImage} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials}
              </div>
              <button style={{
                position: 'absolute', bottom: 2, right: 2,
                width: 24, height: 24, borderRadius: '50%',
                background: '#D97757', border: '2px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>
                <Camera size={11} style={{ color: '#fff' }} />
              </button>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 180 }}>
              {loading ? (
                <>
                  <Skeleton w={160} h={18} /><div style={{ height: 8 }} />
                  <Skeleton w={200} h={12} /><div style={{ height: 8 }} />
                  <Skeleton w={60} h={20} radius={10} />
                </>
              ) : (
                <>
                  <h1 style={{ fontSize: 20, fontWeight: 700, color: '#141413', margin: 0 }}>{profile?.name ?? '—'}</h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                    <Mail size={12} style={{ color: '#8C8A82' }} />
                    <span style={{ fontSize: 12, color: '#8C8A82' }}>{profile?.email ?? '—'}</span>
                    {profile?.isVerified && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '1px 8px', borderRadius: 10, background: '#E3F4EA', color: '#1E7A3C', fontSize: 10, fontWeight: 600 }}>
                        <Check size={9} /> Verified
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    <span style={{ padding: '3px 12px', borderRadius: 20, background: '#FBECE4', color: '#B95A3A', fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>
                      {profile?.role ?? ''}
                    </span>
                    <span style={{ padding: '3px 12px', borderRadius: 20, background: profile?.status === 'active' ? '#E3F4EA' : '#F0EEE6', color: profile?.status === 'active' ? '#1E7A3C' : '#8C8A82', fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>
                      {profile?.status ?? ''}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 16px', borderRadius: 9,
                border: '1px solid #E8E6DC', background: '#fff',
                fontSize: 13, color: '#8C8A82', cursor: 'pointer',
                fontFamily: FONT, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#C0392B'; e.currentTarget.style.color = '#C0392B'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E6DC'; e.currentTarget.style.color = '#8C8A82'; }}
            >
              <LogOut size={14} /> Logout
            </button>
          </div>

          {/* Quick info row */}
          {!loading && (
            <div style={{ display: 'flex', gap: 20, marginTop: 20, paddingTop: 18, borderTop: '1px solid #F0EEE6', flexWrap: 'wrap' }}>
              {[
                { Icon: Phone, value: profile?.phone || '—', label: 'Phone' },
                { Icon: MapPin, value: profile?.address || '—', label: 'Address' },
                { Icon: Shield, value: 'Secure Account', label: 'Security' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <item.Icon size={13} style={{ color: '#D97757', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 10, color: '#8C8A82', margin: 0 }}>{item.label}</p>
                    <p style={{ fontSize: 12, fontWeight: 500, color: '#2C2A28', margin: 0, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#fff', borderRadius: 10, padding: 5, border: '1px solid #E8E6DC', width: 'fit-content' }}>
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 18px', borderRadius: 7, border: 'none',
                  background: active ? '#D97757' : 'transparent',
                  color: active ? '#fff' : '#8C8A82',
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  cursor: 'pointer', fontFamily: FONT,
                  transition: 'all 0.15s',
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
          <div style={card}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#141413', marginBottom: 22 }}>Edit Profile</p>

            {loading ? (
              <div>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ marginBottom: 18 }}>
                    <Skeleton w={90} h={11} /><div style={{ height: 6 }} />
                    <Skeleton w="100%" h={40} />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>First Name</label>
                    <input value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Last Name</label>
                    <input value={lastName} onChange={e => setLastName(e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Email Address</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input readOnly value={profile?.email ?? ''} style={{ ...inputStyle, flex: 1, background: '#FAF9F5', color: '#8C8A82' }} />
                    {profile?.isVerified && (
                      <span style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: '#E3F4EA', color: '#1E7A3C', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <Check size={10} /> Verified
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Phone Number</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +92 300 0000000" style={inputStyle} />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Address</label>
                  <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Your address" style={inputStyle} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button style={{ padding: '10px 28px', background: '#D97757', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: FONT }}>
                    Save Changes
                  </button>
                  <p style={{ fontSize: 11, color: '#8C8A82' }}>Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '—'}</p>
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
