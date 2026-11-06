import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const confirm = vi.fn();
const cancel = vi.fn();
vi.mock('@/api/services/codProtection', () => ({
  apiGetCodConfirmation: (...a: unknown[]) => get(...a),
  apiConfirmCodByLink: (...a: unknown[]) => confirm(...a),
  apiCancelCodByLink: (...a: unknown[]) => cancel(...a),
}));

import { DefaultCodConfirmPage } from './DefaultCodConfirmPage';

const view = (status: string) => ({ storeName: 'Shop', orderNumber: '1001', total: 2500, currency: 'PKR', itemCount: 2, status, expiresAt: '2030-01-01T00:00:00Z' });
const renderPage = () => render(<MemoryRouter initialEntries={['/cod-confirm/tok123']}><Routes><Route path="/cod-confirm/:token" element={<DefaultCodConfirmPage />} /></Routes></MemoryRouter>);

beforeEach(() => { get.mockReset(); confirm.mockReset(); cancel.mockReset(); });
afterEach(cleanup);

describe('DefaultCodConfirmPage', () => {
  it('shows the order and confirms it; the result replaces the buttons', async () => {
    get.mockResolvedValue(view('awaiting'));
    confirm.mockResolvedValue(view('confirmed'));
    renderPage();
    expect(await screen.findByText(/order #1001/)).toBeTruthy();
    expect(get).toHaveBeenCalledWith('tok123');
    fireEvent.click(screen.getByRole('button', { name: 'Yes, confirm my order' }));
    expect(await screen.findByText(/Your order is confirmed/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'No, cancel it' })).toBeNull();
  });

  it('cancels the order from the link', async () => {
    get.mockResolvedValue(view('awaiting'));
    cancel.mockResolvedValue(view('cancelled'));
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'No, cancel it' }));
    expect(await screen.findByText('Your order has been cancelled.')).toBeTruthy();
  });

  it('an already confirmed or expired order shows its state without buttons', async () => {
    get.mockResolvedValue(view('expired'));
    renderPage();
    expect(await screen.findByText(/time to confirm this order has passed/)).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('a link that is not valid shows a clear message (404), a network failure offers a retry', async () => {
    get.mockRejectedValueOnce({ response: { status: 404 } });
    renderPage();
    expect(await screen.findByText(/This link is not valid any more/)).toBeTruthy();
    cleanup();
    get.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(view('awaiting'));
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Yes, confirm my order' })).toBeTruthy());
  });

  it('a failed confirm keeps the buttons and shows the error', async () => {
    get.mockResolvedValue(view('awaiting'));
    confirm.mockRejectedValue(new Error('boom'));
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Yes, confirm my order' }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Yes, confirm my order' })).toBeTruthy();
  });
});
