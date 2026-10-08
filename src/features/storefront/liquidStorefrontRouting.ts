const nativeRoutes = new Set([
  '/checkout', '/login', '/register', '/verify-otp', '/forgot-password', '/new-password',
  '/account', '/wishlist', '/loyalty', '/messages', '/notifications', '/faqs',
  '/returns', '/gift-cards', '/store-credit', '/orders', '/addresses', '/reviews',
]);

export function isLiquidStorefrontRoute(pathname: string): boolean {
  if (pathname === '/' || pathname === '/cart' || pathname === '/search' || pathname === '/blog') return true;
  if (/^\/(product|products|collections|blogs|pages)\//.test(pathname)) return true;
  if (/^\/blog\/[^/]+$/.test(pathname)) return true;
  return !nativeRoutes.has(pathname)
    && !pathname.startsWith('/orders/')
    && !pathname.startsWith('/order-status/')
    && !pathname.startsWith('/checkout/');
}

export function resolveLiquidStorefrontPath(path: string): string | null {
  if (!path.startsWith('/') || path.startsWith('//') || /[\r\n\\]/.test(path)) return null;
  let target: URL;
  try {
    target = new URL(path, 'https://storefront.invalid');
  } catch {
    return null;
  }
  if (target.origin !== 'https://storefront.invalid') return null;
  if (target.pathname.startsWith('/products/')) {
    target.pathname = target.pathname.replace(/^\/products\//, '/product/');
  } else if (target.pathname.startsWith('/pages/')) {
    target.pathname = `/${target.pathname.slice('/pages/'.length)}`;
  }
  return `${target.pathname}${target.search}${target.hash}`;
}
