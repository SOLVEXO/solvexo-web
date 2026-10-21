import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/comman/ui';
import { TextTranslationsPanel } from './TextTranslationsPanel';
import { Modal } from '@/components/comman/ui/Modal';
import {
  apiDeleteTranslation, apiSaveTranslation,
  type TranslatableItem, type TranslationResource, type TranslationValues,
} from '@/api/services/translations';
import { isRtlLanguage, languageName } from '@/utils/languages';
import { menuProgress, translationProgress, untranslatedFields, type TranslationField } from '@/utils/translationProgress';

const FIELDS: { key: TranslationField; label: string; multiline?: boolean }[] = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description', multiline: true },
  { key: 'handle', label: 'URL handle' },
  { key: 'metaTitle', label: 'Page title (SEO)' },
  { key: 'metaDescription', label: 'Meta description (SEO)', multiline: true },
];

const errText = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);
const INPUT = 'w-full py-[8px] px-3 rounded-md border border-bone bg-white text-[13px] text-charcoal outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10';

interface Props {
  storeId: string;
  resource: TranslationResource;
  item: TranslatableItem;
  locale: string;
  onSaved: (item: TranslatableItem) => void;
  onDirtyChange: (dirty: boolean) => void;
}

/** Side by side: the English text (read only) and the translation for one language. Remount (key) per item + language. */
export function TranslationItemEditor({ storeId, resource, item, locale, onSaved, onDirtyChange }: Props) {
  const isMenu = resource === 'menus';
  const saved: TranslationValues | undefined = item.translations?.[locale];
  const [values, setValues] = useState<Record<TranslationField, string>>(() => ({
    title: saved?.title ?? '', description: saved?.description ?? '', handle: saved?.handle ?? '',
    metaTitle: saved?.metaTitle ?? '', metaDescription: saved?.metaDescription ?? '',
  }));
  const [labels, setLabels] = useState<Record<string, string>>(() =>
    Object.fromEntries((item.menuItems ?? []).map(m => [m.id, m.labelTranslations?.[locale] ?? ''])));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [bodyDirty, setBodyDirty] = useState(false);
  const [removing, setRemoving] = useState(false);

  const rtl = isRtlLanguage(locale);
  const dir = rtl ? 'rtl' : 'ltr';

  const dirty = useMemo(() => {
    if (isMenu) return (item.menuItems ?? []).some(m => (labels[m.id] ?? '') !== (m.labelTranslations?.[locale] ?? ''));
    return FIELDS.some(f => values[f.key] !== (saved?.[f.key] ?? ''));
  }, [isMenu, item.menuItems, labels, values, saved, locale]);

  useEffect(() => { onDirtyChange(dirty || bodyDirty); }, [dirty, bodyDirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  const hasSaved = isMenu
    ? (item.menuItems ?? []).some(m => !!m.labelTranslations?.[locale])
    : !!saved && FIELDS.some(f => !!saved[f.key]);
  const progress = isMenu ? menuProgress(item.menuItems ?? [], locale) : translationProgress(item.source, saved);
  const missing = isMenu ? [] : untranslatedFields(item.source, saved);
  const titleMissing = !isMenu && !values.title.trim();

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const body = isMenu
        ? { labels: Object.fromEntries(Object.entries(labels).filter(([, v]) => v.trim()).map(([k, v]) => [k, v.trim()])) }
        : Object.fromEntries(FIELDS.filter(f => f.key === 'title' || values[f.key].trim()).map(f => [f.key, values[f.key].trim()])) as TranslationValues;
      const res = await apiSaveTranslation(storeId, resource, item.id, locale, body);
      onSaved(res.data);
    } catch (err) {
      setError(errText(err, 'Failed to save the translation.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setRemoving(true);
    setError('');
    try {
      await apiDeleteTranslation(storeId, resource, item.id, locale);
      const translations = { ...item.translations };
      delete translations[locale];
      onSaved({
        ...item,
        translations,
        menuItems: item.menuItems?.map(m => {
          const lt = { ...m.labelTranslations };
          delete lt[locale];
          return { ...m, labelTranslations: lt };
        }),
      });
      setConfirmRemove(false);
    } catch (err) {
      setError(errText(err, 'Failed to remove the translation.'));
      setConfirmRemove(false);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="rounded-xl border border-bone bg-white min-w-0">
      <div className="px-4 py-3 border-b border-bone flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[14px] font-bold text-carbon truncate">{item.source.title || 'Untitled'}</p>
          <p className="text-[11.5px] text-slate" aria-live="polite">
            {languageName(locale)}: {progress.done} of {progress.total} {isMenu ? 'labels' : 'fields'} translated
          </p>
        </div>
        <div className="flex gap-2">
          {hasSaved && <Button size="xs" variant="ghost" icon={<Trash2 size={12} />} onClick={() => setConfirmRemove(true)} disabled={saving}>Remove translation</Button>}
          <Button size="sm" onClick={save} loading={saving} disabled={!dirty || titleMissing}>Save</Button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-5">
        {error && <p role="alert" className="flex items-start gap-1.5 text-[12.5px] text-error"><AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}</p>}

        {isMenu ? (
          <div className="flex flex-col gap-3">
            <div className="hidden sm:grid grid-cols-2 gap-4 text-[10.5px] font-bold text-slate uppercase tracking-[0.06em]"><span>English</span><span>{languageName(locale)}</span></div>
            {(item.menuItems ?? []).length === 0 && <p className="text-[12.5px] text-slate">This menu has no links yet.</p>}
            {(item.menuItems ?? []).map(m => {
              const id = `tr-label-${m.id}`;
              const empty = !(labels[m.id] ?? '').trim();
              return (
                <div key={m.id} className="grid sm:grid-cols-2 gap-2 sm:gap-4 items-center" style={{ paddingInlineStart: Math.min(m.depth, 4) * 20 }}>
                  <p className="m-0 text-[13px] text-charcoal bg-cream rounded-md px-3 py-2 truncate" title={m.label}>{m.label}</p>
                  <div>
                    <label htmlFor={id} className="sr-only">{`${languageName(locale)} label for ${m.label}`}</label>
                    <input id={id} dir={dir} lang={locale} value={labels[m.id] ?? ''} maxLength={120} onChange={e => setLabels(l => ({ ...l, [m.id]: e.target.value }))} className={INPUT} />
                    {empty && <span className="text-[10.5px] text-slate">Untranslated</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          FIELDS.map(f => {
            const id = `tr-${f.key}`;
            const fieldLabel = resource === 'blog_posts' && f.key === 'description' ? 'Excerpt' : f.label;
            const src = f.key === 'metaTitle' || f.key === 'metaDescription' ? '' : (item.source[f.key as 'title' | 'description' | 'handle'] ?? '');
            const untranslated = missing.includes(f.key);
            return (
              <div key={f.key} className="grid lg:grid-cols-2 gap-3 lg:gap-4">
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-charcoal mb-1.5">{fieldLabel} <span className="text-slate font-normal">(English)</span></p>
                  <div className="min-h-[38px] whitespace-pre-wrap break-words rounded-md bg-cream px-3 py-2 text-[13px] text-charcoal">{src || <span className="text-slate">Nothing to translate</span>}</div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label htmlFor={id} className="text-[12px] font-medium text-charcoal">{fieldLabel} <span className="text-slate font-normal">({languageName(locale)})</span></label>
                    {untranslated && <span className="text-[10.5px] font-semibold rounded-full bg-cream text-slate px-2 py-0.5">Untranslated</span>}
                  </div>
                  {f.multiline
                    ? <textarea id={id} dir={dir} lang={locale} rows={4} maxLength={f.key === 'description' ? 20000 : 500} value={values[f.key]} onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))} className={`${INPUT} resize-y`} />
                    : <input id={id} dir={dir} lang={locale} maxLength={255} value={values[f.key]} onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))} className={INPUT} aria-invalid={f.key === 'title' && titleMissing} />}
                  {f.key === 'title' && titleMissing && <p className="mt-1 text-[11px] text-slate">A title is required to save a translation.</p>}
                </div>
              </div>
            );
          })
        )}
      </div>

      {resource === 'blog_posts' && (
        <div className="px-4 pb-4">
          <h3 className="m-0 text-[13px] font-bold text-carbon">Article text</h3>
          <p className="m-0 mt-0.5 text-[11.5px] text-slate">The paragraphs, headings, quotes and captions of the article. Saved on its own, with the button in this part.</p>
          <TextTranslationsPanel key={`${item.id}|${locale}`} storeId={storeId} locale={locale} scope={`bp:${item.id}`} onDirtyChange={setBodyDirty} />
        </div>
      )}

      {confirmRemove && (
        <Modal
          title="Remove translation"
          onClose={() => { if (!removing) setConfirmRemove(false); }}
          footer={(
            <>
              <Button variant="outline" size="sm" onClick={() => setConfirmRemove(false)} disabled={removing}>Cancel</Button>
              <Button variant="danger" size="sm" onClick={remove} loading={removing}>Remove</Button>
            </>
          )}
        >
          <p className="text-[13px] text-charcoal">Remove the {languageName(locale)} translation of <b>{item.source.title}</b>? Buyers will see the English text again.</p>
        </Modal>
      )}
    </div>
  );
}
