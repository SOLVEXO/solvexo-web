import { afterEach, describe, expect, it } from 'vitest';
import { captureSsrSnapshot, ssrSnapshot } from './ssrSnapshot';

afterEach(() => { document.body.innerHTML = ''; captureSsrSnapshot(); });

describe('ssrSnapshot', () => {
  it('is empty when the page was not server-rendered', () => {
    document.body.innerHTML = '<div id="root"><div>skeleton</div></div>';
    captureSsrSnapshot();
    expect(ssrSnapshot()).toBe('');
  });

  it('keeps the inside of the server-rendered wrapper, even when React put <link> hints in front of it', () => {
    document.body.innerHTML = '<div id="root"><link rel="preload" as="image" href="/a.jpg"><div class="wrap" data-sx-ssr=""><header>Shop</header><main>Products</main></div></div>';
    captureSsrSnapshot();
    expect(ssrSnapshot()).toBe('<header>Shop</header><main>Products</main>');
  });

  it('ignores a wrapper that is not a direct child of the root', () => {
    document.body.innerHTML = '<div id="root"><section><div data-sx-ssr="">nested</div></section></div>';
    captureSsrSnapshot();
    expect(ssrSnapshot()).toBe('');
  });
});
