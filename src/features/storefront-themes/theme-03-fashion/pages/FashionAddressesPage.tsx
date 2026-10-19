import { useState } from 'react';
import { ts } from '@/utils/tStatic';
import { MapPin, Plus } from 'lucide-react';
import { useRequireRealAccount } from '@/hooks/auth/useRequireRealAccount';
import { apiDeleteAddress, apiSetDefaultAddress, type Address } from '@/api/services/address';
import { addressLines } from '../../accountUi';
import { useMyAddresses } from '../../useAccountLists';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { fashionTheme as t } from '../theme.config';
import { Card, EmptyState, ErrorState, Notice, PillButton, SkeletonBlock, StatusPill } from '../ui/primitives';
import { AccountLayout } from '../ui/AccountLayout';
import { AddressFormDialog } from './account/AddressFormDialog';
import { ConfirmDialog } from '../ui/Dialog';
import { useConfirmAction } from '../../core/account/useConfirmAction';

/** `/addresses`: the buyer's saved addresses (add, edit, delete, set default). */
export function FashionAddressesPage() {
  const guest = useRequireRealAccount();
  useStorefrontSeo({ title: 'Addresses', noindex: true });
  const { addresses, loading, error, reload } = useMyAddresses();
  const [editing, setEditing] = useState<Address | 'new' | null>(null);
  const [busyId, setBusyId] = useState('');
  const [actionError, setActionError] = useState('');
  const del = useConfirmAction<Address>(a => apiDeleteAddress(a._id).then(() => undefined), reload);

  if (guest) return null;

  async function makeDefault(a: Address) {
    setBusyId(a._id); setActionError('');
    try { await apiSetDefaultAddress(a._id); reload(); }
    catch (err) { setActionError(err instanceof Error ? err.message : 'Could not update your default address.'); }
    finally { setBusyId(''); }
  }

  const add = <PillButton onClick={() => setEditing('new')}><Plus size={16} aria-hidden /> Add a new address</PillButton>;
  const link = 'cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold underline disabled:opacity-40';

  return (
    <AccountLayout title="My" accent={ts('pg.word_addresses', 'addresses')} subtitle="Where we send your orders." actions={addresses && addresses.length > 0 ? add : undefined}>
      {actionError && <div className="mb-4"><Notice tone="error">{actionError}</Notice></div>}
      {loading && !addresses ? <div aria-busy="true"><SkeletonBlock h={140} rows={2} /></div>
        : error && !addresses ? <ErrorState message={error} onRetry={reload} />
        : !addresses || addresses.length === 0 ? <EmptyState icon={<MapPin size={22} aria-hidden />} title={ts('pg.no_saved_addresses_yet', 'No saved addresses yet')} text={ts('pg.save_an_address_to_check_out_faster', 'Save an address to check out faster.')} action={add} />
        : (
          <div className="grid gap-4 sm:grid-cols-2" style={{ opacity: loading ? 0.6 : 1 }}>
            {addresses.map(a => (
              <Card key={a._id}>
                <div className="mb-2 flex flex-wrap items-center gap-2"><p className="m-0 text-base font-semibold">{a.recipientName}</p>{a.isDefault && <StatusPill tone="good">{ts('addresses.default', 'Default')}</StatusPill>}</div>
                {addressLines(a).map((l, i) => <p key={i} className="m-0 text-sm leading-relaxed" style={{ color: t.colors.inkMuted }}>{l}</p>)}
                {a.phoneNumber && <p className="m-0 text-sm" style={{ color: t.colors.inkMuted }}>{a.phoneNumber}</p>}
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <button type="button" onClick={() => setEditing(a)} className={link} style={{ color: t.colors.ink }}>{ts('addresses.edit', 'Edit')}</button>
                  <button type="button" onClick={() => del.open(a)} className={link} style={{ color: t.colors.ink }}>{ts('addresses.delete', 'Delete')}</button>
                  {!a.isDefault && <button type="button" disabled={busyId === a._id} onClick={() => void makeDefault(a)} className={link} style={{ color: t.colors.ink }}>{busyId === a._id ? 'Saving...' : 'Set as default'}</button>}
                </div>
              </Card>
            ))}
          </div>
        )}
      {editing && <AddressFormDialog address={editing === 'new' ? undefined : editing} isFirst={!addresses || addresses.length === 0} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      {del.target && (
        <ConfirmDialog title={ts('addresses.deleteTitle', 'Delete address')} confirmLabel="Delete" busy={del.busy} error={del.error} onClose={del.close} onConfirm={() => void del.confirm()}
          message={del.target.isDefault ? 'This is your default address. Are you sure you want to delete it?' : 'Are you sure you want to delete this address?'} />
      )}
    </AccountLayout>
  );
}
