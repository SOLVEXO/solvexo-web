import { describe, expect, it } from 'vitest';
import { imgProps } from './imgProps';

describe('imgProps', () => {
  it('gives Cloudinary photos a sized srcSet and sizes', () => {
    const p = imgProps('https://res.cloudinary.com/demo/image/upload/v1/shop/coat.jpg', [320, 640, 960], '50vw');
    expect(p.srcSet).toContain('w_320,c_limit,q_auto,f_auto');
    expect(p.srcSet).toContain('960w');
    expect(p.sizes).toBe('50vw');
    expect(p.src).toContain('w_640');
  });

  it('leaves other image URLs untouched', () => {
    expect(imgProps('https://example.com/a.jpg', [320, 640], '50vw')).toEqual({ src: 'https://example.com/a.jpg', decoding: 'async' });
  });
});
