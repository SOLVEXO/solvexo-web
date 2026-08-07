import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Field, ImageUpload, ActionMenu } from '@/components/comman/ui';
import type { StorefrontHeader, StorefrontFooter } from '@/api/services/storeTheme';
import type { Block } from '@/api/services/storefrontTypes';
import { BlockFields, type PageOption } from './BlockFields';
import { SortableList } from './Sortable';

function BlockRow({ block, onChange, onRemove, pageOptions }: {
  block: Block; onChange: (next: Block) => void; onRemove: () => void; pageOptions: PageOption[];
}) {
  const [open, setOpen] = useState(false);
  const label = block.settings.label || block.settings.heading || block.settings.platform || block.settings.text || block.type;
  return (
    <div className="border border-bone rounded-lg bg-cream/40">
      <div className="flex items-center gap-2 px-3 py-2">
        <button type="button" onClick={() => setOpen(o => !o)} className="flex-1 min-w-0 flex items-center gap-2 bg-transparent border-none cursor-pointer text-left p-0">
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          <span className="text-[12.5px] font-medium text-charcoal truncate capitalize">{label || block.type.replace(/_/g, ' ')}</span>
        </button>
        <button type="button" onClick={onRemove} className="text-error text-[11px] font-semibold px-2 py-1 hover:bg-error-bg rounded-md bg-transparent border-none cursor-pointer">Remove</button>
      </div>
      {open && <div className="px-3 pb-3 pt-1"><BlockFields type={block.type} settings={block.settings} onChange={settings => onChange({ ...block, settings })} pageOptions={pageOptions} /></div>}
    </div>
  );
}

export function HeaderTab({ value, onChange, pageOptions }: {
  value: StorefrontHeader; onChange: (next: StorefrontHeader) => void; pageOptions: PageOption[];
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

      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">Navigation Links</p>
        <SortableList items={value.blocks} keyFor={(b, i) => b._id ?? `new-${i}`} onReorder={blocks => onChange({ ...value, blocks })}>
          {(block, i) => (
            <BlockRow
              block={block}
              onChange={next => onChange({ ...value, blocks: value.blocks.map((b, j) => j === i ? next : b) })}
              onRemove={() => onChange({ ...value, blocks: value.blocks.filter((_, j) => j !== i) })}
              pageOptions={pageOptions}
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

export function FooterTab({ value, onChange, pageOptions }: {
  value: StorefrontFooter; onChange: (next: StorefrontFooter) => void; pageOptions: PageOption[];
}) {
  return (
    <div className="flex flex-col gap-2 max-w-[560px]">
      <SortableList items={value.blocks} keyFor={(b, i) => b._id ?? `new-${i}`} onReorder={blocks => onChange({ blocks })}>
        {(block, i) => (
          <BlockRow
            block={block}
            onChange={next => onChange({ blocks: value.blocks.map((b, j) => j === i ? next : b) })}
            onRemove={() => onChange({ blocks: value.blocks.filter((_, j) => j !== i) })}
            pageOptions={pageOptions}
          />
        )}
      </SortableList>
      <ActionMenu
        align="left"
        trigger={<span className="flex items-center gap-1"><Plus size={13} /> Add to footer</span>}
        triggerClassName="flex items-center gap-1.5 px-4 py-[9px] text-[13px] font-semibold rounded-[9px] border border-bone bg-white text-charcoal hover:bg-cream cursor-pointer transition-colors self-start"
        items={FOOTER_BLOCK_OPTIONS.map(opt => ({
          label: opt.label,
          onClick: () => onChange({ blocks: [...value.blocks, { type: opt.type, settings: { ...opt.defaults } }] }),
        }))}
      />
    </div>
  );
}
