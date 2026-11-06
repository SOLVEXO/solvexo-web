import { useState } from 'react';
import client from '@/api/client';
import { useKeyedLoad } from '@/components/comman/dashboard/useKeyedLoad';

export const PAGE_SIZE = 20;

/** Loads one endpoint; keeps loading / error (with retry) state in one place. */
export function useApi<T>(url: string) {
  const r = useKeyedLoad<T>(() => client.get(url) as Promise<T>, url);
  return { data: r.data, error: r.error || null, loading: r.loading, reload: r.retry };
}

export interface Paged<T> { items: T[]; total: number; page: number; limit: number }

export function usePaged<T>(base: string, params: Record<string, string>) {
  const key = JSON.stringify(params);
  const [pg, setPg] = useState({ key, page: 1 });
  const page = pg.key === key ? pg.page : 1; // a new filter starts again on page 1
  const qs = new URLSearchParams({ ...params, page: String(page), limit: String(PAGE_SIZE) }).toString();
  const res = useApi<Paged<T>>(`${base}?${qs}`);
  return { ...res, page, setPage: (p: number) => setPg({ key, page: p }), rows: res.data?.items ?? [], total: res.data?.total ?? 0 };
}

export const money = (n: number | null | undefined, currency?: string | null) =>
  `${currency ? `${currency} ` : ''}${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const shortDate = (d?: string | Date | null) => (d ? new Date(d).toLocaleDateString() : '—');

export interface PaymentTerms { type: 'due_on_order' | 'net' | 'due_on_fulfilment'; netDays?: number | null }

export const termsLabel = (t?: PaymentTerms | null) =>
  !t ? 'No terms (pays at checkout)' : t.type === 'net' ? `Net ${t.netDays ?? 30}` : t.type === 'due_on_order' ? 'Due on order' : 'Due on fulfilment';

export const termsToValue = (t?: PaymentTerms | null) => (!t ? '' : t.type === 'net' ? `net:${t.netDays ?? 30}` : t.type);
export const valueToTerms = (v: string): PaymentTerms | null =>
  !v ? null : v.startsWith('net:') ? { type: 'net', netDays: Number(v.slice(4)) } : { type: v as PaymentTerms['type'] };

/** Payment-method keys the checkout understands (the company allow-list uses exactly these). */
export const PAYMENT_METHOD_OPTIONS: { key: string; label: string }[] = [
  { key: 'b2b_terms', label: 'Payment terms (invoice)' },
  { key: 'cash_on_delivery', label: 'Cash on delivery' },
  { key: 'manual_bank_transfer', label: 'Bank transfer' },
  { key: 'manual', label: 'Custom payment methods' },
  { key: 'stripe', label: 'Card (Stripe)' },
];
