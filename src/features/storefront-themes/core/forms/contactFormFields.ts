/**
 * The seller-built contact form: a list of fields on the `contact_form` section (`settings.fields`), shared by the
 * theme renderers, the seller editor and the checks. Same rules as the API (store-contact/contact-form-fields.util.ts):
 * keep the two in step by hand.
 */
export type ContactFieldType = 'name' | 'text' | 'email' | 'phone' | 'textarea' | 'number' | 'date' | 'dropdown' | 'radio' | 'checkbox';

export interface ContactFormField {
  id: string;
  type: ContactFieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  width?: 'full' | 'half';
  /** dropdown / radio / checkbox (multiple choice). A checkbox with no choices is a single tick box. */
  options?: string[];
}

export const MAX_CONTACT_FIELDS = 31;
export const MAX_CHOICES = 20;

export const CONTACT_FIELD_TYPES: { value: ContactFieldType; label: string; hint: string }[] = [
  { value: 'name', label: 'Name', hint: 'The visitor\'s name; shown as the sender in your inbox' },
  { value: 'text', label: 'Single line text', hint: 'A short answer' },
  { value: 'email', label: 'Email', hint: 'Checked to be a real email address' },
  { value: 'phone', label: 'Phone', hint: 'Checked to be a phone number' },
  { value: 'textarea', label: 'Multi-line text', hint: 'A long answer, e.g. the message' },
  { value: 'number', label: 'Number', hint: 'Digits only' },
  { value: 'date', label: 'Date', hint: 'A date picker' },
  { value: 'dropdown', label: 'Dropdown list', hint: 'Pick one from a list' },
  { value: 'radio', label: 'Radio buttons', hint: 'Pick one, all choices visible' },
  { value: 'checkbox', label: 'Checkboxes', hint: 'Pick several, or one tick box with no choices' },
];

export const hasChoices = (type: ContactFieldType) => type === 'dropdown' || type === 'radio' || type === 'checkbox';

/** The old fixed form (Name, Email, optional Phone, Message), rebuilt from a section that has no `fields` yet. */
export function legacyContactFields(settings: Record<string, any> | undefined): ContactFormField[] {
  const s = settings ?? {};
  const text = (k: string, fallback: string) => (typeof s[k] === 'string' && s[k].trim() ? s[k].trim() : fallback);
  const fields: ContactFormField[] = [
    { id: 'name', type: 'name', label: text('nameLabel', 'Name'), required: true, width: 'half' },
    { id: 'email', type: 'email', label: text('emailLabel', 'Email'), required: true, width: 'half' },
  ];
  if (s.showPhone !== false) fields.push({ id: 'phone', type: 'phone', label: text('phoneLabel', 'Phone (optional)'), required: false, width: 'full' });
  fields.push({ id: 'message', type: 'textarea', label: text('messageLabel', 'Message'), required: true, width: 'full' });
  return fields;
}

/** The fields a section really shows: the seller's list, or the old fixed form when the section never had one. */
export function resolveContactFields(settings: Record<string, any> | undefined): ContactFormField[] {
  return Array.isArray(settings?.fields) ? (settings!.fields as ContactFormField[]) : legacyContactFields(settings);
}

export function newFieldId(): string {
  return `f${Math.random().toString(16).slice(2, 10)}${Date.now().toString(16).slice(-4)}`;
}

/** A fresh field of a type, with a sensible label. */
export function newContactField(type: ContactFieldType): ContactFormField {
  const def = CONTACT_FIELD_TYPES.find(t => t.value === type);
  return {
    id: newFieldId(), type, label: def?.label ?? 'Field', required: false, width: 'full',
    ...(type === 'dropdown' || type === 'radio' ? { options: ['Option 1', 'Option 2'] } : {}),
  };
}

/** What stops a form from being saved/used: a way to reach the visitor is required (Shopify Forms rule). */
export function contactFormProblem(fields: ContactFormField[]): string | null {
  if (fields.length > MAX_CONTACT_FIELDS) return `A form can have at most ${MAX_CONTACT_FIELDS} fields.`;
  if (!fields.some(f => (f.type === 'email' || f.type === 'phone') && f.required)) return 'Add an Email or Phone field and make it required, so you can answer your visitors.';
  for (const f of fields) {
    if (!f.label.trim()) return 'Every field needs a label.';
    if ((f.type === 'dropdown' || f.type === 'radio') && !(f.options?.length)) return `"${f.label}" needs at least one choice.`;
  }
  return null;
}

export type AnswerValue = string | string[];

/** The visitor's answers as the API expects them (one entry per field that has a value). */
export function buildAnswers(fields: ContactFormField[], values: Record<string, AnswerValue>): { fieldId: string; value: AnswerValue }[] {
  return fields.flatMap(f => {
    const v = values[f.id];
    const empty = v === undefined || (Array.isArray(v) ? v.length === 0 : !String(v).trim());
    return empty ? [] : [{ fieldId: f.id, value: v }];
  });
}

/** The first required field the visitor left empty (the browser checks single inputs; a checkbox group needs this). */
export function firstMissingRequired(fields: ContactFormField[], values: Record<string, AnswerValue>): ContactFormField | null {
  return fields.find(f => {
    if (!f.required) return false;
    const v = values[f.id];
    return v === undefined || (Array.isArray(v) ? v.length === 0 : !String(v).trim());
  }) ?? null;
}
