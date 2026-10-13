import { useCallback, useEffect, useState } from 'react';
import {
  apiGetStoreNotificationSettings,
  apiUpdateStoreNotificationSettings,
  type StoreNotificationSettings,
  type UpdateStoreNotificationSettingsPayload,
} from '@/api/services/storeNotifications';

export function errMsg(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/**
 * The store's customer-email settings, shared by every pane of the Notifications hub (list, editor, look & sender) so one
 * fetch feeds all of them and an unsaved form survives switching panes.
 */
export function useCustomerEmailSettings(storeId: string) {
  const [settings, setSettings] = useState<StoreNotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [rowError, setRowError] = useState('');

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    apiGetStoreNotificationSettings(storeId)
      .then(res => { if (!cancelled) { setSettings(res.data); setLoadError(''); } })
      .catch((err: unknown) => { if (!cancelled) setLoadError(errMsg(err, 'Failed to load customer notifications.')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, reloadKey]);

  const reload = useCallback(() => {
    setLoading(true);
    setLoadError('');
    setReloadKey(k => k + 1);
  }, []);

  /** Switch one email on/off: optimistic, rolled back (with a message) if the save fails. */
  const toggleEmail = useCallback((key: string, enabled: boolean) => {
    setRowError('');
    setSettings(s => s && { ...s, events: s.events.map(e => (e.key === key ? { ...e, enabled } : e)) });
    apiUpdateStoreNotificationSettings(storeId, { events: { [key]: { enabled } } })
      .then(res => setSettings(s => s && { ...s, events: res.data.events }))
      .catch((err: unknown) => {
        setSettings(s => s && { ...s, events: s.events.map(e => (e.key === key ? { ...e, enabled: !enabled } : e)) });
        setRowError(errMsg(err, 'Failed to update this email.'));
      });
  }, [storeId]);

  /** Save one email's text (or reset it). Rejects with the server's message so the editor can show it. */
  const saveEmail = useCallback(async (key: string, change: { subject?: string; body?: string; reset?: boolean }) => {
    const res = await apiUpdateStoreNotificationSettings(storeId, { events: { [key]: change } });
    setSettings(s => s && { ...s, events: res.data.events });
  }, [storeId]);

  /** Save sender / look / extra recipients. Rejects with the server's message. */
  const saveLook = useCallback(async (payload: UpdateStoreNotificationSettingsPayload) => {
    const res = await apiUpdateStoreNotificationSettings(storeId, payload);
    setSettings(res.data);
  }, [storeId]);

  return { settings, loading, loadError, rowError, reload, toggleEmail, saveEmail, saveLook };
}
