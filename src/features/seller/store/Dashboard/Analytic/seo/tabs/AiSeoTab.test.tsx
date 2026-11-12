import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const generate = vi.fn();
const accept = vi.fn();
const history = vi.fn();
const getProduct = vi.fn();

vi.mock('@/api/services/seo/seller/ai.service', () => ({
  apiGenerateSeoAiSuggestion: (...a: unknown[]) => generate(...a),
  apiGenerateSeoAiSuggestionBulk: vi.fn(),
  apiAcceptSeoAiSuggestion: (...a: unknown[]) => accept(...a),
  apiGetSeoAiSuggestionHistory: (...a: unknown[]) => history(...a),
}));
vi.mock('@/api/services/product', () => ({ apiGetMyProductById: (...a: unknown[]) => getProduct(...a) }));
vi.mock('@/features/seller/store/Dashboard/OnlineStore/builder/EntityPickerModal', () => ({
  EntityPickerModal: ({ open, onConfirm }: { open: boolean; onConfirm: (ids: string[]) => void }) =>
    open ? <button onClick={() => onConfirm(['p1'])}>pick-p1</button> : null,
}));

import { AiSeoTab } from './AiSeoTab';

const preview = { metaTitle: 'Great title', metaDescription: 'Great description', keywords: ['a', 'b'], suggestionId: 'sg1', applied: false };
const emptyHistory = { data: { items: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } } };

afterEach(cleanup);

beforeEach(() => {
  generate.mockReset(); accept.mockReset(); history.mockReset(); getProduct.mockReset();
  history.mockResolvedValue(emptyHistory);
  getProduct.mockResolvedValue({ data: { product: { name: 'Blue Shirt' } } });
  generate.mockResolvedValue({ data: preview });
  accept.mockResolvedValue({ data: { applied: true, alreadyApplied: false, entityType: 'product', entityId: 'p1' } });
});

async function chooseProduct() {
  fireEvent.click(screen.getByRole('button', { name: /Choose product/ }));
  fireEvent.click(await screen.findByText('pick-p1'));
  await screen.findByText('Blue Shirt');
}

describe('AiSeoTab', () => {
  it('keeps Generate disabled until a product is chosen, then shows a preview without accepting', async () => {
    render(<AiSeoTab storeId="s1" />);
    const gen = screen.getByRole('button', { name: /Generate/ });
    expect((gen as HTMLButtonElement).disabled).toBe(true);
    await chooseProduct();
    expect(screen.getByRole('button', { name: 'Change' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Generate/ }));
    expect(await screen.findByText('Great title')).toBeTruthy();
    expect(screen.getByText(/nothing has changed yet/)).toBeTruthy();
    expect(generate).toHaveBeenCalledWith('s1', { entityType: 'product', entityId: 'p1' });
    expect(accept).not.toHaveBeenCalled();
  });

  it('"Use this" calls accept once with the suggestionId and shows the applied state', async () => {
    render(<AiSeoTab storeId="s1" />);
    await chooseProduct();
    fireEvent.click(screen.getByRole('button', { name: /Generate/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Use this/ }));
    expect(await screen.findByText('Applied to your product.')).toBeTruthy();
    expect(accept).toHaveBeenCalledTimes(1);
    expect(accept).toHaveBeenCalledWith('s1', 'sg1');
  });

  it('Discard closes the preview and never calls accept', async () => {
    render(<AiSeoTab storeId="s1" />);
    await chooseProduct();
    fireEvent.click(screen.getByRole('button', { name: /Generate/ }));
    await screen.findByText('Great title');
    fireEvent.click(screen.getByRole('button', { name: /Discard/ }));
    await waitFor(() => expect(screen.queryByText('Great title')).toBeNull());
    expect(accept).not.toHaveBeenCalled();
  });

  it('Store type needs no picker and uses the store id', async () => {
    render(<AiSeoTab storeId="s1" />);
    fireEvent.change(screen.getByLabelText('Entity Type'), { target: { value: 'store' } });
    expect(screen.queryByRole('button', { name: /Choose product/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Generate/ }));
    await screen.findByText('Great title');
    expect(generate).toHaveBeenCalledWith('s1', { entityType: 'store', entityId: 's1' });
  });

  it('shows the API error when generating fails', async () => {
    generate.mockRejectedValue(new Error('AI SEO suggestions are not switched on yet. Nothing was charged.'));
    render(<AiSeoTab storeId="s1" />);
    await chooseProduct();
    fireEvent.click(screen.getByRole('button', { name: /Generate/ }));
    expect((await screen.findByRole('alert')).textContent).toContain('not switched on yet');
  });

  it('history rows show Applied / Preview only and a preview row can be applied', async () => {
    const row = (id: string, accepted: boolean) => ({
      _id: id, storeId: 's1', sellerId: 'u', entityType: 'product', entityId: 'p1',
      suggestion: { metaTitle: `Title ${id}` }, accepted, creditsCost: 5, createdAt: '2026-01-01T00:00:00Z',
    });
    history.mockResolvedValue({ data: { items: [row('h1', true), row('h2', false)], pagination: { page: 1, limit: 10, total: 2, pages: 1 } } });
    render(<AiSeoTab storeId="s1" />);
    expect(await screen.findByText('Applied')).toBeTruthy();
    expect(screen.getByText('Preview only')).toBeTruthy();
    const useButtons = screen.getAllByRole('button', { name: 'Use this' });
    expect(useButtons).toHaveLength(1);
    fireEvent.click(useButtons[0]);
    await waitFor(() => expect(accept).toHaveBeenCalledWith('s1', 'h2'));
    await waitFor(() => expect(history.mock.calls.length).toBeGreaterThan(1));
  });
});
