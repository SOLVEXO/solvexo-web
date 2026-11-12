import { useMemo, useState, type FormEvent } from 'react';
import { tt } from '@/utils/tStatic';
import { apiSubmitContactMessage } from '@/api/services/storeContact';
import type { Section } from '@/api/services/storefrontTypes';
import {
  buildAnswers, firstMissingRequired, initialAnswers, resolveContactFields, successRedirect, visibleFields,
  type AnswerValue, type Answers, type ContactFormField,
} from './contactFormFields';

/**
 * Headless logic of the storefront contact form: the field list (with conditional logic), the visitor's answers,
 * the bot trap, the send and what happens after it. A theme only draws the fields (see each theme's ContactFormSection).
 */
export function useContactForm(storeId: string, section: Section) {
  const all: ContactFormField[] = useMemo(() => resolveContactFields(section.settings), [section.settings]);
  const [values, setValues] = useState<Answers>(() => initialAnswers(all));
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [invalidId, setInvalidId] = useState<string | null>(null);

  /** The fields the visitor sees right now (conditional fields appear and disappear with the answers). */
  const fields = useMemo(() => visibleFields(all, values), [all, values]);

  const setValue = (id: string, value: AnswerValue) => { setValues(v => ({ ...v, [id]: value })); if (invalidId === id) setInvalidId(null); };
  /** Tick / untick one choice of a multiple-choice field. */
  const toggleChoice = (id: string, choice: string, on: boolean) => {
    const current = Array.isArray(values[id]) ? (values[id] as string[]) : [];
    setValue(id, on ? [...current.filter(c => c !== choice), choice] : current.filter(c => c !== choice));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;
    const missing = firstMissingRequired(all, values);
    if (missing) {
      setInvalidId(missing.id);
      setError(missing.errorMessage?.trim() || tt('sections.contactRequired', 'Please complete the required fields.'));
      setStatus('error');
      return;
    }
    setStatus('sending');
    setError('');
    try {
      await apiSubmitContactMessage(storeId, {
        sectionId: section._id,
        answers: buildAnswers(all, values, { url: window.location.href, title: document.title }),
        website,
      });
      setStatus('done');
      const to = successRedirect(section.settings);
      if (to) window.location.assign(to);
    } catch (err) {
      setError(err instanceof Error ? err.message : tt('sections.contactError', 'We could not send your message. Please try again.'));
      setStatus('error');
    }
  }

  return { fields, values, setValue, toggleChoice, website, setWebsite, status, error, invalidId, submit };
}
