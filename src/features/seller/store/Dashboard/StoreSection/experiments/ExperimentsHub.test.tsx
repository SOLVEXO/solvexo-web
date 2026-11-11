import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
const del = vi.fn();
let allowManage = true;
vi.mock('@/api/client', () => ({ default: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a), patch: (...a: unknown[]) => patch(...a), delete: (...a: unknown[]) => del(...a) } }));
vi.mock('@/components/layouts/StoreLayout', () => ({
  useStoreWorkspace: () => ({ storeId: 's1' }),
  hasNavPermission: () => allowManage,
  StorePageHeader: ({ title, actions }: { title: string; actions?: React.ReactNode }) => <div><h1>{title}</h1>{actions}</div>,
}));
vi.mock('@/api/services/auth', () => ({ TokenStorage: { getUser: () => ({ role: 'seller' }) } }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));

import ExperimentsHub from './ExperimentsHub';

const SEC = 'a'.repeat(24);
const exp = (extra: object = {}) => ({ _id: 'x1', name: 'Hero heading', kind: 'section', status: 'draft', trafficPercent: 100, splitB: 50, sectionId: SEC, variantBName: 'Short', overrides: { heading: 'New' }, startedAt: null, stoppedAt: null, winner: null, appliedAt: null, ...extra });
const page = { _id: 'p1', title: 'Home', sections: [{ _id: SEC, type: 'hero', settings: { heading: 'Welcome', showTimer: false, columns: 3, html: '<b>x</b>' } }] };
let list: unknown[] = [];

beforeEach(() => {
  get.mockReset(); post.mockReset(); patch.mockReset(); del.mockReset(); allowManage = true; list = [exp()];
  get.mockImplementation((url: string) => Promise.resolve(url.includes('/results') ? { experimentId: 'x1', status: 'running', winner: null, startedAt: null, variants: { a: { visits: 400, addedToCart: 50, reachedCheckout: 30, orders: 20, conversionRate: 5 }, b: { visits: 400, addedToCart: 80, reachedCheckout: 50, orders: 60, conversionRate: 15 } }, verdict: 'likely', z: 4.4, p: 0, leader: 'b' }
    : url.includes('store-pages') || url.includes('pages') ? { success: true, data: [page] } : list));
});
afterEach(cleanup);

describe('ExperimentsHub', () => {
  it('lists experiments and starts a draft', async () => {
    post.mockResolvedValue({});
    render(<ExperimentsHub />);
    expect(await screen.findByText('Hero heading')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    await waitFor(() => expect(post.mock.calls[0][0]).toBe('/api/experiments/s1/x1/start'));
  });

  it('view-only people get no New / Start / Delete', async () => {
    allowManage = false;
    render(<ExperimentsHub />);
    await screen.findByText('Hero heading');
    for (const n of [/new experiment/i, 'Start', 'Delete', 'Edit']) expect(screen.queryByRole('button', { name: n })).toBeNull();
  });

  it('results show both versions and the plain-language verdict', async () => {
    list = [exp({ status: 'running' })];
    render(<ExperimentsHub />);
    fireEvent.click(await screen.findByRole('button', { name: 'Results' }));
    expect(await screen.findByText(/very likely better/)).toBeTruthy();
    expect(screen.getByText(/60 orders · 15%/)).toBeTruthy();
  });

  it('stopping asks first; a stopped test can pick a winner', async () => {
    post.mockResolvedValue({});
    list = [exp({ status: 'running' })];
    const { unmount } = render(<ExperimentsHub />);
    fireEvent.click(await screen.findByRole('button', { name: 'Stop' }));
    expect(post).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(post.mock.calls[0][0]).toBe('/api/experiments/s1/x1/stop'));
    unmount();
    list = [exp({ status: 'stopped' })];
    render(<ExperimentsHub />);
    fireEvent.click(await screen.findByRole('button', { name: 'Use B for everyone' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(post.mock.calls[1]).toEqual(['/api/experiments/s1/x1/winner', { winner: 'b' }]));
  });

  it('creating a section test offers only plain settings of the chosen section and posts the ticked ones', async () => {
    post.mockResolvedValue({});
    render(<ExperimentsHub />);
    await screen.findByText('Hero heading');
    fireEvent.click(screen.getByRole('button', { name: /new experiment/i }));
    fireEvent.change(await screen.findByLabelText('Name'), { target: { value: 'Heading test' } });
    fireEvent.change(await screen.findByDisplayValue('Choose a page'), { target: { value: 'p1' } });
    fireEvent.change(screen.getByDisplayValue('Choose a section'), { target: { value: SEC } });
    const names = screen.getAllByLabelText('Setting name').map((i) => (i as HTMLInputElement).value);
    expect(names).toEqual(['heading', 'showTimer', 'columns']); // html (markup) is never offered
    fireEvent.change(screen.getAllByLabelText('Setting value')[0], { target: { value: 'Big sale' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][0]).toBe('/api/experiments/s1');
    expect(post.mock.calls[0][1]).toMatchObject({ name: 'Heading test', kind: 'section', sectionId: SEC, trafficPercent: 100, splitB: 50, overrides: { heading: 'Big sale' } });
  });

  it('shows a retry when loading fails', async () => {
    get.mockRejectedValue(new Error('down'));
    render(<ExperimentsHub />);
    expect(await screen.findByRole('button', { name: /retry/i })).toBeTruthy();
  });
});
