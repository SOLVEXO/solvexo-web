import { describe, expect, it } from 'vitest';
import type { PublicStoreData } from '@/api/services/store';
import type { StoreThemeData } from '@/api/services/storeTheme';
import { ssrSkipReason } from './entry-server';

const store = (over: Record<string, unknown> = {}) => ({ storeId: 'S1', name: 'Shop', privacyMode: 'public', defaultLanguage: 'en', ...over }) as unknown as PublicStoreData;
const theme = (over: Record<string, unknown> = {}) => ({ themeDefinitionId: 'theme-03-fashion', ...over }) as unknown as StoreThemeData;

describe('ssrSkipReason (which pages the server will NOT render)', () => {
  it('renders the home and product pages of a plain English public store', () => {
    expect(ssrSkipReason({ path: '/', store: store(), theme: theme() })).toBeNull();
    expect(ssrSkipReason({ path: '/product/blue-shirt', store: store(), theme: theme() })).toBeNull();
    expect(ssrSkipReason({ path: '/product/blue-shirt/', store: store(), theme: theme() })).toBeNull();
  });

  it('renders collection, category, blog, faq and seller-made pages too', () => {
    for (const path of ['/collections', '/collections/summer', '/category/shoes', '/blog', '/blogs/news', '/blog/hello-world', '/blogs/news/hello-world', '/faqs', '/about-us', '/about-us/']) {
      expect(ssrSkipReason({ path, store: store(), theme: theme() }), path).toBeNull();
    }
  });

  it('never treats an app route (cart, login, account...) as a seller page', () => {
    for (const path of ['/cart', '/checkout', '/login', '/account', '/orders', '/wishlist', '/search', '/gift-cards', '/library', '/discount']) {
      expect(ssrSkipReason({ path, store: store(), theme: theme() }), path).toMatch(/not server-rendered/);
    }
  });

  it('skips pages it does not render yet', () => {
    expect(ssrSkipReason({ path: '/product/a/b', store: store(), theme: theme() })).toMatch(/not server-rendered/);
    expect(ssrSkipReason({ path: '/a/b/c', store: store(), theme: theme() })).toMatch(/not server-rendered/);
  });

  it('never renders a store that is not public', () => {
    expect(ssrSkipReason({ path: '/', store: store({ privacyMode: 'password' }), theme: theme() })).toMatch(/not public/);
    expect(ssrSkipReason({ path: '/', store: store({ privacyMode: 'coming_soon' }), theme: theme() })).toMatch(/not public/);
  });

  it('skips imported (Liquid) themes and unknown themes', () => {
    expect(ssrSkipReason({ path: '/', store: store(), theme: theme({ sourcePackageVersion: 3 }) })).toMatch(/Liquid/);
    expect(ssrSkipReason({ path: '/', store: store(), theme: theme({ themeDefinitionId: 'theme-99-gone' }) })).toMatch(/unknown theme/);
    expect(ssrSkipReason({ path: '/', store: store(), theme: null as unknown as StoreThemeData })).toMatch(/no store or theme/);
  });

  it('skips language folders, non-English stores and several-currency stores', () => {
    expect(ssrSkipReason({ path: '/ur/', store: store(), theme: theme() })).toMatch(/language folder/);
    expect(ssrSkipReason({ path: '/', store: store({ defaultLanguage: 'ur' }), theme: theme() })).toMatch(/not English/);
    expect(ssrSkipReason({ path: '/', store: store({ enabledCurrencies: ['USD', 'PKR'] }), theme: theme() })).toMatch(/several currencies/);
    expect(ssrSkipReason({ path: '/', store: store({ enabledCurrencies: ['USD'] }), theme: theme() })).toBeNull();
  });
});
