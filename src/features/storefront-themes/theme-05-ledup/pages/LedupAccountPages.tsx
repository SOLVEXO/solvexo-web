import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Check, MapPin, Package, Plus } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { useEditProfile } from '@/hooks/auth/useEditProfile';
import { useChangePassword } from '@/hooks/auth/useChangePassword';
import { useRequireRealAccount } from '@/hooks/auth/useRequireRealAccount';
import type { ProfileData } from '@/api/services/auth';
import { apiDeleteAddress, apiSetDefaultAddress, apiAddAddress, apiUpdateAddress, type Address, type AddressPayload } from '@/api/services/address';
import { apiGetMyOrders, type OrderSummary } from '@/api/services/orders';
import { addressLines, addressToForm, EMPTY_ADDRESS_FORM, validateAddressForm } from '../../accountUi';
import { useMyAddresses } from '../../useAccountLists';
import { deriveFulfillmentBadge, derivePaymentBadge, formatOrderDate } from '../../orderUi';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { useLoad } from '../../core/pageHooks';
import { useConfirmAction } from '../../core/account/useConfirmAction';
import { localizedCountryOptions } from '../../core/countryOptions';
import { nativeMoney } from '../../core/money/nativeMoney';
import { EmptyState, ErrorState, Field, Notice, PillButton, SelectInput, SkeletonBlock, TextInput } from '../ui/ledupForm';
import { LedupPasswordInput } from '../ui/ledupAuth';
import { LedupDialog, LedupConfirmDialog } from '../ui/ledupDialog';
import { RequireAccount, LedupAccountLayout, LedupOrderChip, LedupPager, LedupSection } from '../ui/ledupAccount';
import { WithPageSections } from '../ui/ledupPageSections';
import { ledupTheme as t } from '../theme.config';

const linkBtn = 'cursor-pointer border-0 bg-transparent p-0 text-sm font-medium underline disabled:opacity-40';

function ProfileForm({ profile, onDone }: { profile: ProfileData; onDone: () => void }) {
  const { execute, loading, error, success } = useEditProfile();
  const [name, setName] = useState(profile.name ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [address, setAddress] = useState(profile.address ?? '');
  return (
    <form onSubmit={e => { e.preventDefault(); void execute({ name: name.trim(), phone: phone.trim(), address: address.trim() }); }} className="grid gap-4 sm:grid-cols-2">
      <Field label={ts('checkout.fullName', 'Full name')}>{p => <TextInput {...p} autoComplete="name" value={name} onChange={e => setName(e.target.value)} />}</Field>
      <Field label={ts('auth.email', 'Email')}>{p => <TextInput {...p} type="email" dir="ltr" value={profile.email ?? ''} readOnly disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />}</Field>
      <Field label={ts('checkout.phoneNumber', 'Phone number')}>{p => <TextInput {...p} type="tel" dir="ltr" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} />}</Field>
      <Field label={ts('auth.address', 'Address')}>{p => <TextInput {...p} autoComplete="street-address" value={address} onChange={e => setAddress(e.target.value)} />}</Field>
      {error && <div className="sm:col-span-2"><Notice tone="error">{error}</Notice></div>}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <PillButton type="submit" loading={loading}>{ts('pg.save_changes', 'Save changes')}</PillButton>
        <PillButton variant="outline" onClick={onDone}>{ts('pg.close', 'Close')}</PillButton>
        <span aria-live="polite" className="flex items-center gap-1 text-sm font-medium" style={{ color: t.colors.success }}>{success && <><Check size={15} aria-hidden /> {ts('account.saved', 'Saved')}</>}</span>
      </div>
    </form>
  );
}

function PasswordForm({ onDone }: { onDone: () => void }) {
  const change = useChangePassword();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [formError, setFormError] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (next.length < 8) { setFormError(ts('account.err.pwLen', 'New password must be at least 8 characters.')); return; }
    if (next !== confirm) { setFormError(ts('account.err.pwMatch', 'New passwords do not match.')); return; }
    if (await change.execute({ currentPassword: current, newPassword: next })) { setCurrent(''); setNext(''); setConfirm(''); }
  };
  const error = formError || change.error;
  return (
    <form onSubmit={submit} className="grid max-w-[460px] gap-4">
      <Field label={ts('pg.current_password', 'Current password')}>{p => <LedupPasswordInput {...p} autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} />}</Field>
      <Field label={ts('pg.new_password', 'New password')} hint={ts('account.pwHint', 'At least 8 characters.')}>{p => <LedupPasswordInput {...p} autoComplete="new-password" value={next} onChange={e => setNext(e.target.value)} />}</Field>
      <Field label={ts('pg.confirm_new_password', 'Confirm new password')}>{p => <LedupPasswordInput {...p} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} />}</Field>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="flex flex-wrap items-center gap-3">
        <PillButton type="submit" loading={change.loading} disabled={!current || !next || !confirm}>{ts('pg.update_password', 'Update password')}</PillButton>
        <PillButton variant="outline" onClick={onDone}>{ts('pg.close', 'Close')}</PillButton>
        <span aria-live="polite" className="flex items-center gap-1 text-sm font-medium" style={{ color: t.colors.success }}>{change.success && !error && <><Check size={15} aria-hidden /> {ts('account.updated', 'Updated')}</>}</span>
      </div>
    </form>
  );
}

function OrdersTable({ orders }: { orders: OrderSummary[] }) {
  const th = 'px-3 py-3 text-start text-xs font-semibold uppercase';
  return (
    <div className="overflow-x-auto" style={{ border: `1px solid ${t.colors.border}` }}>
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{ts('account.orders', 'My orders')}</caption>
        <thead style={{ background: t.colors.bgAlt, color: t.colors.inkMuted }}>
          <tr><th scope="col" className={th}>{ts('orders.orderLabel', 'Order')}</th><th scope="col" className={th}>{ts('orders.date', 'Date')}</th><th scope="col" className={th}>{ts('orders.payment', 'Payment')}</th><th scope="col" className={th}>{ts('orders.delivery', 'Delivery')}</th><th scope="col" className={`${th} text-end`}>{ts('checkout.total', 'Total')}</th></tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.orderId} style={{ borderTop: `1px solid ${t.colors.border}` }}>
              <td className="px-3 py-3"><Link to={`/orders/${o.orderId}`} className="font-semibold no-underline hover:underline" style={{ color: t.colors.accent }}>#<bdi>{o.orderNumber}</bdi></Link></td>
              <td className="px-3 py-3" style={{ color: t.colors.inkMuted }}>{formatOrderDate(o.createdAt)}</td>
              <td className="px-3 py-3"><LedupOrderChip badge={derivePaymentBadge(o)} /></td>
              <td className="px-3 py-3"><LedupOrderChip badge={deriveFulfillmentBadge(o)} /></td>
              <td className="px-3 py-3 text-end font-semibold">{nativeMoney(o.totalAmount, o.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** `/account`: contact information, default address and recent orders. Guest sessions are sent to /login?redirect=/account. */
export function LedupAccountPage() {
  return <WithPageSections pageKey="account"><AccountContent /></WithPageSections>;
}
function AccountContent() {
  const guest = useRequireRealAccount();
  useStorefrontSeo({ title: ts('pg.my_account', 'My account'), noindex: true });
  const { profile, loading, error, refetch } = useGetProfile();
  const { addresses } = useMyAddresses();
  const orders = useLoad(() => apiGetMyOrders({ page: 1, limit: 5 }).then(r => r.data.orders), []);
  const [editing, setEditing] = useState<'profile' | 'password' | null>(null);
  if (guest) return null;
  const def = addresses?.find(a => a.isDefault) ?? addresses?.[0];
  return (
    <LedupAccountLayout title={ts('tx.account.myDashboard', 'My dashboard')}>
      <LedupSection title={ts('tx.account.information', 'Account information')}>
        {loading && !profile ? <SkeletonBlock h={120} />
          : !profile ? <ErrorState message={error ? ts('pg.could_not_load_your_profile', 'Could not load your profile.') : ts('pg.your_profile_is_not_available', 'Your profile is not available.')} onRetry={refetch} />
          : (
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <h3 className="m-0 mb-2 text-base font-semibold">{ts('tx.account.contact', 'Contact information')}</h3>
                <p className="m-0 text-sm" style={{ color: t.colors.inkMuted }}>{profile.name}</p>
                <p className="m-0 text-sm" style={{ color: t.colors.inkMuted }}><bdi>{profile.email}</bdi></p>
                {profile.phone && <p className="m-0 text-sm" style={{ color: t.colors.inkMuted }}><bdi>{profile.phone}</bdi></p>}
                <div className="mt-4 flex gap-5">
                  <button type="button" className={linkBtn} style={{ color: t.colors.accent }} onClick={() => setEditing(e => (e === 'profile' ? null : 'profile'))}>{ts('addresses.edit', 'Edit')}</button>
                  <button type="button" className={linkBtn} style={{ color: t.colors.accent }} onClick={() => setEditing(e => (e === 'password' ? null : 'password'))}>{ts('tx.account.changePassword', 'Change password')}</button>
                </div>
              </div>
              <div>
                <h3 className="m-0 mb-2 text-base font-semibold">{ts('tx.account.defaultAddress', 'Default delivery address')}</h3>
                {def ? <>
                  <p className="m-0 text-sm font-medium">{def.recipientName}</p>
                  {addressLines(def).map((l, i) => <p key={i} className="m-0 text-sm" style={{ color: t.colors.inkMuted }}><bdi>{l}</bdi></p>)}
                </> : <p className="m-0 text-sm" style={{ color: t.colors.inkMuted }}>{ts('tx.account.noDefaultAddress', 'You have not saved a delivery address yet.')}</p>}
                <Link to="/addresses" className="mt-4 inline-block text-sm font-medium" style={{ color: t.colors.accent }}>{ts('tx.account.manageAddresses', 'Manage addresses')}</Link>
              </div>
              {editing === 'profile' && <div className="p-5 sm:col-span-2" style={{ background: t.colors.bgAlt }}><ProfileForm key={profile._id} profile={profile} onDone={() => setEditing(null)} /></div>}
              {editing === 'password' && <div className="p-5 sm:col-span-2" style={{ background: t.colors.bgAlt }}><PasswordForm onDone={() => setEditing(null)} /></div>}
            </div>
          )}
      </LedupSection>
      <LedupSection title={ts('pg.order_history', 'Recent orders')} aside={orders.data && orders.data.length > 0 ? <Link to="/orders" className="text-sm font-medium" style={{ color: t.colors.accent }}>{ts('account.viewAllOrders', 'View all orders')}</Link> : undefined}>
        {orders.loading ? <SkeletonBlock h={48} rows={3} />
          : orders.error ? <ErrorState message={ts('pg.could_not_load_your_orders_right_now', 'Could not load your orders right now.')} onRetry={orders.retry} />
          : !orders.data || orders.data.length === 0 ? <EmptyState icon={<Package size={22} aria-hidden />} title={ts('orders.none', 'No orders yet')} text={ts('pg.when_you_place_an_order_it_will_show_up_', 'When you place an order it will show up here.')} />
          : <OrdersTable orders={orders.data} />}
      </LedupSection>
    </LedupAccountLayout>
  );
}

/** `/orders`: paginated order history. */
export function LedupOrdersPage() {
  return <WithPageSections pageKey="orders"><RequireAccount><OrdersContent /></RequireAccount></WithPageSections>;
}
function OrdersContent() {
  useStorefrontSeo({ title: ts('account.orders', 'Orders'), noindex: true });
  const [page, setPage] = useState(1);
  const { data, loading, error, retry } = useLoad(() => apiGetMyOrders({ page, limit: 10 }), [page]);
  const orders = data?.data.orders ?? [];
  const totalPages = Math.max(1, data?.data.pagination?.totalPages ?? 1);
  return (
    <LedupAccountLayout title={ts('account.orders', 'My orders')}>
      {loading ? <div role="status" aria-label={ts('pg.loading_orders', 'Loading orders')}><SkeletonBlock h={48} rows={4} /></div>
        : error ? <ErrorState message={ts('pg.we_could_not_load_your_orders', 'We could not load your orders.')} onRetry={retry} />
        : orders.length === 0 ? <EmptyState icon={<Package size={24} aria-hidden />} title={ts('orders.none', 'No orders yet')} text={ts('pg.when_you_place_an_order_it_will_show_up_', 'When you place an order it will show up here.')} action={<Link to="/search" className="tx-btn no-underline" style={{ background: t.colors.accent, color: t.colors.accentInk, borderColor: t.colors.accent, borderRadius: t.buttonRadiusPx }}>{ts('cart.startShopping', 'Start shopping')}</Link>} />
        : <><OrdersTable orders={orders} /><LedupPager page={page} totalPages={totalPages} onChange={setPage} /></>}
    </LedupAccountLayout>
  );
}

function AddressDialog({ address, isFirst, onClose, onSaved }: { address?: Address; isFirst: boolean; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<AddressPayload>(() => (address ? addressToForm(address) : { ...EMPTY_ADDRESS_FORM, isDefault: isFirst }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (patch: Partial<AddressPayload>) => setForm(f => ({ ...f, ...patch }));
  async function submit() {
    const invalid = validateAddressForm(form);
    if (invalid) { setError(invalid); return; }
    setSaving(true); setError('');
    try { if (address) await apiUpdateAddress(address._id, form); else await apiAddAddress(form); onSaved(); }
    catch (err) { setError(err instanceof Error ? err.message : ts('checkout.err.address', 'Failed to save address.')); setSaving(false); }
  }
  return (
    <LedupDialog title={address ? ts('addresses.editTitle', 'Edit address') : ts('addresses.add', 'Add a new address')} onClose={onClose}
      footer={<><PillButton variant="outline" className="flex-1" onClick={onClose}>{ts('common.cancel', 'Cancel')}</PillButton><PillButton className="flex-1" loading={saving} onClick={submit}>{address ? ts('addresses.updateBtn', 'Update address') : ts('addresses.saveBtn', 'Save address')}</PillButton></>}>
      <form onSubmit={e => { e.preventDefault(); void submit(); }} className="grid gap-4 sm:grid-cols-2">
        <Field label={ts('checkout.recipientName', 'Recipient name')} required>{p => <TextInput {...p} autoComplete="name" value={form.recipientName} onChange={e => set({ recipientName: e.target.value })} />}</Field>
        <Field label={ts('checkout.phoneNumber', 'Phone number')} required>{p => <TextInput {...p} type="tel" autoComplete="tel" value={form.phoneNumber} onChange={e => set({ phoneNumber: e.target.value })} />}</Field>
        <div className="sm:col-span-2"><Field label={ts('checkout.addressLine1', 'Address line 1')} required>{p => <TextInput {...p} autoComplete="address-line1" value={form.addressLine1} onChange={e => set({ addressLine1: e.target.value })} />}</Field></div>
        <div className="sm:col-span-2"><Field label={ts('checkout.addressLine2', 'Address line 2 (optional)')}>{p => <TextInput {...p} autoComplete="address-line2" value={form.addressLine2 ?? ''} onChange={e => set({ addressLine2: e.target.value })} />}</Field></div>
        <Field label={ts('checkout.city', 'City')} required>{p => <TextInput {...p} autoComplete="address-level2" value={form.city} onChange={e => set({ city: e.target.value })} />}</Field>
        <Field label={ts('pg.state_province', 'State / province')} required>{p => <TextInput {...p} autoComplete="address-level1" value={form.state} onChange={e => set({ state: e.target.value })} />}</Field>
        <Field label={ts('checkout.zip', 'Zip code')} required>{p => <TextInput {...p} autoComplete="postal-code" value={form.zipCode} onChange={e => set({ zipCode: e.target.value })} />}</Field>
        <Field label={ts('addresses.country', 'Country')} required>
          {p => <SelectInput {...p} autoComplete="country-name" value={form.country ?? ''} onChange={e => set({ country: e.target.value })}>
            <option value="" disabled>{ts('checkout.selectCountry', 'Select country')}</option>
            {localizedCountryOptions().map(c => <option key={c.code} value={c.name}>{c.label}</option>)}
          </SelectInput>}
        </Field>
        {!address?.isDefault && (
          <label className="flex cursor-pointer items-center gap-2.5 text-sm sm:col-span-2">
            <input type="checkbox" checked={!!form.isDefault} onChange={e => set({ isDefault: e.target.checked })} style={{ accentColor: t.colors.accent, width: 18, height: 18 }} />
            {ts('addresses.setDefaultAddr', 'Set as default address')}
          </label>
        )}
        {error && <div className="sm:col-span-2"><Notice tone="error">{error}</Notice></div>}
        <button type="submit" className="sr-only">{ts('pg.save', 'Save')}</button>
      </form>
    </LedupDialog>
  );
}

/** `/addresses`: the buyer's saved addresses (add, edit, delete, set default). */
export function LedupAddressesPage() {
  return <WithPageSections pageKey="addresses"><AddressesContent /></WithPageSections>;
}
function AddressesContent() {
  const guest = useRequireRealAccount();
  useStorefrontSeo({ title: ts('account.addresses', 'Addresses'), noindex: true });
  const { addresses, loading, error, reload } = useMyAddresses();
  const [editing, setEditing] = useState<Address | 'new' | null>(null);
  const [busyId, setBusyId] = useState('');
  const [actionError, setActionError] = useState('');
  const del = useConfirmAction<Address>(a => apiDeleteAddress(a._id).then(() => undefined), reload);
  if (guest) return null;
  async function makeDefault(a: Address) {
    setBusyId(a._id); setActionError('');
    try { await apiSetDefaultAddress(a._id); reload(); }
    catch (err) { setActionError(err instanceof Error ? err.message : ts('addresses.err.default', 'Could not update your default address.')); }
    finally { setBusyId(''); }
  }
  const add = <PillButton onClick={() => setEditing('new')}><Plus size={16} aria-hidden />{ts('addresses.add', 'Add a new address')}</PillButton>;
  return (
    <LedupAccountLayout title={ts('account.addresses', 'Address book')} actions={addresses && addresses.length > 0 ? add : undefined}>
      {actionError && <div className="mb-4"><Notice tone="error">{actionError}</Notice></div>}
      {loading && !addresses ? <div aria-busy="true"><SkeletonBlock h={140} rows={2} /></div>
        : error && !addresses ? <ErrorState message={error} onRetry={reload} />
        : !addresses || addresses.length === 0 ? <EmptyState icon={<MapPin size={22} aria-hidden />} title={ts('pg.no_saved_addresses_yet', 'No saved addresses yet')} text={ts('pg.save_an_address_to_check_out_faster', 'Save an address to check out faster.')} action={add} />
        : (
          <div className="grid gap-4 sm:grid-cols-2" style={{ opacity: loading ? 0.6 : 1 }}>
            {addresses.map(a => (
              <div key={a._id} className="p-5" style={{ background: t.colors.bgAlt, borderRadius: t.cardRadiusPx, borderInlineStart: `3px solid ${a.isDefault ? t.colors.accent : 'transparent'}` }}>
                <div className="mb-2 flex flex-wrap items-center gap-2"><p className="m-0 text-base font-semibold">{a.recipientName}</p>{a.isDefault && <span className="px-2 py-0.5 text-xs font-semibold" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: t.badgeRadiusPx }}>{ts('addresses.default', 'Default')}</span>}</div>
                {addressLines(a).map((l, i) => <p key={i} className="m-0 text-sm leading-relaxed" style={{ color: t.colors.inkMuted }}><bdi>{l}</bdi></p>)}
                {a.phoneNumber && <p className="m-0 text-sm" style={{ color: t.colors.inkMuted }}><bdi>{a.phoneNumber}</bdi></p>}
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <button type="button" onClick={() => setEditing(a)} className={linkBtn} style={{ color: t.colors.accent }}>{ts('addresses.edit', 'Edit')}</button>
                  <button type="button" onClick={() => del.open(a)} className={linkBtn} style={{ color: t.colors.accent }}>{ts('addresses.delete', 'Delete')}</button>
                  {!a.isDefault && <button type="button" disabled={busyId === a._id} onClick={() => void makeDefault(a)} className={linkBtn} style={{ color: t.colors.accent }}>{busyId === a._id ? ts('pg.word_saving', 'Saving...') : ts('addresses.setDefault', 'Set as default')}</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      {editing && <AddressDialog address={editing === 'new' ? undefined : editing} isFirst={!addresses || addresses.length === 0} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      {del.target && (
        <LedupConfirmDialog title={ts('addresses.deleteTitle', 'Delete address')} confirmLabel={ts('addresses.delete', 'Delete')} tone="destructive" busy={del.busy} error={del.error} onClose={del.close} onConfirm={() => void del.confirm()}
          message={del.target.isDefault ? ts('addresses.deleteDefaultMsg', 'This is your default address. Are you sure you want to delete it?') : ts('addresses.deleteMsg', 'Are you sure you want to delete this address?')} />
      )}
    </LedupAccountLayout>
  );
}
