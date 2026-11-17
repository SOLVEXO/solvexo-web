import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { tt } from '@/utils/tStatic';
import { analyticsSessionFields, storefrontAnalyticsAllowed } from '@/utils/storefrontAnalytics';
import { apiGetContactFormConfig, apiSubmitContactMessage, apiTrackFormEvent, apiUploadContactFile } from '@/api/services/storeContact';
import type { Section } from '@/api/services/storefrontTypes';
import {
  MAX_FILES, MAX_FILE_MB, buildAnswers, fileAccept, firstMissingOnPage, firstMissingRequired, splitPages, initialAnswers, resolveContactFields, successRedirect, visibleFields,
  type AnswerValue, type Answers, type ContactFormField,
} from './contactFormFields';

export interface AttachedFile { name: string; size: number; uploading?: boolean; error?: string; uploadId?: string }

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
  const filesRef = useRef<Record<string, AttachedFile>>({});
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

  // Anonymous counters for the seller's report: once per tab for "seen" and for "started" (only with analytics consent, never in the editor preview).
  const sectionId = section._id;
  const markOnce = (kind: 'view' | 'start') => {
    if (!sectionId || !storefrontAnalyticsAllowed()) return;
    try {
      const key = `sx_form_${kind}_${sectionId}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch { /* storage blocked: count at most once per mount below */ }
    void apiTrackFormEvent(storeId, sectionId, kind);
  };
  useEffect(() => { markOnce('view'); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId, storeId]);

  const touched = useRef(new Set<string>());
  const markField = (id: string) => {
    if (!sectionId || !storefrontAnalyticsAllowed() || touched.current.has(id)) return;
    touched.current.add(id);
    try { const k = `sx_form_f_${sectionId}_${id}`; if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1'); } catch { /* ignore */ }
    void apiTrackFormEvent(storeId, sectionId, 'field', id);
  };
  const setValue = (id: string, value: AnswerValue) => { markOnce('start'); markField(id); setValues(v => ({ ...v, [id]: value })); if (invalidId === id) setInvalidId(null); };
  /** Tick / untick one choice of a multiple-choice field. */
  const toggleChoice = (id: string, choice: string, on: boolean) => {
    const current = Array.isArray(values[id]) ? (values[id] as string[]) : [];
    setValue(id, on ? [...current.filter(c => c !== choice), choice] : current.filter(c => c !== choice));
  };

  const putFiles = (fn: (f: Record<string, AttachedFile>) => Record<string, AttachedFile>) => {
    const next = fn(filesRef.current);
    filesRef.current = next;
    setFiles(next);
    return next;
  };
  const inField = (fieldId: string, k: string) => k === fieldId || k.startsWith(fieldId + '#');
  const idsOf = (fieldId: string, map: Record<string, AttachedFile>) => Object.entries(map).filter(([k, v]) => inField(fieldId, k) && v.uploadId).map(([, v]) => v.uploadId as string);
  /** The files (and the last error) of one field, in the order they were added. */
  const filesOf = (fieldId: string): [string, AttachedFile][] => Object.entries(files).filter(([k]) => inField(fieldId, k));

  /** Uploads the chosen file at once; the answer becomes the id the server hands back (a list of ids for a multi-file field). */
  async function attachFile(field: ContactFormField, file: File) {
    const multi = !!field.multiple && field.type === 'file';
    const errKey = multi ? `${field.id}#err` : field.id;
    const fail = (message: string) => { putFiles(f => ({ ...f, [errKey]: { name: file.name, size: file.size, error: message } })); };
    const maxMb = Math.min(field.maxSizeMb ?? MAX_FILE_MB, MAX_FILE_MB);
    const ext = `.${(file.name.split('.').pop() ?? '').toLowerCase()}`;
    if (!fileAccept(field).split(',').includes(ext)) return fail(tt('sections.contactFileType', 'This type of file is not accepted.'));
    if (file.size > maxMb * 1024 * 1024) return fail(tt('sections.contactFileSize', 'The file is larger than {{mb}} MB.', { mb: maxMb }));
    if (multi && idsOf(field.id, filesRef.current).length >= MAX_FILES) return fail(tt('sections.contactTooManyFiles', 'You can attach up to {{n}} files.', { n: MAX_FILES }));
    const key = multi ? `${field.id}#${Math.random().toString(36).slice(2, 10)}` : field.id;
    if (!multi) setValue(field.id, '');
    putFiles(f => { const { [errKey]: _old, ...rest } = f; return { ...rest, [key]: { name: file.name, size: file.size, uploading: true } }; });
    try {
      const res = await apiUploadContactFile(storeId, { sectionId: section._id ?? '', fieldId: field.id, file });
      const next = putFiles(f => ({ ...f, [key]: { name: res.data.name, size: res.data.size, uploadId: res.data.uploadId } }));
      setValue(field.id, multi ? idsOf(field.id, next).join(',') : res.data.uploadId);
    } catch (err) {
      putFiles(f => { const { [key]: _gone, ...rest } = f; return { ...rest, [errKey]: { name: file.name, size: file.size, error: err instanceof Error ? err.message : tt('sections.contactFileFailed', 'The file could not be uploaded.') } }; });
    }
  }
  /** Removes one attached file (the key comes from filesOf). */
  const removeFile = (key: string) => {
    const fieldId = key.split('#')[0];
    const next = putFiles(f => { const { [key]: _gone, ...rest } = f; return rest; });
    setValue(fieldId, key.includes('#') ? idsOf(fieldId, next).join(',') : '');
  };
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

  return { fields, pages, page, stepIndex, stepCount: pages.length, isLast, next, back, values, setValue, toggleChoice, website, setWebsite, status, error, invalidId, submit, files, attachFile, removeFile, uploading, filesOf, captcha, setCaptchaToken, captchaRound };
}
