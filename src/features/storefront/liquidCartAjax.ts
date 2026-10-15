import type { Cart, CartItem } from '@/api/services/cart';

/**
 * Many real Shopify theme scripts (cart drawers, quick-add, Dawn/Horizon's own JS) call the storefront's
 * `/cart/add.js`, `/cart/change.js`, `/cart/update.js`, `/cart/clear.js`, `/cart.js` endpoints with `fetch`
 * instead of submitting a plain form. The sandboxed iframe's bridge script turns those calls into
 * `solvexo:cart-ajax` postMessages (see `appendStorefrontBridge` on the backend); this file is the parent-side
 * logic that answers them using the SAME cart the rest of the storefront uses, and shapes the reply like
 * Shopify's own Cart AJAX API so theme JS written against that API keeps working unmodified.
 */

export type CartAjaxAction = 'add' | 'change' | 'update' | 'clear' | 'get';

/** One line from a `/cart/add.js` or `/cart/change.js` request body — Shopify accepts either shape. */
export interface CartAjaxAddPayload { id?: string | number; quantity?: number; items?: Array<{ id?: string | number; quantity?: number }> }
export interface CartAjaxChangePayload { id?: string | number; line?: number; quantity?: number }
export interface CartAjaxUpdatePayload { updates?: Record<string, number> | number[] }

const cents = (amount: number | undefined) => Math.round((amount ?? 0) * 100);

function lineToShopifyItem(item: CartItem, index: number) {
  const image = item.images?.[0] ?? item.image?.[0] ?? null;
  const price = item.unitPrice ?? item.price ?? 0;
  return {
    id: item.productVariantId,
    variant_id: item.productVariantId,
    product_id: item.productId,
    key: `${item.productVariantId}:${index}`,
    quantity: item.quantity,
    title: item.name,
    product_title: item.name,
    variant_title: null,
    price: cents(price),
    line_price: cents(item.itemTotal ?? price * item.quantity),
    final_price: cents(price),
    final_line_price: cents(item.itemTotal ?? price * item.quantity),
    sku: '',
    url: '/cart',
    image,
    featured_image: image ? { url: image } : null,
    product_type: item.type ?? 'physical',
  };
}

/** The current cart, shaped like Shopify's `/cart.js` response — the shared reply body for every cart AJAX action. */
export function toShopifyCartJson(cart: Cart | null | undefined) {
  const items = (cart?.items ?? []).map(lineToShopifyItem);
  return {
    token: cart?._id ?? '',
    item_count: cart?.totalItems ?? items.reduce((sum, item) => sum + item.quantity, 0),
    total_price: cents(cart?.totalPrice ?? items.reduce((sum, item) => sum + item.final_line_price / 100, 0)),
    currency: cart?.items?.[0]?.currency ?? 'USD',
    items,
  };
}

/** Normalizes a `/cart/add.js` body (single `{id,quantity}` or Shopify's `{items:[...]}` form) into one list. */
export function parseAddPayload(payload: CartAjaxAddPayload | null | undefined): Array<{ variantId: string; quantity: number }> {
  const raw = Array.isArray(payload?.items) && payload!.items!.length ? payload!.items! : payload?.id !== undefined ? [payload] : [];
  return raw
    .map((line) => ({ variantId: String(line?.id ?? '').trim(), quantity: Number(line?.quantity ?? 1) }))
    .filter((line) => line.variantId && Number.isInteger(line.quantity) && line.quantity >= 1 && line.quantity <= 999);
}

/** Resolves a `/cart/change.js` body (by variant id OR by 1-based line number) to the cart line it targets. */
export function findChangeTarget(cart: Cart | null | undefined, payload: CartAjaxChangePayload | null | undefined) {
  const items = cart?.items ?? [];
  const variantId = payload?.id !== undefined ? String(payload.id) : undefined;
  if (variantId) return items.find((item) => item.productVariantId === variantId) ?? null;
  const line = Number(payload?.line);
  return Number.isInteger(line) && line >= 1 && line <= items.length ? items[line - 1] : null;
}

/** `/cart/update.js` accepts `{updates:{variantId:qty}}` or the line-indexed array form `{updates:[qty,qty,...]}`. */
export function parseUpdatePayload(cart: Cart | null | undefined, payload: CartAjaxUpdatePayload | null | undefined) {
  const updates = payload?.updates;
  const items = cart?.items ?? [];
  if (Array.isArray(updates)) {
    return updates
      .map((quantity, index) => ({ item: items[index], quantity: Number(quantity) }))
      .filter((entry): entry is { item: CartItem; quantity: number } => !!entry.item && Number.isInteger(entry.quantity) && entry.quantity >= 0 && entry.quantity <= 999);
  }
  if (updates && typeof updates === 'object') {
    return Object.entries(updates)
      .map(([variantId, quantity]) => ({ item: items.find((item) => item.productVariantId === variantId), quantity: Number(quantity) }))
      .filter((entry): entry is { item: CartItem; quantity: number } => !!entry.item && Number.isInteger(entry.quantity) && entry.quantity >= 0 && entry.quantity <= 999);
  }
  return [];
}
