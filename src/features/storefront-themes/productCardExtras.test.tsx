import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { asCardBadgePosition, asCardInfoLine, cardBadgeBox, cardBadgeOf, cardInfoText } from './productCardExtras';
import { FashionProductCardView } from './theme-03-fashion/components/FashionProductCardView';
import { fashionTheme } from './theme-03-fashion/theme.config';

afterEach(cleanup);

const accent = { bg: '#336699', ink: '#FFFFFF' };
const book = { vendor: 'M.Publishers', categoryName: 'Pre-Primary', subCategoryName: 'Phonics' };

describe('card info line', () => {
  it('builds each mode from the product, skipping missing parts', () => {
    expect(cardInfoText(book, 'vendor')).toBe('M.Publishers');
    expect(cardInfoText(book, 'category')).toBe('Pre-Primary');
    expect(cardInfoText(book, 'subcategory')).toBe('Phonics');
    expect(cardInfoText(book, 'subcategory_category')).toBe('Phonics · Pre-Primary');
    expect(cardInfoText(book, 'category_subcategory')).toBe('Pre-Primary · Phonics');
    expect(cardInfoText({ categoryName: 'Primary' }, 'subcategory_category')).toBe('Primary');
    expect(cardInfoText({}, 'category')).toBe('');
  });
  it('falls back to the old behaviour (vendor / top-left) for unknown or missing settings', () => {
    expect(asCardInfoLine(undefined)).toBe('vendor');
    expect(asCardInfoLine('nonsense')).toBe('vendor');
    expect(asCardInfoLine('category')).toBe('category');
    expect(asCardBadgePosition(undefined)).toBe('top-left');
    expect(asCardBadgePosition('bottom-right')).toBe('bottom-right');
  });
});

describe('card badge', () => {
  it('is null when the seller wrote nothing', () => {
    expect(cardBadgeOf({}, accent)).toBeNull();
    expect(cardBadgeOf({ cardBadgeText: '   ' }, accent)).toBeNull();
  });
  it('uses the theme accent by default, a preset by name, or a hex with a readable ink', () => {
    expect(cardBadgeOf({ cardBadgeText: 'New' }, accent)).toEqual({ text: 'New', ...accent });
    expect(cardBadgeOf({ cardBadgeText: 'New', cardBadgeColor: 'green' }, accent)?.bg).toBe('#15803D');
    expect(cardBadgeOf({ cardBadgeText: 'New', cardBadgeColor: '#FFFF00' }, accent)).toEqual({ text: 'New', bg: '#FFFF00', ink: '#111111' });
    expect(cardBadgeOf({ cardBadgeText: 'New', cardBadgeColor: '#000000' }, accent)?.ink).toBe('#FFFFFF');
    expect(cardBadgeOf({ cardBadgeText: 'New', cardBadgeColor: 'javascript:alert(1)' }, accent)?.bg).toBe(accent.bg);
  });
  it('places the badge in the chosen corner, pushed down when something sits there', () => {
    expect(cardBadgeBox('top-left', 16)).toMatchObject({ top: 16, left: 16 });
    expect(cardBadgeBox('top-left', 16, 30)).toMatchObject({ top: 46, left: 16 });
    expect(cardBadgeBox('bottom-right', 16, 30)).toMatchObject({ bottom: 16, right: 16 });
  });
});

describe('Fashion card', () => {
  const view = (props: Record<string, unknown>) => render(<MemoryRouter><FashionProductCardView to="/product/x" name="Phonics Workbook" {...props} /></MemoryRouter>);

  it('shows the seller badge and the info line text', () => {
    view({ tag: 'Phonics · Pre-Primary', badge: { text: 'PreK-1', bg: '#336699', ink: '#fff' } });
    expect(screen.getByText('PreK-1').getAttribute('data-card-badge')).not.toBeNull();
    expect(screen.getByText('Phonics · Pre-Primary')).toBeTruthy();
  });
  it('shows no badge element when the product has none', () => {
    const { container } = view({ tag: 'M.Publishers' });
    expect(container.querySelector('[data-card-badge]')).toBeNull();
  });
  it('puts the badge in the corner chosen in theme settings', () => {
    const before = fashionTheme.cardBadgePosition;
    fashionTheme.cardBadgePosition = 'bottom-right';
    try {
      const { container } = view({ badge: { text: 'New', bg: '#111', ink: '#fff' } });
      const box = container.querySelector('[data-card-badge]')!.parentElement as HTMLElement;
      expect(box.style.bottom).toBe('16px');
      expect(box.style.right).toBe('16px');
    } finally { fashionTheme.cardBadgePosition = before; }
  });
});
