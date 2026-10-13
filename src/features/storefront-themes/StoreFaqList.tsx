import { useEffect, useId, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { apiListPublicStoreFaqs, type PublicStoreFaq } from '@/api/services/storeFaq';

interface FaqTokens {
  fonts: { display: string; body: string };
  colors: { ink: string; inkMuted: string; border: string; accent: string };
}

/** The store's FAQs as an accessible accordion (one shared implementation, styled by each theme's tokens). Also emits
 *  schema.org FAQPage data so the questions can appear in search results. */
export function StoreFaqList({ storeId, tokens }: { storeId: string; tokens: FaqTokens }) {
  const [faqs, setFaqs] = useState<PublicStoreFaq[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const uid = useId();

  useEffect(() => {
    let off = false;
    apiListPublicStoreFaqs(storeId).then(r => { if (!off) setFaqs(r.data ?? []); }).catch(() => { if (!off) { setFailed(true); setFaqs([]); } });
    return () => { off = true; };
  }, [storeId]);

  if (faqs === null) return <p style={{ fontFamily: tokens.fonts.body, fontSize: '13px', color: tokens.colors.inkMuted }}>Loading…</p>;
  if (failed) return <p style={{ fontFamily: tokens.fonts.body, fontSize: '14px', color: tokens.colors.inkMuted }}>We couldn't load the questions right now. Please try again later.</p>;
  if (faqs.length === 0) return <p style={{ fontFamily: tokens.fonts.body, fontSize: '14px', color: tokens.colors.inkMuted }}>No questions have been added yet.</p>;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
  };

  return (
    <div>
      {/* `<` is escaped so a question can never close the script tag. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <ul className="list-none p-0 m-0">
        {faqs.map(f => {
          const open = openId === f._id;
          const panelId = `${uid}-${f._id}`;
          return (
            <li key={f._id} style={{ borderBottom: `1px solid ${tokens.colors.border}` }}>
              <h2 style={{ margin: 0 }}>
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : f._id)}
                  aria-expanded={open}
                  aria-controls={panelId}
                  className="w-full flex items-center justify-between gap-4 text-left bg-transparent border-0 cursor-pointer"
                  style={{ padding: '18px 0', fontFamily: tokens.fonts.display, fontSize: '17px', fontWeight: 600, color: tokens.colors.ink }}
                >
                  <span>{f.question}</span>
                  {open ? <Minus size={16} aria-hidden /> : <Plus size={16} aria-hidden />}
                </button>
              </h2>
              {open && (
                <div id={panelId} role="region" style={{ paddingBottom: '20px', fontFamily: tokens.fonts.body, fontSize: '14.5px', lineHeight: 1.75, color: tokens.colors.inkMuted, whiteSpace: 'pre-line' }}>
                  {f.answer}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
