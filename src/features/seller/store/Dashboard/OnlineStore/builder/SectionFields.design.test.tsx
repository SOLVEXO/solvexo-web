import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SectionFields } from './SectionFields';

afterEach(cleanup);

const mount = (settings: Record<string, unknown>, onChange = vi.fn()) => {
  render(<SectionFields type="rich_text" settings={settings} onChange={onChange} storeId="s1" />);
  return onChange;
};

describe('SectionFields: Design & visibility groups', () => {
  it('is collapsed by default and opens into small groups', () => {
    mount({});
    expect(screen.queryByText('Background')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Design & visibility/i }));
    for (const g of ['Spacing & width', 'Background', 'Border & shadow', 'Text', 'Motion', 'Show when', 'Advanced']) {
      expect(screen.getByRole('button', { name: new RegExp(g.replace('&', '&')) })).toBeTruthy();
    }
    // groups start closed when nothing in them is set
    expect(screen.queryByText('Entrance animation')).toBeNull();
  });

  it('opens by itself the groups that already hold a value', () => {
    mount({ animation: 'fade', showCountries: 'PK', paddingTopMobile: 8 });
    expect(screen.getByText('Entrance animation')).toBeTruthy();
    expect(screen.getByText('Show only in these countries')).toBeTruthy();
    expect(screen.getByText('Inner space top on phone (px)')).toBeTruthy();
    // a group with nothing set stays closed
    expect(screen.queryByText('Heading weight')).toBeNull();
  });

  it('writes the new settings', () => {
    const onChange = mount({ animation: 'fade' });
    const select = screen.getByDisplayValue('Fade in') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'zoom' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ animation: 'zoom' }));
  });

  it('shows the dependent fields only when they apply', () => {
    mount({ animation: 'fade', sticky: true });
    expect(screen.getByText('Animation speed')).toBeTruthy();
    expect(screen.getByText('Distance from the top (px)')).toBeTruthy();
  });
});
