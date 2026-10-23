import { useMemo, useState } from 'react';
import { useStoreTextIndex } from '@/features/storefront/storeTextContext';
import { localizeFields } from '@/utils/storeText';
import { ts } from '@/utils/tStatic';
import { Link } from 'react-router-dom';
import { HelpCircle, Search } from 'lucide-react';
import { apiListPublicStoreFaqs } from '@/api/services/storeFaq';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { fashionTheme as t } from '../theme.config';
import { EmptyState, ErrorState, Field, Page, PageTitle, SkeletonBlock, TextInput } from '../ui/primitives';
import { FaqAccordion } from './content/FaqAccordion';
import { useLoad } from '../../core/pageHooks';
import { apiGetPublicStorePage, apiPublicPageMayExist } from '@/api/services/storePages';
import { FashionCustomPage } from './FashionCustomPage';
import { PageSkeleton } from './pageParts';

/** `/faqs` - a seller-built page with slug `faqs` wins; otherwise the built-in list of questions. */
export function FashionFaqsPage() {
  const { store } = useStorefront();
  const { data, loading } = useLoad(
    async () => {
      if (!(await apiPublicPageMayExist(store.storeId, 'faqs'))) return null;
      return apiGetPublicStorePage(store.storeId, 'faqs').then(r => r.data ?? null).catch(() => null);
    },
    [store.storeId],
  );
  if (loading) return <PageSkeleton />;
  if (data) return <FashionCustomPage slug="faqs" />;
  return <BuiltInFaqs />;
}

/** The questions the seller manages under Online Store > FAQs, searchable, with FAQPage structured data. */
function BuiltInFaqs() {
  const { store } = useStorefront();
  const [query, setQuery] = useState('');
  useStorefrontSeo({ title: ts('faq.title', 'Frequently asked questions'), description: ts('pg.answers_to_common_questions_about', 'Answers to common questions about shopping at {{store}}.', { store: store.name }) });
  const { data: source, loading, error, retry } = useLoad(() => apiListPublicStoreFaqs(store.storeId).then(r => r.data ?? []), [store.storeId]);
  const textIndex = useStoreTextIndex();
  const data = useMemo(() => (source ? source.map(f => localizeFields(f, `faq:${f._id}`, textIndex)) : source), [source, textIndex]);

  const q = query.trim().toLowerCase();
  const shown = (data ?? []).filter(f => !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
  const jsonLd = data && data.length > 0 ? JSON.stringify({
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: data.map(f => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
  }).replace(/</g, '\\u003c') : null;

  return (
    <Page narrow>
      <PageTitle subtitle={ts('pg.quick_answers_about_orders_delivery_and', 'Quick answers about orders, delivery and shopping at {{store}}.', { store: store.name })}>{ts('h.frequently_asked_questions', 'Frequently asked *questions*')}</PageTitle>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />}
      {loading ? <div role="status" aria-label={ts('pg.loading_questions', 'Loading questions')}><SkeletonBlock h={68} rows={5} /></div>
        : error ? <ErrorState message={ts('pg.we_couldn_t_load_the_questions_right_now', 'We couldn\'t load the questions right now.')} onRetry={retry} />
        : !data || data.length === 0 ? <EmptyState icon={<HelpCircle size={24} aria-hidden />} title={ts('pg.no_questions_yet', 'No questions yet')} text={ts('pg.nothing_has_been_added_here_yet_if_you_n', 'Nothing has been added here yet. If you need help, send us a message.')} action={<Link to="/messages" className="fx-pill" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: t.buttonRadiusPx }}>{ts('pg.contact_us', 'Contact us')}</Link>} />
        : (
          <>
            {data.length > 5 && (
              <div className="mb-5 relative">
                <Field label={ts('pg.search_the_questions', 'Search the questions')}>
                  {props => <><Search size={16} aria-hidden className="pointer-events-none absolute left-4 bottom-[17px]" style={{ color: t.colors.inkMuted }} /><TextInput {...props} type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={ts('pg.type_a_word_e_g_shipping', 'Type a word, e.g. shipping')} style={{ paddingLeft: 42 }} /></>}
                </Field>
              </div>
            )}
            <p className="sr-only" role="status">{q ? `${shown.length} ${shown.length === 1 ? 'question' : 'questions'} found` : ''}</p>
            {shown.length === 0 ? <EmptyState title={ts('pg.no_matching_questions', 'No matching questions')} text={ts('pg.try_a_different_word_or_clear_the_search', 'Try a different word or clear the search.')} /> : <FaqAccordion faqs={shown} />}
            <div className="mt-10 grid gap-3 p-6 text-center" style={{ borderRadius: 24, background: t.colors.bgAlt }}>
              <p className="m-0 text-lg font-semibold">{ts('pg.still_need_help', 'Still need help?')}</p>
              <p className="m-0 text-sm" style={{ color: t.colors.inkMuted }}>{ts('pg.our_team_is_happy_to_answer_anything_els', 'Our team is happy to answer anything else.')}</p>
              <div><Link to="/messages" className="fx-pill" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: t.buttonRadiusPx }}>{ts('pg.message_us', 'Message us')}</Link></div>
            </div>
          </>
        )}
    </Page>
  );
}
