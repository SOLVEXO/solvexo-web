import type { MetafieldType } from '@/api/services/metafields';

export interface SpecSuggestion { name: string; type: MetafieldType }

/** Starter specs for common kinds of product, matched on the category's name (Shopify suggests the same from its product taxonomy).
 *  The seller adds the ones they want with one click; nothing is created by itself. */
const CATALOG: { label: string; match: RegExp; specs: SpecSuggestion[] }[] = [
  { label: 'Clothing', match: /cloth|apparel|garment|shirt|dress|kurta|kameez|shalwar|salwar|suit|trouser|pant|jean|jacket|hoodie|sweater|abaya|saree|sari|lawn|unstitched|fabric|wear|fashion/i,
    specs: [{ name: 'Size', type: 'single_line_text_field' }, { name: 'Fabric', type: 'single_line_text_field' }, { name: 'Fit', type: 'single_line_text_field' }, { name: 'Season', type: 'single_line_text_field' }, { name: 'Care instructions', type: 'multi_line_text_field' }] },
  { label: 'Shoes', match: /shoe|sneaker|sandal|boot|footwear|heel|slipper|loafer/i,
    specs: [{ name: 'Size', type: 'single_line_text_field' }, { name: 'Material', type: 'single_line_text_field' }, { name: 'Sole', type: 'single_line_text_field' }, { name: 'Heel height', type: 'dimension' }] },
  { label: 'Electronics', match: /electronic|phone|mobile|laptop|computer|tablet|camera|headphone|earphone|speaker|charger|gadget|television|\btv\b|appliance|watch/i,
    specs: [{ name: 'Brand', type: 'single_line_text_field' }, { name: 'Model', type: 'single_line_text_field' }, { name: 'Warranty', type: 'single_line_text_field' }, { name: 'Battery', type: 'single_line_text_field' }, { name: 'Voltage', type: 'single_line_text_field' }, { name: 'Weight', type: 'weight' }] },
  { label: 'Furniture & decor', match: /furniture|sofa|chair|table|bed\b|wardrobe|desk|shelf|cabinet|decor|lamp|curtain|rug|carpet/i,
    specs: [{ name: 'Material', type: 'single_line_text_field' }, { name: 'Width', type: 'dimension' }, { name: 'Height', type: 'dimension' }, { name: 'Depth', type: 'dimension' }, { name: 'Weight', type: 'weight' }, { name: 'Assembly required', type: 'boolean' }] },
  { label: 'Jewellery', match: /jewel|ring|necklace|earring|bracelet|bangle|pendant|chain/i,
    specs: [{ name: 'Material', type: 'single_line_text_field' }, { name: 'Stone', type: 'single_line_text_field' }, { name: 'Weight', type: 'weight' }, { name: 'Size', type: 'single_line_text_field' }] },
  { label: 'Bags', match: /\bbag|wallet|purse|luggage|backpack|handbag|clutch/i,
    specs: [{ name: 'Material', type: 'single_line_text_field' }, { name: 'Width', type: 'dimension' }, { name: 'Height', type: 'dimension' }, { name: 'Capacity', type: 'volume' }] },
  { label: 'Beauty', match: /beauty|cosmetic|skin|makeup|perfume|fragrance|hair|serum|cream|lotion/i,
    specs: [{ name: 'Skin type', type: 'single_line_text_field' }, { name: 'Volume', type: 'volume' }, { name: 'Ingredients', type: 'multi_line_text_field' }, { name: 'Shelf life', type: 'single_line_text_field' }] },
  { label: 'Food', match: /food|grocery|snack|\btea\b|coffee|spice|honey|sweet|dry fruit|nuts?\b|oil\b/i,
    specs: [{ name: 'Net weight', type: 'weight' }, { name: 'Ingredients', type: 'multi_line_text_field' }, { name: 'Shelf life', type: 'single_line_text_field' }, { name: 'Origin', type: 'single_line_text_field' }] },
  { label: 'Kids & toys', match: /toy|kid|baby|infant|game|puzzle/i,
    specs: [{ name: 'Age group', type: 'single_line_text_field' }, { name: 'Material', type: 'single_line_text_field' }, { name: 'Batteries required', type: 'boolean' }] },
];

/** The first kind of product the category names fit, with its specs that the store does not have yet (by name). Null when nothing fits or all exist. */
export function suggestSpecs(categoryNames: string[], existingNames: string[]): { label: string; specs: SpecSuggestion[] } | null {
  const names = categoryNames.map(n => n.trim()).filter(Boolean);
  if (names.length === 0) return null;
  const have = new Set(existingNames.map(n => n.trim().toLowerCase()));
  // The most specific name (sub-category) is tried first, then the main one.
  for (const name of [...names].reverse()) {
    const hit = CATALOG.find(c => c.match.test(name));
    if (!hit) continue;
    const specs = hit.specs.filter(s => !have.has(s.name.toLowerCase()));
    return specs.length > 0 ? { label: hit.label, specs } : null;
  }
  return null;
}
