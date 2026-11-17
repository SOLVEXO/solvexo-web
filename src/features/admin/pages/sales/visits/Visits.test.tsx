import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const api = vi.hoisted(() => ({
  apiSaveVisit: vi.fn(), apiListVisits: vi.fn(), apiGetVisit: vi.fn(), apiUpdateVisit: vi.fn(), apiCheckVisit: vi.fn(), apiVisitAreas: vi.fn(),
}));
vi.mock('@/api/services/salesVisits', async (orig) => ({ ...(await orig<typeof import('@/api/services/salesVisits')>()), ...api }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => toast }));
vi.mock('@/api/services/auth', () => ({ TokenStorage: { getUser: () => ({ name: 'Ali Raza' }) } }));

import { VisitFormPage } from './VisitFormPage';
import { emptyVisit, missingFields, nextStepDate, toVisitInput } from './visitForm';
import { VisitsTab } from './VisitsTab';
import { periodStart, visitsToCsv } from './visitsReport';
import { enqueueVisit, pendingCount, queuedVisits, syncQueuedVisits } from './visitQueue';
import { VISIT_OPTIONS } from './visitOptions';
import type { SalesVisit, VisitInput } from '@/api/services/salesVisits';

const setOnline = (v: boolean) => Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => v });

beforeEach(() => {
  localStorage.clear();
  setOnline(true);
  api.apiVisitAreas.mockResolvedValue({ data: ['Tariq Road · Karachi', 'Liberty · Lahore'] });
  api.apiCheckVisit.mockResolvedValue({ data: [] });
  // jsdom has no geolocation; the form must still work.
  Object.defineProperty(window.navigator, 'geolocation', { configurable: true, value: undefined });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.useRealTimers(); });

const input = (over: Partial<VisitInput> = {}): VisitInput => ({
  ...toVisitInput({ ...emptyVisit(), storeName: 'Glow', interest: 'warm', nextStep: 'none' }, { clientId: 'c-1', visitedAt: new Date('2026-11-17T10:00:00Z'), location: null, photoDataUrl: null }),
  ...over,
});

describe('visit form rules', () => {
  it('needs a store name, interest, next step and (unless "None") a date', () => {
    expect(missingFields(emptyVisit())).toEqual(['Store name', 'Interest', 'Next step']);
    expect(missingFields({ ...emptyVisit(), storeName: 'A', interest: 'hot', nextStep: 'demo' })).toEqual(['Next step date']);
    expect(missingFields({ ...emptyVisit(), storeName: 'A', interest: 'hot', nextStep: 'demo', when: 'tomorrow' })).toEqual([]);
    expect(missingFields({ ...emptyVisit(), storeName: 'A', interest: 'hot', nextStep: 'none' })).toEqual([]);
  });

  it('turns "In 3 days" or a picked date into 10:00 on that day', () => {
    const now = new Date(2026, 10, 17, 16, 30);
    expect(nextStepDate({ when: 'three_days', pickDate: '' }, now)).toEqual(new Date(2026, 10, 20, 10, 0));
    expect(nextStepDate({ when: 'pick', pickDate: '2026-12-01' }, now)).toEqual(new Date(2026, 11, 1, 10, 0));
    expect(nextStepDate({ when: 'pick', pickDate: '' }, now)).toBeNull();
  });

  it('sends keys, drops "other" text when not chosen, and only keeps WhatsApp permission with a number', () => {
    const body = toVisitInput({ ...emptyVisit(), storeName: ' Glow ', category: 'shoes', categoryOther: 'x', billing: 'excel', billingSoftware: 'y', waPermission: 'yes', interest: 'hot', nextStep: 'none' },
      { clientId: 'c', visitedAt: new Date(), location: null, photoDataUrl: null });
    expect(body).toMatchObject({ storeName: 'Glow', category: 'shoes', categoryOther: null, billing: 'excel', billingSoftware: null, whatsapp: null, nextStepAt: null });
  });

  it('keeps the answer keys the API accepts', () => {
    // Mirror of solvexo-api/src/sales-ops/field-visit.constants.ts (spot check of each group's keys).
    expect(VISIT_OPTIONS.interest.map(o => o.key)).toEqual(['hot', 'warm', 'cold', 'not_interested']);
    expect(VISIT_OPTIONS.nextStep.map(o => o.key)).toEqual(['demo', 'send_price', 'revisit', 'signup', 'call_back', 'none']);
    expect(VISIT_OPTIONS.couriers.map(o => o.key)).toEqual(['tcs', 'leopards', 'mnp', 'postex', 'trax', 'blueex', 'call_courier', 'own_rider', 'none']);
    for (const group of Object.values(VISIT_OPTIONS)) for (const o of group) expect(o.ur.trim()).not.toBe('');
  });
});

describe('offline queue', () => {
  it('uploads waiting visits in order, keeps them on a network failure and marks a refused one', async () => {
    enqueueVisit(input({ clientId: 'a', storeName: 'A' }));
    enqueueVisit(input({ clientId: 'b', storeName: 'B' }));
    enqueueVisit(input({ clientId: 'c', storeName: 'C' }));
    const send = vi.fn()
      .mockResolvedValueOnce({ data: {} })
      .mockRejectedValueOnce(Object.assign(new Error('Enter the store name.'), { status: 400 }))
      .mockRejectedValueOnce(Object.assign(new Error('Network Error'), { isNetworkError: true }));
    const r = await syncQueuedVisits(send);
    expect(send.mock.calls.map(c => c[0].clientId)).toEqual(['a', 'b', 'c']);
    expect(r).toEqual({ sent: 1, failed: 1, waiting: 2 });
    const left = queuedVisits();
    expect(left.map(q => [q.input.clientId, q.error])).toEqual([['b', 'Enter the store name.'], ['c', null]]);

    const again = vi.fn().mockResolvedValue({ data: {} });
    await syncQueuedVisits(again);
    expect(again.mock.calls.map(c => c[0].clientId)).toEqual(['c']); // the refused one waits for the rep
  });

  it('keeps the visit without its photo when storage is full', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => { throw new Error('QuotaExceededError'); });
    expect(enqueueVisit(input({ photoDataUrl: 'data:image/jpeg;base64,AAAA' }))).toBe('saved_without_photo');
    expect(queuedVisits()[0].input.photoDataUrl).toBeNull();
    setItem.mockRestore();
  });
});

describe('VisitFormPage', () => {
  const fill = async () => {
    render(<MemoryRouter><VisitFormPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText(/Store name/), { target: { value: 'Zainab Collection' } });
    fireEvent.click(within(screen.getByRole('group', { name: 'Category' })).getByRole('button', { name: 'Clothing' }));
    fireEvent.click(within(screen.getByRole('group', { name: 'Sells on' })).getByRole('button', { name: 'Instagram' }));
    fireEvent.click(within(screen.getByRole('group', { name: 'Sells on' })).getByRole('button', { name: 'Shop' }));
    fireEvent.click(within(screen.getByRole('group', { name: 'Interest' })).getByRole('button', { name: '🔥 Hot' }));
    fireEvent.click(within(screen.getByRole('group', { name: 'Next step' })).getByRole('button', { name: 'Demo' }));
    fireEvent.click(within(screen.getByRole('group', { name: 'Next step date' })).getByRole('button', { name: 'Tomorrow' }));
    await screen.findByRole('button', { name: 'Tariq Road · Karachi' });
    fireEvent.click(screen.getByRole('button', { name: 'Tariq Road · Karachi' }));
  };

  it('saves a visit made by tapping, and tells the rep about the follow-up', async () => {
    api.apiSaveVisit.mockResolvedValue({ data: { visit: { _id: 'v1' }, leadId: 'l1', alreadySaved: false, followUpOwner: 'Ali Raza' } });
    await fill();
    fireEvent.click(screen.getByRole('button', { name: 'Save visit' }));
    await waitFor(() => expect(api.apiSaveVisit).toHaveBeenCalledTimes(1));
    expect(api.apiSaveVisit.mock.calls[0][0]).toMatchObject({
      storeName: 'Zainab Collection', category: 'clothing', sellsOn: ['instagram', 'shop'], interest: 'hot', nextStep: 'demo', area: 'Tariq Road · Karachi',
    });
    expect(api.apiSaveVisit.mock.calls[0][0].nextStepAt).toBeTruthy();
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Follow-up “Demo” for you')));
    expect(screen.getByLabelText(/Store name/)).toHaveValue(''); // ready for the next shop
  });

  it('shows what is missing instead of sending a half-filled visit', async () => {
    render(<MemoryRouter><VisitFormPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Save visit' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Fill in: Store name, Interest, Next step.');
    expect(api.apiSaveVisit).not.toHaveBeenCalled();
  });

  it('keeps the visit on the phone when the network drops', async () => {
    api.apiSaveVisit.mockRejectedValue(Object.assign(new Error('Network Error'), { isNetworkError: true }));
    await fill();
    fireEvent.click(screen.getByRole('button', { name: 'Save visit' }));
    await waitFor(() => expect(pendingCount()).toBe(1));
    expect(toast.info).toHaveBeenCalledWith(expect.stringContaining('No signal'));
    expect(queuedVisits()[0].input.storeName).toBe('Zainab Collection');
  });

  it('warns when the WhatsApp number was visited before', async () => {
    api.apiCheckVisit.mockResolvedValue({ data: [{ _id: 'v0', leadId: 'l0', storeName: 'Zainab Collection', area: null, visitedAt: '2026-11-03T10:00:00Z', adminName: 'Hira Khan', interest: 'warm', nextStep: 'send_price', nextStepAt: null, samePhone: true }] });
    render(<MemoryRouter><VisitFormPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('WhatsApp'), { target: { value: '0300 1234567' } });
    const warning = await screen.findByText('Already visited', {}, { timeout: 2000 });
    expect(warning.closest('[role="status"]')).toHaveTextContent('by Hira Khan (Warm, “Send price on WhatsApp”)');
    expect(warning.closest('[role="status"]')).toHaveTextContent('Saving adds this visit to the same lead.');
  });
});

const visit = (over: Partial<SalesVisit> = {}): SalesVisit => ({
  _id: 'v1', clientId: 'c1', leadId: 'l1', adminId: 'a1', adminName: 'Ali Raza', visitedAt: '2026-11-17T10:00:00Z', createdAt: '2026-11-17T10:00:00Z',
  location: { lat: 24.87, lng: 67.06, accuracyM: 12 }, photoUrl: null, taskId: 't1',
  storeName: 'Zainab Collection', unit: 'Shop 14', floor: 'first', area: 'Tariq Road', category: 'clothing', sellsOn: ['shop', 'instagram'],
  interest: 'hot', nextStep: 'demo', nextStepAt: '2026-11-20T05:00:00Z', problem: 'Stock ka pata, "COD" wapas', objections: ['ask_partner'],
  ...over,
});

describe('VisitsTab', () => {
  it('lists visits with totals and opens one', async () => {
    api.apiListVisits.mockResolvedValue({ data: { items: [visit()], total: 1, page: 1, limit: 100, summary: { visits: 1, shops: 1, hot: 1, demos: 1, signups: 0 } } });
    render(<MemoryRouter><VisitsTab isManager owners={[]} /></MemoryRouter>);
    const row = (await screen.findByRole('button', { name: 'Zainab Collection' })).closest('tr')!;
    expect(within(row).getByText('Shop 14 · 1st floor')).toBeInTheDocument();
    expect(within(row).getByText('Shop, Instagram')).toBeInTheDocument();
    expect(within(row).getByText('Hot')).toBeInTheDocument();
    fireEvent.click(within(row).getByRole('button', { name: 'Zainab Collection' }));
    expect(await screen.findByText('Need to ask partner')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Map/ })).toHaveAttribute('href', 'https://www.google.com/maps?q=24.87,67.06');
  });

  it('shows visits still on this phone and uploads them', async () => {
    api.apiListVisits.mockResolvedValue({ data: { items: [], total: 0, page: 1, limit: 100, summary: { visits: 0, shops: 0, hot: 0, demos: 0, signups: 0 } } });
    api.apiSaveVisit.mockResolvedValue({ data: {} });
    enqueueVisit(input({ clientId: 'q1', storeName: 'Offline shop' }));
    render(<MemoryRouter><VisitsTab isManager={false} owners={[]} /></MemoryRouter>);
    expect(await screen.findByText('1 visit saved on this phone, not uploaded yet')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Upload now' }));
    await waitFor(() => expect(api.apiSaveVisit).toHaveBeenCalledWith(expect.objectContaining({ clientId: 'q1' })));
    await waitFor(() => expect(screen.queryByText(/saved on this phone/)).not.toBeInTheDocument());
  });

  it('exports every answer as CSV, quoting commas and neutralising formulas', () => {
    const csv = visitsToCsv([visit({ contactName: '=HYPERLINK("x")' })]).split('\r\n');
    expect(csv[0].split(',').slice(0, 4)).toEqual(['Visited at', 'Rep', 'Store', 'Unit']);
    expect(csv[1]).toContain('"Stock ka pata, ""COD"" wapas"');
    expect(csv[1]).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv[1]).toContain('Need to ask partner');
  });

  it('starts the week on Monday', () => {
    expect(periodStart('week', new Date(2026, 10, 19, 15))).toEqual(new Date(2026, 10, 16));
    expect(periodStart('all')).toBeNull();
  });
});
