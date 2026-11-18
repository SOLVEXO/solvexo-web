import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/services/metafields', () => ({ apiGetMetafieldValues: vi.fn(), apiSetMetafieldValues: vi.fn() }));

import { ValueInput } from '@/features/seller/store/Dashboard/OnlineStore/customize/MetafieldsEditor';

afterEach(cleanup);
const entry = (type: string) => ({ definitionId: 'd', namespace: 'custom', key: 'k', name: 'Width', type, required: false, value: '' }) as never;

describe('measurement input (number + unit)', () => {
  it('typing a number stores "number unit" with the chosen unit', () => {
    const seen: string[] = [];
    render(<ValueInput entry={entry('dimension')} value="" onChange={v => seen.push(v)} />);
    fireEvent.change(screen.getByLabelText('Width amount'), { target: { value: '12.5' } });
    expect(seen).toEqual(['12.5 mm']); // first unit until the seller picks one
  });

  it('changing the unit keeps the number', () => {
    const seen: string[] = [];
    render(<ValueInput entry={entry('dimension')} value="12.5 mm" onChange={v => seen.push(v)} />);
    expect((screen.getByLabelText('Width amount') as HTMLInputElement).value).toBe('12.5');
    expect((screen.getByLabelText('Width unit') as HTMLSelectElement).value).toBe('mm');
    fireEvent.change(screen.getByLabelText('Width unit'), { target: { value: 'cm' } });
    expect(seen).toEqual(['12.5 cm']);
  });

  it('clearing the number clears the value', () => {
    const seen: string[] = [];
    render(<ValueInput entry={entry('weight')} value="2 kg" onChange={v => seen.push(v)} />);
    fireEvent.change(screen.getByLabelText('Width amount'), { target: { value: '' } });
    expect(seen).toEqual(['']);
  });

  it('each type offers its own units', () => {
    const { unmount } = render(<ValueInput entry={entry('weight')} value="" onChange={() => undefined} />);
    expect([...(screen.getByLabelText('Width unit') as HTMLSelectElement).options].map(o => o.value)).toEqual(['g', 'kg', 'oz', 'lb']);
    unmount();
    render(<ValueInput entry={entry('volume')} value="" onChange={() => undefined} />);
    expect([...(screen.getByLabelText('Width unit') as HTMLSelectElement).options].map(o => o.value)).toContain('fl oz');
  });
});
