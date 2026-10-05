import { useState } from 'react';
import { ChevronDown, Pencil, AlertCircle, CheckCircle2, Archive, FileEdit, Tag, Trash2 } from 'lucide-react';
import { ActionMenu, Button, Modal, TagInput } from '@/components/comman/ui';
import { useToast } from '@/contexts/ToastContext';
import {
  apiBulkSetStatus, apiBulkUpdateTags, apiBulkDeleteProducts,
  type BulkProductStatus, type BulkTarget,
} from '@/api/services/productsBulk';

export const MAX_BULK_TAGS = 20;
export const MAX_TAG_LENGTH = 40;

const plural = (n: number) => `${n} product${n === 1 ? '' : 's'}`;
const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

/** trim, cap length, dedupe (case-insensitive), cap count. */
function cleanTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const t = raw.trim().slice(0, MAX_TAG_LENGTH);
    const k = t.toLowerCase();
    if (!t || seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out.slice(0, MAX_BULK_TAGS);
}

interface Props {
  storeId:    string;
  /** How many products the action will touch (selection size, or total matching in "select all" mode). */
  count:      number;
  target:     BulkTarget;
  canEdit:    boolean;
  canDelete:  boolean;
  /** Opens the spreadsheet editor; may reject (e.g. fetching the ids failed) — shown inline. */
  onEditProducts: () => Promise<void>;
  onClear:    () => void;
  /** Called after any successful bulk change (clear selection + refetch). */
  onDone:     () => void;
}

export function BulkActionsBar({ storeId, count, target, canEdit, canDelete, onEditProducts, onClear, onDone }: Props) {
  const toast = useToast();
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState('');
  const [tagMode, setTagMode] = useState<'add' | 'remove' | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const setStatus = async (status: BulkProductStatus, label: string) => {
    setBusy(true); setError('');
    try {
      const res = await apiBulkSetStatus(storeId, status, target);
      toast.success(`${plural(res.data.modified)} ${label}`);
      onDone();
    } catch (e) {
      setError(errMsg(e, 'Failed to update products.'));
    } finally {
      setBusy(false);
    }
  };

  const openEdit = async () => {
    setBusy(true); setError('');
    try { await onEditProducts(); }
    catch (e) { setError(errMsg(e, 'Failed to open the editor.')); }
    finally { setBusy(false); }
  };

  const closeTagModal = () => { if (!busy) { setTagMode(null); setTags([]); setError(''); } };

  const submitTags = async () => {
    if (!tagMode) return;
    const clean = cleanTags(tags);
    if (clean.length === 0) { setError('Add at least one tag.'); return; }
    setBusy(true); setError('');
    try {
      const res = await apiBulkUpdateTags(storeId, tagMode === 'add' ? { add: clean } : { remove: clean }, target);
      toast.success(`Tags ${tagMode === 'add' ? 'added to' : 'removed from'} ${plural(res.data.modified)}`);
      setTagMode(null); setTags([]);
      onDone();
    } catch (e) {
      setError(errMsg(e, 'Failed to update tags.'));
    } finally {
      setBusy(false);
    }
  };

  const submitDelete = async () => {
    setBusy(true); setError('');
    try {
      const res = await apiBulkDeleteProducts(storeId, target);
      toast.success(`${plural(res.data.modified)} deleted`);
      setConfirmDelete(false);
      onDone();
    } catch (e) {
      setError(errMsg(e, 'Failed to delete products.'));
    } finally {
      setBusy(false);
    }
  };

  const menuItems = [
    ...(canEdit ? [
      { label: 'Set as active',   icon: <CheckCircle2 size={13} />, onClick: () => { void setStatus('active', 'set to active'); } },
      { label: 'Set as draft',    icon: <FileEdit size={13} />,     onClick: () => { void setStatus('draft', 'set to draft'); } },
      { label: 'Archive',         icon: <Archive size={13} />,      onClick: () => { void setStatus('inactive', 'archived'); } },
      { label: 'Add tags',        icon: <Tag size={13} />,          onClick: () => { setError(''); setTags([]); setTagMode('add'); } },
      { label: 'Remove tags',     icon: <Tag size={13} />,          onClick: () => { setError(''); setTags([]); setTagMode('remove'); } },
    ] : []),
    ...(canDelete ? [
      { label: 'Delete products', icon: <Trash2 size={13} />, danger: true, onClick: () => { setError(''); setConfirmDelete(true); } },
    ] : []),
  ];

  return (
    <>
      <div className="px-5 py-2.5 border-y border-bone bg-brand-pale-orange/40 flex flex-wrap items-center gap-3" role="region" aria-label="Bulk actions">
        <span className="text-[12px] font-medium text-charcoal">{count.toLocaleString()} selected</span>
        <button
          type="button"
          onClick={onClear}
          disabled={busy}
          className="text-[12px] text-slate underline cursor-pointer bg-transparent border-0 p-0 disabled:opacity-60"
        >
          Clear
        </button>
        <div className="flex items-center gap-2 ml-auto">
          {canEdit && (
            <Button variant="outline" size="sm" icon={<Pencil size={13} />} onClick={() => { void openEdit(); }} loading={busy && !tagMode && !confirmDelete}>
              Edit products
            </Button>
          )}
          {menuItems.length > 0 && (
            <ActionMenu
              align="right"
              items={menuItems}
              ariaLabel="Bulk actions"
              trigger={<span className="inline-flex items-center gap-1 text-[13px] font-medium text-carbon px-2">Bulk actions <ChevronDown size={13} /></span>}
              triggerClassName="border border-bone bg-white rounded-lg h-8"
            />
          )}
        </div>
        {error && !tagMode && !confirmDelete && (
          <p className="basis-full flex items-center gap-1.5 text-[12px] text-error" role="alert">
            <AlertCircle size={13} className="shrink-0" /> {error}
          </p>
        )}
      </div>

      {tagMode && (
        <Modal
          title={tagMode === 'add' ? `Add tags to ${plural(count)}` : `Remove tags from ${plural(count)}`}
          onClose={closeTagModal}
          footer={
            <>
              <Button variant="ghost" onClick={closeTagModal} disabled={busy}>Cancel</Button>
              <Button variant="primary" onClick={() => { void submitTags(); }} loading={busy}>
                {tagMode === 'add' ? 'Add tags' : 'Remove tags'}
              </Button>
            </>
          }
        >
          <p className="text-[13px] text-slate mb-3">
            Type a tag and press Enter or comma. Up to {MAX_BULK_TAGS} tags, {MAX_TAG_LENGTH} characters each.
          </p>
          <TagInput tags={tags} onChange={t => setTags(cleanTags(t))} max={MAX_BULK_TAGS} placeholder="Add tag, press Enter" />
          {error && <p className="text-[12px] text-error mt-3" role="alert">{error}</p>}
        </Modal>
      )}

      {confirmDelete && (
        <Modal
          title={`Delete ${plural(count)}?`}
          onClose={() => { if (!busy) setConfirmDelete(false); }}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={busy}>Cancel</Button>
              <Button variant="danger" onClick={() => { void submitDelete(); }} loading={busy}>Delete</Button>
            </>
          }
        >
          <p className="text-[13px] text-slate">Delete {plural(count)}? This can't be undone.</p>
          {error && <p className="text-[12px] text-error mt-3" role="alert">{error}</p>}
        </Modal>
      )}
    </>
  );
}
