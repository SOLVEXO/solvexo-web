import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { tt } from '@/utils/tStatic';
import { analyticsSessionFields } from '@/utils/storefrontAnalytics';
import { apiGetContactFormConfig, apiSubmitContactMessage, apiUploadContactFile } from '@/api/services/storeContact';
import type { Section } from '@/api/services/storefrontTypes';
import {
  MAX_FILE_MB, buildAnswers, fileAccept, firstMissingOnPage, firstMissingRequired, splitPages, initialAnswers, resolveContactFields, successRedirect, visibleFields,
  type AnswerValue, type Answers, type ContactFormField,
} from './contactFormFields';

export interface AttachedFile { name: string; size: number; uploading?: boolean; error?: string }

/**
 * Headless logic of the storefront contact form: the field list (with conditional logic), the visitor's answers,
 * attached files, the CAPTCHA, the bot trap, the send and what happens after it. A theme only draws the fields.
 */
export function useContactForm(storeId: string, section: Section) {
  const all: ContactFormField[] = useMemo(() => resolveContactFields(section.settings), [section.settings]);
  const [values, setValues] = useState<Answers>(() => initialAnswers(all));
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [invalidId, setInvalidId] = useState<string | null>(null);
  const [files, setFiles] = useState<Record<string, AttachedFile>>({});
  const [captcha, setCaptcha] = useState<{ siteKey: string } | null>(null);
  const [captchaToken, setCaptchaToken] = useState('');
  /** Changes when the CAPTCHA must be shown again (a token works once). */
  const [captchaRound, setCaptchaRound] = useState(0);

  // The seller's CAPTCHA keys are saved per store: ask which one (if any) this form uses.
  const wantsCaptcha = section.settings?.captcha === true;
  useEffect(() => {
    if (!wantsCaptcha) return;
    let cancelled = false;
    apiGetContactFormConfig(storeId).then(res => { if (!cancelled) setCaptcha(res.data.captcha ? { siteKey: res.data.captcha.siteKey } : null); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [storeId, wantsCaptcha]);

  /** The fields the visitor sees right now (conditional fields appear and disappear with the answers). */
  const fields = useMemo(() => visibleFields(all, values), [all, values]);
  /** Multi-step forms: the visible fields cut into pages. One page = a normal form. */
  const pages = useMemo(() => splitPages(fields), [fields]);
  const [step, setStep] = useState(0);
  const stepIndex = Math.min(step, pages.length - 1);
  const page = pages[stepIndex];
  const isLast = stepIndex >= pages.length - 1;

  const setValue = (id: string, value: AnswerValue) => { setValues(v => ({ ...v, [id]: value })); if (invalidId === id) setInvalidId(null); };
  /** Tick / untick one choice of a multiple-choice field. */
  const toggleChoice = (id: string, choice: string, on: boolean) => {
    const current = Array.isArray(values[id]) ? (values[id] as string[]) : [];
    setValue(id, on ? [...current.filter(c => c !== choice), choice] : current.filter(c => c !== choice));
  };

  /** Uploads the chosen file at once; the answer becomes the id the server hands back. */
  async function attachFile(field: ContactFormField, file: File) {
    const maxMb = Math.min(field.maxSizeMb ?? MAX_FILE_MB, MAX_FILE_MB);
    const ext = `.${(file.name.split('.').pop() ?? '').toLowerCase()}`;
    if (!fileAccept(field).split(',').includes(ext)) {
      setFiles(f => ({ ...f, [field.id]: { name: file.name, size: file.size, error: tt('sections.contactFileType', 'This type of file is not accepted.') } }));
      return;
    }
    if (file.size > maxMb * 1024 * 1024) {
      setFiles(f => ({ ...f, [field.id]: { name: file.name, size: file.size, error: tt('sections.contactFileSize', 'The file is larger than {{mb}} MB.', { mb: maxMb }) } }));
      return;
    }
    setValue(field.id, '');
    setFiles(f => ({ ...f, [field.id]: { name: file.name, size: file.size, uploading: true } }));
    try {
      const res = await apiUploadContactFile(storeId, { sectionId: section._id ?? '', fieldId: field.id, file });
      setValue(field.id, res.data.uploadId);
      setFiles(f => ({ ...f, [field.id]: { name: res.data.name, size: res.data.size } }));
    } catch (err) {
      setFiles(f => ({ ...f, [field.id]: { name: file.name, size: file.size, error: err instanceof Error ? err.message : tt('sections.contactFileFailed', 'The file could not be uploaded.') } }));
    }
  }
  const removeFile = (id: string) => { setValue(id, ''); setFiles(f => { const { [id]: _gone, ...rest } = f; return rest; }); };
  const uploading = Object.values(files).some(f => f.uploading);

  /** Next page, after checking the required fields of this one. */
  function next() {
    const missing = firstMissingOnPage(page, values);
    if (missing) {
      setInvalidId(missing.id);
      setError(missing.errorMessage?.trim() || tt('sections.contactRequired', 'Please complete the required fields.'));
      setStatus('error');
      return false;
    }
    if (uploading) {
      setError(tt('sections.contactWaitFile', 'Please wait until your file has finished uploading.'));
      setStatus('error');
      return false;
    }
    setError(''); setStatus('idle'); setStep(stepIndex + 1);
    return true;
  }
  const back = () => { setError(''); setStatus('idle'); setInvalidId(null); setStep(Math.max(0, stepIndex - 1)); };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;
    // Enter on a page that is not the last one moves on instead of sending.
    if (!isLast) { next(); return; }
    if (uploading) {
      setError(tt('sections.contactWaitFile', 'Please wait until your file has finished uploading.'));
      setStatus('error');
      return;
    }
    const missing = firstMissingRequired(all, values);
    if (missing) {
      const at = pages.findIndex(p => p.fields.some(f => f.id === missing.id));
      if (at >= 0) setStep(at);
      setInvalidId(missing.id);
      setError(missing.errorMessage?.trim() || tt('sections.contactRequired', 'Please complete the required fields.'));
      setStatus('error');
      return;
    }
    if (captcha && !captchaToken) {
      setError(tt('sections.contactCaptcha', 'Please confirm you are not a robot.'));
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
        pageUrl: window.location.href,
        ...analyticsSessionFields(storeId),
        ...(captcha ? { captchaToken } : {}),
      });
      setStatus('done');
      const to = successRedirect(section.settings);
      if (to) window.location.assign(to);
    } catch (err) {
      setError(err instanceof Error ? err.message : tt('sections.contactError', 'We could not send your message. Please try again.'));
      setStatus('error');
      // A CAPTCHA answer works once: show a fresh one.
      if (captcha) { setCaptchaToken(''); setCaptchaRound(r => r + 1); }
    }
  }

  return { fields, pages, page, stepIndex, stepCount: pages.length, isLast, next, back, values, setValue, toggleChoice, website, setWebsite, status, error, invalidId, submit, files, attachFile, removeFile, uploading, captcha, setCaptchaToken, captchaRound };
}
