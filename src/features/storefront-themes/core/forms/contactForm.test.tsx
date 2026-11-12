import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { applyMerchantThemeOverrides } from '../../theme-03-fashion/theme.config';
import { ContactFormSection } from '../../theme-03-fashion/sections/shared/ContactFormSection';
import { FormFieldsEditor } from '@/features/seller/store/Dashboard/OnlineStore/builder/FormFieldsEditor';
import {
  buildAnswers, contactFormProblem, firstMissingRequired, legacyContactFields, newContactField, resolveContactFields, type ContactFormField,
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
