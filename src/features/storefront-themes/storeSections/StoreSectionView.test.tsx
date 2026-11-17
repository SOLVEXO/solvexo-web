import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { LayoutNode } from '@/api/services/storeSectionDefs';
import { StoreSectionView, type LinkRenderer, type StoreSectionColors } from './StoreSectionView';

afterEach(cleanup);

const colors: StoreSectionColors = { bg: '#fff', ink: '#111111', accent: '#0156ff', accentInk: '#ffffff', bgAlt: '#f4f4f4', inkMuted: '#777777', border: '#dddddd' };
// a link renderer that exposes where the link goes
const link: LinkRenderer = ({ link: target, children, style }) => <a href={`#${JSON.stringify(target ?? null)}`} data-testid="btn" style={style}>{children}</a>;

const layout: LayoutNode = {
  t: 'stack', children: [
    { t: 'heading', key: 'title', label: 'Title', size: 'lg', tag: 'h2' },
    { t: 'text', key: 'intro', label: 'Intro' },
    { t: 'richtext', key: 'body', label: 'Body' },
    { t: 'image', key: 'hero', label: 'Hero', ratio: '16:9' },
    { t: 'button', key: 'cta', label: 'CTA', link: 'ctaLink', style: 'solid' },
    { t: 'repeat', label: 'Card', cols: 3, card: true, children: [
      { t: 'heading', key: 'cardTitle', label: 'Card title', tag: 'h3' },
      { t: 'text', key: 'cardText', label: 'Card text' },
    ] },
  ],
};

const show = (settings: Record<string, unknown>, blocks: { settings: Record<string, unknown>; enabled?: boolean }[] = [], preview = false) =>
  render(<StoreSectionView def={{ layout }} settings={settings} blocks={blocks} colors={colors} link={link} preview={preview} />);

describe('StoreSectionView', () => {
  it('draws the values of the section and of each repeating item, in the layout order', () => {
    show({ title: 'Why us', intro: 'Short intro' }, [{ settings: { cardTitle: 'Fast', cardText: 'Quick' } }, { settings: { cardTitle: 'Safe', cardText: 'Secure' } }]);
    expect(screen.getByRole('heading', { level: 2, name: 'Why us' })).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent)).toEqual(['Fast', 'Safe']);
    expect(screen.getByText('Quick')).toBeTruthy();
  });

  it('an item value is read from the item, never from the section', () => {
    show({ cardTitle: 'from the section', title: 'T' }, [{ settings: { cardTitle: 'from the item' } }]);
    expect(screen.queryByText('from the section')).toBeNull();
    expect(screen.getByText('from the item')).toBeTruthy();
  });

  it('hides what is empty on a real page (nothing, no empty boxes)', () => {
    const { container } = show({ title: 'Only a title' });
    expect(container.querySelectorAll('img, video, hr').length).toBe(0);
    expect(screen.queryByTestId('btn')).toBeNull();
    expect(container.textContent).toBe(`${container.querySelector('style')?.textContent ?? ''}Only a title`);
  });

  it('shows grey placeholders for the empty parts while designing (preview)', () => {
    show({}, [], true);
    expect(screen.getByText('Title')).toBeTruthy();
    expect(screen.getByText('Hero')).toBeTruthy();
    expect(screen.getByText(/Card will appear here/)).toBeTruthy();
  });

  it('skips hidden items', () => {
    show({ title: 'T' }, [{ settings: { cardTitle: 'Shown' } }, { enabled: false, settings: { cardTitle: 'Hidden' } }]);
    expect(screen.getByText('Shown')).toBeTruthy();
    expect(screen.queryByText('Hidden')).toBeNull();
  });

  it('images: only https, and never script URLs', () => {
    const { container, rerender } = show({ title: 'T', hero: 'https://cdn.example.com/a.jpg' });
    expect(container.querySelector('img')?.getAttribute('src')).toBe('https://cdn.example.com/a.jpg');
    rerender(<StoreSectionView def={{ layout }} settings={{ title: 'T', hero: 'javascript:alert(1)' }} blocks={[]} colors={colors} link={link} />);
    expect(container.querySelector('img')).toBeNull();
    rerender(<StoreSectionView def={{ layout }} settings={{ title: 'T', hero: 'http://insecure.example.com/a.jpg' }} blocks={[]} colors={colors} link={link} />);
    expect(container.querySelector('img')).toBeNull();
  });

  it('a square image with a maximum height is capped in width too (a round avatar, not a stretched box)', () => {
    const avatar: LayoutNode = { t: 'stack', align: 'center', children: [{ t: 'image', key: 'photo', ratio: 'square', radius: 48, maxHeight: 140 }] };
    const { container } = render(<StoreSectionView def={{ layout: avatar }} settings={{ photo: 'https://cdn.example.com/p.jpg' }} blocks={[]} colors={colors} link={link} />);
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img.style.maxWidth).toBe('140px');
    expect(img.style.aspectRatio).toContain('1');
    expect(img.style.marginInline).toBe('auto');
  });

  it('formatted text is cleaned (no script, no event handlers)', () => {
    const { container } = show({ title: 'T', body: '<p onclick="x()">ok <b>bold</b></p><script>alert(1)</script>' });
    expect(container.querySelector('.sxv-rich')?.innerHTML).toContain('<b>bold</b>');
    expect(container.innerHTML).not.toContain('<script');
    expect(container.innerHTML).not.toContain('onclick');
  });

  it('text is shown as text, never as markup', () => {
    const { container } = show({ title: '<img src=x onerror=alert(1)>' });
    expect(container.querySelector('h2')?.textContent).toBe('<img src=x onerror=alert(1)>');
    expect(container.querySelector('h2 img')).toBeNull();
  });

  it('a button needs its text; it is handed the link value and the theme colours', () => {
    show({ title: 'T', cta: 'Buy', ctaLink: { linkType: 'collection', collectionId: 'c1' } });
    const b = screen.getByTestId('btn');
    expect(b.textContent).toBe('Buy');
    expect(decodeURIComponent(b.getAttribute('href') ?? '')).toContain('"collectionId":"c1"');
    expect(b.style.background).toContain('rgb(1, 86, 255)');
  });

  it('a heading with an unknown tag falls back to h2 (no arbitrary tags)', () => {
    const odd: LayoutNode = { t: 'stack', children: [{ t: 'heading', key: 'title', tag: 'script' }] };
    const { container } = render(<StoreSectionView def={{ layout: odd }} settings={{ title: 'X' }} blocks={[]} colors={colors} link={link} />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('h2')?.textContent).toBe('X');
  });
});
