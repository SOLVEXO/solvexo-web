import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
vi.mock('@/api/client', () => ({ default: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a), patch: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
vi.mock('@/components/layouts/StoreLayout', () => ({
  useStoreWorkspace: () => ({ storeId: 's1' }),
  StorePageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

import Help from './Help';

const page = (tier: string, items: unknown[] = []) => ({ items, total: items.length, page: 1, limit: 10, tier });
const row = {
  _id: 'r1', subject: 'Payout late', message: 'Where is my payout', category: 'payments', status: 'read', tier: 'priority',
  createdAt: '2026-01-01T10:00:00Z',
  replies: [{ message: 'It is on the way', sentAt: '2026-01-02T10:00:00Z', sentBy: 'Solvexo Admin' }],
};

const renderHelp = () => render(<MemoryRouter><Help /></MemoryRouter>);

afterEach(cleanup);
beforeEach(() => {
  get.mockReset(); post.mockReset();
  get.mockResolvedValue(page('priority', [row]));
});

describe('Help page', () => {
  it('shows the tier badge without any time promise and lists my requests', async () => {
    renderHelp();
    expect((await screen.findAllByText('Priority')).length).toBeGreaterThan(0);
    expect(await screen.findByText('Payout late')).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/\d+\s*(hours?|hrs?|minutes?|business days?)/i);
  });

  it('shows the admin reply when a request is expanded', async () => {
    renderHelp();
    fireEvent.click(await screen.findByRole('button', { name: /Payout late/ }));
    expect(await screen.findByText('It is on the way')).toBeTruthy();
  });

  it('validates the form and does not send an empty request', async () => {
    renderHelp();
    fireEvent.click(await screen.findByRole('button', { name: 'Send request' }));
    expect(await screen.findByText('Write a short subject.')).toBeTruthy();
    expect(screen.getByText('Tell us what is going on.')).toBeTruthy();
    expect(post).not.toHaveBeenCalled();
  });

  it('submits without a tier in the body and shows the success state', async () => {
    post.mockResolvedValue({ success: true, data: row });
    renderHelp();
    await screen.findByText('Payout late');
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Help me' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Something broke' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send request' }));
    expect(await screen.findByText('Request sent')).toBeTruthy();
    const [url, body] = post.mock.calls[0] as [string, Record<string, unknown>];
    expect(url).toBe('/api/support/s1/requests');
    expect(body).toEqual({ category: 'other', subject: 'Help me', message: 'Something broke' });
    expect('tier' in body).toBe(false);
  });

  it('shows an empty state when there are no requests', async () => {
    get.mockResolvedValue(page('standard', []));
    renderHelp();
    expect(await screen.findByText('No requests yet')).toBeTruthy();
    expect(screen.getAllByText('Standard').length).toBeGreaterThan(0);
  });

  it('shows an error with a retry when the list cannot be loaded', async () => {
    get.mockRejectedValueOnce(new Error('boom'));
    renderHelp();
    expect(await screen.findByRole('alert')).toBeTruthy();
    get.mockResolvedValue(page('standard', [row]));
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.getByText('Payout late')).toBeTruthy());
  });
});
