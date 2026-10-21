/* eslint-disable react-refresh/only-export-components -- this module registers renderers as a side effect */
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Block, Section } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { imageFit } from '../../imageFit';
import { fashionTheme as t, type FashionColors } from '../theme.config';
import { registerFashionSection } from './sectionRegistry';
import { SectionShell } from './SectionShell';
import { ts } from '@/utils/tStatic';

/**
 * Sections only Maison has. Each is declared in `theme.manifest.ts` (`customSections`) and stored as a `theme_section`
 * (`settings.sectionKey`); this file maps a key to its renderer. Add a section: declare it there, add a renderer here.
 */
type CustomRenderer = (section: Section, blocks: Block[], colors: FashionColors) => ReactNode;
const custom = new Map<string, CustomRenderer>();

registerFashionSection('theme_section', (section, blocks, colors) => custom.get(String(section.settings.sectionKey))?.(section, blocks, colors) ?? null);

const text = (v: unknown) => (typeof v === 'string' ? v : '');

// ── Lookbook ────────────────────────────────────────────────────────────────────────────
custom.set('maison.lookbook', (section, blocks, colors) => {
  const looks = blocks.filter(b => b.type === 'theme_block' && text(b.settings.imageUrl));
  if (looks.length === 0) return null;
  const cols = section.settings.columns === 2 ? 2 : 3;
  const ratio = imageFit(section.settings.imageRatio, '3 / 4');
  return (
    <SectionShell colors={colors} heading={text(section.settings.heading)} eyebrow={text(section.settings.eyebrow) || undefined}>
      {text(section.settings.intro) && <p className="m-0 mb-8 max-w-[640px] text-base leading-relaxed" style={{ color: colors.inkMuted, fontFamily: t.fonts.body }}>{text(section.settings.intro)}</p>}
      <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${cols === 3 ? 'lg:grid-cols-3' : ''}`}>
        {looks.map((b, i) => <LookTile key={b._id ?? i} block={b} fit={ratio} colors={colors} />)}
      </div>
    </SectionShell>
  );
});

function LookTile({ block, fit, colors }: { block: Block; fit: ReturnType<typeof imageFit>; colors: FashionColors }) {
  const { resolveLink } = useStorefront();
  const link = block.settings.link ? resolveLink(block.settings.link) : null;
  const title = text(block.settings.title);
  const tile = (
    <>
      <div className="overflow-hidden" style={{ ...fit.box, borderRadius: t.imageRadiusPx, background: colors.bgAlt }}>
        <img src={text(block.settings.imageUrl)} alt={title} loading="lazy" className="transition-transform duration-500 hover:scale-105" style={fit.img} />
      </div>
      {(title || text(block.settings.caption)) && (
        <div className="pt-3">
          {title && <p className="m-0 text-base font-semibold" style={{ fontFamily: t.fonts.display, color: colors.ink }}>{title}</p>}
          {text(block.settings.caption) && <p className="m-0 mt-1 text-sm" style={{ color: colors.inkMuted, fontFamily: t.fonts.body }}>{text(block.settings.caption)}</p>}
        </div>
      )}
    </>
  );
  if (link?.to) return <Link to={link.to} className="block no-underline" style={{ color: colors.ink }}>{tile}</Link>;
  if (link?.href) return <a href={link.href} className="block no-underline" style={{ color: colors.ink }}>{tile}</a>;
  return <div>{tile}</div>;
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
                style={{ borderRadius: t.buttonRadiusPx, border: `1px solid ${unit === u ? colors.ink : colors.border}`, background: unit === u ? colors.ink : 'transparent', color: unit === u ? colors.bg : colors.ink }}>{u}</button>
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
