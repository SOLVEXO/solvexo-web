import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
let allowManage = true;
vi.mock('@/api/client', () => ({ default: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a), patch: (...a: unknown[]) => patch(...a), delete: vi.fn() } }));
vi.mock('@/components/layouts/StoreLayout', () => ({ useStoreWorkspace: () => ({ storeId: 's1' }), hasNavPermission: () => allowManage }));
vi.mock('@/api/services/auth', () => ({ TokenStorage: { getUser: () => ({ role: 'seller' }) } }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));

import FulfillmentTab from './FulfillmentTab';

const svc = { _id: 'f1', name: 'Karachi 3PL', provider: 'generic_http', endpointUrl: 'https://3pl.example.com/hook', secretHint: '...abcd', status: 'active', locationId: 'l1', autoRoute: false, trackInventory: true, lastCallbackAt: null };
const req = { _id: 'r1', serviceId: 'f1', orderId: 'o1', orderNumber: 'ORD-9', status: 'failed', attempts: 4, lastError: 'The service answered HTTP 500', externalId: null, tracking: null, items: [{ itemId: 'i1', sku: 'S', title: 'Shirt', quantity: 2 }], createdAt: '2026-11-01T10:00:00Z' };

beforeEach(() => {
  get.mockReset(); post.mockReset(); patch.mockReset(); allowManage = true;
  get.mockImplementation((url: string) => Promise.resolve(url.includes('/requests/list') ? { items: [req], total: 1, page: 1, limit: 15 } : [svc]));
});
afterEach(cleanup);

describe('FulfillmentTab', () => {
  it('lists services and requests with the failure reason and a retry', async () => {
    render(<FulfillmentTab />);
    expect(await screen.findByText('Karachi 3PL')).toBeTruthy();
    expect(screen.getByText('Order #ORD-9')).toBeTruthy();
    expect(screen.getByText('The service answered HTTP 500')).toBeTruthy();
    post.mockResolvedValue({});
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    await waitFor(() => expect(post.mock.calls[0][0]).toBe('/api/fulfillment-services/s1/requests/r1/retry'));
  });

  it('hides connect / switch / retry from people who may only view', async () => {
    allowManage = false;
    render(<FulfillmentTab />);
    await screen.findByText('Karachi 3PL');
    expect(screen.queryByRole('button', { name: /connect service/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /try again/i })).toBeNull();
  });

  it('connecting posts the typed fields and shows the secret once', async () => {
    post.mockResolvedValue({ ...svc, secret: 'whsec_abc123' });
    render(<FulfillmentTab />);
    await screen.findByText('Karachi 3PL');
    fireEvent.click(screen.getByRole('button', { name: /connect service/i }));
    fireEvent.change(await screen.findByLabelText('Name'), { target: { value: 'Lahore WH' } });
    fireEvent.change(screen.getByLabelText(/their https address/i), { target: { value: 'https://wh.example.com/in' } });
    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][1]).toEqual({ name: 'Lahore WH', provider: 'generic_http', endpointUrl: 'https://wh.example.com/in', autoRoute: false });
    expect(await screen.findByText('whsec_abc123')).toBeTruthy();
  });

  it('shows a retry when loading fails', async () => {
    get.mockRejectedValue(new Error('down'));
    render(<FulfillmentTab />);
    expect(await screen.findByRole('button', { name: /retry/i })).toBeTruthy();
  });
});
