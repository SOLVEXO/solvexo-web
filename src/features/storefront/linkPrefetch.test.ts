import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getProduct = vi.fn(() => Promise.resolve({}));
const getCollection = vi.fn(() => Promise.resolve({}));
const preload = vi.fn(() => Promise.resolve());
vi.mock('@/api/services/marketplace', () => ({ apiGetProductById: (...a: unknown[]) => getProduct(...(a as [])) }));
vi.mock('@/api/services/collections', () => ({ apiGetPublicCollectionBySlug: (...a: unknown[]) => getCollection(...(a as [])) }));
vi.mock('@/features/storefront-themes/preloadThemeShell', () => ({ preloadThemeShell: (...a: unknown[]) => preload(...(a as [])) }));
import { startLinkPrefetch } from './linkPrefetch';

let stop: () => void;
const link = (href: string, attrs: Record<string, string> = {}) => {
  const a = document.createElement('a');
  a.href = href;
  for (const [k, v] of Object.entries(attrs)) a.setAttribute(k, v);
  a.textContent = 'x';
  document.body.appendChild(a);
  return a;
};
const hover = (el: Element) => el.dispatchEvent(new Event('pointerover', { bubbles: true }));
const touch = (el: Element) => el.dispatchEvent(new Event('touchstart', { bubbles: true }));

beforeEach(() => { vi.useFakeTimers(); getProduct.mockClear(); getCollection.mockClear(); preload.mockClear(); stop = startLinkPrefetch('S1', 'theme-04-tech'); });
afterEach(() => { stop(); vi.useRealTimers(); document.body.innerHTML = ''; });

describe('startLinkPrefetch', () => {
  it('warms a product page (code + data) after a short hover, once', () => {
    const a = link('/product/blue-shirt');
    hover(a);
    expect(getProduct).not.toHaveBeenCalled(); // not yet: a fly-by does nothing
    vi.advanceTimersByTime(100);
    expect(getProduct).toHaveBeenCalledWith('blue-shirt');
    expect(preload).toHaveBeenCalledWith('theme-04-tech', '/product/blue-shirt');
    hover(a); vi.advanceTimersByTime(100);
    expect(getProduct).toHaveBeenCalledTimes(1);
  });

  it('a fly-by (pointer leaves quickly) prefetches nothing', () => {
    const a = link('/product/quick');
    hover(a);
    a.dispatchEvent(new Event('pointerout', { bubbles: true }));
    vi.advanceTimersByTime(200);
    expect(getProduct).not.toHaveBeenCalled();
  });

  it('a touch prefetches at once', () => {
    touch(link('/collections/summer'));
    expect(getCollection).toHaveBeenCalledWith('S1', 'summer');
  });

  it('works on elements inside a link and understands language folders', () => {
    const a = link('/ur/product/lal-qameez');
    const inner = document.createElement('span');
    a.appendChild(inner);
    touch(inner);
    expect(getProduct).toHaveBeenCalledWith('lal-qameez');
  });

  it('ignores other sites, new-tab links, downloads and pages with nothing public to warm', () => {
    touch(link('https://other.example/product/x'));
    touch(link('/product/new-tab', { target: '_blank' }));
    touch(link('/product/file', { download: '' }));
    touch(link('/cart'));
    touch(link('/account'));
    expect(getProduct).not.toHaveBeenCalled();
    expect(preload).not.toHaveBeenCalled();
  });

  it('stops listening when it is turned off', () => {
    stop();
    touch(link('/product/after-stop'));
    expect(getProduct).not.toHaveBeenCalled();
  });
});
