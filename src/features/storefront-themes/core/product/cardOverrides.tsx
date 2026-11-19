import { createContext, useContext, useMemo, type ReactNode } from 'react';

/** Per-section look of product cards (Shopify: the card options sit in each product section, not only in theme settings).
 *  `undefined` = follow the theme setting. */
export interface CardOverrides { button?: boolean; viewLink?: boolean; wishlist?: boolean; rating?: boolean; whole?: boolean }

const Ctx = createContext<CardOverrides>({});
export const useCardOverrides = (): CardOverrides => useContext(Ctx);

const showHide = (v: unknown): boolean | undefined => (v === 'show' ? true : v === 'hide' ? false : undefined);

/** The overrides a section's own settings ask for (blank / "Theme setting" = none). */
export function cardOverridesOf(s: Record<string, unknown>): CardOverrides {
  return {
    button: showHide(s.cardButton), viewLink: showHide(s.cardViewLink), wishlist: showHide(s.cardWishlist), rating: showHide(s.cardRating),
    whole: s.cardImageFit === 'whole' ? true : s.cardImageFit === 'fill' ? false : undefined,
  };
}

/** Wrap a product section so every card inside follows the section's own card options. */
export function CardOverridesProvider({ settings, children }: { settings: Record<string, unknown>; children: ReactNode }) {
  const { cardButton, cardViewLink, cardWishlist, cardRating, cardImageFit } = settings;
  const value = useMemo(() => cardOverridesOf({ cardButton, cardViewLink, cardWishlist, cardRating, cardImageFit }), [cardButton, cardViewLink, cardWishlist, cardRating, cardImageFit]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
