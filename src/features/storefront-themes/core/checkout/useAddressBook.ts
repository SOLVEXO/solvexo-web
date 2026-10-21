import { useCallback, useMemo, useState } from 'react';
import { apiAddAddress, apiGetMyAddresses, type Address, type AddressPayload } from '@/api/services/address';
import { useLoad } from '../pageHooks';
import { ts } from '@/utils/tStatic';

export const EMPTY_ADDRESS: AddressPayload = {
  label: 'Home', recipientName: '', phoneNumber: '', addressLine1: '', addressLine2: '', state: '', city: '', zipCode: '', country: '', isDefault: true,
};

/** Saved addresses of the signed-in (or guest) buyer + adding a new one. Selection is derived: the buyer's pick, else the default. */
export function useAddressBook(active: boolean) {
  const load = useLoad<Address[]>(() => (active ? apiGetMyAddresses().then(r => r.data ?? []) : Promise.resolve([])), [active]);
  const [added, setAdded] = useState<Address[]>([]);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [wantsForm, setWantsForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const list = useMemo(() => [...(load.data ?? []), ...added], [load.data, added]);
  const selected = list.find(a => a._id === chosenId) ?? list.find(a => a.isDefault) ?? list[0] ?? null;
  const showForm = !load.loading && (wantsForm || list.length === 0);

  const save = useCallback(async (payload: AddressPayload): Promise<boolean> => {
    setSaving(true); setSaveError('');
    try {
      const res = await apiAddAddress(payload);
      setAdded(prev => [...prev, res.data]);
      setChosenId(res.data._id);
      setWantsForm(false);
      return true;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : ts('pg.failed_to_save_the_address', 'Failed to save the address.'));
      return false;
    } finally { setSaving(false); }
  }, []);

  return {
    list, selected, loading: load.loading, error: load.error, retry: load.retry,
    select: setChosenId, showForm, openForm: () => { setSaveError(''); setWantsForm(true); }, closeForm: () => setWantsForm(false),
    save, saving, saveError, canCancelForm: list.length > 0,
  };
}
