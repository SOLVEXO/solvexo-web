import { useState } from 'react';

/** No-code Style panel for ANY block: stored in `settings.style` (read by `storefront-themes/blockStyle.ts`). */
type Style = Record<string, unknown>;

const inp = 'w-full px-2 py-1.5 text-[12px] border border-bone rounded-lg text-charcoal bg-white outline-none';

function Num({ label, value, onChange, min = 0, max = 300 }: { label: string; value: unknown; onChange: (v: number | undefined) => void; min?: number; max?: number }) {
  return (
    <label className="flex flex-col gap-1 text-[11px] text-slate">
      {label}
      <input type="number" className={inp} min={min} max={max} value={typeof value === 'number' ? value : ''} placeholder="Auto"
        onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
    </label>
  );
}

function Pick({ label, value, options, onChange }: { label: string; value: unknown; options: [string, string][]; onChange: (v: string | undefined) => void }) {
  return (
    <label className="flex flex-col gap-1 text-[11px] text-slate">
      {label}
      <select className={inp} value={typeof value === 'string' ? value : ''} onChange={e => onChange(e.target.value || undefined)}>
        <option value="">Default</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

function Color({ label, value, onChange }: { label: string; value: unknown; onChange: (v: string | undefined) => void }) {
  const on = typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
  return (
    <div className="flex flex-col gap-1 text-[11px] text-slate">
      {label}
      <div className="flex items-center gap-2">
        <input type="color" aria-label={label} className="h-8 w-10 rounded border border-bone bg-white" value={on ? (value as string) : '#000000'} onChange={e => onChange(e.target.value)} />
        {on ? <button type="button" className="text-[11px] underline" onClick={() => onChange(undefined)}>Clear</button> : <span>Default</span>}
      </div>
    </div>
  );
}

/** Blocks whose section renderer does not draw per-block styles yet (no PreviewBlock): the panel is hidden so it never promises what it cannot do. */
const NO_STYLE = new Set(['nav_link', 'footer_column']);
export function styleSupported(type: string): boolean {
  return !NO_STYLE.has(type) && !type.startsWith('blog_');
}

export function BlockStylePanel({ settings, onChange }: { settings: Record<string, any>; onChange: (next: Record<string, any>) => void }) {
  const [open, setOpen] = useState(false);
  const style: Style = (settings.style && typeof settings.style === 'object') ? settings.style : {};
  const set = (key: string, v: unknown) => {
    const next = { ...style };
    if (v === undefined || v === '') delete next[key]; else next[key] = v;
    const rest = { ...settings };
    if (Object.keys(next).length) rest.style = next; else delete rest.style;
    onChange(rest);
  };
  const count = Object.keys(style).length;
  return (
    <div className="mt-2 border-t border-bone pt-2">
      <button type="button" aria-expanded={open} onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate">
        <span>Style{count ? ` (${count})` : ''}</span><span>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="mt-2 flex flex-col gap-3">
          <p className="text-[10.5px] font-semibold text-slate">Text</p>
          <div className="grid grid-cols-2 gap-2">
            <Num label="Font size (px)" value={style.fontSize} min={8} max={120} onChange={v => set('fontSize', v)} />
            <Num label="Font size, phone (px)" value={style.fontSizeMobile} min={8} max={120} onChange={v => set('fontSizeMobile', v)} />
            <Pick label="Weight" value={style.fontWeight} onChange={v => set('fontWeight', v)} options={[['normal', 'Normal'], ['medium', 'Medium'], ['semibold', 'Semibold'], ['bold', 'Bold'], ['black', 'Black']]} />
            <Pick label="Text align" value={style.textAlign} onChange={v => set('textAlign', v)} options={[['left', 'Left'], ['center', 'Center'], ['right', 'Right']]} />
            <Color label="Text colour" value={style.textColor} onChange={v => set('textColor', v)} />
          </div>
          <p className="text-[10.5px] font-semibold text-slate">Space (px)</p>
          <div className="grid grid-cols-2 gap-2">
            <Num label="Margin top" value={style.marginTop} min={-200} onChange={v => set('marginTop', v)} />
            <Num label="Margin bottom" value={style.marginBottom} min={-200} onChange={v => set('marginBottom', v)} />
            <Num label="Padding top" value={style.paddingTop} onChange={v => set('paddingTop', v)} />
            <Num label="Padding bottom" value={style.paddingBottom} onChange={v => set('paddingBottom', v)} />
            <Num label="Padding left" value={style.paddingLeft} onChange={v => set('paddingLeft', v)} />
            <Num label="Padding right" value={style.paddingRight} onChange={v => set('paddingRight', v)} />
          </div>
          <p className="text-[10.5px] font-semibold text-slate">Box</p>
          <div className="grid grid-cols-2 gap-2">
            <Color label="Background" value={style.backgroundColor} onChange={v => set('backgroundColor', v)} />
            <Color label="Border colour" value={style.borderColor} onChange={v => set('borderColor', v)} />
            <Num label="Border width" value={style.borderWidth} max={12} onChange={v => set('borderWidth', v)} />
            <Num label="Corner radius" value={style.borderRadius} max={200} onChange={v => set('borderRadius', v)} />
            <Pick label="Shadow" value={style.shadow} onChange={v => set('shadow', v)} options={[['soft', 'Soft'], ['medium', 'Medium'], ['strong', 'Strong']]} />
            <Num label="Opacity (%)" value={style.opacity} max={100} onChange={v => set('opacity', v)} />
            <Num label="Max width (px)" value={style.maxWidth} min={40} max={2000} onChange={v => set('maxWidth', v)} />
            <Pick label="Position" value={style.align} onChange={v => set('align', v)} options={[['center', 'Centre'], ['right', 'Right']]} />
          </div>
          <p className="text-[10.5px] font-semibold text-slate">Behaviour</p>
          <div className="grid grid-cols-2 gap-2">
            <Pick label="On hover" value={style.hover} onChange={v => set('hover', v)} options={[['lift', 'Lift up'], ['zoom', 'Zoom'], ['fade', 'Fade'], ['shadow', 'Add shadow'], ['tilt', 'Tilt'], ['glow', 'Glow']]} />
            <Pick label="Show on" value={style.visibility} onChange={v => set('visibility', v)} options={[['desktop', 'Desktop only'], ['mobile', 'Phone only']]} />
          </div>
          <p className="text-[10.5px] font-semibold text-slate">Animation</p>
          <div className="grid grid-cols-2 gap-2">
            <Pick label="When it appears" value={style.animation} onChange={v => set('animation', v)} options={[['fade', 'Fade in'], ['slide-up', 'Slide up'], ['slide-down', 'Slide down'], ['slide-left', 'Slide from left'], ['slide-right', 'Slide from right'], ['zoom', 'Zoom in'], ['zoom-out', 'Zoom out'], ['blur', 'Blur in'], ['rotate', 'Rotate in'], ['flip', 'Flip in'], ['bounce', 'Bounce up'], ['wipe', 'Wipe (left to right)']]} />
            <Pick label="Speed" value={style.animationSpeed} onChange={v => set('animationSpeed', v)} options={[['fast', 'Fast'], ['normal', 'Normal'], ['slow', 'Slow'], ['very-slow', 'Very slow']]} />
            <Pick label="Easing" value={style.animationEase} onChange={v => set('animationEase', v)} options={[['smooth', 'Smooth'], ['ease-out', 'Soft stop'], ['bouncy', 'Bouncy'], ['linear', 'Even']]} />
            <Num label="Delay (ms)" value={style.animationDelay} max={3000} onChange={v => set('animationDelay', v)} />
            <Pick label="Keeps moving" value={style.loop} onChange={v => set('loop', v)} options={[['float', 'Float'], ['pulse', 'Pulse'], ['spin', 'Slow spin'], ['shake', 'Shake']]} />
          </div>
          {count > 0 && <button type="button" className="self-start text-[11px] underline text-slate" onClick={() => { const r = { ...settings }; delete r.style; onChange(r); }}>Reset style</button>}
        </div>
      )}
    </div>
  );
}

/** Editor list name of a Free Layout item: "Heading: Welcome", "Button: Shop now", "Image"... */
export function layoutItemLabel(s: Record<string, any>): string {
  const names: Record<string, string> = { heading: 'Heading', text: 'Text', button: 'Button', image: 'Image', spacer: 'Empty space', divider: 'Divider' };
  const base = names[String(s.kind)] ?? 'Item';
  const detail = String(s.kind === 'button' ? s.buttonLabel ?? '' : s.kind === 'heading' || s.kind === 'text' ? s.text ?? '' : '').trim().slice(0, 28);
  return `${base}${detail ? `: ${detail}` : ''} (col ${Number(s.column) || 1})`;
}
