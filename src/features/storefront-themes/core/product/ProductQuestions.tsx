import { useEffect, useState, type FormEvent } from 'react';
import { ts } from '@/utils/tStatic';
import { errorMessage } from '@/api/errorMessage';
import { apiAskQuestion, apiGetPublicQuestions, type PublicQuestion } from '@/api/services/productQuestions';

export interface QuestionTokens { ink: string; inkMuted: string; border: string; radius: number | string; accent: string; accentInk: string; fontBody?: string }

/** "Questions & answers" on a product page: answered questions, and a form to ask a new one (it shows once the seller answers). */
export function ProductQuestions({ storeId, productId, settings, tokens: t, preview = false }: { storeId: string; productId: string; settings: Record<string, unknown>; tokens: QuestionTokens; /** Editor preview: looks and reads the same, but nothing is sent. */ preview?: boolean }) {
  const [items, setItems] = useState<PublicQuestion[] | null>(null);
  const [form, setForm] = useState({ name: '', email: '', question: '', website: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');
  const heading = typeof settings.heading === 'string' && settings.heading.trim() ? settings.heading.trim() : ts('product.qaHeading', 'Questions & answers');
  const showForm = settings.showForm !== false;

  useEffect(() => {
    let off = false;
    apiGetPublicQuestions(storeId, productId).then(r => { if (!off) setItems(r?.items ?? []); }).catch(() => { if (!off) setItems([]); });
    return () => { off = true; };
  }, [storeId, productId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (preview) { setStatus('done'); return; }
    setStatus('sending');
    try {
      await apiAskQuestion(storeId, productId, { name: form.name, email: form.email || undefined, question: form.question, website: form.website });
      setStatus('done');
      setForm({ name: form.name, email: form.email, question: '', website: '' });
    } catch (err) {
      setError(errorMessage(err));
      setStatus('idle');
    }
  };

  if (items && items.length === 0 && !showForm) return null;
  const field = { border: `1px solid ${t.border}`, borderRadius: t.radius, padding: '10px 12px', fontFamily: t.fontBody, color: t.ink, background: 'transparent', width: '100%' } as const;
  return (
    <section data-product-questions aria-label={heading} style={{ fontFamily: t.fontBody, color: t.ink }}>
      <h2 className="m-0 mb-4 text-lg font-semibold">{heading}</h2>
      {items === null && <p className="m-0 text-sm" style={{ color: t.inkMuted }}>{ts('common.loading', 'Loading…')}</p>}
      {items && items.length === 0 && <p className="m-0 mb-4 text-sm" style={{ color: t.inkMuted }}>{ts('product.qaEmpty', 'No questions yet. Be the first to ask.')}</p>}
      {items && items.length > 0 && (
        <ul className="m-0 mb-6 flex list-none flex-col gap-4 p-0">
          {items.map(q => (
            <li key={q.id} className="flex flex-col gap-1" style={{ borderBottom: `1px solid ${t.border}`, paddingBottom: 14 }}>
              <p className="m-0 text-sm font-medium"><span aria-hidden>Q: </span>{q.question}</p>
              <p className="m-0 text-sm" style={{ color: t.inkMuted }}><span aria-hidden>A: </span>{q.answer}</p>
              <p className="m-0 text-xs" style={{ color: t.inkMuted }}>{q.askerName}</p>
            </li>
          ))}
        </ul>
      )}
      {showForm && (status === 'done'
        ? <p role="status" className="m-0 text-sm" style={{ color: t.ink }}>{ts('product.qaThanks', 'Thanks! Your question was sent. It will appear here once the seller answers.')}</p>
        : (
          <form onSubmit={submit} className="flex flex-col gap-3" aria-label={ts('product.qaAsk', 'Ask a question')}>
            <p className="m-0 text-sm font-medium">{ts('product.qaAsk', 'Ask a question')}</p>
            <textarea aria-label={ts('product.qaQuestion', 'Your question')} placeholder={ts('product.qaQuestion', 'Your question')} required minLength={5} maxLength={500} rows={3} value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} style={field} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input aria-label={ts('product.qaName', 'Your name')} placeholder={ts('product.qaName', 'Your name')} required minLength={2} maxLength={60} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={field} />
              <input aria-label={ts('product.qaEmail', 'Email (optional, never shown)')} placeholder={ts('product.qaEmail', 'Email (optional, never shown)')} type="email" maxLength={160} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={field} />
            </div>
            {/* hidden field: only bots fill it */}
            <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />
            {error && <p role="alert" className="m-0 text-sm" style={{ color: '#b91c1c' }}>{error}</p>}
            <button type="submit" disabled={status === 'sending'} className="cursor-pointer self-start border-0 px-5 py-2.5 text-sm font-medium" style={{ background: t.accent, color: t.accentInk, borderRadius: t.radius, opacity: status === 'sending' ? 0.6 : 1 }}>
              {status === 'sending' ? ts('product.qaSending', 'Sending…') : ts('product.qaSend', 'Send question')}
            </button>
          </form>
        ))}
    </section>
  );
}
