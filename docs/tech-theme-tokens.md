# Tech Store theme (`theme-04-tech`): design tokens, coverage, gaps

Source: the exported design frames (31 screenshots). The Figma file itself could not be opened (HTTP 403 from outside the app, and the Figma MCP was not connected in the build session), so every value below was read from the PIXELS of those frames, not from Figma styles. Re-check against Figma once the MCP is authorised.

## Tokens (Observed = pixel sample of the frames)
| Role | Value | How |
|---|---|---|
| Primary / accent (buttons, links, badges) | `#0156FF` | Observed, dominant non-neutral colour in 4 frames |
| Soft panel / page band | `#F5F7FF` | Observed (about 12% of home/collection frames) |
| Near-black (top bar, footer, dark bands) | `#020203` | Observed |
| Border / dividers | `#CACDD8` | Observed (rule colour) |
| Body text muted | `#666666` | Observed (old price, captions) |
| Star orange / star off | `#E9A426` / `#C4C4C4` | Observed |
| In-stock green | `#78A962` | Observed. Below AA contrast as small text on white; kept because it is the design colour (sellers can change it: "In-stock colour") |
| Font | Poppins | Observed from letterforms; Poppins is already loaded by the platform (`index.html`) |
| Buttons | pill (full radius), 44px high, filled blue / outlined blue / black | Observed |
| Cards, inputs, panels | about 4px radius, flat | Observed |
| Container | 1280px | Inferred from frame width 1920 with side margins; set through the existing "Container width" setting |
| Radius, spacing scale, type scale (px) | not measured | Unknown: Tech reuses the platform scale (`theme.config.ts`) |

## Routes
**Native Tech UI (9):** home, product, cart, collection, category, search, customPage (About / Contact / Terms are seller pages made of sections), checkout (every step), checkoutReturn. Plus the Layout: top bar, header, 2-level mega menu, mobile menu, mini cart, footer, listing filter sidebar and product cards.

**Token-bridged Maison routes (reused as they are; they follow the Tech colours, fonts and radii through the bridge in `theme.config.ts`, but keep Maison shapes such as pill inputs and card radii):** collections, login, register, verifyOtp, forgotPassword, newPassword, account, addresses, myReviews, orders, orderDetail, orderStatus, returns, storeCredit, giftCards, giftCardView, loyalty, wishlist, notifications, messages, faqs, blogIndex, blogPost, library, memberships, licenses, learn, notFound, and the password gate page.

**Reused inside native pages (token-driven widgets, not drawn by Tech):** share dialog, wishlist button, SKU, specs block, delivery estimate, description tabs, extra product blocks, image zoom, review dialog, sticky mobile buy bar, footer columns / newsletter form / social row / payment badges, language and currency control, toasts, cookie banner, sign-in pop-up, announcement bar.

**Not covered:** none missing; every route resolves (native or bridged).

## Decisions
- Mega menu: the menu schema allows 3 levels in total (item + 2 child levels; backend `validateNavChildren`). The design shows a 3-column drill-down below the top item (4 levels), so Tech builds 2 child levels (left list, right children) plus an optional featured photo.
- Payment buttons: none are hard-coded. Checkout shows only the methods returned by the existing `payOptions` / gateway data (`PaymentStep`). The design's PayPal / Zip buttons in the cart and mini cart have no express-checkout data behind them, so they are not built.
- Footer trust strip, brand strip, testimonials, Instagram-style grid: seller-entered sections only (`tech.feature_strip`, `tech.brand_strip`, shared testimonials / gallery sections). No live Instagram feed, no sample reviews.

## Shown in the design but not suppliable by Solvexo (not built)
- Opening-hours drop-down and showroom address in the top bar (the top bar shows the seller's own text, phone and email).
- Spec table rows in list view (CPU / I/O ports): the product list API returns no specs. The product page shows real product tabs and the specs block (metafields) only.
- Compare products, "Check out with multiple addresses", shipping/tax estimator and discount code in the cart (the cart has no such APIs; shipping, tax and codes are handled in checkout).
- Zip / buy-now-pay-later banner, brand logo wall inside the mega menu, "contact us" link beside the SKU.
- Predictive search suggestions (the Tech search box submits to the search page).
- The 3rd mega-menu level (see Decisions).

## Not verified
Not opened in a browser, on a phone, Safari or Firefox; no real Stripe / gateway payment; Theme Library install / activate / switch-back on a test store; Customize, Header & Footer, share preview and demo preview with two themes live. See the build report.
