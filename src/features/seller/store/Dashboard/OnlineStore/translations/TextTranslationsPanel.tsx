import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ChevronDown, ChevronRight, RefreshCw, Sparkles } from 'lucide-react';
import { Button, SearchInput } from '@/components/comman/ui';
import { SkeletonBox } from '@/components/comman/ui/SkeletonBox';
import { useToast } from '@/contexts/ToastContext';
import {
  apiAutoTranslateText, apiGetTextSources, apiGetTextTranslations, apiSaveTextTranslations,
  type TextSourceGroup, type TextSourceItem,
} from '@/api/services/storeTextTranslations';
import { languageName } from '@/utils/languages';

const errText = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);
const AUTO_BATCH = 40;
const SAVE_BATCH = 300;

type Filter = 'all' | 'missing';

/** Translate & adapt → Store text: headings, buttons, announcement, header, footer, pages and FAQs in one language. */
export function TextTranslationsPanel({ storeId, locale, onDirtyChange, scope }: {
  storeId: string;
  locale: string;
  onDirtyChange: (dirty: boolean) => void;
  /** Only the text of one thing (a blog post body: `bp:<id>`); omitted = all store text. */
  scope?: string;
}) {
  const toast = useToast();
  const [groups, setGroups] = useState<TextSourceGroup[] | null>(null);
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [suggested, setSuggested] = useState<Set<string>>(new Set());
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);
  const [filter, setFilter] = useState<Filter>(scope ? 'all' : 'missing');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [autoBusy, setAutoBusy] = useState<string | null>(null);
  const [autoError, setAutoError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setGroups(null);
    setLoadError('');
    Promise.all([apiGetTextSources(storeId, scope), apiGetTextTranslations(storeId, locale)])
      .then(([src, tr]) => {
        if (cancelled) return;
        setGroups(src.data.groups);
        setSaved(tr.data.strings);
        setDraft({});
        setSuggested(new Set());
      })
      .catch(err => { if (!cancelled) setLoadError(errText(err, 'Failed to load your store text.')); });
    return () => { cancelled = true; };
  }, [storeId, locale, reload, scope]);

  const valueOf = useCallback((key: string) => (key in draft ? draft[key] : saved[key] ?? ''), [draft, saved]);
  const dirtyKeys = useMemo(() => Object.keys(draft).filter(k => (draft[k] ?? '') !== (saved[k] ?? '')), [draft, saved]);
  useEffect(() => { onDirtyChange(dirtyKeys.length > 0); return () => onDirtyChange(false); }, [dirtyKeys.length, onDirtyChange]);

  const allItems = useMemo(() => (groups ?? []).flatMap(g => g.items), [groups]);
  const doneCount = allItems.filter(i => valueOf(i.key).trim()).length;

  const visibleGroups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (groups ?? [])
      .map(g => ({
        ...g,
        items: g.items.filter(i => {
          if (filter === 'missing' && valueOf(i.key).trim()) return false;
          if (!needle) return true;
          return i.source.toLowerCase().includes(needle) || i.label.toLowerCase().includes(needle) || valueOf(i.key).toLowerCase().includes(needle);
        }),
      }))
      .filter(g => g.items.length > 0);
  }, [groups, filter, q, valueOf]);

  const setValue = (key: string, value: string) => {
    setDraft(d => ({ ...d, [key]: value }));
    setSuggested(s => { if (!s.has(key)) return s; const next = new Set(s); next.delete(key); return next; });
  };

  const save = async () => {
    if (!dirtyKeys.length || saving) return;
    setSaving(true);
    try {
      let latest = saved;
      for (let i = 0; i < dirtyKeys.length; i += SAVE_BATCH) {
        const entries = dirtyKeys.slice(i, i + SAVE_BATCH).map(key => ({ key, value: draft[key] ?? '' }));
        const res = await apiSaveTextTranslations(storeId, locale, entries);
        latest = res.data.strings;
      }
      setSaved(latest);
      setDraft({});
      setSuggested(new Set());
      toast.success('Translations saved.');
    } catch (err) {
      toast.error(errText(err, 'Failed to save the translations.'));
    } finally {
      setSaving(false);
    }
  };

  /** Fills the boxes with machine suggestions for the texts still empty; the seller reviews and saves. */
  const autoTranslate = async (scope: string, items: TextSourceItem[]) => {
    const todo = items.filter(i => !valueOf(i.key).trim());
    if (!todo.length || autoBusy) return;
    setAutoBusy(scope);
    setAutoError('');
    try {
      const got: Record<string, string> = {};
      for (let i = 0; i < todo.length; i += AUTO_BATCH) {
        const res = await apiAutoTranslateText(storeId, locale, todo.slice(i, i + AUTO_BATCH).map(t => t.key));
        Object.assign(got, res.data.translations);
      }
      const keys = Object.keys(got);
      if (!keys.length) { setAutoError('The translator returned nothing. Try again.'); return; }
      setDraft(d => ({ ...d, ...got }));
      setSuggested(s => new Set([...s, ...keys]));
      toast.success(`${keys.length} suggested. Review them, then save.`);
    } catch (err) {
      setAutoError(errText(err, 'Automatic translation failed.'));
    } finally {
      setAutoBusy(null);
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
  if (!groups) {
    return (
      <div className="mt-4 flex flex-col gap-3" aria-busy="true" aria-label="Loading store text">
        <SkeletonBox height={44} rounded="10px" />
        <SkeletonBox height={220} rounded="12px" />
      </div>
    );
  }
  if (allItems.length === 0) {
    return <p className="mt-6 text-[13px] text-slate text-center">{scope ? 'This post has no body text to translate.' : 'There is no text to translate yet. Add headings, buttons or an announcement to your store first.'}</p>;
  }

  const missing = allItems.length - doneCount;

  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-bone bg-white p-4 sm:p-3">
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[13px] pointer-coarse:text-[15px] font-semibold text-charcoal">{languageName(locale)}: {doneCount} of {allItems.length} translated</p>
          <div className="mt-1.5 h-1.5 rounded-full bg-bone overflow-hidden" aria-hidden><div className="h-full bg-brand-orange" style={{ width: `${Math.round((doneCount / allItems.length) * 100)}%` }} /></div>
        </div>
        <Button size="sm" variant="outline" icon={<Sparkles size={13} />} disabled={missing === 0 || !!autoBusy} loading={autoBusy === 'all'} onClick={() => void autoTranslate('all', allItems)}>
          Translate {missing} missing automatically
        </Button>
        <Button size="sm" disabled={dirtyKeys.length === 0} loading={saving} onClick={() => void save()}>
          {dirtyKeys.length ? `Save ${dirtyKeys.length} change${dirtyKeys.length === 1 ? '' : 's'}` : 'Saved'}
        </Button>
      </div>

      {autoError && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-bone bg-white px-3 py-2 text-[12.5px] text-error">
          <AlertCircle size={14} className="shrink-0" /><span>{autoError}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-[280px]"><SearchInput value={q} onChange={setQ} placeholder="Search text" aria-label="Search store text" /></div>
        <div className="flex gap-1.5" role="group" aria-label="Show">
          {([['missing', `Needs translation (${missing})`], ['all', `All (${allItems.length})`]] as [Filter, string][]).map(([id, label]) => (
            <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}
              className={`px-3 py-1.5 rounded-lg border text-[12px] font-semibold cursor-pointer pointer-coarse:min-h-11 ${filter === id ? 'border-brand-orange text-brand-orange bg-brand-pale-orange/40' : 'border-bone text-charcoal bg-white hover:bg-cream'}`}>{label}</button>
          ))}
        </div>
      </div>

      {visibleGroups.length === 0 && <p className="text-[13px] text-slate text-center py-8">{q ? 'No text matches your search.' : 'Everything is translated.'}</p>}

      {visibleGroups.map(g => {
        const isOpen = open[g.id] ?? true;
        const groupMissing = g.items.filter(i => !valueOf(i.key).trim()).length;
        return (
          <section key={g.id} className="rounded-xl border border-bone bg-white">
            <div className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:gap-2 sm:px-3 sm:py-2.5">
              <button type="button" aria-expanded={isOpen} onClick={() => setOpen(o => ({ ...o, [g.id]: !isOpen }))}
                className="flex items-center gap-2 text-left bg-transparent border-0 cursor-pointer p-0 min-w-0 sm:flex-1">
                {isOpen ? <ChevronDown size={15} aria-hidden /> : <ChevronRight size={15} aria-hidden />}
                <span className="text-[13.5px] font-semibold text-charcoal sm:truncate">{g.title}</span>
                <span className="text-[11.5px] pointer-coarse:text-[13px] text-slate shrink-0">{g.items.length - groupMissing} of {g.items.length}</span>
              </button>
              {groupMissing > 0 && (
                <Button size="xs" className="self-start sm:self-auto" variant="outline" icon={<Sparkles size={11} />} disabled={!!autoBusy} loading={autoBusy === g.id} onClick={() => void autoTranslate(g.id, g.items)}>Auto-translate</Button>
              )}
            </div>
            {isOpen && (
              <ul className="m-0 p-0 list-none border-t border-bone divide-y divide-bone">
                {g.items.map(item => {
                  const value = valueOf(item.key);
                  const id = `tt-${item.key}`;
                  return (
                    <li key={item.key} className="grid gap-2 p-4 sm:p-3 lg:grid-cols-2">
                      <div className="min-w-0">
                        <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-slate">{item.label}</p>
                        <p className="m-0 mt-1 text-[13px] pointer-coarse:text-[15px] text-charcoal whitespace-pre-line break-words">{item.source}</p>
                      </div>
                      <div className="min-w-0">
                        <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-wide text-slate">
                          {languageName(locale)}{suggested.has(item.key) && <span className="ml-2 normal-case tracking-normal text-brand-orange">Suggested, please review</span>}
                        </label>
                        <textarea id={id} value={value} rows={item.multiline ? 4 : 2} maxLength={5000} dir="auto"
                          onChange={e => setValue(item.key, e.target.value)}
                          placeholder="Not translated: visitors see the original"
                          className="mt-1 w-full px-3 py-2 text-[13px] pointer-coarse:text-[15px] border border-bone rounded-lg text-charcoal bg-white outline-none focus:border-brand-orange resize-y" />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
