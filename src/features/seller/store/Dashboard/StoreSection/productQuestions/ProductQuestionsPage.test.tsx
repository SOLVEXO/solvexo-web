import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';

const calls: string[] = [];
const rows = [
  { id: 'q1', productId: 'P1', productName: 'Tee', productSlug: 'tee', askerName: 'Sara', askerEmail: 'sara@example.com', question: 'Does it shrink?', answer: '', answeredAt: null, status: 'pending', askedAt: '2026-11-01T10:00:00Z' },
  { id: 'q2', productId: 'P1', productName: 'Tee', productSlug: 'tee', askerName: 'Ali', askerEmail: '', question: 'Is it cotton?', answer: 'Yes', answeredAt: '2026-11-02T10:00:00Z', status: 'published', askedAt: '2026-11-01T10:00:00Z' },
];
vi.mock('@/components/layouts/StoreLayout', () => ({ useStoreWorkspace: () => ({ storeId: 'S1' }), StorePageHeader: ({ title }: { title: string }) => <h1>{title}</h1> }));
vi.mock('@/hooks/auth/useCan', () => ({ can: () => true }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ success: () => {}, error: () => {} }) }));
vi.mock('@/api/services/productQuestions', () => ({
  apiListQuestions: () => Promise.resolve({ items: rows, pending: 1, pagination: { page: 1, limit: 20, total: 2, totalPages: 1 } }),
  apiAnswerQuestion: (_s: string, id: string, b: { answer: string }) => { calls.push(`answer:${id}:${b.answer}`); return Promise.resolve({ data: { ok: true } }); },
  apiSetQuestionStatus: (_s: string, id: string, st: string) => { calls.push(`status:${id}:${st}`); return Promise.resolve({ data: { ok: true } }); },
  apiDeleteQuestion: (_s: string, id: string) => { calls.push(`delete:${id}`); return Promise.resolve({ data: { ok: true } }); },
}));
import ProductQuestionsPage from './ProductQuestionsPage';

afterEach(() => { cleanup(); calls.length = 0; });

describe('Product questions inbox', () => {
  it('lists questions with product, asker and status, and shows how many wait', async () => {
    render(<ProductQuestionsPage />);
    await screen.findByText('Does it shrink?');
    expect(screen.getByText(/Tee · Sara · sara@example.com/)).toBeTruthy();
    expect(screen.getByText('Waiting (1)')).toBeTruthy();
    expect(screen.getByText('Waiting for your answer')).toBeTruthy();
  });
  it('answering a question sends the text and publishes it', async () => {
    render(<ProductQuestionsPage />);
    await screen.findByText('Does it shrink?');
    fireEvent.change(screen.getByLabelText('Answer to: Does it shrink?'), { target: { value: 'No, pre-washed.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Answer and show' }));
    await waitFor(() => expect(calls).toContain('answer:q1:No, pre-washed.'));
  });
  it('a shown question can be hidden; delete asks first', async () => {
    render(<ProductQuestionsPage />);
    await screen.findByText('Is it cotton?');
    fireEvent.click(screen.getByRole('button', { name: 'Hide' }));
    await waitFor(() => expect(calls).toContain('status:q2:hidden'));
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false);
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    expect(calls.some(c => c.startsWith('delete'))).toBe(false);
  });
});
