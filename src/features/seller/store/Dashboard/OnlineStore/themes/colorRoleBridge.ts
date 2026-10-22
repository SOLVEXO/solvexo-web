/** Tiny shared channel between the Theme Settings color fields and the live
 *  preview, so the seller always knows WHAT a color changes:
 *   - hovering a color field outlines the matching part of the preview;
 *   - clicking a part of the preview jumps to (and flashes) its color field.
 *  Theme-agnostic on purpose: roles are matched with generic selectors, so a
 *  new theme needs no changes here. Module-level (not React context) because
 *  the panel and the preview live in sibling subtrees and the preview renders
 *  inside an iframe portal. */

export type ColorRole = 'page' | 'header' | 'footer' | 'button' | 'heading' | 'link' | 'price' | 'card' | 'sale';

export const COLOR_ROLE_LABEL: Record<ColorRole, string> = {
  page: 'Page background & text', header: 'Header', footer: 'Footer', button: 'Buttons', heading: 'Headings',
  link: 'Links', price: 'Prices', card: 'Product cards', sale: 'Sale badges',
};

/** Which StorefrontColors key belongs to which role (also the reverse lookup for click-to-edit). */
export const COLOR_KEY_ROLE: Record<string, ColorRole> = {
  bgColor: 'page', textColor: 'page', mutedColor: 'page', borderColor: 'page',
  primaryColor: 'button', buttonTextColor: 'button',
  headingColor: 'heading', linkColor: 'link', priceColor: 'price', cardBgColor: 'card', saleColor: 'sale',
};

/** Field to open when a role is clicked in the preview (header/footer colors live in their own Header/Footer panels). */
export const ROLE_PRIMARY_KEY: Partial<Record<ColorRole, string>> = {
  page: 'bgColor', button: 'primaryColor', heading: 'headingColor', link: 'linkColor', price: 'priceColor', card: 'cardBgColor', sale: 'saleColor',
};

/** Generic selectors used to outline a role's parts in the preview. `page` is handled separately (the preview root). */
// A theme can mark its own elements with `data-color-role="price|sale|card|button"`
// (Maison's product card does) — the most reliable match. The class-name guesses
// after it are a best-effort fallback for themes that don't.
const SEL = {
  price: '[data-color-role="price"], [class*="price" i]',
  button: '[data-color-role="button"], button, [role="button"], .fx-pill, .fx-cta',
  heading: 'h1, h2, h3',
  sale: '[data-color-role="sale"], [class*="sale" i], [class*="badge" i]',
  link: 'a',
  card: '[data-color-role="card"], [data-fx-card], [class*="card" i]',
  header: '[data-editor-chrome="header"], header',
  footer: '[data-editor-chrome="footer"], footer',
} as const;

export const ROLE_SELECTORS: Record<Exclude<ColorRole, 'page'>, string> = SEL;

/** Picks the most specific role for a clicked element in the preview. Order matters: a price/button/heading inside a card is that thing, not "the card". */
export function roleFromElement(el: Element | null): ColorRole {
  if (!el) return 'page';
  if (el.closest(SEL.price)) return 'price';
  if (el.closest(SEL.button)) return 'button';
  if (el.closest(SEL.heading)) return 'heading';
  if (el.closest(SEL.sale)) return 'sale';
  if (el.closest(SEL.link)) return 'link';
  if (el.closest(SEL.card)) return 'card';
  if (el.closest(SEL.header)) return 'header';
  if (el.closest(SEL.footer)) return 'footer';
  return 'page';
}

type Listener<T> = (value: T) => void;

function channel<T>() {
  const listeners = new Set<Listener<T>>();
  return {
    emit: (value: T) => listeners.forEach(l => l(value)),
    subscribe: (l: Listener<T>) => { listeners.add(l); return () => { listeners.delete(l); }; },
  };
}

const hoverChannel = channel<ColorRole | null>();
const pickChannel = channel<ColorRole>();

export const setHoveredColorRole = hoverChannel.emit;
export const subscribeHoveredColorRole = hoverChannel.subscribe;
export const pickColorRole = pickChannel.emit;
export const subscribePickedColorRole = pickChannel.subscribe;
