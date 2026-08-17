import { useState } from 'react';
import { Plus, FileText, Home, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Modal, Button, Field } from '@/components/comman/ui';
import type { StorePageData } from '@/api/services/storePages';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none';

function slugify(title: string) {
  return title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

export function PagesList({ pages, selectedId, onSelect, onCreate, onDelete, creating }: {
  pages: StorePageData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (title: string, slug: string) => Promise<void>;
  onDelete: (id: string) => void;
  creating: boolean;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');

  const home = pages.find(p => p.type === 'home');
  const custom = pages.filter(p => p.type === 'custom');

  const handleCreate = async () => {
    setError('');
    if (!title.trim() || !slug.trim()) { setError('Title and slug are required.'); return; }
    try {
      await onCreate(title.trim(), slug.trim());
      setShowCreate(false);
      setTitle(''); setSlug('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create page.');
    }
  };

  return (
    <div className="flex flex-col gap-1">
      {home && (
        <button onClick={() => onSelect(home._id)}
          className={clsx('flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium text-left border-none cursor-pointer', selectedId === home._id ? 'bg-brand-pale-orange text-brand-deep-orange' : 'bg-transparent text-charcoal hover:bg-cream')}>
          <Home size={14} /> Home
          <span className={clsx('ml-auto text-[10px] px-[6px] py-[1px] rounded-full', home.status === 'published' ? 'bg-success-bg text-success' : 'bg-bone text-slate')}>{home.status}</span>
        </button>
      )}
      {custom.map(page => (
        <div key={page._id} className={clsx('group flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium', selectedId === page._id ? 'bg-brand-pale-orange text-brand-deep-orange' : 'text-charcoal hover:bg-cream')}>
          <button onClick={() => onSelect(page._id)} className="flex-1 min-w-0 flex items-center gap-2 bg-transparent border-none cursor-pointer text-left p-0">
            <FileText size={14} className="shrink-0" /> <span className="truncate">{page.title}</span>
          </button>
          <span className={clsx('text-[10px] px-[6px] py-[1px] rounded-full shrink-0', page.status === 'published' ? 'bg-success-bg text-success' : 'bg-bone text-slate')}>{page.status}</span>
          <button onClick={() => onDelete(page._id)} aria-label={`Delete ${page.title}`} className="shrink-0 opacity-0 group-hover:opacity-100 text-error bg-transparent border-none cursor-pointer p-1"><Trash2 size={13} /></button>
        </div>
      ))}

      <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-semibold text-brand-orange bg-transparent border-none cursor-pointer hover:bg-brand-pale-orange/40">
        <Plus size={14} /> New Page
      </button>

      {showCreate && (
        <Modal title="New Page" onClose={() => setShowCreate(false)} footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} loading={creating}>Create Page</Button>
          </>
        }>
          <Field label="Title" required>
            <input className={inp} value={title} onChange={e => { setTitle(e.target.value); setSlug(slugify(e.target.value)); }} placeholder="About Us" />
          </Field>
          <Field label="URL slug" required hint="Will be served at yourstore/this-slug">
            <input className={inp} value={slug} onChange={e => setSlug(slugify(e.target.value))} placeholder="about-us" />
          </Field>
          {error && <p className="text-[12px] text-error mt-1">{error}</p>}
        </Modal>
      )}
    </div>
  );
}
