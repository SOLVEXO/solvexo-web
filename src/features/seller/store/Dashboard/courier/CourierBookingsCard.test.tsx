import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@/i18n';

const api = vi.hoisted(() => ({
  apiGetCourierBookings: vi.fn(),
  apiBookCourier: vi.fn(),
  apiCancelCourierBooking: vi.fn(),
  apiDownloadCourierDocument: vi.fn(),
  apiGetCourierOptions: vi.fn(),
  apiValidateCourierCity: vi.fn(),
}));
vi.mock('@/api/services/courier', () => api);
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }) }));

import { CourierBookingsCard } from './CourierBookingsCard';
import type { CourierBookingView } from '@/api/services/courier';

const booking = (over: Partial<CourierBookingView> = {}): CourierBookingView => ({
  id: 'b1', orderId: 'o1', provider: 'postex', providerLabel: 'PostEx', mode: 'sandbox', bookingStatus: 'booked', isActive: true,
  referenceNumber: '1001', trackingNumber: 'TRK123', trackingUrl: null, hasLabel: true, shipmentId: 's1', items: [], weightKg: 0.5, pieces: 1,
  codAmount: 1500, currency: 'PKR', courierStatus: 'in_transit', rawStatus: 'In transit', rto: false, rtoAt: null, cod: null,
  events: [{ status: 'in_transit', rawStatus: 'In transit', description: null, location: 'Lahore', occurredAt: new Date().toISOString() }],
  lastSyncedAt: null, lastSyncError: null, error: null, cancelledAt: null, createdAt: new Date().toISOString(),
  ...over,
});

const props = { storeId: 's1', orderId: 'o1', orderNumber: '1001', destinationCity: 'Lahore', canBook: true, canBookNew: true, onChanged: vi.fn() };

beforeEach(() => { Object.values(api).forEach((f) => f.mockReset()); props.onChanged.mockReset(); });
afterEach(() => cleanup());

describe('CourierBookingsCard', () => {
  it('shows a permission-denied note and never calls the API without orders.buy_shipping_label', () => {
    render(<CourierBookingsCard {...props} canBook={false} />);
    expect(screen.getByText(/do not have permission/i)).toBeInTheDocument();
    expect(api.apiGetCourierBookings).not.toHaveBeenCalled();
  });

  it('shows tracking, COD to collect, status and the event timeline', async () => {
    api.apiGetCourierBookings.mockResolvedValue({ data: [booking()] });
    render(<CourierBookingsCard {...props} />);
    expect(await screen.findByText('TRK123')).toBeInTheDocument();
    expect(screen.getByText(/Courier collects PKR 1500/)).toBeInTheDocument();
    expect(screen.getAllByText('In transit').length).toBeGreaterThan(0);
  });

  it('says "prepaid" when COD is 0', async () => {
    api.apiGetCourierBookings.mockResolvedValue({ data: [booking({ codAmount: 0 })] });
    render(<CourierBookingsCard {...props} />);
    expect(await screen.findByText(/Prepaid/)).toBeInTheDocument();
  });

  it('flags RTO prominently and explains that stock/refunds are not changed', async () => {
    api.apiGetCourierBookings.mockResolvedValue({ data: [booking({ rto: true, courierStatus: 'returned' })] });
    render(<CourierBookingsCard {...props} />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/RTO/);
    expect(screen.getByRole('alert')).toHaveTextContent(/not changed automatically/i);
  });

  it('offers to finish a booking whose order was not marked shipped (booked-but-fulfil-failed)', async () => {
    api.apiGetCourierBookings.mockResolvedValue({ data: [booking({ bookingStatus: 'fulfil_failed', error: 'stock race' })] });
    api.apiBookCourier.mockResolvedValue({ data: { booking: booking(), alreadyBooked: false } });
    render(<CourierBookingsCard {...props} />);
    fireEvent.click(await screen.findByRole('button', { name: /finish booking/i }));
    await waitFor(() => expect(api.apiBookCourier).toHaveBeenCalledTimes(1));
    expect(api.apiBookCourier.mock.calls[0][0]).toMatchObject({ orderId: 'o1', storeId: 's1', provider: 'postex' });
  });

  it('guards against a double click on Cancel booking (one request)', async () => {
    api.apiGetCourierBookings.mockResolvedValue({ data: [booking({ courierStatus: 'booked' })] });
    let resolve!: () => void;
    api.apiCancelCourierBooking.mockReturnValue(new Promise<void>((r) => { resolve = r; }));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<CourierBookingsCard {...props} />);
    const btn = await screen.findByRole('button', { name: /cancel booking/i });
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(api.apiCancelCourierBooking).toHaveBeenCalledTimes(1);
    resolve();
    await waitFor(() => expect(props.onChanged).toHaveBeenCalled());
  });

  it('shows an error state with Retry when loading fails', async () => {
    api.apiGetCourierBookings.mockRejectedValue(new Error('boom'));
    render(<CourierBookingsCard {...props} />);
    expect(await screen.findByText(/boom/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('shows the Book button only when the order can still be shipped', async () => {
    api.apiGetCourierBookings.mockResolvedValue({ data: [] });
    const { rerender } = render(<CourierBookingsCard {...props} />);
    expect(await screen.findByRole('button', { name: /book with courier/i })).toBeInTheDocument();
    rerender(<CourierBookingsCard {...props} canBookNew={false} />);
    await waitFor(() => expect(screen.queryByRole('button', { name: /book with courier/i })).toBeNull());
  });
});
