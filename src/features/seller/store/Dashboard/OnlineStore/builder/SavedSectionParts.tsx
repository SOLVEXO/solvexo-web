import { useState, type ReactNode } from 'react';
import { Bookmark, Link2Off } from 'lucide-react';
import { Button, Modal } from '@/components/comman/ui';
import type { Section, SectionType } from '@/api/services/storefrontTypes';
import type { SavedSectionEntry } from '@/api/services/savedSections';
import { errorMessage } from '@/api/errorMessage';
import { SECTION_META_BY_TYPE } from './sectionRegistry';
import { ConfirmDialog } from './ConfirmDialog';
import type { SavedSectionLibrary } from './useSavedSectionLibrary';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none focus:border-brand-orange';

/** "Save to library": names the section, and offers to swap the page's copy for the shared one (so later edits apply everywhere). */
export function SaveToLibraryDialog({ defaultName, onSave, onClose }: {
  defaultName: string;
  onSave: (name: string, replaceHere: boolean) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(defaultName);
  const [replaceHere, setReplaceHere] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await onSave(name.trim(), replaceHere);
      onClose();
    } catch (e) {
      setError(errorMessage(e, 'Could not save this section'));
      setBusy(false);
    }
  };
  return (
    <Modal
      title="Save to library"
      onClose={onClose}
      width={440}
      footer={<><Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button><Button onClick={submit} loading={busy} disabled={!name.trim()}>Save section</Button></>}
    >
      <div className="flex flex-col gap-3">
        <p className="text-[12.5px] text-slate leading-relaxed">Keep this section in your library and use it on other pages. Change it once and every page that uses it changes.</p>
        <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-charcoal">
          Name
          <input className={inp} value={name} maxLength={60} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && name.trim() && !busy) void submit(); }} />
        </label>
        <label className="flex items-start gap-2 text-[12.5px] text-charcoal cursor-pointer">
          <input type="checkbox" className="mt-0.5" checked={replaceHere} onChange={e => setReplaceHere(e.target.checked)} />
          <span>Use the saved section on this page too <span className="text-slate">(so later changes show here as well)</span></span>
        </label>
        {error && <p role="alert" className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}

/** The body of a page's `saved_section` card: what it is, where it is used, Edit (the shared content) and Detach (a private copy). */
export function SavedSectionBody({ entry, library, onDetach, renderEditor, locked }: {
  entry: SavedSectionEntry | undefined;
  library: SavedSectionLibrary;
  /** Replace the reference on this page with a private copy of the content. */
  onDetach: (entry: SavedSectionEntry) => void;
  /** Renders the normal section editor for the library entry's draft content. */
  renderEditor: (draft: Section, setDraft: (next: Section) => void) => ReactNode;
  locked?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Section | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDetach, setConfirmDetach] = useState(false);

  if (!entry) {
    return (
      <div className="flex items-start gap-2 rounded-xl bg-error-bg px-3 py-2.5 text-[12.5px] text-error">
        <Link2Off size={15} className="mt-0.5 shrink-0" />
        <span>{library.loading && !library.loaded ? 'Loading the saved section…' : 'This saved section was deleted, so nothing is shown here. Remove this card, or add another saved section.'}</span>
      </div>
    );
  }

  const start = () => {
    setDraft({ type: entry.type, settings: entry.settings ?? {}, blocks: entry.blocks ?? [], colorSchemeId: entry.colorSchemeId, enabled: true });
    setName(entry.name);
    setError('');
    setEditing(true);
  };
  const save = async () => {
    if (!draft) return;
    setBusy(true);
    setError('');
    try {
      await library.update(entry._id, {
        name: name.trim() || entry.name,
        settings: draft.settings,
        blocks: draft.blocks.map(b => ({ type: b.type, settings: b.settings ?? {}, enabled: b.enabled, ...(b._id ? { _id: b._id } : {}) })),
        colorSchemeId: draft.colorSchemeId ?? null,
      });
      setEditing(false);
    } catch (e) {
      setError(errorMessage(e, 'Could not save the changes'));
    } finally {
      setBusy(false);
    }
  };

  const used = entry.usedOn ?? 0;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12.5px] text-slate leading-relaxed">
        <Bookmark size={12} className="inline -mt-0.5 mr-1" aria-hidden />
        This is a shared section{used > 0 ? `, used on ${used} page${used === 1 ? '' : 's'}` : ''}. Editing it here changes it everywhere it is used.
      </p>
      {!editing ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={start} disabled={locked}>Edit saved section</Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirmDetach(true)} disabled={locked}>Detach (make a copy on this page)</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-xl border border-brand-orange/30 bg-cream/40 p-3">
          <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-charcoal">
            Name in the library
            <input className={inp} value={name} maxLength={60} onChange={e => setName(e.target.value)} />
          </label>
          {draft && renderEditor(draft, setDraft)}
          {used > 1 && <p className="text-[12px] text-slate">Saving changes all {used} pages that use this section.</p>}
          {error && <p role="alert" className="text-[12px] text-error">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={save} loading={busy}>Save changes</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={busy}>Cancel</Button>
          </div>
        </div>
      )}
      {confirmDetach && (
        <ConfirmDialog
          title="Detach saved section"
          message="This page gets its own copy of the section. Changing it later will no longer change the saved one, and the saved one will no longer change this page."
          confirmLabel="Detach"
          confirmVariant="primary"
          onCancel={() => setConfirmDetach(false)}
          onConfirm={() => { setConfirmDetach(false); onDetach(entry); }}
        />
      )}
    </div>
  );
}

/** The "Saved sections" tab of the Add-section picker. */
export function SavedSectionsPicker({ library, supportedTypes, query, onPick }: {
  library: SavedSectionLibrary;
  supportedTypes?: SectionType[];
  query: string;
  onPick: (entry: SavedSectionEntry) => void;
}) {
  const q = query.trim().toLowerCase();
  const items = library.items.filter(e => (!supportedTypes || e.type === 'theme_section' || supportedTypes.includes(e.type)) && (!q || e.name.toLowerCase().includes(q)));
  if (library.loading && !library.loaded) return <p role="status" className="text-[13px] text-slate py-6 text-center">Loading your saved sections…</p>;
  if (library.error) {
    return (
      <div role="alert" className="flex flex-col items-center gap-2 py-6 text-center">
        <p className="text-[13px] text-error">{library.error}</p>
        <Button size="sm" variant="secondary" onClick={library.reload}>Try again</Button>
      </div>
    );
  }
  if (library.items.length === 0) {
    return (
      <p role="status" className="text-[13px] text-slate py-8 text-center max-w-[420px] mx-auto leading-relaxed">
        Nothing saved yet. Open the <strong>⋯</strong> menu on any section and choose <strong>Save to library</strong> to reuse it on other pages.
      </p>
    );
  }
  if (items.length === 0) return <p role="status" className="text-[13px] text-slate py-6 text-center">No saved sections match.</p>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(e => {
        const meta = SECTION_META_BY_TYPE[e.type];
        return (
          <button key={e._id} type="button" onClick={() => onPick(e)}
            className="flex items-start gap-3 p-3.5 rounded-xl border border-bone bg-white text-left cursor-pointer transition-colors hover:border-brand-orange/50">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${meta?.color ?? '#0D9488'}18` }}>
              {meta ? <meta.Icon size={18} style={{ color: meta.color }} /> : <Bookmark size={18} />}
            </div>
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold text-charcoal truncate">{e.name}</p>
              <p className="text-[11.5px] text-slate leading-snug mt-[2px]">{meta?.label ?? e.type}{(e.usedOn ?? 0) > 0 ? ` · used on ${e.usedOn} page${e.usedOn === 1 ? '' : 's'}` : ''}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
