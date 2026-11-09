import { afterEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FashionProductCardView } from './FashionProductCardView';
import { fashionTheme } from '../theme.config';

const draw = () => render(<MemoryRouter><FashionProductCardView to="/product/x" name="Batman" image="https://img.test/batman.jpg" price="$9" /></MemoryRouter>);

describe('FashionProductCardView image box', () => {
  const before = { ratio: fashionTheme.productImageRatio, fit: fashionTheme.productImageFit };
  afterEach(() => { fashionTheme.productImageRatio = before.ratio; fashionTheme.productImageFit = before.fit; });

  it('"Adapt to image": the photo stays in the normal flow so the box has a height (it used to be 0 px and show nothing)', () => {
    fashionTheme.productImageRatio = 'adapt';
    const img = draw().container.querySelector('img')!;
    expect(img.className).toContain('h-auto');
    expect(img.className).not.toContain('absolute');
    expect(img.parentElement?.style.aspectRatio).toBe('');
  });

  it('a fixed shape fills the box and crops by default', () => {
    fashionTheme.productImageRatio = 'portrait';
    fashionTheme.productImageFit = 'fill';
    const img = draw().container.querySelector('img')!;
    expect(img.className).toContain('absolute');
    expect(img.className).toContain('object-cover');
    expect(img.parentElement?.style.aspectRatio).toBe('3 / 4');
  });

  it('"Show the whole image" never crops, even in a fixed shape', () => {
    fashionTheme.productImageRatio = 'portrait';
    fashionTheme.productImageFit = 'whole';
    const img = draw().container.querySelector('img')!;
    expect(img.className).toContain('object-contain');
    expect(img.className).not.toContain('object-cover');
  });
});
