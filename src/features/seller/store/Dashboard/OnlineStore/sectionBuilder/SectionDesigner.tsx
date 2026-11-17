import { useId, useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Columns3, Copy, FileText, Heading, Image as ImageIcon, Minus, MousePointerClick, Plus, Repeat, Rows3, Trash2, Type, Video, MoveVertical } from 'lucide-react';
import { ActionMenu, Button } from '@/components/comman/ui';
import type { LayoutNode, LayoutNodeType, StoreSectionDefInput } from '@/api/services/storeSectionDefs';
import { StoreSectionView, type StoreSectionColors } from '@/features/storefront-themes/storeSections/StoreSectionView';
import {
  LEAVES, CONTAINERS, NODE_LABEL, canAdd, countNodes, duplicateAt, getAt, insertChild, isContainer, moveWithin, newNode, previewData, removeAt, updateAt, type NodePath,
} from './layoutTree';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none focus:border-brand-orange';
const PREVIEW_COLORS: StoreSectionColors = { bg: '#ffffff', ink: '#1f1d1a', accent: '#1f1d1a', accentInk: '#ffffff', bgAlt: '#f7f5f0', inkMuted: '#77736b', border: '#e4e0d6' };

const ICON: Record<LayoutNodeType, ReactNode> = {
  stack: <Rows3 size={14} />, columns: <Columns3 size={14} />, repeat: <Repeat size={14} />, heading: <Heading size={14} />, text: <Type size={14} />,
  richtext: <FileText size={14} />, image: <ImageIcon size={14} />, button: <MousePointerClick size={14} />, video: <Video size={14} />, divider: <Minus size={14} />, spacer: <MoveVertical size={14} />,
};

function summary(n: LayoutNode): string {
  if (isContainer(n.t)) return n.t === 'repeat' ? `Repeating items: ${n.label || 'Item'}` : NODE_LABEL[n.t];
  if (n.t === 'divider' || n.t === 'spacer') return NODE_LABEL[n.t];
  return `${NODE_LABEL[n.t]}: ${n.label || n.key}`;
}

// ── small form controls ──
function Row({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex flex-col gap-1 text-[12px] font-semibold text-charcoal">{label}{children}</label>
      {hint && <span className="font-normal text-slate text-[11.5px]">{hint}</span>}
    </div>
  );
}
function Sel({ label, value, options, onChange }: { label: string; value: string | undefined; options: [string, string][]; onChange: (v: string) => void }) {
  return <Row label={label}><select className={inp} value={value ?? options[0][0]} onChange={e => onChange(e.target.value)}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Row>;
}
function Num({ label, value, min, max, onChange, hint }: { label: string; value: number | undefined; min: number; max: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <Row label={label} hint={hint}>
      <input type="number" className={inp} min={min} max={max} value={value ?? ''} onChange={e => { const n = Number(e.target.value); if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, Math.round(n)))); }} />
    </Row>
  );
}
function Txt({ label, value, max, onChange, hint, placeholder }: { label: string; value: string | undefined; max: number; onChange: (v: string) => void; hint?: string; placeholder?: string }) {
  return <Row label={label} hint={hint}><input className={inp} value={value ?? ''} maxLength={max} placeholder={placeholder} onChange={e => onChange(e.target.value)} /></Row>;
}
const ALIGN: [string, string][] = [['inherit', 'Same as the group'], ['left', 'Left'], ['center', 'Centre'], ['right', 'Right']];
const ALIGN3: [string, string][] = [['left', 'Left'], ['center', 'Centre'], ['right', 'Right']];

/** The properties of the selected element. */
function NodeProperties({ node, onChange }: { node: LayoutNode; onChange: (patch: Partial<LayoutNode>) => void }) {
  const set = (patch: Partial<LayoutNode>) => onChange(patch);
  const fieldBits = (withDefault: boolean, dfltLabel = 'Starting text') => (
    <>
      <Txt label="Name in the editor" value={node.label} max={40} onChange={v => set({ label: v })} hint="What you will see on the form when you fill this section in." />
      {withDefault && <Txt label={dfltLabel} value={node.default} max={500} onChange={v => set({ default: v })} hint="Shown until you type your own." />}
    </>
  );
  switch (node.t) {
    case 'stack':
      return (<>
        <Num label="Space between elements (px)" value={node.gap} min={0} max={80} onChange={v => set({ gap: v })} />
        <Sel label="Alignment" value={node.align} options={ALIGN3} onChange={v => set({ align: v })} />
        <Num label="Maximum width (px)" value={node.maxWidth} min={0} max={1600} onChange={v => set({ maxWidth: v })} hint="0 = as wide as the page." />
      </>);
    case 'columns':
      return (<>
        <Num label="Columns" value={node.cols} min={1} max={4} onChange={v => set({ cols: v })} hint="Phones show one column." />
        <Num label="Space between columns (px)" value={node.gap} min={0} max={80} onChange={v => set({ gap: v })} />
        <Sel label="Line up" value={node.valign} options={[['top', 'Top'], ['center', 'Middle'], ['bottom', 'Bottom']]} onChange={v => set({ valign: v })} />
      </>);
    case 'repeat':
      return (<>
        <Txt label="What is one item called?" value={node.label} max={30} onChange={v => set({ label: v })} hint='e.g. "Card" or "Plan": you add, remove and reorder these when you fill the section in.' />
        <Num label="Items to start with" value={node.initial} min={0} max={12} onChange={v => set({ initial: v })} />
        <Num label="Items per row" value={node.cols} min={1} max={6} onChange={v => set({ cols: v })} hint="Tablets show up to 2, phones 1." />
        <Num label="Space between items (px)" value={node.gap} min={0} max={80} onChange={v => set({ gap: v })} />
        <Sel label="Text alignment" value={node.align} options={ALIGN3} onChange={v => set({ align: v })} />
        <label className="flex items-center gap-2 text-[12.5px] text-charcoal"><input type="checkbox" checked={!!node.card} onChange={e => set({ card: e.target.checked })} /> Draw each item as a card</label>
      </>);
    case 'heading':
      return (<>
        {fieldBits(true)}
        <Sel label="Size" value={node.size} options={[['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large'], ['xl', 'Extra large']]} onChange={v => set({ size: v })} />
        <Sel label="Heading level" value={node.tag} options={[['h2', 'Main heading (h2)'], ['h3', 'Sub-heading (h3)'], ['h4', 'Small heading (h4)']]} onChange={v => set({ tag: v })} />
        <Sel label="Alignment" value={node.align} options={ALIGN} onChange={v => set({ align: v })} />
      </>);
    case 'text':
      return (<>
        {fieldBits(true)}
        <Sel label="Size" value={node.size} options={[['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large']]} onChange={v => set({ size: v })} />
        <Sel label="Alignment" value={node.align} options={ALIGN} onChange={v => set({ align: v })} />
        <label className="flex items-center gap-2 text-[12.5px] text-charcoal"><input type="checkbox" checked={!!node.muted} onChange={e => set({ muted: e.target.checked })} /> Softer colour</label>
      </>);
    case 'richtext':
      return (<>{fieldBits(false)}<Sel label="Alignment" value={node.align} options={ALIGN} onChange={v => set({ align: v })} /></>);
    case 'image':
      return (<>
        {fieldBits(false)}
        <Sel label="Shape" value={node.ratio} options={[['auto', 'Natural'], ['square', 'Square'], ['4:3', '4 : 3'], ['16:9', 'Wide (16 : 9)'], ['3:4', 'Tall (3 : 4)']]} onChange={v => set({ ratio: v })} />
        <Sel label="Fit" value={node.fit} options={[['cover', 'Fill the shape (crop)'], ['contain', 'Show the whole picture']]} onChange={v => set({ fit: v })} />
        <Num label="Rounded corners (px)" value={node.radius} min={0} max={48} onChange={v => set({ radius: v })} hint="48 makes a square photo a circle." />
        <Num label="Maximum height (px)" value={node.maxHeight} min={0} max={1000} onChange={v => set({ maxHeight: v })} hint="0 = no limit." />
      </>);
    case 'video':
      return (<>{fieldBits(false)}<Sel label="Shape" value={node.ratio} options={[['16:9', 'Wide (16 : 9)'], ['4:3', '4 : 3'], ['square', 'Square']]} onChange={v => set({ ratio: v })} /></>);
    case 'button':
      return (<>
        {fieldBits(true, 'Starting button text')}
        <Sel label="Look" value={node.style} options={[['solid', 'Filled'], ['outline', 'Outline'], ['link', 'Text link']]} onChange={v => set({ style: v })} />
        <Sel label="Alignment" value={node.align} options={ALIGN} onChange={v => set({ align: v })} />
      </>);
    case 'spacer':
      return <Num label="Height (px)" value={node.h} min={0} max={200} onChange={v => set({ h: v })} />;
    default:
      return <p className="text-[12px] text-slate">A thin line across the section. Nothing to set.</p>;
  }
}

/** The tree of elements, with select / move / duplicate / remove and "Add element" inside every container. */
function Tree({ root, node, path, depth, selected, onSelect, onAdd, onChange }: {
  root: LayoutNode; node: LayoutNode; path: NodePath; depth: number; selected: NodePath; onSelect: (p: NodePath) => void;
  onAdd: (parent: NodePath, t: LayoutNodeType) => void; onChange: (next: LayoutNode, select?: NodePath) => void;
}) {
  const isSel = selected.length === path.length && selected.every((v, i) => v === path[i]);
  const isRoot = path.length === 0;
  const siblings = isRoot ? 1 : (getAt(root, path.slice(0, -1))?.children?.length ?? 1);
  const idx = path[path.length - 1] ?? 0;
  const addOptions = [...CONTAINERS, ...LEAVES].map(t => ({ t, why: canAdd(root, path, t) }));
  return (
    <div>
      <div
        className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 ${isSel ? 'border-brand-orange bg-brand-pale-orange/50' : 'border-transparent hover:bg-cream'}`}
        style={{ marginLeft: depth * 14 }}
      >
        <button type="button" onClick={() => onSelect(path)} aria-pressed={isSel} className="flex flex-1 min-w-0 items-center gap-2 bg-transparent border-none cursor-pointer text-left p-0 text-[12.5px] text-charcoal">
          <span className="text-slate shrink-0">{ICON[node.t]}</span>
          <span className="truncate font-medium">{summary(node)}</span>
        </button>
        {isSel && !isRoot && (
          <span className="flex items-center shrink-0">
            <IconBtn label="Move up" disabled={idx === 0} onClick={() => onChange(moveWithin(root, path, -1), [...path.slice(0, -1), idx - 1])}><ArrowUp size={13} /></IconBtn>
            <IconBtn label="Move down" disabled={idx >= siblings - 1} onClick={() => onChange(moveWithin(root, path, 1), [...path.slice(0, -1), idx + 1])}><ArrowDown size={13} /></IconBtn>
            <IconBtn label="Duplicate" disabled={node.t === 'repeat'} onClick={() => onChange(duplicateAt(root, path), [...path.slice(0, -1), idx + 1])}><Copy size={13} /></IconBtn>
            <IconBtn label="Remove" danger onClick={() => onChange(removeAt(root, path), path.slice(0, -1))}><Trash2 size={13} /></IconBtn>
          </span>
        )}
      </div>
      {isContainer(node.t) && (
        <>
          {(node.children ?? []).map((c, i) => (
            <Tree key={i} root={root} node={c} path={[...path, i]} depth={depth + 1} selected={selected} onSelect={onSelect} onAdd={onAdd} onChange={onChange} />
          ))}
          <div style={{ marginLeft: (depth + 1) * 14 }} className="py-0.5">
            <ActionMenu
              align="left"
              trigger={<span className="text-[12px] font-semibold text-brand-orange cursor-pointer flex items-center gap-1 px-2 py-1"><Plus size={12} /> Add element</span>}
              triggerClassName="bg-transparent border-none cursor-pointer p-0"
              items={addOptions.map(({ t, why }) => ({ label: NODE_LABEL[t], icon: ICON[t], disabled: !!why, title: why ?? undefined, onClick: () => onAdd(path, t) }))}
            />
          </div>
        </>
      )}
    </div>
  );
}

function IconBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}
      className={`w-6 h-6 flex items-center justify-center rounded-md bg-transparent border-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${danger ? 'text-error/80 hover:bg-error-bg' : 'text-slate hover:bg-white'}`}>
      {children}
    </button>
  );
}

export interface DesignerValue { name: string; description: string; layout: LayoutNode }

/** The Section builder's editor: the element tree and the selected element's properties on the left, a live preview on the right. */
export function SectionDesigner({ value, usedOn, saving, error, onSave, onCancel }: {
  value: DesignerValue;
  usedOn?: number;
  saving?: boolean;
  error?: string;
  onSave: (input: StoreSectionDefInput) => void;
  onCancel: () => void;
}) {
  const nameId = useId();
  const [name, setName] = useState(value.name);
  const [description, setDescription] = useState(value.description);
  const [layout, setLayout] = useState<LayoutNode>(value.layout);
  const [selected, setSelected] = useState<NodePath>([]);
  const node = getAt(layout, selected) ?? layout;
  const data = useMemo(() => previewData(layout), [layout]);
  const total = countNodes(layout);

  const change = (next: LayoutNode, sel?: NodePath) => { setLayout(next); if (sel) setSelected(sel); };
  const add = (parent: NodePath, t: LayoutNodeType) => {
    const parentNode = getAt(layout, parent);
    const at = parentNode?.children?.length ?? 0;
    change(insertChild(layout, parent, newNode(t, layout)), [...parent, at]);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={nameId} className="text-[12px] font-semibold text-charcoal">Section name</label>
          <input id={nameId} className={inp} value={name} maxLength={60} onChange={e => setName(e.target.value)} placeholder="e.g. Feature cards" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold text-charcoal">Short description <span className="font-normal text-slate">(optional)</span>
            <input className={`${inp} mt-1.5`} value={description} maxLength={200} onChange={e => setDescription(e.target.value)} placeholder="Shown when you add it to a page" />
          </label>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] items-start">
        <div className="flex flex-col gap-3 min-w-0">
          <div className="rounded-xl border border-bone bg-white p-2.5">
            <p className="px-2 pb-1 text-[10.5px] font-bold uppercase tracking-wide text-slate">Layout · {total} element{total === 1 ? '' : 's'}</p>
            <Tree root={layout} node={layout} path={[]} depth={0} selected={selected} onSelect={setSelected} onAdd={add} onChange={change} />
          </div>
          <div className="rounded-xl border border-bone bg-white p-3.5 flex flex-col gap-3" aria-label="Element settings">
            <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate">Settings: {summary(node)}</p>
            <NodeProperties node={node} onChange={patch => change(updateAt(layout, selected, patch))} />
          </div>
        </div>

        <div className="min-w-0 lg:sticky lg:top-4 flex flex-col gap-2">
          <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate px-1">Preview</p>
          <div className="rounded-xl border border-bone overflow-hidden" style={{ background: PREVIEW_COLORS.bg, color: PREVIEW_COLORS.ink }}>
            <div className="p-6 md:p-8">
              <StoreSectionView
                def={{ layout }}
                settings={data.settings}
                blocks={data.blocks}
                colors={PREVIEW_COLORS}
                link={({ children, style }) => <span style={style}>{children}</span>}
                preview
              />
            </div>
          </div>
          <p className="text-[11.5px] text-slate px-1">Grey boxes are parts you fill in later, on the page. Colours and fonts follow your theme.</p>
        </div>
      </div>

      {(usedOn ?? 0) > 0 && <p className="text-[12px] text-slate">This section is used on {usedOn} page{usedOn === 1 ? '' : 's'}: saving changes it everywhere. Values you already typed stay; a removed element's value just stops showing.</p>}
      {error && <p role="alert" className="text-[12.5px] text-error">{error}</p>}
      <div className="flex gap-2 sticky bottom-0 bg-cream/90 backdrop-blur py-3 -mx-1 px-1">
        <Button onClick={() => onSave({ name: name.trim(), description: description.trim(), layout })} loading={saving} disabled={!name.trim()}>Save section</Button>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
      </div>
    </div>
  );
}
