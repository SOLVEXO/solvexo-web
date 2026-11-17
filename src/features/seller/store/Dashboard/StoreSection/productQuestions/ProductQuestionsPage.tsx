import { useCallback, useEffect, useState } from 'react';
import { Lock, MessageCircleQuestion } from 'lucide-react';
import { errorMessage } from '@/api/errorMessage';
import type { StaffPermission } from '@/api/services/staff';
import { can } from '@/hooks/auth/useCan';
import { useToast } from '@/contexts/ToastContext';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { Button, Card, EmptyState, TabBar } from '@/components/comman/ui';
import { apiAnswerQuestion, apiDeleteQuestion, apiListQuestions, apiSetQuestionStatus, type SellerQuestion, type SellerQuestionList } from '@/api/services/productQuestions';

const shortDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

/** Questions shoppers asked on product pages: answer them (an answer publishes the question), hide, or delete. */
export default function ProductQuestionsPage() {
  const { storeId } = useStoreWorkspace();
  const toast = useToast();
  const [tab, setTab] = useState('pending');
  const [data, setData] = useState<SellerQuestionList | null>(null);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const allowed = can('products.view' as StaffPermission);
  const canEdit = can('products.edit' as StaffPermission);

  const load = useCallback(async () => {
    try {
      const r = await apiListQuestions(storeId, { status: tab === 'all' ? undefined : tab });
      setData(r);
      setError('');
    } catch (e) { setError(errorMessage(e)); }
  }, [storeId, tab]);
  // loading on mount / tab change is the point of this effect
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (allowed) void load(); }, [allowed, load]);

  async function act(id: string, fn: () => Promise<unknown>, done: string) {
    setBusy(id);
    try { await fn(); toast.success(done); await load(); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(null); }
  }

  const pendingLabel = data && data.pending > 0 ? `Waiting (${data.pending})` : 'Waiting';
  return (
    <>
      <StorePageHeader title="Product questions" subtitle="Questions from shoppers on your product pages" />
      <div className="flex w-full flex-col gap-4 px-4 pb-8 pt-5 lg:px-7">
        {!allowed ? <EmptyState icon={<Lock size={22} />} title="No access" description="Your role cannot see product questions." /> : (
          <>
            <TabBar tabs={[{ id: 'pending', label: pendingLabel }, { id: 'published', label: 'Shown on site' }, { id: 'hidden', label: 'Hidden' }, { id: 'all', label: 'All' }]} active={tab} onChange={setTab} />
            {error && <p role="alert" className="m-0 text-[13px] text-error">{error} <button type="button" className="underline" onClick={() => void load()}>Try again</button></p>}
            {!error && data && data.items.length === 0 && <EmptyState icon={<MessageCircleQuestion size={22} />} title="No questions here" description="When a shopper asks a question on a product page it will show up here. Add the Questions & answers block to your product page to let them ask." />}
            {(data?.items ?? []).map((q: SellerQuestion) => (
              <Card key={q.id} padding="md">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="m-0 text-[13px] text-slate">{q.productName || 'Deleted product'} · {q.askerName}{q.askerEmail ? ` · ${q.askerEmail}` : ''} · {shortDate(q.askedAt)}</p>
                  <span className="text-[12px] text-slate">{q.status === 'published' ? 'Shown on site' : q.status === 'hidden' ? 'Hidden' : 'Waiting for your answer'}</span>
                </div>
                <p className="mb-2 mt-2 text-[14px] font-medium">{q.question}</p>
                {canEdit ? (
                  <>
                    <textarea aria-label={`Answer to: ${q.question}`} rows={3} maxLength={1500} placeholder="Write your answer" className="w-full rounded-lg border border-bone px-3 py-2 text-[13px]"
                      value={drafts[q.id] ?? q.answer} onChange={(e) => setDrafts({ ...drafts, [q.id]: e.target.value })} />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button size="xs" loading={busy === q.id} onClick={() => void act(q.id, () => apiAnswerQuestion(storeId, q.id, { answer: drafts[q.id] ?? q.answer }), 'Answer saved and shown on the product page')}>{q.status === 'published' ? 'Update answer' : 'Answer and show'}</Button>
                      {q.status === 'published' && <Button size="xs" variant="outline" disabled={busy === q.id} onClick={() => void act(q.id, () => apiSetQuestionStatus(storeId, q.id, 'hidden'), 'Hidden from the product page')}>Hide</Button>}
                      {q.status === 'hidden' && q.answer && <Button size="xs" variant="outline" disabled={busy === q.id} onClick={() => void act(q.id, () => apiSetQuestionStatus(storeId, q.id, 'published'), 'Shown on the product page')}>Show again</Button>}
                      <Button size="xs" variant="outline" disabled={busy === q.id} onClick={() => { if (window.confirm('Delete this question?')) void act(q.id, () => apiDeleteQuestion(storeId, q.id), 'Deleted'); }}>Delete</Button>
                    </div>
                  </>
                ) : q.answer && <p className="m-0 text-[13px] text-slate">{q.answer}</p>}
              </Card>
            ))}
          </>
        )}
      </div>
    </>
  );
}
