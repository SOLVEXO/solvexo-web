import { useState } from 'react';
import { Plus, Eye, EyeOff, Copy } from 'lucide-react';
import { ImageUpload } from '@/components/comman/ui';
import type { StorefrontHeader, StorefrontFooter } from '@/api/services/storeTheme';
import type { Block } from '@/api/services/storefrontTypes';
import { BlockFields, type PageOption } from '../builder/BlockFields';
import { SortableList } from '../builder/Sortable';
import { PageSectionsEditor } from '../builder/PageSectionsEditor';
import type { Section, SectionType } from '@/api/services/storefrontTypes';
import { ConfirmDialog } from '../builder/ConfirmDialog';
import { HeaderSettingsPanel, FooterSettingsPanel, Group } from './HeaderFooterSettingsPanels';
import { footerLayoutBlocks } from '@/features/storefront-themes/navigation/headerOptions';
import type { HeaderFooterDraftState } from './useHeaderFooterDraft';
import type { HeaderOptionKey } from '@/features/storefront-themes/themeManifest';

const ADMIN_ACCENT = '#D97757';
const SELECT = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none';
const FOOTER_BLOCK_OPTIONS: { type: string; label: string; hint: string; defaults: Record<string, unknown> }[] = [
  { type: 'footer_column', label: 'Link column', hint: 'A heading with a list of links', defaults: { heading: 'Quick links', links: [] } },
  { type: 'footer_brand', label: 'Brand', hint: 'Logo, tagline, about text and social icons', defaults: { text: '', showTagline: true, showSocial: true } },
  { type: 'footer_text', label: 'Text', hint: 'A heading and a paragraph', defaults: { heading: '', text: '' } },
  { type: 'footer_newsletter', label: 'Email sign-up', hint: 'Newsletter form', defaults: { heading: '', text: '' } },
  { type: 'footer_contact', label: 'Contact details', hint: 'Email, phone, address, hours', defaults: { heading: 'Contact', email: '', phone: '', address: '', hours: '' } },
  { type: 'footer_image', label: 'Image', hint: 'A picture or badge', defaults: { imageUrl: '', heading: '', alt: '' } },
  { type: 'social_link', label: 'Social link', hint: 'One social media icon', defaults: { platform: 'instagram', url: '' } },
  { type: 'footer_payment_icons', label: 'Payment icons', hint: 'Shown in the bottom bar', defaults: { icons: [] } },
  { type: 'copyright_text', label: 'Copyright', hint: 'Bottom bar text, {year} = current year', defaults: { text: '' } },
];
const BLOCK_LABEL: Record<string, string> = Object.fromEntries(FOOTER_BLOCK_OPTIONS.map(o => [o.type, o.label]));

/** Content strips that make sense under the header / above the footer (the server enforces the same list). */
const CHROME_SECTION_TYPES: SectionType[] = ['newsletter', 'trust_badges', 'image_banner', 'rich_text', 'testimonials', 'marquee', 'logo_list', 'multicolumn', 'custom_html', 'divider', 'image_with_text', 'multirow', 'gallery_grid', 'faq'];

function ChromeSections({ sections, onChange, onPersist, pageOptions, storeId, helperText }: {
  sections: Section[]; onChange: (next: Section[]) => void; onPersist: (next: Section[]) => void; pageOptions: PageOption[]; storeId: string; helperText: string;
}) {
  return (
    <PageSectionsEditor sections={sections} onChange={onChange} onPersist={onPersist} pageOptions={pageOptions} storeId={storeId}
      supportedSectionTypes={CHROME_SECTION_TYPES} helperText={helperText} />
  );
}

function AddBlockMenu({ onAdd }: { onAdd: (opt: typeof FOOTER_BLOCK_OPTIONS[number]) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="text-[12.5px] font-semibold cursor-pointer bg-transparent border-none text-left flex items-center gap-1 py-1" style={{ color: ADMIN_ACCENT }}>
        <Plus size={14} /> Add block
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-full z-20 mt-1 w-full min-w-[240px] bg-white border border-bone rounded-lg py-1 max-h-[320px] overflow-auto">
          {FOOTER_BLOCK_OPTIONS.map(opt => (
            <button key={opt.type} type="button" role="menuitem" onClick={() => { onAdd(opt); setOpen(false); }}
              className="w-full text-left px-3 py-2 bg-transparent border-none cursor-pointer hover:bg-cream">
              <span className="block text-[12.5px] font-medium text-charcoal">{opt.label}</span>
              <span className="block text-[11px] text-slate">{opt.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const kind = BLOCK_LABEL[block.type];
  const detail = block.settings.label || block.settings.heading || block.settings.platform || block.settings.text;
  const label = kind ? (detail ? `${kind}: ${detail}` : kind) : (detail || block.type);
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

/** Header: the menu (drag to reorder, hide, duplicate), logo, then the section's settings groups. */
export function HeaderEditor({ hf, storeId, onError, supports }: { hf: HeaderFooterDraftState; storeId: string; onError: (msg: string) => void; supports?: HeaderOptionKey[] }) {
  const { headerDraft, footerDraft, editor, menus, pageOptions } = hf;
  if (!headerDraft || !footerDraft) return null;
  const setHeader = (header: StorefrontHeader) => editor.edit(prev => ({ ...prev!, header }));
  return (
    <div className="flex flex-col">
      <Group title="Menu" defaultOpen>
        <label className="flex flex-col gap-1">
          <span className="text-[11.5px] text-charcoal">Menu to show</span>
          <select className={SELECT} value={headerDraft.menuId ?? ''} onChange={e => setHeader({ ...headerDraft, menuId: e.target.value || null })}>
            <option value="">Links below</option>
            {menus.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
          </select>
        </label>
        {headerDraft.menuId ? (
          <p className="text-[11px] text-slate">Edit this menu's links under Online Store → Menus. The links below are kept in case you switch back.</p>
        ) : (
          <>
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
            {headerDraft.blocks.length < 10 ? (
              <button type="button" onClick={() => setHeader({ ...headerDraft, blocks: [...headerDraft.blocks, { type: 'nav_link', settings: { label: '', linkType: 'home' } }] })}
                className="text-[12.5px] font-semibold cursor-pointer bg-transparent border-none text-left flex items-center gap-1" style={{ color: ADMIN_ACCENT }}>
                <Plus size={14} /> Add menu item
              </button>
            ) : <p className="text-[11px] text-slate">Up to 10 top-level items. Add more as dropdown items inside them.</p>}
            <p className="text-[11px] text-slate">Drag to reorder. Open an item to add dropdown links or turn it into a mega menu.</p>
          </>
        )}
      </Group>
      <Group title="Header sections">
        <ChromeSections sections={headerDraft.sections ?? []} pageOptions={pageOptions} storeId={storeId}
          helperText="Extra full-width sections shown right under the header bar, like a promo strip or a trust row."
          onChange={next => setHeader({ ...headerDraft, sections: next })}
          onPersist={next => void hf.persistRemoval({ header: { ...headerDraft, sections: next }, footer: footerDraft }, onError)} />
      </Group>
      <HeaderSettingsPanel header={headerDraft} onChange={setHeader} supports={supports} logoSlot={(
        <>
          <select className={SELECT} value={headerDraft.logoSource ?? 'store'} aria-label="Logo image"
            onChange={e => setHeader({ ...headerDraft, logoSource: e.target.value as StorefrontHeader['logoSource'] })}>
            <option value="store">Use store logo</option>
            <option value="custom">Use a different logo for this theme</option>
          </select>
          {headerDraft.logoSource === 'custom' && (
            <ImageUpload value={headerDraft.customLogoUrl ? [headerDraft.customLogoUrl] : []} onChange={urls => setHeader({ ...headerDraft, customLogoUrl: urls[0] ?? null })} maxFiles={1} storeId={storeId} />
          )}
        </>
      )} />
    </div>
  );
}

/** Footer: an ordered list of blocks (each one a column, in this order on the store) plus the section's settings. */
export function FooterEditor({ hf, storeId, onError }: { hf: HeaderFooterDraftState; storeId: string; onError: (msg: string) => void }) {
  const { headerDraft, footerDraft, editor, menus, pageOptions } = hf;
  if (!headerDraft || !footerDraft) return null;
  const setFooter = (footer: StorefrontFooter) => editor.edit(prev => ({ ...prev!, footer }));
  const blocks = footerLayoutBlocks(footerDraft);
  const withBlocks = (next: Block[]): StorefrontFooter => ({ ...footerDraft, blocks: next, blockLayout: true });
  const setBlocks = (next: Block[]) => setFooter(withBlocks(next));
  return (
    <div className="flex flex-col">
      <Group title="Footer blocks" defaultOpen>
        <p className="text-[11px] text-slate -mt-1">Each block is a column, shown left to right in this order. Drag to reorder.</p>
        {blocks.length === 0 && (
          <p className="text-[12.5px] text-slate bg-white border border-bone rounded-lg px-3 py-2.5">Your footer has no blocks yet. Add one below.</p>
        )}
        <SortableList items={blocks} keyFor={(b, i) => b._id ?? `${b.type}-${i}`} onReorder={setBlocks}>
          {(block, i) => (
            <BlockRow
              block={block}
              onChange={next => setBlocks(blocks.map((b, j) => j === i ? next : b))}
              onRemove={() => void hf.persistRemoval({ header: headerDraft, footer: withBlocks(blocks.filter((_, j) => j !== i)) }, onError)}
              onDuplicate={() => {
                const next = [...blocks];
                next.splice(i + 1, 0, cloneBlockWithoutId(block));
                setBlocks(next);
              }}
              pageOptions={pageOptions}
              storeId={storeId}
            />
          )}
        </SortableList>
        {blocks.length < 20 ? <AddBlockMenu onAdd={opt => setBlocks([...blocks, { type: opt.type, settings: { ...opt.defaults } }])} />
          : <p className="text-[11px] text-slate">The footer can hold up to 20 blocks.</p>}
        <p className="text-[11px] text-slate">Social links appear in the Brand block (or the bottom bar if there is none); payment icons and copyright sit in the bottom bar.</p>
      </Group>
      <Group title="Menu column">
        <select className={SELECT} value={footerDraft.menuId ?? ''} aria-label="Footer menu"
          onChange={e => setFooter({ ...footerDraft, menuId: e.target.value || null })}>
          <option value="">None — use my Link column blocks</option>
          {menus.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
        </select>
        <p className="text-[11px] text-slate">A menu from Online Store → Menus replaces your Link column blocks, in the place of the first one.</p>
      </Group>
      <Group title="Footer sections">
        <ChromeSections sections={footerDraft.sections ?? []} pageOptions={pageOptions} storeId={storeId}
          helperText="Extra full-width sections shown above the footer, like an email sign-up, reviews or brand logos."
          onChange={next => setFooter({ ...footerDraft, sections: next })}
          onPersist={next => void hf.persistRemoval({ header: headerDraft, footer: { ...footerDraft, sections: next } }, onError)} />
      </Group>
      <FooterSettingsPanel footer={footerDraft} storeId={storeId} onChange={setFooter} />
    </div>
  );
}