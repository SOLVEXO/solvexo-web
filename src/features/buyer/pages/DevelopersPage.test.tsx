import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { seoForPath } from '@/seo/publicPages';
import { isSitePath } from '@/i18n/site/siteLanguage';

const api = vi.hoisted(() => ({ apiGetOpenApiSpec: vi.fn() }));
vi.mock('@/api/services/developers', async (orig) => ({ ...(await orig<typeof import('@/api/services/developers')>()), apiGetOpenApiSpec: api.apiGetOpenApiSpec }));

vi.mock('@/components/comman/ui/Footer', () => ({ Footer: () => null }));
// The heading's reveal animation watches scrolling, and the copy button checks the pointer; jsdom has neither.
globalThis.IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } } as unknown as typeof IntersectionObserver;
window.matchMedia ??= ((query: string) => ({ matches: false, media: query, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false })) as typeof window.matchMedia;

import { DevelopersPage } from './DevelopersPage';

afterEach(cleanup);
beforeEach(() => api.apiGetOpenApiSpec.mockReset());

const SPEC = {
  openapi: '3.1.0',
  info: { title: 'Solvexo Admin API', version: '1.0.0' },
  servers: [{ url: 'https://api.example.com/api/merchant/v1' }],
  tags: [{ name: 'Orders' }, { name: 'Customers' }],
  paths: {
    '/orders': { get: { tags: ['Orders'], operationId: 'listOrders', summary: 'List orders', 'x-required-scope': 'read_orders',
      parameters: [{ name: 'cursor', in: 'query', description: 'The next_cursor of the previous page.', schema: { type: 'string' } }, { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'shipped'] } }],
      responses: { '200': { content: { 'application/json': { schema: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/Order' } }, has_more: { type: 'boolean' }, next_cursor: { type: ['string', 'null'] } } } } } } } } },
    '/orders/{id}/fulfillments': { post: { tags: ['Orders'], operationId: 'fulfilOrder', summary: 'Ship order lines', 'x-required-scope': 'write_orders',
      parameters: [{ name: 'Idempotency-Key', in: 'header', required: true, schema: { type: 'string' } }],
      requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/FulfillmentInput' } } } } } },
    '/customers': { get: { tags: ['Customers'], operationId: 'listCustomers', summary: 'List customers' } },
  },
  webhooks: { 'order.paid': { post: { operationId: 'w', requestBody: { content: { 'application/json': { schema: { description: '{ order_id, total, currency }' } } } } } } },
  components: { schemas: {
    Order: { type: 'object', properties: { id: { type: 'string' }, total: { type: ['number', 'null'], description: 'Amount the buyer paid.' } } },
    FulfillmentInput: { type: 'object', required: ['line_items'], properties: { line_items: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, quantity: { type: 'integer' } } } }, carrier: { type: 'string' } } },
  } },
};

const renderPage = () => render(<MemoryRouter><DevelopersPage /></MemoryRouter>);

describe('DevelopersPage', () => {
  it('lists the endpoints from the API\'s OpenAPI file, grouped, with scopes, parameters and fields', async () => {
    api.apiGetOpenApiSpec.mockResolvedValue(SPEC);
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Build on Solvexo' })).toBeInTheDocument();
    const orders = await screen.findByText('List orders');
    const card = orders.closest('article')!;
    expect(within(card).getByText('/orders')).toBeInTheDocument();
    expect(within(card).getByText('read_orders')).toBeInTheDocument();
    expect(within(card).getByText('cursor')).toBeInTheDocument();
    expect(within(card).getByText('pending | shipped')).toBeInTheDocument();
    expect(within(card).getByText('Amount the buyer paid.')).toBeInTheDocument();
    const ship = screen.getByText('Ship order lines').closest('article')!;
    expect(within(ship).getByText('Idempotency-Key')).toBeInTheDocument();
    expect(within(ship).getByText('line_items')).toBeInTheDocument();
    expect(within(ship).getByText('id, quantity')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Customers' })).toBeInTheDocument();
    expect(screen.getByText('order.paid')).toBeInTheDocument();
    expect(screen.getByText('{ order_id, total, currency }')).toBeInTheDocument();
    expect(screen.getByText(/api\.example\.com\/api\/merchant\/v1$/)).toBeInTheDocument();
  });

  it('shows an error with a retry that loads again', async () => {
    api.apiGetOpenApiSpec.mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce(SPEC);
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.getByText('List orders')).toBeInTheDocument());
    expect(api.apiGetOpenApiSpec).toHaveBeenCalledTimes(2);
  });

  it('is in search results, and stays English (not a site-language page)', () => {
    expect(seoForPath('/developers')).toMatchObject({ index: true });
    expect(isSitePath('/developers')).toBe(false);
  });
});
