import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HeaderIconButton, resolveIconPrefs, type IconSkin } from './headerIcons';
import { readHeaderOptions, headerPopupCss } from './headerOptions';
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

describe('seller-controlled tooltip', () => {
  const prefs = (patch: Record<string, unknown> = {}) =>
    resolveIconPrefs({ ...readHeaderOptions({ iconTipStyle: 'light', iconTipPosition: 'above', iconTipCart: 'My bag', ...patch }, 'J') }, MAISON_ICON_SETS);

  it('reads the seller words, colour and position', () => {
    const o = readHeaderOptions({ iconTipStyle: 'brand', iconTipPosition: 'above', iconTipCart: '  My bag  ', iconTipSearch: '' }, 'J');
    expect(o.iconTipStyle).toBe('brand');
    expect(o.iconTipPosition).toBe('above');
    expect(o.iconTips).toEqual({ cart: 'My bag' });
    expect(readHeaderOptions(undefined, 'J')).toMatchObject({ iconTipStyle: 'theme', iconTipPosition: 'below', iconTips: {} });
  });

  it('shows the seller text, above the icon, in the light look', () => {
    const { container } = render(<MemoryRouter><HeaderIconButton kind="cart" prefs={prefs()} skin={skin} label="Cart" onClick={() => {}} className="b" /></MemoryRouter>);
    const tip = container.querySelector('.sx-hi-tip') as HTMLElement;
    expect(tip.textContent).toBe('My bag');
    expect(tip.getAttribute('data-pos')).toBe('above');
    expect(tip.style.getPropertyValue('--tip-bg')).toBe('#ffffff');
  });

  it('an icon without its own text keeps the standard word', () => {
    const { container } = render(<MemoryRouter><HeaderIconButton kind="wishlist" prefs={prefs()} skin={skin} label="Wishlist" to="/w" className="b" /></MemoryRouter>);
    expect(container.querySelector('.sx-hi-tip')?.textContent).toBe('Wishlist');
  });
});

describe('seller-controlled dropdown look', () => {
  const o = (h: Record<string, unknown>) => readHeaderOptions(h, 'J');
  const brand = { bg: '#b00', ink: '#fff' };

  it('adds nothing while everything is the theme default', () => {
    expect(headerPopupCss(o({}), brand)).toBe('');
  });
  it('paints the panel, corners, shadow and hover the seller chose', () => {
    const css = headerPopupCss(o({ dropdownBg: 'brand', dropdownRadius: 'square', dropdownShadow: 'none', dropdownHover: 'underline' }), brand);
    expect(css).toContain('background:#b00!important');
    expect(css).toContain('color:#fff!important');
    expect(css).toContain('border-radius:0px!important');
    expect(css).toContain('box-shadow:none!important');
    expect(css).toContain('text-decoration:underline!important');
    expect(css).not.toContain('data-nav-mega]) > ul a:hover{background:color-mix');
  });
  it('ignores unknown values', () => {
    expect(headerPopupCss(o({ dropdownBg: 'pink', dropdownRadius: 'x' }), brand)).toBe('');
  });
});
