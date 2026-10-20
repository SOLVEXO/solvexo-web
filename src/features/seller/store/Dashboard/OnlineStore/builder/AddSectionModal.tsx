import { useState, type ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Modal } from '@/components/comman/ui';
import { SECTION_META, SECTION_META_BY_TYPE } from './sectionRegistry';
import { customSectionsOf } from '@/features/storefront-themes/themeManifest';
import { DEFAULT_THEME_ID } from '@/features/storefront-themes/registry';
import type { ThemeCustomSectionPreset } from '@/features/storefront-themes/themeManifest';
import { metaForCustomDef, newCustomSection } from './themeSectionMeta';
import { SECTION_PRESETS, PRESET_CATEGORIES, PAGE_LAYOUTS, type PresetCategory, type PresetMock } from './sectionPresets';
import type { SectionType } from '@/api/services/storefrontTypes';

export interface PickedSection { type: SectionType; settings: Record<string, unknown>; blocks: { type: string; settings: Record<string, unknown> }[] }

const ACCENT = '#D97757';
const INK = '#3b3833';
const SOFT = '#e7e2d8';

const bar = (w: number | string, h = 4, color = INK, o = 1) => <span className="block rounded-full" style={{ width: w, height: h, background: color, opacity: o }} />;
const box = (h: number, children?: ReactNode, bg = SOFT) => <span className="flex items-center justify-center rounded-sm w-full" style={{ height: h, background: bg }}>{children}</span>;

/** Small drawing of what the section will look like. */
function Mock({ kind }: { kind: PresetMock }) {
  const content = (() => {
    switch (kind) {
      case 'banner': return box(62, <span className="flex flex-col items-center gap-1.5">{bar(54, 5, '#fff')}{bar(34, 3, '#fff', 0.8)}<span className="block rounded-full mt-0.5" style={{ width: 22, height: 7, background: '#fff' }} /></span>, '#8d7b66');
      case 'banner-left': return box(62, <span className="flex flex-col gap-1.5 w-full pl-3">{bar(46, 5, '#fff')}{bar(30, 3, '#fff', 0.8)}<span className="block rounded-full" style={{ width: 20, height: 7, background: '#fff' }} /></span>, '#7a8a8f');
      case 'strip': return box(26, <span className="flex items-center gap-2">{bar(60, 4, '#fff')}<span className="block rounded-full" style={{ width: 18, height: 7, background: '#fff' }} /></span>, '#a07c62');
      case 'slides': return box(62, <span className="flex flex-col items-center gap-1.5">{bar(46, 5, '#fff')}<span className="flex gap-1 mt-1">{[1, 0.5, 0.5].map((o, i) => <span key={i} className="block rounded-full" style={{ width: 5, height: 5, background: '#fff', opacity: o }} />)}</span></span>, '#6f7d68');
      case 'countdown': return box(62, <span className="flex flex-col items-center gap-1.5">{bar(48, 4, '#fff')}<span className="flex gap-1">{[0, 1, 2, 3].map(i => <span key={i} className="block rounded-sm" style={{ width: 12, height: 12, background: '#ffffff33', border: '1px solid #ffffff88' }} />)}</span></span>, '#b0413e');
      case 'products': case 'products-3': {
        const n = kind === 'products' ? 4 : 3;
        return <span className="flex flex-col gap-1.5 w-full">{bar(40)}<span className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${n},1fr)` }}>{Array.from({ length: n }, (_, i) => <span key={i} className="flex flex-col gap-1">{box(kind === 'products' ? 30 : 38)}{bar('70%', 3, INK, 0.6)}{bar('40%', 3, INK, 0.35)}</span>)}</span></span>;
      }
      case 'spotlight': return <span className="grid grid-cols-2 gap-2 w-full items-center">{box(56)}<span className="flex flex-col gap-1.5">{bar('80%', 5)}{bar('40%', 4, INK, 0.6)}<span className="block rounded-full" style={{ width: 34, height: 9, background: INK }} /></span></span>;
      case 'tiles': return <span className="flex flex-col gap-1.5 w-full">{bar(44)}<span className="grid grid-cols-3 gap-1.5">{[0, 1, 2].map(i => <span key={i} className="relative">{box(40)}<span className="absolute left-1 bottom-1">{bar(18, 3, '#fff')}</span></span>)}</span></span>;
      case 'badges': return <span className="grid grid-cols-4 gap-1.5 w-full">{[0, 1, 2, 3].map(i => <span key={i} className="flex flex-col items-center gap-1"><span className="block rounded-full" style={{ width: 13, height: 13, border: `1.5px solid ${INK}` }} />{bar('80%', 3, INK, 0.55)}</span>)}</span>;
      case 'columns': case 'steps': return <span className="flex flex-col items-center gap-2 w-full">{bar(46)}<span className="grid grid-cols-3 gap-2 w-full">{[1, 2, 3].map(i => <span key={i} className="flex flex-col items-center gap-1">{kind === 'steps' ? <span className="flex items-center justify-center rounded-full text-[7px] font-bold" style={{ width: 13, height: 13, background: INK, color: '#fff' }}>{i}</span> : <span className="block rounded-sm" style={{ width: 13, height: 13, background: SOFT }} />}{bar('70%', 3, INK, 0.7)}{bar('90%', 2, INK, 0.35)}</span>)}</span></span>;
      case 'rows': return <span className="flex flex-col gap-1.5 w-full">{[0, 1].map(i => <span key={i} className={`flex gap-2 items-center ${i ? 'flex-row-reverse' : ''}`}><span className="w-1/2">{box(24)}</span><span className="flex flex-col gap-1 w-1/2">{bar('80%', 3)}{bar('60%', 2, INK, 0.4)}</span></span>)}</span>;
      case 'text': return <span className="flex flex-col items-center gap-1.5 w-full py-1">{bar(50, 5)}{bar('85%', 3, INK, 0.4)}{bar('75%', 3, INK, 0.4)}{bar('55%', 3, INK, 0.4)}</span>;
      case 'quotes': return <span className="flex flex-col gap-1.5 w-full">{bar(44)}<span className="grid grid-cols-3 gap-1.5">{[0, 1, 2].map(i => <span key={i} className="flex flex-col gap-1 rounded-sm p-1" style={{ border: `1px solid ${SOFT}` }}><span className="text-[7px] leading-none" style={{ color: '#d4a017' }}>★★★★★</span>{bar('90%', 2, INK, 0.45)}{bar('50%', 2, INK, 0.7)}</span>)}</span></span>;
      case 'gallery': return <span className="grid grid-cols-4 gap-1 w-full">{Array.from({ length: 8 }, (_, i) => <span key={i}>{box(18)}</span>)}</span>;
      case 'newsletter': return box(56, <span className="flex flex-col items-center gap-1.5">{bar(50, 4)}<span className="flex gap-1"><span className="block rounded-sm bg-white" style={{ width: 46, height: 10, border: `1px solid ${INK}44` }} /><span className="block rounded-sm" style={{ width: 20, height: 10, background: INK }} /></span></span>, '#efe9df');
      case 'marquee': return box(22, <span className="flex gap-3">{[0, 1, 2].map(i => <span key={i}>{bar(28, 3, '#fff')}</span>)}</span>, INK);
      case 'faq': return <span className="flex flex-col gap-1.5 w-full">{bar(44)}{[0, 1, 2].map(i => <span key={i} className="flex items-center justify-between pb-1" style={{ borderBottom: `1px solid ${SOFT}` }}>{bar('60%', 3, INK, 0.65)}<span className="text-[8px]" style={{ color: INK }}>+</span></span>)}</span>;
      case 'blog': return <span className="grid grid-cols-3 gap-1.5 w-full">{[0, 1, 2].map(i => <span key={i} className="flex flex-col gap-1">{box(26)}{bar('85%', 3)}{bar('50%', 2, INK, 0.4)}</span>)}</span>;
      case 'video': return box(56, <span className="flex items-center justify-center rounded-full" style={{ width: 18, height: 18, background: '#fff' }}><span style={{ width: 0, height: 0, borderLeft: `6px solid ${INK}`, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', marginLeft: 2 }} /></span>, '#4a4743');
    }
  })();
  return <span className="flex items-center bg-white rounded-md border border-bone p-2" style={{ minHeight: 78 }}>{content}</span>;
}

export function AddSectionModal({
  onPick, onClose, supportedTypes, layoutThemeId, layoutScope,
}: {
  /** Active theme id and template scope: theme-specific whole-page layouts are offered only to their own theme/template. */
  layoutThemeId?: string;
  layoutScope?: string;
  /** One section, or several in order (a whole-page layout). */
  onPick: (sections: PickedSection[]) => void;
  onClose: () => void;
  /** The active store's real theme only — when passed, the picker is filtered to the section types that theme's
   *  renderer actually has registered (a type the theme can't draw would otherwise render as nothing). */
  supportedTypes?: SectionType[];
}) {
  const [tab, setTab] = useState<'designs' | 'layouts' | 'all'>('designs');
  const [category, setCategory] = useState<PresetCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const layouts = PAGE_LAYOUTS.filter(l => (!l.themeId || l.themeId === layoutThemeId) && (l.scope === 'product' ? layoutScope === 'product' : layoutScope !== 'product'));
  const typeOk = (type: SectionType) => !supportedTypes || supportedTypes.includes(type);
  const presets = SECTION_PRESETS.filter(p => typeOk(p.type) && (category === 'all' || p.category === category)
    && (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)));
  const pickable = SECTION_META.filter(meta => !meta.hidden && typeOk(meta.type)
    && (!q || meta.label.toLowerCase().includes(q) || meta.description.toLowerCase().includes(q) || meta.type.replace(/_/g, ' ').includes(q)));

  const customDefs = customSectionsOf(layoutThemeId, DEFAULT_THEME_ID).filter(d => typeOk('theme_section')
    && (!q || d.label.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)));

  const buildPreset = (id: string): PickedSection | null => {
    const preset = SECTION_PRESETS.find(p => p.id === id);
    if (!preset || !typeOk(preset.type)) return null;
    const built = preset.build();
    return { type: preset.type, settings: { ...SECTION_META_BY_TYPE[preset.type].defaultSettings, ...built.settings }, blocks: built.blocks };
  };
  const pickPreset = (id: string) => {
    const built = buildPreset(id);
    if (built) onPick([built]);
    onClose();
  };
  const pickLayout = (ids: string[]) => {
    onPick(ids.map(buildPreset).filter((s): s is PickedSection => !!s));
    onClose();
  };
  const tabBtn = (id: 'designs' | 'layouts' | 'all', label: string) => (
    <button type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
      className="px-3 py-2 text-[13px] font-semibold bg-transparent border-0 border-b-2 cursor-pointer"
      style={{ borderColor: tab === id ? ACCENT : 'transparent', color: tab === id ? '#161412' : '#77736b' }}>{label}</button>
  );

  return (
    <Modal title="Add a section" onClose={onClose}>
      <div role="tablist" className="flex gap-2 border-b border-bone -mt-1 mb-3">
        {tabBtn('designs', 'Ready designs')}
        {tabBtn('layouts', 'Whole page layouts')}
        {tabBtn('all', 'All section types')}
      </div>
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" aria-hidden />
        <input
          type="search" value={query} onChange={e => setQuery(e.target.value)}
          aria-label="Search sections" placeholder={tab === 'designs' ? 'Search designs' : 'Search sections'}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-bone text-[13px] bg-white"
        />
      </div>

      {tab === 'designs' ? (
        <>
          <div className="flex gap-1.5 flex-wrap mb-3">
            {[{ id: 'all' as const, label: 'All' }, ...PRESET_CATEGORIES].map(c => (
              <button key={c.id} type="button" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}
                className="px-2.5 py-1 rounded-full text-[12px] font-medium cursor-pointer border"
                style={category === c.id ? { background: '#161412', color: '#fff', borderColor: '#161412' } : { background: '#fff', color: '#3b3833', borderColor: '#e9e5dc' }}>
                {c.label}
              </button>
            ))}
          </div>
          {presets.length === 0 && <p role="status" className="text-[13px] text-slate py-6 text-center">No designs match.</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {presets.map(p => (
              <button key={p.id} type="button" onClick={() => pickPreset(p.id)}
                className="flex flex-col gap-2 p-2 rounded-xl border border-bone bg-[#faf8f4] text-left cursor-pointer transition-colors hover:border-brand-orange/50">
                <Mock kind={p.mock} />
                <span className="px-0.5">
                  <span className="block text-[13px] font-bold text-charcoal">{p.name}</span>
                  <span className="block text-[11.5px] text-slate leading-snug">{p.description}</span>
                </span>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate mt-3">Designs come with sample text — change every word, image and colour after adding.</p>
        </>
      ) : tab === 'layouts' ? (
        <>
          <p className="text-[12px] text-slate mb-3">Adds a full set of sections for your kind of store, in a good order. Your current sections stay — remove or reorder anything afterwards.</p>
          <div className="flex flex-col gap-3">
            {layouts.map(l => {
              const kinds = l.presets.map(id => SECTION_PRESETS.find(p => p.id === id)).filter(p => p && typeOk(p.type));
              return (
                <button key={l.id} type="button" onClick={() => pickLayout(l.presets)}
                  className="flex flex-col gap-2 p-3 rounded-xl border border-bone bg-[#faf8f4] text-left cursor-pointer transition-colors hover:border-brand-orange/50">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-[13.5px] font-bold text-charcoal">{l.name}</span>
                    <span className="text-[11px] text-slate shrink-0">{kinds.length} sections</span>
                  </span>
                  <span className="text-[11.5px] text-slate leading-snug">{l.description}</span>
                  <span className="grid grid-cols-4 gap-1.5">{kinds.slice(0, 4).map((p, i) => <Mock key={i} kind={p!.mock} />)}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {pickable.length === 0 && customDefs.length === 0 && <p role="status" className="text-[13px] text-slate py-6 text-center">No sections match &ldquo;{query}&rdquo;.</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {customDefs.flatMap(def => [
              { def, preset: undefined as ThemeCustomSectionPreset | undefined },
              ...(def.presets ?? []).map(preset => ({ def, preset })),
            ]).map(({ def, preset }) => {
              const meta = metaForCustomDef(def);
              return (
                <button
                  key={preset ? `${def.key}:${preset.id}` : def.key}
                  onClick={() => { onPick([newCustomSection(def, preset)]); onClose(); }}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-bone bg-white text-left cursor-pointer transition-colors hover:border-brand-orange/50"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${meta.color}18` }}>
                    <meta.Icon size={18} style={{ color: meta.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-bold text-charcoal">{preset ? `${meta.label} · ${preset.name}` : meta.label}</p>
                    <p className="text-[11.5px] text-slate leading-snug mt-[2px]">{preset ? preset.description : meta.description}</p>
                  </div>
                </button>
              );
            })}
            {pickable.map(meta => (
              <button
                key={meta.type}
                onClick={() => { onPick([{ type: meta.type, settings: { ...meta.defaultSettings }, blocks: [] }]); onClose(); }}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-bone bg-white text-left cursor-pointer transition-colors hover:border-brand-orange/50"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${meta.color}18` }}>
                  <meta.Icon size={18} style={{ color: meta.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold text-charcoal">{meta.label}</p>
                  <p className="text-[11.5px] text-slate leading-snug mt-[2px]">{meta.description}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}
