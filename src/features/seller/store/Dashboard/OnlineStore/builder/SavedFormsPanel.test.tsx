import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SavedFormsPanel } from './SavedFormsPanel';

const listMock = vi.fn();
const saveMock = vi.fn();
const deleteMock = vi.fn();
vi.mock('@/api/services/storeContact', () => ({
  apiListSavedForms: (...a: unknown[]) => listMock(...a),
  apiSaveForm: (...a: unknown[]) => saveMock(...a),
  apiDeleteSavedForm: (...a: unknown[]) => deleteMock(...a),
}));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));

const quote = { _id: 'a'.repeat(24), name: 'Quote', settings: { fields: [{ id: 'em', type: 'email', label: 'Email' }], buttonLabel: 'Ask' } };

describe('saved forms panel', () => {
  beforeEach(() => { listMock.mockReset().mockResolvedValue({ data: [quote] }); saveMock.mockReset(); deleteMock.mockReset().mockResolvedValue({ success: true }); });
  afterEach(cleanup);
  const open = async (settings: Record<string, unknown>, set = vi.fn()) => {
    render(<SavedFormsPanel storeId="s1" settings={settings} set={set} />);
    fireEvent.click(screen.getByText('Saved forms'));
    await waitFor(() => expect(screen.getByText('Quote')).toBeTruthy());
    return set;
  };

  it('uses a saved form straight away on an empty form, and asks before replacing a filled one', async () => {
    const set = await open({ fields: [] });
    fireEvent.click(screen.getByRole('button', { name: 'Use' }));
    expect(set).toHaveBeenCalledWith(quote.settings);
    cleanup();
    const set2 = await open({ fields: [{ id: 'x1', type: 'text', label: 'A' }] });
    fireEvent.click(screen.getByRole('button', { name: 'Use' }));
    expect(set2).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Replace' }));
    expect(set2).toHaveBeenCalledWith(quote.settings);
  });

  it('saves the current form under a name and deletes a saved one', async () => {
    saveMock.mockResolvedValue({ data: { _id: 'b'.repeat(24), name: 'New', settings: {} } });
    await open({ fields: [{ id: 'x1', type: 'text', label: 'A' }] });
    const save = screen.getByRole('button', { name: 'Save this form' }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Name for this saved form'), { target: { value: 'New' } });
    fireEvent.click(save);
    await waitFor(() => expect(saveMock).toHaveBeenCalledWith('s1', 'New', { fields: [{ id: 'x1', type: 'text', label: 'A' }] }));
    await waitFor(() => expect(screen.getByText('New')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Delete saved form Quote' }));
    await waitFor(() => expect(screen.queryByText('Quote')).toBeNull());
  });

  it('shows a retry when the list cannot be loaded', async () => {
    listMock.mockRejectedValueOnce(new Error('Server down'));
    render(<SavedFormsPanel storeId="s1" settings={{}} set={vi.fn()} />);
    fireEvent.click(screen.getByText('Saved forms'));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Server down'));
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.getByText('Quote')).toBeTruthy());
  });
});
