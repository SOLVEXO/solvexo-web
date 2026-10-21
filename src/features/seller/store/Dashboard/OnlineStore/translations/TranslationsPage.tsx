import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Languages, RefreshCw } from 'lucide-react';
import { Button, Pagination, SearchInput, Select, TabBar, type Tab } from '@/components/comman/ui';
import { EmptyState } from '@/components/comman/ui/EmptyState';
import { Modal } from '@/components/comman/ui/Modal';
import { PageHeader } from '@/components/comman/ui/PageHeader';
import { SkeletonBox } from '@/components/comman/ui/SkeletonBox';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { apiListSellerMarkets } from '@/api/services/marketsSeller';
import {
  apiListTranslatable,
  type TranslatableItem, type TranslationResource, type TranslationsPage,
} from '@/api/services/translations';
import { languageName } from '@/utils/languages';
import { menuProgress, translationProgress } from '@/utils/translationProgress';
import { TranslationItemEditor } from './TranslationItemEditor';
import { TextTranslationsPanel } from './TextTranslationsPanel';
import { UiTextPanel } from './UiTextPanel';

const LIMIT = 20;
const RESOURCE_TABS: Tab[] = [
  { id: 'products', label: 'Products' },
  { id: 'collections', label: 'Collections' },
  { id: 'pages', label: 'Pages' },
  { id: 'menus', label: 'Menus' },
  { id: 'blog_posts', label: 'Blog posts' },
  { id: 'text', label: 'Store text' },
  { id: 'ui', label: 'Buttons & labels' },
];
const errText = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);

type Fetched<T> = { key: string; data?: T; error?: string };

/** Online Store → Translate & adapt: translate products, collections, pages and menus into the languages of your markets. */
export function TranslationsPage() {
  const { storeId, store } = useStoreWorkspace();
  // The language the store is written in is the source, never a translation target.
  const sourceLanguage = store?.defaultLanguage ?? 'en';
  const [tab, setTab] = useState<TranslationResource | 'text' | 'ui'>('products');

  // ── languages (from the store's markets, English excluded) ──
  const [langReload, setLangReload] = useState(0);
  const [langRes, setLangRes] = useState<Fetched<string[]>>({ key: '' });
  const langKey = `${storeId}|${langReload}`;
  useEffect(() => {
    let cancelled = false;
    apiListSellerMarkets(storeId)
      .then(res => {
        const set = new Set<string>();
        (res.data ?? []).forEach(m => m.languages.forEach(l => { if (l && l !== sourceLanguage) set.add(l); }));
        if (!cancelled) setLangRes({ key: langKey, data: [...set] });
      })
      .catch(err => { if (!cancelled) setLangRes({ key: langKey, error: errText(err, 'Failed to load your languages.') }); });
    return () => { cancelled = true; };
  }, [storeId, langKey, sourceLanguage]);
  const langLoading = langRes.key !== langKey;
  const languages = langRes.data ?? [];

  const [pickedLocale, setPickedLocale] = useState('');
  // Buttons & labels can be reworded in the store's own language as well; everything else only translates into the other languages.
  const offered = tab === 'ui' ? [sourceLanguage, ...languages.filter(l => l !== sourceLanguage)] : languages;
  const locale = offered.includes(pickedLocale) ? pickedLocale : (offered[0] ?? '');

  // ── resource list ──
  const resource: TranslationResource = tab === 'text' || tab === 'ui' ? 'products' : tab;
  const noun = resource === 'blog_posts' ? 'blog posts' : resource;
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [listReload, setListReload] = useState(0);
  const [listRes, setListRes] = useState<Fetched<TranslationsPage>>({ key: '' });
  const [overrides, setOverrides] = useState<Record<string, TranslatableItem>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const listKey = `${storeId}|${resource}|${page}|${q}|${listReload}`;

  useEffect(() => {
    const t = setTimeout(() => { setQ(qInput.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [qInput]);

  useEffect(() => {
    if (!locale || tab === 'text' || tab === 'ui') return;
    let cancelled = false;
    apiListTranslatable(storeId, resource, { page, limit: LIMIT, q: q || undefined })
      .then(res => { if (!cancelled) { setListRes({ key: listKey, data: res.data }); setOverrides({}); } })
      .catch(err => { if (!cancelled) setListRes({ key: listKey, error: errText(err, 'Failed to load the list.') }); });
    return () => { cancelled = true; };
  }, [storeId, resource, tab, page, q, listKey, locale]);
  const listLoading = !!locale && listRes.key !== listKey;
  const items = useMemo(() => (listRes.data?.items ?? []).map(i => overrides[i.id] ?? i), [listRes.data, overrides]);
  const selected = items.find(i => i.id === selectedId) ?? null;

  // ── unsaved-changes guard ──
  const dirtyRef = useRef(false);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const onDirtyChange = useCallback((d: boolean) => { dirtyRef.current = d; }, []);
  const guard = (action: () => void) => {
    if (dirtyRef.current) setPending(() => action);
    else action();
  };
  const discardAndContinue = () => {
    const action = pending;
    dirtyRef.current = false;
    setPending(null);
    action?.();
  };

  const onSaved = (item: TranslatableItem) => setOverrides(o => ({ ...o, [item.id]: item }));

  const progressOf = (it: TranslatableItem) => (resource === 'menus' ? menuProgress(it.menuItems ?? [], locale) : translationProgress(it.source, it.translations?.[locale]));

  return (
    <div className="w-full px-4 lg:px-7 pt-5 pb-10 [&_.surface-panel]:!shadow-none [&_button]:!shadow-none [&_button:hover]:!shadow-none">
      <PageHeader
        title="Translate & adapt"
        description="Translate your products, collections, pages, menus, blog posts and store text (headings, buttons, announcement, header, footer, categories, FAQs) into the languages of your markets. Buyers see the translation when they pick that language; otherwise they see your English text."
      />

      {langLoading && (
        <div className="mt-5 flex flex-col gap-3" aria-busy="true" aria-label="Loading languages">
          <SkeletonBox height={40} rounded="10px" />
          <SkeletonBox height={260} rounded="12px" />
        </div>
      )}

      {!langLoading && langRes.error && (
        <div role="alert" className="mt-5 flex items-center gap-3 rounded-xl border border-bone bg-white p-4 text-[13px] text-error">
          <AlertCircle size={15} className="shrink-0" />
          <span className="flex-1">{langRes.error}</span>
          <button type="button" onClick={() => setLangReload(n => n + 1)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-bone bg-white text-[12px] font-semibold text-charcoal cursor-pointer">
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {!langLoading && !langRes.error && languages.length === 0 && (
        <EmptyState
          icon={<Languages size={28} className="text-brand-orange" />}
          title="No languages to translate into yet"
          description="Add a language to one of your markets first. Your store's own language is the original text and is never translated."
        />
      )}
      {!langLoading && !langRes.error && languages.length === 0 && (
        <div className="flex justify-center -mt-4">
          <Link to={`/store/${storeId}/settings/markets`} className="text-[13px] font-semibold text-brand-orange no-underline hover:underline">Go to Markets</Link>
        </div>
      )}

      {!langLoading && !langRes.error && languages.length > 0 && (
        <>
          <div className="mt-5 flex flex-wrap items-end gap-4">
            <div className="w-full sm:w-[240px]">
              <Select label="Language" value={locale} onChange={e => { const v = e.target.value; guard(() => setPickedLocale(v)); }}>
                {offered.map(l => <option key={l} value={l}>{languageName(l)}</option>)}
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <TabBar tabs={RESOURCE_TABS} active={tab} onChange={id => guard(() => { setTab(id as TranslationResource | 'text' | 'ui'); setPage(1); setSelectedId(null); })} />
          </div>

          {tab === 'text' && <TextTranslationsPanel key={locale} storeId={storeId} locale={locale} onDirtyChange={onDirtyChange} />}

          {tab === 'ui' && <UiTextPanel key={locale} storeId={storeId} locale={locale} onDirtyChange={onDirtyChange} />}

          {tab !== 'text' && tab !== 'ui' && <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] items-start">
            <div className="rounded-xl border border-bone bg-white p-3 flex flex-col gap-3 min-w-0">
              <SearchInput value={qInput} onChange={setQInput} placeholder={`Search ${noun}`} aria-label={`Search ${noun}`} />

              {listLoading && (
                <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading list">
                  {[0, 1, 2, 3, 4].map(i => <SkeletonBox key={i} height={52} rounded="8px" />)}
                </div>
              )}

              {!listLoading && listRes.error && (
                <div role="alert" className="flex items-center gap-2 text-[12.5px] text-error">
                  <AlertCircle size={14} className="shrink-0" />
                  <span className="flex-1">{listRes.error}</span>
                  <Button size="xs" variant="outline" icon={<RefreshCw size={11} />} onClick={() => setListReload(n => n + 1)}>Retry</Button>
                </div>
              )}

              {!listLoading && !listRes.error && items.length === 0 && (
                <p className="text-[12.5px] text-slate py-6 text-center">{q ? 'No matches for your search.' : `No ${noun} yet.`}</p>
              )}

              {!listLoading && !listRes.error && items.length > 0 && (
                <ul className="m-0 p-0 list-none flex flex-col gap-1">
                  {items.map(it => {
                    const p = progressOf(it);
                    const done = p.total > 0 && p.done === p.total;
                    return (
                      <li key={it.id}>
                        <button
                          type="button"
                          aria-current={it.id === selectedId}
                          onClick={() => guard(() => setSelectedId(it.id))}
                          className={`w-full text-left rounded-lg border px-3 py-2 cursor-pointer bg-white ${it.id === selectedId ? 'border-brand-orange bg-brand-pale-orange/40' : 'border-transparent hover:bg-cream'}`}
                        >
                          <span className="block text-[13px] font-medium text-charcoal truncate">{it.source.title || 'Untitled'}</span>
                          <span className={`block text-[11px] ${done ? 'text-success' : 'text-slate'}`}>{p.done} of {p.total} translated</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {listRes.data && (
                <Pagination page={page} total={listRes.data.pagination.total} perPage={LIMIT} onChange={p => guard(() => { setPage(p); setSelectedId(null); })} />
              )}
            </div>

            <div className="min-w-0">
              {selected ? (
                <TranslationItemEditor
                  key={`${resource}|${selected.id}|${locale}`}
                  storeId={storeId}
                  resource={resource}
                  item={selected}
                  locale={locale}
                  onSaved={onSaved}
                  onDirtyChange={onDirtyChange}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-bone bg-white py-16 px-6 text-center text-[13px] text-slate">
                  Select an item on the left to translate it into {languageName(locale)}.
                </div>
              )}
            </div>
          </div>}
        </>
      )}

      {pending && (
        <Modal
          title="Discard unsaved changes?"
          onClose={() => setPending(null)}
          footer={(
            <>
              <Button variant="outline" size="sm" onClick={() => setPending(null)}>Keep editing</Button>
              <Button variant="danger" size="sm" onClick={discardAndContinue}>Discard</Button>
            </>
          )}
        >
          <p className="text-[13px] text-charcoal">You have changes to this translation that are not saved. If you continue they will be lost.</p>
        </Modal>
      )}
    </div>
  );
}
