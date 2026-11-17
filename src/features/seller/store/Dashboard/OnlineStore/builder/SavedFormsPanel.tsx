import { useEffect, useState } from 'react';
import { BookmarkPlus, Trash2 } from 'lucide-react';
import { apiDeleteSavedForm, apiListSavedForms, apiSaveForm, type SavedForm } from '@/api/services/storeContact';
import { useToast } from '@/contexts/ToastContext';

const inp = 'w-full px-2.5 py-1.5 text-[12px] border border-bone rounded-md text-charcoal bg-white outline-none focus:border-brand-orange';
const btn = 'rounded-md border border-bone bg-white px-2.5 py-1 text-[12px] text-charcoal cursor-pointer disabled:opacity-50';

/** Library of the store's saved forms: save this form once, drop it on any other page. */
export function SavedFormsPanel({ storeId, settings, set }: { storeId: string; settings: Record<string, any>; set: (patch: Record<string, any>) => void }) {
  const toast = useToast();
  const [forms, setForms] = useState<SavedForm[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<SavedForm | null>(null);

  useEffect(() => {
    if (!open || forms || loadError) return;
    let cancelled = false;
    apiListSavedForms(storeId)
      .then(res => { if (!cancelled) setForms(res.data); })
      .catch(err => { if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Could not load your saved forms.'); });
    return () => { cancelled = true; };
  }, [open, forms, loadError, storeId]);

  async function save() {
    setBusy(true);
    try {
      const res = await apiSaveForm(storeId, name.trim(), settings);
      setForms(f => [...(f ?? []), res.data].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
      toast.success('Form saved. You can use it on any page.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'The form could not be saved.');
    } finally { setBusy(false); }
  }

  async function remove(f: SavedForm) {
    setBusy(true);
    try {
      await apiDeleteSavedForm(storeId, f._id);
      setForms(list => (list ?? []).filter(x => x._id !== f._id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'The form could not be deleted.');
    } finally { setBusy(false); }
  }

  const hasFields = Array.isArray(settings.fields) && settings.fields.length > 0;
  return (
    <div className="rounded-lg border border-bone bg-cream/40">
      <button type="button" aria-expanded={open} onClick={() => setOpen(o => !o)} className="flex w-full items-center justify-between border-0 bg-transparent px-3 py-2 text-left text-[12px] font-semibold text-charcoal cursor-pointer">
        <span className="inline-flex items-center gap-1.5"><BookmarkPlus size={13} aria-hidden /> Saved forms</span>
        <span className="text-slate">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-2 border-t border-bone px-3 py-2.5">
          {loadError && (
            <p role="alert" className="m-0 text-[12px] text-error">
              {loadError}{' '}
              <button type="button" className="cursor-pointer border-0 bg-transparent p-0 text-error underline" onClick={() => { setLoadError(''); setForms(null); }}>Retry</button>
            </p>
          )}
          {!forms && !loadError && <p className="m-0 text-[12px] text-slate">Loading…</p>}
          {forms && forms.length === 0 && <p className="m-0 text-[12px] text-slate">No saved forms yet. Save this one to reuse it on other pages.</p>}
          {forms && forms.map(f => (
            <div key={f._id} className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-[12px] text-charcoal">{f.name}</span>
              <span className="flex shrink-0 gap-1.5">
                <button type="button" className={btn} disabled={busy} onClick={() => (hasFields ? setPending(f) : set(f.settings))}>Use</button>
                <button type="button" className={btn} disabled={busy} aria-label={`Delete saved form ${f.name}`} onClick={() => void remove(f)}><Trash2 size={12} /></button>
              </span>
            </div>
          ))}
          {pending && (
            <div role="alertdialog" aria-label="Replace this form" className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-bone bg-white px-2.5 py-2">
              <span className="text-[12px] text-charcoal">Replace the fields and settings of this form with &quot;{pending.name}&quot;?</span>
              <span className="flex gap-1.5">
                <button type="button" className={btn} onClick={() => setPending(null)}>Keep mine</button>
                <button type="button" className={btn} onClick={() => { set(pending.settings); setPending(null); }}>Replace</button>
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 border-t border-bone pt-2">
            <input className={inp} aria-label="Name for this saved form" placeholder="Name, e.g. Wholesale request" maxLength={60} value={name} onChange={e => setName(e.target.value)} />
            <button type="button" className={btn} disabled={busy || !name.trim() || !hasFields} onClick={() => void save()}>Save this form</button>
          </div>
        </div>
      )}
    </div>
  );
}
