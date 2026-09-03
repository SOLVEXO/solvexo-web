import { useState, useEffect } from 'react';
import { LogOut, Check, Package, ChevronDown, Loader2, Download, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { useEditProfile } from '@/hooks/auth/useEditProfile';
import { useLogout } from '@/hooks/auth/useLogout';
import { useChangePassword } from '@/hooks/auth/useChangePassword';
import { apiGetMyOrders, apiGetDownloadLink, type OrderSummary, type OrderStatus } from '@/api/services/orders';
import { currencySymbol, fmt2 } from '@/utils/currency';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { NovaButton } from '../components/NovaButton';
import { novaInput, novaLabel } from '../components/novaFormStyles';
import { novaTheme as t } from '../theme.config';

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending', processing: 'Processing', shipped: 'Shipped',
  delivered: 'Delivered', completed: 'Completed', cancelled: 'Cancelled',
};
const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: '#B36200', processing: '#3B4FE0', shipped: '#1A65A8',
  delivered: '#1E9E6D', completed: '#1E9E6D', cancelled: '#E4483A',
};

function DownloadLink({ orderId, productId }: { orderId: string; productId: string }) {
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    setBusy(true);
    try {
      const res = await apiGetDownloadLink(orderId, productId, 0);
      const base = import.meta.env.VITE_API_URL as string;
      window.open(`${base}${res.data.endpoint}?token=${res.data.token}`, '_blank');
    } finally { setBusy(false); }
  };
  return (
    <button type="button" onClick={handle} disabled={busy} className="flex items-center gap-1 cursor-pointer bg-transparent border-0" style={{ fontFamily: t.fonts.body, fontSize: '11.5px', fontWeight: 700, color: t.colors.accent }}>
      {busy ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />} Download
    </button>
  );
}

/** Real "Change Password" for an already-authenticated buyer — the
 *  companion to the Forgot Password flow (which is only for a buyer who's
 *  locked out and can't log in at all). Uses the existing, already-real
 *  `PUT api/users/change-password` endpoint, same as `AtelierAccountPage`'s
 *  own `PasswordSection`. */
function PasswordSection() {
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async () => {
    setFormError('');
    if (newPassword.length < 8) { setFormError('New password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setFormError('New passwords do not match.'); return; }
    const ok = await changePassword.execute({ currentPassword, newPassword });
    if (ok) { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }
  };

  return (
    <section style={{ border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md, padding: '24px', marginBottom: '36px' }}>
      <p style={{ fontFamily: t.fonts.display, fontSize: '16px', fontWeight: 700, color: t.colors.ink, marginBottom: '18px' }}>Password</p>
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="nova-account-currentpw" style={novaLabel}>Current Password</label>
          <input id="nova-account-currentpw" type={show ? 'text' : 'password'} autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={novaInput} />
        </div>
        <div>
          <label htmlFor="nova-account-newpw" style={novaLabel}>New Password</label>
          <div className="relative">
            <input id="nova-account-newpw" type={show ? 'text' : 'password'} autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ ...novaInput, paddingRight: '40px' }} />
            <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide passwords' : 'Show passwords'}
              className="absolute cursor-pointer bg-transparent border-0" style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', color: t.colors.inkMuted }}>
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="nova-account-confirmpw" style={novaLabel}>Confirm New Password</label>
          <input id="nova-account-confirmpw" type={show ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={novaInput} />
        </div>
        {(formError || changePassword.error) && (
          <p className="flex items-center gap-1.5" style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.danger }}>
            <AlertCircle size={13} /> {formError || changePassword.error}
          </p>
        )}
        <div className="flex items-center gap-3">
          <NovaButton onClick={handleSubmit} loading={changePassword.loading} disabled={!currentPassword || !newPassword || !confirmPassword}>
            Update Password
          </NovaButton>
          {changePassword.success && (
            <span className="flex items-center gap-1" style={{ fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 700, color: t.colors.success }}>
              <Check size={13} /> Updated
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function OrderRow({ order }: { order: OrderSummary }) {
  const [open, setOpen] = useState(false);
  const symbol = currencySymbol(order.currency);
  return (
    <div style={{ border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md, overflow: 'hidden' }}>
      <button
        type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 cursor-pointer bg-transparent border-0 text-left"
        style={{ padding: '14px 18px' }}
      >
        <div>
          <p style={{ fontFamily: 'monospace', fontSize: '12.5px', fontWeight: 700, color: t.colors.ink }}>{order.orderNumber}</p>
          <p style={{ fontFamily: t.fonts.body, fontSize: '11.5px', color: t.colors.inkMuted, marginTop: '2px' }}>{new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-4">
          <span style={{ fontFamily: t.fonts.body, fontSize: '11px', fontWeight: 700, color: STATUS_COLOR[order.orderStatus] }}>{STATUS_LABEL[order.orderStatus]}</span>
          <span style={{ fontFamily: t.fonts.body, fontSize: '13px', fontWeight: 700, color: t.colors.ink }}>{symbol}{fmt2(order.totalAmount)}</span>
          <ChevronDown size={15} style={{ color: t.colors.inkMuted, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
        </div>
      </button>
      {open && (
        <div style={{ borderTop: `1.5px solid ${t.colors.border}`, padding: '14px 18px' }}>
          {order.stores.flatMap(s => s.items).map(item => (
            <div key={item.itemId} className="flex items-center justify-between gap-3" style={{ padding: '6px 0' }}>
              <div className="flex items-center gap-2 min-w-0">
                <Package size={13} style={{ color: t.colors.inkMuted, flexShrink: 0 }} />
                <span className="truncate" style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.ink }}>{item.name} ×{item.quantity}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {item.type === 'digital' && <DownloadLink orderId={order.orderId} productId={item.productId} />}
                <span style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.inkMuted }}>{symbol}{fmt2(item.totalPrice)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Theme 02's own Account page — profile edit + real order history, the
 *  same storefront-local scope as `AtelierAccountPage` (no wishlist/
 *  subscriptions/messages tabs yet — a later phase, matching that page's
 *  own disclosed boundary). */
export function NovaAccountPage() {
  useStorefrontSeo({ title: 'My Account', noindex: true });
  const { store } = useStorefront();
  const logout = useLogout();
  const { profile, loading: profileLoading } = useGetProfile();
  const { execute: editProfile, loading: saving, success: saved } = useEditProfile();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [ordersError, setOrdersError] = useState('');

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? '');
    setPhone(profile.phone ?? '');
    setAddress(profile.address ?? '');
  }, [profile]);

  useEffect(() => {
    apiGetMyOrders({ page: 1, limit: 20 })
      .then(res => setOrders(res.data.orders))
      .catch(() => setOrdersError('Could not load your orders right now.'));
  }, []);

  return (
    <main className="mx-auto" style={{ maxWidth: '720px', padding: `48px ${t.layout.containerPadX}` }}>
      <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: t.fonts.display, fontSize: '24px', fontWeight: 700, color: t.colors.ink }}>My Account</h1>
          <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted, marginTop: '4px' }}>Your account at {store.name}.</p>
        </div>
        <button
          type="button" onClick={() => logout('/')}
          className="flex items-center gap-1.5 cursor-pointer bg-transparent"
          style={{ fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 700, color: t.colors.ink, border: `1.5px solid ${t.colors.border}`, borderRadius: '9999px', padding: '8px 14px' }}
        >
          <LogOut size={13} /> Log out
        </button>
      </div>

      <section style={{ border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md, padding: '24px', marginBottom: '36px' }}>
        <p style={{ fontFamily: t.fonts.display, fontSize: '16px', fontWeight: 700, color: t.colors.ink, marginBottom: '18px' }}>Profile</p>
        {profileLoading ? (
          <div className="animate-pulse" style={{ height: '160px', background: t.colors.bgAlt, borderRadius: t.radius.sm }} />
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="nova-account-name" style={novaLabel}>Full Name</label>
              <input id="nova-account-name" value={name} onChange={e => setName(e.target.value)} style={novaInput} />
            </div>
            <div>
              <label htmlFor="nova-account-email" style={novaLabel}>Email</label>
              <input id="nova-account-email" value={profile?.email ?? ''} readOnly disabled style={{ ...novaInput, opacity: 0.6, cursor: 'not-allowed' }} />
            </div>
            <div>
              <label htmlFor="nova-account-phone" style={novaLabel}>Phone Number</label>
              <input id="nova-account-phone" value={phone} onChange={e => setPhone(e.target.value)} style={novaInput} />
            </div>
            <div>
              <label htmlFor="nova-account-address" style={novaLabel}>Address</label>
              <input id="nova-account-address" value={address} onChange={e => setAddress(e.target.value)} style={novaInput} />
            </div>
            <div className="flex items-center gap-3">
              <NovaButton onClick={() => editProfile({ name, phone, address })} loading={saving}>Save Changes</NovaButton>
              {saved && (
                <span className="flex items-center gap-1" style={{ fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 700, color: t.colors.success }}>
                  <Check size={13} /> Saved
                </span>
              )}
            </div>
          </div>
        )}
      </section>

      <PasswordSection />

      <section>
        <p style={{ fontFamily: t.fonts.display, fontSize: '16px', fontWeight: 700, color: t.colors.ink, marginBottom: '18px' }}>Order History</p>
        {ordersError && <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.danger }}>{ordersError}</p>}
        {orders === null && !ordersError && (
          <div className="flex flex-col gap-2">
            {[1, 2].map(i => <div key={i} className="animate-pulse" style={{ height: '52px', background: t.colors.bgAlt, borderRadius: t.radius.md }} />)}
          </div>
        )}
        {orders !== null && orders.length === 0 && (
          <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.inkMuted }}>You haven't placed any orders yet.</p>
        )}
        {orders !== null && orders.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {orders.map(o => <OrderRow key={o.orderId} order={o} />)}
          </div>
        )}
      </section>
    </main>
  );
}
