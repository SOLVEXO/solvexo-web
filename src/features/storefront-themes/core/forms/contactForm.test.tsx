import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { applyMerchantThemeOverrides } from '../../theme-03-fashion/theme.config';
import { ContactFormSection } from '../../theme-03-fashion/sections/shared/ContactFormSection';
import { FormFieldsEditor } from '@/features/seller/store/Dashboard/OnlineStore/builder/FormFieldsEditor';
import {
  buildAnswers, conditionHolds, conditionSources, contactFormProblem, firstMissingRequired, legacyContactFields, newContactField, resolveContactFields,
  successRedirect, visibleFields, type ContactFormField,
} from './contactFormFields';

const submitMock = vi.fn();
vi.mock('@/api/services/storeContact', () => ({ apiSubmitContactMessage: (...a: unknown[]) => submitMock(...a) }));
vi.mock('@/features/storefront/StorefrontContext', () => ({ useStorefront: () => ({ store: { storeId: 's1' } }) }));

const colors = { bg: '#fff', bgAlt: '#f5f5f5', ink: '#111', inkMuted: '#666', border: '#ddd', accent: '#a33', accentInk: '#fff' } as never;
const SECTION_ID = 'a'.repeat(24);
const section = (settings: Record<string, unknown>) => ({ _id: SECTION_ID, type: 'contact_form', settings, blocks: [] }) as never;

describe('contact form fields (logic)', () => {
  it('rebuilds the old fixed form for a section with no field list, and follows its labels', () => {
    expect(resolveContactFields({}).map(f => f.id)).toEqual(['name', 'email', 'phone', 'message']);
    expect(legacyContactFields({ showPhone: false, nameLabel: 'Full name' }).map(f => f.label)).toEqual(['Full name', 'Email', 'Message']);
  });

  it('asks for a required Email or Phone field (Shopify rule) and choices for dropdowns', () => {
    const base: ContactFormField[] = [{ id: 'a', type: 'text', label: 'Name', required: true }];
    expect(contactFormProblem(base)).toMatch(/Email or Phone/);
    expect(contactFormProblem([...base, { id: 'b', type: 'phone', label: 'Phone', required: true }])).toBeNull();
    expect(contactFormProblem([{ id: 'b', type: 'phone', label: 'Phone', required: true }, { id: 'c', type: 'dropdown', label: 'Topic', options: [] }])).toMatch(/choice/);
  });

  it('builds answers only for filled fields and finds the first missing required one', () => {
    const fields: ContactFormField[] = [
      { id: 'a', type: 'name', label: 'Name', required: true }, { id: 'b', type: 'checkbox', label: 'Pick', required: true, options: ['x', 'y'] },
    ];
    expect(buildAnswers(fields, { a: 'Ali', b: [] })).toEqual([{ fieldId: 'a', value: 'Ali' }]);
    expect(firstMissingRequired(fields, { a: 'Ali', b: [] })?.id).toBe('b');
    expect(firstMissingRequired(fields, { a: 'Ali', b: ['x'] })).toBeNull();
  });
});

describe('storefront contact form (Maison)', () => {
  beforeEach(() => { applyMerchantThemeOverrides(null); submitMock.mockReset().mockResolvedValue({ success: true }); });
  afterEach(cleanup);

  it('shows the classic form when the section has no field list', () => {
    render(<ContactFormSection section={section({ heading: 'Hi' })} blocks={[]} colors={colors} />);
    expect(screen.getByLabelText(/^Name/)).toBeTruthy();
    expect(screen.getByLabelText(/^Email/)).toBeTruthy();
    expect(screen.getByLabelText(/^Phone/)).toBeTruthy();
    expect(screen.getByLabelText(/^Message/)).toBeTruthy();
  });

  it('draws the seller\'s own fields and sends every answer with the section id', async () => {
    const fields: ContactFormField[] = [
      { id: 'f1', type: 'email', label: 'Your email', required: true },
      { id: 'f2', type: 'text', label: 'Order number', placeholder: 'e.g. 1042' },
      { id: 'f3', type: 'dropdown', label: 'Topic', options: ['Delivery', 'Refund'] },
      { id: 'f4', type: 'checkbox', label: 'Interests', options: ['Sales', 'News'] },
    ];
    render(<ContactFormSection section={section({ fields, buttonLabel: 'Go' })} blocks={[]} colors={colors} />);
    expect(screen.queryByLabelText(/^Message/)).toBeNull();
    expect((screen.getByPlaceholderText('e.g. 1042') as HTMLInputElement).type).toBe('text');
    fireEvent.change(screen.getByLabelText(/Your email/), { target: { value: 'a@b.co' } });
    fireEvent.change(screen.getByLabelText('Order number'), { target: { value: '1042' } });
    fireEvent.change(screen.getByLabelText('Topic'), { target: { value: 'Refund' } });
    fireEvent.click(screen.getByLabelText('Sales'));
    fireEvent.click(screen.getByLabelText('News'));
    fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(1));
    const [storeId, body] = submitMock.mock.calls[0] as [string, { sectionId: string; answers: unknown[]; website: string }];
    expect(storeId).toBe('s1');
    expect(body.sectionId).toBe(SECTION_ID);
    expect(body.website).toBe('');
    expect(body.answers).toEqual([
      { fieldId: 'f1', value: 'a@b.co' }, { fieldId: 'f2', value: '1042' }, { fieldId: 'f3', value: 'Refund' }, { fieldId: 'f4', value: ['Sales', 'News'] },
    ]);
    await waitFor(() => expect(screen.getByRole('status')).toBeTruthy());
  });

  it('refuses to send when a required multiple-choice field is empty', async () => {
    const fields: ContactFormField[] = [
      { id: 'f1', type: 'email', label: 'Email', required: true },
      { id: 'f4', type: 'checkbox', label: 'Interests', required: true, options: ['Sales', 'News'] },
    ];
    render(<ContactFormSection section={section({ fields })} blocks={[]} colors={colors} />);
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: 'a@b.co' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(submitMock).not.toHaveBeenCalled();
  });

  it('shows the server\'s message when sending fails', async () => {
    submitMock.mockRejectedValue(new Error('Email is required'));
    render(<ContactFormSection section={section({})} blocks={[]} colors={colors} />);
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: 'Ali' } });
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: 'a@b.co' } });
    fireEvent.change(screen.getByLabelText(/^Message/), { target: { value: 'Hi' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Email is required'));
  });
});

describe('contact form editor', () => {
  afterEach(cleanup);

  it('shows the old fixed form as an editable list and saves a full list on the first change', () => {
    const set = vi.fn();
    render(<FormFieldsEditor settings={{}} set={set} />);
    expect(screen.getAllByText('Name').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Phone (optional)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(set).toHaveBeenCalledTimes(1);
    const next = set.mock.calls[0][0].fields as ContactFormField[];
    expect(next.map(f => f.id)).toEqual(['name', 'email', 'message']);
  });

  it('adds a field of the chosen type and warns when no required Email or Phone is left', () => {
    const set = vi.fn();
    const { rerender } = render(<FormFieldsEditor settings={{ fields: [{ id: 'a1', type: 'text', label: 'Name', required: true }] }} set={set} />);
    expect(screen.getByRole('alert').textContent).toMatch(/Email or Phone/);
    fireEvent.change(screen.getByLabelText('Add a field'), { target: { value: 'dropdown' } });
    const next = set.mock.calls[0][0].fields as ContactFormField[];
    expect(next).toHaveLength(2);
    expect(next[1].type).toBe('dropdown');
    expect(next[1].options?.length).toBeGreaterThan(0);
    rerender(<FormFieldsEditor settings={{ fields: [...next, { ...newContactField('email'), required: true }] }} set={set} />);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('edits label, required and choices of a field', () => {
    const set = vi.fn();
    render(<FormFieldsEditor settings={{ fields: [{ id: 'd1', type: 'dropdown', label: 'Topic', options: ['A'] }, { id: 'e1', type: 'email', label: 'Email', required: true }] }} set={set} />);
    fireEvent.click(screen.getByText('Topic'));
    fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'Subject' } });
    expect((set.mock.calls.at(-1)![0].fields as ContactFormField[])[0].label).toBe('Subject');
    fireEvent.change(screen.getByLabelText('Choices'), { target: { value: 'A\n\nB \nA' } });
    expect((set.mock.calls.at(-1)![0].fields as ContactFormField[])[0].options).toEqual(['A', 'B']);
  });
});

describe('phase 1: conditions, new field types and form settings', () => {
  // A real browser stops a submit with an empty native required field before our code runs; here we send the form itself.
  const send = () => fireEvent.submit(screen.getByRole('button', { name: /send/i }).closest('form') as HTMLFormElement);
  beforeEach(() => { applyMerchantThemeOverrides(null); submitMock.mockReset().mockResolvedValue({ success: true }); });
  afterEach(cleanup);

  const conditionalFields: ContactFormField[] = [
    { id: 'e', type: 'email', label: 'Email', required: true },
    { id: 'q', type: 'dropdown', label: 'Topic', options: ['Order', 'Other'], required: true },
    { id: 'o', type: 'text', label: 'Order number', required: true, showIf: { fieldId: 'q', op: 'equals', value: 'Order' } },
  ];

  it('shows a field only while its condition holds, and a hidden required field never blocks or is sent', async () => {
    render(<ContactFormSection section={section({ fields: conditionalFields })} blocks={[]} colors={colors} />);
    expect(screen.queryByLabelText(/Order number/)).toBeNull();
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: 'a@b.co' } });
    fireEvent.change(screen.getByLabelText(/^Topic/), { target: { value: 'Order' } });
    expect(screen.getByLabelText(/Order number/)).toBeTruthy();
    send();
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(submitMock).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/Order number/), { target: { value: '99' } });
    fireEvent.change(screen.getByLabelText(/^Topic/), { target: { value: 'Other' } });
    expect(screen.queryByLabelText(/Order number/)).toBeNull();
    send();
    await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(1));
    const body = submitMock.mock.calls[0][1] as { answers: { fieldId: string }[] };
    expect(body.answers.map(a => a.fieldId)).toEqual(['e', 'q']);
  });

  it('draws rating, consent, help text, headings and sends the hidden field\'s page address', async () => {
    const fields: ContactFormField[] = [
      { id: 'g', type: 'heading', label: 'About your visit' },
      { id: 'e', type: 'email', label: 'Email', required: true, helpText: 'We never share it' },
      { id: 'r', type: 'rating', label: 'How was it?', required: true },
      { id: 'k', type: 'consent', label: 'I agree to the policy', required: true },
      { id: 'h', type: 'hidden', label: 'Page', defaultValue: '{page_url}' },
    ];
    render(<ContactFormSection section={section({ fields })} blocks={[]} colors={colors} />);
    expect(screen.getByText('About your visit')).toBeTruthy();
    expect(screen.getByText('We never share it')).toBeTruthy();
    expect(screen.queryByLabelText('Page')).toBeNull();
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: 'a@b.co' } });
    send();
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(submitMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole('radio').find(r => r.getAttribute('aria-label')?.startsWith('4'))!);
    fireEvent.click(screen.getByLabelText(/I agree to the policy/));
    send();
    await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(1));
    const answers = (submitMock.mock.calls[0][1] as { answers: { fieldId: string; value: string }[] }).answers;
    expect(answers.find(a => a.fieldId === 'r')?.value).toBe('4');
    expect(answers.find(a => a.fieldId === 'k')?.value).toBe('true');
    expect(answers.find(a => a.fieldId === 'h')?.value).toContain('http');
  });

  it('fills starting values and uses the seller\'s own error message', async () => {
    const fields: ContactFormField[] = [
      { id: 'e', type: 'email', label: 'Email', required: true },
      { id: 'c', type: 'text', label: 'City', defaultValue: 'Lahore' },
      { id: 'k', type: 'consent', label: 'Agree', required: true, errorMessage: 'Please tick the box first' },
    ];
    render(<ContactFormSection section={section({ fields })} blocks={[]} colors={colors} />);
    expect((screen.getByLabelText('City') as HTMLInputElement).value).toBe('Lahore');
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: 'a@b.co' } });
    send();
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Please tick the box first'));
  });

  it('only sends a visitor to an https address or a page of the store', () => {
    expect(successRedirect({ successAction: 'redirect', redirectUrl: 'https://x.co/thanks' })).toBe('https://x.co/thanks');
    expect(successRedirect({ successAction: 'redirect', redirectUrl: '/pages/thanks' })).toBe('/pages/thanks');
    expect(successRedirect({ successAction: 'redirect', redirectUrl: 'javascript:alert(1)' })).toBeNull();
    expect(successRedirect({ successAction: 'redirect', redirectUrl: '//evil.co' })).toBeNull();
    expect(successRedirect({ successAction: 'redirect', redirectUrl: 'http://x.co' })).toBeNull();
    expect(successRedirect({ redirectUrl: 'https://x.co' })).toBeNull();
  });

  it('knows which fields a condition may depend on (only fields above) and what hides what', () => {
    expect(conditionSources(conditionalFields, 2).map(f => f.id)).toEqual(['e', 'q']);
    expect(conditionSources(conditionalFields, 0)).toEqual([]);
    expect(visibleFields(conditionalFields, { q: 'Other' }).map(f => f.id)).toEqual(['e', 'q']);
    expect(visibleFields(conditionalFields, { q: 'Order' }).map(f => f.id)).toEqual(['e', 'q', 'o']);
    expect(conditionHolds({ fieldId: 'q', op: 'contains', value: 'ord' }, { q: 'Order' })).toBe(true);
    expect(conditionHolds({ fieldId: 'q', op: 'empty' }, {})).toBe(true);
    expect(contactFormProblem([{ id: 'e', type: 'email', label: 'Email', required: true, showIf: { fieldId: 'x', op: 'filled' } }])).toMatch(/always shown/);
  });
});

describe('phase 1: editor', () => {
  afterEach(cleanup);

  it('adds a condition that points at a field above, and drops it when that field moves below', () => {
    const set = vi.fn();
    const fields: ContactFormField[] = [
      { id: 'e', type: 'email', label: 'Email', required: true },
      { id: 'q', type: 'dropdown', label: 'Topic', options: ['Order', 'Other'] },
      { id: 'o', type: 'text', label: 'Order number' },
    ];
    const { rerender } = render(<FormFieldsEditor settings={{ fields }} set={set} />);
    fireEvent.click(screen.getByText('Order number'));
    const toggle = screen.getByText('Show only if…').parentElement!.querySelector('button, [role="switch"], input') as HTMLElement;
    fireEvent.click(toggle);
    const withCond = set.mock.calls.at(-1)![0].fields as ContactFormField[];
    expect(withCond[2].showIf).toEqual({ fieldId: 'e', op: 'filled' });
    const conditional = [fields[0], fields[1], { ...fields[2], showIf: { fieldId: 'q', op: 'equals', value: 'Order' } }];
    rerender(<FormFieldsEditor settings={{ fields: conditional }} set={set} />);
    fireEvent.click(screen.getByRole('button', { name: 'Move Order number up' }));
    const moved = set.mock.calls.at(-1)![0].fields as ContactFormField[];
    expect(moved.map(f => f.id)).toEqual(['e', 'o', 'q']);
    expect(moved[1].showIf).toBeUndefined();
  });

  it('adds new field types with sensible starting content, and removes conditions that pointed at a deleted field', () => {
    const set = vi.fn();
    const fields: ContactFormField[] = [
      { id: 'e', type: 'email', label: 'Email', required: true },
      { id: 'q', type: 'dropdown', label: 'Topic', options: ['A'] },
      { id: 'o', type: 'text', label: 'Detail', showIf: { fieldId: 'q', op: 'filled' } },
    ];
    render(<FormFieldsEditor settings={{ fields }} set={set} />);
    fireEvent.change(screen.getByLabelText('Add a field'), { target: { value: 'consent' } });
    const added = (set.mock.calls.at(-1)![0].fields as ContactFormField[]).at(-1)!;
    expect(added.type).toBe('consent');
    expect(added.required).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Topic' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const after = set.mock.calls.at(-1)![0].fields as ContactFormField[];
    expect(after.map(f => f.id)).toEqual(['e', 'o']);
    expect(after[1].showIf).toBeUndefined();
  });
});
