import { ArrowUpRight, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { PreviewBlock } from '../../../previewInspector';
import { copyText } from '../../../sectionCopy';
import { fashionTheme as t } from '../../theme.config';
import { SectionShell } from '../SectionShell';
import type { SharedSectionProps } from './types';

export function StoreLocationsSection({ section, blocks, colors }: SharedSectionProps) {
  if (blocks.length === 0) return null;
  const row = 'flex items-start gap-3 text-[15px] leading-relaxed no-underline';
  return (
    <SectionShell colors={colors} heading={section.settings.heading}>
      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))' }}>
        {blocks.map((b, i) => {
          const s = b.settings;
          return (
            <PreviewBlock key={b._id ?? i} blockId={String(b._id ?? i)}>
              <article className="flex h-full flex-col gap-3 p-6" style={{ background: colors.bgAlt, borderRadius: 24, fontFamily: t.fonts.body }}>
                <h3 className="m-0 mb-1 text-xl font-semibold tracking-tight" style={{ fontFamily: t.fonts.display, color: colors.ink }}>{s.name}</h3>
                {s.address && <p className={`${row} m-0 whitespace-pre-line`} style={{ color: colors.inkMuted }}><MapPin size={17} className="mt-0.5 shrink-0" aria-hidden />{s.address}</p>}
                {s.phone && <a href={`tel:${String(s.phone).replace(/[^\d+]/g, '')}`} className={row} style={{ color: colors.ink }}><Phone size={17} className="mt-0.5 shrink-0" aria-hidden />{s.phone}</a>}
                {s.email && <a href={`mailto:${s.email}`} className={row} style={{ color: colors.ink }}><Mail size={17} className="mt-0.5 shrink-0" aria-hidden />{s.email}</a>}
                {s.hours && <p className={`${row} m-0 whitespace-pre-line`} style={{ color: colors.inkMuted }}><Clock size={17} className="mt-0.5 shrink-0" aria-hidden />{s.hours}</p>}
                {s.mapUrl && (
                  <a href={s.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-2 self-start pt-2 text-sm font-semibold no-underline" style={{ color: colors.ink }}>
                    {copyText(s, 'directionsLabel', 'Get directions')}
                    <span className="grid size-7 place-items-center rounded-full" style={{ background: colors.selected, color: colors.selectedInk }}><ArrowUpRight size={14} aria-hidden /></span>
                  </a>
                )}
              </article>
            </PreviewBlock>
          );
        })}
      </div>
    </SectionShell>
  );
}
