import { useState } from 'react';
import { Plus, FileText, Home, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Modal, Button, Field } from '@/components/comman/ui';
import type { StorePageData } from '@/api/services/storePages';
import type { Section } from '@/api/services/storefrontTypes';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none';

function slugify(title: string) {
  return title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

// A starter page is just a `rich_text` section with placeholder-but-real
// paragraph copy the seller edits in place (via the existing Pages section
// editor — no new backend surface). Every paragraph is deliberately written
// so it reads as obviously incomplete ("Replace this with…"), so a seller
// can never mistake it for a finished, ready-to-publish policy.
function policyTemplate(heading: string, paragraphs: string[]): Section[] {
  return [{
    type: 'rich_text',
    settings: { alignment: 'left' },
    blocks: [
      { type: 'heading', settings: { text: heading, level: 'h2' } },
      ...paragraphs.map(text => ({ type: 'paragraph', settings: { text } })),
    ],
  }];
}

interface PageTemplate { id: string; label: string; title: string; slug: string; sections: Section[] }

const PAGE_TEMPLATES: PageTemplate[] = [
  { id: 'blank', label: 'Blank', title: '', slug: '', sections: [] },
  {
    id: 'about', label: 'About Us', title: 'About Us', slug: 'about-us',
    sections: policyTemplate('About Us', [
      'Replace this with your own story — who you are, what you make or sell, and why buyers should trust your store.',
      'You can add more sections below (images, featured products, testimonials) to build this page out further.',
    ]),
  },
  {
    id: 'shipping', label: 'Shipping Policy', title: 'Shipping Policy', slug: 'shipping-policy',
    sections: policyTemplate('Shipping Policy', [
      'Replace this with your own shipping policy — which regions you ship to, how long delivery typically takes, and what shipping costs buyers can expect.',
      'List any carriers you use and how buyers can track their order once it ships.',
    ]),
  },
  {
    id: 'returns', label: 'Return Policy', title: 'Return Policy', slug: 'return-policy',
    sections: policyTemplate('Return Policy', [
      'Replace this with your own return policy — the window in which a buyer can request a return, which items are eligible, and who covers return shipping.',
      'Explain how refunds are issued once a return is received and approved.',
    ]),
  },
  {
    id: 'privacy', label: 'Privacy Policy', title: 'Privacy Policy', slug: 'privacy-policy',
    sections: policyTemplate('Privacy Policy', [
      'Replace this with your own privacy policy — what buyer information you collect, how it is used, and who it may be shared with.',
      'Consider consulting a template appropriate for your region\'s data-protection laws before publishing this page.',
    ]),
  },
  {
    id: 'terms', label: 'Terms & Conditions', title: 'Terms & Conditions', slug: 'terms-and-conditions',
    sections: policyTemplate('Terms & Conditions', [
      'Replace this with your own terms of sale — payment terms, order acceptance, pricing, and any conditions specific to your store.',
      'Consider consulting a template appropriate for your region\'s consumer-protection laws before publishing this page.',
    ]),
  },
];

export function PagesList({ pages, selectedId, onSelect, onCreate, onDelete, creating }: {
  pages: StorePageData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (title: string, slug: string, sections?: Section[]) => Promise<void>;
  onDelete: (id: string) => void;
  creating: boolean;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [templateId, setTemplateId] = useState('blank');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');

  const home = pages.find(p => p.type === 'home');
  const custom = pages.filter(p => p.type === 'custom');

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    const tpl = PAGE_TEMPLATES.find(t => t.id === id);
    if (tpl && tpl.id !== 'blank') { setTitle(tpl.title); setSlug(tpl.slug); }
  };

  const handleCreate = async () => {
    setError('');
    if (!title.trim() || !slug.trim()) { setError('Title and slug are required.'); return; }
    try {
      const tpl = PAGE_TEMPLATES.find(t => t.id === templateId);
      await onCreate(title.trim(), slug.trim(), tpl?.sections?.length ? tpl.sections : undefined);
      setShowCreate(false);
      setTitle(''); setSlug(''); setTemplateId('blank');
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
          <Field label="Start from a template">
            <div className="grid grid-cols-2 gap-2">
              {PAGE_TEMPLATES.map(tpl => (
                <button
                  key={tpl.id} type="button" onClick={() => applyTemplate(tpl.id)}
                  className={clsx('px-3 py-2 rounded-lg text-[12.5px] font-semibold text-left border cursor-pointer transition-colors',
                    templateId === tpl.id ? 'border-brand-orange bg-brand-pale-orange text-brand-deep-orange' : 'border-bone bg-white text-charcoal hover:bg-cream')}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Title" required>
            <input className={inp} value={title} onChange={e => { setTitle(e.target.value); setSlug(slugify(e.target.value)); }} placeholder="About Us" />
          </Field>
          <Field label="URL slug" required hint="Will be served at yourstore/this-slug">
            <input className={inp} value={slug} onChange={e => setSlug(slugify(e.target.value))} placeholder="about-us" />
          </Field>
          {templateId !== 'blank' && (
            <p className="text-[11.5px] text-slate -mt-1">This template includes placeholder text — review and edit the section content below before publishing.</p>
          )}
          {error && <p className="text-[12px] text-error mt-1">{error}</p>}
        </Modal>
      )}
    </div>
  );
}
