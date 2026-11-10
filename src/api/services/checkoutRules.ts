import client from '../client';

export type RuleType = 'discount' | 'payment' | 'shipping' | 'validation';
export type RuleFieldKind = 'number' | 'string' | 'set' | 'boolean';
export interface RuleFieldInfo { field: string; kind: RuleFieldKind; needsAddress: boolean }
export interface RuleCondition { field: string; op: string; value: string | number | boolean | string[] }
export interface CheckoutRuleRow {
  _id: string;
  name: string;
  type: RuleType;
  status: 'active' | 'draft';
  priority: number;
  conditions: RuleCondition[];
  action: Record<string, unknown>;
}
export type CheckoutRuleInput = Partial<Omit<CheckoutRuleRow, '_id'>> & { name: string; type: RuleType };

/** Which operators each kind of field offers (mirrors the server whitelist). */
export const OPS_BY_KIND: Record<RuleFieldKind, { op: string; label: string }[]> = {
  number: [{ op: 'gte', label: 'is at least' }, { op: 'gt', label: 'is more than' }, { op: 'lte', label: 'is at most' }, { op: 'lt', label: 'is less than' }, { op: 'eq', label: 'equals' }, { op: 'neq', label: 'is not' }],
  string: [{ op: 'eq', label: 'is' }, { op: 'neq', label: 'is not' }, { op: 'in', label: 'is one of' }, { op: 'not_in', label: 'is none of' }, { op: 'starts_with', label: 'starts with' }],
  set: [{ op: 'contains', label: 'includes' }, { op: 'not_contains', label: 'does not include' }, { op: 'contains_any', label: 'includes any of' }],
  boolean: [{ op: 'eq', label: 'is' }],
};
export const FIELD_LABEL: Record<string, string> = {
  subtotal: 'Cart total', itemCount: 'Number of items', lineCount: 'Number of different products', maxLineQuantity: 'Largest quantity of one product',
  country: 'Delivery country', city: 'Delivery city', state: 'Delivery state', postalCode: 'Postal code',
  productIds: 'Products in cart (ids)', customerTags: 'Customer tags', isB2B: 'Wholesale customer', isGuest: 'Guest customer', hasDigital: 'Cart has digital items', hasPhysical: 'Cart has physical items',
};

const base = (storeId: string) => `/api/checkout-rules/${storeId}`;
export const apiListCheckoutRules = (storeId: string) => client.get(base(storeId)) as Promise<{ rules: CheckoutRuleRow[]; fields: RuleFieldInfo[] }>;
export const apiCreateCheckoutRule = (storeId: string, body: CheckoutRuleInput) => client.post(base(storeId), body) as Promise<CheckoutRuleRow>;
export const apiUpdateCheckoutRule = (storeId: string, id: string, body: Partial<CheckoutRuleInput>) => client.patch(`${base(storeId)}/${id}`, body) as Promise<CheckoutRuleRow>;
export const apiDeleteCheckoutRule = (storeId: string, id: string) => client.delete(`${base(storeId)}/${id}`) as Promise<{ success: boolean }>;
export interface RuleTestResult {
  context: { subtotal: number; itemCount: number; maxLineQuantity: number };
  discount: { total: number; applied: { label: string; amount: number }[] };
  blocks: { message: string }[];
  paymentMethods: string[];
  shippingZones: { id: string; name: string }[];
}
export const apiTestCheckoutRules = (storeId: string, body: { sample: Record<string, unknown>; includeDrafts?: boolean; methods?: string[] }) =>
  client.post(`${base(storeId)}/test`, body) as Promise<RuleTestResult>;

/** Buyer: what the rules do to my cart. */
export const apiCartRulePreview = (storeId: string) =>
  client.get('/api/checkout-rules/storefront/preview', { params: { storeId } }) as Promise<{ discount: { total: number; applied: { label: string; amount: number }[] }; blocks: string[]; hiddenPaymentMethods: string[]; showOnlyPaymentMethods: string[] | null }>;
