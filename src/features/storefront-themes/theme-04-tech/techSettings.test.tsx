import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { applyMerchantThemeOverrides, techTheme } from './theme.config';
import { baseTheme } from './theme.base';
import { ProductDescriptionTabs } from './components/product/ProductDescriptionTabs';

const tabs = [
  { key: 'description', title: 'Description', content: 'Main text', html: false },
  { key: 'specs', title: 'Specs', content: '16 GB memory', html: false },
];

describe('Tech seller settings reach the theme', () => {
  beforeEach(() => applyMerchantThemeOverrides(null));

  it('starts from sensible Tech defaults', () => {
    expect(techTheme.pagination.mode).toBe('pages');
    expect(techTheme.productTabs).toBe('tabs');
    expect(techTheme.megaStyle).toBe('sidebar');
    expect(techTheme.footerColumns).toBe(0);
    expect(techTheme.cartUpsell).toBe(true);
    expect(techTheme.quickView).toBe(true);
    expect(baseTheme.cardHover).toBe('none');
  });

  it('reads pagination, quick view, footer, tabs, mega menu and cart settings', () => {
    applyMerchantThemeOverrides({
      quickView: 'hide',
      themeSettings: {
        productsPerPage: '24', productPagination: 'more', postsPerPage: '6', quickViewSize: 'large',
        techFooterColumns: '3', techProductTabs: 'accordion', techMegaStyle: 'columns', techCartUpsell: 'hide',
      },
    } as never);
    expect(techTheme.pagination.productsPerPage).toBe(24);
    expect(techTheme.pagination.mode).toBe('more');
    expect(techTheme.pagination.postsPerPage).toBe(6);
    expect(techTheme.quickView).toBe(false);
    expect(techTheme.quickViewSize).toBe('large');
    expect(techTheme.footerColumns).toBe(3);
    expect(techTheme.productTabs).toBe('accordion');
    expect(techTheme.megaStyle).toBe('columns');
    expect(techTheme.cartUpsell).toBe(false);
  });

  it('ignores values it does not know', () => {
    applyMerchantThemeOverrides({ themeSettings: { techFooterColumns: '9', techProductTabs: 'nope', techMegaStyle: 'x' } } as never);
    expect(techTheme.footerColumns).toBe(0);
    expect(techTheme.productTabs).toBe('tabs');
    expect(techTheme.megaStyle).toBe('sidebar');
  });

  it('keeps hover shadow for the shadow card style and lets the seller choose', () => {
    applyMerchantThemeOverrides({ themeSettings: { techCardStyle: 'shadow' } } as never);
    expect(baseTheme.cardHover).toBe('shadow');
    applyMerchantThemeOverrides({ cardHover: 'lift' } as never);
    expect(baseTheme.cardHover).toBe('lift');
  });
});

describe('Product description sections', () => {
  beforeEach(() => applyMerchantThemeOverrides(null));
  afterEach(cleanup);

  it('shows a tab bar by default and switches tabs', () => {
    render(<ProductDescriptionTabs tabs={tabs} />);
    expect(screen.getAllByRole('tab')).toHaveLength(2);
    expect(screen.getByText('Main text')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Specs' }));
    expect(screen.getByText('16 GB memory')).toBeTruthy();
  });

  it('shows open/close sections in accordion mode, first one open', () => {
    applyMerchantThemeOverrides({ themeSettings: { techProductTabs: 'accordion' } } as never);
    render(<ProductDescriptionTabs tabs={tabs} />);
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
    const first = screen.getByRole('button', { name: 'Description' });
    const second = screen.getByRole('button', { name: 'Specs' });
    expect(first.getAttribute('aria-expanded')).toBe('true');
    expect(second.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(second);
    expect(second.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('16 GB memory')).toBeTruthy();
    fireEvent.click(first);
    expect(first.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('Main text')).toBeNull();
  });
});
