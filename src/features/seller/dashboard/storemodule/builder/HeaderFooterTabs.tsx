import { useState } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, ChevronUp, Plus, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Field, ImageUpload } from '@/components/comman/ui';
import type { StorefrontHeader, StorefrontFooter } from '@/api/services/storeTheme';
import type { Block } from '@/api/services/storefrontTypes';
import { BlockFields, type PageOption } from './BlockFields';
import { SortableList } from './Sortable';
import { IconOptionPicker, DiagramHeaderStandard, DiagramHeaderCentered, DiagramFooterColumns, DiagramFooterMinimal } from './ThemeControls';
import { ConfirmDialog } from './ConfirmDialog';

function BlockRow({ block, onChange, onRemove, pageOptions, storeId, mainCategoryId }: {
  block: Block; onChange: (next: Block) => void; onRemove: () => void; pageOptions: PageOption[];
  storeId: string; mainCategoryId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const label = block.settings.label || block.settings.heading || block.settings.platform || block.settings.text || block.type;
  return (
    <div className="border border-bone rounded-lg bg-cream/40">
      <div className="flex items-center gap-2 px-3 py-2">
        <button type="button" onClick={() => setOpen(o => !o)} className="flex-1 min-w-0 flex items-center gap-2 bg-transparent border-none cursor-pointer text-left p-0">
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          <span className="text-[12.5px] font-medium text-charcoal truncate capitalize">{label || block.type.replace(/_/g, ' ')}</span>
        </button>
        <button type="button" onClick={() => setConfirmingRemove(true)} className="text-error text-[11px] font-semibold px-2 py-1 hover:bg-error-bg rounded-md bg-transparent border-none cursor-pointer">Remove</button>
      </div>
      {open && <div className="px-3 pb-3 pt-1"><BlockFields type={block.type} settings={block.settings} onChange={settings => onChange({ ...block, settings })} pageOptions={pageOptions} storeId={storeId} mainCategoryId={mainCategoryId} /></div>}
      {confirmingRemove && (
        <ConfirmDialog
          title="Remove item"
          message={`Remove "${label || block.type.replace(/_/g, ' ')}"? This cannot be undone.`}
          confirmLabel="Remove"
          onCancel={() => setConfirmingRemove(false)}
          onConfirm={() => { setConfirmingRemove(false); onRemove(); }}
        />
      )}
    </div>
  );
}

export function HeaderTab({ value, onChange, onPersist, pageOptions, storeId, mainCategoryId }: {
  value: StorefrontHeader; onChange: (next: StorefrontHeader) => void;
  /** Saves immediately — used only for a confirmed nav-link removal, so it
   *  can never silently revert on reload before the seller clicks "Save
   *  Header." Ordinary edits still go through `onChange` only. */
  onPersist: (next: StorefrontHeader) => void;
  pageOptions: PageOption[];
  storeId: string;
  mainCategoryId?: string;
}) {
  return (
    <div className="flex flex-col gap-4 max-w-[560px]">
      <Field label="Logo">
        <select className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg bg-white mb-2" value={value.logoSource} onChange={e => onChange({ ...value, logoSource: e.target.value as 'store' | 'custom' })}>
          <option value="store">Use my Store Settings logo</option>
          <option value="custom">Use a different logo just for the storefront header</option>
        </select>
        {value.logoSource === 'custom' && (
          <ImageUpload value={value.customLogoUrl ? [value.customLogoUrl] : []} onChange={urls => onChange({ ...value, customLogoUrl: urls[0] ?? null })} maxFiles={1} />
        )}
      </Field>

      <IconOptionPicker label="Header layout" value={value.headerStyle ?? 'standard'} onChange={v => onChange({ ...value, headerStyle: v })}
        options={[
          { value: 'standard', label: 'Standard', icon: <DiagramHeaderStandard /> },
          { value: 'centered', label: 'Centered', icon: <DiagramHeaderCentered /> },
        ]} />

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate mb-2">Link position</p>
        <div className="flex gap-2">
          {([
            { value: 'left',   label: 'Left',   Icon: AlignLeft },
            { value: 'center', label: 'Center', Icon: AlignCenter },
            { value: 'right',  label: 'Right',  Icon: AlignRight },
          ] as const).map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...value, navAlignment: opt.value })}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] font-medium cursor-pointer transition-colors',
                (value.navAlignment ?? 'left') === opt.value ? 'border-brand-orange bg-brand-pale-orange/30 text-charcoal' : 'border-bone bg-white text-charcoal hover:bg-cream',
              )}
            >
              <opt.Icon size={13} /> {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">Navigation Links</p>
        <SortableList items={value.blocks} keyFor={(b, i) => b._id ?? `new-${i}`} onReorder={blocks => onChange({ ...value, blocks })}>
          {(block, i) => (
            <BlockRow
              block={block}
              onChange={next => onChange({ ...value, blocks: value.blocks.map((b, j) => j === i ? next : b) })}
              onRemove={() => {
                const next = { ...value, blocks: value.blocks.filter((_, j) => j !== i) };
                onChange(next);
                onPersist(next);
              }}
              pageOptions={pageOptions}
              storeId={storeId}
              mainCategoryId={mainCategoryId}
            />
          )}
        </SortableList>
        {value.blocks.length < 10 && (
          <button type="button" onClick={() => onChange({ ...value, blocks: [...value.blocks, { type: 'nav_link', settings: { label: '', linkType: 'home' } }] })}
            className="text-[12px] font-semibold text-brand-orange bg-transparent border-none cursor-pointer text-left flex items-center gap-1">
            <Plus size={13} /> Add nav link
          </button>
        )}
      </div>
    </div>
  );
}

const FOOTER_BLOCK_OPTIONS = [
  { type: 'footer_column', label: 'Link column', defaults: { heading: '', links: [] } },
  { type: 'social_link',   label: 'Social link',  defaults: { platform: 'facebook', url: '' } },
  { type: 'copyright_text', label: 'Copyright text', defaults: { text: '' } },
];

export function FooterTab({ value, onChange, onPersist, pageOptions, storeId, mainCategoryId }: {
  value: StorefrontFooter; onChange: (next: StorefrontFooter) => void;
  /** Saves immediately — used only for a confirmed footer-block removal. */
  onPersist: (next: StorefrontFooter) => void;
  pageOptions: PageOption[];
  storeId: string;
  mainCategoryId?: string;
}) {
  return (
    <div className="flex flex-col gap-4 max-w-[560px]">
      <IconOptionPicker label="Footer layout" value={value.footerStyle ?? 'columns'} onChange={v => onChange({ ...value, footerStyle: v })}
        options={[
          { value: 'columns', label: 'Columns', icon: <DiagramFooterColumns /> },
          { value: 'minimal', label: 'Minimal', icon: <DiagramFooterMinimal /> },
        ]} />

      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">Footer Content</p>

        {value.blocks.length === 0 && (
          <p className="text-[12.5px] text-slate leading-relaxed bg-cream/60 border border-bone rounded-lg px-3 py-2.5 mb-1">
            Your footer is empty — add a link column, social links, or a copyright line so buyers see something at the bottom of every page.
          </p>
        )}

        <SortableList items={value.blocks} keyFor={(b, i) => b._id ?? `new-${i}`} onReorder={blocks => onChange({ ...value, blocks })}>
          {(block, i) => (
            <BlockRow
              block={block}
              onChange={next => onChange({ ...value, blocks: value.blocks.map((b, j) => j === i ? next : b) })}
              onRemove={() => {
                const next = { ...value, blocks: value.blocks.filter((_, j) => j !== i) };
                onChange(next);
                onPersist(next);
              }}
              pageOptions={pageOptions}
              storeId={storeId}
              mainCategoryId={mainCategoryId}
            />
          )}
        </SortableList>

        <div className="flex items-center gap-2 flex-wrap">
          {FOOTER_BLOCK_OPTIONS.map(opt => (
            <button
              key={opt.type}
              type="button"
              onClick={() => onChange({ ...value, blocks: [...value.blocks, { type: opt.type, settings: { ...opt.defaults } }] })}
              className="text-[12px] font-semibold text-brand-orange bg-transparent border-none cursor-pointer text-left flex items-center gap-1"
            >
              <Plus size={13} /> {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
