import { useState } from 'react';
import { Plus, Eye, EyeOff, Copy } from 'lucide-react';
import { ImageUpload } from '@/components/comman/ui';
import type { StorefrontHeader, StorefrontFooter } from '@/api/services/storeTheme';
import type { Block } from '@/api/services/storefrontTypes';
import { BlockFields, type PageOption } from '../builder/BlockFields';
import { SortableList } from '../builder/Sortable';
import { ConfirmDialog } from '../builder/ConfirmDialog';
import { HeaderSettingsPanel, FooterSettingsPanel } from './HeaderFooterSettingsPanels';
import type { HeaderFooterDraftState } from './useHeaderFooterDraft';

const ADMIN_ACCENT = '#D97757';
const SELECT = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none';
const HEADING = 'text-[11px] font-semibold uppercase tracking-wide text-slate';

const FOOTER_BLOCK_OPTIONS: { type: string; label: string; defaults: Record<string, unknown> }[] = [
  { type: 'footer_column', label: 'Link column', defaults: { heading: '', links: [] } },
  { type: 'social_link', label: 'Social link', defaults: { platform: 'facebook', url: '' } },
  { type: 'copyright_text', label: 'Copyright text', defaults: { text: '' } },
  { type: 'footer_text', label: 'About text', defaults: { text: '' } },
  { type: 'footer_contact', label: 'Contact details', defaults: { heading: 'Contact', email: '', phone: '', address: '', hours: '' } },
  { type: 'footer_payment_icons', label: 'Payment methods', defaults: { icons: [] } },
];

/** Strips `_id` so a duplicated block is saved as a new one. */
function cloneBlockWithoutId<T extends { _id?: string }>(item: T): T {
  const { _id, ...rest } = item;
  void _id;
  return { ...rest } as T;
}

function BlockRow({ block, onChange, onRemove, onDuplicate, pageOptions, storeId }: {
  block: Block; onChange: (next: Block) => void; onRemove: () => void; onDuplicate: () => void;
  pageOptions: PageOption[]; storeId: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const label = block.settings.label || block.settings.heading || block.settings.platform || block.settings.text || block.type;
  const hidden = block.enabled === false;
  return (
    <div className={`border border-bone rounded-lg bg-white ${hidden ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-1.5 px-3 py-2">
        <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} className="flex-1 min-w-0 flex items-center gap-2 bg-transparent border-none cursor-pointer text-left p-0">
          <span className="text-[12.5px] font-medium text-charcoal truncate capitalize">{label || String(block.type).replace(/_/g, ' ')}</span>
          {hidden && <span className="text-[10px] font-bold uppercase tracking-wide text-slate shrink-0">Hidden</span>}
        </button>
        <button type="button" onClick={() => onChange({ ...block, enabled: hidden })} aria-label={hidden ? 'Show' : 'Hide'} title={hidden ? 'Show' : 'Hide'}
          className="text-slate p-1 hover:bg-cream rounded-md bg-transparent border-none cursor-pointer shrink-0">
          {hidden ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
        <button type="button" onClick={onDuplicate} aria-label="Duplicate" title="Duplicate"
          className="text-slate p-1 hover:bg-cream rounded-md bg-transparent border-none cursor-pointer shrink-0">
          <Copy size={13} />
        </button>
        <button type="button" onClick={() => setConfirming(true)} className="text-error text-[11px] font-semibold px-2 py-1 hover:bg-error-bg rounded-md bg-transparent border-none cursor-pointer shrink-0">Remove</button>
      </div>
      {open && <div className="px-3 pb-3 pt-1 border-t border-bone/70"><BlockFields type={block.type} settings={block.settings} onChange={settings => onChange({ ...block, settings })} pageOptions={pageOptions} storeId={storeId} /></div>}
      {confirming && (
        <ConfirmDialog title="Remove item" message={`Remove "${label}"? This cannot be undone.`} confirmLabel="Remove" onCancel={() => setConfirming(false)} onConfirm={() => { setConfirming(false); onRemove(); }} />
      )}
    </div>
  );
}

/** Header editor: logo, layout/icons/built-in links and the navigation links. */
export function HeaderEditor({ hf, storeId, onError }: { hf: HeaderFooterDraftState; storeId: string; onError: (msg: string) => void }) {
  const { headerDraft, footerDraft, editor, menus, pageOptions } = hf;
  if (!headerDraft || !footerDraft) return null;
  const setHeader = (header: StorefrontHeader) => editor.edit(prev => ({ ...prev!, header }));
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 pb-3 mb-1 border-b border-bone">
        <label htmlFor="hf-logo-source" className={HEADING}>Storefront logo</label>
        <select id="hf-logo-source" className={SELECT} value={headerDraft.logoSource ?? 'store'}
          onChange={e => setHeader({ ...headerDraft, logoSource: e.target.value as StorefrontHeader['logoSource'] })}>
          <option value="store">Use store logo</option>
          <option value="custom">Use a theme-specific logo</option>
        </select>
        {headerDraft.logoSource === 'custom' && (
          <ImageUpload value={headerDraft.customLogoUrl ? [headerDraft.customLogoUrl] : []} onChange={urls => setHeader({ ...headerDraft, customLogoUrl: urls[0] ?? null })} maxFiles={1} storeId={storeId} />
        )}
      </div>
      <HeaderSettingsPanel header={headerDraft} onChange={setHeader} />
      <div className="flex flex-col gap-1.5 pb-3 mb-1 border-b border-bone">
        <label htmlFor="hf-header-menu" className={HEADING}>Navigation source</label>
        <select id="hf-header-menu" className={SELECT} value={headerDraft.menuId ?? ''}
          onChange={e => setHeader({ ...headerDraft, menuId: e.target.value || null })}>
          <option value="">Custom Links (below)</option>
          {menus.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
        </select>
        <p className="text-[11px] text-slate">
          {headerDraft.menuId
            ? 'Your storefront uses this menu\'s items. The links below are kept as a fallback if you detach it.'
            : 'Manage reusable menus under Online Store → Menus, then pick one here.'}
        </p>
      </div>
      <p className={HEADING}>Navigation Links</p>
      <SortableList items={headerDraft.blocks} keyFor={(b, i) => b._id ?? `new-${i}`} onReorder={blocks => setHeader({ ...headerDraft, blocks })}>
        {(block, i) => (
          <BlockRow
            block={block}
            onChange={next => setHeader({ ...headerDraft, blocks: headerDraft.blocks.map((b, j) => j === i ? next : b) })}
            onRemove={() => void hf.persistRemoval({ header: { ...headerDraft, blocks: headerDraft.blocks.filter((_, j) => j !== i) }, footer: footerDraft }, onError)}
            onDuplicate={() => {
              const blocks = [...headerDraft.blocks];
              blocks.splice(i + 1, 0, cloneBlockWithoutId(block));
              setHeader({ ...headerDraft, blocks });
            }}
            pageOptions={pageOptions}
            storeId={storeId}
          />
        )}
      </SortableList>
      {headerDraft.blocks.length < 10 && (
        <button type="button" onClick={() => setHeader({ ...headerDraft, blocks: [...headerDraft.blocks, { type: 'nav_link', settings: { label: '', linkType: 'home' } }] })}
          className="text-[12px] font-semibold cursor-pointer bg-transparent border-none text-left flex items-center gap-1" style={{ color: ADMIN_ACCENT }}>
          <Plus size={13} /> Add nav link
        </button>
      )}
    </div>
  );
}

/** Footer editor: layout, menu column, logo/newsletter/built-in columns and the footer blocks. */
export function FooterEditor({ hf, storeId, onError }: { hf: HeaderFooterDraftState; storeId: string; onError: (msg: string) => void }) {
  const { headerDraft, footerDraft, editor, menus, pageOptions } = hf;
  if (!headerDraft || !footerDraft) return null;
  const setFooter = (footer: StorefrontFooter) => editor.edit(prev => ({ ...prev!, footer }));
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1.5 pb-3 mb-1 border-b border-bone">
        <label htmlFor="hf-footer-layout" className={HEADING}>Footer layout</label>
        <select id="hf-footer-layout" className={SELECT} value={footerDraft.footerStyle ?? 'columns'}
          onChange={e => setFooter({ ...footerDraft, footerStyle: e.target.value as StorefrontFooter['footerStyle'] })}>
          <option value="columns">Columns</option>
          <option value="minimal">Compact</option>
        </select>
        <p className="text-[11px] text-slate">Compact keeps your content and links, with a tighter two-column layout.</p>
      </div>
      <div className="flex flex-col gap-1.5 pb-3 mb-1 border-b border-bone">
        <label htmlFor="hf-footer-menu" className={HEADING}>Quick Links menu</label>
        <select id="hf-footer-menu" className={SELECT} value={footerDraft.menuId ?? ''}
          onChange={e => setFooter({ ...footerDraft, menuId: e.target.value || null })}>
          <option value="">None — use the link columns below only</option>
          {menus.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
        </select>
        <p className="text-[11px] text-slate">
          {footerDraft.menuId
            ? 'This menu appears as one extra link column, alongside the columns below.'
            : 'Manage reusable menus under Online Store → Menus, then pick one here to add it as a footer column.'}
        </p>
      </div>
      <FooterSettingsPanel footer={footerDraft} storeId={storeId} onChange={setFooter} />
      <p className={HEADING}>Footer Content</p>
      {footerDraft.blocks.length === 0 && (
        <p className="text-[12.5px] text-slate leading-relaxed bg-white border border-bone rounded-lg px-3 py-2.5 mb-1">
          Your footer is empty — add a link column, social links, or a copyright line.
        </p>
      )}
      <SortableList items={footerDraft.blocks} keyFor={(b, i) => b._id ?? `new-${i}`} onReorder={blocks => setFooter({ ...footerDraft, blocks })}>
        {(block, i) => (
          <BlockRow
            block={block}
            onChange={next => setFooter({ ...footerDraft, blocks: footerDraft.blocks.map((b, j) => j === i ? next : b) })}
            onRemove={() => void hf.persistRemoval({ header: headerDraft, footer: { ...footerDraft, blocks: footerDraft.blocks.filter((_, j) => j !== i) } }, onError)}
            onDuplicate={() => {
              const blocks = [...footerDraft.blocks];
              blocks.splice(i + 1, 0, cloneBlockWithoutId(block));
              setFooter({ ...footerDraft, blocks });
            }}
            pageOptions={pageOptions}
            storeId={storeId}
          />
        )}
      </SortableList>
      <div className="flex items-center gap-3 flex-wrap">
        {FOOTER_BLOCK_OPTIONS.map(opt => (
          <button key={opt.type} type="button"
            onClick={() => setFooter({ ...footerDraft, blocks: [...footerDraft.blocks, { type: opt.type, settings: { ...opt.defaults } }] })}
            className="text-[12px] font-semibold cursor-pointer bg-transparent border-none text-left flex items-center gap-1" style={{ color: ADMIN_ACCENT }}>
            <Plus size={13} /> {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
