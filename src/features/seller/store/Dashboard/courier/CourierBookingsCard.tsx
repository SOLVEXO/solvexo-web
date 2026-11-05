import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Download, Truck } from 'lucide-react';
import { Badge, Button, Card, SkeletonBox } from '@/components/comman/ui';
import { useToast } from '@/contexts/ToastContext';
import {
  apiBookCourier, apiCancelCourierBooking, apiDownloadCourierDocument, apiGetCourierBookings,
  type CourierBookingView,
} from '@/api/services/courier';
import { BookCourierModal } from './BookCourierModal';
import { COURIER_STATUS_COLOR, newIdempotencyKey } from './courierDisplay';

const message = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

/** Order detail: courier booking, tracking timeline, airway bill, COD info (read-only), RTO flag, cancel. */
export function CourierBookingsCard({ storeId, orderId, orderNumber, destinationCity, canBook, canBookNew, onChanged }: {
  storeId: string;
  orderId: string;
  orderNumber: string;
  destinationCity: string;
  /** orders.buy_shipping_label — without it the card only explains why it is unavailable. */
  canBook: boolean;
  /** The order can still be shipped (not pickup/digital/cancelled) — controls the "Book" button, not the history. */
  canBookNew: boolean;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const [bookings, setBookings] = useState<CourierBookingView[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [showBook, setShowBook] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchBookings = useCallback(
    () => apiGetCourierBookings(storeId, orderId).then((res) => ({ ok: true as const, data: res.data })).catch((e) => ({ ok: false as const, error: message(e, 'Could not load courier bookings') })),
    [storeId, orderId],
  );
  const apply = useCallback((r: Awaited<ReturnType<typeof fetchBookings>>) => {
    if (r.ok) { setBookings(r.data); setLoadError(''); } else { setLoadError(r.error); setBookings([]); }
  }, []);
  const load = useCallback(() => fetchBookings().then(apply), [fetchBookings, apply]);

  useEffect(() => {
    if (!canBook) return;
    let cancelled = false;
    void fetchBookings().then((r) => { if (!cancelled) apply(r); });
    return () => { cancelled = true; };
  }, [canBook, fetchBookings, apply]);

  if (!canBook) {
    return <Card><p className="text-[12.5px] text-slate" role="note">{t('courier.noPermission')}</p></Card>;
  }

  const active = (bookings ?? []).filter((b) => b.isActive && (b.bookingStatus === 'booked' || b.bookingStatus === 'fulfil_failed'));
  const history = (bookings ?? []).filter((b) => !active.includes(b) && b.bookingStatus !== 'failed');

  const afterChange = async () => { await load(); onChanged(); };

  const cancel = async (b: CourierBookingView) => {
    if (busyId || !window.confirm(t('courier.cancelConfirm'))) return;
    setBusyId(b.id); setError('');
    try { await apiCancelCourierBooking({ storeId, orderId, bookingId: b.id }); toast.success(t('courier.cancelled')); await afterChange(); }
    catch (e) { setError(message(e, 'Could not cancel')); }
    finally { setBusyId(null); }
  };

  const finish = async (b: CourierBookingView) => {
    if (busyId) return;
    setBusyId(b.id); setError('');
    try {
      await apiBookCourier({ orderId, storeId, provider: b.provider, items: b.items.length ? b.items : undefined }, newIdempotencyKey());
      await afterChange();
    } catch (e) { setError(message(e, 'Could not finish the booking')); }
    finally { setBusyId(null); }
  };

  const label = async (b: CourierBookingView) => {
    if (busyId) return;
    setBusyId(b.id); setError('');
    try { await apiDownloadCourierDocument(storeId, [b.id], 'airway_bill'); }
    catch (e) { setError(message(e, 'Could not download the airway bill')); }
    finally { setBusyId(null); }
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-[14px] font-bold text-charcoal flex items-center gap-2"><Truck size={15} /> {t('courier.title')}</p>
        {canBookNew && active.length === 0 && <Button size="sm" onClick={() => setShowBook(true)}>{t('courier.book')}</Button>}
      </div>

      {bookings === null ? (
        <div aria-busy="true"><SkeletonBox height="70px" rounded="10px" /></div>
      ) : loadError ? (
        <p className="text-[12.5px] text-error" role="alert">{loadError} <button type="button" className="underline cursor-pointer" onClick={() => void load()}>Retry</button></p>
      ) : active.length === 0 && history.length === 0 ? (
        <p className="text-[12.5px] text-slate">{canBookNew ? t('courier.noCourier') : '—'}</p>
      ) : null}

      {[...active, ...history].map((b) => {
        const isActive = active.includes(b);
        const status = b.courierStatus ?? 'booked';
        return (
          <div key={b.id} className={`border border-bone rounded-[10px] p-3 mb-3 last:mb-0 ${isActive ? '' : 'opacity-70'}`} data-testid={`courier-booking-${b.id}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] font-semibold text-charcoal">{b.providerLabel}{b.mode === 'sandbox' ? ` · ${t('courier.sandbox')}` : ''}</p>
              <Badge color={b.bookingStatus === 'cancelled' ? 'gray' : COURIER_STATUS_COLOR[status]}>
                {b.bookingStatus === 'cancelled' ? t('courier.statuses.cancelled') : t(`courier.statuses.${status}`)}
              </Badge>
            </div>
            {b.trackingNumber && (
              <p className="text-[12.5px] text-slate mt-1">
                {t('courier.tracking')}: <span className="font-mono text-charcoal">{b.trackingNumber}</span>
                {b.trackingUrl && <a className="ml-2 underline" href={b.trackingUrl} target="_blank" rel="noopener noreferrer">↗</a>}
              </p>
            )}
            <p className="text-[12.5px] text-slate mt-1">
              {t('courier.cod')}: {b.codAmount > 0 ? t('courier.codCollect', { amount: `${b.currency ?? ''} ${b.codAmount}`.trim() }) : t('courier.codPaid')}
              {b.cod?.status ? ` · ${t('courier.codCourierStatus', { status: b.cod.status })}` : ''}
            </p>

            {b.rto && (
              <div className="mt-2 rounded-[8px] bg-error-bg px-3 py-2 text-[12.5px] text-error flex gap-2" role="alert">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span><strong>{t('courier.rto')}</strong> — {t('courier.rtoHelp')}</span>
              </div>
            )}
            {b.bookingStatus === 'fulfil_failed' && (
              <div className="mt-2 rounded-[8px] bg-warning-bg px-3 py-2 text-[12.5px] text-warning" role="alert">
                {t('courier.finishHelp')}{b.error ? ` (${b.error})` : ''}
              </div>
            )}
            {b.lastSyncError && isActive && <p className="text-[11.5px] text-slate mt-1">{b.lastSyncError}</p>}

            {b.events.length > 0 ? (
              <details className="mt-2">
                <summary className="text-[12px] font-semibold text-charcoal cursor-pointer">{t('courier.events')} ({b.events.length})</summary>
                <ol className="mt-2 border-l border-bone pl-3 flex flex-col gap-2">
                  {[...b.events].reverse().map((e, i) => (
                    <li key={`${e.occurredAt}-${i}`} className="text-[12px] text-slate">
                      <span className="font-semibold text-charcoal">{t(`courier.statuses.${e.status}`)}</span>
                      {e.description && e.description !== e.rawStatus ? ` — ${e.description}` : ''}{e.location ? ` · ${e.location}` : ''}
                      <span className="block text-[11px]">{new Date(e.occurredAt).toLocaleString()}</span>
                    </li>
                  ))}
                </ol>
              </details>
            ) : isActive && <p className="text-[12px] text-slate mt-2">{t('courier.noEvents')}</p>}

            {isActive && (
              <div className="flex flex-wrap gap-2 mt-3">
                {b.bookingStatus === 'fulfil_failed' && <Button size="sm" onClick={() => void finish(b)} loading={busyId === b.id} disabled={busyId !== null}>{t('courier.finishBooking')}</Button>}
                {b.hasLabel && <Button size="sm" variant="outline" onClick={() => void label(b)} disabled={busyId !== null}><Download size={13} /> {t('courier.airwayBill')}</Button>}
                {(!b.courierStatus || b.courierStatus === 'booked') && <Button size="sm" variant="outline" onClick={() => void cancel(b)} loading={busyId === b.id} disabled={busyId !== null}>{t('courier.cancelBooking')}</Button>}
              </div>
            )}
          </div>
        );
      })}

      {canBookNew && active.length === 0 && history.length > 0 && (
        <p className="text-[12px] text-slate">{t('courier.cancelled')} — <button type="button" className="underline cursor-pointer" onClick={() => setShowBook(true)}>{t('courier.book')}</button></p>
      )}
      {error && <p className="text-[12.5px] text-error mt-2" role="alert">{error}</p>}

      {showBook && (
        <BookCourierModal
          storeId={storeId} orderId={orderId} orderNumber={orderNumber} destinationCity={destinationCity}
          onClose={() => setShowBook(false)}
          onBooked={() => { setShowBook(false); toast.success(t('courier.booked', { courier: '' }).trim()); void afterChange(); }}
        />
      )}
    </Card>
  );
}
