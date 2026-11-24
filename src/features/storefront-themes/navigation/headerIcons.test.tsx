import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HeaderIconButton, resolveIconPrefs, type IconSkin } from './headerIcons';
import { readHeaderOptions } from './headerOptions';
import { MAISON_ICON_SETS } from '../theme-03-fashion/headerIconSets';
import { TECH_ICON_SETS } from '../theme-04-tech/headerIconSets';
import { LEDUP_ICON_SETS } from '../theme-05-ledup/headerIconSets';

const skin: IconSkin = { tipBg: '#111', tipInk: '#fff', tipRadius: 6, tipFont: 'sans-serif', tileRadius: 8, inverse: '#fff' };

describe('header icon sets', () => {
  it('every theme offers at least 5 distinct sets with unique ids', () => {
    for (const sets of [MAISON_ICON_SETS, TECH_ICON_SETS, LEDUP_ICON_SETS]) {
      expect(sets.length).toBeGreaterThanOrEqual(5);
      expect(new Set(sets.map(s => s.id)).size).toBe(sets.length);
      expect(new Set(sets.map(s => `${s.family}/${s.treatment}`)).size).toBe(sets.length);
    }
  });

  it('falls back to the theme default when the saved id is not one of its sets', () => {
    const o = readHeaderOptions({ iconSet: 'tech-sharp' }, 'J');
    expect(resolveIconPrefs(o, MAISON_ICON_SETS).set.id).toBe('maison-line');
    expect(resolveIconPrefs(o, TECH_ICON_SETS).set.id).toBe('tech-sharp');
    expect(resolveIconPrefs(readHeaderOptions(undefined, 'J'), LEDUP_ICON_SETS).set.id).toBe('ledup-line');
  });
});

describe('HeaderIconButton', () => {
  const prefs = (patch: Partial<Parameters<typeof resolveIconPrefs>[0]> = {}) =>
    resolveIconPrefs({ ...readHeaderOptions(undefined, 'J'), ...patch }, MAISON_ICON_SETS);

  it('renders a link with an accessible name and a tooltip bubble', () => {
    const { container } = render(<MemoryRouter><HeaderIconButton kind="wishlist" prefs={prefs()} skin={skin} label="Wishlist" to="/wishlist" className="b" /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Wishlist' }).getAttribute('href')).toBe('/wishlist');
    expect(container.querySelector('.sx-hi-tip')?.textContent).toBe('Wishlist');
  });

  it('omits the tooltip when switched off and shows a visible label when labels are on', () => {
    const off = render(<MemoryRouter><HeaderIconButton kind="cart" prefs={prefs({ iconTooltips: false })} skin={skin} label="Cart" onClick={() => {}} className="b" /></MemoryRouter>);
    expect(off.container.querySelector('.sx-hi-tip')).toBeNull();
    off.unmount();
    const below = render(<MemoryRouter><HeaderIconButton kind="cart" prefs={prefs({ iconLabels: 'below' })} skin={skin} label="Cart" onClick={() => {}} className="b" /></MemoryRouter>);
    expect(below.container.querySelector('.sx-hi-label')?.textContent).toBe('Cart');
    expect(below.container.querySelector('.sx-hi-tip')).toBeNull();
  });
});
