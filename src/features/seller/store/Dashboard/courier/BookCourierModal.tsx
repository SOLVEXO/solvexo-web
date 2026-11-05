import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Field, Input, Modal, Select, SkeletonBox } from '@/components/comman/ui';
import {
  apiBookCourier, apiGetCourierOptions, apiValidateCourierCity,
  type BookableCourier, type CourierKey, type CourierSettings,
} from '@/api/services/courier';
import { newIdempotencyKey } from './courierDisplay';

const message = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

/** Book ONE order (whole, or a subset of lines) with a connected courier; validates the destination city first. */
export function BookCourierModal({ storeId, orderId, orderNumber, destinationCity, items, onClose, onBooked }: {
  storeId: string;
  orderId: string;
  orderNumber: string;
  destinationCity: string;
  /** Partial shipment: book (and fulfil) only these lines/quantities. */
  items?: { itemId: string; quantity: number }[];
  onClose: () => void;
  onBooked: () => void;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [providers, setProviders] = useState<BookableCourier[]>([]);
  const [settings, setSettings] = useState<CourierSettings | null>(null);
  const [provider, setProvider] = useState<CourierKey | ''>('');
  const [weight, setWeight] = useState('');
  const [pieces, setPieces] = useState('1');
  const [city, setCity] = useState<{ state: 'idle' | 'checking' | 'ok' | 'bad'; text: string }>({ state: 'idle', text: '' });
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const keyRef = useRef(newIdempotencyKey());

  // Validate the buyer's city against the chosen courier as soon as one is picked (only couriers with a city list).
  const checkCity = useCallback(async (prov: CourierKey) => {
    if (!destinationCity) return;
    setCity({ state: 'checking', text: '' });
    try {
      const res = await apiValidateCourierCity(storeId, prov, destinationCity);
      setCity(res.data.ok ? { state: 'ok', text: t('courier.cityOk', { city: res.data.city ?? destinationCity }) } : { state: 'bad', text: res.data.message ?? t('courier.cityBad') });
    } catch (e) {
      setCity({ state: 'bad', text: message(e, t('courier.cityBad')) });
    }
  }, [storeId, destinationCity, t]);

  useEffect(() => {
    let cancelled = false;
    apiGetCourierOptions(storeId)
      .then((res) => {
        if (cancelled) return;
        setProviders(res.data.providers); setSettings(res.data.settings);
        const preferred = res.data.providers.find((p) => p.provider === res.data.settings.defaultProvider) ?? res.data.providers[0];
        if (preferred) { setProvider(preferred.provider); void checkCity(preferred.provider); }
      })
      .catch((e) => { if (!cancelled) setLoadError(message(e, 'Could not load couriers')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, checkCity]);

  const selected = providers.find((p) => p.provider === provider);

  const book = async () => {
    if (booking || !provider) return; // duplicate-click guard
    setBooking(true); setError('');
    try {
      await apiBookCourier(
        { orderId, storeId, provider, items, weightKg: weight ? Number(weight) : undefined, pieces: Number(pieces) || 1 },
        keyRef.current,
      );
      onBooked();
    } catch (e) {
      setError(message(e, 'Booking failed'));
      keyRef.current = newIdempotencyKey(); // a failed attempt may be retried as a new intent
    } finally {
      setBooking(false);
    }
  };

  const noCourier = !loading && !loadError && providers.length === 0;
  const noPickup = !loading && !loadError && providers.length > 0 && !settings?.pickup;

  return (
    <Modal
      title={`${t('courier.bookTitle')} — ${orderNumber}`}
      width={480}
      mobileSheet
      onClose={() => { if (!booking) onClose(); }}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={booking}>{t('courier.close')}</Button>
          <Button size="sm" onClick={() => void book()} loading={booking} disabled={loading || !provider || noPickup || city.state === 'bad' || city.state === 'checking'}>
            {booking ? t('courier.booking') : t('courier.book')}
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="flex flex-col gap-2" aria-busy="true"><SkeletonBox height="48px" rounded="10px" /><SkeletonBox height="48px" rounded="10px" /></div>
      ) : loadError ? (
        <p className="text-[12.5px] text-error" role="alert">{loadError}</p>
      ) : noCourier ? (
        <p className="text-[12.5px] text-slate">{t('courier.noCourier')}</p>
      ) : (
        <div className="flex flex-col gap-3">
          <Field label={t('courier.courier')}>
            <Select value={provider} onChange={(e) => { const next = e.target.value as CourierKey; setProvider(next); void checkCity(next); }} disabled={booking}>
              {providers.map((p) => <option key={p.provider} value={p.provider}>{p.label}{p.mode === 'sandbox' ? ` (${t('courier.sandbox')})` : ''}</option>)}
            </Select>
          </Field>
          {selected?.capabilities.cityList && (
            <p
              className={`text-[12.5px] ${city.state === 'ok' ? 'text-success' : city.state === 'bad' ? 'text-error' : 'text-slate'}`}
              role={city.state === 'bad' ? 'alert' : 'status'}
            >
              {destinationCity ? `${destinationCity}: ` : ''}{city.state === 'checking' ? '…' : city.text}
              {city.state === 'bad' && provider && (
                <button type="button" className="ml-2 underline cursor-pointer" onClick={() => void checkCity(provider)}>{t('courier.checkCity')}</button>
              )}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('courier.weight')} hint={settings ? `${settings.defaultWeightKg} kg` : undefined}>
              <Input type="number" min="0.01" max="100" step="0.01" placeholder="auto" value={weight} onChange={(e) => setWeight(e.target.value)} disabled={booking} />
            </Field>
            <Field label={t('courier.pieces')}>
              <Input type="number" min="1" max="99" step="1" value={pieces} onChange={(e) => setPieces(e.target.value)} disabled={booking} />
            </Field>
          </div>
          {noPickup && <p className="text-[12.5px] text-warning" role="alert">{t('courier.noPickup')}</p>}
          {error && <p className="text-[12.5px] text-error" role="alert">{error}</p>}
        </div>
      )}
    </Modal>
  );
}
