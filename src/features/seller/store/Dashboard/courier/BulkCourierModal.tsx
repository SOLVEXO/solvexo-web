import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { Button, Field, Modal, Select, SkeletonBox } from '@/components/comman/ui';
import {
  apiBulkBookCourier, apiDownloadCourierDocument, apiGetCourierOptions,
  type BookableCourier, type BulkBookResult, type CourierKey,
} from '@/api/services/courier';
import { newIdempotencyKey } from './courierDisplay';

const message = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

/** Orders list: book many selected orders with one courier, then download combined airway bills / load sheet. */
export function BulkCourierModal({ storeId, orders, onClose, onDone }: {
  storeId: string;
  /** Selected orders: id + the number shown to the seller. */
  orders: { orderId: string; orderNumber: string }[];
  onClose: () => void;
  /** Called once after a run that booked at least one order, so the list can refresh. */
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [providers, setProviders] = useState<BookableCourier[]>([]);
  const [provider, setProvider] = useState<CourierKey | ''>('');
  const [running, setRunning] = useState(false);
  const [downloading, setDownloading] = useState<null | 'airway_bill' | 'load_sheet'>(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState<BulkBookResult | null>(null);
  const keyRef = useRef(newIdempotencyKey());
  const numberById = new Map(orders.map((o) => [o.orderId, o.orderNumber]));

  useEffect(() => {
    let cancelled = false;
    apiGetCourierOptions(storeId)
      .then((res) => {
        if (cancelled) return;
        setProviders(res.data.providers);
        const preferred = res.data.providers.find((p) => p.provider === res.data.settings.defaultProvider) ?? res.data.providers[0];
        if (preferred) setProvider(preferred.provider);
      })
      .catch((e) => { if (!cancelled) setLoadError(message(e, 'Could not load couriers')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId]);

  const selected = providers.find((p) => p.provider === provider);

  const run = async () => {
    if (running || !provider) return;
    setRunning(true); setError('');
    try {
      const res = await apiBulkBookCourier({ storeId, orderIds: orders.map((o) => o.orderId), provider }, keyRef.current);
      setResult(res.data);
      if (res.data.succeeded > 0) onDone();
    } catch (e) {
      setError(message(e, 'Bulk booking failed'));
      keyRef.current = newIdempotencyKey();
    } finally { setRunning(false); }
  };

  const download = async (kind: 'airway_bill' | 'load_sheet') => {
    if (!result || downloading) return;
    setDownloading(kind); setError('');
    try { await apiDownloadCourierDocument(storeId, result.bookingIds, kind); }
    catch (e) { setError(message(e, 'Download failed')); }
    finally { setDownloading(null); }
  };

  return (
    <Modal
      title={t('courier.bulkTitle')}
      width={560}
      mobileSheet
      onClose={() => { if (!running) onClose(); }}
      footer={
        result ? (
          <Button size="sm" onClick={onClose}>{t('courier.close')}</Button>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={onClose} disabled={running}>{t('courier.close')}</Button>
            <Button size="sm" onClick={() => void run()} loading={running} disabled={loading || !provider || orders.length === 0}>
              {t('courier.bulkRun', { count: orders.length })}
            </Button>
          </>
        )
      }
    >
      {loading ? (
        <div aria-busy="true"><SkeletonBox height="48px" rounded="10px" /></div>
      ) : loadError ? (
        <p className="text-[12.5px] text-error" role="alert">{loadError}</p>
      ) : providers.length === 0 ? (
        <p className="text-[12.5px] text-slate">{t('courier.noCourier')}</p>
      ) : result ? (
        <div className="flex flex-col gap-3">
          <p className={`text-[13px] font-semibold ${result.failed ? 'text-warning' : 'text-success'}`} role="status">
            {t('courier.bulkDone', { ok: result.succeeded, total: result.total })}
          </p>
          <div className="max-h-[260px] overflow-auto border border-bone rounded-[10px]">
            <table className="w-full text-[12.5px]">
              <thead className="bg-mist text-slate text-left">
                <tr><th className="px-3 py-2">{t('courier.order')}</th><th className="px-3 py-2">{t('courier.result')}</th></tr>
              </thead>
              <tbody>
                {result.results.map((r) => (
                  <tr key={r.orderId} className="border-t border-bone">
                    <td className="px-3 py-2 font-mono">{numberById.get(r.orderId) ?? r.orderId}</td>
                    <td className={`px-3 py-2 ${r.ok ? 'text-success' : 'text-error'}`}>
                      {r.ok ? `${r.trackingNumber ?? ''}${r.alreadyBooked ? ` (${t('courier.alreadyBooked')})` : ''}` : r.error}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.bookingIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected?.capabilities.airwayBill !== false && (
                <Button size="sm" variant="outline" onClick={() => void download('airway_bill')} loading={downloading === 'airway_bill'} disabled={downloading !== null}>
                  <Download size={13} /> {t('courier.bulkLabels')}
                </Button>
              )}
              {selected?.capabilities.loadSheet && (
                <Button size="sm" variant="outline" onClick={() => void download('load_sheet')} loading={downloading === 'load_sheet'} disabled={downloading !== null}>
                  <Download size={13} /> {t('courier.bulkLoadSheet')}
                </Button>
              )}
            </div>
          )}
          {error && <p className="text-[12.5px] text-error" role="alert">{error}</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Field label={t('courier.courier')}>
            <Select value={provider} onChange={(e) => setProvider(e.target.value as CourierKey)} disabled={running}>
              {providers.map((p) => <option key={p.provider} value={p.provider}>{p.label}{p.mode === 'sandbox' ? ` (${t('courier.sandbox')})` : ''}</option>)}
            </Select>
          </Field>
          <p className="text-[12.5px] text-slate">{orders.length} · {orders.map((o) => o.orderNumber).slice(0, 8).join(', ')}{orders.length > 8 ? '…' : ''}</p>
          {running && <p className="text-[12.5px] text-slate" role="status" aria-live="polite">{t('courier.booking')}</p>}
          {error && <p className="text-[12.5px] text-error" role="alert">{error}</p>}
        </div>
      )}
    </Modal>
  );
}
