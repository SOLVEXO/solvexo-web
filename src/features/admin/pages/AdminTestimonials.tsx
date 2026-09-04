import { useState } from 'react';
import { Plus, Pencil, Trash2, Quote, Check, X, User, AlertTriangle } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAdminTestimonials } from '@/hooks/admin/useAdminTestimonials';
import {
  apiCreateTestimonial, apiUpdateTestimonial, apiToggleTestimonial, apiDeleteTestimonial,
  apiApproveTestimonial, apiRejectTestimonial,
  type AdminTestimonial,
} from '@/api/services/testimonials';
import { Button } from '@/components/comman/ui/Button';
import { Modal } from '@/components/comman/ui/Modal';
import { Input, Textarea } from '@/components/comman/ui/Input';
import { Toggle } from '@/components/comman/ui/Toggle';
import { Table, type TableColumn } from '@/components/comman/ui/Table';
import { StarRating } from '@/components/comman/ui/StarRating';
import { ActionMenu } from '@/components/comman/ui/ActionMenu';
import { FilterDropdown } from '@/components/comman/ui/FilterDropdown';

// ── Form modal ────────────────────────────────────────────────────────────────
// A seller-submitted testimonial (submittedBy: 'seller') is the seller's own
// authentic words about their own real experience — admin can curate WHETHER
// and WHERE it shows (Display Order, Published), but never silently rewrite
// their name/store/rating/quote. Only an admin-authored testimonial
// (submittedBy: 'admin', or a brand-new one) gets the full editable form.
function TestimonialFormModal({ testimonial, onClose, onSaved }: { testimonial: AdminTestimonial | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!testimonial;
  const isSellerSubmitted = testimonial?.submittedBy === 'seller';
  const [sellerName, setSellerName] = useState(testimonial?.sellerName ?? '');
  const [storeName, setStoreName]   = useState(testimonial?.storeName ?? '');
  const [rating, setRating]         = useState(testimonial?.rating ?? 5);
  const [text, setText]             = useState(testimonial?.text ?? '');
  const [order, setOrder]           = useState(String(testimonial?.order ?? 0));
  const [isVerifiedSeller, setIsVerifiedSeller] = useState(testimonial?.isVerifiedSeller ?? true);
  const [isActive, setIsActive]     = useState(testimonial?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  async function submit() {
    setError('');
    if (!isSellerSubmitted && (!sellerName.trim() || !text.trim())) {
      setError('Seller name and quote are required.');
      return;
    }
    setSaving(true);
    try {
      if (isSellerSubmitted && isEdit) {
        // Only curation fields can change for a seller's own submission —
        // their name/store/rating/quote are never sent back, so a future
        // edit to this function can't accidentally rewrite their words.
        await apiUpdateTestimonial(testimonial._id, { order: Number(order) || 0, isActive });
      } else if (isEdit) {
        await apiUpdateTestimonial(testimonial._id, {
          sellerName, text, rating,
          storeName: storeName.trim() || undefined,
          order: Number(order) || 0,
          isVerifiedSeller, isActive,
        });
      } else {
        await apiCreateTestimonial({
          sellerName, text, rating,
          storeName: storeName.trim() || undefined,
          order: Number(order) || 0,
          isVerifiedSeller, isActive,
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save testimonial.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal mobileSheet
      title={isEdit ? 'Edit Testimonial' : 'Add Testimonial'}
      width={520}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>{isEdit ? 'Save Changes' : 'Add Testimonial'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {isSellerSubmitted && (
          <div className="rounded-[10px] bg-cream border border-bone px-4 py-3.5">
            <p className="text-[11px] font-semibold text-slate uppercase tracking-[0.05em] mb-2">Submitted by seller — read only</p>
            <p className="text-[13px] font-semibold text-charcoal">{sellerName}{storeName ? ` · ${storeName}` : ''}</p>
            <StarRating value={rating} size={13} className="mt-1.5 mb-2" />
            <p className="text-[13px] text-charcoal italic leading-[1.6]">"{text}"</p>
          </div>
        )}
        {!isSellerSubmitted && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Seller Name" placeholder="Amina Raza" value={sellerName} onChange={e => setSellerName(e.target.value)} />
              <Input label="Store Name (optional)" placeholder="Amina Crafts" value={storeName} onChange={e => setStoreName(e.target.value)} />
            </div>
            <div>
              <p className="text-[12.5px] font-medium text-charcoal mb-1.5">Rating</p>
              <StarRating value={rating} onChange={setRating} size={20} />
            </div>
            <Textarea label="Quote" rows={4} placeholder="Solvexo made it so easy to launch my store…" value={text} onChange={e => setText(e.target.value)} />
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-charcoal">Verified Seller badge</span>
              <Toggle checked={isVerifiedSeller} onChange={setIsVerifiedSeller} />
            </div>
          </>
        )}
        <Input label="Display Order" type="number" min={0} value={order} onChange={e => setOrder(e.target.value)} />
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-charcoal">Published (visible on homepage)</span>
          <Toggle checked={isActive} onChange={setIsActive} />
        </div>
        {error && <p className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}

// A raw JSON.parse/network exception (SyntaxError IS an instanceof Error)
// used to leak straight to the admin as "Unexpected token 'n', "null" is
// not valid JSON" — technically accurate but meaningless to a human. Real
// API errors (BadRequestException etc.) are always readable prose; only
// those get shown verbatim, everything technical-looking falls back to a
// plain message instead.
function friendlyError(err: unknown, fallback: string): string {
  if (err instanceof Error && !/json|unexpected token|network ?error/i.test(err.message)) {
    return err.message;
  }
  return fallback;
}

// ── Pending seller submissions — approve/reject only, no retyping needed ──────
function PendingReviewList({ items, onChanged }: { items: AdminTestimonial[]; onChanged: () => void }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState('');

  async function handle(id: string, action: 'approve' | 'reject') {
    setBusyId(id); setBusyAction(action); setError('');
    try {
      // {} not null — see apiApproveTestimonial/apiRejectTestimonial's own
      // doc comment for why an empty-object body is the safe choice here.
      await (action === 'approve' ? apiApproveTestimonial(id) : apiRejectTestimonial(id));
      onChanged();
    } catch (err) {
      setError(friendlyError(err, `Failed to ${action} — please try again.`));
    } finally {
      setBusyId(null); setBusyAction(null);
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="rounded-[14px] overflow-hidden border border-[#F0DCB8] shadow-[0_1px_3px_rgba(154,106,23,0.08)]">
      <div className="px-4 sm:px-5 py-3.5 bg-gradient-to-r from-[#FDF3E7] to-[#FBEAD5] border-b border-[#F0DCB8] flex items-center gap-2.5">
        <span className="relative flex h-[7px] w-[7px] shrink-0">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[#C5891A] opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-[#C5891A]" />
        </span>
        <p className="text-[13px] font-bold" style={{ color: '#9A6A17' }}>
          Pending Review — {items.length} seller{items.length > 1 ? 's' : ''} submitted their own story
        </p>
      </div>
      {error && (
        <div className="px-4 sm:px-5 pt-3 flex items-start gap-1.5 text-[12px] text-error">
          <AlertTriangle size={13} className="shrink-0 mt-[1px]" />
          <span>{error}</span>
        </div>
      )}
      <div className="divide-y divide-[#f5f4ef] bg-white">
        {items.map(t => (
          <div key={t._id} className="px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 transition-colors hover:bg-cream/40">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-pale-orange to-cream border border-bone flex items-center justify-center shrink-0">
              <User size={15} className="text-brand-deep-orange" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-charcoal">{t.sellerName}{t.storeName ? ` · ${t.storeName}` : ''}</p>
              <StarRating value={t.rating} size={12} className="mt-[3px] mb-1.5" />
              <p className="text-[13px] text-charcoal italic leading-[1.6]">"{t.text}"</p>
            </div>
            <div className="flex gap-[6px] shrink-0">
              <Button
                size="xs" variant="outline" icon={<Check size={12} />}
                loading={busyId === t._id && busyAction === 'approve'}
                disabled={busyId === t._id && busyAction !== 'approve'}
                onClick={() => handle(t._id, 'approve')}
              >
                Approve
              </Button>
              <Button
                size="xs" variant="danger" icon={<X size={12} />}
                loading={busyId === t._id && busyAction === 'reject'}
                disabled={busyId === t._id && busyAction !== 'reject'}
                onClick={() => handle(t._id, 'reject')}
              >
                Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const STATUS_FILTER_OPTIONS = [
  { value: 'published', label: 'Published' },
  { value: 'hidden',    label: 'Hidden' },
];
const SOURCE_FILTER_OPTIONS = [
  { value: 'admin',  label: 'Added by Admin' },
  { value: 'seller', label: 'Submitted by Seller' },
];

export function AdminTestimonials() {
  usePageTitle('Testimonials');
  const { testimonials, stats, loading, error, refetch } = useAdminTestimonials();
  const pending = testimonials.filter(t => t.status === 'pending');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const filtered = testimonials
    .filter(t => t.status !== 'pending') // pending ones live only in the review list above, not the main table
    .filter(t => !statusFilter || (statusFilter === 'published' ? t.isActive : !t.isActive))
    .filter(t => !sourceFilter || (t.submittedBy ?? 'admin') === sourceFilter);
  const [editing, setEditing] = useState<AdminTestimonial | 'new' | null>(null);
  const [deleting, setDeleting] = useState<AdminTestimonial | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  async function handleToggle(testimonial: AdminTestimonial) {
    setActionError('');
    try {
      await apiToggleTestimonial(testimonial._id);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to toggle testimonial.');
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setActionError('');
    try {
      await apiDeleteTestimonial(deleting._id);
      setDeleting(null);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete testimonial.');
    } finally {
      setDeleteBusy(false);
    }
  }

  const columns: TableColumn<AdminTestimonial>[] = [
    {
      key: 'text', header: 'Testimonial',
      render: t => (
        <div className="max-w-[360px]">
          <p className="font-semibold truncate">{t.sellerName}{t.storeName ? ` · ${t.storeName}` : ''}</p>
          <p className="text-[11px] text-slate truncate">{t.text}</p>
        </div>
      ),
    },
    { key: 'rating', header: 'Rating', render: t => <StarRating value={t.rating} size={12} /> },
    { key: 'order', header: 'Order', render: t => <span className="text-slate whitespace-nowrap">{t.order}</span> },
    {
      key: 'source', header: 'Source',
      render: t => (
        <span
          className="px-[9px] py-[3px] rounded-[5px] text-[11px] font-semibold whitespace-nowrap"
          style={t.submittedBy === 'seller' ? { background: '#FDF3E7', color: '#9A6A17' } : { background: '#F0EEE6', color: '#5A5852' }}
        >
          {t.submittedBy === 'seller' ? 'Seller' : 'Admin'}
        </span>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: t => (
        <button onClick={() => handleToggle(t)} className="px-[10px] py-[3px] rounded-[5px] text-[11px] font-semibold border-none cursor-pointer outline-none transition-[filter] duration-150 hover:brightness-95 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-brand-orange/50"
          style={{ background: t.isActive ? '#EAF7EF' : '#F0EEE6', color: t.isActive ? '#1E7A3C' : '#5A5852' }}>
          {t.isActive ? 'Published' : 'Hidden'}
        </button>
      ),
    },
    {
      key: 'actions', header: 'Actions',
      render: t => (
        <ActionMenu
          ariaLabel={`Actions for ${t.sellerName}'s testimonial`}
          items={[
            { label: 'Edit', icon: <Pencil size={13} />, onClick: () => setEditing(t) },
            { label: 'Delete', icon: <Trash2 size={13} />, danger: true, onClick: () => { setDeleting(t); setActionError(''); } },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="bg-white border-b border-bone px-4 sm:px-7 py-[14px] sticky top-0 z-10 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-[18px] font-bold text-charcoal leading-[1.3]">Testimonials</h1>
          <p className="text-[12px] text-slate mt-[2px]">
            Seller reviews of Solvexo shown on the homepage — {stats.active} published · {stats.inactive} hidden
          </p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setEditing('new')} className="shrink-0">Add Testimonial</Button>
      </div>

      <div className="px-4 sm:px-7 pt-5 pb-8 flex flex-col gap-4">
        {actionError && (
          <div className="bg-error-bg border border-error-border rounded-lg px-4 py-2.5 text-[12.5px] text-error">
            {actionError}
          </div>
        )}
        <PendingReviewList items={pending} onChanged={refetch} />

        <div className="flex items-center gap-2 flex-wrap">
          <FilterDropdown placeholder="All Statuses" options={STATUS_FILTER_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
          <FilterDropdown placeholder="All Sources" options={SOURCE_FILTER_OPTIONS} value={sourceFilter} onChange={setSourceFilter} />
        </div>

        <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
          {error ? (
            <p className="px-4 py-6 text-center text-[13px] text-error">{error}</p>
          ) : (
            <Table
              columns={columns}
              data={filtered}
              keyExtractor={t => t._id}
              loading={loading}
              emptyState={{ icon: <Quote size={28} className="text-slate" />, title: 'No testimonials yet' }}
            />
          )}
        </div>
      </div>

      {editing && (
        <TestimonialFormModal
          testimonial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refetch(); }}
        />
      )}

      {deleting && (
        <Modal mobileSheet
          title="Delete Testimonial"
          onClose={() => setDeleting(null)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} loading={deleteBusy}>Delete Testimonial</Button>
            </>
          }
        >
          <p className="text-[13px] text-charcoal leading-[1.6]">
            Delete the testimonial from "<strong>{deleting.sellerName}</strong>"? This cannot be undone.
          </p>
          {actionError && <p className="text-[12px] text-error mt-2">{actionError}</p>}
        </Modal>
      )}
    </div>
  );
}
