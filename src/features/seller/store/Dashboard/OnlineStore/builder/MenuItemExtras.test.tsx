import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { useState } from 'react';
import { BlockFields } from './BlockFields';
import { MegaExtrasField, NavBadgeField, NavRulesField, type NavExtrasValue } from './MenuItemExtras';

vi.mock('@/components/comman/ui', async importOriginal => {
  const actual = await importOriginal<typeof import('@/components/comman/ui')>();
  // the real uploader talks to Cloudinary: a stand-in that "uploads" one fixed picture is enough here
  return { ...actual, ImageUpload: ({ value, onChange }: { value: string[]; onChange: (u: string[]) => void }) => (
    <div><span data-testid="img">{value.join(',')}</span><button type="button" onClick={() => onChange(['https://cdn.example.com/up.jpg'])}>upload picture</button><button type="button" onClick={() => onChange([])}>clear picture</button></div>
  ) };
});

afterEach(cleanup);

function Harness<T extends NavExtrasValue>({ initial, children, spy }: { initial: T; children: (v: T, set: (patch: Partial<T>) => void) => React.ReactNode; spy?: (v: T) => void }) {
  const [v, setV] = useState(initial);
  return <>{children(v, patch => setV(cur => { const next = { ...cur, ...patch }; spy?.(next); return next; }))}</>;
}

describe('NavBadgeField', () => {
  it('edits the text (no markup) and the colour, and can go back to the theme colour', () => {
    const spy = vi.fn();
    render(<Harness initial={{ badge: '', badgeColor: '' } as NavExtrasValue} spy={spy}>{(v, set) => <NavBadgeField value={v} onChange={set} />}</Harness>);
    fireEvent.change(screen.getByLabelText('Badge text'), { target: { value: '<b>New' } });
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ badge: 'bNew' }));
    fireEvent.change(screen.getByLabelText('Badge colour'), { target: { value: '#ff0000' } });
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ badgeColor: '#ff0000' }));
    fireEvent.click(screen.getByText('Theme colour'));
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ badgeColor: '' }));
  });
});

describe('NavRulesField', () => {
  it('is folded away until asked for', () => {
    render(<Harness initial={{} as NavExtrasValue}>{(v, set) => <NavRulesField value={v} onChange={set} />}</Harness>);
    expect(screen.queryByText('Only in these countries')).toBeNull();
    fireEvent.click(screen.getByText(/Show only to certain visitors/));
    expect(screen.getByText('Only in these countries')).toBeTruthy();
  });

  it('opens by itself when a rule is already set, and says so when folded', () => {
    const { unmount } = render(<Harness initial={{ showCountries: 'PK' } as NavExtrasValue}>{(v, set) => <NavRulesField value={v} onChange={set} />}</Harness>);
    expect((screen.getByDisplayValue('PK') as HTMLInputElement).value).toBe('PK');
    fireEvent.click(screen.getByText('Hide'));
    expect(screen.getByText(/in use/)).toBeTruthy();
    unmount();
  });

  it('writes the rules; a schedule is saved as an exact moment (ISO)', () => {
    const spy = vi.fn();
    render(<Harness initial={{} as NavExtrasValue} spy={spy}>{(v, set) => <NavRulesField value={v} onChange={set} />}</Harness>);
    fireEvent.click(screen.getByText(/Show only to certain visitors/));
    fireEvent.change(screen.getByDisplayValue('Everyone'), { target: { value: 'customers' } });
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ showTo: 'customers' }));
    fireEvent.change(screen.getByPlaceholderText('PK, AE, GB'), { target: { value: 'PK, AE' } });
    fireEvent.change(screen.getByPlaceholderText('en, ur'), { target: { value: 'en' } });
    const [from] = Array.from(document.querySelectorAll('input[type="datetime-local"]')) as HTMLInputElement[];
    fireEvent.change(from, { target: { value: '2026-12-01T09:30' } });
    const last = spy.mock.calls.at(-1)![0] as NavExtrasValue;
    expect(last).toMatchObject({ showTo: 'customers', showCountries: 'PK, AE', showLanguages: 'en' });
    expect(last.showFrom).toBe(new Date(2026, 11, 1, 9, 30).toISOString());
    // and it reads back on the seller's own clock
    expect((Array.from(document.querySelectorAll('input[type="datetime-local"]')) as HTMLInputElement[])[0].value).toBe('2026-12-01T09:30');
  });
});

describe('MegaExtrasField', () => {
  const mount = (initial: NavExtrasValue = {}, spy = vi.fn()) => {
    render(
      <Harness initial={initial} spy={spy}>
        {(v, set) => <MegaExtrasField value={v} onChange={set} storeId="S1" pageOptions={[{ slug: 'sale', title: 'Sale' }]} />}
      </Harness>,
    );
    return spy;
  };

  it('columns: automatic or 2 to 6', () => {
    const spy = mount();
    fireEvent.change(screen.getByDisplayValue('Automatic (your theme setting)'), { target: { value: '4' } });
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ megaColumns: 4 }));
  });

  it('adds a card, fills it, and warns until it has a picture or a title', () => {
    const spy = mount();
    fireEvent.click(screen.getByText('Add a promo card'));
    expect(screen.getByRole('alert').textContent).toMatch(/picture or a title/);
    fireEvent.click(screen.getByText('upload picture'));
    expect(screen.queryByRole('alert')).toBeNull();
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'Summer sale' } });
    fireEvent.change(inputs[1], { target: { value: 'Up to 50% off' } });
    fireEvent.change(inputs[2], { target: { value: 'Shop now' } });
    const last = spy.mock.calls.at(-1)![0] as NavExtrasValue;
    expect(last.megaPromos).toEqual([{ imageUrl: 'https://cdn.example.com/up.jpg', title: 'Summer sale', text: 'Up to 50% off', buttonLabel: 'Shop now', link: null }]);
  });

  it('a card is a link only when asked; at most two cards; a card can be removed', () => {
    const spy = mount({ megaPromos: [{ title: 'A' }] });
    fireEvent.click(screen.getByLabelText('The card is a link'));
    expect(((spy.mock.calls.at(-1)![0] as NavExtrasValue).megaPromos![0]).link).toEqual({ linkType: 'home' });
    fireEvent.click(screen.getByText('Add a promo card'));
    expect(screen.queryByText('Add a promo card')).toBeNull(); // two is the limit
    fireEvent.click(screen.getByLabelText('Remove card 2'));
    expect(screen.getByText('Add a promo card')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Remove card 1'));
    expect((spy.mock.calls.at(-1)![0] as NavExtrasValue).megaPromos).toEqual([]);
  });

  it('typing markup into a card text is stripped', () => {
    const spy = mount({ megaPromos: [{ title: 'A' }] });
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: '<script>x' } });
    expect(((spy.mock.calls.at(-1)![0] as NavExtrasValue).megaPromos![0]).title).toBe('scriptx');
  });
});

describe('the header menu editor (nav_link block) offers the new options', () => {
  const settings = { label: 'Shop', linkType: 'home', menuStyle: 'mega', children: [{ label: 'Men', linkType: 'home' }] };
  const mount = (s: Record<string, unknown>) => render(<BlockFields type="nav_link" settings={s} onChange={vi.fn()} pageOptions={[]} storeId="S1" />);

  it('a mega item shows badge, mega layout (columns + promo cards) and the show-when rules', () => {
    mount(settings);
    expect(screen.getAllByLabelText('Badge text').length).toBeGreaterThan(0);
    expect(screen.getByText('Mega menu layout')).toBeTruthy();
    expect(screen.getByText('Add a promo card')).toBeTruthy();
    expect(screen.getByText(/Show only to certain visitors/)).toBeTruthy();
  });

  it('a plain dropdown item has no mega layout', () => {
    mount({ ...settings, menuStyle: 'dropdown' });
    expect(screen.queryByText('Mega menu layout')).toBeNull();
  });

  it('a mega item without dropdown items has nothing to lay out yet', () => {
    mount({ ...settings, children: [] });
    expect(screen.queryByText('Mega menu layout')).toBeNull();
  });

  it('each dropdown item can carry its own badge', () => {
    mount(settings);
    // one for the top-level item and one for the dropdown item "Men"
    expect(screen.getAllByLabelText('Badge text')).toHaveLength(2);
  });
});
