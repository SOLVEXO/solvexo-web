import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/storefront/StorefrontContext', () => ({
  useStorefront: () => ({
    store: { storeId: 's1' },
    resolveLink: (l: { linkType: string; url?: string; newTab?: boolean }) => (l.linkType === 'external' ? { href: l.url, newTab: l.newTab } : l.linkType === 'collection' ? { to: '/collections/sale' } : { to: '/' }),
  }),
}));
vi.mock('./inlineEdit', async importOriginal => ({ ...(await importOriginal<object>()), useInlineEditActive: () => false }));

import { ImageLink } from './HeroSlideLink';
import { ImageBannerSection as FashionBanner } from './theme-03-fashion/sections/shared/ImageBannerSection';
import { ImageBannerSection as TechBanner } from './theme-04-tech/sections/shared/ImageBannerSection';
import { ImageBannerSection as LedupBanner } from './theme-05-ledup/sections/shared/ImageBannerSection';

afterEach(cleanup);
const wrap = (ui: React.ReactNode) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('ImageLink (whole image is a link)', () => {
  it('draws nothing while the switch is off, even if a link was picked before', () => {
    const { container } = wrap(<div style={{ position: 'relative' }}><ImageLink settings={{ imageLinkOn: false, imageLink: { linkType: 'collection' } }} /></div>);
    expect(container.querySelector('a')).toBeNull();
  });
  it('covers the image with a link to the chosen page', () => {
    const { container } = wrap(<ImageLink settings={{ imageLinkOn: true, imageLink: { linkType: 'collection' } }} label="Summer" />);
    const a = container.querySelector('a')!;
    expect(a.getAttribute('href')).toBe('/collections/sale');
    expect(a.getAttribute('aria-label')).toBe('Summer');
    expect(a.className).toContain('absolute');
  });
  it('opens an outside address in a new tab safely, and has a readable name when the image has no heading', () => {
    const { container } = wrap(<ImageLink settings={{ imageLinkOn: true, imageLink: { linkType: 'external', url: 'https://x.test', newTab: true } }} />);
    const a = container.querySelector('a')!;
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toContain('noopener');
    expect(a.getAttribute('aria-label')).toBe('Open this image');
  });
});

describe('Image Banner with a link but no button', () => {
  const colors = { ink: '#111', bgAlt: '#eee' } as never;
  const section = (settings: Record<string, unknown>) => ({ _id: 'x', type: 'image_banner', settings: { imageUrl: 'https://x.test/a.jpg', heading: 'Big sale', ...settings } }) as never;
  for (const [name, Banner] of [['Fashion', FashionBanner], ['Tech', TechBanner], ['LedUp', LedupBanner]] as const) {
    it(`${name}: the whole banner links where the seller chose, with no button`, () => {
      const { container } = wrap(<Banner section={section({ imageLinkOn: true, imageLink: { linkType: 'collection' } })} colors={colors} blocks={[]} />);
      const links = container.querySelectorAll('a');
      expect(links.length).toBe(1);
      expect(links[0].getAttribute('href')).toBe('/collections/sale');
      expect(links[0].getAttribute('aria-label')).toBe('Big sale');
    });
    it(`${name}: no link unless the switch is on`, () => {
      const { container } = wrap(<Banner section={section({ imageLink: { linkType: 'collection' } })} colors={colors} blocks={[]} />);
      expect(container.querySelectorAll('a').length).toBe(0);
    });
    it(`${name}: with a button too, there are two links (image and button), not one inside the other`, () => {
      const { container } = wrap(<Banner section={section({ imageLinkOn: true, imageLink: { linkType: 'collection' }, ctaText: 'Shop', ctaLink: { linkType: 'home' } })} colors={colors} blocks={[]} />);
      const links = [...container.querySelectorAll('a')];
      expect(links.length).toBe(2);
      expect(links.some(a => a.querySelector('a'))).toBe(false);
    });
  }
});

describe('Image Banner "Show the image only"', () => {
  const colors = { ink: '#111', bgAlt: '#eee' } as never;
  const section = (settings: Record<string, unknown>) => ({ _id: 'x', type: 'image_banner', settings: { imageUrl: 'https://x.test/a.jpg', heading: 'Big sale', subheading: 'Today', ctaText: 'Shop', ctaLink: { linkType: 'home' }, ...settings } }) as never;
  for (const [name, Banner] of [['Fashion', FashionBanner], ['Tech', TechBanner], ['LedUp', LedupBanner]] as const) {
    it(`${name}: no heading, text, button or dark layer; the whole image can still be a link`, () => {
      const { container } = wrap(<Banner section={section({ imageOnly: true, imageLinkOn: true, imageLink: { linkType: 'collection' } })} colors={colors} blocks={[]} />);
      expect(container.querySelector('h2')).toBeNull();
      expect(container.querySelector('p')).toBeNull();
      expect(container.textContent).not.toContain('Shop');
      expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
      expect(container.querySelectorAll('a').length).toBe(1);
      expect(container.querySelector('img')).not.toBeNull();
    });
    it(`${name}: switch off = text and button come back`, () => {
      const { container } = wrap(<Banner section={section({ imageOnly: false })} colors={colors} blocks={[]} />);
      expect(container.querySelector('h2')?.textContent).toBe('Big sale');
      expect(container.textContent).toContain('Shop');
    });
  }
});
