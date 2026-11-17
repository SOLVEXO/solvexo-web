import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { BrowseSettings } from './useBrowseConfig';

const state: { cfg: BrowseSettings } = { cfg: { showCounts: true } };
vi.mock('./useBrowseConfig', () => ({ useBrowseConfig: () => state.cfg }));
import { ArrangedFilters, FilterSlot } from './ArrangedFilters';
import { CheckRow } from '../../storefront-themes/theme-03-fashion/components/browse/FashionFilterParts';
import { LedupFilterCheck } from '../../storefront-themes/theme-05-ledup/components/LedupFilterSidebar';

afterEach(() => { cleanup(); state.cfg = { showCounts: true }; });

const mount = () => render(
  <ArrangedFilters>
    <FilterSlot id="availability"><p>Availability</p></FilterSlot>
    <FilterSlot id="price"><p>Price</p></FilterSlot>
    <FilterSlot id="type"><p>Type</p></FilterSlot>
    {['Size', 'Color'].map(n => <FilterSlot key={n} id={`opt:${n}`}><p>{n}</p></FilterSlot>)}
    <FilterSlot id="tag"><p>Tags</p></FilterSlot>
  </ArrangedFilters>,
);
const order = (c: HTMLElement) => Array.from(c.querySelectorAll('p')).map(p => p.textContent);

describe('ArrangedFilters', () => {
  it('shows every filter in the default order until the seller config is there', () => {
    const { container } = mount();
    expect(order(container)).toEqual(['Availability', 'Price', 'Type', 'Size', 'Color', 'Tags']);
  });
  it('hides what the seller turned off and follows their order', () => {
    state.cfg = { showCounts: true, filters: [{ key: 'tags', enabled: true }, { key: 'options', enabled: true }, { key: 'price', enabled: false }, { key: 'availability', enabled: true }] };
    const { container } = mount();
    expect(order(container)).toEqual(['Tags', 'Size', 'Color', 'Availability', 'Type']);
  });
});

describe('product counts next to filter values', () => {
  it('are shown by default and hidden when the seller turns them off (Maison + Ledup)', () => {
    const { rerender } = render(<><CheckRow label="Red" count={4} checked={false} onToggle={() => {}} /><LedupFilterCheck label="Blue" count={7} checked={false} onToggle={() => {}} /></>);
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getByText('(7)')).toBeTruthy();
    state.cfg = { showCounts: false };
    rerender(<><CheckRow label="Red" count={4} checked={false} onToggle={() => {}} /><LedupFilterCheck label="Blue" count={7} checked={false} onToggle={() => {}} /></>);
    expect(screen.queryByText('4')).toBeNull();
    expect(screen.queryByText('(7)')).toBeNull();
    expect(screen.getByText('Red')).toBeTruthy();
  });
});
