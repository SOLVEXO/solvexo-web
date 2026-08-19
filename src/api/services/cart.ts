import client from '../client';
import { ENDPOINTS } from '../endpoints';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId:        string;
  productVariantId: string;
  name:             string;
  image?:           string[];
  images?:          string[];
  unitPrice?:       number;
  price?:           number;
  /** Display-only snapshot of the owning store's currency at add-to-cart
   *  time — the authoritative conversion only happens at checkout creation. */
  currency?:        string | null;
  quantity:         number;
  itemTotal?:       number;
  type?:            'physical' | 'digital';
}

export interface Cart {
  _id?:       string;
  userId:     string;
  storeId?:   string;
  items:      CartItem[];
  totalItems: number;
  totalPrice: number;
  status?:    string;
}

interface CartResponse   { message: string; data: Cart }
interface ItemResponse   { message: string; data: CartItem | CartItem[] }
interface ClearResponse  { message: string; data: [] }

// ── API ───────────────────────────────────────────────────────────────────────

// A logged-in buyer's cart is scoped per store (each store's subdomain is
// its own isolated shopping session) — every call now carries the storeId
// of the store currently being shopped on.

export function apiAddToCart(productId: string, productVariantId: string, storeId: string) {
  return client.post<never, CartResponse>(ENDPOINTS.CART.ADD, { productId, productVariantId, storeId });
}

export function apiGetCart(storeId: string) {
  return client.get<never, CartResponse>(ENDPOINTS.CART.GET, { params: { storeId } });
}

export function apiUpdateCartQuantity(
  productId: string,
  productVariantId: string,
  action: 'increase' | 'decrease',
  storeId: string,
) {
  return client.post<never, ItemResponse>(ENDPOINTS.CART.UPDATE_QUANTITY, {
    productId, productVariantId, action, storeId,
  });
}

export function apiRemoveCartItem(productId: string, productVariantId: string, storeId: string) {
  return client.post<never, ItemResponse>(ENDPOINTS.CART.REMOVE_ITEM, {
    productId, productVariantId, storeId,
  });
}

export function apiClearCart(cartId: string, storeId: string) {
  return client.post<never, ClearResponse>(ENDPOINTS.CART.CLEAR, { cartId, storeId });
}
