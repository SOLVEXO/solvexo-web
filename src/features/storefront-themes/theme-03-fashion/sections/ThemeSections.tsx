/* eslint-disable react-refresh/only-export-components -- this module registers renderers as a side effect */
import { blockStyleProps } from '../../blockStyle';
import { columnCount } from '@/features/storefront/browse/gridLayout';
import { useInlineEditActive } from '../../inlineEdit';
import { newTabProps } from '@/features/storefront-themes/linkTarget';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Block, Section } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { imageFit } from '../../imageFit';
import { fashionTheme as t, type FashionColors } from '../theme.config';
import { registerFashionSection, registry } from './sectionRegistry';
import { convertForeignSection, isForeignThemeKey } from '../../storeSections/foreignSection';
import { SectionShell } from './SectionShell';
import { renderStoreSection } from '../../storeSections/renderStoreSection';
import { ts } from '@/utils/tStatic';

/**
 * Sections only Maison has. Each is declared in `theme.manifest.ts` (`customSections`) and stored as a `theme_section`
 * (`settings.sectionKey`); this file maps a key to its renderer. Add a section: declare it there, add a renderer here.
 */
type CustomRenderer = (section: Section, blocks: Block[], colors: FashionColors) => ReactNode;
const custom = new Map<string, CustomRenderer>();

// a key without code here is a section the seller built in the Section builder (`my.*`): drawn from its layout
registerFashionSection('theme_section', (section, blocks, colors, dynamic) => {
  const key = String(section.settings.sectionKey);
  const own = custom.get(key)?.(section, blocks, colors);
  if (own !== undefined) return own;
  // another theme's section: shown through this theme's own matching section instead of being dropped
  if (isForeignThemeKey(key, 'maison.')) {
    const c = convertForeignSection(section, blocks);
    return c ? registry.get(c.section.type)?.(c.section, c.blocks, colors, dynamic) ?? null : null;
  }
  return renderStoreSection(section, blocks, colors, SectionShell);
});

const text = (v: unknown) => (typeof v === 'string' ? v : '');

// ── Lookbook ────────────────────────────────────────────────────────────────────────────
custom.set('maison.lookbook', (section, blocks, colors) => {
  // a look without a photo is a placeholder tile in the editor (LookTile hides it on the live store)
  const looks = blocks.filter(b => b.type === 'theme_block');
  if (looks.length === 0) return null;
  const cols = columnCount(section.settings.columns, 3);
  const ratio = imageFit(section.settings.imageRatio, '3 / 4');
  return (
    <SectionShell colors={colors} heading={text(section.settings.heading)} eyebrow={text(section.settings.eyebrow) || undefined}>
      {text(section.settings.intro) && <p className="m-0 mb-8 max-w-[640px] text-base leading-relaxed" style={{ color: colors.inkMuted, fontFamily: t.fonts.body }}>{text(section.settings.intro)}</p>}
      <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${Math.floor(960 / cols)}px), 1fr))` }}>
        {looks.map((b, i) => <LookTile key={b._id ?? i} block={b} fit={ratio} colors={colors} />)}
      </div>
    </SectionShell>
  );
});

function LookTile({ block, fit, colors }: { block: Block; fit: ReturnType<typeof imageFit>; colors: FashionColors }) {
  const { resolveLink } = useStorefront();
  const link = block.settings.link ? resolveLink(block.settings.link) : null;
  const title = text(block.settings.title);
  const bs = blockStyleProps(block.settings.style);
  const editing = useInlineEditActive();
  const image = text(block.settings.imageUrl);
  if (!image && !editing) return null;
  const tile = (
    <>
      <div className="sx-media overflow-hidden" style={{ ...fit.box, borderRadius: t.imageRadiusPx, background: colors.bgAlt }}>
        {image && <img src={image} alt={title} loading="lazy" className="transition-transform duration-500 hover:scale-105" style={fit.img} />}
      </div>
      {(title || text(block.settings.caption)) && (
        <div className="pt-3">
          {title && <p className="m-0 text-base font-semibold" style={{ fontFamily: t.fonts.display, color: colors.ink }}>{title}</p>}
          {text(block.settings.caption) && <p className="m-0 mt-1 text-sm" style={{ color: colors.inkMuted, fontFamily: t.fonts.body }}>{text(block.settings.caption)}</p>}
        </div>
      )}
    </>
  );
  if (link?.to) return <Link to={link.to} {...newTabProps(link)} className={`block no-underline ${bs.className ?? ''}`} style={{ color: colors.ink, ...bs.style }}>{tile}</Link>;
  if (link?.href) return <a href={link.href} {...newTabProps(link)} className={`block no-underline ${bs.className ?? ''}`} style={{ color: colors.ink, ...bs.style }}>{tile}</a>;
  return <div className={bs.className} style={bs.style}>{tile}</div>;
}

// ── Size guide ──────────────────────────────────────────────────────────────────────────
/** `rows` is one size per line: "label | chest | waist | hips" — the first line is the header. */
function parseRows(raw: string): string[][] {
  return raw.split('\n').map(line => line.split('|').map(c => c.trim())).filter(r => r.some(Boolean)).slice(0, 30);
}

function SizeGuide({ section, colors }: { section: Section; colors: FashionColors }) {
  const rows = parseRows(text(section.settings.rows));
  const [unit, setUnit] = useState<'cm' | 'in'>(section.settings.defaultUnit === 'in' ? 'in' : 'cm');
  if (rows.length < 2) return null;
  const [head, ...body] = rows;
  const show = (cell: string) => {
    const n = Number(cell.replace(',', '.'));
    if (unit === 'cm' || !Number.isFinite(n) || cell === '') return cell;
    return (n / 2.54).toFixed(1);
  };
  return (
    <SectionShell colors={colors} heading={text(section.settings.heading)} align="center">
      <div className="mx-auto max-w-[760px]">
        {section.settings.showUnitToggle !== false && (
          <div className="mb-4 flex justify-center gap-2" role="group" aria-label={ts('pg.measurement_unit', 'Measurement unit')}>
            {(['cm', 'in'] as const).map(u => (
              <button key={u} type="button" aria-pressed={unit === u} onClick={() => setUnit(u)} className="cursor-pointer px-4 py-1.5 text-sm"
                style={{ borderRadius: t.buttonRadiusPx, border: `1px solid ${unit === u ? colors.selected : colors.border}`, background: unit === u ? colors.selected : 'transparent', color: unit === u ? colors.selectedInk : colors.ink }}>{u}</button>
            ))}
          </div>
        )}
        <div className="overflow-x-auto" style={{ border: `1px solid ${colors.border}`, borderRadius: 16 }}>
          <table className="w-full border-collapse text-sm" style={{ fontFamily: t.fonts.body, color: colors.ink }}>
            <thead><tr style={{ background: colors.bgAlt }}>{head.map((h, i) => <th key={i} scope="col" className="px-4 py-3 text-left font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri} style={{ borderTop: `1px solid ${colors.border}` }}>
                  {head.map((_, ci) => ci === 0 ? <th key={ci} scope="row" className="px-4 py-3 text-left font-medium">{r[ci]}</th> : <td key={ci} className="px-4 py-3">{show(r[ci] ?? '')}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {text(section.settings.note) && <p className="m-0 mt-4 text-center text-sm" style={{ color: colors.inkMuted }}>{text(section.settings.note)}</p>}
      </div>
    </SectionShell>
  );
}
custom.set('maison.size_guide', (section, _blocks, colors) => <SizeGuide section={section} colors={colors} />);
