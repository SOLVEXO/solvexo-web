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
  quantity:         number;
  itemTotal?:       number;
  type?:            'physical' | 'digital';
}

export interface Cart {
  _id?:       string;
  userId:     string;
  items:      CartItem[];
  totalItems: number;
  totalPrice: number;
  status?:    string;
}

interface CartResponse   { message: string; data: Cart }
interface ItemResponse   { message: string; data: CartItem | CartItem[] }
interface ClearResponse  { message: string; data: [] }

// ── API ───────────────────────────────────────────────────────────────────────

export function apiAddToCart(productId: string, productVariantId: string) {
  return client.post<never, CartResponse>(ENDPOINTS.CART.ADD, { productId, productVariantId });
}

export function apiGetCart() {
  return client.get<never, CartResponse>(ENDPOINTS.CART.GET);
}

export function apiUpdateCartQuantity(
  productId: string,
  productVariantId: string,
  action: 'increase' | 'decrease',
) {
  return client.post<never, ItemResponse>(ENDPOINTS.CART.UPDATE_QUANTITY, {
    productId, productVariantId, action,
  });
}

export function apiRemoveCartItem(productId: string, productVariantId: string) {
  return client.post<never, ItemResponse>(ENDPOINTS.CART.REMOVE_ITEM, {
    productId, productVariantId,
  });
}

export function apiClearCart(cartId: string) {
  return client.post<never, ClearResponse>(ENDPOINTS.CART.CLEAR, { cartId });
}
