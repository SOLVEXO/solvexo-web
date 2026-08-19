// Curated, verified-reachable Unsplash photo ids for the industry/product
// imagery used across the redesigned public marketing pages — approved as a
// deliberate exception to this app's normal "local asset or nothing"
// convention (see Homepage/ForSellersPage decision log). Every id below was
// checked with a live HTTP request before being added here; if Unsplash ever
// retires one of these ids, `unsplashUrl` still degrades to a normal broken-
// image case (browser alt text), not a build failure.
const PHOTO_IDS = {
  fashionRack:      '1441986300917-64674bd600d8',
  sneakers:         '1542291026-7eec264c27ff',
  headphones:       '1505740420928-5e560c06d30e',
  watch:            '1523275335684-37898b6baf30',
  skincare:         '1512496015851-a90fb38ba796',
  cosmetics:        '1522335789203-aabd1fc54bc9',
  plateOfFood:      '1517248135467-4c7edcad34c4',
  homeInterior:     '1493663284031-b7e3aefcae8e',
  coffeeShop:       '1495474472287-4d71bcdd2085',
  cameraGear:       '1516035069371-29a1b244cc32',
  freshProduce:     '1542838132-92c53300491e',
  smallCafeCounter: '1556740758-90de374c12ad',
  businessHandshake:'1441984904996-e0b6ba687e04',
  deskPlant:        '1472851294608-062f824d29cc',
  makeupBrushes:    '1556909212-d5b604d0c90d',
  workspaceLaptop:  '1472099645785-5658abf4ff4e',
} as const;

export type StockPhotoKey = keyof typeof PHOTO_IDS;

export function unsplashUrl(key: StockPhotoKey, width = 480, quality = 75): string {
  return `https://images.unsplash.com/photo-${PHOTO_IDS[key]}?w=${width}&q=${quality}&auto=format&fit=crop`;
}
