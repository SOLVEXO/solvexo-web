import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ProductDescriptionTabs as FashionTabs } from './theme-03-fashion/components/product/ProductDescriptionTabs';
import { ProductDescriptionTabs as TechTabs } from './theme-04-tech/components/product/ProductDescriptionTabs';
import { LedupProductTabs } from './theme-05-ledup/components/LedupProductTabs';

afterEach(cleanup);

const ownTabs = [
  { title: 'Features', content: '<p>Quiet&nbsp;and&nbsp;fast</p>' },
  { title: 'Care', content: 'Wipe&amp;nbsp;clean' }, // saved while the editor bug was live
];

describe('the seller\'s own product tabs show on every theme', () => {
  it('Fashion: tab bar with the first tab\'s text', () => {
    render(<FashionTabs tabs={ownTabs.map((x, i) => ({ key: `own-${i}`, title: x.title, content: x.content, html: true }))} />);
    expect(screen.getByRole('tab', { name: 'Features' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Care' })).toBeTruthy();
    expect(document.body.textContent).toContain('Quiet and fast');
  });

  it('Tech: tab bar with the first tab\'s text', () => {
    render(<TechTabs tabs={ownTabs.map((x, i) => ({ key: `own-${i}`, title: x.title, content: x.content, html: true }))} />);
    expect(screen.getByRole('tab', { name: 'Features' })).toBeTruthy();
    expect(document.body.textContent).toContain('Quiet and fast');
  });

  it('LedUp (had no tabs at all before): every tab is listed, the first is open, damaged text is healed', () => {
    const { container } = render(<LedupProductTabs tabs={ownTabs} />);
    const details = container.querySelectorAll('details');
    expect(details.length).toBe(2);
    expect((details[0] as HTMLDetailsElement).open).toBe(true);
    expect((details[1] as HTMLDetailsElement).open).toBe(false);
    expect(screen.getByText('Features')).toBeTruthy();
    expect(details[0].textContent).toContain('Quiet and fast');
    expect(details[1].textContent).toContain('Wipe clean'); // not "Wipe&nbsp;clean" shown literally
    expect(details[1].textContent).not.toContain('&');
  });

  it('LedUp: the store-wide tabs (set once in Customize) come after the product own ones, as plain text', () => {
    const { container } = render(<LedupProductTabs tabs={[{ title: 'Features', content: '<p>Fast</p>' }]} shared={[
      { key: 'a', title: 'Delivery', content: 'Ships in 2 days. Free over Rs 3000.', open: false },
      { key: 'b', title: 'Returns', content: '7-day returns', open: true },
    ]} />);
    const titles = Array.from(container.querySelectorAll('summary')).map(x => x.textContent);
    expect(titles).toEqual(['Features', 'Delivery', 'Returns']);
    const details = container.querySelectorAll('details');
    expect((details[0] as HTMLDetailsElement).open).toBe(true);
    expect((details[1] as HTMLDetailsElement).open).toBe(false);
    expect((details[2] as HTMLDetailsElement).open).toBe(true); // "open by default" is respected
    expect(details[1].textContent).toContain('Ships in 2 days.');
  });

  it('LedUp: a product with no tabs of its own still shows the store-wide ones (first one open)', () => {
    const { container } = render(<LedupProductTabs shared={[{ key: 'a', title: 'Delivery', content: 'Ships in 2 days.' }, { key: 'b', title: 'Returns', content: 'x' }]} />);
    const details = container.querySelectorAll('details');
    expect(details.length).toBe(2);
    expect((details[0] as HTMLDetailsElement).open).toBe(true);
    expect((details[1] as HTMLDetailsElement).open).toBe(false);
  });

  it('LedUp: store-wide tabs without a title or text are skipped', () => {
    expect(render(<LedupProductTabs shared={[{ key: 'a', title: '', content: 'x' }, { key: 'b', title: 'T', content: '  ' }]} />).container.innerHTML).toBe('');
  });

  it('LedUp: nothing at all when the product has no tabs, or only empty ones', () => {
    expect(render(<LedupProductTabs tabs={[]} />).container.innerHTML).toBe('');
    expect(render(<LedupProductTabs />).container.innerHTML).toBe('');
    expect(render(<LedupProductTabs tabs={[{ title: 'Empty', content: '  ' }, { title: '', content: 'x' }]} />).container.innerHTML).toBe('');
  });

  it('LedUp: scripts in tab text are removed', () => {
    const { container } = render(<LedupProductTabs tabs={[{ title: 'Bad', content: '<p>ok</p><script>window.__x=1</script><img src=x onerror="window.__x=2">' }]} />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.innerHTML).not.toContain('onerror');
    expect(container.textContent).toContain('ok');
  });
});
