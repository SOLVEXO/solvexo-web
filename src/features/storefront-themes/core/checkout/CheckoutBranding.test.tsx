import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

let branding: unknown = null;
vi.mock('@/features/storefront/StorefrontContext', () => ({ useStorefront: () => ({ store: { storeId: 's1', name: 'Shop', checkoutBranding: branding } }) }));

import { CheckoutBrandBar, CheckoutBrandFooter } from './CheckoutBranding';

const tokens = { ink: '#000', inkMuted: '#666', border: '#ccc' };
const show = () => render(<MemoryRouter><CheckoutBrandBar tokens={tokens} /><CheckoutBrandFooter tokens={tokens} /></MemoryRouter>);
afterEach(() => { cleanup(); branding = null; });

describe('checkout branding', () => {
  it('renders nothing when the store has none (the theme looks as before)', () => {
    const { container } = show();
    expect(container.innerHTML).toBe('');
  });

  it('shows the logo, the footer links (internal and external) and the accent rule', () => {
    branding = { logoUrl: 'https://cdn.example.com/l.png', accentColor: '#aa00bb', footerLinks: [{ label: 'Refunds', url: '/policies/refund' }, { label: 'Help', url: 'https://example.com/help' }] };
    const { container } = show();
    expect((screen.getByAltText('Shop') as HTMLImageElement).src).toBe('https://cdn.example.com/l.png');
    expect(screen.getByRole('link', { name: 'Refunds' }).getAttribute('href')).toBe('/policies/refund');
    const ext = screen.getByRole('link', { name: 'Help' });
    expect(ext.getAttribute('href')).toBe('https://example.com/help');
    expect(ext.getAttribute('rel')).toContain('noopener');
    expect(container.querySelector('style')?.textContent).toContain('#aa00bb');
  });

  it('a colour-only branding adds no logo and no footer', () => {
    branding = { logoUrl: null, accentColor: '#112233', footerLinks: [] };
    show();
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.queryByRole('navigation')).toBeNull();
  });
});
