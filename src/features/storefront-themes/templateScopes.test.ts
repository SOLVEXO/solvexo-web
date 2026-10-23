import { describe, expect, it } from 'vitest';
import { fashionThemeManifest } from './theme-03-fashion/theme.manifest';

const expectedScopes = ['home', 'product', 'collection', 'pages', 'search', 'cart', 'blogIndex', 'blogArticle', 'login', 'register', 'forgotPassword', 'resetPassword', 'verifyOtp', 'account', 'orders', 'orderDetail', 'addresses', 'wishlist', 'checkout', 'notFound', 'password'];

describe('storefront theme template scopes', () => {
  it('Maison exposes a template scope for every editable page', () => {
    expect(fashionThemeManifest.templates.map(template => template.id)).toEqual(expectedScopes);
  });

  it('shows the store header and footer on every scope except the password page', () => {
    expect(fashionThemeManifest.templates.filter(template => !template.showChrome).map(template => template.id)).toEqual(['password']);
  });
});
