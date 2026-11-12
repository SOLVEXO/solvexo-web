/**
 * The seller-built form: a list of fields on the `contact_form` section (`settings.fields`) plus form-level settings,
 * shared by the theme renderers, the seller editor and the checks. Same rules as the API
 * (store-contact/contact-form-fields.util.ts): keep the two in step by hand.
 */
export type ContactFieldType =
  | 'name' | 'text' | 'email' | 'phone' | 'textarea' | 'number' | 'date' | 'time' | 'url'
  | 'dropdown' | 'radio' | 'checkbox' | 'consent' | 'rating' | 'country' | 'hidden' | 'heading' | 'paragraph';

export type ConditionOp = 'equals' | 'not_equals' | 'contains' | 'filled' | 'empty';
export interface ContactCondition { fieldId: string; op: ConditionOp; value?: string }

export interface ContactFormField {
  id: string;
  type: ContactFieldType;
  /** The question; for a heading / paragraph the text itself; for a consent box the sentence next to the tick. */
  label: string;
  placeholder?: string;
  helpText?: string;
  /** A starting value. For a hidden field: text, or {page_url} / {page_title} filled in when the form is sent. */
  defaultValue?: string;
  required?: boolean;
  width?: 'full' | 'half' | 'third' | 'quarter';
  /** dropdown / radio / checkbox (multiple choice). A checkbox with no choices is a single tick box. */
  options?: string[];
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  /** Shown instead of the standard message when this field is missing or wrong. */
  errorMessage?: string;
  /** Show this field only when an EARLIER field's answer matches. */
  showIf?: ContactCondition;
}

export const MAX_CONTACT_FIELDS = 31;
export const MAX_CHOICES = 20;

export interface FieldTypeInfo { value: ContactFieldType; label: string; hint: string; group: 'Text' | 'Choices' | 'More' | 'Layout' }

export const CONTACT_FIELD_TYPES: FieldTypeInfo[] = [
  { value: 'name', label: 'Name', hint: 'The visitor\'s name; shown as the sender in your inbox', group: 'Text' },
  { value: 'text', label: 'Single line text', hint: 'A short answer', group: 'Text' },
  { value: 'textarea', label: 'Multi-line text', hint: 'A long answer, e.g. the message', group: 'Text' },
  { value: 'email', label: 'Email', hint: 'Checked to be a real email address', group: 'Text' },
  { value: 'phone', label: 'Phone', hint: 'Checked to be a phone number', group: 'Text' },
  { value: 'url', label: 'Website address', hint: 'Must be an http(s) link', group: 'Text' },
  { value: 'number', label: 'Number', hint: 'Digits only, with an optional minimum and maximum', group: 'Text' },
  { value: 'date', label: 'Date', hint: 'A date picker', group: 'Text' },
  { value: 'time', label: 'Time', hint: 'A time picker', group: 'Text' },
  { value: 'dropdown', label: 'Dropdown list', hint: 'Pick one from a list', group: 'Choices' },
  { value: 'radio', label: 'Radio buttons', hint: 'Pick one, all choices visible', group: 'Choices' },
  { value: 'checkbox', label: 'Checkboxes', hint: 'Pick several, or one tick box with no choices', group: 'Choices' },
  { value: 'consent', label: 'Consent tick box', hint: 'A sentence the visitor agrees to (e.g. the privacy policy)', group: 'Choices' },
  { value: 'rating', label: 'Rating (1 to 5 stars)', hint: 'Stars the visitor taps', group: 'More' },
  { value: 'country', label: 'Country', hint: 'A list of countries', group: 'More' },
  { value: 'hidden', label: 'Hidden field', hint: 'Not shown to the visitor; saves the page address or a fixed text with every answer', group: 'More' },
  { value: 'heading', label: 'Heading', hint: 'A title inside the form (collects nothing)', group: 'Layout' },
  { value: 'paragraph', label: 'Paragraph of text', hint: 'Some words inside the form (collects nothing)', group: 'Layout' },
];

export const CONDITION_OPS: { value: ConditionOp; label: string; needsValue: boolean }[] = [
  { value: 'equals', label: 'is', needsValue: true },
  { value: 'not_equals', label: 'is not', needsValue: true },
  { value: 'contains', label: 'contains', needsValue: true },
  { value: 'filled', label: 'is filled in', needsValue: false },
  { value: 'empty', label: 'is empty', needsValue: false },
];

export const FIELD_WIDTHS: { value: NonNullable<ContactFormField['width']>; label: string }[] = [
  { value: 'full', label: '100% (full row)' },
  { value: 'half', label: '50% (two side by side)' },
  { value: 'third', label: '33% (three side by side)' },
  { value: 'quarter', label: '25% (four side by side)' },
];

export const hasChoices = (type: ContactFieldType) => type === 'dropdown' || type === 'radio' || type === 'checkbox';
/** Fields that show text but collect nothing. */
export const isStaticField = (type: ContactFieldType) => type === 'heading' || type === 'paragraph';
export const labelLimit = (type: ContactFieldType) => (type === 'paragraph' ? 500 : type === 'consent' ? 300 : type === 'heading' ? 120 : 60);

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
    ...(type === 'hidden' ? { label: 'Page address', defaultValue: '{page_url}' } : {}),
    ...(type === 'heading' ? { label: 'A new section' } : {}),
    ...(type === 'paragraph' ? { label: 'Write some text here.' } : {}),
    ...(type === 'consent' ? { label: 'I agree to the privacy policy.', required: true } : {}),
  };
}

export type AnswerValue = string | string[];
export type Answers = Record<string, AnswerValue>;

const textOf = (v: AnswerValue | undefined) => (Array.isArray(v) ? v.join(', ') : String(v ?? '').trim());

/** Does a condition hold for the answers given so far? Same rules as the server (an unanswered field counts as empty). */
export function conditionHolds(cond: ContactCondition | undefined, answers: Answers): boolean {
  if (!cond) return true;
  const have = textOf(answers[cond.fieldId]).toLowerCase();
  const want = String(cond.value ?? '').trim().toLowerCase();
  switch (cond.op) {
    case 'filled': return have.length > 0;
    case 'empty': return have.length === 0;
    case 'equals': return have === want || have.split(', ').includes(want);
    case 'not_equals': return have !== want && !have.split(', ').includes(want);
    case 'contains': return have.includes(want);
    default: return true;
  }
}

/** The fields the visitor currently sees: a field whose condition fails is hidden, and so are fields that depend on it. */
export function visibleFields(fields: ContactFormField[], answers: Answers): ContactFormField[] {
  const shown: ContactFormField[] = [];
  const live: Answers = {};
  for (const f of fields) {
    if (!conditionHolds(f.showIf, live)) continue;
    shown.push(f);
    if (answers[f.id] !== undefined) live[f.id] = answers[f.id];
  }
  return shown;
}

/** What a visitor sees on a first visit: default values filled in (hidden fields are filled when the form is sent). */
export function initialAnswers(fields: ContactFormField[]): Answers {
  const out: Answers = {};
  for (const f of fields) {
    if (f.type === 'hidden' || isStaticField(f.type) || !f.defaultValue) continue;
    if (f.type === 'checkbox' && f.options?.length) out[f.id] = f.defaultValue.split(',').map(s => s.trim()).filter(o => f.options!.includes(o));
    else out[f.id] = f.defaultValue;
  }
  return out;
}

/** What stops a form from being saved/used: a way to reach the visitor is required (Shopify Forms rule). */
export function contactFormProblem(fields: ContactFormField[]): string | null {
  if (fields.length > MAX_CONTACT_FIELDS) return `A form can have at most ${MAX_CONTACT_FIELDS} fields.`;
  if (!fields.some(f => (f.type === 'email' || f.type === 'phone') && f.required && !f.showIf)) {
    return 'Add an Email or Phone field, make it required and always shown, so you can answer your visitors.';
  }
  for (const f of fields) {
    if (!f.label.trim()) return 'Every field needs a label.';
    if ((f.type === 'dropdown' || f.type === 'radio') && !(f.options?.length)) return `"${f.label}" needs at least one choice.`;
    if (f.showIf && (f.showIf.op === 'equals' || f.showIf.op === 'not_equals' || f.showIf.op === 'contains') && !f.showIf.value?.trim()) {
      return `"${f.label}": choose the answer that shows this field.`;
    }
    if (f.minLength !== undefined && f.maxLength !== undefined && f.minLength > f.maxLength) return `"${f.label}": the minimum length is above the maximum.`;
    if (f.min !== undefined && f.max !== undefined && f.min > f.max) return `"${f.label}": the minimum is above the maximum.`;
  }
  return null;
}

/** Fields that can decide whether `fields[index]` shows: only the ones above it that collect an answer. */
export function conditionSources(fields: ContactFormField[], index: number): ContactFormField[] {
  return fields.slice(0, index).filter(f => !isStaticField(f.type) && f.type !== 'hidden');
}

/** The visitor's answers as the API expects them (one entry per visible field that has a value). Hidden fields get their tokens filled. */
export function buildAnswers(
  fields: ContactFormField[], values: Answers, page: { url?: string; title?: string } = {},
): { fieldId: string; value: AnswerValue }[] {
  return visibleFields(fields, values).flatMap(f => {
    if (isStaticField(f.type)) return [];
    let v: AnswerValue | undefined = values[f.id];
    if (f.type === 'hidden') {
      v = (f.defaultValue ?? '').replace(/\{page_url\}/g, page.url ?? '').replace(/\{page_title\}/g, page.title ?? '');
    }
    const empty = v === undefined || (Array.isArray(v) ? v.length === 0 : !String(v).trim());
    return empty ? [] : [{ fieldId: f.id, value: v as AnswerValue }];
  });
}

/** The first required visible field the visitor left empty (the browser checks single inputs; groups, ratings and ticks need this). */
export function firstMissingRequired(fields: ContactFormField[], values: Answers): ContactFormField | null {
  return visibleFields(fields, values).find(f => {
    if (!f.required || isStaticField(f.type) || f.type === 'hidden') return false;
    const v = values[f.id];
    return v === undefined || (Array.isArray(v) ? v.length === 0 : !String(v).trim());
  }) ?? null;
}

/** Where to send the visitor after a successful send, or null to show the message (only https links or paths on the store). */
export function successRedirect(settings: Record<string, any> | undefined): string | null {
  if (settings?.successAction !== 'redirect') return null;
  const u = String(settings.redirectUrl ?? '').trim();
  if (u.startsWith('/') && !u.startsWith('//')) return u;
  try { return new URL(u).protocol === 'https:' ? u : null; } catch { return null; }
}
