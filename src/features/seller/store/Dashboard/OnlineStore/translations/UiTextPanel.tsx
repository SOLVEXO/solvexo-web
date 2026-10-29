import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import i18n, { ensureBundle } from '@/i18n';
import { uiLanguageFor } from '@/i18n/localeConfig';
import { Button, Pagination, SearchInput } from '@/components/comman/ui';
import { SkeletonBox } from '@/components/comman/ui/SkeletonBox';
import { useToast } from '@/contexts/ToastContext';
import { apiGetTextTranslations, apiSaveTextTranslations } from '@/api/services/storeTextTranslations';
import { languageName } from '@/utils/languages';

const errText = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);
const PER_PAGE = 30;
const SAVE_BATCH = 300;

function flatten(obj: unknown, prefix = '', out: Record<string, string> = {}): Record<string, string> {
  if (!obj || typeof obj !== 'object') return out;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out[key] = v;
    else flatten(v, key, out);
  }
  return out;
}

/** The label a seller recognises: "copy.Add to Cart" -> "Add to Cart"; "cart.empty" stays as is. */
const niceKey = (key: string) => key.replace(/^copy\./, '');

/**
 * Translate & adapt → Buttons & labels: the storefront's built-in words ("Add to cart", "Checkout", error messages) in one
 * language, with the seller's own wording on top. Works in the store's own language too (Shopify's "Edit default theme content").
 */
export function UiTextPanel({ storeId, locale, onDirtyChange }: { storeId: string; locale: string; onDirtyChange: (dirty: boolean) => void }) {
  const toast = useToast();
  const [english, setEnglish] = useState<Record<string, string> | null>(null);
  const [current, setCurrent] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);
  const [q, setQ] = useState('');
  const [customOnly, setCustomOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setEnglish(null);
    setLoadError('');
    (async () => {
      const [en, mine] = await Promise.all([
        import('@/i18n/locales/storefront.en.json').then(m => flatten(m.default)),
        apiGetTextTranslations(storeId, locale),
      ]);
      // The language's own bundle (bundled or generated), without the seller's overrides: overrides only exist as `ui#` rows here.
      const ui = uiLanguageFor(locale);
      await ensureBundle(ui).catch(() => undefined);
      const bundle = flatten(i18n.getResourceBundle(ui, 'storefront'));
      if (cancelled) return;
      const overrides = Object.fromEntries(Object.entries(mine.data.strings).filter(([k]) => k.startsWith('ui#')).map(([k, v]) => [k.slice(3), v]));
      setEnglish(en);
      setCurrent(bundle);
      setSaved(overrides);
      setDraft({});
      setPage(1);
    })().catch(err => { if (!cancelled) setLoadError(errText(err, 'Failed to load the buttons and labels.')); });
    return () => { cancelled = true; };
  }, [storeId, locale, reload]);

  const valueOf = useCallback((key: string) => (key in draft ? draft[key] : saved[key] ?? ''), [draft, saved]);
  const dirtyKeys = useMemo(() => Object.keys(draft).filter(k => (draft[k] ?? '') !== (saved[k] ?? '')), [draft, saved]);
  useEffect(() => { onDirtyChange(dirtyKeys.length > 0); return () => onDirtyChange(false); }, [dirtyKeys.length, onDirtyChange]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return Object.keys(english ?? {}).filter(key => {
      if (customOnly && !valueOf(key).trim()) return false;
      if (!needle) return true;
      return key.toLowerCase().includes(needle) || (english?.[key] ?? '').toLowerCase().includes(needle) || (current[key] ?? '').toLowerCase().includes(needle) || valueOf(key).toLowerCase().includes(needle);
    });
  }, [english, current, q, customOnly, valueOf]);
  const pageRows = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const customCount = Object.keys(english ?? {}).filter(k => valueOf(k).trim()).length;

  const save = async () => {
    if (!dirtyKeys.length || saving) return;
    setSaving(true);
    try {
      for (let i = 0; i < dirtyKeys.length; i += SAVE_BATCH) {
        await apiSaveTextTranslations(storeId, locale, dirtyKeys.slice(i, i + SAVE_BATCH).map(key => ({ key: `ui#${key}`, value: draft[key] ?? '' })));
      }
      setSaved(s => {
        const next = { ...s };
        for (const k of dirtyKeys) { if ((draft[k] ?? '').trim()) next[k] = draft[k]; else delete next[k]; }
        return next;
      });
      setDraft({});
      toast.success('Saved. Customers see your wording.');
    } catch (err) {
      toast.error(errText(err, 'Failed to save.'));
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <div role="alert" className="mt-4 flex items-center gap-3 rounded-xl border border-bone bg-white p-4 text-[13px] text-error">
        <AlertCircle size={15} className="shrink-0" />
        <span className="flex-1">{loadError}</span>
        <Button size="xs" variant="outline" icon={<RefreshCw size={11} />} onClick={() => setReload(n => n + 1)}>Retry</Button>
      </div>
    );
  }
  if (!english) {
    return (
      <div className="mt-4 flex flex-col gap-3" aria-busy="true" aria-label="Loading buttons and labels">
        <SkeletonBox height={44} rounded="10px" />
        <SkeletonBox height={260} rounded="12px" />
      </div>
    );
  }

  const bundleMissing = Object.keys(current).length === 0;

  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-bone bg-white p-4 sm:p-3">
        <p className="m-0 min-w-0 flex-1 text-[13px] text-charcoal">
          Your own wording for the store's built-in buttons and messages in <b>{languageName(locale)}</b>. Leave a box empty to keep the standard text.
          {customCount > 0 && <span className="text-slate"> {customCount} customised.</span>}
        </p>
        <Button size="sm" disabled={dirtyKeys.length === 0} loading={saving} onClick={() => void save()}>
          {dirtyKeys.length ? `Save ${dirtyKeys.length} change${dirtyKeys.length === 1 ? '' : 's'}` : 'Saved'}
        </Button>
      </div>

      {bundleMissing && (
        <p role="status" className="m-0 rounded-lg border border-bone bg-white px-3 py-2 text-[12.5px] text-slate">
          The standard {languageName(locale)} text is still being prepared, so customers see English for anything you leave empty. Check again in a minute.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-[280px]"><SearchInput value={q} onChange={v => { setQ(v); setPage(1); }} placeholder="Search a button or message" aria-label="Search buttons and labels" /></div>
        <label className="flex items-center gap-2 text-[12.5px] text-charcoal cursor-pointer">
          <input type="checkbox" className="pointer-coarse:size-6" checked={customOnly} onChange={e => { setCustomOnly(e.target.checked); setPage(1); }} /> Only my customised text
        </label>
      </div>

      {rows.length === 0 && <p className="text-[13px] text-slate text-center py-8">{q || customOnly ? 'Nothing matches.' : 'No text.'}</p>}

      <ul className="m-0 p-0 list-none rounded-xl border border-bone bg-white divide-y divide-bone">
        {pageRows.map(key => {
          const id = `ui-${key}`;
          const value = valueOf(key);
          return (
            <li key={key} className="grid gap-2 p-4 sm:p-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="min-w-0">
                <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-slate break-words">{niceKey(key)}</p>
                <p className="m-0 mt-1 text-[12.5px] pointer-coarse:text-[15px] text-slate whitespace-pre-line break-words">English: {english[key]}</p>
                {current[key] && locale !== 'en' && <p className="m-0 mt-0.5 text-[13px] pointer-coarse:text-[15px] text-charcoal whitespace-pre-line break-words" dir="auto">{languageName(locale)}: {current[key]}</p>}
              </div>
              <div className="min-w-0">
                <label htmlFor={id} className="sr-only">{`Your wording for ${niceKey(key)}`}</label>
                <textarea id={id} value={value} rows={2} maxLength={500} dir="auto"
                  onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                  placeholder={current[key] || english[key]}
                  className="w-full px-3 py-2 text-[13px] pointer-coarse:text-[15px] border border-bone rounded-lg text-charcoal bg-white outline-none focus:border-brand-orange resize-y" />
                {value.trim() && <button type="button" onClick={() => setDraft(d => ({ ...d, [key]: '' }))} className="mt-1 text-[11.5px] text-slate underline bg-transparent border-0 cursor-pointer p-0">Back to standard text</button>}
              </div>
            </li>
          );
        })}
      </ul>

      <Pagination page={page} total={rows.length} perPage={PER_PAGE} onChange={setPage} />
    </div>
  );
}
