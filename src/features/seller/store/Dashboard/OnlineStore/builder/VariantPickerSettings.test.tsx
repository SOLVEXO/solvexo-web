import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { dropdown, optionsOf, chooseValue } from '@/components/comman/ui/dropdownTesting';
import { BlockFields } from './BlockFields';

afterEach(cleanup);

const mount = (settings: Record<string, unknown>, onChange = vi.fn()) => {
  render(<BlockFields type="product_variant_picker" settings={settings} onChange={onChange} pageOptions={[]} storeId="S1" />);
  return onChange;
};

describe('Main Product > Variant picker block settings', () => {
  it('offers buttons, dropdown, colour swatches and picture tiles', () => {
    mount({});
    expect(optionsOf(dropdown('Buttons (pills)')).map(o => o.value)).toEqual(['pills', 'dropdown', 'swatches', 'images']);
  });

  it('swatch shape and size appear only for swatches / picture tiles', () => {
    mount({ pickerStyle: 'pills' });
    expect(screen.queryByText('Swatch shape')).toBeNull();
    cleanup();
    mount({ pickerStyle: 'swatches' });
    expect(screen.getByText('Swatch shape')).toBeTruthy();
    expect(screen.getByText('Swatch size')).toBeTruthy();
    cleanup();
    mount({ pickerStyle: 'images' });
    expect(screen.getByText('Swatch size')).toBeTruthy();
  });

  it('choosing a style writes it', () => {
    const onChange = mount({});
    chooseValue(dropdown('Buttons (pills)'), 'swatches');
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ pickerStyle: 'swatches' }));
  });

  it('explains which options a swatch style suits', () => {
    mount({});
    expect(screen.getByText(/Swatches suit colour options/)).toBeTruthy();
  });
});
