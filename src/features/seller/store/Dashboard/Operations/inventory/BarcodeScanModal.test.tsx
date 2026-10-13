import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const api = vi.hoisted(() => ({ apiLookupByCode: vi.fn() }));
const product = vi.hoisted(() => ({ apiAdjustStock: vi.fn() }));
const perms = vi.hoisted(() => ({ can: true }));
vi.mock('@/api/services/inventoryOps', () => api);
vi.mock('@/api/services/product', () => product);
vi.mock('@/api/services/auth', () => ({ TokenStorage: { getUser: () => ({ role: 'seller' }) } }));
vi.mock('@/components/layouts/StoreLayout', () => ({ hasNavPermission: () => perms.can }));

import { BarcodeScanModal } from './BarcodeScanModal';

const hit = { variantId: 'v1', productId: 'p1', productName: 'Blue Shirt', image: null, sku: 'SH-1', barcode: '5901234123457', options: [{ name: 'Size', value: 'M' }], stock: 10, committedStock: 2, available: 8, unlimitedStock: false, costPrice: 3 };

describe('BarcodeScanModal', () => {
  beforeEach(() => { api.apiLookupByCode.mockReset(); product.apiAdjustStock.mockReset(); perms.can = true; });
  afterEach(cleanup);

  it('looks a typed/scanned code up (Enter submits, like a USB scanner) and shows stock', async () => {
    api.apiLookupByCode.mockResolvedValue({ data: [hit] });
    render(<BarcodeScanModal storeId="s1" onClose={() => {}} />);
    const input = screen.getByLabelText('Barcode or SKU');
    fireEvent.change(input, { target: { value: '5901234123457' } });
    fireEvent.submit(input.closest('form')!);
    await waitFor(() => expect(api.apiLookupByCode).toHaveBeenCalledWith('s1', '5901234123457'));
    expect(await screen.findByText(/Blue Shirt/)).toBeInTheDocument();
    expect(screen.getByText('8 available')).toBeInTheDocument();
  });

  it('shows a clear message when nothing matches, and the server error when the lookup fails', async () => {
    api.apiLookupByCode.mockResolvedValueOnce({ data: [] });
    render(<BarcodeScanModal storeId="s1" onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText('Barcode or SKU'), { target: { value: 'nope' } });
    fireEvent.submit(screen.getByLabelText('Barcode or SKU').closest('form')!);
    expect(await screen.findByRole('alert')).toHaveTextContent('Nothing in this store matches "nope"');
    api.apiLookupByCode.mockRejectedValueOnce(new Error('Store not found or unauthorized'));
    fireEvent.change(screen.getByLabelText('Barcode or SKU'), { target: { value: 'x' } });
    fireEvent.submit(screen.getByLabelText('Barcode or SKU').closest('form')!);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Store not found or unauthorized'));
  });

  it('adjusts stock from the result card and updates the shown quantity; a refused adjustment shows the error', async () => {
    api.apiLookupByCode.mockResolvedValue({ data: [hit] });
    product.apiAdjustStock.mockResolvedValueOnce({ data: { newStock: 13 } });
    render(<BarcodeScanModal storeId="s1" onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText('Barcode or SKU'), { target: { value: 'SH-1' } });
    fireEvent.submit(screen.getByLabelText('Barcode or SKU').closest('form')!);
    await screen.findByText(/Blue Shirt/);
    fireEvent.change(screen.getByLabelText('Qty'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => expect(product.apiAdjustStock).toHaveBeenCalledWith('s1', 'v1', 3, 'restocked'));
    expect(await screen.findByText('13')).toBeInTheDocument();
    product.apiAdjustStock.mockRejectedValueOnce(new Error('Cannot reduce stock below 2'));
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Cannot reduce stock below 2'));
  });

  it('hides the adjust controls for a user without inventory.adjust', async () => {
    perms.can = false;
    api.apiLookupByCode.mockResolvedValue({ data: [hit] });
    render(<BarcodeScanModal storeId="s1" onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText('Barcode or SKU'), { target: { value: 'SH-1' } });
    fireEvent.submit(screen.getByLabelText('Barcode or SKU').closest('form')!);
    await screen.findByText(/Blue Shirt/);
    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
  });
});
