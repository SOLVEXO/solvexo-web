import { useState } from 'react';
import type { Block } from '@/api/services/storefrontTypes';
import { columnCount } from '@/features/storefront/browse/gridLayout';
import { RichContent } from '@/utils/richText';
import { PreviewBlock } from '../../../previewInspector';
import { imageFit } from '../../../imageFit';
import { fashionTheme as t, type FashionColors } from '../../theme.config';
import { LinkButton, SectionShell } from '../SectionShell';
import type { SharedSectionProps } from './types';

function Column({ block, colors, ratio, center }: { block: Block; colors: FashionColors; ratio: unknown; center: boolean }) {
  const s = block.settings;
  const [errored, setErrored] = useState(false);
  const fit = imageFit(ratio, '4 / 3');
  return (
    <div className={`flex h-full flex-col gap-4 p-4 ${center ? 'items-center text-center' : 'items-start'}`} style={{ background: colors.bgAlt, borderRadius: 24 }}>
      {s.imageUrl && !errored && (
        <div className="w-full overflow-hidden" style={{ ...fit.box, background: colors.bg, borderRadius: Math.max(parseInt(t.imageRadiusPx) - 4, 0) }}>
          <img src={s.imageUrl} alt={s.heading ?? ''} loading="lazy" onError={() => setErrored(true)} style={fit.img} />
        </div>
      )}
      <div className="flex flex-col gap-2 px-1 pb-1" style={{ alignItems: center ? 'center' : 'flex-start' }}>
        {s.heading && <h3 className="m-0 text-xl font-semibold tracking-tight" style={{ fontFamily: t.fonts.display, color: colors.ink }}>{s.heading}</h3>}
        {s.body && <RichContent text={s.body} headingColor={colors.ink} headingFont={t.fonts.display} className="text-[15px] leading-[1.7]" style={{ fontFamily: t.fonts.body, color: colors.inkMuted }} />}
        <div className="mt-2"><LinkButton text={s.ctaText} link={s.ctaLink} variant="outline" /></div>
      </div>
    </div>
  );
}

export function MulticolumnSection({ section, blocks, colors }: SharedSectionProps) {
  if (blocks.length === 0) return null;
  const cols = columnCount(section.settings.columns, Math.min(blocks.length, 3));
  const center = section.settings.textAlign === 'center';
  return (
    <SectionShell colors={colors} heading={section.settings.heading} align={center ? 'center' : 'left'}>
      <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${Math.floor(960 / cols)}px), 1fr))` }}>
        {blocks.map((b, i) => (
          <PreviewBlock key={b._id ?? i} blockId={String(b._id ?? i)}>
            <Column block={b} colors={colors} ratio={section.settings.imageRatio} center={center} />
          </PreviewBlock>
        ))}
      </div>
    </SectionShell>
  );
}
