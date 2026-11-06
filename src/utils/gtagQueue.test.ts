import { afterEach, describe, expect, it } from 'vitest';
import { __resetSiteAnalytics, loadGa, trackPageView } from './siteAnalytics';
import { loadPixelScripts } from './trackingPixels';

// gtag.js only processes queued commands pushed as an `arguments` object (Google's own snippet does
// `dataLayer.push(arguments)`); arrays are ignored and no hit is ever sent. Both GA loaders must queue that shape.
const isArguments = (v: unknown) => Object.prototype.toString.call(v) === '[object Arguments]';

afterEach(() => {
  delete (window as { gtag?: unknown }).gtag;
  delete (window as { dataLayer?: unknown }).dataLayer;
  document.head.querySelectorAll('script').forEach(s => s.remove());
  __resetSiteAnalytics();
});

describe('gtag command queue', () => {
  it("Solvexo's own site analytics queues commands the way gtag.js reads them", () => {
    loadGa('G-9WK4JCQ50L');
    trackPageView('/pricing');
    const queue = (window as unknown as { dataLayer: unknown[] }).dataLayer;
    expect(queue.length).toBe(3);
    expect(queue.every(isArguments)).toBe(true);
    expect(Array.from(queue[1] as ArrayLike<unknown>).slice(0, 2)).toEqual(['config', 'G-9WK4JCQ50L']);
    expect(Array.from(queue[2] as ArrayLike<unknown>)[1]).toBe('page_view');
  });

  it("a store's own Google Analytics pixel does too", () => {
    loadPixelScripts({ facebookPixelId: null, googleAnalyticsId: 'G-STORE1234', googleAdsId: null, googleAdsConversionLabel: null, tiktokPixelId: null });
    const queue = (window as unknown as { dataLayer: unknown[] }).dataLayer;
    expect(queue.length).toBeGreaterThanOrEqual(2);
    expect(queue.every(isArguments)).toBe(true);
  });
});
