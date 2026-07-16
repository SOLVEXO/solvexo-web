import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, HelpCircle } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAdminFaqs } from '@/hooks/admin/useAdminFaqs';
import { apiCreateFaq, apiUpdateFaq, apiToggleFaq, apiDeleteFaq, type Faq } from '@/api/services/faq';
import { Button } from '@/components/comman/ui/Button';
import { Modal } from '@/components/comman/ui/Modal';
import { Input, Textarea } from '@/components/comman/ui/Input';
import { Toggle } from '@/components/comman/ui/Toggle';
import { EmptyState } from '@/components/comman/ui/EmptyState';
import { SkeletonBox } from '@/components/comman/ui/SkeletonBox';

// ── Form modal ────────────────────────────────────────────────────────────────
function FaqFormModal({ faq, onClose, onSaved }: { faq: Faq | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!faq;
  const [question, setQuestion] = useState(faq?.question ?? '');
  const [answer, setAnswer]     = useState(faq?.answer ?? '');
  const [category, setCategory] = useState(faq?.category ?? 'general');
  const [order, setOrder]       = useState(String(faq?.order ?? 0));
  const [isActive, setIsActive] = useState(faq?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  async function submit() {
    if (!question.trim() || !answer.trim()) { setError('Question and answer are required.'); return; }
    setError('');
    setSaving(true);
    try {
      const payload = { question, answer, category: category || 'general', order: Number(order) || 0, isActive };
      if (isEdit) await apiUpdateFaq(faq._id, payload);
      else await apiCreateFaq(payload);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save FAQ.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit FAQ' : 'Add FAQ'}
      width={520}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>{isEdit ? 'Save Changes' : 'Add FAQ'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Question" placeholder="How do I reset my password?" value={question} onChange={e => setQuestion(e.target.value)} />
        <Textarea label="Answer" rows={4} placeholder="Explain the answer in detail…" value={answer} onChange={e => setAnswer(e.target.value)} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Category" placeholder="general" value={category} onChange={e => setCategory(e.target.value)} />
          <Input label="Display Order" type="number" min={0} value={order} onChange={e => setOrder(e.target.value)} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-charcoal">Active</span>
          <Toggle checked={isActive} onChange={setIsActive} />
        </div>
        {error && <p className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function AdminFaqs() {
  usePageTitle('FAQs');
  const { faqs, stats, loading, error, refetch } = useAdminFaqs();
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editing, setEditing] = useState<Faq | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Faq | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const categories = useMemo(() => Array.from(new Set(faqs.map(f => f.category))).sort(), [faqs]);
  const filtered = useMemo(
    () => categoryFilter ? faqs.filter(f => f.category === categoryFilter) : faqs,
    [faqs, categoryFilter],
  );

  async function handleToggle(faq: Faq) {
    setActionError('');
    try {
      await apiToggleFaq(faq._id);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to toggle FAQ.');
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setActionError('');
    try {
      await apiDeleteFaq(deleting._id);
      setDeleting(null);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete FAQ.');
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div>
      <div className="bg-white border-b border-bone px-7 py-[14px] sticky top-0 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold text-charcoal leading-[1.3]">FAQs</h1>
          <p className="text-[12px] text-slate mt-[2px]">{stats.active} active · {stats.inactive} inactive</p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setEditing('new')}>Add FAQ</Button>
      </div>

      <div className="px-7 pt-5 pb-8 flex flex-col gap-4">
        {actionError && (
          <div className="bg-error-bg border border-[#FECACA] rounded-lg px-4 py-2.5 text-[12.5px] text-error">
            {actionError}
          </div>
        )}
        <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-5 py-[14px] border-b border-bone flex items-center gap-[10px] flex-wrap">
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-bone text-[13px] bg-white outline-none cursor-pointer transition-[border-color,box-shadow] duration-150 hover:border-slate/40 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Question', 'Category', 'Order', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-[10px] text-[11px] font-semibold text-slate uppercase tracking-[0.05em] border-b border-bone bg-cream whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#F0EEE6]">
                      <td className="px-4 py-3" colSpan={5}><SkeletonBox className="h-5 w-full" /></td>
                    </tr>
                  ))
                ) : error ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-[13px] text-error">{error}</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5}>
                    <EmptyState icon={<HelpCircle size={28} className="text-slate" />} title="No FAQs found" />
                  </td></tr>
                ) : filtered.map(f => (
                  <tr key={f._id} className="border-b border-[#F0EEE6] transition-colors duration-150 hover:bg-cream">
                    <td className="px-4 py-3 text-[13px] text-charcoal max-w-[360px]">
                      <p className="font-semibold truncate">{f.question}</p>
                      <p className="text-[11px] text-slate truncate">{f.answer}</p>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-graphite capitalize whitespace-nowrap">{f.category}</td>
                    <td className="px-4 py-3 text-[13px] text-slate whitespace-nowrap">{f.order}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggle(f)} className="px-[10px] py-[3px] rounded-[5px] text-[11px] font-semibold border-none cursor-pointer outline-none transition-[filter] duration-150 hover:brightness-95 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-brand-orange/50"
                        style={{ background: f.isActive ? '#EAF7EF' : '#F0EEE6', color: f.isActive ? '#1E7A3C' : '#5A5852' }}>
                        {f.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditing(f)} className="text-[12px] font-medium text-[#1A72C2] bg-transparent border-none cursor-pointer flex items-center gap-1 outline-none rounded-sm focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-brand-orange/50">
                          <Pencil size={11} /> Edit
                        </button>
                        <span className="text-bone text-[13px]">|</span>
                        <button onClick={() => { setDeleting(f); setActionError(''); }} className="text-[12px] font-medium text-error bg-transparent border-none cursor-pointer flex items-center gap-1 outline-none rounded-sm focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-brand-orange/50">
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editing && (
        <FaqFormModal
          faq={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refetch(); }}
        />
      )}

      {deleting && (
        <Modal
          title="Delete FAQ"
          onClose={() => setDeleting(null)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} loading={deleteBusy}>Delete FAQ</Button>
            </>
          }
        >
          <p className="text-[13px] text-charcoal leading-[1.6]">
            Delete "<strong>{deleting.question}</strong>"? This cannot be undone.
          </p>
          {actionError && <p className="text-[12px] text-error mt-2">{actionError}</p>}
        </Modal>
      )}
    </div>
  );
}
