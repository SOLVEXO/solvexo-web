import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const api = vi.hoisted(() => ({ apiImportLeads: vi.fn(), apiDemoRequest: vi.fn() }));
vi.mock('@/api/services/salesOps', async (orig) => ({ ...(await orig<typeof import('@/api/services/salesOps')>()), ...api }));
vi.mock('@/hooks/auth/useSellEntry', () => ({ useSellEntry: () => ({ go: vi.fn(), loading: false }) }));
vi.mock('@/components/comman/ui/Footer', () => ({ Footer: () => null }));

// The marketing page's reveal animations watch scrolling; jsdom has no IntersectionObserver.
globalThis.IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } } as unknown as typeof IntersectionObserver;

import { ImportLeadsModal } from './ImportLeadsModal';
import { guessMapping } from './importMapping';
import { BookDemoPage } from '@/features/buyer/pages/BookDemoPage';

afterEach(() => { cleanup(); vi.clearAllMocks(); sessionStorage.clear(); });

describe('guessMapping', () => {
  it('matches common header names, and never reads "Contact No" as the name', () => {
    expect(guessMapping(['Contact Name', 'Shop', 'Contact No', 'E-mail', 'City', 'Category', 'Budget', 'Remarks']))
      .toEqual({ name: 0, businessName: 1, phone: 2, email: 3, city: 4, businessType: 5, dealValuePKR: 6, note: 7 });
  });
});

describe('ImportLeadsModal', () => {
  it('reads a CSV, checks it, then imports the new rows', async () => {
    api.apiImportLeads
      .mockResolvedValueOnce({ data: { total: 2, created: 0, wouldCreate: 1, dryRun: true, duplicates: [{ row: 3, name: 'Old', existingLeadId: 'l9' }], invalid: [] } })
      .mockResolvedValueOnce({ data: { total: 2, created: 1, wouldCreate: 1, dryRun: false, duplicates: [], invalid: [] } });
    const onImported = vi.fn();
    render(<MemoryRouter><ImportLeadsModal owners={[{ _id: 'a2', name: 'Bilal', email: 'b@x' }]} canAssign onClose={vi.fn()} onImported={onImported} /></MemoryRouter>);
    const file = new File(['Name,Phone,Shop\nSara,0300 1112223,Sara Boutique\nOld,0321 0000000,\n'], 'expo-list.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByLabelText('CSV file'), { target: { files: [file] } });
    expect(await screen.findByText('expo-list.csv')).toBeInTheDocument();
    expect(screen.getByLabelText('Where is this list from?')).toHaveValue('expo-list');
    fireEvent.change(screen.getByLabelText('Give the leads to'), { target: { value: 'a2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check 2 rows' }));
    await waitFor(() => expect(api.apiImportLeads).toHaveBeenCalledWith({
      rows: [{ name: 'Sara', phone: '0300 1112223', businessName: 'Sara Boutique' }, { name: 'Old', phone: '0321 0000000' }],
      dryRun: true, sourceDetail: 'expo-list', ownerAdminId: 'a2',
    }));
    expect(await screen.findByText('1 of 2 will be added.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Import 1 lead' }));
    await waitFor(() => expect(onImported).toHaveBeenCalledWith(1));
    expect(api.apiImportLeads.mock.calls[1][0].dryRun).toBe(false);
  });
});

describe('BookDemoPage', () => {
  it('sends the request with the campaign it came from, and thanks the visitor', async () => {
    sessionStorage.setItem('solvexo:utm', JSON.stringify({ utmSource: 'facebook', utmCampaign: 'eid-sale' }));
    api.apiDemoRequest.mockResolvedValue({ success: true, message: 'Thank you! We’ll call or WhatsApp you within one working day.' });
    render(<MemoryRouter initialEntries={['/book-demo']}><BookDemoPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /Book my demo/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('name and a phone');
    fireEvent.change(screen.getByLabelText('Your name *'), { target: { value: 'Sara Malik' } });
    fireEvent.change(screen.getByLabelText('Phone / WhatsApp *'), { target: { value: '0300 1112223' } });
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Lahore' } });
    fireEvent.click(screen.getByRole('button', { name: /Book my demo/ }));
    await waitFor(() => expect(api.apiDemoRequest).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Sara Malik', phone: '0300 1112223', city: 'Lahore', utmSource: 'facebook', utmCampaign: 'eid-sale', preferredTime: 'Any time',
    })));
    expect(api.apiDemoRequest.mock.calls[0][0].website).toBeUndefined();
    expect(await screen.findByText('Request received')).toBeInTheDocument();
  });
});
