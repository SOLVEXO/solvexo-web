import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const list = vi.fn();
const remove = vi.fn();
const setReview = vi.fn();
vi.mock('@/api/services/platformPlans', () => ({
  apiAdminListComplimentary: () => list(),
  apiAdminRemoveComplimentary: (...a: unknown[]) => remove(...a),
  apiAdminSetComplimentaryReview: (...a: unknown[]) => setReview(...a),
}));

import { ComplimentaryPlansPanel } from './ComplimentaryPlansPanel';

const row = (over: Record<string, unknown> = {}) => ({
  storeId: 's1', storeName: 'Ali Shoes', sellerId: 'u1', planName: 'Enterprise', planPriceUSD: 179, reason: 'Partner agency',
  grantedBy: 'Admin Amy', grantedAt: '2026-11-01T00:00:00Z', reviewAt: '2026-11-25T00:00:00Z', daysToReview: 5, reviewState: 'soon', status: 'active', ...over,
});
const data = (items: unknown[]) => ({ data: { items, count: items.length, dueSoon: 1, overdue: 0, monthlyValueUSD: 179 } });

describe('ComplimentaryPlansPanel', () => {
  beforeEach(() => {
    list.mockReset(); remove.mockReset(); setReview.mockReset();
    // jsdom has no matchMedia (the action menu's popover reads it).
    if (!window.matchMedia) {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (q: string) => ({ matches: false, media: q, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false, onchange: null }),
      });
    }
  });

  it('shows who gave the plan, why, the review state and the value given away', async () => {
    list.mockResolvedValue(data([row()]));
    render(<ComplimentaryPlansPanel />);
    expect((await screen.findAllByText('Ali Shoes')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Partner agency').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Admin Amy/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('In 5 days').length).toBeGreaterThan(0);
    expect(screen.getByText('Value given away / month')).toBeTruthy();
  });

  it('empty state explains where complimentary plans come from', async () => {
    list.mockResolvedValue(data([]));
    render(<ComplimentaryPlansPanel />);
    expect(await screen.findByText('No complimentary plans')).toBeTruthy();
  });

  it('a load error offers Retry', async () => {
    list.mockRejectedValueOnce(new Error('boom')).mockResolvedValue(data([row()]));
    render(<ComplimentaryPlansPanel />);
    fireEvent.click(await screen.findByText('Retry'));
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    expect((await screen.findAllByText('Ali Shoes')).length).toBeGreaterThan(0);
  });

  it('"Keep" moves the review date; "End" asks to confirm and then removes the plan', async () => {
    list.mockResolvedValue(data([row({ reviewState: 'overdue', daysToReview: -2 })]));
    setReview.mockResolvedValue({});
    remove.mockResolvedValue({});
    render(<ComplimentaryPlansPanel />);
    expect((await screen.findAllByText('Needs a decision')).length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByLabelText('Complimentary plan actions for Ali Shoes')[0]);
    fireEvent.click(await screen.findByText('Keep — review again in 30 days'));
    await waitFor(() => expect(setReview).toHaveBeenCalledWith('s1', expect.any(String)));

    fireEvent.click(screen.getAllByLabelText('Complimentary plan actions for Ali Shoes')[0]);
    fireEvent.click(await screen.findByText('End complimentary plan'));
    expect(await screen.findByText(/sees the "Select a plan" screen/)).toBeTruthy();
    fireEvent.click(screen.getByText('End plan'));
    await waitFor(() => expect(remove).toHaveBeenCalledWith('s1', undefined));
  });
});
