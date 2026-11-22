import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// The page's reveal animations watch scrolling; jsdom has no IntersectionObserver.
globalThis.IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } } as unknown as typeof IntersectionObserver;

vi.mock('@/hooks/useFaqs', () => ({
  useFaqs: () => ({ faqs: [{ _id: 'f1', question: 'How do I reset my password?', answer: 'Use Forgot password.', category: 'account' }], loading: false, error: null, refetch: vi.fn() }),
  useFaqCategories: () => ['account'],
}));
vi.mock('@/components/comman/ui/Footer', () => ({ Footer: () => null }));

import { FaqPage } from './FaqPage';

afterEach(cleanup);

describe('FAQ page', () => {
  it('shows the seller questions above the stored FAQs, and hides them while searching', () => {
    render(<MemoryRouter><FaqPage /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'For sellers' })).toBeInTheDocument();
    expect(screen.getByText('Is Solvexo free?')).toBeInTheDocument();
    expect(screen.getByText('How do I reset my password?')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Search for a question…'), { target: { value: 'password' } });
    expect(screen.queryByRole('heading', { name: 'For sellers' })).toBeNull();
  });
});
