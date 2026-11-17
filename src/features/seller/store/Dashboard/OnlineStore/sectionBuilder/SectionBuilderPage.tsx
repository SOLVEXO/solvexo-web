import { useState } from 'react';
import { Boxes, Pencil, Plus, Trash2 } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { Button, EmptyState, Modal, SkeletonBox } from '@/components/comman/ui';
import { useToast } from '@/contexts/ToastContext';
import { errorMessage } from '@/api/errorMessage';
import {
  apiCreateStoreSectionDef, apiDeleteStoreSectionDef, apiListStoreSectionDefs, apiUpdateStoreSectionDef,
  type LayoutNode, type StoreSectionDef, type StoreSectionDefInput,
} from '@/api/services/storeSectionDefs';
import { invalidateStoreSectionDefs } from '@/features/storefront-themes/storeSections/useStoreSectionDefs';
import { useKeyedLoad } from '@/components/comman/dashboard/useKeyedLoad';
import { ConfirmDialog } from '../builder/ConfirmDialog';
import { SectionDesigner } from './SectionDesigner';
import { STARTERS } from './layoutTree';

type View = { mode: 'list' } | { mode: 'pick' } | { mode: 'new'; layout: LayoutNode } | { mode: 'edit'; def: StoreSectionDef };

/** "Section builder": design your own sections without code (a layout of headings, text, images, buttons and repeating cards), then add them to any page like any other section. */
export function SectionBuilderPage() {
  const { storeId } = useStoreWorkspace();
  const toast = useToast();
  const { data, error, loading, retry } = useKeyedLoad(() => apiListStoreSectionDefs(storeId).then(r => r.data), storeId);
  const [view, setView] = useState<View>({ mode: 'list' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleting, setDeleting] = useState<StoreSectionDef | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [discard, setDiscard] = useState(false);

  const back = () => { setView({ mode: 'list' }); setSaveError(''); setDiscard(false); };

  const save = async (input: StoreSectionDefInput) => {
    setSaving(true);
    setSaveError('');
    try {
      if (view.mode === 'edit') await apiUpdateStoreSectionDef(storeId, view.def._id, input);
      else await apiCreateStoreSectionDef(storeId, input);
      invalidateStoreSectionDefs(storeId);
      retry();
      toast.success(view.mode === 'edit' ? 'Section saved' : 'Section created. Add it to a page from "Add section".');
      back();
    } catch (e) {
      setSaveError(errorMessage(e, 'Could not save this section'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await apiDeleteStoreSectionDef(storeId, deleting._id);
      invalidateStoreSectionDefs(storeId);
      retry();
      toast.success('Section deleted');
      setDeleting(null);
    } catch (e) {
      toast.error(errorMessage(e, 'Could not delete this section'));
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  const designing = view.mode === 'new' || view.mode === 'edit';

  return (
    <>
      <StorePageHeader
        title="Section builder"
        subtitle="Design your own sections without any code, then add them to any page."
        actions={!designing ? <Button variant="primary" icon={<Plus size={14} />} onClick={() => setView({ mode: 'pick' })}>New section</Button> : undefined}
      />
      <div className="px-4 md:px-7 py-5 pb-10">
        {designing ? (
          <SectionDesigner
            key={view.mode === 'edit' ? view.def._id : 'new'}
            value={view.mode === 'edit' ? { name: view.def.name, description: view.def.description, layout: view.def.layout } : { name: '', description: '', layout: view.layout }}
            usedOn={view.mode === 'edit' ? view.def.usedOn : 0}
            saving={saving}
            error={saveError}
            onSave={save}
            onCancel={() => setDiscard(true)}
          />
        ) : error ? (
          <div role="alert" className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-[13px] text-slate">{error}</p>
            <Button onClick={retry}>Try again</Button>
          </div>
        ) : loading ? (
          <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <SkeletonBox key={i} height={64} rounded="10px" />)}</div>
        ) : (data ?? []).length === 0 ? (
          <EmptyState
            icon={<Boxes size={28} />}
            title="No sections of your own yet"
            description="Start from a ready layout (cards, pricing, image + text...) and change it, or build one from scratch. Then add it to any page like any other section."
            action={{ label: 'New section', icon: <Plus size={14} />, onClick: () => setView({ mode: 'pick' }) }}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {(data ?? []).map(def => (
              <div key={def._id} className="flex flex-col gap-3 rounded-2xl border border-bone bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${def.color ?? '#0D9488'}18` }}>
                    <Boxes size={18} style={{ color: def.color ?? '#0D9488' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-charcoal truncate">{def.name}</p>
                    <p className="text-[12px] text-slate leading-snug">{def.description || 'Your own section'}</p>
                  </div>
                </div>
                <p className="text-[12px] text-slate">
                  {(def.usedOn ?? 0) > 0 ? `Used on ${def.usedOn} page${def.usedOn === 1 ? '' : 's'}` : 'Not used on any page yet'}
                  {' · '}{def.fields.length + (def.block?.fields.length ?? 0)} field{def.fields.length + (def.block?.fields.length ?? 0) === 1 ? '' : 's'}
                </p>
                <div className="flex gap-2 mt-auto">
                  <Button size="sm" variant="secondary" icon={<Pencil size={13} />} onClick={() => setView({ mode: 'edit', def })}>Edit</Button>
                  <Button size="sm" variant="ghost" icon={<Trash2 size={13} />} onClick={() => setDeleting(def)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {view.mode === 'pick' && (
        <Modal title="Start from" width={760} onClose={back}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {STARTERS.map(s => (
              <button key={s.id} type="button" onClick={() => setView({ mode: 'new', layout: s.layout })}
                className="flex flex-col gap-1 p-3.5 rounded-xl border border-bone bg-white text-left cursor-pointer transition-colors hover:border-brand-orange/50">
                <span className="text-[13.5px] font-bold text-charcoal">{s.name}</span>
                <span className="text-[11.5px] text-slate leading-snug">{s.description}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete section"
          message={`Delete "${deleting.name}"? ${(deleting.usedOn ?? 0) > 0 ? `It is used on ${deleting.usedOn} page${deleting.usedOn === 1 ? '' : 's'}: remove it from them first.` : 'This cannot be undone.'}`}
          confirmLabel="Delete"
          loading={deleteBusy}
          onCancel={() => setDeleting(null)}
          onConfirm={remove}
        />
      )}
      {discard && (
        <ConfirmDialog
          title="Leave without saving?"
          message="Your changes to this section will be lost."
          confirmLabel="Leave"
          onCancel={() => setDiscard(false)}
          onConfirm={back}
        />
      )}
    </>
  );
}
