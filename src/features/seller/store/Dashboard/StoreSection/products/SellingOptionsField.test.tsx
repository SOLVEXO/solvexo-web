import { useState } from 'react';
import { chooseColor, chooseDateTime, typeColor } from '@/components/comman/ui/pickerTesting';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SellingOptionsField, initSellingOptions, sellingOptionsFromProduct, sellingOptionsPayload, type SellingOptionsForm } from './SellingOptionsField';
import { badgeAccent, badgeThemeColor } from '@/features/storefront-themes/cardBadgeTheme';

afterEach(cleanup);

function Harness({ initial = initSellingOptions, seen }: { initial?: SellingOptionsForm; seen: SellingOptionsForm[] }) {
  const [v, setV] = useState(initial);
  return <SellingOptionsField value={v} onChange={n => { seen.push(n); setV(n); }} />;
}

describe('Selling options: vendor and card badge', () => {
  it('puts Vendor / brand and Card badge side by side on one row', () => {
    render(<Harness seen={[]} />);
    const vendor = screen.getByLabelText('Vendor');
    const badge = screen.getByLabelText('Card badge text');
    const row = vendor.closest('.grid') as HTMLElement;
    expect(row).toBeTruthy();
    expect(row.contains(badge)).toBe(true);
    expect(row.className).toContain('sm:grid-cols-2');
  });

  it('shows the colour choices only once a badge text is typed', () => {
    render(<Harness seen={[]} />);
    expect(screen.queryByRole('group', { name: 'Badge colour' })).toBeNull();
    fireEvent.change(screen.getByLabelText('Card badge text'), { target: { value: 'New' } });
    expect(screen.getByRole('group', { name: 'Badge colour' })).toBeTruthy();
  });

  it('offers many colours, a free colour picker, and the theme colour as the default', () => {
    const seen: SellingOptionsForm[] = [];
    render(<Harness seen={seen} />);
    fireEvent.change(screen.getByLabelText('Card badge text'), { target: { value: 'New' } });
    expect(screen.getByRole('button', { name: 'Badge colour: theme colour' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getAllByRole('button', { name: /^Badge colour: / }).length).toBeGreaterThanOrEqual(11); // theme + 10 quick picks
    fireEvent.click(screen.getByRole('button', { name: 'Badge colour: Purple' }));
    expect(seen[seen.length - 1].cardBadgeColor).toBe('#7C3AED');
    chooseColor(screen.getByLabelText('Badge colour: custom'), '#12ab9f'); // any colour
    expect(seen[seen.length - 1].cardBadgeColor).toBe('#12AB9F');
    fireEvent.click(screen.getByRole('button', { name: 'Badge colour: theme colour' }));
    expect(seen[seen.length - 1].cardBadgeColor).toBe('');
  });

  it('saves a colour only together with a badge text', () => {
    const f = { ...initSellingOptions, cardBadgeText: '  ', cardBadgeColor: '#DC2626' };
    expect(sellingOptionsPayload(f).cardBadgeColor).toBe('');
    expect(sellingOptionsPayload({ ...f, cardBadgeText: ' New ' })).toMatchObject({ cardBadgeText: 'New', cardBadgeColor: '#DC2626' });
  });

  it('a product saved with an older colour name opens (and saves again) as that colour', () => {
    const f = sellingOptionsFromProduct({ cardBadgeText: 'Sale', cardBadgeColor: 'green' });
    expect(f.cardBadgeColor).toBe('#15803D');
    expect(sellingOptionsPayload(f).cardBadgeColor).toBe('#15803D');
    expect(sellingOptionsFromProduct({ cardBadgeText: 'x', cardBadgeColor: 'nonsense' }).cardBadgeColor).toBe('');
  });
});

describe('theme badge colour', () => {
  it('uses the theme colour (any #RRGGBB) with a readable text colour, else the accent', () => {
    const accent = { bg: '#336699', ink: '#FFFFFF' };
    expect(badgeAccent(null, accent)).toEqual(accent);
    expect(badgeAccent('not-a-colour', accent)).toEqual(accent);
    expect(badgeAccent('#FFFF00', accent)).toEqual({ bg: '#FFFF00', ink: '#111111' });
    expect(badgeAccent('#000000', accent)).toEqual({ bg: '#000000', ink: '#FFFFFF' });
    expect(badgeThemeColor(' #12ab9f ')).toBe('#12ab9f');
    expect(badgeThemeColor(5)).toBeNull();
  });
});
