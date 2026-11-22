import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const api = vi.hoisted(() => ({ apiGetImportTemplate: vi.fn(), apiRunBulkImport: vi.fn() }));
vi.mock('@/api/services/bulkImport', () => api);

import { BulkImportDialog } from './BulkImportDialog';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('BulkImportDialog', () => {
  it('sends the consent box and shows the import notes on the result screen', async () => {
    api.apiGetImportTemplate.mockResolvedValue({ success: true, data: { filename: 'customers-import-template.csv', csv: 'First Name\n', columns: [] } });
    api.apiRunBulkImport.mockResolvedValue({
      success: true, message: '2 added',
      data: {
        total: 2, created: 2, updated: 0, skipped: 0, failedCount: 0, failed: [], skippedRows: [], columns: ['First Name'],
        notices: ['1 customer without an email was added to your shop (POS) customers.', 'Tax Exempt is not used yet.'],
      },
    });
    const onImported = vi.fn();
    render(<BulkImportDialog title="Import customers" entityLabel="customers" basePath="/api/store/s1/customers" onClose={() => {}} onImported={onImported}
      consent={{ label: 'These customers agreed to receive marketing.', optional: true }} />);

    const file = new File(['First Name,Email\nJohn,john@x.com'], 'customers.csv', { type: 'text/csv' });
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /^Import/ }));

    expect(await screen.findByText('1 customer without an email was added to your shop (POS) customers.')).toBeInTheDocument();
    expect(screen.getByText('Tax Exempt is not used yet.')).toBeInTheDocument();
    expect(api.apiRunBulkImport).toHaveBeenCalledWith('/api/store/s1/customers', file, { consentConfirmed: 'true' });
    expect(onImported).toHaveBeenCalled();
  });
});
