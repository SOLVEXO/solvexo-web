import { afterEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { setVendorPrefix, vendorPath, VendorLink } from './VendorLink';

const draw = () => render(<MemoryRouter><p><VendorLink name="George Orwell" /></p></MemoryRouter>).container;

describe('VendorLink', () => {
  afterEach(() => setVendorPrefix(''));
  it('links the name to the shop filtered by that vendor', () => {
    expect(vendorPath('George Orwell')).toBe('/search?filter.p.vendor=George%20Orwell');
    expect(draw().querySelector('a')?.getAttribute('href')).toBe('/search?filter.p.vendor=George%20Orwell');
    expect(draw().textContent).toBe('George Orwell');
  });
  it('adds the seller\'s own text before the name only when one is set', () => {
    setVendorPrefix('By');
    expect(draw().textContent).toBe('By George Orwell');
    expect(draw().querySelector('a')?.textContent).toBe('George Orwell');
    setVendorPrefix('   ');
    expect(draw().textContent).toBe('George Orwell');
  });
});
