import { useRequireRealAccount } from '@/hooks/auth/useRequireRealAccount';
import { useState } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { apiDeleteAddress, apiSetDefaultAddress, type Address } from '@/api/services/address';
import { addressLines } from '../../accountUi';
import { useMyAddresses } from '../../useAccountLists';
import { AddressFormModal, ConfirmModal } from '../../AccountModals';
import { novaTheme as t } from '../theme.config';

/** Theme 02's Addresses page (Shopify customer account "Addresses"). */
export function NovaAddressesPage() {
  useRequireRealAccount();
  useStorefrontSeo({ title: 'Addresses', noindex: true });
  const { addresses, loading, error, reload } = useMyAddresses();
  const [editing, setEditing] = useState<Address | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Address | null>(null);
  const [busyId, setBusyId] = useState('');
  const [actionError, setActionError] = useState('');

  const btn = { color: t.colors.ink, border: `1.5px solid ${t.colors.border}`, borderRadius: '9999px', padding: '7px 16px', fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 700 } as const;
  const linkBtn = { color: t.colors.ink, border: 'none', fontFamily: t.fonts.body, fontSize: '12px' } as const;

  async function makeDefault(a: Address) {
    setBusyId(a._id);
    setActionError('');
    try { await apiSetDefaultAddress(a._id); reload(); } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update your default address.');
    } finally { setBusyId(''); }
  }

  return (
    <main className="mx-auto" style={{ maxWidth: '720px', padding: `48px ${t.layout.containerPadX}` }}>
      <div className="flex items-center justify-between gap-3 flex-wrap" style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: t.fonts.display, fontSize: '24px', fontWeight: 700, color: t.colors.ink }}>Addresses</h1>
        {addresses && (
          <button type="button" onClick={() => setEditing('new')} className="cursor-pointer" style={{ ...btn, background: t.colors.ink, color: '#FFFFFF', borderColor: t.colors.ink }}>
            Add a new address
          </button>
        )}
      </div>

      {actionError && (
        <div role="alert" className="flex items-center gap-2" style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.danger, marginBottom: '12px' }}>
          <AlertCircle size={13} /> {actionError}
        </div>
      )}

      {loading && !addresses ? (
        <div className="flex flex-col gap-2.5" aria-busy="true">
          {[1, 2].map(i => <div key={i} className="animate-pulse" style={{ height: '120px', background: t.colors.bgAlt, borderRadius: t.radius.md }} />)}
        </div>
      ) : error && !addresses ? (
        <div role="alert" className="flex flex-col items-center text-center" style={{ padding: '56px 0', border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md }}>
          <AlertCircle size={26} style={{ color: t.colors.danger, marginBottom: '12px' }} />
          <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.ink }}>{error}</p>
          <button type="button" onClick={reload} className="cursor-pointer bg-transparent" style={{ ...btn, marginTop: '14px' }}>Try again</button>
        </div>
      ) : !addresses || addresses.length === 0 ? (
        <div className="flex flex-col items-center text-center" style={{ padding: '56px 0', border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md }}>
          <MapPin size={26} style={{ color: t.colors.inkMuted, marginBottom: '12px' }} />
          <p style={{ fontFamily: t.fonts.display, fontSize: '15px', fontWeight: 700, color: t.colors.ink }}>You haven't saved any addresses yet</p>
          <button type="button" onClick={() => setEditing('new')} className="cursor-pointer bg-transparent underline" style={{ ...linkBtn, fontSize: '13px', marginTop: '8px' }}>
            Add a new address
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3" style={{ opacity: loading ? 0.6 : 1 }}>
          {addresses.map(a => (
            <div key={a._id} style={{ border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md, padding: '16px 18px' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: '6px' }}>
                <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', fontWeight: 700, color: t.colors.ink }}>{a.recipientName}</p>
                {a.isDefault && (
                  <span style={{ fontFamily: t.fonts.body, fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: t.colors.accent, border: `1px solid ${t.colors.accent}`, padding: '1px 7px' }}>Default</span>
                )}
              </div>
              {addressLines(a).map((l, i) => (
                <p key={i} style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.inkMuted }}>{l}</p>
              ))}
              {a.phoneNumber && <p style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.inkMuted }}>{a.phoneNumber}</p>}
              <div className="flex items-center gap-4 flex-wrap" style={{ marginTop: '12px' }}>
                <button type="button" onClick={() => setEditing(a)} className="cursor-pointer bg-transparent underline" style={linkBtn}>Edit</button>
                <button type="button" onClick={() => { setActionError(''); setDeleting(a); }} className="cursor-pointer bg-transparent underline" style={linkBtn}>Delete</button>
                {!a.isDefault && (
                  <button type="button" disabled={busyId === a._id} onClick={() => makeDefault(a)} className="cursor-pointer bg-transparent underline disabled:opacity-40" style={linkBtn}>
                    {busyId === a._id ? 'Saving…' : 'Set as default'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <AddressFormModal
          address={editing === 'new' ? undefined : editing}
          isFirst={!addresses || addresses.length === 0}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
        />
      )}
      {deleting && (
        <ConfirmModal
          title="Delete address"
          message={deleting.isDefault
            ? 'This is your default address. Are you sure you want to delete it?'
            : 'Are you sure you want to delete this address?'}
          confirmLabel="Delete"
          onClose={() => setDeleting(null)}
          onConfirm={async () => { await apiDeleteAddress(deleting._id); setDeleting(null); reload(); }}
        />
      )}
    </main>
  );
}
