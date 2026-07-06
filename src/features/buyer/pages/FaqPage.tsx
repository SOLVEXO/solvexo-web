import { useState } from 'react';
import { clsx } from 'clsx';
import { Search, ChevronDown, HelpCircle } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useFaqs, useFaqCategories } from '@/hooks/useFaqs';

const SERIF = "'Lora', Georgia, serif";

function FaqAccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-bone">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left bg-transparent border-none cursor-pointer"
      >
        <span className="text-[14px] font-semibold text-carbon">{question}</span>
        <ChevronDown size={16} className={clsx('shrink-0 text-slate transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <p className="text-[13px] text-slate leading-[1.7] pb-5 pr-8">{answer}</p>
      )}
    </div>
  );
}

export function FaqPage() {
  usePageTitle('FAQ');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const categories = useFaqCategories();
  const { faqs, loading, error } = useFaqs(category || undefined, query);

  return (
    <div className="bg-cream min-h-full">
      {/* ── Hero ── */}
      <div className="text-center px-4 md:px-8 lg:px-12 pt-10 md:pt-16 pb-10 max-w-[720px] mx-auto">
        <h1 className="text-2xl md:text-4xl lg:text-[42px] font-bold text-carbon leading-[1.2] mb-[14px]" style={{ fontFamily: SERIF }}>
          Frequently asked questions
        </h1>
        <p className="text-sm md:text-[16px] text-slate leading-[1.6] mb-8">
          Find answers about your account, orders, payments and more.
        </p>

        <div className="flex items-center gap-[6px] border border-bone rounded-lg px-4 bg-white max-w-[440px] mx-auto">
          <Search size={15} className="text-slate shrink-0" />
          <input
            placeholder="Search for a question…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="border-none outline-none text-[13px] py-[10px] w-full text-charcoal bg-transparent"
          />
        </div>
      </div>

      {/* ── Category filter ── */}
      {!query && categories.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 px-4 pb-8">
          <button
            onClick={() => setCategory('')}
            className={clsx(
              'px-4 py-[7px] rounded-full text-[12px] font-semibold cursor-pointer border capitalize',
              category === '' ? 'bg-brand-orange text-white border-brand-orange' : 'bg-white text-charcoal border-bone',
            )}
          >
            All
          </button>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={clsx(
                'px-4 py-[7px] rounded-full text-[12px] font-semibold cursor-pointer border capitalize',
                category === c ? 'bg-brand-orange text-white border-brand-orange' : 'bg-white text-charcoal border-bone',
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* ── FAQ list ── */}
      <div className="bg-white px-4 md:px-8 lg:px-12 py-10 border-t border-bone">
        <div className="max-w-[720px] mx-auto">
          {loading ? (
            <p className="text-[13px] text-slate text-center py-10">Loading…</p>
          ) : error ? (
            <p className="text-[13px] text-error text-center py-10">{error}</p>
          ) : faqs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <HelpCircle size={26} className="text-slate" />
              <p className="text-[13px] text-slate">No FAQs found{query ? ` for "${query}"` : ''}.</p>
            </div>
          ) : (
            <div>
              {faqs.map(faq => (
                <FaqAccordionItem key={faq._id} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
