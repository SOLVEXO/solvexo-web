import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, HelpCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { EmptyState } from '@/components/comman/ui/EmptyState';
import { Button } from '@/components/comman/ui/Button';
import { SkeletonBox, Modal, Toggle } from '@/components/comman/ui';
import { BulkImportButton } from '@/components/comman/bulk-import/BulkImportButton';
import { ConfirmDialog } from '@/features/seller/store/Dashboard/OnlineStore/builder/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import { apiListStoreFaqs, apiCreateStoreFaq, apiUpdateStoreFaq, apiDeleteStoreFaq, type StoreFaq } from '@/api/services/storeFaq';

const INPUT = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange';

function FaqFormModal({ faq, onClose, onSave, saving }: {
  faq: StoreFaq | null; onClose: () => void; onSave: (v: { question: string; answer: string }) => void; saving: boolean;
}) {
  const [question, setQuestion] = useState(faq?.question ?? '');
  const [answer, setAnswer] = useState(faq?.answer ?? '');
  const valid = question.trim().length > 0 && answer.trim().length > 0;
  return (
    <Modal
      title={faq ? 'Edit FAQ' : 'Add FAQ'}
      onClose={onClose}
      mobileSheet
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => onSave({ question: question.trim(), answer: answer.trim() })} loading={saving} disabled={!valid}>{faq ? 'Save changes' : 'Add FAQ'}</Button></>}
    >
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-charcoal">Question</span>
          <input value={question} onChange={e => setQuestion(e.target.value)} maxLength={300} placeholder="Do you ship internationally?" className={INPUT} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-charcoal">Answer</span>
          <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={5} maxLength={3000} placeholder="Yes — we ship to most countries in 5–10 business days." className={`${INPUT} resize-y`} />
        </label>
      </div>
    </Modal>
  );
}

/** Store FAQs: the questions shown on the storefront `/faqs` page. Add, edit, reorder, hide, delete — or import a CSV. */
export default function StoreFaqs() {
  const { storeId } = useStoreWorkspace();
  const toast = useToast();
  const [rows, setRows] = useState<StoreFaq[] | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<StoreFaq | 'new' | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<StoreFaq | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setError('');
    setRows(null);
    apiListStoreFaqs(storeId)
      .then(res => setRows(res.data ?? []))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load FAQs.'));
  }, [storeId]);
  useEffect(() => { load(); }, [load]);

  async function save(values: { question: string; answer: string }) {
    setSaving(true);
    try {
      if (editing && editing !== 'new') await apiUpdateStoreFaq(storeId, editing._id, values);
      else await apiCreateStoreFaq(storeId, { ...values, order: rows?.length ?? 0, isActive: true });
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save this FAQ.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(f: StoreFaq) {
    setBusyId(f._id);
    try {
      await apiUpdateStoreFaq(storeId, f._id, { isActive: !f.isActive });
      setRows(prev => prev?.map(r => (r._id === f._id ? { ...r, isActive: !f.isActive } : r)) ?? prev);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update this FAQ.');
    } finally {
      setBusyId(null);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    if (!rows) return;
    const to = index + direction;
    if (to < 0 || to >= rows.length) return;
    const next = [...rows];
    [next[index], next[to]] = [next[to], next[index]];
    const renumbered = next.map((r, order) => ({ ...r, order }));
    setRows(renumbered);
    try {
      await Promise.all(renumbered.filter((r, i) => r.order !== rows.find(o => o._id === r._id)?.order || i === index || i === to)
        .map(r => apiUpdateStoreFaq(storeId, r._id, { order: r.order })));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save the new order.');
      load();
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusyId(pendingDelete._id);
    try {
      await apiDeleteStoreFaq(storeId, pendingDelete._id);
      setRows(prev => prev?.filter(r => r._id !== pendingDelete._id) ?? prev);
      setPendingDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete this FAQ.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <StorePageHeader
        title="FAQs"
        subtitle="Questions and answers shown on your storefront's FAQ page (yourstore/faqs)."
        actions={
          <div className="flex items-center gap-2">
            <BulkImportButton
              entityLabel="FAQs"
              basePath={`/api/store-faq/${storeId}`}
              onImported={load}
              notes={['A question that already exists (case-insensitive) is skipped, not duplicated.']}
            />
            <Button icon={<Plus size={14} />} onClick={() => setEditing('new')}>Add FAQ</Button>
          </div>
        }
      />
      <div className="px-4 md:px-7 py-5">
        {error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-[13px] text-slate">{error}</p>
            <Button onClick={load}>Retry</Button>
          </div>
        ) : rows === null ? (
          <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <SkeletonBox key={i} height={72} rounded="10px" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={<HelpCircle size={28} />} title="No FAQs yet" description="Add your first question, or import a CSV." action={{ label: 'Add FAQ', onClick: () => setEditing('new'), icon: <Plus size={14} /> }} />
        ) : (
          <ul className="flex flex-col gap-2 list-none p-0 m-0">
            {rows.map((f, i) => (
              <li key={f._id} className={`bg-white border border-bone rounded-[10px] p-3.5 flex items-start gap-3 ${f.isActive ? '' : 'opacity-60'}`}>
                <div className="flex flex-col shrink-0">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="p-1 text-slate bg-transparent border-0 cursor-pointer disabled:opacity-30"><ArrowUp size={14} /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Move down" className="p-1 text-slate bg-transparent border-0 cursor-pointer disabled:opacity-30"><ArrowDown size={14} /></button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-semibold text-charcoal m-0">{f.question}</p>
                  <p className="text-[12.5px] text-slate m-0 mt-1 line-clamp-2 whitespace-pre-line">{f.answer}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Toggle checked={f.isActive} onChange={() => toggleActive(f)} ariaLabel={f.isActive ? 'Hide this FAQ' : 'Show this FAQ'} />
                  <button type="button" onClick={() => setEditing(f)} aria-label="Edit FAQ" className="p-1.5 text-slate bg-transparent border-0 cursor-pointer"><Pencil size={14} /></button>
                  <button type="button" onClick={() => setPendingDelete(f)} disabled={busyId === f._id} aria-label="Delete FAQ" className="p-1.5 text-error bg-transparent border-0 cursor-pointer disabled:opacity-40"><Trash2 size={14} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && <FaqFormModal faq={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSave={save} saving={saving} />}
      {pendingDelete && (
        <ConfirmDialog
          title="Delete FAQ"
          message={`Delete "${pendingDelete.question}"? This cannot be undone.`}
          confirmLabel="Delete"
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}
