import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, Field, Input, Select, SkeletonBox } from '@/components/comman/ui';
import { useToast } from '@/contexts/ToastContext';
import { apiDisconnectIntegration, apiTestIntegration, apiUpdateIntegration } from '@/api/services/integrations';
import {
  apiConnectCourier, apiGetCourierSettings, apiSaveCourierSettings,
  type CourierIntegrationView, type CourierKey, type CourierParty, type CourierSettings,
} from '@/api/services/courier';
import { useEffect } from 'react';

const message = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

function CourierCard({ storeId, courier, onChanged }: { storeId: string; courier: CourierIntegrationView; onChanged: () => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const connected = courier.status === 'connected' || courier.status === 'error';
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<'sandbox' | 'live'>(courier.mode);
  const [busy, setBusy] = useState<null | 'connect' | 'test' | 'disconnect' | 'mode'>(null);
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const run = async (kind: NonNullable<typeof busy>, fn: () => Promise<void>) => {
    if (busy) return; // duplicate-click guard
    setBusy(kind); setError('');
    try { await fn(); } catch (e) { setError(message(e, 'Something went wrong')); } finally { setBusy(null); }
  };

  const connect = () => run('connect', async () => {
    await apiConnectCourier(storeId, courier.provider, { ...values, mode });
    setValues({}); setOpen(false); setTestResult(null);
    toast.success(t('courier.connected'));
    onChanged();
  });

  const test = () => run('test', async () => {
    if (!courier.id) return;
    const res = await apiTestIntegration(storeId, courier.id);
    setTestResult(res.data);
    onChanged();
  });

  const disconnect = () => run('disconnect', async () => {
    if (!courier.id || !window.confirm(`${t('courier.disconnect')}?`)) return;
    await apiDisconnectIntegration(storeId, courier.id);
    setTestResult(null);
    onChanged();
  });

  const changeMode = (next: 'sandbox' | 'live') => run('mode', async () => {
    if (!courier.id) { setMode(next); return; }
    await apiUpdateIntegration(storeId, courier.id, { mode: next });
    setMode(next); setTestResult(null);
    onChanged();
  });

  const statusColor = courier.status === 'connected' ? 'green' : courier.status === 'error' ? 'red' : 'gray';
  const statusLabel = courier.status === 'connected' ? t('courier.connected') : courier.status === 'error' ? t('courier.error') : t('courier.notConnected');
  const fieldsFilled = courier.catalog.fields.every((f) => f.optional || (values[f.key] ?? '').trim());

  return (
    <div className="border border-bone rounded-[12px] p-4 bg-white" data-testid={`courier-card-${courier.provider}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] font-bold text-charcoal">{courier.catalog.label}</p>
        <Badge color={statusColor}>{statusLabel}</Badge>
      </div>
      {!courier.catalog.verified && <p className="text-[12px] text-warning mt-2" role="note">{t('courier.unverified')}</p>}
      {courier.lastError && courier.status === 'error' && <p className="text-[12px] text-error mt-2" role="alert">{courier.lastError}</p>}

      {connected && Object.keys(courier.maskedHints).length > 0 && (
        <p className="text-[12px] text-slate mt-2">{Object.entries(courier.maskedHints).map(([k, v]) => `${k}: ${v}`).join(' · ')}</p>
      )}

      <div className="flex flex-wrap items-end gap-3 mt-3">
        <div className="w-[190px]">
          <Field label={t('courier.mode')}>
            <Select value={mode} disabled={busy !== null} onChange={(e) => void changeMode(e.target.value as 'sandbox' | 'live')}>
              <option value="sandbox">{t('courier.sandbox')}</option>
              <option value="live">{t('courier.live')}</option>
            </Select>
          </Field>
        </div>
        {connected && <Button size="sm" variant="outline" onClick={test} loading={busy === 'test'} disabled={busy !== null}>{t('courier.test')}</Button>}
        {connected && <Button size="sm" variant="outline" onClick={disconnect} loading={busy === 'disconnect'} disabled={busy !== null}>{t('courier.disconnect')}</Button>}
        {!open && <Button size="sm" onClick={() => setOpen(true)} disabled={busy !== null}>{connected ? `${t('courier.connect')} (${t('courier.save')})` : t('courier.connect')}</Button>}
      </div>

      {testResult && (
        <p className={`text-[12.5px] mt-2 ${testResult.ok ? 'text-success' : 'text-error'}`} role="status">
          {testResult.ok ? t('courier.testOk') : t('courier.testFailed')}: {testResult.message}
        </p>
      )}

      {open && (
        <form className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); void connect(); }}>
          {courier.catalog.fields.map((f) => (
            <Field key={f.key} label={f.label} required={!f.optional}>
              <Input
                type={f.secret ? 'password' : 'text'} autoComplete="off" value={values[f.key] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} disabled={busy !== null}
              />
            </Field>
          ))}
          <div className="sm:col-span-2 flex gap-2">
            <Button type="submit" size="sm" loading={busy === 'connect'} disabled={!fieldsFilled || busy !== null}>{t('courier.connect')}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { setOpen(false); setValues({}); }} disabled={busy !== null}>{t('courier.close')}</Button>
          </div>
        </form>
      )}
      {error && <p className="text-[12.5px] text-error mt-2" role="alert">{error}</p>}
    </div>
  );
}

const blankParty = (): CourierParty => ({ name: '', phone: '', address: '', city: '', addressCode: '' });

function PartyFields({ label, value, onChange, disabled }: { label: string; value: CourierParty; onChange: (p: CourierParty) => void; disabled: boolean }) {
  const { t } = useTranslation();
  const set = (k: keyof CourierParty, v: string) => onChange({ ...value, [k]: v });
  return (
    <fieldset className="border border-bone rounded-[10px] p-3" disabled={disabled}>
      <legend className="text-[12.5px] font-semibold text-charcoal px-1">{label}</legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label={t('courier.name')}><Input value={value.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label={t('courier.phone')}><Input inputMode="tel" value={value.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
        <div className="sm:col-span-2"><Field label={t('courier.address')}><Input value={value.address} onChange={(e) => set('address', e.target.value)} /></Field></div>
        <Field label={t('courier.city')}><Input value={value.city} onChange={(e) => set('city', e.target.value)} /></Field>
        <Field label={t('courier.addressCode')}><Input value={value.addressCode ?? ''} onChange={(e) => set('addressCode', e.target.value)} /></Field>
      </div>
    </fieldset>
  );
}

/** Pickup/return address, default courier and default parcel weight. */
function CourierSettingsForm({ storeId, providers }: { storeId: string; providers: CourierKey[] }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [defaultProvider, setDefaultProvider] = useState<CourierKey | ''>('');
  const [weight, setWeight] = useState('0.5');
  const [pickup, setPickup] = useState<CourierParty>(blankParty());
  const [ret, setRet] = useState<CourierParty>(blankParty());

  useEffect(() => {
    let cancelled = false;
    apiGetCourierSettings(storeId)
      .then((res) => {
        if (cancelled) return;
        const s = res.data;
        setDefaultProvider(s.defaultProvider ?? ''); setWeight(String(s.defaultWeightKg));
        setPickup(s.pickup ?? blankParty()); setRet(s.returnAddress ?? blankParty());
      })
      .catch((e) => { if (!cancelled) setLoadError(message(e, 'Could not load courier settings')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId]);

  const clean = (p: CourierParty): CourierParty | null => (p.name || p.phone || p.address || p.city ? { ...p, addressCode: p.addressCode?.trim() || undefined } : null);

  const save = async () => {
    if (saving) return;
    setSaving(true); setError('');
    const payload: CourierSettings = {
      defaultProvider: defaultProvider || null, defaultWeightKg: Number(weight) || 0.5, pickup: clean(pickup), returnAddress: clean(ret),
    };
    try { await apiSaveCourierSettings(storeId, payload); toast.success(t('courier.settingsSaved')); }
    catch (e) { setError(message(e, 'Could not save')); }
    finally { setSaving(false); }
  };

  if (loading) return <SkeletonBox height="160px" rounded="12px" />;
  if (loadError) return <p className="text-[12.5px] text-error" role="alert">{loadError}</p>;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] font-bold text-charcoal">{t('courier.settingsTitle')}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label={t('courier.defaultCourier')}>
          <Select value={defaultProvider} onChange={(e) => setDefaultProvider(e.target.value as CourierKey | '')} disabled={saving}>
            <option value="">{t('courier.none')}</option>
            {providers.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </Field>
        <Field label={t('courier.defaultWeight')}>
          <Input type="number" min="0.01" max="100" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} disabled={saving} />
        </Field>
      </div>
      <PartyFields label={t('courier.pickup')} value={pickup} onChange={setPickup} disabled={saving} />
      <PartyFields label={t('courier.returnAddress')} value={ret} onChange={setRet} disabled={saving} />
      {error && <p className="text-[12.5px] text-error" role="alert">{error}</p>}
      <div><Button size="sm" onClick={() => void save()} loading={saving}>{t('courier.save')}</Button></div>
    </div>
  );
}

/** Settings → Integrations: courier cards + courier defaults. Renders nothing unless the platform enabled at least one courier. */
export function CourierIntegrationsSection({ storeId, couriers, onChanged }: { storeId: string; couriers: CourierIntegrationView[] | undefined; onChanged: () => void }) {
  const { t } = useTranslation();
  if (!couriers || couriers.length === 0) return null;
  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[15px] font-bold text-charcoal">{t('courier.connectedTitle')}</p>
          <p className="text-[12.5px] text-slate mt-0.5">{t('courier.intro')}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {couriers.map((c) => <CourierCard key={c.provider} storeId={storeId} courier={c} onChanged={onChanged} />)}
        </div>
        <CourierSettingsForm storeId={storeId} providers={couriers.map((c) => c.provider)} />
      </div>
    </Card>
  );
}
